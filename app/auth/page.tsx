"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, X } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";

// Marcar como dinámico para evitar prerenderización
export const dynamic = 'force-dynamic';

function AuthPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inicializar cliente solo en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient());
    }
  }, []);

  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;
  const lolaInicioUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-inicio_yndk2t`;

  // Verificar si el usuario ya está autenticado al cargar la página
  const checkAuth = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking auth:", error);
        setCheckingAuth(false);
        return;
      }
      
      if (session) {
        // Usuario autenticado, redirigir al dashboard
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        router.push(redirectTo);
      } else {
        // No hay sesión, mostrar formulario de login
        setCheckingAuth(false);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setCheckingAuth(false);
    }
  }, [router, searchParams, supabase]);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    // Timeout de seguridad para evitar que se quede cargando indefinidamente
    const timeout = setTimeout(() => {
      if (isMounted) {
        setCheckingAuth(false);
      }
    }, 3000);

    checkAuth().finally(() => {
      clearTimeout(timeout);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [checkAuth, supabase]);

  // Mostrar loading mientras se verifica autenticación
  if (checkingAuth) {
    return <LoadingState message="Verificando sesión..." fullScreen />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validación básica del formulario
    if (!email || !email.includes("@")) {
      setErrorMessage("Por favor ingresa un email válido.");
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                full_name: fullName || email.split("@")[0],
                role: "student",
              },
            },
        });
        
        if (error) {
          console.error("Signup error:", error);
          // Mensajes genéricos y seguros para el usuario
          // No confirmar si el email existe o no (prevenir user enumeration)
          if (error.status === 422 || error.message.includes("already registered") || error.message.includes("already exists") || error.message.includes("User already registered")) {
            // Mensaje genérico que no confirma si el email existe
            setErrorMessage("No se pudo completar el registro. Si ya tienes una cuenta, intenta iniciar sesión.");
            setIsSignUp(false);
          } else if (error.message.includes("password") || error.message.includes("Password") || error.message.includes("Password should be")) {
            setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
          } else if (error.message.includes("email")) {
            setErrorMessage("Por favor ingresa un email válido.");
          } else {
            // Mensaje genérico para cualquier otro error
            setErrorMessage(`No se pudo crear la cuenta: ${error.message || "Error desconocido"}. Por favor intenta de nuevo.`);
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (data.session) {
            router.push("/dashboard");
          } else {
            setSuccessMessage("✅ Cuenta creada exitosamente. Por favor inicia sesión.");
            setIsSignUp(false);
            setLoading(false);
          }
        } else {
          setErrorMessage("Error: No se pudo crear el usuario. Por favor intenta de nuevo.");
          setLoading(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        
        if (error) {
          console.error("Login error:", error);
          // Mensajes genéricos y seguros para el usuario
          // No revelar si el email existe o no (prevenir user enumeration)
          if (error.status === 400 || error.message.includes("Invalid login") || error.message.includes("Invalid credentials") || error.message.includes("Invalid") || error.message.includes("Email rate limit exceeded")) {
            setErrorMessage("Email o contraseña incorrectos. Verifica tus credenciales e intenta de nuevo.");
          } else if (error.message.includes("Email not confirmed") || error.message.includes("not confirmed")) {
            setErrorMessage("Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.");
          } else {
            // Mensaje genérico para cualquier otro error
            setErrorMessage(`No se pudo iniciar sesión: ${error.message || "Error desconocido"}. Por favor intenta de nuevo.`);
          }
          setLoading(false);
          return;
        }
        
        if (data.session) {
          router.push("/dashboard");
        } else {
          setErrorMessage("No se pudo crear la sesión. Por favor intenta de nuevo.");
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      // Mensaje genérico y seguro para el usuario
      setErrorMessage(`Ocurrió un error inesperado: ${error.message || "Error desconocido"}. Por favor intenta de nuevo más tarde.`);
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 border-b border-blue-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center relative h-12 md:h-14 w-auto">
              <Image
                src={proofLogoUrl}
                alt="Proof Logo"
                width={56}
                height={56}
                className="h-12 md:h-14 w-auto object-contain"
                unoptimized
              />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Proof
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Where Execution Speaks</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 items-center">
            {/* Left Side - Auth Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0 order-2 lg:order-1">
              <Card className="border-2 border-blue-100/50 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
                <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg pb-4 pt-6">
                  <div className="text-center mb-4">
                    <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                      {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-700">
                      {isSignUp
                        ? "Únete a Proof y transforma tu idea en realidad"
                        : "Bienvenido de vuelta a Proof"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {/* Error Message */}
                    {errorMessage && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-red-800 whitespace-pre-line">{errorMessage}</p>
                        </div>
                        <button
                          onClick={() => setErrorMessage(null)}
                          className="text-red-600 hover:text-red-800 flex-shrink-0"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-green-800 whitespace-pre-line">{successMessage}</p>
                        </div>
                        <button
                          onClick={() => setSuccessMessage(null)}
                          className="text-green-600 hover:text-green-800 flex-shrink-0"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage(null);
                        }}
                        required
                        placeholder="tu@email.com"
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    {isSignUp && (
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-700 font-semibold">Nombre Completo (opcional)</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Juan Pérez"
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    )}
                    
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-semibold">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                      {isSignUp && (
                        <p className="text-xs text-gray-600">
                          Mínimo 6 caracteres
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold text-lg py-6 shadow-xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-[1.02] group"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Cargando...
                        </span>
                      ) : (
                        <>
                          <span className="relative z-10">
                            {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        </>
                      )}
                    </Button>
                  </form>

                    <div className="text-center text-sm space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors block"
                    >
                      {isSignUp
                        ? "¿Ya tienes cuenta? Inicia sesión"
                        : "¿No tienes cuenta? Regístrate"}
                    </button>
                    {!isSignUp && (
                      <Link href="/auth/reset-password" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors block">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Lola Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative w-full max-w-lg mx-auto">
                {/* Decorative background elements */}
                <div className="absolute -top-4 -left-4 md:-top-8 md:-left-8 w-20 h-20 md:w-32 md:h-32 border-2 md:border-4 border-blue-300/40 rounded-full opacity-50"></div>
                <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-16 h-16 md:w-24 md:h-24 border-2 md:border-3 border-cyan-300/40 rounded-full opacity-60"></div>
                
                {/* Geometric shapes */}
                <div className="absolute top-0 -right-4 md:-right-8 w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-xl"></div>
                <div className="absolute bottom-4 -left-3 md:bottom-8 md:-left-6 w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-orange-400/25 to-yellow-400/25 rounded-lg rotate-12 opacity-70"></div>
                <div className="absolute top-1/2 -left-4 md:-left-8 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-lg"></div>
                <div className="absolute -bottom-3 right-2 md:-bottom-6 md:right-4 w-12 h-12 md:w-18 md:h-18 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 rounded-full"></div>
                
                {/* Lola Image with glow effect */}
                <div className="relative z-10 w-full transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-transparent rounded-3xl blur-2xl"></div>
                  <Image
                    src={lolaInicioUrl}
                    alt="Lola saludando - Bienvenido a Proof"
                    width={600}
                    height={600}
                    className="w-full h-auto drop-shadow-2xl relative z-10"
                    style={{
                      filter: 'drop-shadow(0 25px 50px rgba(59, 130, 246, 0.25))',
                    }}
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando..." fullScreen />}>
      <AuthPageContent />
    </Suspense>
  );
}

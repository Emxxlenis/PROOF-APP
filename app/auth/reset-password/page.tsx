"use client";

// Marcar como dinámico para evitar prerenderización
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, X, Loader2, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  // Inicializar cliente solo en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient());
    }
  }, []);

  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        // Para prevenir user enumeration, siempre mostrar el mismo mensaje
        // No revelar si el email existe o no en el sistema
        // Si el email existe, se enviará el enlace; si no, no se enviará pero el usuario no lo sabrá
        setSuccess(true);
        return;
      }

      setSuccess(true);
    } catch (error: any) {
      // Mensaje genérico y seguro para el usuario
      setError("Ocurrió un error inesperado. Por favor intenta de nuevo más tarde.");
    } finally {
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
              <img
                src={proofLogoUrl}
                alt="Proof Logo"
                className="h-12 md:h-14 w-auto object-contain"
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
            <Link href="/auth">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md border-2 border-blue-100/50 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg pb-4 pt-6">
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full">
                      <KeyRound className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                    Recuperar Contraseña
                  </CardTitle>
                  <CardDescription className="text-base text-gray-700">
                    {success 
                      ? "Revisa tu correo electrónico"
                      : "Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {success ? (
                  <div className="space-y-6">
                    {/* Success Message */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-green-800 mb-2">
                        ¡Email enviado exitosamente!
                      </h3>
                      <p className="text-sm text-green-700 mb-4">
                        Hemos enviado un enlace de recuperación a <strong className="font-semibold">{email}</strong>.
                        Por favor revisa tu bandeja de entrada y sigue las instrucciones.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-green-600 bg-green-100/50 rounded-lg p-3">
                        <Mail className="h-4 w-4" />
                        <p className="text-xs">
                          Si no recibes el email, verifica tu carpeta de spam o intenta de nuevo.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => {
                          setSuccess(false);
                          setEmail("");
                          setError(null);
                        }}
                        variant="outline"
                        className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar otro email
                      </Button>
                      <Link href="/auth" className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold shadow-xl hover:shadow-orange-500/50 transition-all duration-300">
                          Volver al login
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                        <button
                          onClick={() => setError(null)}
                          className="text-red-600 hover:text-red-800 flex-shrink-0"
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
                          setError(null);
                        }}
                        required
                        placeholder="tu@email.com"
                        disabled={loading}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                      <p className="text-xs text-gray-600">
                        Te enviaremos un enlace seguro para restablecer tu contraseña
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold text-lg py-6 shadow-xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-[1.02] group"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        <>
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <Mail className="h-5 w-5" />
                            Enviar enlace de recuperación
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        </>
                      )}
                    </Button>

                    <div className="text-center text-sm pt-2">
                      <Link href="/auth" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
                        Volver al login
                      </Link>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

// Marcar como dinámico para evitar prerenderización
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";

function UpdatePasswordPageContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Verificar que el usuario tiene una sesión válida para cambiar contraseña
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Si no hay sesión, puede ser que el token expiró
        setError("El enlace de recuperación ha expirado o no es válido. Por favor solicita uno nuevo.");
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validaciones
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Update password error:", error);
        setError(error.message);
        return;
      }

      setSuccess(true);
      
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-primary">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/auth">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
          </div>
          <CardDescription>
            Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">Contraseña actualizada</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Tu contraseña ha sido actualizada exitosamente. Serás redirigido al dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth" className="text-primary hover:underline">
                  Volver al login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando..." fullScreen />}>
      <UpdatePasswordPageContent />
    </Suspense>
  );
}
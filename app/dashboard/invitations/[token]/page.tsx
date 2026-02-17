"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Mail, Users, Rocket, Crown, UserCheck, User } from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

const ROLES = [
  { value: "founder", label: "Fundador", icon: Crown },
  { value: "co_founder", label: "Cofundador", icon: UserCheck },
  { value: "team_member", label: "Miembro del Equipo", icon: User },
];

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [startup, setStartup] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión para ver esta invitación");
        return;
      }

      // Buscar invitación pendiente para el email del usuario
      const { data: userData } = await supabase
        .from("users")
        .select("email")
        .eq("id", session.user.id)
        .single();

      if (!userData) {
        setError("Usuario no encontrado");
        return;
      }

      const { data: invitationData, error: inviteError } = await supabase
        .from("team_invitations")
        .select(`
          *,
          startup:startups!team_invitations_startup_id_fkey (
            id,
            name,
            description,
            logo_url
          )
        `)
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (inviteError || !invitationData) {
        setError("Invitación no encontrada o ya procesada");
        return;
      }

      // Verificar que el email coincida
      if (invitationData.email.toLowerCase() !== userData.email.toLowerCase()) {
        setError("Esta invitación no es para tu cuenta");
        return;
      }

      // Verificar que no haya expirado
      if (new Date(invitationData.expires_at) < new Date()) {
        setError("Esta invitación ha expirado");
        return;
      }

      setInvitation(invitationData);
      setStartup(invitationData.startup);
    } catch (error: any) {
      console.error("Error loading invitation:", error);
      setError(error.message || "Error al cargar la invitación");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const response = await fetch(`/api/projects/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al aceptar la invitación");
        return;
      }

      setSuccess("Invitación aceptada exitosamente");
      setTimeout(() => {
        router.push(`/dashboard/projects`);
      }, 2000);
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      setError(error.message || "Error al aceptar la invitación");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("¿Estás seguro de que quieres rechazar esta invitación?")) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const response = await fetch(`/api/projects/invitations/${token}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al rechazar la invitación");
        return;
      }

      setSuccess("Invitación rechazada");
      setTimeout(() => {
        router.push(`/dashboard/projects`);
      }, 2000);
    } catch (error: any) {
      console.error("Error rejecting invitation:", error);
      setError(error.message || "Error al rechazar la invitación");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando invitación..." />;
  }

  if (error && !invitation) {
    return (
      <EmptyState
        title="Error"
        message={error}
        action={
          <Link href="/dashboard/projects">
            <Button variant="outline" className="w-full">
              Volver a Proyectos
            </Button>
          </Link>
        }
        variant="error"
      />
    );
  }

  const RoleIcon = ROLES.find((r) => r.value === invitation?.role)?.icon || User;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-purple-600">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Invitación al Equipo</CardTitle>
              <CardDescription>
                Has sido invitado a unirte a un proyecto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-500 text-green-700 dark:text-green-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <p>{success}</p>
              </div>
            </div>
          )}

          {invitation && startup && (
            <>
              {/* Información del Proyecto */}
              <div className="border-2 rounded-lg p-6 bg-gradient-to-br from-primary/5 to-purple-600/5">
                <div className="flex items-start gap-4">
                  {startup.logo_url ? (
                    <img
                      src={startup.logo_url}
                      alt={startup.name}
                      className="w-20 h-20 rounded-lg object-cover border-2"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <Rocket className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{startup.name}</h3>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {startup.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <RoleIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Rol: {ROLES.find((r) => r.value === invitation.role)?.label || invitation.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la Invitación */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Invitado por:</strong> {invitation.email}
                </p>
                <p>
                  <strong className="text-foreground">Fecha de invitación:</strong>{" "}
                  {new Date(invitation.created_at).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p>
                  <strong className="text-foreground">Expira:</strong>{" "}
                  {new Date(invitation.expires_at).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Acciones */}
              {!success && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleAccept}
                    disabled={processing}
                    className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Aceptar Invitación
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={processing}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 mr-2" />
                        Rechazar
                      </>
                    )}
                  </Button>
                </div>
              )}

              {success && (
                <Link href="/dashboard/projects">
                  <Button className="w-full" size="lg">
                    Ir a Mis Proyectos
                  </Button>
                </Link>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



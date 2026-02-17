"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Loader2, 
  X, 
  XCircle,
  ArrowLeft,
  Crown,
  UserCheck,
  User,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ROLES = [
  { value: "founder", label: "Fundador", icon: Crown },
  { value: "co_founder", label: "Cofundador", icon: UserCheck },
  { value: "team_member", label: "Miembro del Equipo", icon: User },
];

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [deletingInvitation, setDeletingInvitation] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false);
  const [showDeleteInvitationDialog, setShowDeleteInvitationDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null);
  
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "team_member",
  });

  useEffect(() => {
    loadTeam();
  }, [projectId]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/team`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al cargar el equipo");
        return;
      }

      setMembers(data.members || []);
      setInvitations(data.invitations || []);
      setIsCreator(data.isCreator || false);
    } catch (error: any) {
      console.error("Error loading team:", error);
      setError(error.message || "Error al cargar el equipo");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(inviteData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al enviar la invitación");
        return;
      }

      // Mostrar mensajes en el frontend
      if (data.warning) {
        setWarning(data.warning);
        setSuccess(null);
      } else {
        setSuccess("Invitación enviada exitosamente");
      }

      // Recargar equipo
      await loadTeam();
      setInviteData({ email: "", role: "team_member" });
      setShowInviteForm(false);
      
      // Limpiar mensajes después de 5 segundos
      setTimeout(() => {
        setSuccess(null);
        setWarning(null);
      }, 5000);
    } catch (error: any) {
      console.error("Error inviting:", error);
      setError(error.message || "Error al enviar la invitación");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMemberClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setShowDeleteMemberDialog(true);
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;

    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        setShowDeleteMemberDialog(false);
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/team`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ memberId: memberToDelete }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al eliminar miembro");
        setShowDeleteMemberDialog(false);
        return;
      }

      setSuccess("Miembro eliminado exitosamente");
      setShowDeleteMemberDialog(false);
      setMemberToDelete(null);
      
      // Recargar equipo
      await loadTeam();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("Error removing member:", error);
      setError(error.message || "Error al eliminar miembro");
      setShowDeleteMemberDialog(false);
    }
  };

  const handleDeleteInvitationClick = (invitationId: string) => {
    setInvitationToDelete(invitationId);
    setShowDeleteInvitationDialog(true);
  };

  const handleDeleteInvitation = async () => {
    if (!invitationToDelete) return;

    setDeletingInvitation(invitationToDelete);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        setShowDeleteInvitationDialog(false);
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/invitations/${invitationToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al eliminar invitación");
        setShowDeleteInvitationDialog(false);
        return;
      }

      setSuccess("Invitación eliminada exitosamente");
      setShowDeleteInvitationDialog(false);
      setInvitationToDelete(null);
      
      // Recargar equipo
      await loadTeam();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error("Error deleting invitation:", error);
      setError(error.message || "Error al eliminar invitación");
      setShowDeleteInvitationDialog(false);
    } finally {
      setDeletingInvitation(null);
    }
  };

  // Calcular estadísticas
  const totalMembers = members.length;
  const pendingInvitations = invitations.length;
  const founders = members.filter(m => m.role === "founder").length;
  const coFounders = members.filter(m => m.role === "co_founder").length;
  const teamMembers = members.filter(m => m.role === "team_member").length;

  if (loading) {
    return <LoadingState message="Cargando equipo..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={`/dashboard/projects/${projectId}/edit`}>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl h-8 sm:h-9 px-2 sm:px-3">
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1 sm:ml-2">Volver</span>
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="truncate">Equipo del Proyecto</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Gestiona los miembros y invitaciones de tu equipo
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Card className="border-red-200 bg-red-50 rounded-xl shadow-sm">
            <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
              <div className="flex items-start sm:items-center gap-2">
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="font-medium text-red-800 text-xs sm:text-sm break-words flex-1">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
                  onClick={() => setError(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-blue-100 bg-white rounded-xl shadow-sm">
            <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
              <div className="flex items-start sm:items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="font-medium text-green-800 text-xs sm:text-sm break-words flex-1">{success}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 flex-shrink-0"
                  onClick={() => setSuccess(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {warning && (
          <Card className="border-amber-200 bg-amber-50 rounded-xl shadow-sm">
            <CardContent className="py-3 sm:py-4 px-3 sm:px-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-amber-100 border-2 border-amber-300/50 flex-shrink-0">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-base mb-1 text-amber-900">
                    ⚠️ Aviso Importante
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-amber-800 break-words">
                    {warning.replace("⚠️ IMPORTANTE: ", "")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-amber-700 hover:text-amber-800 hover:bg-amber-100 flex-shrink-0"
                  onClick={() => setWarning(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Total Miembros</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{totalMembers}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-blue-50 flex-shrink-0 ml-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Invitaciones</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{pendingInvitations}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-cyan-50 flex-shrink-0 ml-2">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Fundadores</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{founders + coFounders}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-emerald-50 flex-shrink-0 ml-2">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mensaje de funcionalidad en desarrollo */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-2xl shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex-shrink-0">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Funcionalidad en Desarrollo
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  La funcionalidad de invitación de miembros al equipo está en desarrollo. 
                  Muy pronto habrán nuevas funcionalidades para gestionar tu equipo de manera más completa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Miembros del equipo */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg text-gray-800">Miembros del Equipo</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {totalMembers} {totalMembers === 1 ? 'miembro' : 'miembros'} en el equipo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {members.length === 0 ? (
              <EmptyState
                title="No hay miembros en el equipo aún"
                message="Invita miembros para colaborar en tu proyecto"
                fullScreen={false}
              />
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {members.map((member) => {
                  const RoleIcon = ROLES.find((r) => r.value === member.role)?.icon || User;
                  const isFounder = member.role === "founder";
                  return (
                    <Card key={member.id} className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            {member.user?.avatar_url ? (
                              <img
                                src={member.user.avatar_url}
                                alt={member.user.full_name || member.user.email}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-blue-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-base sm:text-lg border-2 border-blue-200 flex-shrink-0">
                                {(member.user?.full_name || member.user?.email || "U")[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base truncate">
                                {member.user?.full_name || member.user?.email || "Usuario"}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <RoleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                <Badge className={`text-xs ${
                                  member.role === "founder" 
                                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                    : member.role === "co_founder"
                                    ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                }`}>
                                  {ROLES.find((r) => r.value === member.role)?.label || member.role}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {isCreator && !isFounder && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMemberClick(member.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invitaciones pendientes */}
        {isCreator && (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-gray-800">Invitaciones Pendientes</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {pendingInvitations} {pendingInvitations === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {invitations.length === 0 ? (
                <EmptyState
                  title="No hay invitaciones pendientes"
                  message="Las invitaciones que envíes aparecerán aquí"
                  fullScreen={false}
                />
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {invitations.map((invitation) => {
                    const RoleIcon = ROLES.find((r) => r.value === invitation.role)?.icon || User;
                    const isDeleting = deletingInvitation === invitation.id;
                    return (
                      <Card key={invitation.id} className="border-blue-100 bg-blue-50/30 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center border-2 border-blue-200 flex-shrink-0">
                                <Mail className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base truncate">{invitation.email}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <RoleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                                    {ROLES.find((r) => r.value === invitation.role)?.label || invitation.role}
                                  </Badge>
                                  <span className="text-xs text-gray-500 truncate">
                                    Enviada {new Date(invitation.created_at).toLocaleDateString('es-CO', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">Pendiente</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteInvitationClick(invitation.id)}
                                disabled={isDeleting}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-8 sm:h-9 w-8 sm:w-9 p-0"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog para confirmar eliminación de miembro */}
        <AlertDialog open={showDeleteMemberDialog} onOpenChange={setShowDeleteMemberDialog}>
          <AlertDialogContent className="bg-white border-2 border-red-200/60 shadow-2xl max-w-[95vw] sm:max-w-md rounded-2xl mx-4 sm:mx-0">
            <AlertDialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-200/80 border border-red-300/50 shadow-sm flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <AlertDialogTitle className="text-lg sm:text-xl font-bold text-gray-800">
                  ¿Eliminar miembro del equipo?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="text-sm sm:text-base space-y-3 pt-2 px-4 sm:px-0">
                  <p className="text-gray-700 leading-relaxed break-words">
                    Esta acción eliminará permanentemente a este miembro del equipo. 
                    El usuario perderá acceso al proyecto y no podrá ver ni editar su contenido.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-4 px-4 sm:px-6 pb-4 sm:pb-6 flex-col sm:flex-row">
              <AlertDialogCancel
                onClick={() => setMemberToDelete(null)}
                className="w-full sm:w-auto border-2 border-gray-300/60 hover:border-gray-400/80 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm order-2 sm:order-1"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 border-2 border-red-400/30 hover:border-red-500/50 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm order-1 sm:order-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <X className="h-4 w-4 drop-shadow-sm" />
                  <span className="drop-shadow-sm">Eliminar</span>
                </span>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog para confirmar eliminación de invitación */}
        <AlertDialog open={showDeleteInvitationDialog} onOpenChange={setShowDeleteInvitationDialog}>
          <AlertDialogContent className="bg-white border-2 border-red-200/60 shadow-2xl max-w-[95vw] sm:max-w-md rounded-2xl mx-4 sm:mx-0">
            <AlertDialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-200/80 border border-red-300/50 shadow-sm flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <AlertDialogTitle className="text-lg sm:text-xl font-bold text-gray-800">
                  ¿Eliminar invitación?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="text-sm sm:text-base space-y-3 pt-2 px-4 sm:px-0">
                  <p className="text-gray-700 leading-relaxed break-words">
                    Esta acción cancelará permanentemente esta invitación. 
                    El usuario invitado no podrá aceptarla después de eliminarla.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-4 px-4 sm:px-6 pb-4 sm:pb-6 flex-col sm:flex-row">
              <AlertDialogCancel
                onClick={() => setInvitationToDelete(null)}
                className="w-full sm:w-auto border-2 border-gray-300/60 hover:border-gray-400/80 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm order-2 sm:order-1"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteInvitation}
                className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 border-2 border-red-400/30 hover:border-red-500/50 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm order-1 sm:order-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <X className="h-4 w-4 drop-shadow-sm" />
                  <span className="drop-shadow-sm">Eliminar</span>
                </span>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

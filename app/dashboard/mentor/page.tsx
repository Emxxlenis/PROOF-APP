"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  MessageSquare, 
  AlertCircle,
  Calendar,
  Users,
  Loader2,
  Sparkles,
  ExternalLink,
  Rocket,
  CheckCircle2,
  Search,
  RefreshCw,
  UserPlus,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";

const STAGE_LABELS: Record<string, string> = {
  ideation: "Ideación",
  validation: "Validación",
  mvp: "MVP",
  first_sale: "Primera Venta",
  growth: "Crecimiento",
};

const STAGE_COLORS: Record<string, string> = {
  ideation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  validation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  mvp: "bg-green-500/10 text-green-600 border-green-500/20",
  first_sale: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  growth: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export default function MentorDashboardPage() {
  const [inbox, setInbox] = useState<any>(null);
  const [availableMentors, setAvailableMentors] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  // Cloudinary URLs
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const lolaMentorUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-dashboard_muuhd2`;
  const lolaMentorsUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-dashboard_muuhd2`;

  const loadUserRole = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (userData) {
        setUserRole(userData.role);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const loadInbox = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/mentor/inbox", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInbox(data);
      }
    } catch (error) {
      console.error("Error loading inbox:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const loadAvailableMentors = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/mentors/available", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableMentors(data.mentors || []);
      }
    } catch (error) {
      console.error("Error loading available mentors:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadUserRole();
  }, [loadUserRole]);

  useEffect(() => {
    if (userRole === "mentor" || userRole === "admin") {
      loadInbox();
    } else if (userRole === "student") {
      loadAvailableMentors();
    }
  }, [userRole, loadInbox, loadAvailableMentors]);

  if (loading) {
    return <LoadingState message="Cargando..." />;
  }

  // If user is a student/founder, show available mentors
  if (userRole === "student") {
    return <FounderMentorshipView 
      mentors={availableMentors} 
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onRefresh={loadAvailableMentors}
      lolaMentorsUrl={lolaMentorUrl}
    />;
  }

  // If user is a mentor, show mentor dashboard
  const data = inbox || {
    assignments: [],
    alerts: [],
    sessions: [],
    recommendations: [],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              Dashboard de Mentor
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Gestiona tus mentorados y sesiones
            </p>
          </div>
        </div>

        {/* Hero Card with Lola */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl" />
                <img
                  src={lolaMentorUrl}
                  alt="Lola Mentor"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg"
                />
              </div>
              <div className="text-white text-center sm:text-left flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  ¡Guía el futuro de los emprendedores!
                </h2>
                <p className="text-white/90 text-xs sm:text-sm max-w-xl">
                  Ayuda a tus mentorados a alcanzar sus objetivos, haz seguimiento de su progreso 
                  y comparte tu experiencia para impulsar el éxito de sus startups.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Mentorados Activos</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{data.assignments.length}</p>
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
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Alertas Pendientes</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{data.alerts.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-orange-50 flex-shrink-0 ml-2">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Sesiones Programadas</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{data.sessions.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-purple-50 flex-shrink-0 ml-2">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Recomendaciones</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{data.recommendations.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-green-50 flex-shrink-0 ml-2">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inactivity Alerts */}
        {data.alerts.length > 0 ? (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-orange-100">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-200">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold">Alertas de Inactividad</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Estudiantes que requieren atención
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {data.alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="p-4 sm:p-6 rounded-xl border-orange-100 bg-orange-50/50 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold break-words">
                            {alert.student?.full_name || alert.student?.email}
                          </h3>
                          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs sm:text-sm">
                            {alert.days_inactive} días inactivo
                          </Badge>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 mb-2 break-words">
                          {alert.startup?.name}
                        </p>
                        {alert.slack_message && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Alerta enviada a Slack</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="Sin alertas"
            message="No hay alertas de inactividad en este momento. Todos tus mentorados están activos."
            fullScreen={false}
          />
        )}

        {/* Upcoming Sessions */}
        {data.sessions.length > 0 ? (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-100">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold">Próximas Sesiones</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Sesiones programadas con tus mentorados
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {data.sessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="p-4 sm:p-6 rounded-xl border-blue-100 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold break-words">
                            {session.student?.full_name || session.student?.email}
                          </h3>
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs sm:text-sm">
                            {new Date(session.scheduled_at).toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </Badge>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 mb-2 break-words">
                          {session.startup?.name}
                        </p>
                        {session.meeting_url && (
                          <a
                            href={session.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline mt-2"
                          >
                            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Link de reunión</span>
                          </a>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="Sin sesiones programadas"
            message="No hay sesiones programadas en este momento."
            fullScreen={false}
          />
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 ? (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
            <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-b border-purple-100">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-200">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold">Recomendaciones de IA</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Sugerencias para tus próximas sesiones
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {data.recommendations.map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-4 sm:p-6 rounded-xl border-purple-100 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold break-words">{rec.recommendation_type}</h3>
                          <Badge 
                            className={`${
                              rec.priority === "high" 
                                ? "bg-red-500/10 text-red-600 border-red-500/20" 
                                : rec.priority === "medium"
                                ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            } text-xs sm:text-sm`}
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 mb-2 break-words">
                          {rec.recommendation_text}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 break-words">
                          {rec.student?.full_name || rec.student?.email} - {rec.startup?.name}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Usar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="Sin recomendaciones"
            message="No hay recomendaciones de IA disponibles en este momento."
            fullScreen={false}
          />
        )}

        {/* Assignments */}
        {data.assignments.length > 0 ? (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-100">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold">Mis Mentorados</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Estudiantes asignados a tu mentoría
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {data.assignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="p-4 sm:p-6 rounded-xl border-blue-100 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold mb-2 break-words">
                          {assignment.student?.full_name || assignment.student?.email}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-700 mb-3 break-words">
                          {assignment.startup?.name}
                        </p>
                        {assignment.startup?.stage && (
                          <Badge className={`${STAGE_COLORS[assignment.startup.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"} text-xs sm:text-sm`}>
                            {STAGE_LABELS[assignment.startup.stage] || assignment.startup.stage}
                          </Badge>
                        )}
                      </div>
                      {assignment.student?.id && (
                        <Link 
                          href={`/community/profile/${assignment.student.id}`}
                          className="w-full"
                        >
                          <Button 
                            size="sm" 
                            className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm w-full"
                          >
                            Ver Perfil
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="Sin mentorados"
            message="No tienes estudiantes asignados en este momento."
            fullScreen={false}
          />
        )}
      </div>
    </div>
  );
}

// Founder Mentorship View Component
function FounderMentorshipView({
  mentors,
  searchQuery,
  setSearchQuery,
  onRefresh,
  lolaMentorsUrl,
}: {
  mentors: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  lolaMentorsUrl: string;
}) {
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const supabase = createClient();

  const filteredMentors = mentors.filter((mentor) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      mentor.full_name?.toLowerCase().includes(query) ||
      mentor.email?.toLowerCase().includes(query) ||
      mentor.public_bio?.toLowerCase().includes(query) ||
      mentor.skills?.some((skill: string) => skill.toLowerCase().includes(query))
    );
  });

  const loadAvailableSlots = async (mentorId: string) => {
    try {
      setLoadingSlots(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/mentor/${mentorId}/available-slots`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error("Error loading available slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleRequestMentorship = async (mentorId: string) => {
    // TODO: Implement mentorship request
    alert("Funcionalidad de solicitud de mentoría próximamente");
  };

  const handleScheduleSession = async (mentorId: string, slot: any) => {
    // TODO: Implement session scheduling
    alert("Funcionalidad de agendar sesión próximamente");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              Mentores Disponibles
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Encuentra y conecta con mentores que pueden ayudarte a hacer crecer tu startup
            </p>
          </div>
        </div>

        {/* Hero Card with Lola */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl" />
                <img
                  src={lolaMentorsUrl}
                  alt="Lola Mentores"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg"
                />
              </div>
              <div className="text-white text-center sm:text-left flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  ¡Conecta con expertos que te guiarán!
                </h2>
                <p className="text-white/90 text-xs sm:text-sm max-w-xl">
                  Nuestros mentores tienen experiencia probada ayudando a founders como tú. 
                  Encuentra el mentor perfecto para tu startup y agenda una sesión.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Search and Filter */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, especialidad o habilidades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button
                variant="outline"
                onClick={onRefresh}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mentors Grid */}
        {filteredMentors.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No se encontraron mentores" : "No hay mentores disponibles"}
            message={searchQuery
              ? "Intenta con otro término de búsqueda"
              : "Próximamente habrá más mentores disponibles para ayudarte"}
            fullScreen={false}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMentors.map((mentor) => (
              <Card
                key={mentor.id}
                className="border-blue-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedMentor(mentor);
                  loadAvailableSlots(mentor.id);
                }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Mentor Header */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      {mentor.avatar_url ? (
                        <img
                          src={mentor.avatar_url}
                          alt={mentor.full_name || mentor.email}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          {(mentor.full_name?.[0] || mentor.email?.[0] || "M").toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 break-words">
                          {mentor.full_name || mentor.email}
                        </h3>
                        {mentor.isAssigned && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                            Tu Mentor
                          </Badge>
                        )}
                        {mentor.upcomingSession && (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs ml-2">
                            Sesión Programada
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {mentor.public_bio && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 break-words">
                        {mentor.public_bio}
                      </p>
                    )}

                    {/* Skills */}
                    {mentor.skills && mentor.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {mentor.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {mentor.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                            +{mentor.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {mentor.isAssigned ? (
                        <Button
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMentor(mentor);
                            loadAvailableSlots(mentor.id);
                          }}
                        >
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                          Agendar Sesión
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs sm:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestMentorship(mentor.id);
                          }}
                        >
                          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                          Solicitar Mentoría
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/community/profile/${mentor.id}`, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mentor Detail Modal */}
        {selectedMentor && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={() => setSelectedMentor(null)}>
            <Card className="max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="border-b px-4 sm:px-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  {selectedMentor.avatar_url ? (
                    <img
                      src={selectedMentor.avatar_url}
                      alt={selectedMentor.full_name || selectedMentor.email}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-blue-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl sm:text-2xl flex-shrink-0">
                      {(selectedMentor.full_name?.[0] || selectedMentor.email?.[0] || "M").toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-xl sm:text-2xl mb-1">
                      {selectedMentor.full_name || selectedMentor.email}
                    </CardTitle>
                    {selectedMentor.public_bio && (
                      <CardDescription className="text-sm sm:text-base mt-2">
                        {selectedMentor.public_bio}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMentor(null)}
                    className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Skills */}
                {selectedMentor.skills && selectedMentor.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-2">Especialidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMentor.skills.map((skill: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Slots */}
                <div>
                  <h4 className="font-semibold text-sm sm:text-base mb-3">Horarios Disponibles</h4>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-64 overflow-y-auto">
                      {availableSlots.slice(0, 12).map((slot: any, idx: number) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs border-blue-200 hover:bg-blue-50"
                          onClick={() => handleScheduleSession(selectedMentor.id, slot)}
                        >
                          {new Date(slot.start).toLocaleDateString("es-CO", {
                            month: "short",
                            day: "numeric",
                          })}
                          <br />
                          {new Date(slot.start).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay horarios disponibles en este momento
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedMentor.isAssigned ? (
                    <Button
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                      onClick={() => {
                        setSelectedMentor(null);
                        handleRequestMentorship(selectedMentor.id);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Nueva Sesión
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                      onClick={() => {
                        setSelectedMentor(null);
                        handleRequestMentorship(selectedMentor.id);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Solicitar Mentoría
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      window.open(`/community/profile/${selectedMentor.id}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

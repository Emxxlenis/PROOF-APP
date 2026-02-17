"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Plus, 
  FolderKanban,
  Loader2,
  Eye,
  EyeOff,
  Users,
  ArrowRight,
  Image as ImageIcon,
  Calendar,
  TrendingUp,
  Save
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

const STAGE_LABELS: Record<string, string> = {
  ideation: "Ideación",
  validation: "Validación",
  mvp: "MVP",
  first_sale: "Primera Venta",
  growth: "Crecimiento"
};

const STAGE_COLORS: Record<string, string> = {
  ideation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  validation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  mvp: "bg-green-500/10 text-green-600 border-green-500/20",
  first_sale: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  growth: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export default function ProjectsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});

  // Cloudinary URLs
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const lolaProjectsUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-dashboard_muuhd2`;

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      // Cargar proyectos del usuario (como creador o miembro)
      const { data: userProjects, error: projectsError } = await supabase
        .from("startups")
        .select("*")
        .eq("student_id", session.user.id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Error loading projects:", projectsError);
      }

      // Cargar proyectos donde el usuario es miembro del equipo
      const { data: teamProjects, error: teamError } = await supabase
        .from("team_members")
        .select(`
          startup:startups!team_members_startup_id_fkey (*)
        `)
        .eq("user_id", session.user.id);

      if (teamError) {
        console.error("Error loading team projects:", teamError);
      }

      // Combinar proyectos
      const allProjects = [
        ...(userProjects || []),
        ...(teamProjects?.map((tp: any) => tp.startup).filter(Boolean) || [])
      ];

      // Eliminar duplicados
      const uniqueProjects = Array.from(
        new Map(allProjects.map((p: any) => [p.id, p])).values()
      );

      setProjects(uniqueProjects);

      // Cargar conteos de equipo para cada proyecto
      const counts: Record<string, number> = {};
      for (const project of uniqueProjects) {
        const { count } = await supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("startup_id", project.id);
        counts[project.id] = (count || 0) + 1; // +1 para incluir al creador
      }
      setTeamCounts(counts);
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const totalProjects = projects.length;
  const publicProjects = projects.filter(p => p.visibility === "public").length;
  const totalTeamMembers = Object.values(teamCounts).reduce((sum, count) => sum + count, 0);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const activeProjects = projects.filter(p => new Date(p.created_at) >= oneMonthAgo).length;

  if (loading) {
    return <LoadingState message="Cargando proyectos..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              Mis Proyectos
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Gestiona todos tus proyectos y startups
            </p>
          </div>
          <Link href="/dashboard/projects/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Crear Nuevo Proyecto</span>
              <span className="sm:hidden">Nuevo Proyecto</span>
            </Button>
          </Link>
        </div>

        {/* Hero Card with Lola */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl" />
                <img
                  src={lolaProjectsUrl}
                  alt="Lola Proyectos"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg"
                />
              </div>
              <div className="text-white text-center sm:text-left flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  ¡Construye tu futuro!
                </h2>
                <p className="text-white/90 text-xs sm:text-sm max-w-xl">
                  Organiza y gestiona todos tus proyectos en un solo lugar. Colabora con tu equipo, 
                  haz seguimiento de tu progreso y lleva tus ideas al siguiente nivel.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Total Proyectos</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{totalProjects}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-blue-50 flex-shrink-0 ml-2">
                  <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Públicos</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{publicProjects}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-cyan-50 flex-shrink-0 ml-2">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Miembros</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{totalTeamMembers}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-emerald-50 flex-shrink-0 ml-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Activos</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{activeProjects}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-orange-50 flex-shrink-0 ml-2">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {projects.length === 0 ? (
          <EmptyState
            title="No tienes proyectos aún"
            message="Crea tu primer proyecto para comenzar a construir tu startup. Podrás agregar equipo, gestionar tareas y hacer seguimiento de tu progreso."
            action={
              <Link href="/dashboard/projects/new">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Mi Primer Proyecto
                </Button>
              </Link>
            }
            fullScreen={false}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="group border-blue-100 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
              >
                {/* Cover Image */}
                {project.cover_image_url ? (
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={project.cover_image_url}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      {project.visibility === "public" ? (
                        <Badge className="bg-white/90 text-gray-800 text-xs px-2 py-0.5">
                          <Eye className="h-3 w-3 mr-1" />
                          Público
                        </Badge>
                      ) : (
                        <Badge className="bg-black/50 text-white text-xs px-2 py-0.5">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Privado
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 flex items-center justify-center">
                    {project.logo_url ? (
                      <img
                        src={project.logo_url}
                        alt={project.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <Rocket className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400" />
                    )}
                  </div>
                )}

                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    {project.logo_url && !project.cover_image_url && (
                      <img
                        src={project.logo_url}
                        alt={project.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg line-clamp-2 mb-1 break-words">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs sm:text-sm break-words">
                        {project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {project.category && (
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                        {project.category}
                      </Badge>
                    )}
                    <Badge className={`text-xs ${STAGE_COLORS[project.stage] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {STAGE_LABELS[project.stage] || project.stage}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    {teamCounts[project.id] > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{teamCounts[project.id]} miembro{teamCounts[project.id] > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{new Date(project.created_at).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl h-8 sm:h-9 text-xs sm:text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/projects/${project.id}/edit`);
                      }}
                    >
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                      Editar
                    </Button>
                    <Button
                      className="flex-1 border-cyan-200 text-cyan-600 hover:bg-cyan-50 rounded-xl h-8 sm:h-9 text-xs sm:text-sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/startup-builder?id=${project.id}`);
                      }}
                    >
                      Abrir
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5" />
                    </Button>
                  </div>
                  <Button
                    className="w-full border-cyan-200 text-cyan-600 hover:bg-cyan-50 rounded-xl h-8 sm:h-9 text-xs sm:text-sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/projects/${project.id}/team`);
                    }}
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                    Gestionar Equipo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="bg-white border-blue-100 rounded-2xl shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Link href="/dashboard/projects/new" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 sm:py-5 flex-col gap-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="font-semibold text-sm sm:text-base">Crear Proyecto</span>
                  <span className="text-xs sm:text-sm text-gray-600">Nuevo proyecto desde cero</span>
                </Button>
              </Link>
              <Link href="/vitavalidator" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 sm:py-5 flex-col gap-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="font-semibold text-sm sm:text-base">Validar Idea</span>
                  <span className="text-xs sm:text-sm text-gray-600">Analiza tu startup con IA</span>
                </Button>
              </Link>
              <Link href="/dashboard/startup-builder" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 sm:py-5 flex-col gap-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl">
                  <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="font-semibold text-sm sm:text-base">Constructor</span>
                  <span className="text-xs sm:text-sm text-gray-600">Edita tu proyecto existente</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

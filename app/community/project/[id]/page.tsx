"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Rocket,
  User,
  Calendar,
  Globe,
  Lock,
  Sparkles,
  Users,
  Share2,
  ExternalLink,
  Mail,
  FileText,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const stageLabels: Record<string, string> = {
  ideation: "Ideación",
  validation: "Validación",
  mvp: "MVP",
  first_sale: "Primera Venta",
  growth: "Crecimiento",
};

const stageColors: Record<string, string> = {
  ideation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  validation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  mvp: "bg-green-500/10 text-green-600 border-green-500/20",
  first_sale: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  growth: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const categoryLabels: Record<string, string> = {
  tecnologia: "Tecnología",
  salud: "Salud",
  educacion: "Educación",
  finanzas: "Finanzas",
  ecommerce: "E-commerce",
  servicios: "Servicios",
  otros: "Otros",
  "Tecnología": "Tecnología",
  "Salud": "Salud",
  "Educación": "Educación",
  "Finanzas": "Finanzas",
  "E-commerce": "E-commerce",
  "SaaS": "SaaS",
  "Marketplace": "Marketplace",
  "Social Media": "Social Media",
  "Gaming": "Gaming",
  "Otro": "Otro",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [teamMembersCount, setTeamMembersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const supabase = createClient();

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/community/project/${projectId}`, {
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`,
        } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setCreator(data.creator);
        setTeamMembersCount(data.teamMembersCount || 0);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error loading project:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  const handleShare = async () => {
    const url = `${window.location.origin}/community/project/${projectId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error("Error copying URL:", error);
    }
  };

  const NavigationHeader = () => (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Lado izquierdo: back + título */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] sm:text-xs text-gray-700 shadow-sm hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="sm:hidden">Volver</span>
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="hidden sm:block h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
              <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] sm:text-xs text-gray-500">Detalle de Startup</p>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 break-words">
                {project?.name || "Cargando..."}
              </h2>
            </div>
          </div>
        </div>

        {/* Lado derecho: compartir */}
        {project && (
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <Button
              onClick={handleShare}
              size="sm"
              variant="outline"
              className="gap-1.5 sm:gap-2 text-[11px] sm:text-xs border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-full"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Copiado</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Compartir</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
          <LoadingState message="Cargando proyecto..." fullScreen={false} />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
          <EmptyState
            title="Startup no encontrada"
            message="La startup que buscas no existe o no tienes permisos para verla."
            action={
              <Button 
                onClick={() => router.push("/community/gallery")}
                className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la galería
              </Button>
            }
            fullScreen={false}
            variant="error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <NavigationHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-4 sm:space-y-6">
        {/* Project Header */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Cover Image / Logo */}
          {project.cover_image_url ? (
            <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
              <img
                src={project.cover_image_url}
                alt={project.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent" />
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                <Badge className={`${stageColors[project.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"} text-xs sm:text-sm`}>
                  {stageLabels[project.stage] || project.stage}
                </Badge>
              </div>
            </div>
          ) : project.logo_url ? (
            <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
              <img
                src={project.logo_url}
                alt={project.name}
                className="w-32 h-32 sm:w-48 sm:h-48 rounded-lg object-cover shadow-2xl"
              />
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                <Badge className={`${stageColors[project.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"} text-xs sm:text-sm`}>
                  {stageLabels[project.stage] || project.stage}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Rocket className="h-16 w-16 sm:h-24 sm:w-24 text-blue-500/50" />
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                <Badge className={`${stageColors[project.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"} text-xs sm:text-sm`}>
                  {stageLabels[project.stage] || project.stage}
                </Badge>
              </div>
            </div>
          )}

          <CardHeader className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <CardTitle className="text-2xl sm:text-3xl font-bold break-words">
                    {project.name}
                  </CardTitle>
                  {project.visibility === "public" ? (
                    <Badge className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                      <Globe className="h-3 w-3" />
                      <span className="text-xs sm:text-sm">Público</span>
                    </Badge>
                  ) : (
                    <Badge className="gap-1 bg-gray-500/10 text-gray-600 border-gray-500/20">
                      <Lock className="h-3 w-3" />
                      <span className="text-xs sm:text-sm">Privado</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Project Metadata */}
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-blue-100">
              {project.category && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Categoría:</span>{" "}
                    {categoryLabels[project.category] || project.category}
                  </span>
                </div>
              )}
              {project.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    Creado {formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Project Details */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Main Content - Description */}
          <div className="lg:col-span-2">
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold">Descripción de la Startup</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {project.description || "Sin descripción disponible"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Project Info */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm lg:sticky lg:top-24">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold">Información de la Startup</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Etapa</span>
                  <div className="mt-1.5">
                    <Badge className={`${stageColors[project.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"} text-xs sm:text-sm`}>
                      {stageLabels[project.stage] || project.stage}
                    </Badge>
                  </div>
                </div>
                
                {project.category && (
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Categoría</span>
                    <p className="mt-1.5 text-sm sm:text-base font-medium text-gray-900 break-words">
                      {categoryLabels[project.category] || project.category}
                    </p>
                  </div>
                )}

                {/* Team Members Count */}
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Equipo</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="text-sm sm:text-base font-medium text-gray-900">
                      {teamMembersCount + 1} {teamMembersCount === 0 ? 'miembro' : 'miembros'}
                      {teamMembersCount > 0 && (
                        <span className="text-gray-500 ml-1 text-xs sm:text-sm">
                          (incluyendo fundador)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Visibilidad</span>
                  <div className="mt-1.5">
                    <Badge className={project.visibility === "public" ? "bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1" : "bg-gray-500/10 text-gray-600 border-gray-500/20 gap-1"}>
                      {project.visibility === "public" ? (
                        <>
                          <Globe className="h-3 w-3" />
                          <span className="text-xs sm:text-sm">Público</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          <span className="text-xs sm:text-sm">Privado</span>
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {project.created_at && (
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Creado</span>
                    <p className="mt-1.5 text-sm sm:text-base text-gray-600">
                      {formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Creator Profile Section */}
        {creator && (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-100">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      Sobre el Fundador
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base mt-1">
                      Conoce a la persona detrás de esta startup
                    </CardDescription>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Avatar Section */}
                <div className="flex-shrink-0 flex flex-col items-center lg:items-start">
                  <div className="relative group">
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.full_name || creator.email}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-4 border-white shadow-lg ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all duration-300">
                        {(creator.full_name?.[0] || creator.email?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/community/profile/${creator.id}`} className="mt-4 sm:mt-6 w-full lg:w-auto">
                    <Button 
                      className="w-full lg:w-auto gap-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md text-xs sm:text-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Ver Perfil Completo
                    </Button>
                  </Link>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-4 sm:space-y-6">
                  {/* Name and Role */}
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 break-words">
                        {creator.full_name || creator.email || "Usuario"}
                      </h3>
                      
                      {creator.email && (
                        <div className="flex items-center gap-2 text-gray-600 mb-2 sm:mb-3">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium break-all">{creator.email}</span>
                        </div>
                      )}
                      
                      {creator.role && (
                        <Badge 
                          className="text-xs sm:text-sm py-1 sm:py-1.5 px-3 sm:px-4 bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold"
                        >
                          {creator.role === 'student' ? '👨‍🎓 Estudiante' : 
                           creator.role === 'mentor' ? '🎓 Mentor' : 
                           creator.role === 'admin' ? '⚙️ Administrador' : 
                           creator.role}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {creator.public_bio && (
                    <div className="relative p-4 sm:p-6 rounded-xl bg-blue-50/50 border border-blue-100">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-xl"></div>
                      <div className="pl-3 sm:pl-4">
                        <h4 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                          Biografía
                        </h4>
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                          {creator.public_bio}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {creator.skills && creator.skills.length > 0 && (
                    <div className="relative p-4 sm:p-6 rounded-xl bg-blue-50/50 border border-blue-100">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-xl"></div>
                      <div className="pl-3 sm:pl-4">
                        <h4 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                          Habilidades y Experiencia
                        </h4>
                        <div className="flex flex-wrap gap-2 sm:gap-2.5">
                          {creator.skills.map((skill: string, idx: number) => (
                            <Badge 
                              key={idx} 
                              className="text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/20 transition-all duration-200 cursor-default"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

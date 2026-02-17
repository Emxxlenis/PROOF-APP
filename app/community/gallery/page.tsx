"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ImageIcon, 
  Rocket, 
  Search,
  Filter,
  Eye,
  User,
  Calendar,
  TrendingUp,
  Sparkles,
  LayoutDashboard,
  ArrowLeft,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";

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

export default function GalleryPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedProject, setCopiedProject] = useState<string | null>(null);

  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const lolaGalleryUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-gallery_uo4mh6`;

  // Reset search when filters change
  useEffect(() => {
    setSearchQuery("");
  }, [stageFilter, categoryFilter]);

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      let url = "/api/community/gallery?limit=50";
      
      if (stageFilter !== "all") {
        url += `&stage=${stageFilter}`;
      }
      
      if (categoryFilter !== "all") {
        url += `&category=${categoryFilter}`;
      }
      
      const response = await fetch(url, {
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`,
        } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error loading gallery:", response.status, errorData);
        alert(`Error al cargar la galería: ${errorData.error || response.statusText}. Verifica la consola para más detalles.`);
      }
    } catch (error) {
      console.error("Error loading gallery:", error);
      alert("Error al cargar la galería. Verifica la consola para más detalles.");
    } finally {
      setLoading(false);
    }
  }, [stageFilter, categoryFilter]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  // Filter projects by search query (client-side filtering after backend filters)
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.student?.full_name?.toLowerCase().includes(query) ||
      project.student?.email?.toLowerCase().includes(query) ||
      (project.category && project.category.toLowerCase().includes(query)) ||
      (project.stage && stageLabels[project.stage]?.toLowerCase().includes(query))
    );
  });

  const NavigationHeader = () => (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Lado izquierdo: back + título */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] sm:text-xs text-gray-700 shadow-sm hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="sm:hidden">Volver</span>
            <span className="hidden sm:inline">Volver a Comunidad</span>
          </Link>
          <div className="hidden sm:block h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
              <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] sm:text-xs text-gray-500">Explora Proof</p>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Galería de Startups</h2>
            </div>
          </div>
        </div>

        {/* Lado derecho: acciones (responsivo) */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          {/* Versión compacta para móvil */}
          <Link href="/dashboard" className="sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              aria-label="Ir al dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/projects/new" className="sm:hidden">
            <Button
              size="sm"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 px-3 py-1 text-[11px] font-medium text-white shadow-md hover:from-blue-600 hover:to-cyan-700 hover:shadow-lg"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>Mostrar</span>
            </Button>
          </Link>

          {/* Versión completa para sm+ */}
          <Link href="/dashboard" className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/projects/new" className="hidden sm:block">
            <Button
              size="sm"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-1 text-xs sm:text-sm font-medium text-white shadow-md hover:from-blue-600 hover:to-cyan-700 hover:shadow-lg"
            >
              <Rocket className="h-4 w-4" />
              <span>Mostrar mi Startup</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const handleShare = async (project: any) => {
    const url = `${window.location.origin}/community/project/${project.id}`;
    setCopiedProject(project.id);
    try {
      await navigator.clipboard.writeText(url);
      setTimeout(() => setCopiedProject(null), 2000);
    } catch {
      setCopiedProject(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <NavigationHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Hero */}
        <Card className="border border-blue-100/60 bg-white/80 shadow-md overflow-hidden relative max-w-5xl mx-auto">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-blue-200/40 via-cyan-200/30 to-white/0 blur-3xl pointer-events-none" />
          <CardContent className="relative grid lg:grid-cols-[1fr_1.2fr] gap-3 sm:gap-4 items-center py-4 px-3 sm:px-5">
            {/* Imagen a la izquierda */}
            <div className="relative order-1 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/50 via-white/40 to-cyan-200/50 blur-2xl rounded-2xl" />
              <div className="relative rounded-2xl border border-blue-100 overflow-hidden shadow-lg max-w-xs mx-auto lg:ml-4">
                <img
                  src={lolaGalleryUrl}
                  alt="Lola motivando a compartir tu startup"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Texto a la derecha */}
            <div className="space-y-2 order-2 lg:order-2">
              <Badge className="w-fit bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow text-[11px] px-2 py-0.5">Galería comunitaria</Badge>
              <h1 className="text-xl sm:text-2xl font-bold leading-snug text-gray-900">
                Inspírate con proyectos reales de la comunidad Proof
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                Descubre startups públicas, conoce su progreso y conecta con founders que comparten tu visión.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100 text-[11px] sm:text-xs">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">{projects.length} proyectos</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-100 text-[11px] sm:text-xs">
                  <TrendingUp className="h-4 w-4 text-cyan-600" />
                  <span className="font-medium text-cyan-700">Etapas reales</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filters */}
        <Card className="border border-blue-100/60 bg-white/80 shadow-md">
          <CardContent className="space-y-5 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, descripción, autor o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-blue-100 focus:ring-blue-200 focus:border-blue-400 bg-white/80"
                />
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 items-center">
                <span className="font-medium">Filtros activos:</span>
                <Badge variant="outline" className="border-blue-200 bg-blue-50/80 text-blue-700">
                  Etapa: {stageFilter === "all" ? "Todas" : stageLabels[stageFilter]}
                </Badge>
                <Badge variant="outline" className="border-cyan-200 bg-cyan-50/80 text-cyan-700">
                  Categoría: {categoryFilter === "all" ? "Todas" : categoryFilter}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Filter className="h-4 w-4" />
                  Etapas
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={stageFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStageFilter("all")}
                    className={stageFilter === "all" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow" : "border-blue-100 text-gray-600"}
                  >
                    Todas
                  </Button>
                  {Object.entries(stageLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={stageFilter === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStageFilter(key)}
                      className={stageFilter === key ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow" : "border-blue-100 text-gray-600"}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Filter className="h-4 w-4" />
                  Categorías
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={categoryFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("all")}
                    className={categoryFilter === "all" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow" : "border-blue-100 text-gray-600"}
                  >
                    Todas
                  </Button>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={categoryFilter === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter(key)}
                      className={categoryFilter === key ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow" : "border-blue-100 text-gray-600"}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {loading ? (
          <LoadingState message="Cargando proyectos..." fullScreen={false} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No encontramos startups con esa búsqueda" : "Aún no hay startups públicas"}
            message={searchQuery
              ? "Intenta con otro término o ajusta los filtros para explorar más proyectos."
              : "Comparte tu startup con la comunidad para inspirar a otros founders."}
            action={!searchQuery ? (
              <Link href="/dashboard/projects/new">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                  Crear mi Startup
                </Button>
              </Link>
            ) : undefined}
            fullScreen={false}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((project: any) => (
              <Card
                key={project.id}
                className="group border border-blue-100/60 bg-white/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Project Image */}
                {project.cover_image_url ? (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100/50 to-cyan-100/50">
                    <img
                      src={project.cover_image_url}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={stageColors[project.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"}>
                        {stageLabels[project.stage] || project.stage}
                      </Badge>
                    </div>
                  </div>
                ) : project.logo_url ? (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100/50 to-cyan-100/30 flex items-center justify-center">
                    <img
                      src={project.logo_url}
                      alt={project.name}
                      className="w-32 h-32 rounded-lg object-cover shadow-lg"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={stageColors[project.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"}>
                        {stageLabels[project.stage] || project.stage}
                      </Badge>
                    </div>
                  </div>
                ) : project.showcase_posts?.[0]?.images?.[0] ? (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-purple-600/10">
                    <img
                      src={project.showcase_posts[0].images[0]}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={stageColors[project.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"}>
                        {stageLabels[project.stage] || project.stage}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                    <Rocket className="h-16 w-16 text-primary/50" />
                    <div className="absolute top-3 right-3">
                      <Badge className={stageColors[project.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"}>
                        {stageLabels[project.stage] || project.stage}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardHeader className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg line-clamp-2 text-gray-900">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                        onClick={() => handleShare(project)}
                      >
                        {copiedProject === project.id ? (
                          <Copy className="h-4 w-4" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Link href={`/community/project/${project.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3 text-sm text-gray-600">
                    {project.description || "Sin descripción"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Category */}
                  {project.category && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {project.category || "Sin categoría"}
                      </span>
                    </div>
                  )}

                  {/* Author */}
                  {(project.student_id || project.student) && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {project.student?.avatar_url ? (
                        <img
                          src={project.student.avatar_url}
                          alt={project.student.full_name || project.student.email || "Usuario"}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                          {(project.student?.full_name?.[0] || project.student?.email?.[0] || "?").toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {project.student?.full_name || project.student?.email || "Usuario"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {project.created_at && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: es })}</span>
                      </div>
                    )}
                    {project.showcase_posts?.length ? (
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>{project.showcase_posts.length} showcases</span>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="text-center text-sm text-gray-600 bg-white/70 border border-blue-100 rounded-2xl py-3">
            {filteredProjects.length > 0 ? (
              <>
                Mostrando {filteredProjects.length} {filteredProjects.length === 1 ? "startup" : "startups"}
                {searchQuery && filteredProjects.length !== projects.length && (
                  <span> de {projects.length} encontradas</span>
                )}
              </>
            ) : (
              <span>No se encontraron startups con los filtros aplicados</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

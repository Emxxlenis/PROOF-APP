"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  LayoutDashboard,
  MessageSquare,
  LogOut,
  TrendingUp,
  Rocket,
  RefreshCw,
  Users,
  Menu,
  X,
  User,
  Sparkles,
  FileText,
  BarChart3,
  Target,
  Mail,
  Check,
  ChevronDown,
  Building2,
  Plus,
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Función helper para determinar si una ruta está activa
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleEmailClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const email = "lenisdomingueze@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      // Fallback: redirigir al formulario de contacto
      router.push("/contacto");
    }
  };
  
  // Usar hook personalizado para manejo de autenticación
  const { user, loading, isAuthenticated, signOut } = useAuth();
  
  // Hook para proyecto seleccionado
  const { selectedProject, projects, loading: projectsLoading, selectProject } = useSelectedProject();

  // Estado para rastrear si acabamos de cambiar de loading a false
  const [loadingJustFinished, setLoadingJustFinished] = useState(false);
  
  // Rastrear cuando loading cambia de true a false
  useEffect(() => {
    if (loading) {
      setLoadingJustFinished(false);
    } else {
      // Cuando loading cambia a false, marcar que acabamos de terminar
      setLoadingJustFinished(true);
      // Resetear después de 2 segundos
      const timer = setTimeout(() => setLoadingJustFinished(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Redirigir si no está autenticado, pero dar tiempo durante la transición
  useEffect(() => {
    // No redirigir si aún está cargando
    if (loading) {
      return;
    }
    
    // Si acabamos de terminar de cargar, dar más tiempo antes de redirigir
    // Esto permite que las cookies se sincronicen después del login
    if (loadingJustFinished && !isAuthenticated) {
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          router.replace("/auth");
        }
      }, 2000); // Esperar 2 segundos adicionales después de que loading termine
      return () => clearTimeout(timer);
    }
    
    // Si no está autenticado y ya pasó el tiempo de transición, redirigir
    if (!loadingJustFinished && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [loading, isAuthenticated, loadingJustFinished, router]);
  
  // Timeout de seguridad: si después de 10 segundos sigue cargando o no está autenticado, redirigir
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (!isAuthenticated) {
          router.replace("/auth");
        }
      }, 10000); // Aumentado a 10 segundos
      return () => clearTimeout(timeout);
    }
  }, [loading, isAuthenticated, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // signOut ya redirige a /auth, pero por si acaso
      router.push("/auth");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Mostrar loading mientras se verifica autenticación
  if (loading || !isAuthenticated) {
    return <LoadingState message="Verificando autenticación..." fullScreen />;
  }

  // Cloudinary logo URL
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu Button - Solo visible cuando el menú está cerrado */}
      {!mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 border-r bg-card p-6 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Image
              src={proofLogoUrl}
              alt="Proof Logo"
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0"
              unoptimized
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Proof
                </h1>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 border-blue-200">
                  BETA
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Where Execution Speaks</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Selector de Proyecto */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Proyecto
          </label>
          {projectsLoading ? (
            <div className="w-full p-3 border border-border rounded-lg bg-muted/50 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          ) : projects.length === 0 ? (
            <Link href="/dashboard/projects/new">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </Button>
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-2.5 px-3 font-medium"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-left">
                      {selectedProject?.name || "Seleccionar proyecto"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => selectProject(project.id)}
                    className={selectedProject?.id === project.id ? "bg-accent" : ""}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{project.name}</span>
                      {selectedProject?.id === project.id && (
                        <Check className="h-4 w-4 ml-auto flex-shrink-0 text-primary" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/projects/new" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Crear nuevo proyecto</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {/* Dashboard */}
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/dashboard") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          {/* Separator */}
          <div className="pt-4 mt-4 border-t border-gray-200"></div>

          {/* Estrategia - Consolidado: Mi Idea + Constructor */}
          <Link href="/dashboard/startup-builder" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/dashboard/startup-builder") || isActive("/dashboard/projects") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Estrategia
            </Button>
          </Link>

          {/* Validar - Consolidado: Hipótesis + Validación + Validar */}
          <Link href="/dashboard/validation" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/dashboard/validation") || isActive("/dashboard/hypothesis") || isActive("/vitavalidator") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <Target className="mr-2 h-4 w-4" />
              Validar
            </Button>
          </Link>

          {/* Pivots - Consolidado: Decidir + Mis Pivots */}
          <Link href="/dashboard/pivots" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/dashboard/pivots") || isActive("/ideapivotengine") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Pivots
            </Button>
          </Link>

          {/* OKRs - Consolidado: OKRs + Progreso */}
          <Link href="/dashboard/okrs" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/dashboard/okrs") || isActive("/dashboard/progress") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              OKRs
            </Button>
          </Link>

          {/* Tracción */}
          <Link href="/dashboard/metrics" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/dashboard/metrics") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Tracción
            </Button>
          </Link>

          {/* Separator */}
          <div className="pt-4 mt-4 border-t border-gray-200"></div>

          {/* Proof Coach - Reposicionado para mejor visibilidad */}
          <Link href="/vitacoach" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/vitacoach") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Proof Coach
            </Button>
          </Link>

          {/* Separator */}
          <div className="pt-4 mt-4 border-t border-gray-200"></div>

          {/* Comunidad */}
          <Link href="/community" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/community") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <Users className="mr-2 h-4 w-4" />
              Comunidad
            </Button>
          </Link>

          {/* Perfil */}
          <Link href="/dashboard/profile" onClick={() => setMobileMenuOpen(false)}>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${isActive("/dashboard/profile") ? "bg-accent text-accent-foreground font-medium" : ""}`}
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </Button>
          </Link>
        </nav>

        <div className="mt-auto pt-8">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full lg:w-auto bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {/* Slim Banner BETA */}
          <div className="mb-4 sm:mb-6">
            <div className="bg-blue-50 border-b border-blue-200 py-2 px-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-700">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-1.5 py-0">
                  BETA
                </Badge>
                <span className="text-blue-600">Plataforma en periodo de prueba</span>
                <span className="hidden sm:inline">•</span>
                <button
                  onClick={handleEmailClick}
                  className="hidden sm:inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  type="button"
                  title={emailCopied ? "Email copiado" : "Reportar problema"}
                >
                  {emailCopied ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Email copiado</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-3 w-3" />
                      <span>Reportar problema</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

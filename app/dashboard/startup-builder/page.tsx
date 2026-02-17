"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Rocket, 
  Sparkles, 
  Lightbulb, 
  Loader2, 
  Save, 
  Wand2,
  Brain,
  Target,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  FileText,
  MessageSquare,
  DollarSign,
  Zap,
  TrendingUp,
  Cloud,
  BookOpen,
  History,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Clock,
  Users,
  LayoutDashboard,
  PlayCircle
} from "lucide-react";
import { TutorialOverlay } from "@/components/ui/tutorial-overlay";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import de react-markdown para reducir el bundle inicial
const MarkdownRendererSimple = dynamic(
  () => import("@/components/ui/markdown-renderer-simple").then((mod) => mod.MarkdownRendererSimple),
  {
    loading: () => <div className="animate-pulse text-muted-foreground">Cargando...</div>,
    ssr: false,
  }
);
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

export default function StartupBuilderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [improving, setImproving] = useState(false);
  const [brainstorming, setBrainstorming] = useState(false);
  const [startup, setStartup] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    problem: "",
    solution: "",
    target_audience: "",
    business_model: "",
    competitive_advantage: "",
    market_opportunity: "",
    additional_context: "",
  });

  const [improvements, setImprovements] = useState<string>("");
  const [brainstormIdeas, setBrainstormIdeas] = useState<string[]>([]);
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  useEffect(() => {
    // Limpiar datos cuando cambia el proyecto para evitar mezclar información
    setStartup(null);
    setValidation(null);
    setFormData({
      name: "",
      description: "",
      problem: "",
      solution: "",
      target_audience: "",
      business_model: "",
      competitive_advantage: "",
      market_opportunity: "",
      additional_context: "",
    });
    setImprovements("");
    setBrainstormIdeas([]);
    isInitialLoadRef.current = true;
    
    loadStartupData();
    
    // Limpiar mejoras y lluvia de ideas al desmontar el componente
    return () => {
      setImprovements("");
      setBrainstormIdeas([]);
    };
  }, [selectedProjectId]);
  
  // También escuchar cambios en localStorage como respaldo
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected_project_id') {
        loadStartupData();
      }
    };

    const handleCustomStorageChange = () => {
      loadStartupData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('project-selected', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-selected', handleCustomStorageChange);
    };
  }, []);

  // Función de auto-guardado optimizada
  const autoSave = useCallback(async (data: typeof formData, improvementsData: string, brainstormData: string[]) => {
    if (!startup || isInitialLoadRef.current) {
      return;
    }

    try {
      setAutoSaving(true);

      // Optimizar datos antes de guardar
      const truncateText = (text: string, maxLength: number = 1000) => {
        if (!text) return null;
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
      };

      const optimizedImprovements = improvementsData 
        ? (improvementsData.length > 5000 ? improvementsData.substring(0, 5000) + "..." : improvementsData)
        : null;

      const optimizedBrainstormIdeas = brainstormData.slice(0, 15);

      // Guardar directamente en la base de datos (NO en user_metadata)
      const { error: updateError } = await supabase
        .from("startups")
        .update({
          name: truncateText(data.name, 200) || data.name,
          description: truncateText(data.description, 1000) || data.description,
          problem: truncateText(data.problem, 1000),
          solution: truncateText(data.solution, 1000),
          target_audience: truncateText(data.target_audience, 1000),
          business_model: truncateText(data.business_model, 1000),
          competitive_advantage: truncateText(data.competitive_advantage, 1000),
          market_opportunity: truncateText(data.market_opportunity, 1000),
          additional_context: truncateText(data.additional_context, 1000),
          improvements: optimizedImprovements,
          brainstorm_ideas: optimizedBrainstormIdeas,
          last_activity: new Date().toISOString(),
        })
        .eq("id", startup.id);

      if (updateError) {
        console.error("Error en auto-guardado:", updateError);
        // No mostrar error al usuario para auto-guardado silencioso
        return;
      }

      setLastSaved(new Date());
    } catch (error: any) {
      console.error("Error en auto-guardado:", error);
      // No mostrar error al usuario para auto-guardado silencioso
    } finally {
      setAutoSaving(false);
    }
  }, [startup, supabase]);

  // Auto-guardado con debounce cuando cambia formData
  useEffect(() => {
    if (isInitialLoadRef.current || !startup) {
      return;
    }

    // Limpiar timeout anterior
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Configurar nuevo timeout para auto-guardar después de 2 segundos de inactividad
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(formData, improvements, brainstormIdeas);
    }, 2000);

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, improvements, brainstormIdeas, autoSave, startup]);

  const handleDeleteProject = async () => {
    if (!startup) return;

    try {
      setDeleting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión para eliminar el proyecto");
        return;
      }

      // Verificar que el usuario es el dueño del proyecto
      const { data: startupCheck, error: checkError } = await supabase
        .from("startups")
        .select("id, student_id")
        .eq("id", startup.id)
        .eq("student_id", session.user.id)
        .single();

      if (checkError || !startupCheck) {
        setError("No tienes permiso para eliminar este proyecto");
        return;
      }

      // Eliminar el proyecto (las relaciones se eliminan en cascada por ON DELETE CASCADE)
      const { error: deleteError } = await supabase
        .from("startups")
        .delete()
        .eq("id", startup.id)
        .eq("student_id", session.user.id);

      if (deleteError) {
        console.error("Error deleting project:", deleteError);
        setError(deleteError.message || "Error al eliminar el proyecto");
        return;
      }

      // Limpiar el proyecto seleccionado del localStorage si es el que se eliminó
      const selectedProjectId = localStorage.getItem("selected_project_id");
      if (selectedProjectId === startup.id) {
        localStorage.removeItem("selected_project_id");
      }

      // Disparar evento para actualizar el selector de proyectos
      window.dispatchEvent(new CustomEvent('project-deleted', { 
        detail: { projectId: startup.id } 
      }));

      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error deleting project:", error);
      setError(error.message || "Error al eliminar el proyecto");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const loadStartupData = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
        return;
      }

      // Usar selectedProjectId del hook o leer de localStorage como fallback
      const projectId = selectedProjectId || localStorage.getItem("selected_project_id");
      
      // Load startup - use selected project or fallback to first one
      let query = supabase
        .from("startups")
        .select("*");
      
      if (projectId) {
        query = query.eq("id", projectId);
      } else {
        query = query.eq("student_id", session.user.id);
      }
      
      const { data: startupData } = await query.maybeSingle();

      if (startupData) {
        setStartup(startupData);
        
        // Load latest validation
        const { data: validationData } = await supabase
          .from("validations")
          .select("*")
          .eq("startup_id", startupData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (validationData) {
          setValidation(validationData);
        }

        // Load detailed context from startup table
        setFormData({
          name: startupData.name || "",
          description: startupData.description || "",
          problem: startupData.problem || "",
          solution: startupData.solution || "",
          target_audience: startupData.target_audience || "",
          business_model: startupData.business_model || "",
          competitive_advantage: startupData.competitive_advantage || "",
          market_opportunity: startupData.market_opportunity || "",
          additional_context: startupData.additional_context || "",
        });
        
        // Load improvements and brainstorm ideas from startup table
        setImprovements(startupData.improvements || "");
        setBrainstormIdeas(
          Array.isArray(startupData.brainstorm_ideas) 
            ? startupData.brainstorm_ideas 
            : startupData.brainstorm_ideas 
              ? (typeof startupData.brainstorm_ideas === 'string' 
                  ? JSON.parse(startupData.brainstorm_ideas) 
                  : startupData.brainstorm_ideas)
              : []
        );
        
        // Load hypotheses

        // Marcar que la carga inicial está completa
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error loading startup:", error);
      setError("Error al cargar los datos de tu startup");
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    try {
      setImproving(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const accessToken = session.access_token;

      const response = await fetch("/api/startup-builder/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({
          startupData: formData,
          validation: validation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al mejorar la idea");
      }

      const data = await response.json();
      setImprovements(data.improvements);
    } catch (error: any) {
      console.error("Error improving idea:", error);
      setError(error.message || "Error al mejorar la idea");
    } finally {
      setImproving(false);
    }
  };

  const handleBrainstorm = async () => {
    try {
      setBrainstorming(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const accessToken = session.access_token;

      const response = await fetch("/api/startup-builder/brainstorm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({
          startupData: formData,
          validation: validation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar ideas");
      }

      const data = await response.json();
      setBrainstormIdeas(data.ideas || []);
    } catch (error: any) {
      console.error("Error brainstorming:", error);
      setError(error.message || "Error al generar ideas");
    } finally {
      setBrainstorming(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Forzar guardado inmediato (sin esperar el debounce)
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      await autoSave(formData, improvements, brainstormIdeas);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving:", error);
      setError(error.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return <LoadingState message="Cargando tu startup..." />;
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
              <Rocket className="h-8 w-8 text-blue-600" />
              Constructor de Startup
            </h1>
            <p className="text-gray-700 mt-2 text-lg">
              Desarrolla y mejora tu idea con la ayuda de IA
            </p>
          </div>
          <EmptyState
            title="No hay startup registrada"
            message="Primero valida tu idea con Proof AI para comenzar a construir tu startup"
            action={
              <Button 
                asChild 
                size="lg"
                className="group relative bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold text-lg px-8 py-6 h-auto shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <Link href="/vitavalidator">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                      <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <span>Validar mi Idea</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </Link>
              </Button>
            }
            fullScreen={false}
          />
        </div>
      </div>
    );
  }

  const startupBuilderTutorialSteps = [
    {
      id: "welcome",
      title: "¡Bienvenido al Constructor de Startup!",
      description: "Aquí puedes desarrollar y mejorar tu idea de startup. Completa todos los campos con información detallada para obtener mejores sugerencias de IA.",
      position: "center" as const,
    },
    {
      id: "form",
      title: "Completa el Formulario",
      description: "Llena todos los campos con información detallada sobre tu startup. Mientras más específico seas, mejores serán las sugerencias de IA. Los cambios se guardan automáticamente.",
      target: "[data-tutorial='startup-form']",
      position: "top" as const,
    },
    {
      id: "improve",
      title: "Mejorar con IA",
      description: "Haz clic en 'Mejorar Idea' para que la IA analice tu startup y te dé sugerencias específicas de mejora basadas en tu información.",
      target: "[data-tutorial='improve-button']",
      position: "top" as const,
    },
    {
      id: "brainstorm",
      title: "Lluvia de Ideas",
      description: "Usa 'Lluvia de Ideas' para generar ideas creativas y viables para expandir tu startup. La IA generará 8-12 ideas basadas en tu información.",
      target: "[data-tutorial='brainstorm-button']",
      position: "top" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <TutorialOverlay
        steps={startupBuilderTutorialSteps}
        storageKey="startup-builder"
        title="Tutorial del Constructor de Startup"
        description="Aprende a desarrollar y mejorar tu startup con IA"
      />
      {/* Header fijo */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 border-b border-blue-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                  Constructor de Startup
                </h1>
                <HelpTooltip
                  content="Completa todos los campos con información detallada. Mientras más específico seas, mejores serán las sugerencias de IA. Los cambios se guardan automáticamente."
                  variant="info"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("tutorial_startup-builder_completed");
                    window.location.reload();
                  }}
                  className="text-xs sm:text-sm"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Tutorial
                </Button>
              </div>
              <p className="text-gray-700 text-sm sm:text-base mt-1">
                Desarrolla y mejora tu idea con la ayuda de IA
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-sm">
                {autoSaving ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Cloud className="h-4 w-4 animate-pulse" />
                    <span className="hidden sm:inline">Guardando...</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      Guardado {lastSaved.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ) : null}
              </div>
              {/* Delete project button */}
              {startup && (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="hidden sm:flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar Proyecto</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="sm:hidden p-2"
                    title="Eliminar Proyecto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              {/* Quick access to dashboard */}
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-md hover:shadow-lg transition-all hidden sm:flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-md hover:shadow-lg transition-all sm:hidden p-2"
                  title="Ir al Dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">

          {error && (
            <Card className="border-2 border-red-200 bg-red-50/80 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-red-600"></div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card className="border-2 border-green-200 bg-green-50/80 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Guardado exitosamente. Los cambios se guardan automáticamente mientras escribes.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Info */}
          <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden" data-tutorial="startup-form">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                Información Básica
              </CardTitle>
              <CardDescription className="text-base">
                Define los aspectos fundamentales de tu startup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold text-gray-900">Nombre de la Startup</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: TutorConnect"
                  className="h-12 text-base border-2 border-blue-100 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold text-gray-900">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tu startup en detalle..."
                  className="min-h-[120px] text-base border-2 border-blue-100 focus:border-blue-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Problem & Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  Problema
                </CardTitle>
                <CardDescription>¿Qué problema resuelves?</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  placeholder="Describe el problema que tu startup resuelve..."
                  className="min-h-[120px] text-base border-2 border-blue-100 focus:border-blue-400"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-orange-500"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  Solución
                </CardTitle>
                <CardDescription>¿Cómo lo resuelves?</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  placeholder="Explica tu solución..."
                  className="min-h-[120px] text-base border-2 border-blue-100 focus:border-blue-400"
                />
              </CardContent>
            </Card>
          </div>

          {/* Target Audience & Business Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  Audiencia Objetivo
                </CardTitle>
                <CardDescription>¿Quién es tu cliente ideal?</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="Describe tu audiencia objetivo..."
                  className="min-h-[100px] text-base border-2 border-blue-100 focus:border-blue-400"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600"></div>
              <CardHeader className="bg-gradient-to-br from-orange-50/50 via-yellow-50/30 to-transparent">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  Modelo de Negocio
                </CardTitle>
                <CardDescription>¿Cómo generarás ingresos?</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={formData.business_model}
                  onChange={(e) => setFormData({ ...formData, business_model: e.target.value })}
                  placeholder="Explica tu modelo de negocio..."
                  className="min-h-[100px] text-base border-2 border-blue-100 focus:border-blue-400"
                />
              </CardContent>
            </Card>
          </div>

          {/* Competitive Advantage & Market Opportunity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  Ventaja Competitiva
                </CardTitle>
                <CardDescription>¿Qué te hace único?</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={formData.competitive_advantage}
                  onChange={(e) => setFormData({ ...formData, competitive_advantage: e.target.value })}
                  placeholder="Describe tu ventaja competitiva..."
                  className="min-h-[100px] text-base border-2 border-blue-100 focus:border-blue-400"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Oportunidad de Mercado
                </CardTitle>
                <CardDescription>¿Cuál es el tamaño del mercado?</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={formData.market_opportunity}
                  onChange={(e) => setFormData({ ...formData, market_opportunity: e.target.value })}
                  placeholder="Describe la oportunidad de mercado..."
                  className="min-h-[100px] text-base border-2 border-blue-100 focus:border-blue-400"
                />
              </CardContent>
            </Card>
          </div>

          {/* Additional Context */}
          <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                Contexto Adicional
              </CardTitle>
              <CardDescription className="text-base">
                Cualquier información adicional que quieras agregar
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <Textarea
                value={formData.additional_context}
                onChange={(e) => setFormData({ ...formData, additional_context: e.target.value })}
                placeholder="Agrega cualquier contexto adicional sobre tu startup..."
                className="min-h-[150px] text-base border-2 border-blue-100 focus:border-blue-400"
              />
            </CardContent>
          </Card>

          {/* AI Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Improve Idea */}
            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent relative z-10 pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                        <Wand2 className="h-5 w-5 text-white" />
                      </div>
                      Mejorar Idea
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Sugerencias de mejora con IA
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleImprove}
                    disabled={improving || !formData.description}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
                    data-tutorial="improve-button"
                  >
                    {improving ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-3 w-3" />
                        Mejorar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {improvements && (
                <CardContent className="pt-0 relative z-10">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-2 border-blue-200 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                          <Lightbulb className="h-3 w-3" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900">Sugerencias:</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImprovements("");
                          if (startup) {
                            autoSave(formData, "", brainstormIdeas);
                          }
                        }}
                        className="h-8 px-3 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 border-gray-300 flex-shrink-0"
                        title="Limpiar sugerencias"
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span className="text-xs">Limpiar</span>
                      </Button>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                      <MarkdownRendererSimple content={improvements} />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Brainstorm */}
            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="bg-gradient-to-br from-orange-50/50 via-yellow-50/30 to-transparent relative z-10 pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      Lluvia de Ideas
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Ideas creativas para expandir
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleBrainstorm}
                    disabled={brainstorming || !formData.description}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-orange-500/50 transition-all"
                    data-tutorial="brainstorm-button"
                  >
                    {brainstorming ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-3 w-3" />
                        Generar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {brainstormIdeas.length > 0 && (
                <CardContent className="pt-0 relative z-10">
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-orange-600" />
                        <span className="font-semibold text-xs text-gray-900">Ideas ({brainstormIdeas.length}):</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBrainstormIdeas([]);
                          if (startup) {
                            autoSave(formData, improvements, []);
                          }
                        }}
                        className="h-8 px-3 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 border-gray-300 flex-shrink-0"
                        title="Limpiar ideas"
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span className="text-xs">Limpiar</span>
                      </Button>
                    </div>
                    <ul className="space-y-1">
                      {brainstormIdeas.map((idea, idx) => (
                        <li
                          key={idx}
                          className="p-2 rounded-lg bg-white border-2 border-blue-100 flex items-start gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                          <CheckCircle2 className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-xs leading-relaxed text-gray-700">{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Save Button - Opcional ya que hay auto-guardado */}
          <Card className="border-2 border-green-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-600"></div>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg mb-1 text-gray-900">Guardar Manualmente</h3>
                  <p className="text-sm text-gray-600">
                    Los cambios se guardan automáticamente cada 2 segundos. Usa este botón para guardar inmediatamente.
                  </p>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving || autoSaving}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-green-500/50 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Ahora
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps / Navigation Actions */}
          <Card className="border-2 border-blue-200/50 shadow-xl bg-gradient-to-br from-blue-50/40 via-cyan-50/30 to-transparent backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                  <PlayCircle className="h-5 w-5 text-white" />
                </div>
                Próximos Pasos
              </CardTitle>
              <CardDescription className="text-base">
                Continúa desarrollando tu startup o revisa tu progreso
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-6">
              <div className="grid grid-cols-1 gap-4">
                <Link href="/dashboard" className="block">
                  <Button
                    size="lg"
                    className="w-full h-14 sm:h-16 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white text-base sm:text-lg font-bold shadow-xl hover:shadow-blue-500/50 transition-all duration-300 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all group-hover:scale-110">
                        <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <span className="whitespace-nowrap">Ir al Dashboard</span>
                      <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-2 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de confirmación para eliminar proyecto */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ¿Eliminar proyecto?
            </AlertDialogTitle>
            <div className="text-xs sm:text-sm text-muted-foreground pt-2">
              <p className="mb-2">
                Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto{" "}
                <strong>{startup?.name}</strong> y todos sus datos asociados:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Validaciones</li>
                <li>Hipótesis</li>
                <li>OKRs</li>
                <li>Métricas</li>
                <li>Pivots</li>
                <li>Landing pages</li>
                <li>Otros datos relacionados</li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel disabled={deleting} className="border-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleting}
              className="bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:via-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-red-500/50 transition-all duration-200 rounded-lg px-6 py-2.5 border-0 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Proyecto
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


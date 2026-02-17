"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Sparkles, MessageSquare, Target, TrendingUp, BookOpen, 
  CheckCircle2, ArrowRight, Rocket, Zap, Plus, BarChart3, 
  Users, RefreshCw, FileText, User, LayoutDashboard, 
  Lightbulb, Globe, Clock, Award, Activity, X, AlertTriangle
} from "lucide-react";
import type { Startup, Validation, OKR } from "@/types/database";
import { LoadingState } from "@/components/ui/loading-state";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";
import { Info } from "lucide-react";

export default function DashboardPage() {
  const [startup, setStartup] = useState<Startup | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const supabase = createClient();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const lolaDashboardUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-dashboard_muuhd2`;
  const lolaMetasUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-metas_a1vvvg`;
  const lolaTutorialUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-tutorial_kndozm`;

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Usar selectedProjectId del hook o leer de localStorage como fallback
    const projectId = selectedProjectId || localStorage.getItem("selected_project_id");
    
    // Load startup - use selected project or fallback to first one
    let query = supabase
      .from("startups")
      .select("*");
    
    if (projectId) {
      query = query.eq("id", projectId);
    } else {
      query = query.eq("student_id", user.id);
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
        
        // Corregir el stage si es inconsistente con el puntaje
        const shouldBeInValidation = validationData.viability_score >= 70;
        const currentStage = startupData.stage;
        let correctStage = currentStage;
        
        if (shouldBeInValidation) {
          // Si el puntaje es >= 70, puede estar en validation o más adelante
          // Solo corregir si está en ideation
          if (currentStage === "ideation") {
            correctStage = "validation";
          }
        } else {
          // Si el puntaje es < 70, debe estar en ideation
          if (currentStage === "validation" || currentStage === "mvp" || currentStage === "first_sale" || currentStage === "growth") {
            correctStage = "ideation";
          }
        }
        
        // Actualizar el stage si es necesario
        if (correctStage !== currentStage) {
          const { error: updateError } = await supabase
            .from("startups")
            .update({ stage: correctStage })
            .eq("id", startupData.id);
          
          if (!updateError) {
            // Actualizar el estado local
            setStartup({ ...startupData, stage: correctStage });
          } else {
            console.error("Error corrigiendo stage:", updateError);
          }
        }
      }

      // Load OKRs
      const { data: okrsData } = await supabase
        .from("okrs")
        .select("*")
        .eq("startup_id", startupData.id)
        .order("week_number", { ascending: false })
        .limit(1);

      if (okrsData) {
        setOkrs(okrsData);
      }
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Limpiar datos cuando cambia el proyecto para evitar mezclar información
    if (selectedProjectId) {
      setStartup(null);
      setValidation(null);
      setOkrs([]);
    }
    
    loadData();

    // Verificar si es un usuario nuevo (sin startup) y no ha visto el tutorial
    const hasSeenWelcome = localStorage.getItem('proof_welcome_seen');
    if (!hasSeenWelcome) {
      // Esperar un poco para que la UI se cargue
      setTimeout(() => {
        setShowWelcome(true);
      }, 500);
    }

    // Recargar datos cuando la ventana vuelve a tener foco (cuando el usuario vuelve del startup builder)
    const handleFocus = () => {
      loadData();
    };

    window.addEventListener('focus', handleFocus);
    
    // Escuchar cambios en el proyecto seleccionado
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected_project_id') {
        loadData();
      }
    };

    const handleCustomStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('project-selected', handleCustomStorageChange);

    // Suscripción a cambios en tiempo real de la tabla startups
    let channel: any = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        channel = supabase
          .channel('startup-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'startups',
              filter: `student_id=eq.${user.id}`,
            },
            (payload) => {
              // Recargar datos cuando hay un cambio
              loadData();
            }
          )
          .subscribe();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-selected', handleCustomStorageChange);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, loadData, selectedProjectId]);

  const getStageProgress = (stage: string) => {
    const stages = ["ideation", "validation", "mvp", "first_sale", "growth"];
    const currentIndex = stages.indexOf(stage);
    
    // Si está en ideation pero tiene validación con puntaje < 70, no puede avanzar
    if (stage === "ideation" && validation && validation.viability_score < 70) {
      // Mostrar progreso mínimo (solo ideación completada)
      return 20; // 20% = solo ideación
    }
    
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      ideation: "Ideación",
      validation: "Validación",
      mvp: "MVP",
      first_sale: "Primera Venta",
      growth: "Crecimiento"
    };
    return labels[stage] || stage;
  };

  if (loading) {
    return <LoadingState message="Cargando tu dashboard..." />;
  }

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('proof_welcome_seen', 'true');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Tutorial Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/95 via-cyan-50/95 to-white shadow-2xl overflow-hidden relative my-auto">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
            <CardHeader className="pt-6 sm:pt-8 pb-3 sm:pb-4 relative px-4 sm:px-6">
              <button
                onClick={handleCloseWelcome}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              </button>
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-transparent rounded-full blur-2xl"></div>
                    <img
                      src={lolaDashboardUrl}
                      alt="Lola - Bienvenido a Proof"
                      className="relative z-10 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 object-contain mx-auto drop-shadow-2xl"
                    />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1 sm:mb-2 px-2">
                    ¡Bienvenido a Proof!
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-700 max-w-lg mx-auto px-2">
                    Estás a punto de transformar tu idea en realidad. Te guiaremos paso a paso.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 rounded-lg bg-white/50 border border-blue-100">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2">1. Valida tu Idea</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Usa Proof AI para analizar la viabilidad de tu startup
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg bg-white/50 border border-blue-100">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                    <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2">2. Crea tu Proyecto</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Define tu startup con nombre, descripción y categoría
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg bg-white/50 border border-blue-100">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2">3. Define OKRs</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Establece objetivos semanales para mantener el foco
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center pt-2 sm:pt-4">
                <Button
                  onClick={handleCloseWelcome}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                  size="lg"
                >
                  ¡Empecemos!
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                </Button>
                <Button
                  onClick={handleCloseWelcome}
                  variant="outline"
                  size="lg"
                  className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
                >
                  Explorar primero
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Header Section */}
      <div className="space-y-2 pt-4 sm:pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base md:text-lg">
              {startup 
                ? `Bienvenido de vuelta, aquí está el progreso de ${startup.name}`
                : "Bienvenido, comienza tu viaje emprendedor"}
            </p>
          </div>
          {startup && (
            <Link href="/dashboard/projects/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold shadow-xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">Nuevo Proyecto</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!startup ? (
        /* Empty State - No Startup */
        <div className="space-y-6">
          <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-orange-500"></div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
            <CardHeader className="pt-6 sm:pt-8 px-4 sm:px-6 relative z-10">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-xl"></div>
                  <img
                    src={lolaTutorialUrl}
                    alt="Lola - Comienza tu viaje emprendedor"
                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                    style={{
                      filter: 'drop-shadow(0 25px 50px rgba(251, 146, 60, 0.3))',
                    }}
                  />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl text-center mb-2 px-2 font-bold text-blue-600">
                Convierte una idea en una decisión
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base max-w-2xl mx-auto px-2">
                Valida tu idea con Proof AI para analizar la viabilidad de tu startup antes de crear tu proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-4 sm:px-6 relative z-10">
              <div className="max-w-md mx-auto">
                <Link href="/vitavalidator">
                  <Card className="border-2 border-blue-200/50 hover:border-orange-400/60 hover:shadow-2xl transition-all cursor-pointer h-full group bg-white/90 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-orange-500 group-hover:h-2 transition-all"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/15 to-yellow-400/15 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
                        <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 via-cyan-100 to-orange-100 rounded-lg group-hover:scale-110 transition-transform">
                          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        </div>
                      </div>
                      <CardTitle className="text-xl sm:text-2xl text-center mb-3">Validar Idea</CardTitle>
                      <CardDescription className="text-sm text-center">
                        Analiza la viabilidad de tu startup con Proof AI en 5 dimensiones: técnica, mercado, competencia, negocio y contexto
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <Button className="w-full bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold shadow-xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 text-base py-6">
                        Validar Ahora
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Main Dashboard Content */
        <div className="space-y-8">
          {/* Startup Overview Card */}
          <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
            <CardHeader className="pt-6 sm:pt-8 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-2 sm:gap-3 mb-3">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex-shrink-0">
                      <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-1 break-words">{startup.name}</CardTitle>
                      <CardDescription className="text-sm sm:text-base break-words">
                        {startup.description || "Sin descripción"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard/projects" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Ver Proyectos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-4 sm:px-6">
              {/* Progress Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Etapa Actual</span>
                  <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1">
                    {getStageLabel(startup.stage)}
                  </Badge>
                </div>
                <Progress 
                  value={getStageProgress(startup.stage)} 
                  className="h-3 bg-blue-100"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Ideación</span>
                  <span className="sm:hidden">Idea</span>
                  <span className="hidden sm:inline">Validación</span>
                  <span className="sm:hidden">Val</span>
                  <span>MVP</span>
                  <span className="hidden md:inline">Primera Venta</span>
                  <span className="md:hidden">Venta</span>
                  <span className="hidden md:inline">Crecimiento</span>
                  <span className="md:hidden">Crec</span>
                </div>
                {validation && validation.viability_score < 70 && startup.stage === "ideation" && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs sm:text-sm text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Necesitas un puntaje de viabilidad ≥ 70 para avanzar a la etapa de Validación. Mejora tu idea y vuelve a validar.</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Validation Score */}
              {validation && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-blue-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Puntaje de Viabilidad</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {validation.viability_score}
                      </span>
                      <span className="text-sm sm:text-base text-muted-foreground">/ 100</span>
                    </div>
                    <Badge 
                      className={`mt-2 text-xs sm:text-sm ${
                        validation.viability_score >= 70 
                          ? "bg-green-500 hover:bg-green-600" 
                          : validation.viability_score >= 50
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-orange-500 hover:bg-orange-600"
                      } text-white`}
                    >
                      {validation.viability_score >= 70 ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Excelente</>
                      ) : validation.viability_score >= 50 ? (
                        "En Progreso"
                      ) : (
                        "Necesita Mejora"
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-start md:justify-end">
                    <Link href={`/vitavalidator?validation_id=${validation.id}${startup?.id ? `&startupId=${startup.id}` : ''}`} className="w-full md:w-auto">
                      <Button className="w-full md:w-auto bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-orange-500/50 transition-all duration-300 text-sm sm:text-base">
                        Ver Análisis Completo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info icon con tooltip - Solo mostrar si no hay score > 0 ni proyecto activo */}
          {(!validation?.viability_score && !startup) ? (
            <Card className="border-2 border-orange-200/50 bg-gradient-to-br from-orange-50/60 via-yellow-50/40 to-blue-50/30 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 relative mb-6">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600"></div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-300/20 to-yellow-300/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-300/15 to-cyan-300/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
              
              <CardContent className="pt-6 pb-6 px-4 sm:px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Lola Image */}
                  <div className="flex-shrink-0">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 via-yellow-300/20 to-blue-300/20 rounded-full blur-2xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-200/20 via-yellow-200/15 to-blue-200/15 rounded-full blur-xl"></div>
                      {/* Image container */}
                      <div className="relative z-10 w-full h-full transform hover:scale-110 transition-all duration-500">
                        <img
                          src={lolaMetasUrl}
                          alt="Lola - Tu ruta de éxito"
                          className="w-full h-full object-contain drop-shadow-2xl"
                          style={{
                            filter: 'drop-shadow(0 25px 50px rgba(251, 146, 60, 0.3))',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Texto explicativo */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent mb-3">
                      ¿Para qué es esta ruta?
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2">
                      Esta ruta te guía paso a paso para transformar tu idea en una startup exitosa. Cada paso está diseñado para que aproveches al máximo las herramientas de Proof y avances de manera estructurada hacia tus objetivos.
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      <strong className="text-orange-700">¿Cómo funciona?</strong> Completa cada paso en orden. Al finalizar un paso, el siguiente se desbloqueará automáticamente. Puedes ver tu progreso en tiempo real y volver a cualquier paso completado cuando lo necesites.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="mb-6 flex items-center gap-2">
              <HelpTooltip
                content="Esta ruta te guía paso a paso para transformar tu idea en una startup exitosa. Cada paso está diseñado para que aproveches al máximo las herramientas de Proof y avances de manera estructurada hacia tus objetivos. Completa cada paso en orden. Al finalizar un paso, el siguiente se desbloqueará automáticamente."
                variant="info"
                side="right"
              />
              <span className="text-sm text-gray-600">Información sobre la ruta</span>
            </div>
          )}

          {/* Roadmap - Ruta para aprovechar al máximo la plataforma */}
          <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-orange-500"></div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
            
            <CardHeader className="pt-6 sm:pt-8 px-4 sm:px-6 relative z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-50 rounded-xl shadow-md">
                  <Target className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-1">
                    Tu Ruta de Éxito
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-700">
                    Sigue estos pasos para aprovechar al máximo Proof
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8 relative z-10">
              <div className="space-y-4">
                {/* Determinar el estado actual y los pasos del roadmap */}
                {(() => {
                  // Paso 1: Validar Idea
                  const hasValidation = !!validation;
                  const validationPassed = validation && validation.viability_score >= 70;
                  const step1Completed = validationPassed;
                  const step1Current = !hasValidation || (hasValidation && !validationPassed);
                  
                  // Paso 2: Construir Startup
                  // Verificar que todos los campos esenciales estén completos
                  const isStartupComplete = startup && (
                    (startup.name && startup.name.trim().length >= 3) &&
                    (startup.description && startup.description.trim().length >= 50) &&
                    (startup.problem && startup.problem.trim().length >= 30) &&
                    (startup.solution && startup.solution.trim().length >= 30) &&
                    (startup.target_audience && startup.target_audience.trim().length >= 20) &&
                    (startup.business_model && startup.business_model.trim().length >= 20)
                  );
                  const step2Completed = isStartupComplete && validationPassed;
                  const step2Current = validationPassed && !isStartupComplete;
                  
                  // Contar campos completados para mostrar progreso
                  const completedFields = startup ? [
                    startup.name && startup.name.trim().length >= 3,
                    startup.description && startup.description.trim().length >= 50,
                    startup.problem && startup.problem.trim().length >= 30,
                    startup.solution && startup.solution.trim().length >= 30,
                    startup.target_audience && startup.target_audience.trim().length >= 20,
                    startup.business_model && startup.business_model.trim().length >= 20,
                  ].filter(Boolean).length : 0;
                  const totalFields = 6;
                  
                  // Paso 3: Definir OKRs
                  const step3Completed = okrs.length > 0;
                  const step3Current = step2Completed && !step3Completed;
                  
                  // Paso 4: Consultar con Proof Coach
                  const step4Completed = false; // Se puede mejorar con tracking
                  const step4Current = step3Completed && !step4Completed;
                  
                  // Paso 5: Crear Landing Pages
                  const step5Completed = false; // Se puede mejorar con tracking
                  const step5Current = step3Completed && !step5Completed;
                  
                  // Paso 6: Medir Métricas
                  const step6Completed = false; // Se puede mejorar con tracking
                  const step6Current = step5Completed && !step6Completed;

                  const roadmapSteps = [
                    {
                      number: 1,
                      title: "Validar tu Idea",
                      description: validationPassed 
                        ? `Tu idea tiene un puntaje de ${validation.viability_score}/100. ¡Excelente!`
                        : hasValidation 
                          ? `Tu idea tiene un puntaje de ${validation.viability_score}/100. Mejórala para alcanzar ≥70.`
                          : "Analiza la viabilidad de tu startup con Proof AI en 5 dimensiones",
                      icon: Sparkles,
                      href: "/vitavalidator",
                      status: step1Completed ? "completed" : step1Current ? "current" : "pending",
                      color: step1Completed ? "green" : step1Current ? "orange" : "gray",
                    },
                    {
                      number: 2,
                      title: "Construir tu Startup",
                      description: step2Completed
                        ? "¡Excelente! Has completado toda la información de tu startup"
                        : startup && completedFields > 0
                          ? `Completa la información de tu startup (${completedFields}/${totalFields} campos completados)`
                          : "Agrega contexto detallado: nombre, descripción, problema, solución, audiencia y modelo de negocio",
                      icon: Rocket,
                      href: "/dashboard/startup-builder",
                      status: step2Completed ? "completed" : step2Current ? "current" : "pending",
                      color: step2Completed ? "green" : step2Current ? "orange" : "gray",
                      disabled: !validationPassed,
                      progress: startup ? completedFields / totalFields : 0,
                    },
                    {
                      number: 3,
                      title: "Definir OKRs",
                      description: step3Completed
                        ? "Tienes OKRs activos para mantener el foco"
                        : "Establece objetivos semanales para mantener tu startup enfocada",
                      icon: Target,
                      href: "/dashboard/okrs",
                      status: step3Completed ? "completed" : step3Current ? "current" : "pending",
                      color: step3Completed ? "green" : step3Current ? "orange" : "gray",
                      disabled: !step2Completed,
                    },
                    {
                      number: 4,
                      title: "Consultar con Proof Coach",
                      description: "Obtén orientación personalizada de agentes especializados",
                      icon: MessageSquare,
                      href: "/vitacoach",
                      status: step4Completed ? "completed" : step4Current ? "current" : "pending",
                      color: step4Completed ? "green" : step4Current ? "orange" : "gray",
                      disabled: !step3Completed,
                    },
                    {
                      number: 5,
                      title: "Crear Landing Pages",
                      description: "Valida tu idea con el mercado usando landing pages y tests",
                      icon: Globe,
                      href: "/dashboard/validation",
                      status: step5Completed ? "completed" : step5Current ? "current" : "pending",
                      color: step5Completed ? "green" : step5Current ? "orange" : "gray",
                      disabled: !validationPassed,
                    },
                    {
                      number: 6,
                      title: "Medir y Analizar",
                      description: "Monitorea tus métricas clave y obtén insights con IA",
                      icon: BarChart3,
                      href: "/dashboard/metrics",
                      status: step6Completed ? "completed" : step6Current ? "current" : "pending",
                      color: step6Completed ? "green" : step6Current ? "orange" : "gray",
                      disabled: !step5Completed,
                    },
                  ];

                  return roadmapSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isLast = index === roadmapSteps.length - 1;
                    
                    return (
                      <div key={step.number} className="relative">
                        {/* Connector line */}
                        {!isLast && (
                          <div className={`absolute left-6 top-12 bottom-0 w-0.5 ${
                            step.status === "completed" 
                              ? "bg-gradient-to-b from-green-500 to-green-400" 
                              : step.status === "current"
                              ? "bg-gradient-to-b from-orange-500 via-orange-400 to-gray-300"
                              : "bg-gray-300"
                          }`}></div>
                        )}
                        
                        <div className="relative flex gap-4 sm:gap-6">
                          {/* Step Number & Icon */}
                          <div className="flex-shrink-0">
                            <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                              step.status === "completed"
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                : step.status === "current"
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white ring-4 ring-orange-200"
                                : "bg-gray-200 text-gray-400"
                            }`}>
                              {step.status === "completed" ? (
                                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
                              ) : (
                                <StepIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                              )}
                            </div>
                          </div>
                          
                          {/* Step Content */}
                          <div className="flex-1 pb-6 sm:pb-8">
                            <div className={`p-4 sm:p-5 rounded-xl border-2 transition-all ${
                              step.status === "completed"
                                ? "bg-gradient-to-br from-green-50/60 to-emerald-50/40 border-green-200/60"
                                : step.status === "current"
                                ? "bg-gradient-to-br from-orange-50/60 to-yellow-50/40 border-orange-300/60 shadow-lg"
                                : step.disabled
                                ? "bg-gray-50/60 border-gray-200/60 opacity-60"
                                : "bg-white/80 border-blue-200/60 hover:border-blue-300 hover:shadow-md"
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                    <h3 className={`text-lg sm:text-xl font-bold ${
                                      step.status === "completed"
                                        ? "text-green-700"
                                        : step.status === "current"
                                        ? "text-orange-700"
                                        : step.disabled
                                        ? "text-gray-500"
                                        : "text-gray-800"
                                    }`}>
                                      {step.number}. {step.title}
                                    </h3>
                                    {step.status === "current" && (
                                      <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5">
                                        Siguiente paso
                                      </Badge>
                                    )}
                                  </div>
                                  <p className={`text-sm sm:text-base mb-2 ${
                                    step.disabled ? "text-gray-400" : "text-gray-700"
                                  }`}>
                                    {step.description}
                                  </p>
                                  {/* Progress bar for step 2 */}
                                  {step.number === 2 && step.progress !== undefined && step.progress > 0 && step.progress < 1 && (
                                    <div className="mt-3 space-y-1">
                                      <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>Progreso de completitud</span>
                                        <span className="font-semibold">{Math.round(step.progress * 100)}%</span>
                                      </div>
                                      <Progress value={step.progress * 100} className="h-2" />
                                    </div>
                                  )}
                                </div>
                                
                                {step.disabled ? (
                                  <Button
                                    disabled
                                    variant="outline"
                                    className="flex-shrink-0 border-gray-300 text-gray-400 cursor-not-allowed"
                                  >
                                    Bloqueado
                                  </Button>
                                ) : (
                                  <Link href={step.href} className="flex-shrink-0">
                                    <Button
                                      variant={step.status === "current" ? "default" : "outline"}
                                      className={`${
                                        step.status === "current"
                                          ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg"
                                          : step.status === "completed"
                                          ? "border-green-300 text-green-700 hover:bg-green-50"
                                          : "border-blue-300 text-blue-700 hover:bg-blue-50"
                                      }`}
                                    >
                                      {step.status === "completed" ? (
                                        <>
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Ver
                                        </>
                                      ) : step.status === "current" ? (
                                        <>
                                          Comenzar
                                          <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                      ) : (
                                        <>
                                          Explorar
                                          <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                      )}
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Current OKRs */}
          {okrs.length > 0 && (
            <Card className="border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-orange-500"></div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
              <CardHeader className="pt-6 sm:pt-8 px-4 sm:px-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex-shrink-0">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">OKRs de esta Semana</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Semana {okrs[0].week_number} • {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/dashboard/okrs" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto border-2 border-blue-400/60 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-500">
                      Gestionar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-6 sm:pb-8 px-4 sm:px-6 relative z-10">
                <div className="p-4 sm:p-6 rounded-lg bg-white/70 backdrop-blur-sm border border-blue-200/50 shadow-sm">
                  <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-gray-900 break-words">{okrs[0].objective}</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { text: okrs[0].key_result_1, status: okrs[0].kr1_status },
                      { text: okrs[0].key_result_2, status: okrs[0].kr2_status },
                      { text: okrs[0].key_result_3, status: okrs[0].kr3_status },
                    ].map((kr, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 sm:p-4 rounded-lg bg-white border border-blue-100">
                        <span className="text-xs sm:text-sm flex-1 text-gray-700 break-words">{kr.text}</span>
                        <Badge
                          className={`text-xs sm:text-sm ${
                            kr.status === "completed"
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : kr.status === "in_progress"
                              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                          } w-fit`}
                        >
                          {kr.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {kr.status === "completed" ? "Completado" : kr.status === "in_progress" ? "En Progreso" : "Pendiente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}

'use client';

// Marcar como dinámico para evitar prerenderización
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, Code, DollarSign, CheckCircle2, ArrowRight, Calendar, AlertCircle, Target, Zap, Sparkles, LayoutDashboard, MessageSquare, User, LogOut, Copy, BookOpen, Info, ChevronDown, Rocket, X } from 'lucide-react';
import { TutorialOverlay } from '@/components/ui/tutorial-overlay';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { useSelectedProject } from '@/lib/hooks/useSelectedProject';
import { PivotAnalysisForm } from '@/components/pivot-engine/pivot-analysis-form';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { PivotOptionsDisplay } from '@/components/pivot-engine/pivot-options-display';
import { PivotValidationPlan } from '@/components/pivot-engine/pivot-validation-plan';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function IdeaPivotEnginePage() {
  // Cloudinary config
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const lolaPivotUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-pivot_izplpw`;
  const lolaPivot2Url = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-pivot2_sao7js`;

  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startup, setStartup] = useState<any>(null);
  const [loadingStartup, setLoadingStartup] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommendation' | 'options' | 'validation' | 'details'>('recommendation');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [isPivotGuideOpen, setIsPivotGuideOpen] = useState(false);
  const router = useRouter();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  const loadStartup = async () => {
    if (!supabase) return;
    try {
      setLoadingStartup(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth');
        return;
      }

      // Usar selectedProjectId del hook o leer de localStorage como fallback
      const projectId = selectedProjectId || localStorage.getItem("selected_project_id");
      
      let query = supabase
        .from('startups')
        .select('*');
      
      if (projectId) {
        query = query.eq('id', projectId).eq('student_id', session.user.id);
      } else {
        query = query.eq('student_id', session.user.id);
      }
      
      const { data: startupData, error } = await query.maybeSingle();

      if (error || !startupData) {
        console.error('Error loading startup:', error);
        return;
      }

      setStartup(startupData);
    } catch (error) {
      console.error('Error loading startup:', error);
    } finally {
      setLoadingStartup(false);
    }
  };

  // Inicializar cliente solo en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    if (supabase) {
      // Limpiar análisis cuando cambia el proyecto para evitar mezclar datos
      setAnalysis(null);
      setAnalysisId(null);
      loadStartup();
    }
  }, [supabase, selectedProjectId]);
  
  // También escuchar cambios en localStorage como respaldo
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected_project_id') {
        // Limpiar análisis cuando cambia el proyecto
        setAnalysis(null);
        setAnalysisId(null);
        loadStartup();
      }
    };

    const handleCustomStorageChange = () => {
      // Limpiar análisis cuando cambia el proyecto
      setAnalysis(null);
      setAnalysisId(null);
      loadStartup();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('project-selected', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-selected', handleCustomStorageChange);
    };
  }, []);

  const handleAnalyze = async (formData: any) => {
    if (!supabase) return;
    if (!startup) {
      setFeedback({
        type: 'info',
        title: 'Registra tu startup',
        message: 'Primero debes tener una startup registrada para usar el Pivot Engine.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setFeedback({
          type: 'error',
          title: 'Sesión requerida',
          message: 'Debes iniciar sesión para continuar.',
        });
        return;
      }

      const accessToken = session.access_token;

      const response = await fetch('/api/pivot-engine/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          startupId: startup.id,
          studentId: session.user.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al analizar');
      }

      const result = await response.json();
      setAnalysisId(result.analysisId);
      setAnalysis(result);
      setActiveTab('recommendation');
    } catch (error: any) {
      console.error('Error:', error);
      setFeedback({
        type: 'error',
        title: 'Error al analizar',
        message: error?.message || 'Ocurrió un error al analizar el pivot.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDecision = async (selectedOption: 'option_1' | 'option_2' | 'option_3' | null) => {
    if (!supabase) return;
    if (!analysisId || !selectedOption || !analysis) return;

    try {
      // Obtener la opción seleccionada del análisis
      const optionIndex = selectedOption === 'option_1' ? 0 : selectedOption === 'option_2' ? 1 : 2;
      const selectedPivotOption = analysis.orchestratorRecommendation?.pivot_options_ranked?.[optionIndex];

      if (!selectedPivotOption) {
        throw new Error('No se encontró la opción seleccionada');
      }

      // Actualizar el análisis con la decisión
      const { error: updateError } = await supabase
        .from('pivot_analysis')
        .update({
          selected_option: selectedOption,
          execution_status: 'in_execution',
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      // Actualizar estado de la startup si procede con pivot
      if (startup) {
        await supabase
          .from('startups')
          .update({ stage: 'validation' }) // Resetear a validación para nuevo mercado
          .eq('id', startup.id);
      }

      // Crear OKRs automáticamente basados en el plan de acción del pivot
      await createOKRsFromPivot(selectedPivotOption, startup.id);

      // Mostrar mensaje de éxito motivador
      setFeedback({
        type: 'success',
        title: 'Pivot guardado exitosamente',
        message: 'Se han creado tus OKRs para comenzar a ejecutar tu nuevo plan. ¡Vamos a por ello!',
      });

      // Redirigir al dashboard para ver los OKRs
      router.push('/dashboard/okrs');
    } catch (error: any) {
      console.error('Error saving decision:', error);
      setFeedback({
        type: 'error',
        title: 'Error al guardar decisión',
        message: error?.message || 'No se pudo guardar la decisión del pivot.',
      });
    }
  };

  const createOKRsFromPivot = async (pivotOption: any, startupId: string) => {
    if (!supabase) return;
    try {
      // Obtener el plan de acción
      const actionPlan = pivotOption.action_plan_2_weeks;
      
      if (!actionPlan) {
        console.warn('No hay plan de acción en el pivot, no se crearán OKRs automáticamente');
        return;
      }

      // Detectar todas las semanas disponibles en el plan de acción
      const availableWeeks: number[] = [];
      for (let i = 1; i <= 12; i++) {
        if (actionPlan[`week_${i}`]) {
          availableWeeks.push(i);
        }
      }

      if (availableWeeks.length === 0) {
        console.warn('No se encontraron semanas en el plan de acción');
        return;
      }

      // Obtener el número de semana más alto actual para continuar desde ahí
      const { data: existingOKRs } = await supabase
        .from('okrs')
        .select('week_number')
        .eq('startup_id', startupId)
        .order('week_number', { ascending: false })
        .limit(1);

      const startWeekNumber = existingOKRs && existingOKRs.length > 0 
        ? existingOKRs[0].week_number + 1 
        : 1;

      // Crear OKRs para todas las semanas encontradas, empezando desde la semana 1
      for (let i = 0; i < availableWeeks.length; i++) {
        const weekIndex = availableWeeks[i];
        const weekData = actionPlan[`week_${weekIndex}`];
        
        if (!weekData) continue;

        // Extraer acciones de la semana
        const weekActions = Array.isArray(weekData) 
          ? weekData 
          : typeof weekData === 'string'
          ? [weekData]
          : Object.values(weekData).filter(v => typeof v === 'string');

        if (weekActions.length === 0) continue;

        // Determinar el número de semana para el OKR (empezar desde 1)
        const okrWeekNumber = startWeekNumber + i;

        // Crear el objetivo según la semana
        const objective = weekIndex === 1
          ? `Ejecutar pivot: ${pivotOption.option_name || 'Nueva dirección'}`
          : weekIndex === availableWeeks.length
          ? `Finalizar ejecución del pivot: ${pivotOption.option_name || 'Nueva dirección'}`
          : `Continuar ejecución del pivot (Semana ${weekIndex}): ${pivotOption.option_name || 'Nueva dirección'}`;

        const { error: okrError } = await supabase
          .from('okrs')
          .insert({
            startup_id: startupId,
            week_number: okrWeekNumber,
            objective: objective,
            key_result_1: weekActions[0] || 'Iniciar ejecución del pivot',
            key_result_2: weekActions[1] || weekActions[0] || 'Continuar con el plan',
            key_result_3: weekActions[2] || weekActions[0] || 'Validar progreso',
            kr1_status: 'not_started',
            kr2_status: 'not_started',
            kr3_status: 'not_started',
          });

        if (okrError) {
          console.error(`Error creando OKR semana ${weekIndex}:`, okrError);
        } else {
        }
      }
    } catch (error: any) {
      console.error('Error creando OKRs desde pivot:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const FeedbackBanner = () => {
    if (!feedback) return null;

    const styles = {
      success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: <Info className="h-5 w-5 text-blue-600" />,
      },
    }[feedback.type];

    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className={`mb-4 rounded-xl border ${styles.border} ${styles.bg} shadow-sm`}>
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5">{styles.icon}</div>
            <div className="flex-1">
              <p className={`font-semibold ${styles.text}`}>{feedback.title}</p>
              <p className={`text-sm ${styles.text} mt-0.5`}>{feedback.message}</p>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loadingStartup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pivotEngineTutorialSteps = [
    {
      id: "welcome",
      title: "¡Bienvenido al Pivot Engine!",
      description: "El Pivot Engine analiza si tu startup necesita cambiar de dirección. Usa múltiples agentes de IA para evaluar opciones de pivot en mercado, técnica, finanzas y validación.",
      position: "center" as const,
    },
    {
      id: "form",
      title: "Completa el Formulario",
      description: "Describe tu situación actual: qué problemas enfrentas, qué mercados alternativos consideras y qué restricciones tienes. Mientras más detallado, mejor será el análisis.",
      target: "[data-tutorial='pivot-form']",
      position: "bottom" as const,
    },
    {
      id: "analyze",
      title: "Analizar Pivot",
      description: "Haz clic en 'Analizar Pivot' para que 4 agentes especializados evalúen tus opciones. El proceso toma unos minutos y recibirás recomendaciones detalladas.",
      target: "[data-tutorial='analyze-button']",
      position: "top" as const,
    },
    {
      id: "results",
      title: "Ver Resultados",
      description: "Después del análisis, verás 3 opciones de pivot rankeadas con análisis de mercado, factibilidad técnica, viabilidad financiera y plan de validación.",
      target: "[data-tutorial='results']",
      position: "top" as const,
    },
  ];

  if (!startup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <FeedbackBanner />

        <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-6">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-blue-200/20 rounded-full blur-2xl animate-pulse" />
                  <AlertCircle className="h-16 w-16 text-blue-500 mx-auto relative opacity-80" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">No hay startup registrada</h3>
                  <p className="text-gray-600 text-base max-w-md mx-auto leading-relaxed">
                    Primero debes registrar tu startup en el Constructor de Startup
                  </p>
                </div>
                <div className="pt-2">
                  <Button 
                    asChild
                    size="lg"
                    className="group relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-800 text-white font-semibold text-base px-8 py-6 h-auto rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                  >
                    <Link href="/dashboard/startup-builder">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <div className="relative flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                          <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                        </div>
                        <span>Ir al Constructor de Startup</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TutorialOverlay
          steps={pivotEngineTutorialSteps}
          storageKey="pivot-engine"
          title="Tutorial del Pivot Engine"
          description="Aprende a usar el motor de análisis de pivots"
        />
        <FeedbackBanner />

        <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
          {/* Header simplificado */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 border border-blue-200">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Análisis de Pivot</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Análisis inteligente para decisiones de pivot informadas
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <Target className="h-3 w-3 mr-1" />
                Multi-Agente
              </Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Recomendaciones IA
              </Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Plan de Acción
              </Badge>
            </div>
          </div>

          {/* Información sobre Pivot - Collapsible */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <Collapsible open={isPivotGuideOpen} onOpenChange={setIsPivotGuideOpen}>
                <CollapsibleTrigger className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                  <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900">
                    <Info className="h-4 w-4 text-blue-600" />
                    ¿Cuándo deberías pivotear? (Guía Rápida)
                  </h3>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isPivotGuideOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="space-y-3 pt-2 text-sm text-gray-700">
                    <p className="leading-relaxed">
                      <strong>Pivotear</strong> significa cambiar estratégicamente la dirección de tu startup cuando detectas que tu modelo actual no está funcionando como esperabas. 
                      No es rendirse, sino <strong>adaptarse inteligentemente</strong> basándote en lo que has aprendido.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-900">Ejemplos de pivots comunes:</h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>Cambiar de mercado objetivo (B2C → B2B)</li>
                          <li>Modificar el modelo de negocio (freemium → suscripción)</li>
                          <li>Cambiar el producto principal</li>
                          <li>Ajustar el stack tecnológico</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-900">¿Cuándo considerar un pivot?</h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>Bajo engagement o retención de usuarios</li>
                          <li>Alto CAC o dificultad para adquirir clientes</li>
                          <li>Falta de product-market fit</li>
                          <li>Cambios significativos en el mercado</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        💡 <strong>Dato importante:</strong> El 68% de las startups estudiantiles pivotean en los primeros 3 meses. 
                        Pivotear a tiempo puede ser la diferencia entre el éxito y el fracaso.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Formulario de análisis */}
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Iniciar Análisis
                    <HelpTooltip
                      content="Completa el formulario con información detallada sobre tu situación actual, problemas, mercados alternativos y restricciones. Mientras más específico, mejor será el análisis."
                      variant="info"
                    />
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Completa el formulario con la información de tu startup y las razones para pivotear
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("tutorial_pivot-engine_completed");
                    window.location.reload();
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Tutorial
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PivotAnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} startup={startup} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <FeedbackBanner />

      <div className="space-y-6 max-w-7xl mx-auto px-4 py-8" data-tutorial="results">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Pivot Engine</span>
          <span>/</span>
          <span className="text-gray-800 font-medium">Análisis</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Análisis de Pivot
              </h1>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            </div>
            <p className="text-sm text-gray-600">Recomendaciones basadas en análisis multi-agente</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
              onClick={() => {
                localStorage.removeItem("tutorial_pivot-engine_completed");
                window.location.reload();
              }}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Tutorial
            </Button>
          </div>
        </div>

        {/* Dashboard de Métricas - Simplificado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {analysis.orchestratorRecommendation?.pivot_options_ranked?.slice(0, 3).map((option: any, idx: number) => {
            const score = option.success_probability || option.overall_score || 0;
            const colors = [
              { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-600' },
              { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600' },
              { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-600' }
            ];
            const color = colors[idx] || colors[2];
            return (
              <Card key={idx} className={`border ${color.border} ${color.bg} hover:shadow-md transition-shadow`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`${color.badge} text-white text-xs`}>
                      Opción {idx + 1}
                    </Badge>
                    <div className={`text-2xl font-bold ${color.text}`}>
                      {score}%
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm truncate">
                    {option.option_name || `Opción ${idx + 1}`}
                  </h3>
                  <p className="text-xs text-gray-500">Probabilidad de éxito</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs Navigation - Simplificada */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === 'recommendation' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('recommendation')}
            className={`flex items-center gap-2 transition-all rounded-t-lg text-sm whitespace-nowrap px-4 py-2 border-b-2 ${
              activeTab === 'recommendation' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'hover:bg-gray-50 text-gray-700 border-transparent'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Recomendación</span>
          </Button>
          <Button
            variant={activeTab === 'options' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('options')}
            className={`flex items-center gap-2 transition-all rounded-t-lg text-sm whitespace-nowrap px-4 py-2 border-b-2 ${
              activeTab === 'options' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'hover:bg-gray-50 text-gray-700 border-transparent'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Opciones</span>
            <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-xs">
              {analysis.orchestratorRecommendation?.pivot_options_ranked?.length || 0}
            </Badge>
          </Button>
          <Button
            variant={activeTab === 'validation' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('validation')}
            className={`flex items-center gap-2 transition-all rounded-t-lg text-sm whitespace-nowrap px-4 py-2 border-b-2 ${
              activeTab === 'validation' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'hover:bg-gray-50 text-gray-700 border-transparent'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Validación</span>
          </Button>
          <Button
            variant={activeTab === 'details' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 transition-all rounded-t-lg text-sm whitespace-nowrap px-4 py-2 border-b-2 ${
              activeTab === 'details' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'hover:bg-gray-50 text-gray-700 border-transparent'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Detalles</span>
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'recommendation' && (
          <div className="space-y-6">
            {/* Recomendación principal */}
            <Card className="border-gray-200 mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 border border-blue-200">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    Recomendación Principal
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {analysis.orchestratorRecommendation?.orchestrator_recommendation?.recommended_option || 'Opción Recomendada'}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {analysis.orchestratorRecommendation?.orchestrator_recommendation?.rationale || 'Sin rationale disponible'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Métricas clave */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="border border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <CardTitle className="text-sm font-semibold text-gray-900">Éxito de Mercado</CardTitle>
                      </div>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {analysis.marketAnalysis?.market_ranking?.[0]?.score || 'N/A'}%
                      </div>
                      <p className="text-xs text-gray-500">Probabilidad de éxito</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="h-4 w-4 text-blue-600" />
                        <CardTitle className="text-sm font-semibold text-gray-900">Viabilidad Técnica</CardTitle>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {analysis.technicalAnalysis?.feasibility_ranking?.[0]?.feasibility_score || 'N/A'}%
                      </div>
                      <p className="text-xs text-gray-500">Factibilidad técnica</p>
                    </CardContent>
                  </Card>
                  <Card className={`border ${
                    analysis.financeAnalysis?.finance_analysis?.[0]?.is_financially_viable 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-orange-200 bg-orange-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className={`h-4 w-4 ${
                          analysis.financeAnalysis?.finance_analysis?.[0]?.is_financially_viable 
                            ? 'text-green-600' 
                            : 'text-orange-600'
                        }`} />
                        <CardTitle className="text-sm font-semibold text-gray-900">Viabilidad Financiera</CardTitle>
                      </div>
                      <div className={`text-3xl font-bold mb-1 ${
                        analysis.financeAnalysis?.finance_analysis?.[0]?.is_financially_viable 
                          ? 'text-green-600' 
                          : 'text-orange-600'
                      }`}>
                        {analysis.financeAnalysis?.finance_analysis?.[0]?.is_financially_viable ? '✓' : '✗'}
                      </div>
                      <p className="text-xs text-gray-500">
                        {analysis.financeAnalysis?.finance_analysis?.[0]?.is_financially_viable ? 'Financieramente viable' : 'No viable'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Plan de acción mejorado */}
                {analysis.orchestratorRecommendation?.orchestrator_recommendation?.next_steps && (
                  <Card className="border border-blue-100 bg-white/60 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-800">
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                        <span className="break-words">Plan de Acción (Próximas 2 Semanas)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2 sm:space-y-3">
                        {analysis.orchestratorRecommendation.orchestrator_recommendation.next_steps.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors border border-blue-100/50">
                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm">
                              {i + 1}
                            </div>
                            <span className="flex-1 text-sm sm:text-base text-gray-700 leading-relaxed pt-0.5 sm:pt-1">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}

                {/* Botón para agendar mentor mejorado */}
                <Button className="relative w-full overflow-hidden bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm md:text-base px-3 sm:px-5 md:px-8 py-3 sm:py-4 md:py-6 h-auto rounded-xl shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 group border border-cyan-500/30">
                  {/* Efecto de brillo animado */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  
                  {/* Contenido del botón */}
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-white/20 group-hover:bg-white/30 backdrop-blur-sm transition-all duration-300 shadow-md group-hover:scale-105">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 drop-shadow-sm" />
                    </div>
                    <span className="text-center font-semibold tracking-wide drop-shadow-sm break-words">Agendar Sesión con Mentor para Confirmar</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 drop-shadow-sm hidden sm:block" />
                  </div>
                  
                  {/* Efecto de partículas decorativas */}
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white/40 rounded-full group-hover:bg-white/60 transition-all duration-300"></div>
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/30 rounded-full group-hover:bg-white/50 transition-all duration-300"></div>
                </Button>
                <p className="text-center text-xs sm:text-sm text-gray-600 mt-2">
                  Nota: esta funcionalidad está en desarrollo y estará disponible pronto.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'options' && (
          <PivotOptionsDisplay analysis={analysis} />
        )}

        {activeTab === 'validation' && (
          <PivotValidationPlan validation={analysis.validationAnalysis} />
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Market Agent */}
            <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50/30 via-transparent to-transparent dark:from-green-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold">Market Agent</div>
                      <div className="text-sm font-normal text-muted-foreground">Análisis de Mercado</div>
                    </div>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(analysis.marketAnalysis, null, 2));
                    }}
                    className="hover:bg-green-500/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="bg-gradient-to-br from-background via-muted/30 to-background p-4 sm:p-6 rounded-xl border-2 border-green-500/20 shadow-inner overflow-auto max-h-[300px] sm:max-h-[500px] md:max-h-[600px]">
                  <pre className="text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                    <code className="text-foreground">
                      {JSON.stringify(analysis.marketAnalysis, null, 2)}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Technical Agent */}
            <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/30 via-transparent to-transparent dark:from-blue-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                      <Code className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold">Technical Agent</div>
                      <div className="text-sm font-normal text-muted-foreground">Análisis Técnico</div>
                    </div>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(analysis.technicalAnalysis, null, 2));
                    }}
                    className="hover:bg-blue-500/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="bg-gradient-to-br from-background via-muted/30 to-background p-6 rounded-xl border-2 border-blue-500/20 shadow-inner overflow-auto max-h-[600px]">
                  <pre className="text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                    <code className="text-foreground">
                      {JSON.stringify(analysis.technicalAnalysis, null, 2)}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Finance Agent */}
            <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-50/30 via-transparent to-transparent dark:from-orange-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                      <DollarSign className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-bold">Finance Agent</div>
                      <div className="text-sm font-normal text-muted-foreground">Análisis Financiero</div>
                    </div>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(analysis.financeAnalysis, null, 2));
                    }}
                    className="hover:bg-orange-500/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="bg-gradient-to-br from-background via-muted/30 to-background p-6 rounded-xl border-2 border-orange-500/20 shadow-inner overflow-auto max-h-[600px]">
                  <pre className="text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                    <code className="text-foreground">
                      {JSON.stringify(analysis.financeAnalysis, null, 2)}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Validation Agent */}
            <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-50/30 via-transparent to-transparent dark:from-purple-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold">Validation Agent</div>
                      <div className="text-sm font-normal text-muted-foreground">Plan de Validación</div>
                    </div>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(analysis.validationAnalysis, null, 2));
                    }}
                    className="hover:bg-purple-500/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="bg-gradient-to-br from-background via-muted/30 to-background p-6 rounded-xl border-2 border-purple-500/20 shadow-inner overflow-auto max-h-[600px]">
                  <pre className="text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                    <code className="text-foreground">
                      {JSON.stringify(analysis.validationAnalysis, null, 2)}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Guardar decisión mejorado */}
        <Card className="border-2 border-blue-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              ¿Qué vas a hacer?
            </CardTitle>
            <CardDescription className="text-base">
              Selecciona una opción para comenzar a ejecutar tu pivot. Se crearán OKRs automáticamente para ayudarte a avanzar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                className="relative h-auto py-4 md:py-6 overflow-hidden bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm md:text-base rounded-xl shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 group border border-cyan-500/30"
                onClick={() => handleSaveDecision('option_1')}
              >
                {/* Efecto de brillo animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                
                {/* Contenido del botón */}
                <div className="relative z-10 flex flex-col items-center gap-2 md:gap-3 px-2">
                  <div className="p-2 md:p-3 rounded-lg bg-white/20 group-hover:bg-white/30 backdrop-blur-sm transition-all duration-300 shadow-md group-hover:scale-105">
                    <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 drop-shadow-sm" />
                  </div>
                  <span className="font-semibold text-center leading-tight break-words drop-shadow-sm">Proceder con Pivot Recomendado</span>
                  <span className="text-xs md:text-sm opacity-90 font-medium text-center drop-shadow-sm">Se crearán OKRs automáticamente</span>
                </div>
                
                {/* Efecto de partículas decorativas */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white/40 rounded-full group-hover:bg-white/60 transition-all duration-300"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/30 rounded-full group-hover:bg-white/50 transition-all duration-300"></div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 border-2 hover:bg-muted transition-all"
                onClick={() => setActiveTab('options')}
              >
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <span>Ver Otras Opciones</span>
                  <span className="text-xs text-muted-foreground">Explorar alternativas</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="h-auto py-6 hover:bg-muted/50 transition-all"
                onClick={() => {
                  setAnalysis(null);
                  setAnalysisId(null);
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-muted-foreground" />
                  <span>Esperar y Reanalizar</span>
                  <span className="text-xs text-muted-foreground">Guardar para después</span>
                </div>
              </Button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-500/20">
              <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>💡 Tip:</strong> Al seleccionar un pivot, se crearán OKRs automáticamente basados en el plan de acción. 
                  Podrás verlos y gestionarlos en la sección de OKRs.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

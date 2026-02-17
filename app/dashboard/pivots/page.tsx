'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Trash2, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Calendar,
  ArrowRight,
  Loader2,
  AlertTriangle,
  ExternalLink,
  BarChart3,
  Clock,
  Info,
  X,
  PlayCircle,
  Rocket,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/components/ui/loading-state';
import { useSelectedProject } from '@/lib/hooks/useSelectedProject';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PivotAnalysis {
  id: string;
  startup_id: string;
  analysis_date: string;
  current_situation: any;
  market_data: any;
  constraints: any;
  pivot_options: any;
  orchestrator_recommendation: any;
  selected_option: string | null;
  execution_status: string;
  created_at: string;
  updated_at: string;
}

export default function PivotsPage() {
  const [pivots, setPivots] = useState<PivotAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [pivotToDelete, setPivotToDelete] = useState<PivotAnalysis | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [startup, setStartup] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const supabase = createClient();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  // Escuchar cambios en el proyecto seleccionado
  useEffect(() => {
    // Limpiar datos cuando cambia el proyecto para evitar mezclar información
    setPivots([]);
    setStartup(null);
    loadPivots();
  }, [selectedProjectId]);

  // También escuchar cambios en localStorage como respaldo
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected_project_id') {
        loadPivots();
      }
    };

    // Escuchar cambios en localStorage desde otras pestañas
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar cambios en localStorage desde la misma pestaña usando un custom event
    const handleCustomStorageChange = () => {
      loadPivots();
    };
    
    window.addEventListener('project-selected', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-selected', handleCustomStorageChange);
    };
  }, []);

  const loadPivots = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Usar selectedProjectId del hook o leer de localStorage como fallback
      const projectId = selectedProjectId || localStorage.getItem("selected_project_id");
      
      // Cargar startup - use selected project or fallback to first one
      let query = supabase
        .from('startups')
        .select('*');
      
      if (projectId) {
        query = query.eq('id', projectId);
      } else {
        query = query.eq('student_id', user.id);
      }
      
      const { data: startupData } = await query.maybeSingle();
      
      if (!startupData) {
        setStartup(null);
        setPivots([]);
        setLoading(false);
        return;
      }

      if (startupData) {
        setStartup(startupData);

        // Cargar pivots
        const { data: pivotsData, error } = await supabase
          .from('pivot_analysis')
          .select('*')
          .eq('startup_id', startupData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (pivotsData) {
          setPivots(pivotsData);
        }
      }
    } catch (error: any) {
      console.error('Error loading pivots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pivotToDelete) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from('pivot_analysis')
        .delete()
        .eq('id', pivotToDelete.id);

      if (error) throw error;

      setPivotToDelete(null);
      await loadPivots();
    } catch (error: any) {
      console.error('Error deleting pivot:', error);
      setFeedback({
        type: 'error',
        title: 'No se pudo eliminar el pivot',
        message: error?.message || 'Inténtalo nuevamente en unos segundos.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
      'analyzed': { label: 'Analizado', variant: 'secondary', className: 'bg-gray-100 text-gray-700' },
      'scheduled_mentor': { label: 'Agendado', variant: 'secondary', className: 'bg-amber-100 text-amber-700' },
      'in_execution': { label: 'En ejecución', variant: 'default', className: 'bg-blue-600 text-white' },
      'completed': { label: 'Completado', variant: 'default', className: 'bg-green-600 text-white' },
      'abandoned': { label: 'Abandonado', variant: 'destructive', className: 'bg-red-100 text-red-700' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const, className: '' };
    
    return (
      <Badge variant={statusInfo.variant} className={`text-xs ${statusInfo.className}`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getSelectedOption = (pivot: PivotAnalysis) => {
    if (!pivot.selected_option) return null;
    
    const optionIndex = pivot.selected_option === 'option_1' ? 0 : 
                       pivot.selected_option === 'option_2' ? 1 : 2;
    
    return pivot.orchestrator_recommendation?.pivot_options_ranked?.[optionIndex];
  };

  const FeedbackBanner = () => {
    if (!feedback) return null;

    const styles = {
      success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: <Info className="h-4 w-4 text-blue-600" />,
      },
    }[feedback.type];

    return (
      <div className="mb-4">
        <div className={`rounded-lg border ${styles.border} ${styles.bg} p-3`}>
          <div className="flex items-start gap-2">
            <div className="mt-0.5">{styles.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${styles.text}`}>{feedback.title}</p>
              <p className={`text-xs ${styles.text} mt-0.5`}>{feedback.message}</p>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading) {
    return <LoadingState message="Cargando pivots..." />;
  }

  // Mostrar mensaje si no hay startup
  if (!startup) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

  const totalPivots = pivots.length;
  const executing = pivots.filter((p) => p.execution_status === 'in_execution').length;
  const completed = pivots.filter((p) => p.execution_status === 'completed').length;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FeedbackBanner />

        {/* Header compacto */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pivots</h1>
              <p className="text-sm text-gray-600 mt-1">Análisis de pivot y planes de ejecución</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/ideapivotengine">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Crear pivot
                </Button>
              </Link>
              <Link href="/dashboard/okrs">
                <Button size="sm" variant="outline">
                  <Target className="mr-2 h-4 w-4" />
                  OKRs
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats compactas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Total</span>
                <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-900">{totalPivots}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">En ejecución</span>
                <PlayCircle className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-xl font-semibold text-blue-600">{executing}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Completados</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              </div>
              <p className="text-xl font-semibold text-green-600">{completed}</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        {pivots.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="max-w-md mx-auto space-y-5">
                <div className="flex justify-center">
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-400">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">No hay pivots</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Crea tu primer análisis de pivot para explorar opciones y generar OKRs automáticamente.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/ideapivotengine">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Crea tu primer pivot
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pivots.map((pivot) => {
              const selectedOption = getSelectedOption(pivot);
              const recommendation = pivot.orchestrator_recommendation?.orchestrator_recommendation;

              return (
                <Card key={pivot.id} className="border-gray-200 hover:border-gray-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header del pivot */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              Análisis {formatDate(pivot.created_at)}
                            </h3>
                            {getStatusBadge(pivot.execution_status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDateTime(pivot.created_at)}
                            </span>
                            {pivot.updated_at !== pivot.created_at && (
                              <span className="flex items-center gap-1">
                                Actualizado: {formatDateTime(pivot.updated_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/ideapivotengine?analysisId=${pivot.id}`}>
                            <Button variant="ghost" size="sm" className="h-8">
                              Ver análisis
                              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPivotToDelete(pivot)}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Opción seleccionada o recomendación */}
                      {selectedOption ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Seleccionado</span>
                                {selectedOption.success_probability && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                    {selectedOption.success_probability}% éxito
                                  </Badge>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                {selectedOption.option_name || 'Pivot seleccionado'}
                              </h4>
                              <p className="text-xs text-gray-700 line-clamp-2">
                                {selectedOption.rationale || recommendation?.rationale || 'Sin descripción'}
                              </p>
                              {pivot.execution_status === 'in_execution' && (
                                <div className="mt-2">
                                  <Link href="/dashboard/okrs">
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100">
                                      Ver OKRs
                                      <ExternalLink className="ml-1 h-3 w-3" />
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : recommendation ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recomendación</span>
                              <h4 className="text-sm font-semibold text-gray-900 mt-1 mb-1">
                                {recommendation.recommended_option || 'Sin recomendación'}
                              </h4>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {recommendation.rationale || 'Revisa el análisis para más detalles.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Plan de acción compacto */}
                      {selectedOption?.action_plan_2_weeks && (
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-700">Plan de acción (2 semanas)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedOption.action_plan_2_weeks.week_1 && (
                              <div className="bg-white border border-gray-200 rounded p-2">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">1</div>
                                  <span className="text-xs font-medium text-gray-700">Semana 1</span>
                                </div>
                                {Array.isArray(selectedOption.action_plan_2_weeks.week_1) ? (
                                  <ul className="space-y-1">
                                    {selectedOption.action_plan_2_weeks.week_1.slice(0, 3).map((action: string, i: number) => (
                                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                        <span className="text-blue-600 mt-0.5">•</span>
                                        <span className="line-clamp-1">{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {typeof selectedOption.action_plan_2_weeks.week_1 === 'string'
                                      ? selectedOption.action_plan_2_weeks.week_1
                                      : 'Plan disponible'}
                                  </p>
                                )}
                              </div>
                            )}
                            {selectedOption.action_plan_2_weeks.week_2 && (
                              <div className="bg-white border border-gray-200 rounded p-2">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-5 h-5 rounded-full bg-gray-600 text-white text-xs font-semibold flex items-center justify-center">2</div>
                                  <span className="text-xs font-medium text-gray-700">Semana 2</span>
                                </div>
                                {Array.isArray(selectedOption.action_plan_2_weeks.week_2) ? (
                                  <ul className="space-y-1">
                                    {selectedOption.action_plan_2_weeks.week_2.slice(0, 3).map((action: string, i: number) => (
                                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                        <span className="text-gray-600 mt-0.5">•</span>
                                        <span className="line-clamp-1">{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {typeof selectedOption.action_plan_2_weeks.week_2 === 'string'
                                      ? selectedOption.action_plan_2_weeks.week_2
                                      : 'Plan disponible'}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog de eliminación */}
        <AlertDialog open={!!pivotToDelete} onOpenChange={(open) => !open && !deleting && setPivotToDelete(null)}>
          <AlertDialogContent className="bg-white border border-gray-200 max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                  Eliminar análisis de pivot
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-sm space-y-2 pt-2">
                <p className="text-gray-700">
                  Estás a punto de eliminar el análisis del{' '}
                  <span className="font-semibold">
                    {pivotToDelete && formatDate(pivotToDelete.created_at)}
                  </span>.
                </p>
                {pivotToDelete?.execution_status === 'in_execution' && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-700">
                        Este pivot está en ejecución. Los OKRs relacionados no se eliminarán automáticamente.
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-red-700 font-medium">
                  Esta acción no se puede deshacer.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3 sm:gap-4">
              <AlertDialogCancel
                disabled={deleting}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 border-2 border-red-400/30 hover:border-red-500/50 rounded-lg px-6 py-2.5 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {/* Efecto de brillo animado */}
                {!deleting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                )}
                
                {/* Contenido del botón */}
                <span className="relative z-10 flex items-center gap-2">
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin drop-shadow-sm" />
                      <span className="drop-shadow-sm">Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 drop-shadow-sm" />
                      <span className="drop-shadow-sm">Eliminar</span>
                    </>
                  )}
                </span>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

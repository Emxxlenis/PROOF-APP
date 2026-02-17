"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Eye,
  MousePointerClick,
  Target,
  Lightbulb,
  ArrowRight,
  Plus,
  Rocket,
  ClipboardCheck,
  BarChart3,
  AlertCircle,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ValidationPage() {
  const [startup, setStartup] = useState<any>(null);
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [seanEllisResults, setSeanEllisResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "validated" | "pending">("all");
  const [deletingHypothesisId, setDeletingHypothesisId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hypothesisToDelete, setHypothesisToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  // Escuchar cambios en el proyecto seleccionado
  useEffect(() => {
    // Limpiar datos cuando cambia el proyecto para evitar mezclar información
    setStartup(null);
    setLandingPages([]);
    setHypotheses([]);
    setSeanEllisResults(null);
    loadData();
  }, [selectedProjectId]);

  // También escuchar cambios en localStorage como respaldo
  useEffect(() => {
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

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-selected', handleCustomStorageChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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

        // Load landing pages
        const { data: pages } = await supabase
          .from("landing_pages")
          .select("*")
          .eq("startup_id", startupData.id)
          .order("created_at", { ascending: false });

        if (pages) setLandingPages(pages);

        // Load hypotheses
        const { data: hyps } = await supabase
          .from("hypotheses")
          .select("*")
          .eq("startup_id", startupData.id)
          .order("created_at", { ascending: false });

        if (hyps) setHypotheses(hyps);

        // Load Sean Ellis results
        const { data: tests } = await supabase
          .from("sean_ellis_tests")
          .select("*")
          .eq("startup_id", startupData.id)
          .order("created_at", { ascending: false });

        if (tests && tests.length > 0) {
          const total = tests.length;
          const passed = tests.filter((t: any) => t.passed_threshold).length;
          setSeanEllisResults({
            total,
            passed,
            passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
          });
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (hypothesisId: string, newStatus: 'draft' | 'validated' | 'invalidated') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Debes iniciar sesión");
        return;
      }

      const response = await fetch(`/api/hypothesis/${hypothesisId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          // Mantener los valores actuales
          si_clause: hypotheses.find(h => h.id === hypothesisId)?.si_clause || "",
          entonces_clause: hypotheses.find(h => h.id === hypothesisId)?.entonces_clause || "",
          porque_clause: hypotheses.find(h => h.id === hypothesisId)?.porque_clause || "",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el estado");
      }

      // Actualizar el estado local inmediatamente (optimistic update)
      setHypotheses(prev => prev.map(h => 
        h.id === hypothesisId 
          ? { 
              ...h, 
              status: newStatus, 
              is_validated: newStatus === 'validated',
              // Mantener compatibilidad con código que usa is_validated
            }
          : h
      ));

      // Recargar los datos en segundo plano
      loadData().catch(err => {
        console.error("Error recargando datos:", err);
      });
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al actualizar el estado");
      // Recargar para revertir el cambio optimista
      loadData();
    }
  };

  const handleDeleteHypothesis = async (hypothesisId: string) => {
    // Prevenir doble clic
    if (deletingHypothesisId === hypothesisId) return;
    
    try {
      setDeletingHypothesisId(hypothesisId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Debes iniciar sesión");
        setDeletingHypothesisId(null);
        setDeleteDialogOpen(false);
        return;
      }

      const response = await fetch(`/api/hypothesis/${hypothesisId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar la hipótesis");
      }

      // Actualizar el estado local inmediatamente (optimistic update)
      setHypotheses(prev => prev.filter(h => h.id !== hypothesisId));
      
      // Cerrar el diálogo y resetear estados
      setDeleteDialogOpen(false);
      setHypothesisToDelete(null);
      setDeletingHypothesisId(null);

      // Recargar los datos en segundo plano
      loadData().catch(err => {
        console.error("Error recargando datos:", err);
      });
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al eliminar la hipótesis");
      setDeletingHypothesisId(null);
      setHypothesisToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Función para verificar si la startup tiene la información completa
  const isStartupComplete = () => {
    if (!startup) return false;
    return !!(
      startup.problem &&
      startup.target_audience &&
      startup.market_opportunity &&
      startup.competitive_advantage
    );
  };

  // Función para obtener los campos faltantes
  const getMissingFields = () => {
    if (!startup) return [];
    const missing: string[] = [];
    if (!startup.problem) missing.push("Problema");
    if (!startup.target_audience) missing.push("Usuario");
    if (!startup.market_opportunity) missing.push("Oportunidad");
    if (!startup.competitive_advantage) missing.push("Ventaja");
    return missing;
  };

  const handleGenerateHypothesis = async () => {
    if (!startup) return;

    // Validar que la startup tenga la información completa
    if (!isStartupComplete()) {
      const missingFields = getMissingFields();
      setError(`Completa la información de tu startup antes de generar hipótesis. Campos faltantes: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const problema = startup.problem;
      const usuario = startup.target_audience;
      const por_que_ahora = startup.market_opportunity;
      const riesgo = startup.competitive_advantage;

      const response = await fetch("/api/hypothesis/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          startupId: startup.id,
          problema,
          usuario,
          por_que_ahora,
          riesgo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar hipótesis");
      }

      await loadData();
      setError(null);
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al generar hipótesis");
    } finally {
      setGenerating(false);
    }
  };

  const filteredHypotheses = hypotheses.filter(hyp => {
    if (activeTab === "all") return true;
    if (activeTab === "validated") return hyp.status === 'validated' || hyp.is_validated;
    if (activeTab === "pending") return hyp.status !== 'validated' && !hyp.is_validated;
    return true;
  });

  if (loading) {
    return <LoadingState message="Cargando validaciones..." />;
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <EmptyState
            title="Crea tu Startup Primero"
            message="Para validar tu idea necesitas primero registrar tu startup en el constructor."
            action={
              <Link href="/dashboard/startup-builder">
                <Button 
                  size="lg"
                  className="group relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-800 text-white font-semibold text-base px-8 py-6 h-auto rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                      <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <span>Ir al Constructor de Startup</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </Button>
              </Link>
            }
            fullScreen={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              Validación Temprana
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Valida tu idea con hipótesis, landing pages y encuestas
            </p>
          </div>
          <Link href="/dashboard/validation/landing-page/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-md text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nueva Landing Page</span>
              <span className="sm:hidden">Nueva Landing</span>
            </Button>
          </Link>
        </div>


        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Landing Pages</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{landingPages.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-blue-50 flex-shrink-0 ml-2">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Hipótesis</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{hypotheses.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-cyan-50 flex-shrink-0 ml-2">
                  <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Hipótesis Validadas</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {hypotheses.filter(h => h.status === 'validated' || h.is_validated).length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-emerald-50 flex-shrink-0 ml-2">
                  <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Tasa de Éxito</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{seanEllisResults?.passRate || 0}%</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ml-2 ${(seanEllisResults?.passRate || 0) >= 40 ? 'bg-green-50' : 'bg-amber-50'}`}>
                  <BarChart3 className={`h-5 w-5 sm:h-6 sm:w-6 ${(seanEllisResults?.passRate || 0) >= 40 ? 'text-green-600' : 'text-amber-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hypotheses Section */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
          <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg sm:text-xl">
                  <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
                  Hipótesis de Validación
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Genera y valida hipótesis en formato Si/Entonces/Porque
                </CardDescription>
              </div>
              <Button
                onClick={handleGenerateHypothesis}
                disabled={generating || !isStartupComplete()}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {/* Info Box - Collapsible */}
            <Collapsible defaultOpen={false} className="mb-4 sm:mb-6">
              <CollapsibleTrigger className="w-full p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 hover:bg-blue-100/50 transition-colors text-left">
                <div className="flex items-center gap-2 sm:gap-3">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-gray-800">Ver contexto</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 sm:p-4 rounded-b-xl bg-gradient-to-r from-blue-50 to-cyan-50 border-x border-b border-blue-100">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 mb-2 sm:mb-3">Datos que se usarán para generar hipótesis:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                      <p className={`break-words ${!startup.problem ? 'text-red-600' : ''}`}>
                        <strong>Problema:</strong> {startup.problem || "No definido"}
                      </p>
                      <p className={`break-words ${!startup.target_audience ? 'text-red-600' : ''}`}>
                        <strong>Usuario:</strong> {startup.target_audience || "No definido"}
                      </p>
                      <p className={`break-words ${!startup.market_opportunity ? 'text-red-600' : ''}`}>
                        <strong>Oportunidad:</strong> {startup.market_opportunity || "No definido"}
                      </p>
                      <p className={`break-words ${!startup.competitive_advantage ? 'text-red-600' : ''}`}>
                        <strong>Ventaja:</strong> {startup.competitive_advantage || "No definido"}
                      </p>
                    </div>
                    {!isStartupComplete() && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-amber-800 mb-1">
                              Completa tu startup para generar hipótesis
                            </p>
                            <p className="text-xs text-amber-700 mb-2">
                              Campos faltantes: {getMissingFields().join(", ")}
                            </p>
                            <Link 
                              href="/dashboard/startup-builder" 
                              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 hover:underline"
                            >
                              <ArrowRight className="h-3 w-3" />
                              Ir al Constructor de Startup
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Tabs */}
            {hypotheses.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
                {[
                  { id: "all", label: "Todas", count: hypotheses.length },
                  { id: "validated", label: "Validadas", count: hypotheses.filter(h => h.status === 'validated' || h.is_validated).length },
                  { id: "pending", label: "Pendientes", count: hypotheses.filter(h => (h.status !== 'validated' && !h.is_validated) || h.status === 'invalidated').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            )}

            {/* Hypotheses List */}
            {filteredHypotheses.length === 0 ? (
              <EmptyState
                title="No hay hipótesis todavía"
                message="Genera tu primera hipótesis con ayuda de la IA"
                fullScreen={false}
              />
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredHypotheses.map((hyp: any) => (
                  <div
                    key={hyp.id}
                    className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-800 flex-1 break-words">{hyp.hypothesis_text}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="focus:outline-none">
                              <Badge 
                                className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                                  hyp.status === 'validated' 
                                    ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                    : hyp.status === 'invalidated'
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                }`}
                              >
                                {hyp.status === 'validated' 
                                  ? "Validada" 
                                  : hyp.status === 'invalidated'
                                  ? "Refutada"
                                  : "Pendiente"}
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(hyp.id, 'draft')}
                              className="cursor-pointer"
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Pendiente
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(hyp.id, 'validated')}
                              className="cursor-pointer"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Validada
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(hyp.id, 'invalidated')}
                              className="cursor-pointer"
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Refutada
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialog 
                          open={deleteDialogOpen && hypothesisToDelete === hyp.id} 
                          onOpenChange={(open) => {
                            if (!open) {
                              // Permitir cerrar siempre
                              setDeleteDialogOpen(false);
                              setHypothesisToDelete(null);
                              setDeletingHypothesisId(null);
                            }
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                              onClick={() => {
                                setHypothesisToDelete(hyp.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-2 border-red-200/60 shadow-2xl max-w-[95vw] sm:max-w-md rounded-2xl mx-4 sm:mx-0">
                            <AlertDialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-200/80 border border-red-300/50 shadow-sm flex-shrink-0">
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                </div>
                                <AlertDialogTitle className="text-lg sm:text-xl font-bold text-gray-800">
                                  ¿Eliminar hipótesis?
                                </AlertDialogTitle>
                              </div>
                              <AlertDialogDescription asChild>
                                <div className="text-sm sm:text-base space-y-3 pt-2 px-4 sm:px-0">
                                  <p className="text-gray-700 leading-relaxed break-words">
                                    Estás a punto de eliminar esta hipótesis de validación.
                                  </p>
                                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50/80 border border-red-200/60">
                                    <span className="text-red-600 text-base sm:text-lg flex-shrink-0">⚠️</span>
                                    <span className="text-red-700 font-medium text-xs sm:text-sm leading-relaxed break-words">
                                      Esta acción no se puede deshacer. Se eliminará permanentemente esta hipótesis y todos sus datos asociados.
                                    </span>
                                  </div>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2 sm:gap-4 px-4 sm:px-6 pb-4 sm:pb-6 flex-col sm:flex-row">
                              <AlertDialogCancel
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Permitir cancelar siempre, incluso durante la eliminación
                                  setDeletingHypothesisId(null);
                                  setHypothesisToDelete(null);
                                  setDeleteDialogOpen(false);
                                }}
                                className="relative overflow-hidden w-full sm:w-auto border-2 border-gray-300/60 hover:border-gray-400/80 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base group order-2 sm:order-1"
                              >
                                {!deletingHypothesisId && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                                )}
                                <span className="relative z-10 drop-shadow-sm">
                                  Cancelar
                                </span>
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteHypothesis(hyp.id)}
                                disabled={!!deletingHypothesisId}
                                className="relative overflow-hidden w-full sm:w-auto bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 border-2 border-red-400/30 hover:border-red-500/50 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base group disabled:opacity-70 disabled:cursor-not-allowed order-1 sm:order-2"
                              >
                                {!deletingHypothesisId && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                  {deletingHypothesisId ? (
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
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                        <span className="font-medium text-blue-600 w-16 sm:w-20 flex-shrink-0">Si:</span>
                        <span className="text-gray-600 break-words">{hyp.si_clause}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                        <span className="font-medium text-cyan-600 w-16 sm:w-20 flex-shrink-0">Entonces:</span>
                        <span className="text-gray-600 break-words">{hyp.entonces_clause}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                        <span className="font-medium text-teal-600 w-16 sm:w-20 flex-shrink-0">Porque:</span>
                        <span className="text-gray-600 break-words">{hyp.porque_clause}</span>
                      </div>
                    </div>
                    {hyp.validation_method && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 break-words">
                          <strong>Método de validación:</strong> {hyp.validation_method}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Landing Pages Section */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
          <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg sm:text-xl">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Landing Pages
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Crea landing pages para validar tu propuesta de valor
                </CardDescription>
              </div>
              <Link href="/dashboard/validation/landing-page/new" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-sm sm:text-base">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Landing
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            {landingPages.length === 0 ? (
              <EmptyState
                title="No hay landing pages"
                message="Crea una landing page para capturar emails y validar el interés en tu producto"
                action={
                  <Link href="/dashboard/validation/landing-page/new">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm sm:text-base">
                      <Sparkles className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Crear Primera Landing Page</span>
                      <span className="sm:hidden">Crear Landing Page</span>
                    </Button>
                  </Link>
                }
                fullScreen={false}
              />
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {landingPages.map((page: any) => (
                  <div
                    key={page.id}
                    className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-800 break-words">{page.title}</h3>
                        <Badge className={`text-xs flex-shrink-0 ${page.status === "published" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-600"}`}>
                          {page.status === "published" ? "Publicada" : "Borrador"}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-3 break-words">{page.headline}</p>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                          {page.views_count || 0} vistas
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <MousePointerClick className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500 flex-shrink-0" />
                          {page.clicks_count || 0} clicks
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Target className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                          {page.conversions_count || 0} conversiones
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {page.status === "published" && page.published_url && (
                        <Link href={page.published_url} target="_blank" className="flex-1 sm:flex-initial">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-lg text-xs sm:text-sm">
                            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                      )}
                      <Link href={`/dashboard/validation/landing-page/${page.id}`} className="flex-1 sm:flex-initial">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-lg text-xs sm:text-sm">
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hipótesis Validadas */}
        {seanEllisResults && (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg sm:text-xl">
                <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                Hipótesis Validadas
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {seanEllisResults.passed} de {seanEllisResults.total} tests pasaron el umbral del 40%
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Tasa de Éxito</span>
                  <span className="font-bold text-gray-800">{seanEllisResults.passRate}%</span>
                </div>
                <Progress 
                  value={seanEllisResults.passRate} 
                  className="h-2 sm:h-3"
                />
                <div className={`flex items-start sm:items-center gap-2 p-3 rounded-xl ${
                  seanEllisResults.passRate >= 40 
                    ? "bg-green-50 text-green-700" 
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {seanEllisResults.passRate >= 40 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <span className="font-medium text-xs sm:text-sm break-words">¡Excelente! Tu idea tiene tracción validada</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <span className="font-medium text-xs sm:text-sm break-words">Necesitas más validación antes de escalar</span>
                    </>
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

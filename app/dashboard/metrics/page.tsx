"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Target,
  BarChart3,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  Pencil,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";
import dynamic from "next/dynamic";

// Dynamic import de recharts para reducir el bundle inicial
const RetentionChart = dynamic(
  () => import("@/components/charts/retention-chart").then((mod) => mod.RetentionChart),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[200px] sm:h-[300px] md:h-[400px]">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

export default function MetricsPage() {
  const [startup, setStartup] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [metricsForm, setMetricsForm] = useState({
    cac: "",
    ltv: "",
    mrr: "",
    arpu: "",
    churnRate: "",
  });
  const supabase = createClient();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  const loadData = useCallback(async () => {
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

        const response = await fetch(
          `/api/metrics/dashboard?startupId=${startupData.id}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setDashboard(data.dashboard);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Limpiar datos cuando cambia el proyecto para evitar mezclar información
    setStartup(null);
    setDashboard(null);
    setAnalysis(null);
    loadData();
  }, [loadData, selectedProjectId]);
  
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
  }, [loadData]);

  if (loading) {
    return <LoadingState message="Cargando métricas..." />;
  }

  if (!startup) {
    return (
      <EmptyState
        title="Primero debes registrar tu startup"
        message="Crea tu startup para ver las métricas de tu proyecto"
        fullScreen={false}
      />
    );
  }

  const metrics = dashboard || {
    activationRate: 0,
    retention: { D7: 0, D30: 0, D90: 0 },
    nps: 0,
    cacLtv: { cac: 0, ltv: 0, ratio: 0 },
    seanEllis: { total: 0, passed: 0, passRate: 0 },
    churn: 0,
    startup: { totalUsers: 0, activeUsers: 0, mrr: 0 },
  };

  const retentionData = [
    { period: "D7", rate: metrics.retention.D7 },
    { period: "D30", rate: metrics.retention.D30 },
    { period: "D90", rate: metrics.retention.D90 },
  ];

  const handleAnalyzeWithAI = async () => {
    if (!startup) return;

    try {
      setAnalyzing(true);
      setAnalysisError(null);
      setAnalysis(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAnalysisError("Debes iniciar sesión");
        return;
      }

      const response = await fetch("/api/metrics/analyze-with-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          startupId: startup.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al analizar con IA");
      }

      setAnalysis(data.analysis);
    } catch (error: any) {
      console.error("Error:", error);
      setAnalysisError(error.message || "Error al analizar con IA");
    } finally {
      setAnalyzing(false);
    }
  };

  // Función para formatear el análisis con IA (parsear markdown básico)
  const formatAnalysis = (text: string) => {
    const lines = text.split("\n");
    const sections: { title: string; content: string[] }[] = [];
    let currentSection: { title: string; content: string[] } | null = null;

    lines.forEach((line) => {
      if (line.match(/^#{1,3}\s+/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#{1,3}\s+/, "").trim(),
          content: [],
        };
      } else if (line.trim() && currentSection) {
        currentSection.content.push(line.trim());
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{ title: "Análisis", content: [text] }];
  };

  const handleOpenMetricsForm = () => {
    // Pre-llenar el formulario con los valores actuales
    setMetricsForm({
      cac: metrics.cacLtv.cac > 0 ? metrics.cacLtv.cac.toString() : "",
      ltv: metrics.cacLtv.ltv > 0 ? metrics.cacLtv.ltv.toString() : "",
      mrr: metrics.startup.mrr > 0 ? metrics.startup.mrr.toString() : "",
      arpu: "",
      churnRate: metrics.churn > 0 ? metrics.churn.toString() : "",
    });
    setShowMetricsForm(true);
  };

  const handleSaveMetrics = async () => {
    if (!startup) return;

    try {
      setSavingMetrics(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Debes iniciar sesión");
        return;
      }

      const response = await fetch("/api/metrics/cac-ltv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          startupId: startup.id,
          cac: parseFloat(metricsForm.cac) || 0,
          ltv: parseFloat(metricsForm.ltv) || 0,
          mrr: parseFloat(metricsForm.mrr) || 0,
          arpu: parseFloat(metricsForm.arpu) || null,
          churnRate: parseFloat(metricsForm.churnRate) || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar métricas");
      }

      setShowMetricsForm(false);
      await loadData();
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al guardar métricas");
    } finally {
      setSavingMetrics(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 flex-wrap">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <span>Dashboard de Métricas</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Métricas avanzadas de tu startup
          </p>
        </div>
        <Button onClick={handleOpenMetricsForm} className="gap-2">
          <Pencil className="h-4 w-4" />
          Actualizar Métricas
        </Button>
      </div>

      <Card className="border-2 border-blue-100 bg-blue-50/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg text-blue-900">Funciones en desarrollo</CardTitle>
          </div>
          <Badge className="bg-blue-600 text-white text-xs sm:text-sm w-fit">Próximamente</Badge>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-blue-900 px-4 sm:px-6">
          Estamos preparando nuevas métricas y análisis avanzados. Muy pronto verás aquí paneles completos con rendimiento, cohorts y comparativas. Gracias por tu paciencia.
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
              <span>Activation Rate</span>
              <Badge variant={metrics.activationRate >= 25 ? "default" : "destructive"} className="text-xs">
                Objetivo: 25%
              </Badge>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">{metrics.activationRate.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                {metrics.activationRate >= 25 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-muted-foreground">
                  {metrics.activationRate >= 25 ? "Bueno" : "Mejorable"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                % de usuarios que completan acción clave
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
              <span>NPS (Net Promoter Score)</span>
              <Badge variant={metrics.nps >= 30 ? "default" : "destructive"} className="text-xs">
                Objetivo: 30+
              </Badge>
            </div>
            <CardTitle className="text-3xl">{metrics.nps}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                {metrics.nps >= 30 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-muted-foreground">
                  {metrics.nps >= 30 ? "Excelente" : "Mejorable"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Satisfacción y lealtad del cliente
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
              <div className="flex items-center gap-2">
                <span>LTV/CAC Ratio</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={handleOpenMetricsForm}
                  title="Editar métricas"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Badge variant={metrics.cacLtv.cac > 0 && metrics.cacLtv.ltv >= 0 && (metrics.cacLtv.ltv / metrics.cacLtv.cac) >= 3.0 ? "default" : "destructive"} className="text-xs">
                Objetivo: &gt;3.0x
              </Badge>
            </div>
            <CardTitle className="text-3xl">
              {metrics.cacLtv.cac > 0 && metrics.cacLtv.ltv >= 0
                ? `${(metrics.cacLtv.ltv / metrics.cacLtv.cac).toFixed(2)}x` 
                : "N/A"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                {metrics.cacLtv.cac > 0 && metrics.cacLtv.ltv >= 0 && (metrics.cacLtv.ltv / metrics.cacLtv.cac) >= 3.0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-muted-foreground">
                  {metrics.cacLtv.cac > 0 && metrics.cacLtv.ltv >= 0 && (metrics.cacLtv.ltv / metrics.cacLtv.cac) >= 3.0 
                    ? "Saludable" 
                    : metrics.cacLtv.cac === 0
                    ? "Sin datos"
                    : "Revisar"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rentabilidad del modelo de negocio
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
              <span>Churn Rate</span>
              <Badge variant={metrics.churn < 5 ? "default" : "destructive"} className="text-xs">
                Objetivo: &lt;5%
              </Badge>
            </div>
            <CardTitle className="text-3xl">{metrics.churn.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                {metrics.churn < 5 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-muted-foreground">
                  {metrics.churn < 5 ? "Bajo" : "Alto"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                % de usuarios que cancelan/abandonan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention Chart */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Retention Rate (Tasa de Retención)
          </CardTitle>
          <CardDescription>
            Porcentaje de usuarios que regresan después de D7, D30 y D90 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RetentionChart data={retentionData} />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">D7</div>
              <div className="text-muted-foreground">Objetivo: 40%+</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">D30</div>
              <div className="text-muted-foreground">Objetivo: 20%+</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold">D90</div>
              <div className="text-muted-foreground">Objetivo: 10%+</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Métricas Financieras
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                onClick={handleOpenMetricsForm}
                title="Editar métricas"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">CAC (Costo de Adquisición)</span>
                <p className="text-xs text-muted-foreground mt-1">Costo por cliente adquirido</p>
              </div>
              <span className="font-bold text-lg">${metrics.cacLtv.cac.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">LTV (Valor de Vida)</span>
                <p className="text-xs text-muted-foreground mt-1">Valor total del cliente</p>
              </div>
              <span className="font-bold text-lg">${metrics.cacLtv.ltv.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">MRR (Ingresos Recurrentes)</span>
                <p className="text-xs text-muted-foreground mt-1">Ingresos mensuales recurrentes</p>
              </div>
              <span className="font-bold text-lg">${metrics.startup.mrr.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios y Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Total Usuarios</span>
                <p className="text-xs text-muted-foreground mt-1">Usuarios registrados</p>
              </div>
              <span className="font-bold text-lg">{metrics.startup.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Usuarios Activos</span>
                <p className="text-xs text-muted-foreground mt-1">Usuarios activos recientes</p>
              </div>
              <span className="font-bold text-lg">{metrics.startup.activeUsers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">Sean Ellis Pass Rate</span>
                <p className="text-xs text-muted-foreground mt-1">% que estarían muy decepcionados</p>
              </div>
              <span className="font-bold text-lg">{metrics.seanEllis.passRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis con IA */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Análisis con IA
          </CardTitle>
          <CardDescription>
            Obtén un análisis profundo de tu startup basado en todas tus métricas y datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analysis && !analyzing && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                La IA analizará tus métricas, validaciones, OKRs e hipótesis para darte recomendaciones específicas
              </p>
              <Button
                onClick={handleAnalyzeWithAI}
                disabled={analyzing}
                size="lg"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Analizar con IA
              </Button>
            </div>
          )}

          {analyzing && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analizando tu startup con IA...</p>
            </div>
          )}

          {analysisError && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Error</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">{analysisError}</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Análisis completado</span>
                </div>
                <Button
                  onClick={handleAnalyzeWithAI}
                  variant="outline"
                  size="sm"
                  disabled={analyzing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Re-analizar
                </Button>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {formatAnalysis(analysis).map((section, idx) => (
                  <div key={idx} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {section.title.includes("Fortalezas") && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {section.title.includes("Mejora") && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                      {section.title.includes("Recomendaciones") && <Lightbulb className="h-5 w-5 text-blue-600" />}
                      {section.title.includes("Alertas") && <AlertCircle className="h-5 w-5 text-red-600" />}
                      {section.title.includes("Oportunidades") && <Target className="h-5 w-5 text-purple-600" />}
                      {section.title}
                    </h3>
                    <div className="space-y-2 pl-7">
                      {section.content.map((line, lineIdx) => {
                        // Detectar listas
                        if (line.match(/^[-*•]\s+/)) {
                          return (
                            <div key={lineIdx} className="flex items-start gap-2">
                              <span className="text-primary mt-1.5">•</span>
                              <span className="flex-1">{line.replace(/^[-*•]\s+/, "")}</span>
                            </div>
                          );
                        }
                        // Detectar números
                        if (line.match(/^\d+[\.)]\s+/)) {
                          return (
                            <div key={lineIdx} className="flex items-start gap-2">
                              <span className="text-primary font-semibold mt-1">{line.match(/^\d+[\.)]/)?.[0]}</span>
                              <span className="flex-1">{line.replace(/^\d+[\.)]\s+/, "")}</span>
                            </div>
                          );
                        }
                        return (
                          <p key={lineIdx} className="text-muted-foreground leading-relaxed">
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para actualizar métricas */}
      <Dialog open={showMetricsForm} onOpenChange={setShowMetricsForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Actualizar Métricas Financieras
            </DialogTitle>
            <DialogDescription>
              Ingresa manualmente tus métricas financieras. Estos datos no se sincronizan automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cac">CAC (Costo de Adquisición)</Label>
                <Input
                  id="cac"
                  type="number"
                  step="0.01"
                  value={metricsForm.cac}
                  onChange={(e) => setMetricsForm({ ...metricsForm, cac: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Costo por cliente adquirido</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ltv">LTV (Valor de Vida)</Label>
                <Input
                  id="ltv"
                  type="number"
                  step="0.01"
                  value={metricsForm.ltv}
                  onChange={(e) => setMetricsForm({ ...metricsForm, ltv: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Valor total del cliente</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrr">MRR (Ingresos Recurrentes Mensuales)</Label>
                <Input
                  id="mrr"
                  type="number"
                  step="0.01"
                  value={metricsForm.mrr}
                  onChange={(e) => setMetricsForm({ ...metricsForm, mrr: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Ingresos mensuales recurrentes</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="arpu">ARPU (Ingreso Promedio por Usuario)</Label>
                <Input
                  id="arpu"
                  type="number"
                  step="0.01"
                  value={metricsForm.arpu}
                  onChange={(e) => setMetricsForm({ ...metricsForm, arpu: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Ingreso promedio por usuario</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="churnRate">Churn Rate (%)</Label>
                <Input
                  id="churnRate"
                  type="number"
                  step="0.01"
                  value={metricsForm.churnRate}
                  onChange={(e) => setMetricsForm({ ...metricsForm, churnRate: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Porcentaje de usuarios que cancelan/abandonan</p>
              </div>
            </div>
            {metricsForm.cac && metricsForm.ltv && parseFloat(metricsForm.cac) > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-1">LTV/CAC Ratio calculado:</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(parseFloat(metricsForm.ltv) / parseFloat(metricsForm.cac)).toFixed(2)}x
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {parseFloat(metricsForm.ltv) / parseFloat(metricsForm.cac) >= 3.0 
                    ? "✓ Saludable (objetivo >3.0x)" 
                    : "⚠ Revisar (objetivo >3.0x)"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetricsForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMetrics} disabled={savingMetrics}>
              {savingMetrics ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Guardar Métricas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

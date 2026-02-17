"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lightbulb,
  Target,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit,
  History,
  Trash2,
  X,
  Save,
} from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

type Hypothesis = {
  id: string;
  hypothesis_text: string;
  si_clause: string;
  entonces_clause: string;
  porque_clause: string;
  validation_method?: string;
  target_metric?: string;
  success_criteria?: string;
  status: string;
  version_number: number;
  created_at: string;
};

export default function HypothesisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const supabase = createClient();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [editingHypothesis, setEditingHypothesis] = useState<Hypothesis | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  // Wizard form data
  const [formData, setFormData] = useState({
    problema: "",
    usuario: "",
    por_que_ahora: "",
    riesgo: "",
  });

  // Escuchar cambios en el proyecto seleccionado o projectId de URL
  useEffect(() => {
    // Limpiar datos cuando cambia el proyecto para evitar mezclar información
    setStartup(null);
    setHypotheses([]);
    setEditingHypothesis(null);
    setShowHistory(null);
    setVersions([]);
    loadStartup();
  }, [projectId, selectedProjectId]);

  // También escuchar cambios en localStorage como respaldo
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected_project_id') {
        loadStartup();
      }
    };

    const handleCustomStorageChange = () => {
      loadStartup();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('project-selected', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-selected', handleCustomStorageChange);
    };
  }, []);

  const loadStartup = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      // Usar projectId de URL, selectedProjectId del hook, o leer de localStorage como fallback
      const projectIdToUse = projectId || selectedProjectId || localStorage.getItem("selected_project_id");
      
      let startupData;
      if (projectIdToUse) {
        const { data } = await supabase
          .from("startups")
          .select("*")
          .eq("id", projectIdToUse)
          .single();
        startupData = data;
      } else {
        const { data } = await supabase
          .from("startups")
          .select("*")
          .eq("student_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        startupData = data;
      }

      if (startupData) {
        setStartup(startupData);
        await loadHypotheses(startupData.id);
        
        // Pre-llenar formulario con datos del Constructor si están disponibles
        if (startupData.problem || startupData.target_audience) {
          setFormData({
            problema: startupData.problem || "",
            usuario: startupData.target_audience || "",
            por_que_ahora: startupData.market_opportunity || "",
            riesgo: startupData.competitive_advantage || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading startup:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHypotheses = async (startupId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("hypotheses")
        .select("*")
        .eq("startup_id", startupId)
        .eq("is_current_version", true)
        .order("created_at", { ascending: false });

      if (data) {
        setHypotheses(data);
      }
    } catch (error) {
      }
    };

  const handleGenerate = async () => {
    if (!startup) return;

    if (!formData.problema || !formData.usuario || !formData.por_que_ahora || !formData.riesgo) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      setGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/hypothesis/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          startupId: startup.id,
          problema: formData.problema,
          usuario: formData.usuario,
          por_que_ahora: formData.por_que_ahora,
          riesgo: formData.riesgo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar hipótesis");
      }

      await loadHypotheses(startup.id);
      setStep(3); // Go to results step
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al generar hipótesis");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingHypothesis) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/hypothesis/${editingHypothesis.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          hypothesis_text: `${editingHypothesis.si_clause} ${editingHypothesis.entonces_clause} ${editingHypothesis.porque_clause}`,
          si_clause: editingHypothesis.si_clause,
          entonces_clause: editingHypothesis.entonces_clause,
          porque_clause: editingHypothesis.porque_clause,
          validation_method: editingHypothesis.validation_method,
          target_metric: editingHypothesis.target_metric,
          success_criteria: editingHypothesis.success_criteria,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      setEditingHypothesis(null);
      await loadHypotheses(startup!.id);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al guardar");
    }
  };

  const handleDelete = async (hypothesisId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/hypothesis/${hypothesisId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      setDeleteDialog(null);
      await loadHypotheses(startup!.id);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al eliminar");
    }
  };

  const loadVersions = async (hypothesisId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/hypothesis/${hypothesisId}/versions`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.versions) {
        setVersions(data.versions);
      }
    } catch (error) {
      console.error("Error loading versions:", error);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando hipótesis..." />;
  }

  if (!startup) {
    return (
      <EmptyState
        title="Primero debes crear un proyecto"
        message="Crea un proyecto para generar hipótesis de validación"
        action={
          <Link href="/dashboard/projects/new">
            <Button>Crear Proyecto</Button>
          </Link>
        }
        fullScreen={false}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Lightbulb className="h-8 w-8 text-primary" />
          Generador de Hipótesis
        </h1>
        <p className="text-muted-foreground mt-2">
          Crea hipótesis de validación claras usando el formato Si/Entonces/Porque
        </p>
        <Collapsible defaultOpen={false} className="mt-3">
          <CollapsibleTrigger className="w-full p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors text-left flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Ver contexto</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 bg-blue-50 dark:bg-blue-950/20 border-x border-b border-blue-200 dark:border-blue-800 rounded-b-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Diferencia con el Constructor:</strong> El Constructor estructura tu idea general. 
              El Generador de Hipótesis crea hipótesis específicas y testables para validar tu idea. 
              {startup?.problem && " Tus datos del Constructor se han pre-llenado automáticamente."}
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Wizard Steps */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Paso 1: Define el Problema
            </CardTitle>
            <CardDescription>
              Describe el problema que tu startup está resolviendo
              {startup?.problem && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Datos pre-llenados desde el Constructor)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="problema">Problema</Label>
              <Textarea
                id="problema"
                placeholder="Ej: Los emprendedores tienen dificultad para validar sus ideas antes de construir..."
                value={formData.problema}
                onChange={(e) => setFormData({ ...formData, problema: e.target.value })}
                rows={5}
                className="mt-1"
              />
              {startup?.problem && formData.problema === startup.problem && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Este dato viene del Constructor. Puedes editarlo aquí.
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!formData.problema}>
                Siguiente <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Paso 2: Usuario, Timing y Riesgo
            </CardTitle>
            <CardDescription>
              Completa la información sobre tu usuario objetivo, timing y riesgos
              {startup?.target_audience && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Datos pre-llenados desde el Constructor)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="usuario">Usuario Objetivo</Label>
              <Textarea
                id="usuario"
                placeholder="Ej: Emprendedores en etapa temprana (pre-seed) que están validando ideas..."
                value={formData.usuario}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                rows={3}
                className="mt-1"
              />
              {startup?.target_audience && formData.usuario === startup.target_audience && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Este dato viene del Constructor. Puedes editarlo aquí.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="por_que_ahora">¿Por qué ahora?</Label>
              <Textarea
                id="por_que_ahora"
                placeholder="Ej: El mercado está maduro, la tecnología es accesible, hay demanda creciente..."
                value={formData.por_que_ahora}
                onChange={(e) => setFormData({ ...formData, por_que_ahora: e.target.value })}
                rows={3}
                className="mt-1"
              />
              {startup?.market_opportunity && formData.por_que_ahora === startup.market_opportunity && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Este dato viene del Constructor. Puedes editarlo aquí.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="riesgo">Riesgo Principal</Label>
              <Textarea
                id="riesgo"
                placeholder="Ej: Que los emprendedores no estén dispuestos a pagar por validación..."
                value={formData.riesgo}
                onChange={(e) => setFormData({ ...formData, riesgo: e.target.value })}
                rows={3}
                className="mt-1"
              />
              {startup?.competitive_advantage && formData.riesgo === startup.competitive_advantage && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Este dato viene del Constructor. Puedes editarlo aquí.
                </p>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating || !formData.usuario || !formData.por_que_ahora || !formData.riesgo}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Hipótesis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Step */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Hipótesis Generadas
                  </CardTitle>
                  <CardDescription>
                    {hypotheses.length} hipótesis generadas para tu proyecto
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setStep(1)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Nuevas
                </Button>
              </div>
            </CardHeader>
          </Card>

          {hypotheses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No hay hipótesis generadas aún</p>
                <Button className="mt-4" onClick={() => setStep(1)}>
                  Generar Hipótesis
                </Button>
              </CardContent>
            </Card>
          ) : (
            hypotheses.map((hypothesis) => (
              <Card key={hypothesis.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">v{hypothesis.version_number}</Badge>
                        <Badge
                          variant={
                            hypothesis.status === "validated"
                              ? "default"
                              : hypothesis.status === "invalidated"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {hypothesis.status === "validated"
                            ? "Validada"
                            : hypothesis.status === "invalidated"
                            ? "Invalidada"
                            : "Borrador"}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">Hipótesis</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingHypothesis(hypothesis);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setShowHistory(hypothesis.id);
                          await loadVersions(hypothesis.id);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog(hypothesis.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                      <p className="font-semibold text-primary mb-1">Si</p>
                      <p>{hypothesis.si_clause}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                      <p className="font-semibold text-green-700 dark:text-green-300 mb-1">Entonces</p>
                      <p>{hypothesis.entonces_clause}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                      <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Porque</p>
                      <p>{hypothesis.porque_clause}</p>
                    </div>
                    {hypothesis.validation_method && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-1">Método de Validación:</p>
                        <p className="text-sm">{hypothesis.validation_method}</p>
                      </div>
                    )}
                    {hypothesis.target_metric && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-1">Métrica Objetivo:</p>
                        <p className="text-sm">{hypothesis.target_metric}</p>
                      </div>
                    )}
                    {hypothesis.success_criteria && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-1">Criterios de Éxito:</p>
                        <p className="text-sm">{hypothesis.success_criteria}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {editingHypothesis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto my-auto">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg sm:text-xl">Editar Hipótesis</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingHypothesis(null)}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div>
                <Label>Si</Label>
                <Textarea
                  value={editingHypothesis.si_clause}
                  onChange={(e) =>
                    setEditingHypothesis({
                      ...editingHypothesis,
                      si_clause: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Entonces</Label>
                <Textarea
                  value={editingHypothesis.entonces_clause}
                  onChange={(e) =>
                    setEditingHypothesis({
                      ...editingHypothesis,
                      entonces_clause: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Porque</Label>
                <Textarea
                  value={editingHypothesis.porque_clause}
                  onChange={(e) =>
                    setEditingHypothesis({
                      ...editingHypothesis,
                      porque_clause: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Método de Validación (opcional)</Label>
                <Textarea
                  value={editingHypothesis.validation_method || ""}
                  onChange={(e) =>
                    setEditingHypothesis({
                      ...editingHypothesis,
                      validation_method: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Métrica Objetivo (opcional)</Label>
                <Input
                  value={editingHypothesis.target_metric || ""}
                  onChange={(e) =>
                    setEditingHypothesis({
                      ...editingHypothesis,
                      target_metric: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Criterios de Éxito (opcional)</Label>
                <Textarea
                  value={editingHypothesis.success_criteria || ""}
                  onChange={(e) =>
                    setEditingHypothesis({
                      ...editingHypothesis,
                      success_criteria: e.target.value,
                    })
                  }
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingHypothesis(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Dialog */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto my-auto">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg sm:text-xl">Historial de Versiones</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowHistory(null);
                    setVersions([]);
                  }}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {versions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay versiones anteriores
                </p>
              ) : (
                <div className="space-y-4">
                  {versions.map((version, index) => (
                    <Card
                      key={version.id || index}
                      className={version.is_current ? "border-primary" : ""}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={version.is_current ? "default" : "secondary"}>
                              v{version.version_number}
                              {version.is_current && " (Actual)"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(version.created_at).toLocaleString("es-CO")}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-primary/5 rounded-lg">
                            <p className="font-semibold text-primary mb-1">Si</p>
                            <p className="text-sm">{version.si_clause}</p>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <p className="font-semibold text-green-700 dark:text-green-300 mb-1">
                              Entonces
                            </p>
                            <p className="text-sm">{version.entonces_clause}</p>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                              Porque
                            </p>
                            <p className="text-sm">{version.porque_clause}</p>
                          </div>
                          {version.change_reason && (
                            <div className="p-2 bg-muted rounded text-sm">
                              <span className="font-semibold">Razón del cambio: </span>
                              {version.change_reason}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar hipótesis?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la hipótesis y todo su historial de versiones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


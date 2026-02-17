"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Target, Plus, CheckCircle2, Circle, PlayCircle, Trash2, Loader2, 
  BookOpen, X, ArrowRight, TrendingUp, Calendar, Award, Sparkles,
  Upload, File, FileText, Image, Download, Eye, AlertCircle
} from "lucide-react";
import { TutorialOverlay } from "@/components/ui/tutorial-overlay";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import type { OKR, KRStatus, OKREvidence } from "@/types/database";
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
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";

export default function OKRsPage() {
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [okrToDelete, setOkrToDelete] = useState<OKR | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, OKREvidence[]>>({});
  const supabase = createClient();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const lolaOkrUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-okr_il0n4o`;

  // Escuchar cambios en el proyecto seleccionado
  useEffect(() => {
    // Limpiar datos cuando cambia el proyecto para evitar mezclar información
    setOkrs([]);
    setEvidenceMap({});
    loadOKRs();
  }, [selectedProjectId]);

  // También escuchar cambios en localStorage como respaldo
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected_project_id') {
        loadOKRs();
      }
    };

    const handleCustomStorageChange = () => {
      loadOKRs();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('project-selected', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-selected', handleCustomStorageChange);
    };
  }, []);

  const loadOKRs = async () => {
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
    
    const { data: startup } = await query.single();

    if (startup) {
      const { data } = await supabase
        .from("okrs")
        .select("*")
        .eq("startup_id", startup.id)
        .order("week_number", { ascending: true });

      if (data) {
        setOkrs(data);
        
        // Cargar evidencia para todos los OKRs
        const okrIds = data.map(okr => okr.id);
        if (okrIds.length > 0) {
          const { data: evidenceData } = await supabase
            .from("okr_evidence")
            .select("*")
            .in("okr_id", okrIds)
            .order("uploaded_at", { ascending: false });
          
          if (evidenceData) {
            // Organizar evidencia por okr_id y key_result_number
            const evidenceByOkr: Record<string, OKREvidence[]> = {};
            evidenceData.forEach((evidence) => {
              const key = `${evidence.okr_id}-${evidence.key_result_number}`;
              if (!evidenceByOkr[key]) {
                evidenceByOkr[key] = [];
              }
              evidenceByOkr[key].push(evidence);
            });
            setEvidenceMap(evidenceByOkr);
          }
        }
      }
    }
    setLoading(false);
  };

  const handleStatusChange = async (
    okrId: string,
    krNumber: 1 | 2 | 3,
    newStatus: KRStatus,
    hasEvidence: boolean = false
  ) => {
    // Si se intenta completar sin evidencia, mostrar alerta
    if (newStatus === "completed" && !hasEvidence) {
      alert("⚠️ Para completar esta tarea, primero debes subir evidencia.\n\nSube un archivo o documento que demuestre que has completado el resultado clave.");
      return;
    }

    const updateField = `kr${krNumber}_status` as const;
    const { error } = await supabase
      .from("okrs")
      .update({ [updateField]: newStatus })
      .eq("id", okrId);

    if (!error) {
      loadOKRs();
    }
  };

  const getStatusIcon = (status: KRStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <PlayCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: KRStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            <PlayCircle className="h-3 w-3 mr-1" />
            En Progreso
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            <Circle className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  const calculateProgress = (okr: OKR) => {
    const statuses = [okr.kr1_status, okr.kr2_status, okr.kr3_status];
    const completed = statuses.filter((s) => s === "completed").length;
    return (completed / 3) * 100;
  };

  const handleDelete = async () => {
    if (!okrToDelete) return;

    try {
      setDeleting(true);
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Debes iniciar sesión para eliminar OKRs");
        setOkrToDelete(null);
        setDeleting(false);
        return;
      }

      const { data: startup } = await supabase
        .from("startups")
        .select("id")
        .eq("student_id", user.id)
        .single();

      if (!startup) {
        alert("No se encontró tu startup");
        setOkrToDelete(null);
        setDeleting(false);
        return;
      }

      const { error } = await supabase
        .from("okrs")
        .delete()
        .eq("id", okrToDelete.id)
        .eq("startup_id", startup.id);

      if (error) {
        console.error("Error deleting OKR:", error);
        alert(`Error al eliminar el OKR: ${error.message}`);
        setDeleting(false);
        return;
      }

      await loadOKRs();
      setOkrToDelete(null);
    } catch (error: any) {
      console.error("Error deleting OKR:", error);
      alert(`Error al eliminar el OKR: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando tus OKRs..." />;
  }

  const okrsTutorialSteps = [
    {
      id: "welcome",
      title: "¡Bienvenido a OKRs!",
      description: "Los OKRs (Objetivos y Resultados Clave) te ayudan a mantener el foco. Define objetivos semanales claros y mide tu progreso con resultados clave específicos.",
      position: "center" as const,
    },
    {
      id: "create",
      title: "Crear un OKR",
      description: "Haz clic en 'Nuevo OKR' para crear tus objetivos semanales. Cada OKR tiene un objetivo principal y 3 resultados clave medibles.",
      target: "[data-tutorial='create-okr']",
      position: "bottom" as const,
    },
    {
      id: "track",
      title: "Rastrear Progreso",
      description: "Actualiza el estado de cada resultado clave: No iniciado, En progreso o Completado. El progreso se calcula automáticamente.",
      target: "[data-tutorial='okr-list']",
      position: "top" as const,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <TutorialOverlay
        steps={okrsTutorialSteps}
        storageKey="okrs"
        title="Tutorial de OKRs"
        description="Aprende a crear y gestionar tus OKRs semanales"
      />

      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-green-100 via-emerald-100 to-green-50 rounded-xl shadow-md">
                <Target className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                  OKRs
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Objetivos y Resultados Clave semanales
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("tutorial_okrs_completed");
                window.location.reload();
              }}
              className="hidden sm:flex border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Tutorial
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              data-tutorial="create-okr"
              className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-green-500/50 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo OKR
            </Button>
          </div>
        </div>
      </div>

      {okrs.length === 0 ? (
        <Card className="border-2 border-green-200/50 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-transparent overflow-hidden shadow-xl relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <CardHeader className="pt-8 pb-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                <div className="absolute inset-0 bg-gradient-to-br from-green-300/30 via-emerald-300/20 to-green-300/20 rounded-full blur-2xl"></div>
                <img
                  src={lolaOkrUrl}
                  alt="Lola - OKRs"
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <CardTitle className="text-2xl sm:text-3xl mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ¡Comienza a definir tus objetivos!
                </CardTitle>
                <CardDescription className="text-base sm:text-lg mb-4">
                  Los OKRs te ayudan a mantener el foco y medir tu progreso. Crea tu primer OKR semanal para comenzar a trackear tus objetivos.
                </CardDescription>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-green-500/50 transition-all"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer OKR
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6" data-tutorial="okr-list">
          {okrs.map((okr) => {
            const progress = calculateProgress(okr);
            const isCompleted = progress === 100;
            
            return (
              <Card 
                key={okr.id}
                className={`border-2 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 relative ${
                  isCompleted
                    ? "border-green-200/50 bg-gradient-to-br from-green-50/60 via-emerald-50/40 to-transparent"
                    : "border-blue-200/50 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent"
                }`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isCompleted
                    ? "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600"
                    : "bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"
                }`}></div>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>

                <CardHeader className="pt-6 sm:pt-8 px-4 sm:px-6 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          isCompleted
                            ? "bg-gradient-to-br from-green-100 to-emerald-100"
                            : "bg-gradient-to-br from-blue-100 to-cyan-100"
                        }`}>
                          <Calendar className={`h-5 w-5 ${
                            isCompleted ? "text-green-600" : "text-blue-600"
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-xl sm:text-2xl font-bold">
                            Semana {okr.week_number}
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base mt-1">
                            {okr.objective}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-700">Progreso General</span>
                          <span className={`font-bold ${
                            isCompleted ? "text-green-600" : "text-blue-600"
                          }`}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <Progress 
                          value={progress} 
                          className={`h-3 ${
                            isCompleted ? "bg-green-100" : "bg-blue-100"
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          ¡Completado!
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOkrToDelete(okr)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8 relative z-10">
                  <div className="space-y-3">
                    {/* KR 1 */}
                    <KeyResultSection
                      okr={okr}
                      krNumber={1}
                      krText={okr.key_result_1}
                      krStatus={okr.kr1_status}
                      deadline={okr.kr1_deadline}
                      onStatusChange={(status, hasEvidence) => handleStatusChange(okr.id, 1, status, hasEvidence)}
                      evidence={evidenceMap[`${okr.id}-1`] || []}
                      onEvidenceUploaded={loadOKRs}
                      getStatusIcon={getStatusIcon}
                      getStatusBadge={getStatusBadge}
                    />

                    {/* KR 2 */}
                    <KeyResultSection
                      okr={okr}
                      krNumber={2}
                      krText={okr.key_result_2}
                      krStatus={okr.kr2_status}
                      deadline={okr.kr2_deadline}
                      onStatusChange={(status, hasEvidence) => handleStatusChange(okr.id, 2, status, hasEvidence)}
                      evidence={evidenceMap[`${okr.id}-2`] || []}
                      onEvidenceUploaded={loadOKRs}
                      getStatusIcon={getStatusIcon}
                      getStatusBadge={getStatusBadge}
                    />

                    {/* KR 3 */}
                    <KeyResultSection
                      okr={okr}
                      krNumber={3}
                      krText={okr.key_result_3}
                      krStatus={okr.kr3_status}
                      deadline={okr.kr3_deadline}
                      onStatusChange={(status, hasEvidence) => handleStatusChange(okr.id, 3, status, hasEvidence)}
                      evidence={evidenceMap[`${okr.id}-3`] || []}
                      onEvidenceUploaded={loadOKRs}
                      getStatusIcon={getStatusIcon}
                      getStatusBadge={getStatusBadge}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreateForm && (
        <CreateOKRForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadOKRs();
          }}
        />
      )}

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!okrToDelete} onOpenChange={(open) => !open && !deleting && setOkrToDelete(null)}>
        <AlertDialogContent className="bg-white border-2 border-red-200/60 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-200/80 border border-red-300/50 shadow-sm">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-gray-800">
                ¿Eliminar OKR?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base space-y-3 pt-2">
              <p className="text-gray-700">
                Estás a punto de eliminar el OKR de la{" "}
                <span className="font-semibold text-gray-900">
                  Semana {okrToDelete?.week_number}
                </span>
                :
              </p>
              <div className="bg-gray-50/80 p-4 rounded-lg border border-gray-200/60 shadow-sm">
                <p className="font-medium text-gray-800 italic leading-relaxed">
                  &quot;{okrToDelete?.objective}&quot;
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50/80 border border-red-200/60">
                <span className="text-red-600 text-lg">⚠️</span>
                <p className="text-red-700 font-medium text-sm leading-relaxed">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-4">
            <AlertDialogCancel 
              disabled={deleting}
              className="relative overflow-hidden border-2 border-gray-300/60 hover:border-gray-400/80 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-semibold shadow-sm hover:shadow-md transition-all duration-300 rounded-lg px-6 py-2.5 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {/* Efecto de brillo sutil */}
              {!deleting && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
              )}
              
              {/* Contenido del botón */}
              <span className="relative z-10 drop-shadow-sm">
                Cancelar
              </span>
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
  );
}

// Componente para cada Key Result con funcionalidad de evidencia
function KeyResultSection({
  okr,
  krNumber,
  krText,
  krStatus,
  deadline,
  onStatusChange,
  evidence,
  onEvidenceUploaded,
  getStatusIcon,
  getStatusBadge,
}: {
  okr: OKR;
  krNumber: 1 | 2 | 3;
  krText: string;
  krStatus: KRStatus;
  deadline?: string | null;
  onStatusChange: (status: KRStatus, hasEvidence?: boolean) => void;
  evidence: OKREvidence[];
  onEvidenceUploaded: () => void;
  getStatusIcon: (status: KRStatus) => React.ReactNode;
  getStatusBadge: (status: KRStatus) => React.ReactNode;
}) {
  // Función para determinar el estado de la fecha límite
  const getDeadlineStatus = (deadlineDate: string | null | undefined) => {
    if (!deadlineDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineDate);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue'; // Vencida
    if (diffDays <= 3) return 'urgent'; // Urgente (3 días o menos)
    if (diffDays <= 7) return 'soon'; // Próxima (7 días o menos)
    return 'normal'; // Normal
  };

  const deadlineStatus = getDeadlineStatus(deadline);
  
  const formatDeadline = (deadlineDate: string | null | undefined) => {
    if (!deadlineDate) return null;
    return new Date(deadlineDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [deletingEvidence, setDeletingEvidence] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo es demasiado grande. El tamaño máximo es 10MB.");
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    try {
      // Obtener token de sesión de Supabase
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("okrId", okr.id);
      formData.append("keyResultNumber", krNumber.toString());
      if (uploadDescription) {
        formData.append("description", uploadDescription);
      }

      const headers: HeadersInit = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/okrs/upload-evidence", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include", // Incluir cookies para autenticación
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al subir la evidencia");
      }

      // Limpiar formulario
      setUploadFile(null);
      setUploadDescription("");
      setShowUploadForm(false);
      
      // Recargar evidencia
      onEvidenceUploaded();
    } catch (error: any) {
      alert(error.message || "Error al subir la evidencia");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta evidencia?")) {
      return;
    }

    setDeletingEvidence(evidenceId);
    try {
      // Obtener token de sesión de Supabase
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const headers: HeadersInit = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/okrs/upload-evidence?id=${evidenceId}`, {
        method: "DELETE",
        headers,
        credentials: "include", // Incluir cookies para autenticación
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar la evidencia");
      }

      onEvidenceUploaded();
    } catch (error: any) {
      alert(error.message || "Error al eliminar la evidencia");
    } finally {
      setDeletingEvidence(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Image className="h-4 w-4" aria-label="Imagen" />;
    }
    if (fileType.includes("pdf")) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      krStatus === "completed"
        ? "bg-gradient-to-br from-green-50/60 to-emerald-50/40 border-green-200/60"
        : krStatus === "in_progress"
        ? "bg-gradient-to-br from-blue-50/60 to-cyan-50/40 border-blue-200/60"
        : "bg-white/80 border-gray-200/60"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon(krStatus)}
          <div className="flex-1 min-w-0">
            <span className="text-sm sm:text-base text-gray-700 leading-relaxed block">
              {krText}
            </span>
            {deadline && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <Calendar className={`h-3.5 w-3.5 ${
                  deadlineStatus === 'overdue' ? 'text-red-600' :
                  deadlineStatus === 'urgent' ? 'text-orange-600' :
                  deadlineStatus === 'soon' ? 'text-amber-600' :
                  'text-gray-500'
                }`} />
                <span className={`text-xs font-medium ${
                  deadlineStatus === 'overdue' ? 'text-red-700' :
                  deadlineStatus === 'urgent' ? 'text-orange-700' :
                  deadlineStatus === 'soon' ? 'text-amber-700' :
                  'text-gray-600'
                }`}>
                  {formatDeadline(deadline)}
                </span>
                {deadlineStatus === 'overdue' && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4">
                    Vencida
                  </Badge>
                )}
                {deadlineStatus === 'urgent' && (
                  <Badge className="text-xs px-1.5 py-0 h-4 bg-orange-100 text-orange-700 border-orange-200">
                    Urgente
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {getStatusBadge(krStatus)}
          <div className="flex gap-1 border-l border-gray-200 pl-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange("not_started", true)}
              className={`h-8 w-8 p-0 ${
                krStatus === "not_started" ? "bg-gray-100" : ""
              }`}
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange("in_progress", true)}
              className={`h-8 w-8 p-0 ${
                krStatus === "in_progress" ? "bg-blue-100" : ""
              }`}
            >
              <PlayCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange("completed", evidence.length > 0)}
              disabled={evidence.length === 0 && krStatus !== "completed"}
              className={`h-8 w-8 p-0 ${
                krStatus === "completed" ? "bg-green-100" : ""
              } ${
                evidence.length === 0 && krStatus !== "completed" 
                  ? "opacity-50 cursor-not-allowed" 
                  : ""
              }`}
              title={
                evidence.length === 0 && krStatus !== "completed"
                  ? "Debes subir evidencia antes de completar"
                  : "Marcar como completado"
              }
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sección de Evidencia */}
      <div className="mt-4 pt-4 border-t border-gray-200/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            {evidence.length === 0 && krStatus !== "completed" && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Evidencia requerida para completar
              </span>
            )}
            <span className="text-sm font-semibold text-gray-700">
              Evidencia ({evidence.length})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="h-8 text-xs border-blue-200 hover:bg-blue-50"
          >
            <Upload className="h-3 w-3 mr-1" />
            {showUploadForm ? "Cancelar" : "Subir"}
          </Button>
        </div>

        {/* Formulario de subida */}
        {showUploadForm && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50/50 border border-blue-200/60">
            <div className="space-y-3">
              <div>
                <Label htmlFor={`file-${okr.id}-${krNumber}`} className="text-xs font-semibold text-gray-700 mb-1 block">
                  Seleccionar archivo
                </Label>
                <Input
                  id={`file-${okr.id}-${krNumber}`}
                  type="file"
                  onChange={handleFileSelect}
                  className="text-xs"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                />
                {uploadFile && (
                  <p className="text-xs text-gray-600 mt-1">
                    {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`desc-${okr.id}-${krNumber}`} className="text-xs font-semibold text-gray-700 mb-1 block">
                  Descripción (opcional)
                </Label>
                <Textarea
                  id={`desc-${okr.id}-${krNumber}`}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  className="text-xs"
                  placeholder="Describe qué evidencia este archivo..."
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                size="sm"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3 mr-1" />
                    Subir Evidencia
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de evidencia */}
        {evidence.length > 0 && (
          <div className="space-y-2">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/60 border border-gray-200/60 hover:bg-white/80 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 rounded bg-blue-100 text-blue-600 flex-shrink-0">
                    {getFileIcon(item.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {item.file_name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatFileSize(item.file_size)} • {new Date(item.uploaded_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(item.file_url, '_blank')}
                    className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                    title="Ver archivo"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(item.file_url, '_blank')}
                    className="h-7 w-7 p-0 text-gray-600 hover:bg-gray-50"
                    title="Descargar"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvidence(item.id)}
                    disabled={deletingEvidence === item.id}
                    className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                    title="Eliminar"
                  >
                    {deletingEvidence === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {evidence.length === 0 && !showUploadForm && (
          <p className="text-xs text-gray-500 text-center py-2">
            No hay evidencia subida. Haz clic en &quot;Subir&quot; para agregar documentos.
          </p>
        )}
      </div>
    </div>
  );
}

function CreateOKRForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [weekNumber, setWeekNumber] = useState(1);
  const [objective, setObjective] = useState("");
  const [kr1, setKr1] = useState("");
  const [kr2, setKr2] = useState("");
  const [kr3, setKr3] = useState("");
  const [kr1Deadline, setKr1Deadline] = useState("");
  const [kr2Deadline, setKr2Deadline] = useState("");
  const [kr3Deadline, setKr3Deadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingExamples, setGeneratingExamples] = useState(false);
  const [examples, setExamples] = useState<Array<{
    objective: string;
    key_result_1: string;
    key_result_2: string;
    key_result_3: string;
    rationale: string;
  }>>([]);
  const [showExamples, setShowExamples] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleGenerateExamples = async () => {
    try {
      setGeneratingExamples(true);
      setError(null);
      setExamples([]);
      setShowExamples(false);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Debes iniciar sesión para generar ejemplos");
        return;
      }

      const accessToken = session.access_token;

      const response = await fetch("/api/okrs/generate-examples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ weekNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar ejemplos");
      }

      const data = await response.json();
      setExamples(data.examples || []);
      setShowExamples(true);
    } catch (error: any) {
      console.error("Error generating examples:", error);
      setError(error.message || "Error al generar ejemplos de OKRs");
    } finally {
      setGeneratingExamples(false);
    }
  };

  const handleSelectExample = (example: typeof examples[0]) => {
    setObjective(example.objective);
    setKr1(example.key_result_1);
    setKr2(example.key_result_2);
    setKr3(example.key_result_3);
    // Reset deadlines when selecting example
    setKr1Deadline("");
    setKr2Deadline("");
    setKr3Deadline("");
    setShowExamples(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Debes iniciar sesión");

      const { data: startup } = await supabase
        .from("startups")
        .select("*")
        .eq("student_id", user.id)
        .single();

      if (!startup) throw new Error("Primero debes registrar tu startup");

      // Verificar que el startup_id existe y pertenece al usuario
      if (!startup.id) {
        throw new Error("No se pudo obtener el ID de tu startup. Por favor, crea una startup primero.");
      }

      const { data, error } = await supabase.from("okrs").insert({
        startup_id: startup.id,
        week_number: weekNumber,
        objective,
        key_result_1: kr1,
        key_result_2: kr2,
        key_result_3: kr3,
        kr1_status: "not_started",
        kr2_status: "not_started",
        kr3_status: "not_started",
        kr1_deadline: kr1Deadline || null,
        kr2_deadline: kr2Deadline || null,
        kr3_deadline: kr3Deadline || null,
      }).select();

      if (error) {
        console.error("Error creating OKR:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        if (error.code === "42501" || error.message.includes("row-level security")) {
          throw new Error(
            "Error de permisos: No tienes permisos para crear OKRs. " +
            "Por favor, ejecuta el script SQL 'fix_okrs_rls_policies.sql' en Supabase SQL Editor " +
            "o contacta al administrador."
          );
        }
        
        throw new Error(`Error al crear el OKR: ${error.message}`);
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error en handleSubmit:", error);
      setError(error.message || "Ocurrió un error al crear el OKR. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl border border-gray-200/80 bg-white shadow-xl relative overflow-hidden my-auto max-h-[95vh] flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500/50 via-emerald-500/50 to-green-600/50"></div>
        
        <CardHeader className="pt-5 sm:pt-6 md:pt-8 pb-4 sm:pb-5 px-4 sm:px-6 md:px-8 relative">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 shrink-0">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
                  Crear Nuevo OKR
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm md:text-base text-gray-600 ml-0 sm:ml-11 md:ml-12 mt-1">
                Define tus objetivos y resultados clave para esta semana
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 md:px-8 pb-5 sm:pb-6 md:pb-8 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {/* Sección: Configuración Inicial */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-100">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Configuración</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="week" className="text-xs sm:text-sm font-medium text-gray-700">
                    Semana
                  </Label>
                  <Input
                    id="week"
                    type="number"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                    min={1}
                    required
                    className="border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base w-full"
                  />
                </div>
                
                <div className="sm:col-span-2 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={handleGenerateExamples}
                    disabled={generatingExamples}
                    className="w-full border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs sm:text-sm font-medium h-10 sm:h-11"
                  >
                    {generatingExamples ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                        <span className="whitespace-nowrap">Generando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="whitespace-nowrap">Generar ejemplos con IA</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Sección: Objetivo Principal */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-100">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Objetivo Principal</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="objective" className="text-xs sm:text-sm font-medium text-gray-700 block">
                  Describe el objetivo que quieres alcanzar esta semana
                </Label>
                <Textarea
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  required
                  rows={4}
                  className="border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base resize-none w-full min-h-[100px] sm:min-h-[120px]"
                  placeholder="Ej: Validar la demanda del producto realizando entrevistas con usuarios potenciales y obteniendo compromisos de prueba"
                />
              </div>
            </div>

            {/* Sección de ejemplos generados */}
            {showExamples && examples.length > 0 && (
              <div className="border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Ejemplos sugeridos por IA</h4>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExamples(false)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <div className="p-3 sm:p-4 space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                  {examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="group p-3 sm:p-4 rounded-lg border border-gray-200 bg-gray-50/50 hover:border-green-300 hover:bg-green-50/30 transition-all duration-200 cursor-pointer"
                      onClick={() => handleSelectExample(example)}
                    >
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Badge variant="outline" className="text-xs font-medium border-gray-300 text-gray-700 bg-white shrink-0 h-6 w-6 flex items-center justify-center p-0">
                            {idx + 1}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug mb-2 sm:mb-3">
                              {example.objective}
                            </p>
                            <div className="space-y-1.5 sm:space-y-2">
                              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 mt-0.5 shrink-0" />
                                <span className="flex-1 leading-relaxed">{example.key_result_1}</span>
                              </div>
                              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 mt-0.5 shrink-0" />
                                <span className="flex-1 leading-relaxed">{example.key_result_2}</span>
                              </div>
                              <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 mt-0.5 shrink-0" />
                                <span className="flex-1 leading-relaxed">{example.key_result_3}</span>
                              </div>
                            </div>
                            {example.rationale && (
                              <div className="mt-2 sm:mt-3 p-2 sm:p-2.5 rounded-md bg-white border border-gray-200">
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {example.rationale}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectExample(example);
                          }}
                          className="w-full sm:w-auto shrink-0 border-gray-300 hover:border-green-500 hover:bg-green-500 hover:text-white text-xs sm:text-sm font-medium transition-all duration-200 h-8 sm:h-9"
                        >
                          Usar este ejemplo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sección: Resultados Clave */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-100">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Resultados Clave</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((num) => {
                  const krValue = num === 1 ? kr1 : num === 2 ? kr2 : kr3;
                  const setKr = num === 1 ? setKr1 : num === 2 ? setKr2 : setKr3;
                  const deadlineValue = num === 1 ? kr1Deadline : num === 2 ? kr2Deadline : kr3Deadline;
                  const setDeadline = num === 1 ? setKr1Deadline : num === 2 ? setKr2Deadline : setKr3Deadline;
                  const placeholder = num === 1 
                    ? "Ej: Completar 20 entrevistas con usuarios potenciales"
                    : num === 2
                    ? "Ej: Obtener 10 compromisos de prueba del producto"
                    : "Ej: Crear prototipo funcional de landing page";
                  
                  return (
                    <div key={num} className="p-3 sm:p-4 rounded-lg border border-gray-200 bg-gray-50/30 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 text-green-700 font-semibold text-xs sm:text-sm shrink-0">
                          {num}
                        </div>
                        <Label htmlFor={`kr${num}`} className="text-xs sm:text-sm font-medium text-gray-700 flex-1">
                          Resultado Clave {num}
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Input
                          id={`kr${num}`}
                          type="text"
                          value={krValue}
                          onChange={(e) => setKr(e.target.value)}
                          required
                          className="border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white w-full"
                          placeholder={placeholder}
                        />
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                          <Input
                            id={`kr${num}-deadline`}
                            type="date"
                            value={deadlineValue}
                            onChange={(e) => setDeadline(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-white flex-1"
                            placeholder="Fecha límite (opcional)"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Sección: Acciones */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-4 sm:pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 px-4 sm:px-6 h-10 sm:h-11 text-sm sm:text-base order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear OKR
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

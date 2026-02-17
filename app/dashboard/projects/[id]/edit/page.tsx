"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Loader2, 
  Upload, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  Lock,
  X,
  Plus,
  Info,
  Lightbulb,
  Target,
  ImagePlus,
  Save
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";

const CATEGORIES = [
  { value: "Tecnología", icon: "💻", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "Salud", icon: "🏥", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  { value: "Educación", icon: "📚", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  { value: "Finanzas", icon: "💰", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { value: "E-commerce", icon: "🛒", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "SaaS", icon: "☁️", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { value: "Marketplace", icon: "🏪", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  { value: "Social Media", icon: "📱", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  { value: "Gaming", icon: "🎮", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { value: "Otro", icon: "🚀", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" }
];

const STAGES = [
  { value: "ideation", label: "Ideación", icon: Lightbulb, description: "Tengo una idea pero aún no la he validado" },
  { value: "validation", label: "Validación", icon: Target, description: "Estoy validando mi idea con usuarios" },
  { value: "mvp", label: "MVP", icon: Rocket, description: "Tengo un producto mínimo viable" },
  { value: "first_sale", label: "Primera Venta", icon: TrendingUp, description: "Ya tengo mis primeros clientes" },
  { value: "growth", label: "Crecimiento", icon: Sparkles, description: "Estoy escalando mi negocio" }
];

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    stage: "ideation",
    visibility: "private",
    logo_url: "",
  });

  const canSubmit = formData.name.trim() && formData.description.trim();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Autoguardado cada 50 segundos (solo si no está subiendo imágenes)
  // Usamos useRef para mantener una referencia estable a los valores actuales
  const formDataRef = React.useRef(formData);
  const projectIdRef = React.useRef(projectId);
  const loadingRef = React.useRef(loading);
  const uploadingLogoRef = React.useRef(uploadingLogo);
  const autosavingRef = React.useRef(autosaving);

  // Actualizar refs cuando cambien los valores
  React.useEffect(() => {
    formDataRef.current = formData;
    projectIdRef.current = projectId;
    loadingRef.current = loading;
    uploadingLogoRef.current = uploadingLogo;
    autosavingRef.current = autosaving;
  }, [formData, projectId, loading, uploadingLogo, autosaving]);

  useEffect(() => {
    // Solo autoguardar si hay datos, no está cargando y no está subiendo imágenes
    if (loadingRef.current || uploadingLogoRef.current || 
        !formDataRef.current.name.trim() || !formDataRef.current.description.trim() || !projectIdRef.current) {
      return;
    }


    const autosaveInterval = setInterval(async () => {
      // Verificar nuevamente antes de guardar usando refs
      if (uploadingLogoRef.current || autosavingRef.current) {
        return;
      }

      const currentFormData = formDataRef.current;
      const currentProjectId = projectIdRef.current;

      // Verificar que aún hay datos válidos
      if (!currentFormData.name.trim() || !currentFormData.description.trim() || !currentProjectId) {
        return;
      }

      try {
        setAutosaving(true);
        autosavingRef.current = true;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setAutosaving(false);
          autosavingRef.current = false;
          return;
        }


        const { error: updateError, data } = await supabase
          .from("startups")
          .update({
            name: currentFormData.name,
            description: currentFormData.description,
            category: currentFormData.category || null,
            stage: currentFormData.stage,
            visibility: currentFormData.visibility,
            logo_url: currentFormData.logo_url || null,
          })
          .eq("id", currentProjectId)
          .select();

        if (updateError) {
          console.error("❌ Error en autoguardado:", updateError);
          setError(`Error en autoguardado: ${updateError.message}`);
        } else {
          setLastAutosave(new Date());
        }
      } catch (error: any) {
        console.error("❌ Error en autoguardado:", error);
        setError(`Error en autoguardado: ${error.message}`);
      } finally {
        setAutosaving(false);
        autosavingRef.current = false;
      }
    }, 50000); // 50 segundos

    return () => {
      clearInterval(autosaveInterval);
    };
  }, [supabase]); // Solo dependemos de supabase que es estable

  const loadProject = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const { data: project, error: projectError } = await supabase
        .from("startups")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError || !project) {
        setError("Proyecto no encontrado");
        return;
      }

      // Verificar que el usuario es el creador o miembro del equipo
      const isCreator = project.student_id === session.user.id;
      const { data: member } = await supabase
        .from("team_members")
        .select("id")
        .eq("startup_id", projectId)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!isCreator && !member) {
        setError("No tienes permisos para editar este proyecto");
        return;
      }

      setFormData({
        name: project.name || "",
        description: project.description || "",
        category: project.category || "",
        stage: project.stage || "ideation",
        visibility: project.visibility || "private",
        logo_url: project.logo_url || "",
      });
    } catch (error: any) {
      console.error("Error loading project:", error);
      setError(error.message || "Error al cargar el proyecto");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive("logo");
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      const errorMsg = "Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WEBP)";
      console.error("❌", errorMsg);
      setError(errorMsg);
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errorMsg = "El archivo es demasiado grande. Máximo 5MB";
      console.error("❌", errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setUploadingLogo(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "logo");

      const response = await fetch("/api/projects/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Error al subir la logo";
        console.error(`❌ Error al subir logo:`, errorMsg);
        setError(errorMsg);
        return;
      }

      // Actualizar el estado usando función de callback para asegurar que tenemos el estado más reciente
      setFormData((prev) => {
        const updated = {
          ...prev,
          logo_url: data.url,
        };
        return updated;
      });
      
      // Resetear el input para permitir subir otra imagen
      const input = document.getElementById("logo-upload-input-edit") as HTMLInputElement;
      if (input) {
        input.value = "";
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      console.error(`Error uploading logo:`, error);
      setError(error.message || "Error al subir la logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
      // Resetear el input después de procesar
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const { error: updateError } = await supabase
        .from("startups")
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category || null,
          stage: formData.stage,
          visibility: formData.visibility,
          logo_url: formData.logo_url || null,
        })
        .eq("id", projectId);

      if (updateError) {
        console.error("Error updating project:", updateError);
        setError(updateError.message || "Error al actualizar el proyecto");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/projects`);
      }, 1500);
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al actualizar el proyecto");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando proyecto..." />;
  }

  const selectedCategory = CATEGORIES.find(c => c.value === formData.category);
  const selectedStage = STAGES.find(s => s.value === formData.stage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl h-8 sm:h-9 px-2 sm:px-3">
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1 sm:ml-2">Volver</span>
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="truncate">Editar Proyecto</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Actualiza la información básica de tu proyecto
              </p>
            </div>
          </div>
          {/* Indicador de autoguardado */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            {autosaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-blue-600" />
                <span>Guardando...</span>
              </>
            ) : lastAutosave ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span className="truncate">
                  Guardado {lastAutosave.toLocaleTimeString('es-CO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <Card className="border-red-200 bg-red-50 rounded-xl shadow-sm">
              <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
                <div className="flex items-start sm:items-center gap-2">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="font-medium text-red-800 text-xs sm:text-sm break-words">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card className="border-blue-100 bg-white rounded-xl shadow-sm">
              <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
                <div className="flex items-start sm:items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="font-medium text-green-800 text-xs sm:text-sm break-words">Proyecto actualizado exitosamente. Redirigiendo...</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Información Básica */}
              <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs sm:text-sm font-semibold">
                      Nombre del Proyecto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Ej: Mi Startup Innovadora"
                      className="h-10 sm:h-12 text-xs sm:text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Elige un nombre memorable y descriptivo
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs sm:text-sm font-semibold">
                      Descripción <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      placeholder="Describe tu proyecto en 2-3 oraciones. ¿Qué problema resuelve? ¿Para quién es?"
                      rows={4}
                      className="text-xs sm:text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      {formData.description.length}/500 caracteres
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Categoría y Etapa */}
              <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    Categoría y Etapa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-xs sm:text-sm font-semibold">Categoría</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.value })}
                          className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                            formData.category === cat.value
                              ? "border-blue-500 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{cat.icon}</div>
                          <div className="text-xs sm:text-sm font-medium break-words">{cat.value}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-xs sm:text-sm font-semibold">
                      Etapa Actual <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2">
                      {STAGES.map((stage) => {
                        const Icon = stage.icon;
                        return (
                          <button
                            key={stage.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, stage: stage.value })}
                            className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                              formData.stage === stage.value
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0 ${formData.stage === stage.value ? "text-blue-600" : "text-gray-500"}`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-xs sm:text-sm">{stage.label}</div>
                                <div className="text-xs text-gray-600 mt-1 break-words">
                                  {stage.description}
                                </div>
                              </div>
                              {formData.stage === stage.value && (
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logo */}
              <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base sm:text-lg">
                    <ImagePlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    Logo del Proyecto (Opcional)
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Agrega un logo para hacer tu proyecto más atractivo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-xs sm:text-sm font-semibold">Logo del Proyecto</Label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 transition-all ${
                        dragActive === "logo"
                          ? "border-blue-500 bg-blue-50"
                          : formData.logo_url
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      {formData.logo_url ? (
                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                          <img
                            src={formData.logo_url}
                            alt="Logo"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover shadow-lg border-2 border-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, logo_url: "" })}
                            className="h-8 sm:h-9 text-xs sm:text-sm"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                            Cambiar Logo
                          </Button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="logo-upload-input-edit"
                          className="flex flex-col items-center gap-3 sm:gap-4 cursor-pointer"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-xs sm:text-sm mb-1">
                              {uploadingLogo ? "Subiendo..." : "Arrastra una imagen aquí"}
                            </p>
                            <p className="text-xs text-gray-500 mb-3 sm:mb-4">
                              o haz clic para seleccionar
                            </p>
                            <Button
                              type="button"
                              disabled={uploadingLogo}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl h-8 sm:h-9 text-xs sm:text-sm cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const input = document.getElementById('logo-upload-input-edit') as HTMLInputElement;
                                if (input && !uploadingLogo) {
                                  input.click();
                                }
                              }}
                            >
                              {uploadingLogo ? (
                                <>
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 animate-spin" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                                  Seleccionar Logo
                                </>
                              )}
                            </Button>
                            <input
                              id="logo-upload-input-edit"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={handleLogoUpload}
                              className="hidden"
                              disabled={uploadingLogo}
                            />
                          </div>
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Máximo 5MB. Formatos: JPEG, PNG, WEBP. Recomendado: 512x512px
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview & Settings */}
            <div className="space-y-4 sm:space-y-6">
              {/* Preview */}
              <Card className="border-blue-100 bg-white rounded-2xl shadow-sm lg:sticky lg:top-4">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-gray-800">Vista Previa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border-2 border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm truncate">
                        {formData.name || "Nombre del Proyecto"}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 break-words">
                        {formData.description || "Descripción del proyecto..."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedCategory && (
                      <Badge className={`text-xs ${selectedCategory.color}`}>
                        {selectedCategory.icon} {selectedCategory.value}
                      </Badge>
                    )}
                    {selectedStage && (
                      <Badge variant="outline" className="text-xs">
                        {selectedStage.label}
                      </Badge>
                    )}
                    <Badge variant={formData.visibility === "public" ? "default" : "secondary"} className="text-xs">
                      {formData.visibility === "public" ? (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Público
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Privado
                        </>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Visibilidad */}
              <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    Visibilidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: "private" })}
                    className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                      formData.visibility === "private"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm">Privado</div>
                        <div className="text-xs text-gray-600 mt-0.5 break-words">
                          Solo tú y tu equipo pueden verlo
                        </div>
                      </div>
                      {formData.visibility === "private" && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: "public" })}
                    className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                      formData.visibility === "public"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm">Público</div>
                        <div className="text-xs text-gray-600 mt-0.5 break-words">
                          Visible en la galería de la comunidad
                        </div>
                      </div>
                      {formData.visibility === "public" && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={saving || !canSubmit}
                className="w-full h-10 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-md"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>

              {!canSubmit && (
                <p className="text-xs text-center text-gray-500">
                  Completa los campos requeridos para continuar
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

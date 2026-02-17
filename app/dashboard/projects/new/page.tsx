"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ImagePlus
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "Tecnología", icon: "💻", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800" },
  { value: "Salud", icon: "🏥", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800" },
  { value: "Educación", icon: "📚", color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800" },
  { value: "Finanzas", icon: "💰", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800" },
  { value: "E-commerce", icon: "🛒", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800" },
  { value: "SaaS", icon: "☁️", color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800" },
  { value: "Marketplace", icon: "🏪", color: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800" },
  { value: "Social Media", icon: "📱", color: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-800" },
  { value: "Gaming", icon: "🎮", color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800" },
  { value: "Otro", icon: "🚀", color: "bg-muted text-muted-foreground border-border" }
];

const STAGES = [
  { value: "ideation", label: "Ideación", icon: Lightbulb, description: "Tengo una idea pero aún no la he validado" },
  { value: "validation", label: "Validación", icon: Target, description: "Estoy validando mi idea con usuarios" },
  { value: "mvp", label: "MVP", icon: Rocket, description: "Tengo un producto mínimo viable" },
  { value: "first_sale", label: "Primera Venta", icon: TrendingUp, description: "Ya tengo mis primeros clientes" },
  { value: "growth", label: "Crecimiento", icon: Sparkles, description: "Estoy escalando mi negocio" }
];

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dragActive, setDragActive] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    stage: "ideation",
    visibility: "private",
    logo_url: "",
    cover_image_url: "",
  });

  const canSubmit = formData.name.trim() && formData.description.trim();

  const handleDrag = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(type);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (type === "logo") {
        handleFileUpload(file, "logo");
      } else {
        handleFileUpload(file, "cover");
      }
    }
  };

  const handleFileUpload = async (file: File, type: "logo" | "cover") => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WEBP)");
      return;
    }

    const maxSize = type === "logo" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo ${type === "logo" ? "5MB" : "10MB"}`);
      return;
    }

    try {
      if (type === "logo") {
        setUploadingLogo(true);
      } else {
        setUploadingCover(true);
      }
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", type);

      const response = await fetch("/api/projects/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Error al subir la ${type === "logo" ? "logo" : "imagen de portada"}`);
        return;
      }

      // Actualizar el estado usando función de callback para asegurar que tenemos el estado más reciente
      setFormData((prev) => ({
        ...prev,
        [`${type}_url`]: data.url,
      }));
      
      // Resetear el input para permitir subir otra imagen
      const inputId = type === "logo" ? "logo-upload-input" : "cover-upload-input";
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        input.value = "";
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      setError(error.message || `Error al subir la ${type === "logo" ? "logo" : "imagen de portada"}`);
    } finally {
      if (type === "logo") {
        setUploadingLogo(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file, "logo");
      // Resetear el input después de procesar
      e.target.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file, "cover");
      // Resetear el input después de procesar
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("startups")
        .insert({
          student_id: session.user.id,
          name: formData.name,
          description: formData.description,
          category: formData.category || null,
          stage: formData.stage,
          visibility: formData.visibility,
          logo_url: formData.logo_url || null,
          cover_image_url: formData.cover_image_url || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating project:", insertError);
        setError(insertError.message || "Error al crear el proyecto");
        return;
      }

      // Guardar el proyecto seleccionado en localStorage
      localStorage.setItem("selected_project_id", data.id);
      
      // Redirigir directamente a validación con el proyecto creado
      router.push(`/vitavalidator?startupId=${data.id}`);
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al crear el proyecto");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === formData.category);
  const selectedStage = STAGES.find(s => s.value === formData.stage);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 max-w-5xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Crear Nuevo Proyecto
              </h1>
              <p className="text-muted-foreground">
                Completa los campos básicos y comienza a construir tu startup
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <X className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <p>Imagen subida exitosamente</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-semibold">
                      Nombre del Proyecto <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Ej: Mi Startup Innovadora"
                      className="h-12 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Elige un nombre memorable y descriptivo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-semibold">
                      Descripción <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      placeholder="Describe tu proyecto en 2-3 oraciones. ¿Qué problema resuelve? ¿Para quién es?"
                      rows={4}
                      className="text-base resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/500 caracteres
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Categoría y Etapa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Categoría y Etapa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Categoría</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.value })}
                          className={`p-4 rounded-lg border transition-all text-left ${
                            formData.category === cat.value
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                          }`}
                        >
                          <div className="text-2xl mb-2">{cat.icon}</div>
                          <div className="text-sm font-medium">{cat.value}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Etapa Actual <span className="text-destructive">*</span>
                    </Label>
                    <div className="space-y-2">
                      {STAGES.map((stage) => {
                        const Icon = stage.icon;
                        return (
                          <button
                            key={stage.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, stage: stage.value })}
                            className={`w-full p-4 rounded-lg border transition-all text-left ${
                              formData.stage === stage.value
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border hover:border-primary/30 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className={`h-5 w-5 mt-0.5 ${formData.stage === stage.value ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="flex-1">
                                <div className="font-semibold">{stage.label}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {stage.description}
                                </div>
                              </div>
                              {formData.stage === stage.value && (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Imágenes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-primary" />
                    Imágenes (Opcional)
                  </CardTitle>
                  <CardDescription>
                    Agrega un logo y una imagen de portada para hacer tu proyecto más atractivo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Logo del Proyecto</Label>
                    <div
                      onDragEnter={(e) => handleDrag(e, "logo")}
                      onDragLeave={(e) => handleDrag(e, "logo")}
                      onDragOver={(e) => handleDrag(e, "logo")}
                      onDrop={(e) => handleDrop(e, "logo")}
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                        dragActive === "logo"
                          ? "border-primary bg-primary/10"
                          : formData.logo_url
                          ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {formData.logo_url ? (
                        <div className="flex flex-col items-center gap-4">
                          <img
                            src={formData.logo_url}
                            alt="Logo"
                            className="w-32 h-32 rounded-lg object-cover shadow-lg border-4 border-background"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, logo_url: "" })}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cambiar Logo
                          </Button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="logo-upload-input"
                          className="flex flex-col items-center gap-4 cursor-pointer"
                          onClick={(e) => {
                            // Si se hace click en el botón, no hacer nada (el botón maneja su propio click)
                            if ((e.target as HTMLElement).closest('button')) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          <div className="w-24 h-24 rounded-lg bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-primary/60" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium mb-1">
                              {uploadingLogo ? "Subiendo..." : "Arrastra una imagen aquí"}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              o haz clic para seleccionar
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={uploadingLogo}
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const input = document.getElementById('logo-upload-input') as HTMLInputElement;
                                if (input && !uploadingLogo) {
                                  input.click();
                                }
                              }}
                            >
                              {uploadingLogo ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Seleccionar Logo
                                </>
                              )}
                            </Button>
                            <input
                              id="logo-upload-input"
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
                    <p className="text-xs text-muted-foreground">
                      Máximo 5MB. Formatos: JPEG, PNG, WEBP. Recomendado: 512x512px
                    </p>
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Imagen de Portada</Label>
                    <div
                      onDragEnter={(e) => handleDrag(e, "cover")}
                      onDragLeave={(e) => handleDrag(e, "cover")}
                      onDragOver={(e) => handleDrag(e, "cover")}
                      onDrop={(e) => handleDrop(e, "cover")}
                      className={`relative border-2 border-dashed rounded-lg transition-all overflow-hidden ${
                        dragActive === "cover"
                          ? "border-primary bg-primary/10"
                          : formData.cover_image_url
                          ? "border-green-500/50"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {formData.cover_image_url ? (
                        <div className="relative">
                          <img
                            src={formData.cover_image_url}
                            alt="Cover"
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute top-4 right-4">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setFormData((prev) => ({ ...prev, cover_image_url: "" }))}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cambiar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 p-6">
                          <div className="w-16 h-16 rounded-lg bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-primary/60" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium mb-1">
                              {uploadingCover ? "Subiendo..." : "Arrastra una imagen aquí"}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              o haz clic para seleccionar
                            </p>
                            <div>
                              <input
                                id="cover-upload-input"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleCoverUpload}
                                className="hidden"
                                disabled={uploadingCover}
                              />
                              <label htmlFor="cover-upload-input" className="cursor-pointer inline-block">
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={uploadingCover}
                                  className="cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const input = document.getElementById('cover-upload-input') as HTMLInputElement;
                                    if (input && !uploadingCover) {
                                      input.click();
                                    }
                                  }}
                                >
                                  {uploadingCover ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Subiendo...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Seleccionar Portada
                                    </>
                                  )}
                                </Button>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Máximo 10MB. Formatos: JPEG, PNG, WEBP. Recomendado: 1920x1080px
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview & Settings */}
            <div className="space-y-6">
              {/* Preview */}
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Vista Previa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.cover_image_url ? (
                    <div className="relative h-32 rounded-lg overflow-hidden">
                      <img
                        src={formData.cover_image_url}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="w-16 h-16 rounded-lg object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Rocket className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {formData.name || "Nombre del Proyecto"}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {formData.description || "Descripción del proyecto..."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedCategory && (
                      <Badge className={`${selectedCategory.color} border`}>
                        {selectedCategory.icon} {selectedCategory.value}
                      </Badge>
                    )}
                    {selectedStage && (
                      <Badge variant="outline">
                        {selectedStage.label}
                      </Badge>
                    )}
                    <Badge variant={formData.visibility === "public" ? "default" : "secondary"}>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Visibilidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: "private" })}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      formData.visibility === "private"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-semibold">Privado</div>
                        <div className="text-sm text-muted-foreground">
                          Solo tú y tu equipo pueden verlo
                        </div>
                      </div>
                      {formData.visibility === "private" && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: "public" })}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      formData.visibility === "public"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-semibold">Público</div>
                        <div className="text-sm text-muted-foreground">
                          Visible en la galería de la comunidad
                        </div>
                      </div>
                      {formData.visibility === "public" && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full h-12 text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creando Proyecto...
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5 mr-2" />
                    Crear Proyecto
                  </>
                )}
              </Button>

              {!canSubmit && (
                <p className="text-xs text-center text-muted-foreground">
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

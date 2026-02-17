"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  FileText, 
  Loader2, 
  ArrowLeft,
  Save,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Globe,
  Edit,
  RefreshCw,
  Sparkles,
  Trash2,
  Code,
  Monitor,
  Smartphone
} from "lucide-react";
import Link from "next/link";

export default function EditLandingPagePage() {
  const params = useParams();
  const router = useRouter();
  const landingPageId = params.id as string;
  const supabase = createClient();
  
  const [landingPage, setLandingPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingWithAI, setEditingWithAI] = useState(false);
  const [aiInstructions, setAiInstructions] = useState("");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    headline: "",
    subheadline: "",
    description: "",
    cta_text: "Get Started",
    cta_url: "",
    html_content: "",
    css_content: "",
  });

  const refreshPreview = useCallback(() => {
    setPreviewKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (landingPageId) {
      loadLandingPage();
    }
  }, [landingPageId]);

  const loadLandingPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const response = await fetch(`/api/validation/landing-page?id=${landingPageId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar la landing page");
      }

      if (data.landingPage) {
        setLandingPage(data.landingPage);
        setFormData({
          title: data.landingPage.title || "",
          headline: data.landingPage.headline || "",
          subheadline: data.landingPage.subheadline || "",
          description: data.landingPage.description || "",
          cta_text: data.landingPage.cta_text || "Get Started",
          cta_url: data.landingPage.cta_url || "",
          html_content: data.landingPage.html_content || "",
          css_content: data.landingPage.css_content || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading landing page:", error);
      setError(error.message || "Error al cargar la landing page");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!landingPage) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const updateData = {
        id: landingPageId,
        title: formData.title,
        headline: formData.headline,
        subheadline: formData.subheadline,
        description: formData.description,
        cta_text: formData.cta_text,
        cta_url: formData.cta_url || null,
        html_content: formData.html_content,
        css_content: formData.css_content,
      };

      const response = await fetch("/api/validation/landing-page", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      setSuccess("Cambios guardados exitosamente");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!landingPage) return;

    if (!confirm("¿Estás seguro de que quieres regenerar esta landing page? Se perderán los cambios no guardados.")) {
      return;
    }

    try {
      setRegenerating(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      if (!landingPage.startup_id) {
        throw new Error("La landing page no tiene una startup asociada");
      }

      const { data: startup, error: startupError } = await supabase
        .from("startups")
        .select("*")
        .eq("id", landingPage.startup_id)
        .maybeSingle();

      if (startupError) {
        throw new Error(`Error al obtener la startup: ${startupError.message}`);
      }

      if (!startup) {
        throw new Error("No se encontró la startup asociada");
      }

      const response = await fetch("/api/validation/landing-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          startupId: startup.id,
          templateName: landingPage.template_name || "modern",
          customContent: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al regenerar landing page");
      }

      if (!data.landingPage || !data.landingPage.id) {
        throw new Error("Error al regenerar la landing page");
      }

      const updateResponse = await fetch("/api/validation/landing-page", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: landingPageId,
          title: data.landingPage.title,
          headline: data.landingPage.headline,
          subheadline: data.landingPage.subheadline,
          description: data.landingPage.description,
          cta_text: data.landingPage.cta_text,
          html_content: data.landingPage.html_content,
          css_content: data.landingPage.css_content,
        }),
      });

      const updateData = await updateResponse.json();

      if (!updateResponse.ok) {
        throw new Error(updateData.error || "Error al actualizar la landing page");
      }

      setSuccess("Landing page regenerada exitosamente");
      await loadLandingPage();
      refreshPreview();
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al regenerar landing page");
    } finally {
      setRegenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!landingPage) return;

    try {
      setPublishing(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      await handleSave();

      const response = await fetch(`/api/landing-pages/${landingPageId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al publicar");
      }

      setSuccess("Landing page publicada exitosamente");
      await loadLandingPage();
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al publicar");
    } finally {
      setPublishing(false);
    }
  };

  const handleEditWithAI = async () => {
    if (!landingPage || !aiInstructions.trim()) {
      setError("Por favor, escribe instrucciones para la IA");
      return;
    }

    try {
      setEditingWithAI(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const response = await fetch("/api/validation/landing-page/edit-with-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          landingPageId: landingPageId,
          instructions: aiInstructions,
          currentContent: {
            title: formData.title,
            headline: formData.headline,
            subheadline: formData.subheadline,
            description: formData.description,
            cta_text: formData.cta_text,
            cta_url: formData.cta_url,
            html_content: formData.html_content,
            css_content: formData.css_content,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al editar con IA");
      }

      if (data.landingPage) {
        const message = data.changes || "Cambios aplicados";
        setSuccess(`✨ ${message}`);
        setAiInstructions("");
        
        // Actualizar el estado local inmediatamente
        setLandingPage(data.landingPage);
        setFormData({
          title: data.landingPage.title || "",
          headline: data.landingPage.headline || "",
          subheadline: data.landingPage.subheadline || "",
          description: data.landingPage.description || "",
          cta_text: data.landingPage.cta_text || "Get Started",
          cta_url: data.landingPage.cta_url || "",
          html_content: data.landingPage.html_content || "",
          css_content: data.landingPage.css_content || "",
        });
        
        // Refrescar la vista previa
        refreshPreview();
        
        // Recargar después de un momento para asegurar que todo esté sincronizado
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error("No se recibió la landing page editada en la respuesta");
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al editar con IA");
    } finally {
      setEditingWithAI(false);
    }
  };

  const handleDelete = async () => {
    if (!landingPage) return;

    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const response = await fetch(`/api/validation/landing-page/${landingPageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar landing page");
      }

      setSuccess("Landing page eliminada exitosamente");
      
      setTimeout(() => {
        router.push("/dashboard/validation");
      }, 1000);
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar landing page");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando landing page..." />;
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            title="Landing Page no encontrada"
            message="La landing page que buscas no existe o no tienes acceso a ella."
            action={
              <Link href="/dashboard/validation">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  Volver a Validación
                </Button>
              </Link>
            }
            fullScreen={false}
            variant="error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header - Responsive */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard/validation">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl h-8 sm:h-9 px-2 sm:px-3">
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1 sm:ml-2">Volver</span>
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-1.5 sm:gap-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 flex-shrink-0" />
                <span className="truncate">Editar Landing Page</span>
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 hidden sm:block">
                Edita y personaliza tu landing page
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={landingPage.status === "published" ? "default" : "secondary"} className="text-xs px-2 py-0.5">
              {landingPage.status === "published" ? "Publicada" : "Borrador"}
            </Badge>
            {landingPage.status === "published" && landingPage.published_url && (
              <Link href={`/l/${landingPage.published_url}`} target="_blank" className="flex-1 sm:flex-initial min-w-0">
                <Button variant="outline" size="sm" className="w-full sm:w-auto h-8 text-xs rounded-lg">
                  <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Ver Pública</span>
                </Button>
              </Link>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting} className="h-8 text-xs rounded-lg flex-shrink-0">
                  {deleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[95vw] sm:max-w-lg mx-4 sm:mx-0">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base sm:text-lg">¿Eliminar landing page?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs sm:text-sm">
                    Esta acción no se puede deshacer. Se eliminará permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground text-xs sm:text-sm">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <Card className="border-green-200 bg-green-50 rounded-xl">
            <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
              <div className="flex items-start sm:items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="font-medium text-green-800 text-xs sm:text-sm break-words">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 rounded-xl">
            <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
              <div className="flex items-start sm:items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="font-medium text-red-800 text-xs sm:text-sm break-words">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Grid - Responsive */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm order-2 lg:order-1">
            <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-sm sm:text-base md:text-lg">
                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                Contenido
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Edita el contenido de tu landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs sm:text-sm">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título de la página"
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cta_text" className="text-xs sm:text-sm">Texto CTA</Label>
                <Input
                  id="cta_text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  placeholder="Get Started"
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="headline" className="text-xs sm:text-sm">Headline Principal</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="Headline impactante"
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="subheadline" className="text-xs sm:text-sm">Subheadline</Label>
                <Input
                  id="subheadline"
                  value={formData.subheadline}
                  onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                  placeholder="Subheadline descriptivo"
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada"
                  rows={3}
                  className="text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cta_url" className="text-xs sm:text-sm">URL del Botón CTA (Opcional)</Label>
                <Input
                  id="cta_url"
                  type="url"
                  value={formData.cta_url}
                  onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                  placeholder="https://ejemplo.com"
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
              </div>

              {/* AI Editor */}
              <div className="space-y-2 pt-3 border-t border-gray-100 sm:col-span-2">
                <Label htmlFor="ai_instructions" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500 flex-shrink-0" />
                  Editar con IA
                </Label>
                <Textarea
                  id="ai_instructions"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="Ej: Traduce a español, cambia el color a azul..."
                  rows={2}
                  className="text-xs sm:text-sm resize-none"
                />
                <Button
                  onClick={handleEditWithAI}
                  disabled={editingWithAI || !aiInstructions.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl h-8 sm:h-9 text-xs sm:text-sm"
                >
                  {editingWithAI ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                      Editando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Aplicar con IA
                    </>
                  )}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-gray-100 sm:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button onClick={handleSave} disabled={saving} className="h-8 sm:h-9 text-xs sm:text-sm rounded-xl">
                    {saving ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin mr-1.5" /> : <Save className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                    Guardar
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={publishing || landingPage.status === "published"}
                    variant={landingPage.status === "published" ? "outline" : "default"}
                    className="h-8 sm:h-9 text-xs sm:text-sm rounded-xl"
                  >
                    {publishing ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin mr-1.5" /> : <Globe className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                    {landingPage.status === "published" ? "Publicada" : "Publicar"}
                  </Button>
                </div>
                <Button onClick={handleRegenerate} disabled={regenerating} variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm rounded-xl">
                  {regenerating ? <Loader2 className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                  Regenerar con IA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm order-1 lg:order-2">
            <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-sm sm:text-base md:text-lg">
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-cyan-600 flex-shrink-0" />
                    Vista Previa
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Previsualiza tu landing page
                  </CardDescription>
                </div>
                {/* Device Toggle */}
                <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-1.5 rounded transition-all ${
                      previewMode === "mobile" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"
                    }`}
                    aria-label="Vista móvil"
                  >
                    <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-1.5 rounded transition-all ${
                      previewMode === "desktop" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"
                    }`}
                    aria-label="Vista desktop"
                  >
                    <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              {/* Preview Container */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
                <div className="bg-gray-100 px-2 py-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400"></div>
                  <span className="ml-2 text-[9px] sm:text-[10px] text-gray-400">
                    {previewMode === "mobile" ? "375×667" : "Desktop"}
                  </span>
                </div>
                <div 
                  className={`bg-gray-50 overflow-auto ${
                    previewMode === "mobile" ? "flex justify-center p-2 sm:p-3" : "p-1.5 sm:p-2"
                  } sm:min-h-[250px] sm:max-h-[400px] md:min-h-[300px] md:max-h-[450px]`}
                  style={{
                    minHeight: previewMode === "mobile" ? "250px" : "200px",
                    maxHeight: previewMode === "mobile" ? "350px" : "300px",
                  }}
                >
                  {formData.html_content ? (
                    <iframe
                      key={`preview-${previewMode}-${previewKey}-${formData.html_content.length}`}
                      srcDoc={formData.html_content
                        .replace(/{cta_text}/g, formData.cta_text || "Get Started")
                        .replace(/{cta_url}/g, formData.cta_url || "#")
                        .replace('</head>', `<meta name="preview-version" content="${previewKey}">\n</head>`)}
                      className="bg-white rounded-lg"
                      style={{ 
                        width: previewMode === "mobile" ? "240px" : "100%",
                        height: previewMode === "mobile" ? "400px" : "320px",
                        border: previewMode === "mobile" ? '4px solid #374151' : '1px solid #e5e7eb',
                        borderRadius: previewMode === "mobile" ? '1rem' : '0.5rem',
                        transform: previewMode === "mobile" ? "scale(0.85)" : "scale(1)",
                        transformOrigin: "top center",
                      }}
                      title="Landing Page Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs sm:text-sm px-4">
                      No hay contenido HTML
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs rounded-lg"
                onClick={() => {
                  const previewWindow = window.open('', '_blank');
                  if (previewWindow && formData.html_content) {
                    previewWindow.document.write(formData.html_content);
                    previewWindow.document.close();
                  }
                }}
                disabled={!formData.html_content}
              >
                <ExternalLink className="h-3 w-3 mr-1.5 flex-shrink-0" />
                <span className="truncate">Abrir en Nueva Pestaña</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* HTML/CSS Editor - Collapsible */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <button
              onClick={() => setShowHtmlEditor(!showHtmlEditor)}
              className="flex items-center justify-between w-full text-left"
            >
              <CardTitle className="flex items-center gap-2 text-gray-800 text-sm sm:text-base">
                <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">Editor HTML/CSS (Avanzado)</span>
              </CardTitle>
              <span className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${showHtmlEditor ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </CardHeader>
          {showHtmlEditor && (
            <CardContent className="space-y-3 sm:space-y-4 pt-2 p-4 sm:p-6">
              <div className="space-y-1.5">
                <Label htmlFor="html_content" className="text-xs">HTML</Label>
                <Textarea
                  id="html_content"
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  placeholder="<html>...</html>"
                  rows={6}
                  className="font-mono text-[10px] sm:text-xs resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="css_content" className="text-xs">CSS Adicional</Label>
                <Textarea
                  id="css_content"
                  value={formData.css_content}
                  onChange={(e) => setFormData({ ...formData, css_content: e.target.value })}
                  placeholder="/* CSS adicional */"
                  rows={4}
                  className="font-mono text-[10px] sm:text-xs resize-none"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
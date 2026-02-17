"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Loader2, 
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Rocket,
  Palette,
  Layout,
  Zap,
  Target,
  Users,
  Star
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

const TEMPLATES = [
  { 
    value: "modern", 
    label: "Moderno", 
    description: "Diseño limpio con gradientes sutiles",
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    bestFor: "Startups tech, SaaS"
  },
  { 
    value: "minimal", 
    label: "Minimalista", 
    description: "Simple, elegante y directo",
    icon: Layout,
    color: "from-gray-500 to-gray-600",
    bgColor: "bg-gray-50",
    bestFor: "Productos premium"
  },
  { 
    value: "bold", 
    label: "Audaz", 
    description: "Colores vibrantes y llamativos",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    bestFor: "Marcas jóvenes"
  },
  { 
    value: "professional", 
    label: "Profesional", 
    description: "Corporativo y confiable",
    icon: Target,
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50",
    bestFor: "B2B, Enterprise"
  },
];

const FEATURES = [
  { icon: CheckCircle2, text: "Hero Section con CTA prominente" },
  { icon: Users, text: "Sección Problema/Solución" },
  { icon: Star, text: "Beneficios destacados" },
  { icon: Layout, text: "100% Responsive" },
  { icon: Target, text: "Optimizado para conversión" },
  { icon: Zap, text: "Animaciones suaves" },
];

export default function NewLandingPagePage() {
  const router = useRouter();
  const supabase = createClient();
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    templateName: "modern",
    customContent: "",
  });

  // Cloudinary URLs
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const lolaValidationUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-validation_wiidbw`;

  useEffect(() => {
    loadStartup();
  }, []);

  const loadStartup = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const { data: startups, error: startupError } = await supabase
        .from("startups")
        .select("*")
        .eq("student_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (startupError) {
        throw new Error(startupError.message);
      }

      if (!startups || startups.length === 0) {
        setError("No tienes una startup. Crea una primero.");
        return;
      }

      setStartup(startups[0]);
    } catch (error: any) {
      console.error("Error loading startup:", error);
      setError(error.message || "Error al cargar la startup");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!startup) return;

    try {
      setGenerating(true);
      setError(null);
      setSuccess(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Debes iniciar sesión");
        return;
      }

      const response = await fetch("/api/validation/landing-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          startupId: startup.id,
          templateName: formData.templateName,
          customContent: formData.customContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar landing page");
      }

      if (!data.landingPage || !data.landingPage.id) {
        throw new Error("Error al generar la landing page");
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push(`/dashboard/validation/landing-page/${data.landingPage.id}`);
      }, 1500);
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al generar landing page");
    } finally {
      setGenerating(false);
    }
  };

  const selectedTemplate = TEMPLATES.find(t => t.value === formData.templateName);

  if (loading) {
    return <LoadingState message="Cargando..." />;
  }

  if (error && !startup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            title="Error"
            message={error}
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/validation">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl h-9 px-3">
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                Nueva Landing Page
              </h1>
              <p className="text-gray-500 text-xs md:text-sm mt-0.5 hidden sm:block">
                Genera una landing page para tu startup con IA
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 rounded-xl">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="font-medium text-red-800 text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {success && (
          <Card className="border-green-200 bg-green-50 rounded-xl">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="font-medium text-green-800 text-sm">¡Landing page generada exitosamente! Redirigiendo...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Form - Left Side (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Step 1: Template Selection */}
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}>1</div>
                  <CardTitle className="text-gray-800">Elige un Template</CardTitle>
                </div>
                <CardDescription>
                  Selecciona el estilo que mejor represente tu startup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  const isSelected = formData.templateName === template.value;
                  return (
                    <button
                      key={template.value}
                      onClick={() => {
                        setFormData({ ...formData, templateName: template.value });
                        setStep(2);
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${template.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{template.label}</h3>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{template.description}</p>
                          <Badge variant="secondary" className="text-xs">{template.bestFor}</Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Step 2: Custom Content (Optional) */}
            {step >= 2 && (
              <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>2</div>
                    <CardTitle className="text-gray-800">Contenido Personalizado (Opcional)</CardTitle>
                  </div>
                  <CardDescription>
                    Agrega instrucciones específicas para la IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customContent" className="text-sm">Instrucciones adicionales</Label>
                    <Textarea
                      id="customContent"
                      value={formData.customContent}
                      onChange={(e) => setFormData({ ...formData, customContent: e.target.value })}
                      placeholder="Ej: Incluye testimonios, usa colores corporativos, menciona características específicas..."
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>
                  <Button
                    onClick={() => setStep(3)}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl h-10 text-sm"
                  >
                    Continuar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review & Generate */}
            {step >= 3 && startup && (
              <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}>3</div>
                    <CardTitle className="text-gray-800">Información de tu Startup</CardTitle>
                  </div>
                  <CardDescription>
                    Esta información se usará para generar el contenido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Nombre</p>
                        <p className="font-semibold text-gray-800">{startup.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Categoría</p>
                        <p className="font-semibold text-gray-800">{startup.category || "No definida"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Descripción</p>
                      <p className="text-sm text-gray-700">{startup.description || "No definida"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Problema</p>
                      <p className="text-sm text-gray-700">{startup.problem || "No definido"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Solución</p>
                      <p className="text-sm text-gray-700">{startup.solution || "No definida"}</p>
                    </div>
                  </div>

                  {(!startup.problem || !startup.solution) && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <Link href="/dashboard/startup-builder" className="text-xs text-amber-700 hover:underline">
                        Completa más información en el Constructor para mejores resultados
                      </Link>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={generating || success}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl h-12 text-base"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generando tu landing page...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        ¡Generada!
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generar Landing Page
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview - Right Side (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Preview */}
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Vista Previa
                </CardTitle>
                <CardDescription>
                  Así se verá tu landing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mockup */}
                <div className={`p-4 rounded-xl border-2 border-dashed bg-gradient-to-br ${selectedTemplate?.bgColor || 'bg-gray-50'}`}>
                  <div className="space-y-3">
                    {/* Header mockup */}
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-gray-300 rounded" />
                      <div className="flex gap-2">
                        <div className="h-3 w-12 bg-gray-200 rounded" />
                        <div className="h-3 w-12 bg-gray-200 rounded" />
                      </div>
                    </div>
                    {/* Hero mockup */}
                    <div className="pt-4 space-y-2">
                      <div className={`h-3 w-1/3 rounded bg-gradient-to-r ${selectedTemplate?.color || 'from-gray-300 to-gray-400'}`} />
                      <div className={`h-6 w-full rounded bg-gradient-to-r ${selectedTemplate?.color || 'from-gray-300 to-gray-400'}`} />
                      <div className="h-3 w-5/6 bg-gray-200 rounded" />
                      <div className={`h-10 w-1/2 rounded-lg mt-4 bg-gradient-to-r ${selectedTemplate?.color || 'from-gray-400 to-gray-500'}`} />
                    </div>
                    {/* Features mockup */}
                    <div className="pt-4 grid grid-cols-2 gap-2">
                      <div className="h-16 bg-white/50 rounded-lg" />
                      <div className="h-16 bg-white/50 rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Incluirá:
                  </p>
                  <div className="space-y-2">
                    {FEATURES.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <Icon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span>{feature.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tip */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Tip Pro
                  </p>
                  <p className="text-xs text-blue-600">
                    Después de generar, podrás editar todo el contenido y personalizar los colores.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

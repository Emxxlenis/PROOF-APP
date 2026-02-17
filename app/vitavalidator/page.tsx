"use client";

// Marcar como dinámico para evitar prerenderización
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingState } from "@/components/ui/loading-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Calendar,
  Target,
  Code,
  ShoppingCart,
  Users,
  DollarSign,
  MapPin,
  ArrowRight,
  Zap,
  User as UserIcon,
  Rocket,
  BookOpen,
  Info,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { TutorialOverlay } from "@/components/ui/tutorial-overlay";
import { GuideCard } from "@/components/ui/guide-card";

interface ValidationResult {
  viability_score: number;
  technical_score: number;
  market_score: number;
  competition_score: number;
  business_model_score: number;
  context_score: number;
  strengths: {
    top_3: string[];
    detailed: Record<string, string>;
  };
  risks: {
    top_3: string[];
    detailed: Record<string, string>;
  };
  recommendations: {
    immediate: string[];
    "90_day_roadmap": {
      week_1_4: string;
      week_5_8: string;
      week_9_12: string;
    };
  };
  qualifies_for_builders: boolean;
}

// Componente para renderizar el roadmap formateado
function RoadmapContent({ text }: { text: string }) {
  // Función para formatear el roadmap
  const formatRoadmap = (roadmapText: string) => {
    if (!roadmapText) return null;
    
    // Intentar parsear como JSON
    try {
      const parsed = JSON.parse(roadmapText);
      
      // Si tiene estructura de Objetivos y Acciones
      if (parsed.Objetivos && parsed.Acciones) {
        return {
          objetivos: Array.isArray(parsed.Objetivos) ? parsed.Objetivos : [parsed.Objetivos],
          acciones: Array.isArray(parsed.Acciones) ? parsed.Acciones : [parsed.Acciones],
        };
      }
      
      // Si es un objeto con otras propiedades, intentar extraer información
      if (typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          // Si tiene week_1_4, week_5_8, etc., devolver el string directamente
          if (keys.some(k => k.includes('week'))) {
            return null; // Devolver null para usar el texto original
          }
        }
      }
    } catch {
      // Si no es JSON válido, devolver null para usar el texto original
    }
    
    return null;
  };

  const formatted = formatRoadmap(text);
  
  if (formatted) {
    return (
      <div className="space-y-4">
        {formatted.objetivos && formatted.objetivos.length > 0 && (
          <div>
            <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Objetivos:
            </h5>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {formatted.objetivos.map((obj: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700">{String(obj || '')}</li>
              ))}
            </ul>
          </div>
        )}
        {formatted.acciones && formatted.acciones.length > 0 && (
          <div>
            <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              Acciones:
            </h5>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {formatted.acciones.map((acc: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700">{String(acc || '')}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  // Si no se puede formatear, mostrar el texto original
  // Convertir a string y limpiar caracteres problemáticos
  const safeText = String(text || '').trim();
  return <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{safeText}</div>;
}

function VitaValidatorPageContent() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingValidation, setLoadingValidation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const validationId = searchParams.get("validation_id");
  const startupId = searchParams.get("startupId");

  // Cloudinary logo URL
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;
  const lolaValidationUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-validation_wiidbw`;
  const lolaValidationSadUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-validation-sad_cgnd4e`;

  const loadValidation = useCallback(async (id: string) => {
    if (!supabase) return;
    setLoadingValidation(true);
    setError(null);
    
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Debes iniciar sesión para ver el análisis");
      }

      // Obtener el startup_id correcto
      let startupIdToUse: string | null = null;
      
      if (startupId) {
        // Si se proporciona startupId en la URL, verificar que pertenece al usuario
        const { data: startupData, error: startupError } = await supabase
          .from("startups")
          .select("id")
          .eq("id", startupId)
          .eq("student_id", user.id)
          .single();

        if (startupError || !startupData) {
          throw new Error("No se encontró el proyecto o no tienes acceso a él.");
        }
        startupIdToUse = startupData.id;
      } else {
        // Si no hay startupId en la URL, obtener el startup_id desde la validación
        const { data: validationWithStartup, error: validationFetchError } = await supabase
          .from("validations")
          .select("startup_id")
          .eq("id", id)
          .single();

        if (validationFetchError || !validationWithStartup) {
          throw new Error("No se pudo encontrar la validación especificada.");
        }

        startupIdToUse = validationWithStartup.startup_id;

        // Verificar que el startup pertenece al usuario
        const { data: startupData, error: startupError } = await supabase
          .from("startups")
          .select("id")
          .eq("id", startupIdToUse)
          .eq("student_id", user.id)
          .single();

        if (startupError || !startupData) {
          throw new Error("No tienes acceso a este proyecto o la validación.");
        }
      }

      // Cargar la validación completa desde la base de datos
      const { data: validationData, error: validationError } = await supabase
        .from("validations")
        .select("*")
        .eq("id", id)
        .eq("startup_id", startupIdToUse)
        .single();

      if (validationError || !validationData) {
        throw new Error("No se pudo cargar el análisis. Verifica que tengas acceso a esta validación.");
      }

      // Función helper para normalizar el roadmap
      const normalizeRoadmap = (roadmap: any): { week_1_4: string; week_5_8: string; week_9_12: string } => {
        if (typeof roadmap === 'string') {
          return { week_1_4: roadmap, week_5_8: roadmap, week_9_12: roadmap };
        }
        
        if (typeof roadmap === 'object' && roadmap !== null) {
          // Si es un objeto con objetivos y acciones, convertirlo a string
          if (roadmap.objetivos && roadmap.acciones) {
            const text = `Objetivos: ${Array.isArray(roadmap.objetivos) ? roadmap.objetivos.join(', ') : roadmap.objetivos}\nAcciones: ${Array.isArray(roadmap.acciones) ? roadmap.acciones.join(', ') : roadmap.acciones}`;
            return { week_1_4: text, week_5_8: text, week_9_12: text };
          }
          
          // Si tiene las propiedades esperadas, normalizarlas
          return {
            week_1_4: typeof roadmap.week_1_4 === 'string' ? roadmap.week_1_4 : JSON.stringify(roadmap.week_1_4 || roadmap),
            week_5_8: typeof roadmap.week_5_8 === 'string' ? roadmap.week_5_8 : JSON.stringify(roadmap.week_5_8 || roadmap),
            week_9_12: typeof roadmap.week_9_12 === 'string' ? roadmap.week_9_12 : JSON.stringify(roadmap.week_9_12 || roadmap),
          };
        }
        
        return { week_1_4: String(roadmap || ''), week_5_8: String(roadmap || ''), week_9_12: String(roadmap || '') };
      };

      // Normalizar las recomendaciones
      const recommendations = validationData.recommendations || {};
      const roadmap = recommendations["90_day_roadmap"] || recommendations["90-day-roadmap"] || recommendations;
      
      // Convertir los datos de la base de datos al formato esperado
      const validationResult: ValidationResult = {
        viability_score: validationData.viability_score,
        technical_score: validationData.technical_score,
        market_score: validationData.market_score,
        competition_score: validationData.competition_score,
        business_model_score: validationData.business_model_score,
        context_score: validationData.context_score,
        strengths: validationData.strengths || { top_3: [], detailed: {} },
        risks: validationData.risks || { top_3: [], detailed: {} },
        recommendations: {
          immediate: Array.isArray(recommendations.immediate) ? recommendations.immediate : [],
          "90_day_roadmap": normalizeRoadmap(roadmap),
        },
        qualifies_for_builders: validationData.viability_score >= 70,
      };

      setResult(validationResult);
    } catch (err: any) {
      setError(err.message || "Error al cargar el análisis");
    } finally {
      setLoadingValidation(false);
    }
  }, [supabase]);

  // Inicializar cliente solo en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient());
    }
  }, []);

  // Cargar validación existente si hay validation_id
  useEffect(() => {
    if (validationId && supabase) {
      loadValidation(validationId);
    }
  }, [validationId, supabase, loadValidation]);

  // Cargar descripción del proyecto si hay startupId
  useEffect(() => {
    const loadStartupDescription = async () => {
      if (!startupId || !supabase || description) return; // No cargar si ya hay descripción
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: startupData, error } = await supabase
          .from("startups")
          .select("description, name")
          .eq("id", startupId)
          .eq("student_id", session.user.id)
          .single();

        if (!error && startupData && startupData.description) {
          setDescription(startupData.description);
        }
      } catch (err) {
        console.error("Error loading startup description:", err);
      }
    };

    loadStartupDescription();
  }, [startupId, supabase, description]);

  const handleValidate = async () => {
    if (!supabase) return;
    if (!description.trim()) {
      setError("Por favor ingresa una descripción de tu startup");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false); // Resetear estado de guardado al hacer nueva validación

    try {
      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error("Debes iniciar sesión para validar tu idea. Por favor, recarga la página e inicia sesión nuevamente.");
        }
        
        const refreshResult = await supabase.auth.refreshSession();
        session = refreshResult.data.session;
        
        if (!session) {
          throw new Error("Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.");
        }
      }

      const accessToken = session.access_token;

      const response = await fetch("/api/vitavalidator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ 
          description, 
          save: false, // No guardar por defecto
          startupId: startupId || undefined // Pasar startupId si está disponible
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al validar tu idea");
      }

      const data = await response.json();
      setResult(data.result);
      setSaved(data.saved || false); // Resetear estado de guardado
    } catch (err: any) {
      setError(err.message || "Error al validar tu idea");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveValidation = async () => {
    if (!supabase || !result) return;

    setSaving(true);
    setError(null);

    try {
      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error("Debes iniciar sesión para guardar la validación. Por favor, recarga la página e inicia sesión nuevamente.");
        }
        
        const refreshResult = await supabase.auth.refreshSession();
        session = refreshResult.data.session;
        
        if (!session) {
          throw new Error("Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.");
        }
      }

      const accessToken = session.access_token;

      const requestBody = { 
        description, 
        save: true, // Guardar explícitamente
        startupId: startupId || undefined // Pasar startupId si está disponible
      };

      const response = await fetch("/api/vitavalidator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar la validación");
      }

      const data = await response.json();
      
      setSaved(true);
      // Opcional: mostrar mensaje de éxito
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Error al guardar la validación");
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4 pt-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                Proof AI
              </h1>
              <HelpTooltip
                content="Proof AI analiza tu idea en 5 dimensiones: viabilidad técnica, mercado, competencia, modelo de negocio y contexto colombiano. Obtendrás puntajes detallados y recomendaciones específicas."
                variant="info"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("tutorial_vitavalidator_completed");
                  window.location.reload();
                }}
                className="text-xs"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Tutorial
              </Button>
            </div>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
              Valida tu idea de startup en 30 segundos con análisis multidimensional
            </p>
          </div>

          {/* Tutorial Overlay */}
          <TutorialOverlay
            steps={[
              {
                id: "welcome",
                title: "¡Bienvenido a Proof AI!",
                description: "Esta herramienta analiza tu idea de startup en 5 dimensiones críticas usando inteligencia artificial. Te dará puntajes y recomendaciones específicas.",
                position: "center",
              },
              {
                id: "description",
                title: "Describe tu Startup",
                description: "Escribe una descripción clara y específica de tu idea. Incluye: el problema que resuelves, tu solución, quién es tu audiencia y cómo monetizas. Mientras más detallado, mejor será el análisis.",
                target: "#description",
                position: "bottom",
              },
              {
                id: "validate",
                title: "Valida con IA",
                description: "Haz clic en este botón para que nuestra IA analice tu idea. El proceso toma aproximadamente 30 segundos y recibirás un análisis completo.",
                target: "[data-tutorial='validate-button']",
                position: "top",
              },
            ]}
            storageKey="vitavalidator"
            title="Tutorial de Proof AI"
            description="Aprende a usar Proof AI para validar tu idea de startup"
          />

          {!result && (
            <GuideCard
              title="Tips para una mejor validación"
              description="Sigue estos consejos para obtener un análisis más preciso de tu idea"
              steps={[
                {
                  title: "Sé específico sobre el problema",
                  description: "Explica claramente qué problema resuelves y por qué es importante. Ejemplo: 'Los estudiantes universitarios tienen dificultades para encontrar tutores confiables y asequibles'.",
                },
                {
                  title: "Describe tu solución",
                  description: "Explica cómo tu producto o servicio resuelve el problema. Incluye características principales y cómo funciona.",
                },
                {
                  title: "Define tu audiencia",
                  description: "Especifica quién es tu cliente objetivo. Ejemplo: 'Estudiantes universitarios de 18-25 años en Bogotá que necesitan apoyo académico'.",
                },
                {
                  title: "Explica tu modelo de negocio",
                  description: "Describe cómo generarás ingresos. Ejemplo: 'Comisión del 20% por cada sesión de tutoría reservada a través de la plataforma'.",
                },
                {
                  title: "Menciona el contexto colombiano",
                  description: "Si aplica, menciona aspectos específicos del mercado colombiano, regulaciones o características locales relevantes.",
                },
              ]}
              variant="info"
              className="mb-6"
            />
          )}

          {/* Loading Validation */}
          {loadingValidation && (
            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Cargando análisis completo...</p>
              </CardContent>
            </Card>
          )}

          {/* Input Card */}
          {!result && !loadingValidation && (
            <Card className="border-2 border-blue-200/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden" data-tutorial="description-card">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg relative z-10">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  Describe tu Startup
                  <HelpTooltip
                    content="Escribe una descripción completa de tu idea. Mientras más detallado seas, más preciso será el análisis. Incluye problema, solución, audiencia y modelo de negocio."
                    variant="tip"
                  />
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Explica tu idea de negocio en máximo 1000 caracteres. Sé específico sobre el problema que resuelves y cómo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 relative z-10">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2">
                    Descripción de tu idea
                    <HelpTooltip
                      content="Incluye: 1) El problema que resuelves, 2) Tu solución, 3) Tu audiencia objetivo, 4) Cómo monetizas, 5) Contexto colombiano si aplica."
                      variant="info"
                    />
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ejemplo: Una plataforma que conecta estudiantes con tutores universitarios para clases particulares. Los estudiantes pueden buscar tutores por materia, ver calificaciones y reservar sesiones. Los tutores ganan dinero compartiendo conocimiento..."
                    className="min-h-[180px] text-base resize-none"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Sé específico sobre el problema, solución y modelo de negocio
                    </p>
                    <div className={`text-sm font-medium ${
                      description.length > 900 ? "text-orange-600" : description.length > 600 ? "text-green-600" : "text-muted-foreground"
                    }`}>
                      {description.length}/1000
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                )}
                <Button
                  onClick={handleValidate}
                  disabled={loading || !description.trim()}
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white"
                  size="lg"
                  data-tutorial="validate-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analizando tu idea...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Validar Idea con IA
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Viability Score - Hero Card */}
              {result.viability_score >= 70 ? (
                <Card className="border-2 shadow-lg overflow-hidden border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 via-teal-50/30 to-cyan-50/20 relative backdrop-blur-sm">
                  {/* Decorative subtle gradient overlay */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-300/40 via-teal-300/40 to-cyan-300/40"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-200/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-200/20 to-blue-200/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                  
                  <CardHeader className="pb-5 pt-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100/60 to-teal-100/50 text-emerald-700/80 shadow-sm border border-emerald-200/40">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-semibold text-gray-800">Puntaje de Viabilidad</CardTitle>
                          <CardDescription className="text-sm mt-1 text-gray-600">
                            Análisis general de tu idea
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="text-2xl px-5 py-2 font-semibold bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-0 shadow-md"
                      >
                        {result.viability_score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 pb-6">
                    <div className="space-y-3">
                      <div className="relative">
                        <Progress 
                          value={result.viability_score} 
                          className="h-3 bg-emerald-100/50 rounded-full overflow-hidden"
                        />
                        <div 
                          className="absolute top-0 left-0 h-3 bg-gradient-to-r from-emerald-400/80 via-teal-400/80 to-cyan-400/80 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${result.viability_score}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-gray-500">
                        <span>Baja viabilidad</span>
                        <span>Alta viabilidad</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className={`border-2 shadow-lg overflow-hidden relative backdrop-blur-sm ${
                  result.viability_score >= 60
                    ? "border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-yellow-50/30 to-orange-50/20"
                    : "border-rose-200/60 bg-gradient-to-br from-rose-50/40 via-orange-50/30 to-red-50/20"
                }`}>
                  {/* Decorative subtle gradient overlay */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    result.viability_score >= 60
                      ? "bg-gradient-to-r from-amber-300/40 via-yellow-300/40 to-orange-300/40"
                      : "bg-gradient-to-r from-rose-300/40 via-orange-300/40 to-red-300/40"
                  }`}></div>
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${
                    result.viability_score >= 60
                      ? "bg-gradient-to-br from-amber-200/20 to-yellow-200/15"
                      : "bg-gradient-to-br from-rose-200/20 to-orange-200/15"
                  }`}></div>
                  <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 ${
                    result.viability_score >= 60
                      ? "bg-gradient-to-tr from-orange-200/20 to-yellow-200/15"
                      : "bg-gradient-to-tr from-red-200/20 to-orange-200/15"
                  }`}></div>
                  
                  <CardHeader className="pb-5 pt-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shadow-sm border ${
                          result.viability_score >= 60
                            ? "bg-gradient-to-br from-amber-100/60 to-yellow-100/50 text-amber-700/80 border-amber-200/40"
                            : "bg-gradient-to-br from-rose-100/60 to-orange-100/50 text-rose-700/80 border-rose-200/40"
                        }`}>
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-semibold text-gray-800">Puntaje de Viabilidad</CardTitle>
                          <CardDescription className="text-sm mt-1 text-gray-600">
                            Análisis general de tu idea
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className={`text-2xl px-5 py-2 font-semibold text-white border-0 shadow-md ${
                          result.viability_score >= 60
                            ? "bg-gradient-to-r from-amber-500/90 to-orange-500/90"
                            : "bg-gradient-to-r from-rose-500/90 to-red-500/90"
                        }`}
                      >
                        {result.viability_score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 pb-6">
                    <div className="space-y-3">
                      <div className="relative">
                        <Progress 
                          value={result.viability_score} 
                          className={`h-3 rounded-full overflow-hidden ${
                            result.viability_score >= 60
                              ? "bg-amber-100/50"
                              : "bg-rose-100/50"
                          }`}
                        />
                        <div 
                          className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-700 ease-out ${
                            result.viability_score >= 60
                              ? "bg-gradient-to-r from-amber-400/80 via-yellow-400/80 to-orange-400/80"
                              : "bg-gradient-to-r from-rose-400/80 via-orange-400/80 to-red-400/80"
                          }`}
                          style={{ width: `${result.viability_score}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-gray-500">
                        <span>Baja viabilidad</span>
                        <span>Alta viabilidad</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Radar Chart Data */}
              <Card className="shadow-lg border-2 border-blue-200/50 bg-white/90 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
                <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Análisis Multidimensional
                  </CardTitle>
                  <CardDescription>
                    Evaluación detallada por cada dimensión crítica
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Technical Score */}
                    <div className="space-y-2 p-4 rounded-lg border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-transparent hover:bg-blue-50/80 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold">Viabilidad Técnica</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(result.technical_score)}`}>
                          {result.technical_score}/100
                        </span>
                      </div>
                      <Progress value={result.technical_score} className="h-3" />
                    </div>

                    {/* Market Score */}
                    <div className="space-y-2 p-4 rounded-lg border-2 border-green-100 bg-gradient-to-br from-green-50/50 to-transparent hover:bg-green-50/80 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">Demanda de Mercado</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(result.market_score)}`}>
                          {result.market_score}/100
                        </span>
                      </div>
                      <Progress value={result.market_score} className="h-3" />
                    </div>

                    {/* Competition Score */}
                    <div className="space-y-2 p-4 rounded-lg border-2 border-purple-100 bg-gradient-to-br from-purple-50/50 to-transparent hover:bg-purple-50/80 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold">Competencia</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(result.competition_score)}`}>
                          {result.competition_score}/100
                        </span>
                      </div>
                      <Progress value={result.competition_score} className="h-3" />
                    </div>

                    {/* Business Model Score */}
                    <div className="space-y-2 p-4 rounded-lg border-2 border-yellow-100 bg-gradient-to-br from-yellow-50/50 to-transparent hover:bg-yellow-50/80 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-yellow-600" />
                          <span className="font-semibold">Modelo de Negocio</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(result.business_model_score)}`}>
                          {result.business_model_score}/100
                        </span>
                      </div>
                      <Progress value={result.business_model_score} className="h-3" />
                    </div>

                    {/* Context Score */}
                    <div className="space-y-2 p-4 rounded-lg border-2 border-red-100 bg-gradient-to-br from-red-50/50 to-transparent hover:bg-red-50/80 transition-colors md:col-span-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-red-600" />
                          <span className="font-semibold">Contexto Colombia</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(result.context_score)}`}>
                          {result.context_score}/100
                        </span>
                      </div>
                      <Progress value={result.context_score} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths and Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card className="border-2 border-green-200 shadow-lg bg-white/90 backdrop-blur-sm">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                  <CardHeader className="bg-gradient-to-br from-green-50/50 to-emerald-50/30">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Fortalezas Principales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      {(result.strengths?.top_3 || []).map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed">{strength}</span>
                        </li>
                      ))}
                      {(!result.strengths?.top_3 || result.strengths.top_3.length === 0) && (
                        <li className="text-sm text-muted-foreground italic">No se identificaron fortalezas específicas</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                {/* Risks */}
                <Card className="border-2 border-orange-200 shadow-lg bg-white/90 backdrop-blur-sm">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-600"></div>
                  <CardHeader className="bg-gradient-to-br from-orange-50/50 to-red-50/30">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Riesgos a Considerar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      {(result.risks?.top_3 || []).map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed">{risk}</span>
                        </li>
                      ))}
                      {(!result.risks?.top_3 || result.risks.top_3.length === 0) && (
                        <li className="text-sm text-muted-foreground italic">No se identificaron riesgos específicos</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card className="shadow-lg border-2 border-blue-200/50 bg-white/90 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
                <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    Recomendaciones Inmediatas
                  </CardTitle>
                  <CardDescription>
                    Acciones prioritarias para mejorar tu idea
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {(result.recommendations?.immediate || []).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-blue-50/50 border border-blue-200 hover:bg-blue-50 transition-colors">
                        <ArrowRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{rec}</span>
                      </li>
                    ))}
                    {(!result.recommendations?.immediate || result.recommendations.immediate.length === 0) && (
                      <li className="text-sm text-muted-foreground italic">No hay recomendaciones inmediatas disponibles</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Call to Action for Non-Viable Ideas */}
              {result.viability_score < 70 && (
                <Card className="border-2 shadow-2xl bg-gradient-to-br from-orange-50/60 via-red-50/40 to-yellow-50/40 border-orange-300/40 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500"></div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-400/15 to-red-400/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-yellow-400/15 to-orange-400/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                  
                  <CardHeader className="relative z-10 pb-6 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                      {/* Left Side - Lola Image */}
                      <div className="relative flex justify-center md:justify-start order-2 md:order-1 md:pl-12">
                        <div className="relative w-full max-w-xs">
                          {/* Decorative background elements */}
                          <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-orange-400/40 to-red-400/40 rounded-full blur-2xl"></div>
                          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-yellow-400/40 to-orange-400/40 rounded-full blur-2xl"></div>
                          <div className="absolute top-1/2 -left-12 w-32 h-32 bg-gradient-to-br from-red-400/30 to-orange-400/30 rounded-full blur-3xl"></div>
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-300/50 to-red-300/50 rounded-full blur-xl"></div>
                          
                          {/* Lola Image */}
                          <div className="relative z-10 w-full transform hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/25 via-red-400/15 to-yellow-400/10 rounded-3xl blur-2xl"></div>
                            <img
                              src={lolaValidationSadUrl}
                              alt="Lola triste - Tu idea necesita mejoras"
                              className="w-full h-auto drop-shadow-2xl relative z-10"
                              style={{
                                filter: 'drop-shadow(0 30px 60px rgba(249, 115, 22, 0.3))',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Side - Text */}
                      <div className="flex-1 text-center md:text-left order-1 md:order-2 space-y-6">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-xl px-6 py-2.5 text-xl font-bold">
                            {result.viability_score}/100
                          </Badge>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 shadow-lg">
                            <AlertTriangle className="h-7 w-7 text-orange-600" />
                          </div>
                        </div>
                        <CardTitle className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent mb-3 leading-tight">
                          Tu idea necesita mejoras
                        </CardTitle>
                        <CardDescription className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
                          No te desanimes, con trabajo y ajustes puedes mejorar tu idea
                        </CardDescription>
                        <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-orange-200/60 shadow-lg">
                          <p className="text-gray-700 leading-relaxed text-lg font-medium">
                            Con un puntaje de viabilidad de <strong className="text-orange-600 font-bold text-2xl">{result.viability_score}/100</strong>, 
                            tu idea necesita algunos ajustes. Revisa las recomendaciones y fortalece los aspectos débiles para mejorar tu puntaje.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 relative z-10 pb-8">
                    <div className="border-t-2 border-orange-200/60 pt-8">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">
                        Acciones recomendadas:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-blue-50/60 to-cyan-50/60 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all group">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <Lightbulb className="h-5 w-5" />
                          </div>
                          <span className="text-gray-700 font-semibold pt-1.5 text-base leading-relaxed">Revisa las fortalezas y riesgos identificados en el análisis</span>
                        </div>
                        <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-orange-50/60 to-yellow-50/60 border-2 border-orange-200 hover:border-orange-400 hover:shadow-xl transition-all group">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-600 to-yellow-600 text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <Target className="h-5 w-5" />
                          </div>
                          <span className="text-gray-700 font-semibold pt-1.5 text-base leading-relaxed">Implementa las recomendaciones inmediatas sugeridas</span>
                        </div>
                        <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-cyan-50/60 to-blue-50/60 border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl transition-all group">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <RefreshCw className="h-5 w-5" />
                          </div>
                          <span className="text-gray-700 font-semibold pt-1.5 text-base leading-relaxed">Refina tu idea y vuelve a validarla para mejorar el puntaje</span>
                        </div>
                        <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-blue-50/60 via-cyan-50/60 to-orange-50/60 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all group">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 via-cyan-600 to-orange-600 text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <span className="text-gray-700 font-semibold pt-1.5 text-base leading-relaxed">Consulta con Proof Coach para obtener orientación específica</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-6 space-y-4">
                      {/* Botón para guardar validación */}
                      {!saved && (
                        <Button
                          onClick={handleSaveValidation}
                          disabled={saving}
                          size="lg"
                          className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-base font-semibold shadow-xl hover:shadow-green-500/50 transition-all"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-5 w-5" />
                              Guardar Validación
                            </>
                          )}
                        </Button>
                      )}
                      {saved && (
                        <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200 text-green-700 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">Validación guardada exitosamente. Redirigiendo al dashboard...</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => {
                          setResult(null);
                          setError(null);
                          setDescription("");
                          // Scroll hacia arriba para mostrar el formulario
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 w-full h-16 border-2 border-orange-400/60 text-orange-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 hover:border-orange-500 hover:text-orange-800 hover:shadow-xl transition-all duration-300 text-lg font-semibold"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Validar Nuevamente
                      </Button>
                      <Link href="/vitacoach" className="flex-1 block">
                        <Button
                          size="lg"
                          className="w-full h-16 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 relative overflow-hidden group"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            <MessageSquare className="h-5 w-5" />
                            Consultar con Proof Coach
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </Button>
                      </Link>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call to Action for Viable Ideas */}
              {result.viability_score >= 70 && (
                <Card className="border-2 shadow-2xl bg-gradient-to-br from-green-50/60 via-emerald-50/40 to-blue-50/40 border-green-300/40 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-blue-500"></div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-400/15 to-emerald-400/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                  
                  <CardHeader className="relative z-10 pb-6 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                      {/* Left Side - Lola Image */}
                      <div className="relative flex justify-center md:justify-start order-2 md:order-1 md:pl-12">
                        <div className="relative w-full max-w-xs">
                          {/* Decorative background elements */}
                          <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-green-400/40 to-emerald-400/40 rounded-full blur-2xl"></div>
                          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-400/40 to-cyan-400/40 rounded-full blur-2xl"></div>
                          <div className="absolute top-1/2 -left-12 w-32 h-32 bg-gradient-to-br from-orange-400/30 to-yellow-400/30 rounded-full blur-3xl"></div>
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-300/50 to-emerald-300/50 rounded-full blur-xl"></div>
                          
                          {/* Lola Image */}
                          <div className="relative z-10 w-full transform hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-400/25 via-emerald-400/15 to-orange-400/10 rounded-3xl blur-2xl"></div>
                            <img
                              src={lolaValidationUrl}
                              alt="Lola orgullosa - Tu idea es viable"
                              className="w-full h-auto drop-shadow-2xl relative z-10"
                              style={{
                                filter: 'drop-shadow(0 30px 60px rgba(34, 197, 94, 0.3))',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Side - Text */}
                      <div className="flex-1 text-center md:text-left order-1 md:order-2 space-y-6">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-xl px-6 py-2.5 text-xl font-bold">
                            {result.viability_score}/100
                          </Badge>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 shadow-lg">
                            <CheckCircle2 className="h-7 w-7 text-green-600" />
                          </div>
                        </div>
                        <CardTitle className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent mb-3 leading-tight">
                          ¡Tu idea es viable!
                        </CardTitle>
                        <CardDescription className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
                          Es momento de transformar tu idea en una startup real
                        </CardDescription>
                        <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-green-200/60 shadow-lg">
                          <p className="text-gray-700 leading-relaxed text-lg font-medium">
                            Con un puntaje de viabilidad de <strong className="text-green-600 font-bold text-2xl">{result.viability_score}/100</strong>, 
                            tu idea tiene un gran potencial. Continúa desarrollándola con nuestra herramienta de construcción de startups.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 relative z-10 pb-8">
                    <div className="border-t-2 border-green-200/60 pt-8">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">
                        Próximos pasos:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-blue-50/60 to-cyan-50/60 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all group">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <span className="text-gray-700 font-semibold pt-1.5 text-base leading-relaxed">Agregar más contexto y detalles sobre tu idea en el Constructor de Startup</span>
                        </div>
                        <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-cyan-50/60 to-blue-50/60 border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl transition-all group">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <span className="text-gray-700 font-semibold pt-1.5 text-base leading-relaxed">Recibir ayuda de IA para mejorar y refinar tu concepto</span>
                        </div>
                        <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-orange-50/60 to-yellow-50/60 border-2 border-orange-200 hover:border-orange-400 hover:shadow-xl transition-all group">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-600 to-yellow-600 text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <span className="text-gray-700 font-semibold pt-1.5 text-base leading-relaxed">Generar lluvias de ideas para expandir tu visión</span>
                        </div>
                        <div className="flex items-start gap-3 p-5 rounded-xl bg-gradient-to-br from-blue-50/60 via-cyan-50/60 to-orange-50/60 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all group">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 via-cyan-600 to-orange-600 text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <span className="text-gray-700 font-semibold pt-1.5 text-base leading-relaxed">Guardar todo el contexto para que los agentes de Proof Coach trabajen con información completa</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-6 space-y-4">
                      {/* Botón para guardar validación */}
                      {!saved && (
                        <Button
                          onClick={handleSaveValidation}
                          disabled={saving}
                          size="lg"
                          className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-base font-semibold shadow-xl hover:shadow-green-500/50 transition-all"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-5 w-5" />
                              Guardar Validación
                            </>
                          )}
                        </Button>
                      )}
                      {saved && (
                        <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200 text-green-700 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">Validación guardada exitosamente. Redirigiendo al dashboard...</span>
                        </div>
                      )}
                      <Button
                        size="lg"
                        onClick={async () => {
                          // Si no está guardada, guardar primero
                          if (!saved && result) {
                            await handleSaveValidation();
                            // Esperar un momento para que se guarde
                            await new Promise(resolve => setTimeout(resolve, 500));
                          }
                          
                          // Redirigir al startup builder
                          router.push(`/dashboard/startup-builder${startupId ? `?id=${startupId}` : ''}`);
                        }}
                        className="w-full h-14 sm:h-16 md:h-20 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-base sm:text-lg md:text-xl font-bold shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 relative overflow-hidden group transform hover:scale-[1.02]"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4">
                          <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all group-hover:scale-110 flex-shrink-0">
                            <Rocket className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                          </div>
                          <span className="whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-xl">
                            Construir mi Startup Ahora
                          </span>
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:translate-x-2 transition-transform flex-shrink-0" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 90-Day Roadmap - Solo para ideas viables */}
              {result.viability_score >= 70 && (
                <Card className="shadow-lg border-2 border-blue-200/50 bg-white/90 backdrop-blur-sm">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
                  <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Roadmap 90 Días
                    </CardTitle>
                    <CardDescription>
                      Plan de acción estructurado para los próximos 3 meses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Week 1-4 */}
                    <div className="relative pl-8 border-l-4 border-blue-500">
                      <div className="absolute -left-3 top-0">
                        <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          1
                        </div>
                      </div>
                      <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <span className="text-blue-600">Semanas 1-4</span>
                        <Badge variant="outline" className="text-xs">Mes 1</Badge>
                      </h4>
                      <div className="pl-2">
                        <RoadmapContent text={
                          result.recommendations?.["90_day_roadmap"]?.week_1_4 
                            ? (typeof result.recommendations["90_day_roadmap"].week_1_4 === 'string' 
                                ? result.recommendations["90_day_roadmap"].week_1_4 
                                : JSON.stringify(result.recommendations["90_day_roadmap"].week_1_4 || ''))
                            : 'No especificado'
                        } />
                      </div>
                    </div>

                    {/* Week 5-8 */}
                    <div className="relative pl-8 border-l-4 border-cyan-500">
                      <div className="absolute -left-3 top-0">
                        <div className="h-6 w-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                          2
                        </div>
                      </div>
                      <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <span className="text-cyan-600">Semanas 5-8</span>
                        <Badge variant="outline" className="text-xs">Mes 2</Badge>
                      </h4>
                      <div className="pl-2">
                        <RoadmapContent text={
                          result.recommendations?.["90_day_roadmap"]?.week_5_8 
                            ? (typeof result.recommendations["90_day_roadmap"].week_5_8 === 'string' 
                                ? result.recommendations["90_day_roadmap"].week_5_8 
                                : JSON.stringify(result.recommendations["90_day_roadmap"].week_5_8 || ''))
                            : 'No especificado'
                        } />
                      </div>
                    </div>

                    {/* Week 9-12 */}
                    <div className="relative pl-8 border-l-4 border-green-500">
                      <div className="absolute -left-3 top-0">
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                          3
                        </div>
                      </div>
                      <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <span className="text-green-600">Semanas 9-12</span>
                        <Badge variant="outline" className="text-xs">Mes 3</Badge>
                      </h4>
                      <div className="pl-2">
                        <RoadmapContent text={
                          result.recommendations?.["90_day_roadmap"]?.week_9_12 
                            ? (typeof result.recommendations["90_day_roadmap"].week_9_12 === 'string' 
                                ? result.recommendations["90_day_roadmap"].week_9_12 
                                : JSON.stringify(result.recommendations["90_day_roadmap"].week_9_12 || ''))
                            : 'No especificado'
                        } />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VitaValidatorPage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando..." fullScreen />}>
      <VitaValidatorPageContent />
    </Suspense>
  );
}
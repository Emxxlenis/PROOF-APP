import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, ArrowRight, CheckCircle2, Zap, Code, TrendingUp, DollarSign, Target, Users } from "lucide-react";

export default function ProofCoachPage() {
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  const agents = [
    {
      name: "Agente de Validación",
      icon: CheckCircle2,
      description: "Te ayuda a validar aspectos específicos de tu idea y analizar viabilidad",
      color: "from-blue-500 to-cyan-600",
      examples: [
        "¿Cómo valido si mi idea tiene mercado?",
        "¿Qué riesgos enfrenta mi startup?",
        "¿Mi modelo de negocio es viable?"
      ]
    },
    {
      name: "Agente Técnico",
      icon: Code,
      description: "Responde preguntas sobre desarrollo, arquitectura y tecnologías",
      color: "from-cyan-500 to-blue-600",
      examples: [
        "¿Qué stack tecnológico debo usar?",
        "¿Cómo escalo mi aplicación?",
        "¿Qué arquitectura es mejor para mi caso?"
      ]
    },
    {
      name: "Agente de Mercado",
      icon: TrendingUp,
      description: "Analiza tendencias, competencia y oportunidades de mercado",
      color: "from-blue-500 to-cyan-600",
      examples: [
        "¿Cómo analizo a mi competencia?",
        "¿Cuál es mi segmento de mercado ideal?",
        "¿Cómo posiciono mi producto?"
      ]
    },
    {
      name: "Agente de Ventas",
      icon: Target,
      description: "Te guía en estrategias de ventas y adquisición de clientes",
      color: "from-cyan-500 to-blue-600",
      examples: [
        "¿Cómo consigo mis primeros clientes?",
        "¿Qué estrategia de pricing debo usar?",
        "¿Cómo construyo un funnel de ventas?"
      ]
    },
    {
      name: "Agente Financiero",
      icon: DollarSign,
      description: "Ayuda con modelos financieros, proyecciones y métricas",
      color: "from-blue-500 to-cyan-600",
      examples: [
        "¿Cómo calculo mi CAC y LTV?",
        "¿Qué métricas debo trackear?",
        "¿Cómo hago proyecciones financieras?"
      ]
    },
    {
      name: "Agente de Progreso",
      icon: Users,
      description: "Te mantiene enfocado, celebra tus logros y te ayuda a mantener el momentum",
      color: "from-cyan-500 to-blue-600",
      examples: [
        "¿Cómo mantengo el enfoque?",
        "¿Qué debería hacer esta semana?",
        "¿Estoy avanzando correctamente?"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 border-b border-blue-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center relative h-12 md:h-14 w-auto">
              <img
                src={proofLogoUrl}
                alt="Proof Logo"
                className="h-12 md:h-14 w-auto object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Proof
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Where Execution Speaks</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/documentacion">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white">
                Comenzar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Proof Coach
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Tu co-founder virtual disponible 24/7 con agentes especializados
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ¿Qué es Proof Coach?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  <strong>Proof Coach</strong> es un sistema multi-agente de inteligencia artificial que actúa como tu co-founder virtual. Tienes acceso a <strong>6 agentes especializados</strong> que te guían en cada aspecto de tu startup, disponibles 24/7.
                </p>
                <p>
                  Cada agente tiene conocimiento profundo en su área específica y acceso a todo el contexto de tu startup. No necesitas esperar a que un mentor tenga tiempo o pagar por consultoría costosa.
                </p>
                <div className="bg-blue-50/50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-6">
                  <p className="font-semibold text-blue-900 mb-2">Ventajas sobre mentoring tradicional:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                    <li><strong>Disponibilidad 24/7:</strong> Pregunta cuando quieras, sin esperar</li>
                    <li><strong>Memoria perfecta:</strong> Recuerda todo tu historial y contexto</li>
                    <li><strong>Múltiples especialidades:</strong> Acceso a expertos en diferentes áreas simultáneamente</li>
                    <li><strong>Disponible en MVP:</strong> Acceso a coaching especializado mientras estamos en fase de demo</li>
                    <li><strong>Sin miedo a preguntas &quot;tontas&quot;:</strong> Pregunta cualquier cosa sin sentirte juzgado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Agentes Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {agents.map((agent, idx) => {
                    const Icon = agent.icon;
                    return (
                      <div key={idx} className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${agent.color} text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="font-bold text-lg text-gray-900">{agent.name}</h3>
                        </div>
                        <p className="text-gray-700 text-sm mb-3">{agent.description}</p>
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Ejemplos de preguntas:</p>
                          <ul className="space-y-1">
                            {agent.examples.map((example, exIdx) => (
                              <li key={exIdx} className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Cómo hacer Preguntas Efectivas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Sé específico
                    </h3>
                    <p className="text-gray-700 text-sm">
                      ❌ &quot;¿Cómo vendo más?&quot;<br/>
                      ✅ &quot;Tengo una app de delivery local con 50 usuarios. ¿Qué estrategias específicas puedo usar para llegar a 200 usuarios en los próximos 2 meses?&quot;
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      Proporciona contexto
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Menciona detalles relevantes: tu industria, tamaño del mercado, etapa actual, recursos disponibles, etc. Mientras más contexto, mejor será la respuesta.
                    </p>
                  </div>

                  <div className="p-4 bg-cyan-50 border-2 border-cyan-200 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                      Haz preguntas accionables
                    </h3>
                    <p className="text-gray-700 text-sm">
                      En lugar de preguntas teóricas, pregunta por acciones concretas que puedas tomar ahora mismo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Gestión de Conversaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Cada conversación con un agente se guarda automáticamente. Puedes:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Ver historial:</strong> Todas tus conversaciones están guardadas y puedes volver a ellas cuando quieras</li>
                  <li><strong>Continuar conversaciones:</strong> Los agentes recuerdan el contexto de conversaciones anteriores</li>
                  <li><strong>Cambiar de agente:</strong> Puedes preguntar a diferentes agentes sobre el mismo tema para obtener diferentes perspectivas</li>
                  <li><strong>Exportar respuestas:</strong> Guarda respuestas importantes para referencia futura</li>
                </ul>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="border-2 border-blue-100/50 shadow-2xl bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-sky-50/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <CardContent className="pt-12 pb-12 px-8 md:px-16 relative z-10">
                <div className="text-center space-y-6 max-w-2xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                    ¿Listo para empezar?
                  </h2>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                    Accede a Proof Coach y comienza a recibir coaching personalizado 24/7
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                    <Link href="/vitacoach" className="w-full sm:w-auto group">
                      <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                        <span className="relative z-10 flex items-center gap-2">
                          Usar Proof Coach
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </Button>
                    </Link>
                    <Link href="/documentacion" className="w-full sm:w-auto group">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto relative text-lg font-semibold px-12 py-8 h-auto rounded-2xl border-2 border-blue-400/60 text-blue-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-500 hover:text-blue-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                        <span className="flex items-center gap-2">
                          Ver Más Documentación
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  ArrowRight,
  CheckCircle2,
  Rocket,
  MessageSquare,
  Target,
  TrendingUp,
  Code,
  Zap,
  Users,
  Clock
} from "lucide-react";

export default function GuiasPage() {
  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  const guides = [
    {
      title: "Guía de Inicio Rápido",
      description: "Aprende a usar Proof en 5 minutos y comienza tu viaje emprendedor",
      steps: [
        "Crea tu cuenta o inicia sesión",
        "Valida tu primera idea con Proof AI",
        "Explora el Constructor de Startup",
        "Chatea con los agentes de Proof Coach",
        "Define tus primeros OKRs",
      ],
      icon: Rocket,
      color: "from-blue-500/20 to-cyan-600/20",
      gradient: "from-blue-500 to-cyan-600",
      time: "5 min",
      difficulty: "Fácil",
    },
    {
      title: "Guía Completa de Proof AI",
      description: "Domina la validación de ideas con inteligencia artificial",
      steps: [
        "Prepara una descripción detallada de tu idea",
        "Usa Proof AI para obtener análisis completo en 5 dimensiones",
        "Interpreta los puntajes y recomendaciones",
        "Mejora tu idea basado en el feedback",
        "Valida nuevamente para ver mejoras",
      ],
      icon: Zap,
      color: "from-cyan-500/20 to-blue-600/20",
      gradient: "from-cyan-500 to-blue-600",
      time: "15 min",
      difficulty: "Intermedio",
    },
    {
      title: "Guía de Proof Coach Multi-Agente",
      description: "Aprovecha al máximo los agentes especializados disponibles 24/7",
      steps: [
        "Conoce cada agente y su especialidad",
        "Aprende a hacer preguntas efectivas",
        "Usa el contexto de tu startup para mejores respuestas",
        "Gestiona tus conversaciones y historial",
        "Combina múltiples agentes para análisis completo",
      ],
      icon: MessageSquare,
      color: "from-blue-500/20 to-cyan-600/20",
      gradient: "from-blue-500 to-cyan-600",
      time: "20 min",
      difficulty: "Intermedio",
    },
    {
      title: "Guía del Constructor de Startup",
      description: "Desarrolla tu startup con herramientas de IA",
      steps: [
        "Completa la información básica de tu startup",
        "Agrega contexto detallado (problema, solución, mercado, etc.)",
        "Usa 'Mejorar Idea con IA' para obtener sugerencias",
        "Genera lluvias de ideas para expandir tu visión",
        "Crea hipótesis y trackea su evolución",
      ],
      icon: Code,
      color: "from-cyan-500/20 to-blue-600/20",
      gradient: "from-cyan-500 to-blue-600",
      time: "25 min",
      difficulty: "Intermedio",
    },
    {
      title: "Guía de OKRs para Jóvenes Emprendedores",
      description: "Implementa OKRs efectivos desde el día uno",
      steps: [
        "Entiende qué son los OKRs y por qué son importantes",
        "Define objetivos claros e inspiradores",
        "Establece 3-5 Key Results medibles",
        "Revisa y ajusta semanalmente",
        "Celebra los logros y aprende de los fracasos",
      ],
      icon: Target,
      color: "from-blue-500/20 to-cyan-600/20",
      gradient: "from-blue-500 to-cyan-600",
      time: "30 min",
      difficulty: "Avanzado",
    },
    {
      title: "Guía de la Comunidad",
      description: "Conecta, comparte y aprende con otros emprendedores",
      steps: [
        "Crea y completa tu perfil público",
        "Explora el feed y conecta con otros emprendedores",
        "Comparte tus logros y progreso",
        "Participa en retos semanales",
        "Encuentra cofundadores y colaboradores",
      ],
      icon: Users,
      color: "from-cyan-500/20 to-blue-600/20",
      gradient: "from-cyan-500 to-blue-600",
      time: "15 min",
      difficulty: "Fácil",
    },
    {
      title: "Guía del Dashboard de Progreso",
      description: "Visualiza y mide tu crecimiento con gamificación",
      steps: [
        "Revisa tus estadísticas generales",
        "Entiende el sistema de logros y badges",
        "Explora tu timeline de actividades",
        "Identifica áreas de mejora",
        "Establece metas basadas en tu progreso",
      ],
      icon: TrendingUp,
      color: "from-blue-500/20 to-cyan-600/20",
      gradient: "from-blue-500 to-cyan-600",
      time: "15 min",
      difficulty: "Fácil",
    },
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
            <Link href="/">
              <Button variant="ghost" size="sm">
                Inicio
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Guías Paso a Paso
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Tutoriales detallados para dominar cada funcionalidad de Proof y transformar tu idea en realidad
            </p>
          </div>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {guides.map((guide, idx) => {
              const Icon = guide.icon;
              return (
                <Card key={idx} className="group border-2 border-blue-100/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/50 bg-white/90 backdrop-blur-sm overflow-hidden h-full flex flex-col">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${guide.gradient}`}></div>
                  <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg pb-4 pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${guide.gradient} w-fit shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                            {guide.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50/50">
                              <Clock className="h-3 w-3 mr-1" />
                              {guide.time}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700 border-cyan-200">
                              {guide.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-base leading-relaxed text-gray-700">
                      {guide.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6 flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      {guide.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50/50 transition-colors group/step">
                          <div className={`p-1.5 rounded-full bg-gradient-to-br ${guide.gradient} flex-shrink-0 mt-0.5 group-hover/step:scale-110 transition-transform`}>
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed flex-1">
                            <strong className="text-blue-600">{stepIdx + 1}.</strong> {step}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-blue-200">
                      <Link href="/auth" className="block">
                        <Button 
                          className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold border-0 shadow-lg hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-[1.02]"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            Comenzar ahora
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA */}
          <Card className="border-2 border-blue-100/50 shadow-2xl mt-16 bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-sky-50/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-400/20 to-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            <CardContent className="pt-12 pb-12 px-8 md:px-16 relative z-10">
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                  ¿Listo para comenzar?
                </h2>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  Sigue estas guías paso a paso y transforma tu idea en una startup exitosa
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                  <Link href="/auth" className="w-full sm:w-auto group">
                    <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                      <span className="relative z-10 flex items-center gap-2">
                        <Rocket className="h-5 w-5" />
                        Comenzar Ahora
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Button>
                  </Link>
                  <Link href="/documentacion" className="w-full sm:w-auto group">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto relative text-lg font-semibold px-12 py-8 h-auto rounded-2xl border-2 border-blue-400/60 text-blue-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-500 hover:text-blue-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                      <span className="flex items-center gap-2">
                        Ver Documentación
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

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={proofLogoUrl}
                  alt="Proof Logo"
                  className="h-10 md:h-12 w-auto object-contain"
                />
                <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Proof
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Where Execution Speaks - Transforma tu proyecto en una startup funcional con IA.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#features" className="hover:text-primary transition-colors">Características</Link></li>
                <li><Link href="/auth" className="hover:text-primary transition-colors">Iniciar Sesión</Link></li>
                <li><Link href="/auth" className="hover:text-primary transition-colors">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="/documentacion" className="hover:text-primary transition-colors">Documentación</Link></li>
                <li><Link href="/guias" className="hover:text-primary transition-colors">Guías</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/ayuda" className="hover:text-primary transition-colors">Ayuda</Link></li>
                <li><Link href="/contacto" className="hover:text-primary transition-colors">Contacto</Link></li>
                <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Proof - Where Execution Speaks. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import { useState } from "react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  const faqs = [
    {
      category: "General",
      questions: [
        {
          q: "¿Qué es Proof?",
          a: "Proof es una plataforma AI-Native diseñada para ayudar a estudiantes, jóvenes y cualquier persona a transformar sus ideas en startups funcionales. Ofrece herramientas de validación con IA, coaching multi-agente, gestión de OKRs, seguimiento de progreso y una comunidad activa.",
        },
        {
          q: "¿Cuál es el estado actual de Proof?",
          a: "Proof está actualmente en fase de demo y MVP. Estamos trabajando activamente en mejorar y expandir las funcionalidades. Todas las características principales están disponibles para que puedas transformar tu idea en realidad.",
        },
        {
          q: "¿Necesito conocimientos técnicos?",
          a: "No necesariamente. Proof está diseñado para ser intuitivo y accesible. No necesitas un MBA, experiencia previa o conocimientos técnicos avanzados. Solo necesitas una idea y ganas de aprender.",
        },
        {
          q: "¿Para quién es Proof?",
          a: "Proof está diseñado para estudiantes, jóvenes emprendedores y cualquier persona que quiera transformar su idea en realidad. No importa tu edad, experiencia o recursos.",
        },
      ],
    },
    {
      category: "Proof AI",
      questions: [
        {
          q: "¿Cómo funciona Proof AI?",
          a: "Proof AI analiza tu idea de startup en 5 dimensiones críticas: viabilidad técnica, demanda de mercado, competencia, modelo de negocio y contexto local. Proporciona puntajes detallados (0-100) y recomendaciones específicas para cada dimensión.",
        },
        {
          q: "¿Qué puntaje necesito para proceder?",
          a: "Un puntaje de 70+ indica buen potencial. Con 50-69, tu idea necesita refinamiento. Menos de 50 requiere cambios significativos o considerar pivotar. Los puntajes son una guía, no una sentencia definitiva.",
        },
        {
          q: "¿Puedo validar múltiples ideas?",
          a: "Sí, puedes validar tantas ideas como quieras. Cada validación se guarda en tu historial para que puedas comparar y mejorar.",
        },
        {
          q: "¿Los resultados son confiables?",
          a: "Proof AI usa modelos de IA avanzados y análisis multidimensional. Sin embargo, siempre combina los resultados con tu conocimiento del mercado y feedback de usuarios reales.",
        },
      ],
    },
    {
      category: "Proof Coach",
      questions: [
        {
          q: "¿Cuántos agentes hay disponibles?",
          a: "Hay 6 agentes especializados: Agente de Validación, Agente Técnico, Agente de Mercado, Agente de Ventas, Agente Financiero y Agente de Progreso. Cada uno tiene expertise en su área específica y está disponible 24/7.",
        },
        {
          q: "¿Los agentes recuerdan nuestras conversaciones?",
          a: "Sí, los agentes tienen memoria de tus conversaciones previas y acceso al contexto completo de tu startup para darte respuestas más relevantes y personalizadas.",
        },
        {
          q: "¿Puedo eliminar una conversación?",
          a: "Sí, haz clic en el botón 'Eliminar' en el header del chat. Esto eliminará toda la conversación y el agente perderá el contexto de esa conversación específica.",
        },
        {
          q: "¿Cómo hago preguntas efectivas?",
          a: "Sé específico, proporciona contexto relevante (tu industria, etapa actual, recursos disponibles), y haz preguntas accionables. Mientras más detallado seas, mejor será la respuesta.",
        },
      ],
    },
    {
      category: "Constructor de Startup",
      questions: [
        {
          q: "¿Se guarda automáticamente mi información?",
          a: "Sí, el Constructor tiene auto-guardado. Tus cambios se guardan automáticamente cada 2 segundos después de dejar de escribir. También puedes usar el botón 'Guardar Ahora' para guardar inmediatamente.",
        },
        {
          q: "¿Cómo uso las herramientas de IA?",
          a: "Completa la información básica de tu startup, luego usa 'Mejorar Idea con IA' para obtener sugerencias detalladas o 'Lluvia de Ideas' para generar nuevas ideas creativas. También puedes usar el Generador de Hipótesis integrado.",
        },
        {
          q: "¿Dónde se guarda la información?",
          a: "Toda la información se guarda en la base de datos de Supabase, no en cookies. Esto asegura que no se pierda y que los agentes de Proof Coach tengan acceso completo al contexto.",
        },
        {
          q: "¿Qué es el Generador de Hipótesis?",
          a: "Es una herramienta integrada que crea hipótesis en formato 'Si/Entonces/Porque' basadas en tu contexto. El sistema mantiene un historial completo de todas tus hipótesis y sus versiones.",
        },
      ],
    },
    {
      category: "OKRs y Progreso",
      questions: [
        {
          q: "¿Con qué frecuencia debo crear OKRs?",
          a: "Recomendamos crear OKRs semanales o mensuales para mantener el enfoque. Esto es perfecto para el ritmo estudiantil y te permite ajustar rápidamente.",
        },
        {
          q: "¿Cómo se desbloquean los logros?",
          a: "Los logros se desbloquean automáticamente cuando completas ciertas acciones, como tu primera validación, lanzar un MVP, conseguir tu primer usuario, o realizar tu primera venta.",
        },
        {
          q: "¿Qué son los puntos?",
          a: "Los puntos son un sistema de gamificación. Cada logro desbloqueado te da puntos. Acumula puntos para ver tu progreso general en el dashboard.",
        },
        {
          q: "¿Cómo interpreto mi progreso?",
          a: "Ve a 'Progreso' en el dashboard para ver estadísticas generales, logros desbloqueados, timeline de actividades y métricas de crecimiento. Todo está diseñado para mantenerte motivado.",
        },
      ],
    },
    {
      category: "Comunidad",
      questions: [
        {
          q: "¿Cómo me uno a la comunidad?",
          a: "Crea y completa tu perfil público, luego explora el feed. Comparte tus logros, participa en retos, conecta con otros emprendedores y encuentra cofundadores.",
        },
        {
          q: "¿Qué son los retos?",
          a: "Los retos son competencias semanales o mensuales que te ayudan a mantener el momentum. Incluyen leaderboards, badges y recompensas. Es una forma gamificada de mantenerte enfocado.",
        },
        {
          q: "¿Puedo compartir mi startup públicamente?",
          a: "Sí, puedes elegir qué información compartir en tu perfil público. Puedes hacer tus proyectos privados, solo para tu equipo, o públicos en la comunidad.",
        },
      ],
    },
    {
      category: "Técnico",
      questions: [
        {
          q: "¿Qué modelo de IA usa la plataforma?",
          a: "Proof usa Ollama con modelos locales por defecto (llama3.1:8b). Esto te da control total y privacidad. También puedes configurar APIs de OpenAI si lo prefieres.",
        },
        {
          q: "¿Mis datos están seguros?",
          a: "Sí, todos los datos se almacenan de forma segura en Supabase con encriptación. Nunca compartimos tu información con terceros.",
        },
        {
          q: "¿Puedo usar la plataforma sin conexión?",
          a: "No, Proof requiere conexión a internet para funcionar, ya que necesita acceder a la base de datos y a los modelos de IA.",
        },
        {
          q: "¿Cómo reporto un problema técnico?",
          a: "Usa el formulario de contacto en la página de contacto o envía un email a soporte@proof.com. Respondemos en menos de 24 horas.",
        },
      ],
    },
  ];

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Filtrar FAQs basado en la búsqueda
  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Preguntas Frecuentes
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Respuestas a las preguntas más comunes sobre Proof
            </p>
          </div>

          {/* Search Bar */}
          <Card className="border-2 border-blue-100/50 shadow-xl mb-12 bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-gray-500" />
                <Input 
                  placeholder="Buscar preguntas..." 
                  className="flex-1 border-0 focus-visible:ring-0 text-lg bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* FAQ Sections */}
          <div className="space-y-6">
            {filteredFaqs.map((category, catIdx) => (
              <Card key={catIdx} className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${catIdx % 2 === 0 ? 'from-blue-500 to-cyan-600' : 'from-cyan-500 to-blue-600'}`}></div>
                <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg">
                  <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">{category.category}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {category.questions.map((faq, faqIdx) => {
                      const index = catIdx * 100 + faqIdx;
                      const isOpen = openIndex === index;
                      return (
                        <div key={faqIdx} className="border-2 border-blue-100 rounded-lg overflow-hidden hover:border-blue-300 transition-colors bg-white/50">
                          <button
                            onClick={() => toggleQuestion(index)}
                            className="w-full p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors text-left group"
                          >
                            <span className="font-semibold text-gray-900 pr-4 group-hover:text-blue-600 transition-colors">{faq.q}</span>
                            {isOpen ? (
                              <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="p-4 pt-0 border-t-2 border-blue-100 bg-blue-50/30">
                              <p className="text-sm text-gray-700 leading-relaxed">{faq.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Still Have Questions */}
          <Card className="border-2 border-blue-100/50 shadow-2xl mt-16 bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-sky-50/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-400/20 to-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            <CardContent className="pt-12 pb-12 px-8 md:px-16 relative z-10">
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                  ¿Aún tienes preguntas?
                </h2>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  Si no encontraste la respuesta que buscabas, contáctanos directamente
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                  <Link href="/contacto" className="w-full sm:w-auto group">
                    <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                      <span className="relative z-10 flex items-center gap-2">
                        Contactar Soporte
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Button>
                  </Link>
                  <Link href="/ayuda" className="w-full sm:w-auto group">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto relative text-lg font-semibold px-12 py-8 h-auto rounded-2xl border-2 border-blue-400/60 text-blue-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-500 hover:text-blue-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                      <span className="flex items-center gap-2">
                        Centro de Ayuda
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

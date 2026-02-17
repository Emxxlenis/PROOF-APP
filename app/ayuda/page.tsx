"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  HelpCircle, 
  Search,
  Mail,
  MessageCircle,
  BookOpen,
  FileText,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function AyudaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el mensaje");
      }

      setFormSubmitted(true);
      setFormData({ firstName: "", lastName: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      setFormError(error.message || "Error al enviar el mensaje. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  const faqCategories = [
    {
      title: "Cuenta y Perfil",
      questions: [
        {
          q: "¿Cómo creo una cuenta?",
          a: "Haz clic en 'Comenzar' o 'Iniciar Sesión' en la página principal. Puedes registrarte con tu email y contraseña, o usar Google OAuth para un acceso rápido.",
        },
        {
          q: "¿Puedo cambiar mi información de perfil?",
          a: "Sí, ve a 'Perfil' en el dashboard y haz clic en 'Editar Perfil'. Puedes actualizar tu nombre, biografía, información académica y enlaces sociales.",
        },
        {
          q: "¿Cómo elimino mi cuenta?",
          a: "Por el momento, contacta con nuestro equipo de soporte para eliminar tu cuenta. Estamos trabajando en una opción de auto-eliminación.",
        },
      ],
    },
    {
      title: "Proof AI",
      questions: [
        {
          q: "¿Cómo interpreto los puntajes de validación?",
          a: "Los puntajes van de 0-100. 70+ indica buen potencial, 50-69 necesita refinamiento, y menos de 50 requiere cambios significativos. Revisa las recomendaciones específicas para cada dimensión.",
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
      title: "Proof Coach",
      questions: [
        {
          q: "¿Cómo funcionan los agentes?",
          a: "Cada agente es un especialista en un área (validación, técnico, mercado, ventas, finanzas, progreso). Selecciona el agente apropiado para tu pregunta y recibe respuestas contextualizadas.",
        },
        {
          q: "¿Los agentes recuerdan nuestras conversaciones?",
          a: "Sí, los agentes tienen memoria de tus conversaciones previas. También tienen acceso al contexto completo de tu startup para darte respuestas más relevantes.",
        },
        {
          q: "¿Puedo eliminar una conversación?",
          a: "Sí, haz clic en el botón 'Eliminar' en el header del chat. Esto eliminará toda la conversación y el agente perderá el contexto de esa conversación.",
        },
      ],
    },
    {
      title: "Constructor de Startup",
      questions: [
        {
          q: "¿Se guarda automáticamente mi información?",
          a: "Sí, el Constructor tiene auto-guardado. Tus cambios se guardan automáticamente cada 2 segundos después de dejar de escribir. También puedes usar el botón 'Guardar Ahora' para guardar inmediatamente.",
        },
        {
          q: "¿Cómo uso las herramientas de IA?",
          a: "Completa la información básica de tu startup, luego usa 'Mejorar Idea con IA' para sugerencias o 'Lluvia de Ideas' para generar nuevas ideas. Los resultados se guardan automáticamente.",
        },
        {
          q: "¿Dónde se guarda la información?",
          a: "Toda la información se guarda en la base de datos, no en cookies. Esto asegura que no se pierda y que los agentes de Proof Coach tengan acceso completo al contexto.",
        },
      ],
    },
    {
      title: "OKRs y Progreso",
      questions: [
        {
          q: "¿Con qué frecuencia debo crear OKRs?",
          a: "Recomendamos crear OKRs semanales para mantener el enfoque. Esto es perfecto para el ritmo estudiantil y te permite ajustar rápidamente.",
        },
        {
          q: "¿Cómo se desbloquean los logros?",
          a: "Los logros se desbloquean automáticamente cuando completas ciertas acciones, como tu primera validación, lanzar un MVP, o conseguir tu primer usuario.",
        },
        {
          q: "¿Puedo ver mi historial completo?",
          a: "Sí, ve a 'Progreso' en el dashboard para ver tu timeline completo de actividades, logros desbloqueados y estadísticas generales.",
        },
      ],
    },
    {
      title: "Técnico y Soporte",
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
          q: "¿Cómo reporto un problema?",
          a: "Usa el formulario de contacto en esta página o envía un email a soporte@proof.com. Respondemos en menos de 24 horas.",
        },
      ],
    },
  ];

  const filteredCategories = faqCategories.map(category => ({
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              ¿Cómo podemos ayudarte?
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Encuentra respuestas rápidas o contacta con nuestro equipo
            </p>
          </div>

          {/* Search Bar */}
          <Card className="border-2 border-blue-100/50 shadow-xl mb-12 bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-gray-500" />
                <Input 
                  placeholder="Buscar en preguntas frecuentes..." 
                  className="flex-1 border-0 focus-visible:ring-0 text-lg bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link href="/documentacion">
              <Card className="group border-2 border-blue-100/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/50 bg-white/90 backdrop-blur-sm cursor-pointer">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 w-fit mx-auto mb-4 group-hover:shadow-xl transition-shadow">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">Documentación</h3>
                  <p className="text-sm text-gray-600">Guías completas</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/guias">
              <Card className="group border-2 border-blue-100/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/50 bg-white/90 backdrop-blur-sm cursor-pointer">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 w-fit mx-auto mb-4 group-hover:shadow-xl transition-shadow">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">Guías</h3>
                  <p className="text-sm text-gray-600">Tutoriales paso a paso</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/contacto">
              <Card className="group border-2 border-blue-100/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/50 bg-white/90 backdrop-blur-sm cursor-pointer">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 w-fit mx-auto mb-4 group-hover:shadow-xl transition-shadow">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">Contacto</h3>
                  <p className="text-sm text-gray-600">Habla con nosotros</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-6">
            {filteredCategories.map((category, catIdx) => {
              const isCategoryOpen = openCategory === catIdx;
              return (
                <Card key={catIdx} className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
                  <CardHeader 
                    className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg cursor-pointer"
                    onClick={() => setOpenCategory(isCategoryOpen ? null : catIdx)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold text-gray-900">{category.title}</CardTitle>
                      {isCategoryOpen ? (
                        <ChevronUp className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </CardHeader>
                  {isCategoryOpen && (
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {category.questions.map((faq, faqIdx) => {
                          const questionId = `${catIdx}-${faqIdx}`;
                          const isQuestionOpen = openQuestion === questionId;
                          return (
                            <div 
                              key={faqIdx} 
                              className="p-4 rounded-lg border-2 border-blue-100 hover:border-blue-300 transition-colors bg-white/50"
                            >
                              <h4 
                                className="font-semibold text-gray-900 mb-2 flex items-center gap-2 cursor-pointer"
                                onClick={() => setOpenQuestion(isQuestionOpen ? null : questionId)}
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                {faq.q}
                                {isQuestionOpen ? (
                                  <ChevronUp className="h-4 w-4 text-blue-600 ml-auto" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-blue-600 ml-auto" />
                                )}
                              </h4>
                              {isQuestionOpen && (
                                <p className="text-sm text-gray-700 leading-relaxed ml-4 mt-2">
                                  {faq.a}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Contact Form */}
          <Card className="border-2 border-blue-100/50 shadow-2xl mt-16 bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-sky-50/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-400/20 to-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-3xl md:text-4xl mb-2 flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                <Mail className="h-8 w-8 text-blue-600" />
                ¿No encuentras lo que buscas?
              </CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Envíanos un mensaje y te responderemos pronto
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 w-fit mx-auto mb-6 shadow-lg">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">¡Mensaje enviado!</h3>
                  <p className="text-gray-600 mb-6">
                    Gracias por contactarnos. Te hemos enviado un email de confirmación y te responderemos pronto.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setFormSubmitted(false)}
                    className="border-blue-400 text-blue-600 hover:bg-blue-50"
                  >
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {formError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700">Nombre</Label>
                      <Input 
                        id="firstName" 
                        placeholder="Tu nombre" 
                        className="border-blue-200 focus:border-blue-400" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-700">Apellido</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Tu apellido" 
                        className="border-blue-200 focus:border-blue-400" 
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tu@email.com" 
                      className="border-blue-200 focus:border-blue-400" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gray-700">Asunto</Label>
                    <Input 
                      id="subject" 
                      placeholder="¿En qué podemos ayudarte?" 
                      className="border-blue-200 focus:border-blue-400" 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-700">Mensaje</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Describe tu pregunta o problema..." 
                      className="min-h-[100px] sm:min-h-[120px] border-blue-200 focus:border-blue-400"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold text-lg py-6 shadow-xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5" />
                          Enviar Mensaje
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </Button>
                </form>
              )}
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

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Rocket, ArrowRight, CheckCircle2 } from "lucide-react";

export default function IntroduccionPage() {
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

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
                <Rocket className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Introducción a Proof
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Todo lo que necesitas saber para comenzar tu viaje emprendedor
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ¿Qué es Proof?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  <strong>Proof</strong> es una plataforma AI-Native diseñada específicamente para <strong>estudiantes, jóvenes y cualquier persona</strong> que quiere transformar su idea en una startup funcional. No necesitas experiencia previa, un MBA, o millones de dólares. Solo necesitas una idea y ganas de aprender.
                </p>
                <p>
                  Proof está construida con una arquitectura <strong>&quot;AI-First&quot;</strong>, lo que significa que la inteligencia artificial no es un complemento, sino el corazón del producto. Cada herramienta está diseñada para guiarte, ayudarte y acelerar tu proceso emprendedor.
                </p>
                <div className="bg-blue-50/50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-6">
                  <p className="font-semibold text-blue-900 mb-2">Nuestra misión:</p>
                  <p className="text-blue-800">
                    Democratizar el emprendimiento. Hacer que cualquier joven con una idea pueda acceder a las mismas herramientas y conocimientos que usan las startups más exitosas.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ¿Para quién es Proof?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Estudiantes</h3>
                    <p className="text-gray-700">
                      Si eres estudiante y tienes una idea que quieres sacar del papel, Proof es para ti. Ya sea que tengas un proyecto de grado o simplemente una idea que no te deja dormir.
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Jóvenes Emprendedores</h3>
                    <p className="text-gray-700">
                      Si eres joven y quieres emprender pero no sabes por dónde empezar, Proof te guía paso a paso desde la validación hasta el lanzamiento.
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Cualquier Persona</h3>
                    <p className="text-gray-700">
                      Si tienes una idea y quieres transformarla en realidad, Proof es tu plataforma. No importa tu edad, experiencia o recursos.
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Equipos</h3>
                    <p className="text-gray-700">
                      Si trabajas en equipo, Proof te permite colaborar, compartir proyectos y trabajar juntos hacia el mismo objetivo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Primeros Pasos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Crea tu cuenta</h3>
                      <p className="text-gray-700">
                        Regístrate en Proof. Estamos en fase de demo y MVP, y solo toma unos minutos. Necesitas un email y una contraseña.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Crea tu primer proyecto</h3>
                      <p className="text-gray-700">
                        Una vez dentro, crea tu primer proyecto. Esto es donde guardarás toda la información de tu startup.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Valida tu idea con Proof AI</h3>
                      <p className="text-gray-700">
                        Usa Proof AI para validar tu idea. En minutos obtendrás un análisis completo de viabilidad en 5 dimensiones críticas.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Desarrolla tu idea</h3>
                      <p className="text-gray-700">
                        Usa el Constructor de Startup para darle forma a tu idea. Agrega contexto, mejora con IA, y genera hipótesis.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      5
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Recibe coaching</h3>
                      <p className="text-gray-700">
                        Interactúa con Proof Coach, nuestro sistema de agentes especializados que te guían 24/7 en cada aspecto de tu startup.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Conceptos Básicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      Proyecto
                    </h3>
                    <p className="text-gray-700">
                      Un proyecto en Proof es donde guardas toda la información de tu startup. Puedes tener múltiples proyectos si tienes varias ideas.
                    </p>
                  </div>

                  <div className="p-4 bg-cyan-50/50 rounded-lg border border-cyan-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                      Validación
                    </h3>
                    <p className="text-gray-700">
                      La validación es el proceso de verificar que tu idea tiene potencial real antes de invertir tiempo y recursos. Proof AI te ayuda a hacer esto en minutos.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      MVP (Minimum Viable Product)
                    </h3>
                    <p className="text-gray-700">
                      El MVP es la versión más simple de tu producto que aún resuelve el problema principal. No tiene que ser perfecto, solo funcional.
                    </p>
                  </div>

                  <div className="p-4 bg-cyan-50/50 rounded-lg border border-cyan-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                      OKRs (Objetivos y Resultados Clave)
                    </h3>
                    <p className="text-gray-700">
                      Los OKRs son una metodología para establecer objetivos ambiciosos y medir tu progreso. Te ayudan a mantener el enfoque y medir el éxito.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      Hipótesis
                    </h3>
                    <p className="text-gray-700">
                      Una hipótesis es una suposición que haces sobre tu startup (ej: &quot;Si creo una app de delivery, entonces los estudiantes la usarán porque...&quot;). Las hipótesis se validan con datos reales.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="border-2 border-blue-100/50 shadow-2xl bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-sky-50/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <CardContent className="pt-12 pb-12 px-8 md:px-16 relative z-10">
                <div className="text-center space-y-6 max-w-2xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                    ¿Listo para comenzar?
                  </h2>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                    Ahora que conoces los conceptos básicos, es momento de crear tu cuenta y empezar tu viaje emprendedor
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                    <Link href="/auth" className="w-full sm:w-auto group">
                      <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                        <span className="relative z-10 flex items-center gap-2">
                          Crear Cuenta
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </Button>
                    </Link>
                    <Link href="/documentacion/proof-ai" className="w-full sm:w-auto group">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto relative text-lg font-semibold px-12 py-8 h-auto rounded-2xl border-2 border-blue-400/60 text-blue-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-500 hover:text-blue-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                        <span className="flex items-center gap-2">
                          Siguiente: Proof AI
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

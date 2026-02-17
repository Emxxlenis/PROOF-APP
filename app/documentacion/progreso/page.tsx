import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, ArrowRight, CheckCircle2, Award, Clock, BarChart3, Trophy } from "lucide-react";

export default function ProgresoPage() {
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
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Dashboard de Progreso
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Visualiza tu progreso, logros desbloqueados y el camino hacia el éxito
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ¿Qué es el Dashboard de Progreso?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  El <strong>Dashboard de Progreso</strong> es tu centro de control donde puedes ver todo lo que has logrado en Proof. Es una visualización gamificada de tu viaje emprendedor.
                </p>
                <p>
                  El dashboard te muestra estadísticas en tiempo real, logros desbloqueados, timeline de actividades y métricas de crecimiento. Todo diseñado para mantenerte motivado y enfocado.
                </p>
              </CardContent>
            </Card>

            <Card id="progreso" className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Ver tu Progreso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  En el dashboard puedes ver:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold text-lg text-gray-900">Estadísticas Generales</h3>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Proyectos creados</li>
                      <li>Validaciones completadas</li>
                      <li>OKRs activos</li>
                      <li>Logros desbloqueados</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-cyan-50/50 rounded-lg border border-cyan-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-cyan-600" />
                      <h3 className="font-bold text-lg text-gray-900">Métricas de Crecimiento</h3>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Progreso en OKRs</li>
                      <li>Actividad semanal</li>
                      <li>Tendencias de uso</li>
                      <li>Comparación con períodos anteriores</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="logros" className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Sistema de Logros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  El sistema de logros reconoce y celebra tus hitos importantes:
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="h-6 w-6 text-blue-600" />
                      <h3 className="font-bold text-lg text-gray-900">Tipos de Logros</h3>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li><strong>Primeros Pasos:</strong> &quot;Primera Validación&quot;, &quot;Primer OKR Creado&quot;</li>
                      <li><strong>Desarrollo:</strong> &quot;MVP Completado&quot;, &quot;Primeros 10 Usuarios&quot;</li>
                      <li><strong>Validación:</strong> &quot;Idea Validada&quot;, &quot;Landing Page Lanzada&quot;</li>
                      <li><strong>Comunidad:</strong> &quot;Primer Post&quot;, &quot;10 Seguidores&quot;</li>
                      <li><strong>Consistencia:</strong> &quot;7 Días Activo&quot;, &quot;Check-in Semanal Completo&quot;</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-cyan-50/50 rounded-lg border border-cyan-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-cyan-600" />
                      Badges y Recompensas
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Cada logro desbloqueado te da un badge que se muestra en tu perfil. Algunos logros también vienen con recompensas especiales o acceso a funcionalidades premium.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="timeline" className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Timeline de Actividades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  El timeline muestra un historial cronológico de todas tus actividades importantes en Proof:
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Eventos Registrados</p>
                      <p className="text-xs text-gray-600">Validaciones, OKRs creados, logros desbloqueados, posts compartidos, etc.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-50/50 rounded-lg border border-cyan-200 flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-cyan-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Visualización Temporal</p>
                      <p className="text-xs text-gray-600">Ve cómo ha evolucionado tu startup a lo largo del tiempo</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Hitos Importantes</p>
                      <p className="text-xs text-gray-600">Los momentos clave de tu viaje están destacados en el timeline</p>
                    </div>
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
                    ¿Listo para ver tu progreso?
                  </h2>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                    Accede a tu dashboard y visualiza todo lo que has logrado
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                    <Link href="/dashboard/progress" className="w-full sm:w-auto group">
                      <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                        <span className="relative z-10 flex items-center gap-2">
                          Ver Dashboard
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

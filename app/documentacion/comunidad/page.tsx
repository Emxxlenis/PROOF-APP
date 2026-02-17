import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, ArrowRight } from "lucide-react";

export default function ComunidadPage() {
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
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Comunidad Proof
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Conecta, comparte y aprende con otros emprendedores
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ¿Qué es la Comunidad Proof?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  La <strong>Comunidad Proof</strong> es un espacio donde emprendedores, estudiantes y fundadores se conectan para compartir experiencias, aprender juntos y apoyarse mutuamente en su viaje emprendedor.
                </p>
                <p>
                  En la comunidad puedes publicar tus logros, compartir tus aprendizajes, hacer preguntas, y encontrar inspiración en los proyectos de otros emprendedores.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Características de la Comunidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Feed de Comunidad</h3>
                      <p className="text-gray-700">
                        Publica actualizaciones, logros y preguntas. Interactúa con las publicaciones de otros emprendedores.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Galería de Startups</h3>
                      <p className="text-gray-700">
                        Explora proyectos reales de la comunidad. Inspírate con las ideas y logros de otros emprendedores.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Perfiles de Usuarios</h3>
                      <p className="text-gray-700">
                        Conoce a otros emprendedores, ve sus proyectos y conecta con personas que comparten tus intereses.
                      </p>
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
                    ¿Listo para unirte a la comunidad?
                  </h2>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                    Accede a la comunidad y comienza a conectar con otros emprendedores
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                    <Link href="/community" className="w-full sm:w-auto group">
                      <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                        <span className="relative z-10 flex items-center gap-2">
                          Ir a la Comunidad
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












import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, ArrowRight, User, Shield, Bell, Zap, CheckCircle2 } from "lucide-react";

export default function ConfiguracionPage() {
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
              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 shadow-lg">
                <Settings className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Configuración
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Personaliza tu experiencia en Proof y gestiona tu cuenta
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Perfil de Usuario */}
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Perfil de Usuario
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  Tu perfil es tu identidad en Proof. Aquí puedes gestionar toda la información que otros usuarios pueden ver sobre ti.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      Información Básica
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Nombre completo:</strong> Cómo aparecerás en la plataforma</li>
                      <li><strong>Email:</strong> Tu dirección de correo electrónico (no visible públicamente)</li>
                      <li><strong>Avatar:</strong> Sube una foto de perfil para personalizar tu cuenta</li>
                      <li><strong>Rol:</strong> Estudiante, Mentor o Administrador</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                      Información Pública
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Biografía pública:</strong> Comparte tu historia, experiencia o intereses con la comunidad</li>
                      <li><strong>Habilidades:</strong> Lista tus skills técnicas o de negocio</li>
                      <li><strong>Ubicación:</strong> Opcional, ayuda a conectar con emprendedores locales</li>
                      <li><strong>Enlaces:</strong> Agrega tu sitio web, LinkedIn, GitHub, etc.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de IA */}
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Configuración de IA
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  Personaliza cómo funciona la inteligencia artificial en Proof para obtener respuestas más relevantes y útiles.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-600" />
                      Preferencias de Respuesta
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Nivel de detalle:</strong> Elige si prefieres respuestas concisas o más detalladas</li>
                      <li><strong>Estilo de comunicación:</strong> Formal, casual o técnico</li>
                      <li><strong>Contexto de startup:</strong> Especifica tu industria o tipo de negocio para respuestas más precisas</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-pink-600" />
                      Agentes Preferidos
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Agente por defecto:</strong> Elige qué agente de Proof Coach aparece primero</li>
                      <li><strong>Notificaciones de agentes:</strong> Recibe sugerencias cuando un agente específico puede ayudarte</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacidad */}
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Privacidad
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  Controla qué información es visible para otros usuarios y cómo se utilizan tus datos.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Visibilidad del Perfil
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Perfil público:</strong> Otros usuarios pueden ver tu perfil y proyectos</li>
                      <li><strong>Perfil privado:</strong> Solo tú puedes ver tu información</li>
                      <li><strong>Proyectos públicos:</strong> Controla qué proyectos aparecen en la galería</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Datos y Seguridad
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Exportar datos:</strong> Descarga toda tu información de Proof</li>
                      <li><strong>Eliminar cuenta:</strong> Elimina permanentemente tu cuenta y todos tus datos</li>
                      <li><strong>Autenticación:</strong> Gestiona métodos de inicio de sesión y seguridad</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notificaciones */}
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Notificaciones
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  Decide qué notificaciones recibes y cómo las recibes para mantenerte informado sin distracciones.
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-orange-600" />
                      Tipos de Notificaciones
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Logros desbloqueados:</strong> Cuando desbloqueas un nuevo logro o subes de nivel</li>
                      <li><strong>Interacciones sociales:</strong> Likes, comentarios y menciones en la comunidad</li>
                      <li><strong>Recordatorios de OKRs:</strong> Notificaciones sobre objetivos y fechas límite</li>
                      <li><strong>Actualizaciones de proyectos:</strong> Cambios importantes en tus proyectos</li>
                      <li><strong>Respuestas de agentes:</strong> Cuando un agente de Proof Coach responde</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-red-600" />
                      Canales de Notificación
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Notificaciones en la plataforma:</strong> Alertas dentro de Proof</li>
                      <li><strong>Email:</strong> Resúmenes diarios o semanales por correo</li>
                      <li><strong>Push (próximamente):</strong> Notificaciones en tu dispositivo móvil</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferencias de Cuenta */}
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Preferencias de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      Idioma y Región
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Idioma:</strong> Elige el idioma de la interfaz (Español, Inglés, etc.)</li>
                      <li><strong>Zona horaria:</strong> Para que las fechas y horas se muestren correctamente</li>
                      <li><strong>Formato de fecha:</strong> Preferencia de formato de fecha</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                      Apariencia
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-6">
                      <li><strong>Tema:</strong> Modo claro, oscuro o automático (próximamente)</li>
                      <li><strong>Densidad de información:</strong> Compacto o espacioso</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cómo Acceder a la Configuración */}
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ¿Cómo Acceder a la Configuración?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Desde el Dashboard</h3>
                      <p className="text-gray-700">
                        Haz clic en tu avatar o nombre de usuario en la esquina superior derecha y selecciona &quot;Configuración&quot; del menú desplegable.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Navegación por Secciones</h3>
                      <p className="text-gray-700">
                        La página de configuración está organizada en secciones claras: Perfil, IA, Privacidad, Notificaciones y Preferencias.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">Guardar Cambios</h3>
                      <p className="text-gray-700">
                        Todos los cambios se guardan automáticamente. No necesitas hacer clic en &quot;Guardar&quot; - simplemente actualiza los campos y los cambios se aplicarán inmediatamente.
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
                    ¿Listo para personalizar tu experiencia?
                  </h2>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                    Accede a la configuración desde tu dashboard y personaliza Proof según tus preferencias
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

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Target,
  BarChart3,
} from "lucide-react";

export default function Home() {

  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const lolaImageUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-main_p2mp59`;
  const lolaImage2Url = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-main2_te9f5a`;
  const lolaImage3Url = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-main3_akkrud`;
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 border-b border-blue-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" size="sm">
                Iniciar Sesión
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

      {/* Hero Section con Lola - SIN CAMBIOS */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
          {/* Left Side - Text and CTA */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              <span className="block">Tu startup no va a funcionar.</span>
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Descubre por qué</span>
            </h1>
            <div className="space-y-2 text-lg md:text-xl text-gray-700">
              <p className="font-medium">Obtén un score de viabilidad, descubre qué estás ignorando y valida tu startup con evidencia, no con optimismo</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 pt-4">
              <div className="flex flex-col items-center">
                <Link href="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-8 py-6 h-auto rounded-full shadow-lg hover:shadow-xl transition-all">
                    ¡EMPIEZA AHORA!
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Lola Image */}
          <div className="relative flex justify-center md:justify-end">
            <div className="relative w-full max-w-md overflow-visible md:overflow-visible">
              {/* Geometric shapes in background */}
              <div className="absolute top-0 left-0 md:-top-4 md:-left-4 w-8 h-8 md:w-16 md:h-16 bg-blue-400 rounded-full opacity-30"></div>
              <div className="absolute top-4 right-0 md:top-8 md:-right-8 w-6 h-6 md:w-12 md:h-12 bg-yellow-400 rounded-lg opacity-30"></div>
              <div className="absolute bottom-0 left-2 md:-bottom-4 md:left-8 w-10 h-10 md:w-20 md:h-20 bg-orange-400 rounded-lg opacity-20 rotate-45"></div>
              <div className="absolute top-1/2 right-0 md:-right-12 w-12 h-12 md:w-24 md:h-24 bg-cyan-400 rounded-full opacity-20"></div>
              <div className="absolute bottom-0 right-0 md:-bottom-8 md:-right-4 w-8 h-8 md:w-16 md:h-16 bg-yellow-300 rounded-full opacity-30"></div>
              
              {/* Lola Image */}
              <div className="relative z-10 w-full">
                <img
                  src={lolaImageUrl}
                  alt="Lola - La cabra emprendedora"
                  className="w-full h-auto drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15))',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* One-liner - Valor Claro */}
      <section className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 max-w-4xl mx-auto leading-relaxed">
          Proof ayuda a founders a decidir si su idea merece existir{" "}
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">
            antes de perder meses construyendo.
          </span>
        </p>
      </section>


      {/* How It Works Section - Simplificado */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            ¿Cómo funciona?
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            De idea a decisión en 4 pasos. Sin vueltas.
          </p>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left Side - Lola Image con Lupa */}
            <div className="relative flex justify-center md:justify-start order-first">
              <div className="relative w-full max-w-lg">
                {/* Efecto de lupa - círculos concéntricos decorativos */}
                <div className="absolute -top-4 -left-4 md:-top-8 md:-left-8 w-20 h-20 md:w-32 md:h-32 border-2 md:border-4 border-blue-300/40 rounded-full opacity-50"></div>
                <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-16 h-16 md:w-24 md:h-24 border-2 md:border-3 border-cyan-300/40 rounded-full opacity-60"></div>
                
                {/* Formas geométricas decorativas */}
                <div className="absolute top-0 -right-2 md:-right-4 w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-xl"></div>
                <div className="absolute bottom-4 -left-3 md:bottom-8 md:-left-6 w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-orange-400/25 to-yellow-400/25 rounded-lg rotate-12 opacity-70"></div>
                <div className="absolute top-1/2 -left-4 md:-left-8 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-lg"></div>
                <div className="absolute -bottom-3 right-2 md:-bottom-6 md:right-4 w-12 h-12 md:w-18 md:h-18 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 rounded-full"></div>
                
                {/* Líneas decorativas que sugieren "investigación" */}
                <div className="hidden md:block absolute top-12 -right-12 w-1 h-24 bg-gradient-to-b from-blue-400/40 to-transparent rotate-45"></div>
                <div className="hidden md:block absolute bottom-16 -left-12 w-1 h-20 bg-gradient-to-b from-cyan-400/40 to-transparent -rotate-45"></div>
                
                {/* Lola Image con efecto de brillo */}
                <div className="relative z-10 w-full transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-transparent rounded-3xl blur-2xl"></div>
                  <img
                    src={lolaImage2Url}
                    alt="Lola investigando - Guiando tu emprendimiento"
                    className="w-full h-auto drop-shadow-2xl relative z-10"
                    style={{
                      filter: 'drop-shadow(0 25px 50px rgba(59, 130, 246, 0.25))',
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Right Side - Steps Simplificados */}
            <div className="space-y-6 md:space-y-8">
              {[
                {
                  step: "1",
                  title: "Describe tu idea",
                  description: "30 segundos. Sin formularios eternos. Solo tu idea en tus palabras.",
                  icon: Lightbulb,
                },
                {
                  step: "2",
                  title: "Obtén tu Score",
                  description: "IA analiza viabilidad, mercado y competencia. Score 0-100 con reporte PDF.",
                  icon: BarChart3,
                },
                {
                  step: "3",
                  title: "Decide con criterio",
                  description: "Pivota, mejora o ejecuta. Proof te quita la opción de no decidir.",
                  icon: Target,
                },
                {
                  step: "4",
                  title: "Ejecuta con OKRs y Agentes IA",
                  description: "Transforma el análisis en un plan de acción claro. Agentes IA especializados (Producto, Marketing, Técnico) te guían paso a paso y miden tu progreso real.",
                  icon: Rocket,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex gap-5 items-start group">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="h-5 w-5 text-blue-600 group-hover:text-cyan-600 transition-colors" />
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                      </div>
                      <p className="text-gray-700 text-base md:text-lg leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* Sección PRICING */}
      <section id="pricing" className="container mx-auto px-4 py-20 bg-gradient-to-br from-blue-50/50 via-cyan-50/50 to-sky-50/50 rounded-3xl my-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            No vendemos IA. Vendemos criterio.
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Valida antes de quemar meses de tu vida. Ejecuta solo lo que vale la pena.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
            <span className="text-green-600 font-medium text-sm">Estamos en beta, precios especiales ahora</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Precios sujetos a cambio en versión final</p>
        </div>

        {/* Cards de planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* SCOUT */}
          <Card className="border-2 border-blue-100/50 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4 pt-6 text-center">
              <div className="text-3xl mb-2">🧭</div>
              <CardTitle className="text-2xl font-bold text-gray-900">SCOUT</CardTitle>
              <p className="text-3xl font-bold text-blue-600">Gratis</p>
              <CardDescription className="text-base text-gray-700 font-medium mt-2">
                Explora sin humo.
              </CardDescription>
              <p className="text-sm text-gray-600">Para quienes empiezan pero no quieren perder tiempo.</p>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <ul className="space-y-3 text-sm text-gray-700">
                {[
                  "1 validación IA / mes",
                  "Score 0-100",
                  "Reporte PDF",
                  "Ver comunidad",
                  "Checklist básico",
                  'Badge "Idea validada"',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth" className="block mt-6">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-90 text-white">
                  Analiza tu idea gratis
                </Button>
              </Link>
              <p className="text-xs text-gray-500 text-center mt-2">Sin tarjeta requerida</p>
            </CardContent>
          </Card>

          {/* OPERATOR */}
          <Card className="border-2 border-blue-400 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-yellow-500"></div>
            <Badge className="absolute top-4 right-4 bg-green-500 text-white">Acceso gratis en beta</Badge>
            <CardHeader className="pb-4 pt-8 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <CardTitle className="text-2xl font-bold text-gray-900">OPERATOR</CardTitle>
              <p className="text-3xl font-bold text-blue-600">$9.99<span className="text-lg font-normal text-gray-600">/mes</span></p>
              <CardDescription className="text-base text-gray-700 font-medium mt-2">
                Para founders serios que decidieron ejecutar.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <ul className="space-y-3 text-sm text-gray-700">
                {[
                  "Coach IA ilimitado",
                  "Análisis 50+ competidores",
                  "Sistema de OKRs",
                  "Timeline personalizado",
                  "Emails de accountability",
                  "Comunidad PRO",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth" className="block mt-6">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white">
                  Solicitar acceso beta
                </Button>
              </Link>
              <p className="text-xs text-gray-500 text-center mt-2">Pago habilitado cuando lancemos (Q2 2026)</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section - Emocional */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left Side - Text and CTA */}
            <div className="space-y-8 text-center md:text-left">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
                  Deja de dudar
                </h2>
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                  Valida tu idea en 15 minutos. Sin formularios.
                </p>
                <p className="text-lg text-gray-600 font-medium">
                  Obtén un score 0-100 + plan de acción.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center md:items-start gap-5 pt-6">
                <Link href="/auth" className="w-full sm:w-auto group">
                  <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                    <span className="relative z-10 flex items-center gap-2">
                      <Rocket className="h-5 w-5" />
                      Decide hoy
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </Button>
                </Link>
                <Link href="#pricing" className="w-full sm:w-auto group">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto relative text-lg font-semibold px-12 py-8 h-auto rounded-2xl border-2 border-blue-400/60 text-blue-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-500 hover:text-blue-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                    <span className="flex items-center gap-2">
                      Ver planes
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Lola Image */}
            <div className="relative flex justify-center md:justify-end order-first md:order-last">
              <div className="relative w-full max-w-lg overflow-visible md:overflow-visible">
                {/* Formas geométricas decorativas */}
                <div className="absolute top-0 left-0 md:-top-4 md:-left-4 w-8 h-8 md:w-16 md:h-16 bg-orange-400 rounded-full opacity-30"></div>
                <div className="absolute top-4 right-0 md:top-8 md:-right-8 w-6 h-6 md:w-12 md:h-12 bg-yellow-400 rounded-lg opacity-30"></div>
                <div className="absolute bottom-0 left-2 md:-bottom-4 md:left-8 w-10 h-10 md:w-20 md:h-20 bg-orange-400 rounded-lg opacity-20 rotate-45"></div>
                <div className="absolute top-1/2 right-0 md:-right-12 w-12 h-12 md:w-24 md:h-24 bg-yellow-300 rounded-full opacity-20"></div>
                <div className="absolute bottom-0 right-0 md:-bottom-8 md:-right-4 w-8 h-8 md:w-16 md:h-16 bg-orange-300 rounded-full opacity-30"></div>
                
                {/* Formas con gradientes y blur */}
                <div className="absolute top-0 right-0 md:-right-4 w-10 h-10 md:w-20 md:h-20 bg-gradient-to-br from-orange-400/30 to-yellow-400/30 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-1 md:bottom-8 md:-left-6 w-8 h-8 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400/25 to-orange-400/25 rounded-lg rotate-12 opacity-70"></div>
                <div className="absolute top-1/2 left-0 md:-left-8 w-12 h-12 md:w-24 md:h-24 bg-gradient-to-br from-orange-300/20 to-yellow-300/20 rounded-full blur-lg"></div>
                
                {/* Fondo sutil con gradiente */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-yellow-50/20 to-transparent rounded-3xl blur-3xl"></div>
                
                {/* Mensaje arriba de Lola */}
                <div className="relative z-20 mb-6 text-center md:text-right">
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
                    ¿Qué estás esperando
                  </p>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent leading-tight">
                    para empezar?
                  </p>
                </div>
                
                {/* Lola Image */}
                <div className="relative z-10 w-full transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-yellow-400/10 to-transparent rounded-3xl blur-2xl"></div>
                  <img
                    src={lolaImage3Url}
                    alt="Lola - ¿Qué estás esperando?"
                    className="w-full h-auto drop-shadow-2xl relative z-10"
                    style={{
                      filter: 'drop-shadow(0 25px 50px rgba(249, 115, 22, 0.25))',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20">
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
                Where Execution Speaks - Valida tu idea antes de construir.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#pricing" className="hover:text-primary transition-colors">Precios</Link></li>
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

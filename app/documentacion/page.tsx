"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Code, 
  Settings, 
  Rocket,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
  BookOpen,
  Zap
} from "lucide-react";

export default function DocumentacionPage() {
  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  const sections = [
    {
      title: "Introducción",
      icon: Rocket,
      description: "Comienza aquí para entender cómo funciona Proof",
      items: [
        { title: "¿Qué es Proof?", href: "/documentacion/introduccion#que-es" },
        { title: "Primeros pasos", href: "/documentacion/introduccion#primeros-pasos" },
        { title: "Conceptos básicos", href: "/documentacion/introduccion#conceptos" },
      ],
      color: "from-blue-500/20 to-cyan-600/20",
    },
    {
      title: "Proof AI",
      icon: Zap,
      description: "Aprende a validar tu idea de startup con IA",
      items: [
        { title: "Cómo usar Proof AI", href: "/documentacion/proof-ai#como-usar" },
        { title: "Interpretar resultados", href: "/documentacion/proof-ai#resultados" },
        { title: "Mejorar tu puntaje", href: "/documentacion/proof-ai#mejorar" },
      ],
      color: "from-cyan-500/20 to-blue-600/20",
    },
    {
      title: "Proof Coach",
      icon: MessageSquare,
      description: "Guía completa del sistema multi-agente",
      items: [
        { title: "Agentes disponibles", href: "/documentacion/proof-coach#agentes" },
        { title: "Cómo hacer preguntas efectivas", href: "/documentacion/proof-coach#preguntas" },
        { title: "Gestión de conversaciones", href: "/documentacion/proof-coach#conversaciones" },
      ],
      color: "from-blue-500/20 to-cyan-600/20",
    },
    {
      title: "Constructor de Startup",
      icon: Code,
      description: "Desarrolla y mejora tu startup con IA",
      items: [
        { title: "Agregar contexto detallado", href: "/documentacion/constructor-de-startup#contexto" },
        { title: "Mejorar idea con IA", href: "/documentacion/constructor-de-startup#mejorar-idea" },
        { title: "Lluvia de ideas", href: "/documentacion/constructor-de-startup#brainstorm" },
      ],
      color: "from-cyan-500/20 to-blue-600/20",
    },
    {
      title: "OKRs",
      icon: Target,
      description: "Sistema de objetivos y resultados clave",
      items: [
        { title: "Crear OKRs", href: "/documentacion/okrs#crear-okrs" },
        { title: "Seguimiento de progreso", href: "/documentacion/okrs#seguimiento" },
        { title: "Mejores prácticas", href: "/documentacion/okrs#mejores-practicas" },
      ],
      color: "from-blue-500/20 to-cyan-600/20",
    },
    {
      title: "Comunidad",
      icon: Users,
      description: "Conecta, comparte y aprende con otros emprendedores",
      items: [
        { title: "Unirse a la comunidad", href: "/documentacion/comunidad#comunidad" },
        { title: "Compartir logros", href: "/documentacion/comunidad#logros" },
        { title: "Participar en retos", href: "/documentacion/comunidad#retos" },
      ],
      color: "from-cyan-500/20 to-blue-600/20",
    },
    {
      title: "Progreso",
      icon: TrendingUp,
      description: "Dashboard y sistema de logros",
      items: [
        { title: "Ver tu progreso", href: "/documentacion/progreso#progreso" },
        { title: "Sistema de logros", href: "/documentacion/progreso#logros" },
        { title: "Timeline de actividades", href: "/documentacion/progreso#timeline" },
      ],
      color: "from-blue-500/20 to-cyan-600/20",
    },
    {
      title: "Configuración",
      icon: Settings,
      description: "Configura tu cuenta y preferencias",
      items: [
        { title: "Perfil de usuario", href: "/documentacion/configuracion#perfil" },
        { title: "Configuración de IA", href: "/documentacion/configuracion#ia" },
        { title: "Privacidad", href: "/documentacion/configuracion#privacidad" },
      ],
      color: "from-cyan-500/20 to-blue-600/20",
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
              Documentación Completa
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Guías detalladas para usar todas las funcionalidades de Proof y transformar tu idea en realidad
            </p>
          </div>

          {/* Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              const sectionSlug = section.title.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[áéíóú]/g, (m) => ({'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u'}[m] || m));
              const sectionUrl = `/documentacion/${sectionSlug}`;
              
              return (
                <Card key={idx} className="group border-2 border-blue-100/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/50 bg-white/90 backdrop-blur-sm overflow-hidden h-full flex flex-col">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${section.color.split(' ')[0]} ${section.color.split(' ')[1]}`}></div>
                  <Link href={sectionUrl} className="block">
                    <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg pb-4 pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 w-fit shadow-lg group-hover:shadow-xl transition-shadow">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {section.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-base leading-relaxed text-gray-700">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                  </Link>
                  <CardContent className="pt-4 pb-6 flex-1">
                    <ul className="space-y-3">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx}>
                          {item.href.startsWith('/') ? (
                            <Link 
                              href={item.href}
                              className="text-sm text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2 group/item"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover/item:bg-cyan-600 transition-colors"></span>
                              {item.title}
                              <ArrowRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all ml-auto" />
                            </Link>
                          ) : (
                            <div className="text-sm text-gray-700 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {item.title}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Start */}
          <Card className="border-2 border-blue-100/50 shadow-2xl mt-16 bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-sky-50/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-400/20 to-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            <CardContent className="pt-12 pb-12 px-8 md:px-16 relative z-10">
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                  ¿Necesitas ayuda rápida?
                </h2>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  Consulta nuestras guías paso a paso o contacta con nuestro equipo de soporte
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                  <Link href="/guias" className="w-full sm:w-auto group">
                    <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                      <span className="relative z-10 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Ver Guías
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

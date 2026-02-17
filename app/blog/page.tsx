import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, User, BookOpen } from "lucide-react";
import { getAllBlogPosts } from "@/lib/blog-posts";

export default function BlogPage() {
  const blogPosts = getAllBlogPosts();

  // URLs de imágenes desde Cloudinary
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
            Aprende y Emprende
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Artículos, guías y recursos para ayudarte en tu camino emprendedor
          </p>
          <div className="pt-4">
            <Badge variant="outline" className="text-sm border-blue-300 text-blue-700 bg-blue-50/50">
              {blogPosts.length} artículos disponibles
            </Badge>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {blogPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="border-2 border-blue-100/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] overflow-hidden cursor-pointer h-full flex flex-col group bg-white/90 backdrop-blur-sm relative">
                {/* Gradient top border */}
                <div className={`h-1.5 bg-gradient-to-r ${post.color} group-hover:h-2 transition-all`}></div>
                
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                
                <CardHeader className="flex-1 pt-6 pb-4 px-6 relative z-10">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-700 border-blue-200">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      {post.date}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                      <User className="h-3.5 w-3.5 text-cyan-500" />
                      {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-4 leading-tight">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-6 px-6 relative z-10">
                  <CardDescription className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-cyan-600 group-hover:gap-3 transition-all">
                    Leer artículo completo
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </CardContent>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-cyan-50/0 group-hover:from-blue-50/30 group-hover:to-cyan-50/20 transition-all duration-500 pointer-events-none"></div>
              </Card>
            </Link>
          ))}
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

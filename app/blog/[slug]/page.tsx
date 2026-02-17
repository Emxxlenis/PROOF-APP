import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Calendar, User, Clock, CheckCircle2, Share2 } from "lucide-react";
import { getBlogPostBySlug, getAllBlogPosts } from "@/lib/blog-posts";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const allPosts = getAllBlogPosts();
  const currentIndex = allPosts.findIndex((p) => p.id === post.id);
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

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
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Blog
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

      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="mb-8 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Blog
            </Button>
          </Link>

          {/* Article Header */}
          <Card className="border-2 border-blue-100/50 shadow-xl mb-8 relative overflow-hidden bg-white/90 backdrop-blur-sm">
            <div className={`h-2 bg-gradient-to-r ${post.color}`}></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="pb-8 relative z-10">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-700 border-blue-200">
                  {post.category}
                </Badge>
                <span className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {post.date}
                </span>
                <span className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
                  <Clock className="h-4 w-4 text-cyan-500" />
                  {post.readTime} de lectura
                </span>
                <span className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
                  <User className="h-4 w-4 text-blue-500" />
                  {post.author}
                </span>
              </div>
              <CardTitle className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                {post.title}
              </CardTitle>
              <CardDescription className="text-xl leading-relaxed text-gray-700">
                {post.excerpt}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Article Content */}
          <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-10 pb-16 px-8 md:px-16">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => (
                      <h1 className="text-3xl md:text-4xl font-bold mt-10 mb-6 text-gray-900 border-b-2 border-blue-300 pb-3" {...props} />
                    ),
                    h2: ({node, ...props}) => (
                      <h2 className="text-2xl md:text-3xl font-bold mt-10 mb-5 text-gray-900 flex items-center gap-3 pb-2 border-b border-blue-200">
                        <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
                        <span {...props} />
                      </h2>
                    ),
                    h3: ({node, ...props}) => (
                      <h3 className="text-xl md:text-2xl font-semibold mt-6 mb-3 text-gray-900" {...props} />
                    ),
                    p: ({node, ...props}) => (
                      <p className="mb-6 leading-relaxed text-gray-700 text-base md:text-lg" {...props} />
                    ),
                    ul: ({node, ...props}) => (
                      <ul className="list-none mb-6 space-y-3 ml-2" {...props} />
                    ),
                    ol: ({node, ...props}) => (
                      <ol className="list-decimal mb-6 space-y-3 ml-6 marker:text-blue-600" {...props} />
                    ),
                    li: ({node, ...props}: any) => (
                      <li className="flex items-start gap-3 text-gray-700 mb-3 p-2 rounded-lg hover:bg-blue-50/50 transition-colors">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="flex-1 leading-relaxed">{props.children}</span>
                      </li>
                    ),
                    strong: ({node, ...props}) => (
                      <strong className="font-bold text-gray-900" {...props} />
                    ),
                    code: ({node, inline, ...props}: any) => 
                      inline ? (
                        <code className="bg-blue-50 px-2 py-1 rounded text-sm font-mono text-blue-700 border border-blue-200" {...props} />
                      ) : (
                        <code className="block bg-blue-50 p-4 rounded-lg text-sm font-mono overflow-x-auto my-6 border border-blue-200" {...props} />
                      ),
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-blue-500 pl-6 italic my-8 text-gray-700 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 py-5 rounded-r-lg shadow-sm" {...props} />
                    ),
                    a: ({node, ...props}: any) => (
                      <a className="text-blue-600 hover:text-cyan-600 hover:underline font-medium transition-colors" {...props} />
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Share and Navigation Section */}
          <div className="mt-12 space-y-8">
            {/* Share Section */}
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <CardContent className="pt-8 pb-8 px-6 md:px-8 relative z-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                      <Share2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-gray-900">Compartir artículo</span>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="lg" className="rounded-xl border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all font-semibold px-6">
                      Twitter
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-xl border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all font-semibold px-6">
                      LinkedIn
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-xl border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all font-semibold px-6">
                      Facebook
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Between Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prevPost && (
                <Link href={`/blog/${prevPost.slug}`}>
                  <Card className="border-2 border-blue-100/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] cursor-pointer h-full bg-white/90 backdrop-blur-sm group relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                    <CardHeader className="pt-6 pb-4 px-6 relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowLeft className="h-5 w-5 text-blue-600 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-semibold text-blue-600">Artículo anterior</span>
                      </div>
                      <CardTitle className="text-xl font-bold hover:text-blue-600 transition-colors text-gray-900 leading-tight">
                        {prevPost.title}
                      </CardTitle>
                    </CardHeader>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-cyan-50/0 group-hover:from-blue-50/30 group-hover:to-cyan-50/20 transition-all duration-500 pointer-events-none"></div>
                  </Card>
                </Link>
              )}
              {nextPost && (
                <Link href={`/blog/${nextPost.slug}`} className={!prevPost ? "md:col-start-2" : ""}>
                  <Card className="border-2 border-blue-100/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] cursor-pointer h-full bg-white/90 backdrop-blur-sm group relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                    <CardHeader className="pt-6 pb-4 px-6 relative z-10">
                      <div className="flex items-center gap-2 mb-3 justify-end">
                        <span className="text-sm font-semibold text-cyan-600">Siguiente artículo</span>
                        <ArrowRight className="h-5 w-5 text-cyan-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <CardTitle className="text-xl font-bold text-right hover:text-cyan-600 transition-colors text-gray-900 leading-tight">
                        {nextPost.title}
                      </CardTitle>
                    </CardHeader>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/0 to-blue-50/0 group-hover:from-cyan-50/30 group-hover:to-blue-50/20 transition-all duration-500 pointer-events-none"></div>
                  </Card>
                </Link>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <Card className="border-2 border-blue-100/50 shadow-2xl mt-12 bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-sky-50/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-400/20 to-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            <CardContent className="pt-12 pb-12 px-8 md:px-16 relative z-10">
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
                  ¿Listo para transformar tu idea en startup?
                </h2>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  Comienza validando tu idea con Proof AI y descubre su potencial real
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
                  <Link href="/auth" className="w-full sm:w-auto group">
                    <Button size="lg" className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white text-lg font-bold px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                      <span className="relative z-10 flex items-center gap-2">
                        Comenzar Ahora
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Button>
                  </Link>
                  <Link href="/blog" className="w-full sm:w-auto group">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto relative text-lg font-semibold px-12 py-8 h-auto rounded-2xl border-2 border-blue-400/60 text-blue-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-500 hover:text-blue-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                      <span className="flex items-center gap-2">
                        Ver Más Artículos
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </article>

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

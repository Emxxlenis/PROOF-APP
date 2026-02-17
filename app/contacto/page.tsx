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
  Mail, 
  MessageSquare,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ArrowRight,
  FileText,
  BookOpen,
  HelpCircle,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function ContactoPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  // URLs de imágenes desde Cloudinary
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el mensaje");
      }

      setIsSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el mensaje. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Hablemos
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-2 border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white/90 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
                <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-gray-900">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700 font-semibold">lenisdomingueze@gmail.com</p>
                  <p className="text-sm text-gray-600 mt-2">Respuesta en menos de 24 horas</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white/90 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                <CardHeader className="bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-transparent rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-gray-900">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    Horario de Atención
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700 font-semibold">Lunes - Viernes</p>
                  <p className="text-gray-700">9:00 AM - 6:00 PM (COT)</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white/90 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
                <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-gray-900">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700 font-semibold">Colombia</p>
                  <p className="text-sm text-gray-600 mt-2">Plataforma disponible globalmente</p>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="border-2 border-blue-100/50 shadow-lg bg-gradient-to-br from-blue-50/80 via-cyan-50/80 to-sky-50/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gray-900">Enlaces Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  <Link href="/ayuda" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors group">
                    <HelpCircle className="h-4 w-4 text-blue-500" />
                    Centro de Ayuda
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />
                  </Link>
                  <Link href="/documentacion" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors group">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Documentación
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />
                  </Link>
                  <Link href="/guias" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors group">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Guías
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />
                  </Link>
                  <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors group">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    Blog
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-blue-100/50 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
                <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent rounded-t-lg relative z-10">
                  <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Envíanos un Mensaje
                  </CardTitle>
                  <CardDescription className="text-base text-gray-700">
                    Completa el formulario y nos pondremos en contacto contigo pronto
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 relative z-10">
                  {isSubmitted ? (
                    <div className="p-8 text-center">
                      <div className="p-4 rounded-full bg-green-100 w-fit mx-auto mb-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Mensaje enviado exitosamente!</h3>
                      <p className="text-gray-700 mb-6">Te responderemos pronto. Revisa tu email para la confirmación.</p>
                      <Button 
                        onClick={() => setIsSubmitted(false)}
                        variant="outline"
                        className="border-blue-400 text-blue-600 hover:bg-blue-50"
                      >
                        Enviar otro mensaje
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-gray-700 font-semibold">Nombre</Label>
                          <Input 
                            id="firstName" 
                            placeholder="Juan" 
                            required 
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-gray-700 font-semibold">Apellido</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Pérez" 
                            required 
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="juan@ejemplo.com" 
                          required 
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-gray-700 font-semibold">Asunto</Label>
                        <Input 
                          id="subject" 
                          placeholder="¿En qué podemos ayudarte?" 
                          required 
                          value={formData.subject}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-gray-700 font-semibold">Mensaje</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Describe tu consulta, pregunta o problema en detalle..." 
                          className="min-h-[120px] sm:min-h-[150px] md:min-h-[180px] border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          required
                          value={formData.message}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold text-lg py-6 shadow-xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-[1.02] group disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        size="lg"
                        disabled={isLoading}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5" />
                              Enviar Mensaje
                              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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

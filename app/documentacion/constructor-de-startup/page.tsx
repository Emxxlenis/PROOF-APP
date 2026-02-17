import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Code, ArrowRight } from "lucide-react";

export default function ConstructorStartupPage() {
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 border-b border-blue-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center relative h-12 md:h-14 w-auto">
              <Image src={proofLogoUrl} alt="Proof Logo" width={56} height={56} className="h-12 md:h-14 w-auto object-contain" unoptimized />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Proof</h2>
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
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white">Comenzar</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <Code className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent leading-tight">
              Constructor de Startup
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Desarrolla y mejora tu idea con inteligencia artificial
            </p>
          </div>

          <div className="space-y-8">
            <Card className="border-2 border-blue-100/50 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ¿Qué es el Constructor de Startup?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  El <strong>Constructor de Startup</strong> es una herramienta que te permite desarrollar y mejorar tu idea de startup usando inteligencia artificial. Puedes agregar contexto detallado, mejorar tu idea con IA, y generar hipótesis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}









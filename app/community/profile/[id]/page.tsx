"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Rocket, 
  Mail, 
  Calendar,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Award,
  Linkedin,
  Github,
  Twitter,
  Globe
} from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const stageLabels: Record<string, string> = {
  ideation: "Ideación",
  validation: "Validación",
  mvp: "MVP",
  first_sale: "Primera Venta",
  growth: "Crecimiento",
};

const stageColors: Record<string, string> = {
  ideation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  validation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  mvp: "bg-green-500/10 text-green-600 border-green-500/20",
  first_sale: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  growth: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

// Helper function to normalize URLs
const normalizeUrl = (url: string, type: 'website' | 'linkedin' | 'github' | 'twitter'): string => {
  if (!url) return '';
  
  // If already has protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Remove leading/trailing slashes and whitespace
  url = url.trim().replace(/^\/+|\/+$/g, '');
  
  switch (type) {
    case 'linkedin':
      // If contains linkedin.com, just add https://
      if (url.includes('linkedin.com')) {
        return `https://${url}`;
      }
      // If it's just a username, construct full URL
      return `https://www.linkedin.com/in/${url}`;
    
    case 'github':
      // If contains github.com, just add https://
      if (url.includes('github.com')) {
        return `https://${url}`;
      }
      // If it's just a username, construct full URL
      return `https://github.com/${url}`;
    
    case 'twitter':
      // If contains twitter.com or x.com, just add https://
      if (url.includes('twitter.com') || url.includes('x.com')) {
        return `https://${url}`;
      }
      // If it's just a username (remove @ if present), construct full URL
      const username = url.replace(/^@/, '');
      return `https://twitter.com/${username}`;
    
    case 'website':
      // For website, just add https:// if it doesn't have protocol
      return `https://${url}`;
    
    default:
      return url;
  }
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Validate userId
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error("Invalid user ID:", userId);
        setProfile(null);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/community/profile/${userId}`, {
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`,
        } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          user: data.user,
          startups: data.startups || [],
          posts: data.posts || [],
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error loading profile:", response.status, errorData);
        setProfile(null);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId, loadProfile]);

  const NavigationHeader = () => (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Lado izquierdo: back + título */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] sm:text-xs text-gray-700 shadow-sm hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="sm:hidden">Volver</span>
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="hidden sm:block h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] sm:text-xs text-gray-500">Perfil de Usuario</p>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 break-words">
                {profile?.user?.full_name || profile?.user?.email || "Cargando..."}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
          <LoadingState message="Cargando perfil..." fullScreen={false} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
          <EmptyState
            title="Perfil no encontrado"
            message="El perfil que buscas no existe o no está disponible."
            action={
              <Button 
                onClick={() => router.back()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            }
            fullScreen={false}
            variant="error"
          />
        </div>
      </div>
    );
  }

  const { user, startups, posts } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      <NavigationHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <Card className="border-blue-100 bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-100">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start md:items-center">
                {/* Avatar Section */}
                <div className="flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || user.email}
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-blue-200"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl sm:text-4xl md:text-5xl font-bold border-4 border-white shadow-lg ring-2 ring-blue-200">
                      {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 break-words">
                      {user.full_name || user.email || "Usuario"}
                    </h1>
                    
                    {user.email && (
                      <div className="flex items-center gap-2 text-gray-600 mb-2 sm:mb-3">
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium break-all">{user.email}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {user.role && (
                        <Badge 
                          className="text-xs sm:text-sm py-1 sm:py-1.5 px-3 sm:px-4 bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold"
                        >
                          {user.role === 'student' ? '👨‍🎓 Estudiante' : 
                           user.role === 'mentor' ? '🎓 Mentor' : 
                           user.role === 'admin' ? '⚙️ Administrador' : 
                           user.role}
                        </Badge>
                      )}
                      
                      {user.created_at && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>Miembro desde {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: es })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {user.public_bio && (
                    <div className="pt-3 sm:pt-4 border-t border-blue-100">
                      <div className="p-3 sm:p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                          {user.public_bio}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {user.skills && user.skills.length > 0 && (
                    <div className="pt-3 sm:pt-4 border-t border-blue-100">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Habilidades</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            className="text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/20 transition-all duration-200"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Media Links */}
                  {(user.website || user.linkedin || user.github || user.twitter) && (
                    <div className="pt-3 sm:pt-4 border-t border-blue-100">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Redes Sociales</h3>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {user.website && (
                          <a
                            href={normalizeUrl(user.website, 'website')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-200 text-xs sm:text-sm font-medium"
                          >
                            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Website</span>
                            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </a>
                        )}
                        {user.linkedin && (
                          <a
                            href={normalizeUrl(user.linkedin, 'linkedin')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-200 text-xs sm:text-sm font-medium"
                          >
                            <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>LinkedIn</span>
                            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </a>
                        )}
                        {user.github && (
                          <a
                            href={normalizeUrl(user.github, 'github')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 transition-all duration-200 text-xs sm:text-sm font-medium"
                          >
                            <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>GitHub</span>
                            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </a>
                        )}
                        {user.twitter && (
                          <a
                            href={normalizeUrl(user.twitter, 'twitter')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 hover:border-sky-300 text-sky-700 hover:text-sky-800 transition-all duration-200 text-xs sm:text-sm font-medium"
                          >
                            <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Twitter/X</span>
                            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Startups</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{startups.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-blue-50 flex-shrink-0 ml-2">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Posts</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{posts.length}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-purple-50 flex-shrink-0 ml-2">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Experiencia</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {user.skills?.length || 0}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-green-50 flex-shrink-0 ml-2">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Startups Section */}
        {startups.length > 0 && (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-100">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
                    <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold">Startups ({startups.length})</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Startups creadas por {user.full_name || user.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {startups.map((startup: any) => (
                  <Link key={startup.id} href={`/community/project/${startup.id}`}>
                    <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3">
                          {startup.logo_url && (
                            <img
                              src={startup.logo_url}
                              alt={startup.name}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border-2 border-blue-100"
                            />
                          )}
                          <Badge className={`${stageColors[startup.stage] || "bg-gray-500/10 text-gray-600 border-gray-500/20"} text-xs sm:text-sm`}>
                            {stageLabels[startup.stage] || startup.stage}
                          </Badge>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-1 break-words">{startup.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-4 break-words">
                          {startup.description || "Sin descripción"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <ExternalLink className="h-3 w-3" />
                          <span>Ver detalles</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Section */}
        {posts.length > 0 && (
          <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-blue-100">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold">Posts Recientes ({posts.length})</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Últimas publicaciones en la comunidad
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {posts.map((post: any) => (
                  <Card key={post.id} className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4 sm:p-6">
                      {post.title && (
                        <h3 className="text-base sm:text-lg font-bold mb-2 flex items-center gap-2 break-words">
                          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                          {post.title}
                        </h3>
                      )}
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4 whitespace-pre-wrap break-words">
                        {post.content}
                      </p>
                      {post.images && post.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 sm:mb-4">
                          {post.images.slice(0, 3).map((image: string, idx: number) => (
                            <img
                              key={idx}
                              src={image}
                              alt={`Imagen ${idx + 1}`}
                              className="w-full h-24 sm:h-32 object-cover rounded-lg border border-blue-100"
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 sm:pt-3 border-t border-blue-100">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty States */}
        {startups.length === 0 && posts.length === 0 && (
          <EmptyState
            title="Sin contenido aún"
            message={`${user.full_name || user.email} aún no ha creado startups ni publicado contenido en la comunidad.`}
            fullScreen={false}
          />
        )}
      </div>
    </div>
  );
}

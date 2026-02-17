"use client";

// Marcar como dinámico para evitar prerenderización
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  MessageSquare, 
  Share2,
  Loader2,
  Send,
  Search,
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  Sparkles,
  Rocket,
  MapPin,
  Calendar,
  Filter,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  MoreVertical,
  ThumbsUp,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postingComments, setPostingComments] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [stats, setStats] = useState({
    activeMembers: 0,
    postsToday: 0,
    connections: 0,
  });
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar cliente solo en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setSupabase(createClient());
      } catch (error) {
        console.error("Error initializing Supabase client:", error);
        // Si hay un error con el storage bloqueado, mostrar mensaje al usuario
        if (error instanceof Error && error.message.includes('storage')) {
          alert("Tu navegador está bloqueando el acceso al almacenamiento. Por favor, permite cookies y almacenamiento local para esta página.");
        }
      }
    }
  }, []);


  const loadStatistics = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Count active members (unique users who posted in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activePosts } = await supabase
        .from("community_posts")
        .select("author_id")
        .gte("created_at", thirtyDaysAgo.toISOString());
      
      const uniqueUsers = new Set(activePosts?.map(p => p.author_id) || []);
      
      // Count posts today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: postsToday } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      
      // Count connections (follows) - simplified
      const { count: connections } = await supabase
        .from("community_follows")
        .select("*", { count: "exact", head: true });
      
      setStats({
        activeMembers: uniqueUsers.size,
        postsToday: postsToday || 0,
        connections: connections || 0,
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }, [supabase]);

  const loadCommunityData = useCallback(async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Si no hay sesión, redirigir al login
      if (!session || sessionError) {
        console.warn("No hay sesión activa, redirigiendo al login...");
        router.push('/auth');
        return;
      }

      // Load feed
      const feedUrl = selectedFilter !== "all" 
        ? `/api/community/feed?limit=20&type=${selectedFilter}`
        : "/api/community/feed?limit=20";
      
      const feedResponse = await fetch(feedUrl, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (feedResponse.ok) {
        const feedData = await feedResponse.json();
        setPosts(feedData.posts || []);
      } else if (feedResponse.status === 401) {
        // Si no está autenticado, redirigir al login
        console.warn("Sesión expirada, redirigiendo al login...");
        router.push('/auth');
        return;
      } else {
        console.error("Error loading feed:", feedResponse.status, await feedResponse.text());
      }

      // Load recommended users
      const recResponse = await fetch("/api/community/recommendations", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (recResponse.ok) {
        const recData = await recResponse.json();
        setRecommendedUsers(recData.users || []);
      } else {
        console.error("Error loading recommendations:", recResponse.status, await recResponse.text());
      }

      // Load trending posts
      const trendingResponse = await fetch("/api/community/feed?limit=5&sort=trending", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingPosts(trendingData.posts || []);
      } else {
        console.error("Error loading trending:", trendingResponse.status, await trendingResponse.text());
      }

      // Load real statistics
      await loadStatistics();
    } catch (error) {
      console.error("Error loading community data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedFilter, loadStatistics, router]);

  // Cargar datos cuando supabase esté listo
  useEffect(() => {
    if (supabase) {
      loadCommunityData();
    }
  }, [supabase, loadCommunityData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/community/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          return data.url;
        } else {
          const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
          console.error("Error uploading image:", errorData);
          throw new Error(errorData.error || errorData.details || "Error al subir la imagen");
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => url !== null && url !== undefined) as string[];
      
      if (validUrls.length === 0) {
        alert("No se pudieron subir las imágenes. Verifica que el bucket 'community' esté configurado en Supabase Storage. Consulta CONFIGURAR_STORAGE_COMMUNITY.md para más información.");
        return;
      }
      
      if (validUrls.length < files.length) {
        alert(`Se subieron ${validUrls.length} de ${files.length} imágenes. Algunas imágenes no se pudieron subir.`);
      }
      
      setSelectedImages((prev) => [...prev, ...validUrls]);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      alert(error.message || "Error al subir las imágenes. Por favor, intenta de nuevo.");
    } finally {
      setUploadingImages(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!supabase) return;
    if (!newPost.trim() && selectedImages.length === 0) return;

    try {
      setPosting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's startup if exists
      const { data: startup } = await supabase
        .from("startups")
        .select("id")
        .eq("student_id", session.user.id)
        .maybeSingle();

      const response = await fetch("/api/community/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: newPost,
          postType: "update",
          images: selectedImages.length > 0 ? selectedImages : undefined,
          startupId: startup?.id || null,
        }),
      });

      if (response.ok) {
        setNewPost("");
        setSelectedImages([]);
        // Scroll to top to show new post
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await loadCommunityData();
      } else {
        const errorData = await response.json();
        console.error("Error posting:", errorData.error);
        alert(errorData.error || "Error al publicar el post");
      }
    } catch (error) {
      console.error("Error posting:", error);
      alert("Error al publicar el post. Por favor, intenta de nuevo.");
    } finally {
      setPosting(false);
    }
  };

  const handleShare = async (post: any) => {
    if (!supabase) return;
    try {
      const postUrl = `${window.location.origin}/community/post/${post.id}`;
      
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: post.title || "Post de la comunidad",
          text: post.content?.substring(0, 100) || "",
          url: postUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(postUrl);
        alert("¡Enlace copiado al portapapeles!");
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== "AbortError") {
        // Fallback: copy to clipboard
        try {
          const postUrl = `${window.location.origin}/community/post/${post.id}`;
          await navigator.clipboard.writeText(postUrl);
          alert("¡Enlace copiado al portapapeles!");
        } catch (clipboardError) {
          console.error("Error sharing:", clipboardError);
          alert("No se pudo compartir el post. Por favor, copia el enlace manualmente.");
        }
      }
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !isLiked,
                likes_count: isLiked ? (post.likes_count || 1) - 1 : (post.likes_count || 0) + 1
              }
            : post
        )
      );

      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  isLiked: isLiked,
                  likes_count: isLiked ? (post.likes_count || 0) + 1 : (post.likes_count || 1) - 1
                }
              : post
          )
        );
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        console.error("Error toggling like:", errorData.error);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: isLiked,
                likes_count: isLiked ? (post.likes_count || 0) + 1 : (post.likes_count || 1) - 1
              }
            : post
        )
      );
    }
  };

  const handleComment = async (postId: string) => {
    if (!supabase) return;
    const commentText = commentTexts[postId]?.trim();
    if (!commentText) return;

    try {
      setPostingComments(prev => new Set(prev).add(postId));
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (response.ok) {
        const data = await response.json();
        setCommentTexts(prev => ({ ...prev, [postId]: "" }));
        // Optimistically update comment count
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, comments_count: (post.comments_count || 0) + 1 }
              : post
          )
        );
        // Reload comments for this post and refresh feed
        await loadCommunityData();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        console.error("Error posting comment:", errorData.error);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setPostingComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/community/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        await loadCommunityData();
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const postTypes = [
    { value: "all", label: "Todos", icon: MessageSquare },
    { value: "update", label: "Actualizaciones", icon: Rocket },
    { value: "milestone", label: "Hitos", icon: CheckCircle2 },
    { value: "question", label: "Preguntas", icon: MessageCircle },
    { value: "showcase", label: "Showcases", icon: Sparkles },
  ];

  // Mostrar loading mientras se inicializa supabase o se cargan datos
  if (!supabase || loading) {
    return <LoadingState message="Cargando comunidad..." />;
  }

  const normalize = (value: any) =>
    typeof value === "string" ? value.toLowerCase() : value ? String(value).toLowerCase() : "";

  const matchesQuery = (text?: string) =>
    searchQuery.trim().length === 0
      ? true
      : normalize(text).includes(searchQuery.trim().toLowerCase());

  const matchesArray = (arr?: string[]) =>
    searchQuery.trim().length === 0
      ? true
      : (arr || []).some((item) => matchesQuery(item));

  const filteredPosts = searchQuery.trim()
    ? posts.filter((post) => {
        const authorName = post.author?.full_name || post.author?.email || "";
        const startupName = post.startup?.name || "";
        return (
          matchesQuery(post.title) ||
          matchesQuery(post.content) ||
          matchesQuery(authorName) ||
          matchesQuery(startupName) ||
          matchesArray(post.tags)
        );
      })
    : posts;

  const filteredRecommended = searchQuery.trim()
    ? recommendedUsers.filter((user) => {
        const name = user.full_name || user.email || "";
        const startupName = user.startup?.name || "";
        return matchesQuery(name) || matchesQuery(startupName);
      })
    : recommendedUsers;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header Mejorado */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Comunidad
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Conecta, comparte y crece con otros founders
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Estadísticas rápidas en header */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-blue-100 shadow-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-gray-700">{stats.activeMembers}</span>
                  <span className="text-gray-500 text-xs">activos</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-blue-100 shadow-sm">
                  <MessageSquare className="h-4 w-4 text-cyan-600" />
                  <span className="font-semibold text-gray-700">{stats.postsToday}</span>
                  <span className="text-gray-500 text-xs">hoy</span>
                </div>
              </div>
              <Link href="/community/gallery">
                <Button variant="outline" className="gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Galería</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar Mejorada */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <Input
              placeholder="Buscar founders, startups, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-11 sm:h-12 text-sm sm:text-base border-blue-200/60 focus:border-blue-400 focus:ring-blue-200 shadow-sm bg-white/80"
            />
          </div>

          {/* Filters Mejorados */}
          <div className="flex gap-2 flex-wrap">
            {postTypes.map((type) => {
              const Icon = type.icon;
              const isActive = selectedFilter === type.value;
              return (
                <Button
                  key={type.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(type.value)}
                  className={`gap-1.5 sm:gap-2 text-xs sm:text-sm transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-md border-0"
                      : "border-blue-200/60 hover:bg-blue-50 hover:border-blue-300 text-gray-700"
                  }`}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.label.substring(0, 4)}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Sidebar - Recommendations */}
          <aside className="lg:col-span-3 space-y-4 sm:space-y-6 lg:sticky lg:top-4 lg:h-fit">
            {/* Recommended Connections */}
            <Card className="border border-blue-100/60 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent shadow-md hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="pt-5 pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200/50">
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  Conectar
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Founders que podrían interesarte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredRecommended.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchQuery.trim()
                      ? "No hay resultados para tu búsqueda"
                      : "No hay recomendaciones disponibles"}
                  </p>
                ) : (
                  filteredRecommended.slice(0, 5).map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg border border-blue-100/60 bg-white/80 hover:bg-white hover:shadow-md transition-all"
                    >
                      <Link href={`/community/profile/${user.id}`} className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-200/50 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-blue-200/50 flex-shrink-0">
                            {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm truncate text-gray-800">
                            {user.full_name || user.email}
                          </p>
                          {user.startup && (
                            <p className="text-xs text-gray-500 truncate">
                              {user.startup.name}
                            </p>
                          )}
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        variant={user.isFollowing ? "outline" : "default"}
                        onClick={() => handleFollow(user.id, user.isFollowing)}
                        className={`shrink-0 text-xs px-2 sm:px-3 ${
                          user.isFollowing 
                            ? "border-blue-200 hover:bg-blue-50" 
                            : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                        }`}
                      >
                        {user.isFollowing ? (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Siguiendo</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Seguir</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border border-blue-100/60 bg-white/80 shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="pt-5 pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200/50">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50">
                  <span className="text-xs sm:text-sm text-gray-600">Miembros activos</span>
                  <span className="font-bold text-blue-600">{stats.activeMembers}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-50/50">
                  <span className="text-xs sm:text-sm text-gray-600">Posts hoy</span>
                  <span className="font-bold text-cyan-600">{stats.postsToday}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50">
                  <span className="text-xs sm:text-sm text-gray-600">Mis conexiones</span>
                  <span className="font-bold text-blue-600">{stats.connections}</span>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6 space-y-4 sm:space-y-6">
            {/* Create Post Mejorado */}
            <Card className="border border-blue-100/60 bg-white/80 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-transparent pt-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-200/50">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  Comparte algo con la comunidad
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="¿Qué quieres compartir? Actualizaciones, hitos, preguntas..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base border-blue-200/60 focus:border-blue-400 focus:ring-blue-200 bg-white/80"
                  />
                  
                  {/* Preview Selected Images */}
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 sm:h-32 object-cover rounded-lg border-2 border-blue-200/60"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            aria-label="Eliminar imagen"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImages}
                        className="border border-blue-200/60 hover:bg-blue-50 hover:border-blue-300 text-gray-700"
                      >
                        {uploadingImages ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            <span className="hidden sm:inline">Subiendo...</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Imagen</span>
                            <span className="sm:hidden">Foto</span>
                          </>
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <Button
                      onClick={handlePost}
                      disabled={posting || (!newPost.trim() && selectedImages.length === 0)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                    >
                      {posting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publicando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Publicar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4 sm:space-y-6">
              {filteredPosts.length === 0 ? (
                <EmptyState
                  title={searchQuery.trim() ? "Sin resultados" : "No hay posts aún"}
                  message={
                    searchQuery.trim()
                      ? "Intenta con otro término: busca por autor, contenido, startup o etiquetas."
                      : "Sé el primero en compartir algo con la comunidad"
                  }
                  action={
                    <Button 
                      onClick={() => document.querySelector('textarea')?.focus()}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Crear primer post
                    </Button>
                  }
                  fullScreen={false}
                />
              ) : (
                filteredPosts.map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onComment={(commentText) => {
                      setCommentTexts(prev => ({ ...prev, [post.id]: commentText }));
                      handleComment(post.id);
                    }}
                    onShare={handleShare}
                    commentText={commentTexts[post.id] || ""}
                    setCommentText={(text) => setCommentTexts(prev => ({ ...prev, [post.id]: text }))}
                    isPostingComment={postingComments.has(post.id)}
                    expandedComments={expandedComments.has(post.id)}
                    onToggleComments={() => {
                      setExpandedComments(prev => {
                        const next = new Set(prev);
                        if (next.has(post.id)) {
                          next.delete(post.id);
                        } else {
                          next.add(post.id);
                        }
                        return next;
                      });
                    }}
                  />
                ))
              )}
            </div>
          </main>

          {/* Right Sidebar - Trending */}
          <aside className="lg:col-span-3 space-y-4 sm:space-y-6 lg:sticky lg:top-4 lg:h-fit">
            {/* Trending Posts */}
            <Card className="border border-orange-200/60 bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-transparent shadow-md hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600"></div>
              <CardHeader className="pt-5 pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-200/50">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  Trending
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Posts más populares ahora
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingPosts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay posts trending
                  </p>
                ) : (
                  trendingPosts.map((post: any) => (
                    <Link
                      key={post.id}
                      href={`#post-${post.id}`}
                      className="block p-3 rounded-lg border border-orange-100/60 bg-white/80 hover:bg-white hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold line-clamp-2 text-gray-800">
                            {post.title || post.content.substring(0, 60) + "..."}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                            <MessageSquare className="h-3 w-3 text-blue-500" />
                            <span>{post.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-blue-100/60 bg-white/80 shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
              <CardHeader className="pt-5 pb-3">
                <CardTitle className="text-base sm:text-lg text-gray-800">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/community/gallery">
                  <Button variant="outline" className="w-full justify-start border-blue-200/60 hover:bg-blue-50 hover:border-blue-300 text-gray-700">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Ver Galería
                  </Button>
                </Link>
                <Link href="/dashboard/profile">
                  <Button variant="outline" className="w-full justify-start border-blue-200/60 hover:bg-blue-50 hover:border-blue-300 text-gray-700">
                    <Users className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </Button>
                </Link>
                <Link href="/dashboard/projects">
                  <Button variant="outline" className="w-full justify-start border-blue-200/60 hover:bg-blue-50 hover:border-blue-300 text-gray-700">
                    <Rocket className="h-4 w-4 mr-2" />
                    Mis Startups
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
    </div>
  );
}

// Post Card Component
function PostCard({
  post,
  onComment,
  onShare,
  commentText,
  setCommentText,
  isPostingComment,
  expandedComments,
  onToggleComments,
}: {
  post: any;
  onComment: (text: string) => void;
  onShare: (post: any) => void;
  commentText: string;
  setCommentText: (text: string) => void;
  isPostingComment: boolean;
  expandedComments: boolean;
  onToggleComments: () => void;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  // Inicializar cliente solo en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient());
    }
  }, []);

  const loadComments = useCallback(async () => {
    if (!supabase) return;
    try {
      setLoadingComments(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/community/posts/${post.id}/comments`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        console.error("Error loading comments:", response.status);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  }, [supabase, post.id]);

  useEffect(() => {
    if (expandedComments) {
      loadComments();
    } else {
      // Clear comments when collapsed to save memory
      setComments([]);
    }
  }, [expandedComments, post.id, loadComments]);

  // Refresh comments after posting a new one
  const handleCommentPosted = () => {
    loadComments();
  };

  const PostTypeIconMap: Record<string, typeof Rocket> = {
    update: Rocket,
    milestone: CheckCircle2,
    question: MessageCircle,
    showcase: Sparkles,
    announcement: Zap,
  };
  const PostTypeIcon = PostTypeIconMap[post.post_type as string] || MessageSquare;

  const postTypeColors = {
    update: "from-blue-500 to-cyan-500",
    milestone: "from-green-500 to-emerald-500",
    question: "from-purple-500 to-violet-500",
    showcase: "from-orange-500 to-amber-500",
    announcement: "from-yellow-500 to-orange-500",
  };

  return (
    <Card
      id={`post-${post.id}`}
      className="border border-blue-100/60 bg-white/80 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
      <CardHeader className="bg-gradient-to-br from-blue-50/30 via-cyan-50/20 to-transparent pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <Link href={`/community/profile/${post.author_id}`} className="flex-shrink-0">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.full_name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-blue-200/50 hover:border-blue-400 transition-colors cursor-pointer"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-base sm:text-lg border-2 border-blue-200/50 hover:border-blue-400 transition-colors cursor-pointer">
                  {post.author?.full_name?.[0]?.toUpperCase() || post.author?.email?.[0]?.toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Link href={`/community/profile/${post.author_id}`} className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base lg:text-lg hover:text-blue-600 transition-colors cursor-pointer truncate">
                    {post.author?.full_name || post.author?.email}
                  </h3>
                </Link>
                <Badge
                  variant="secondary"
                  className={`bg-gradient-to-r ${postTypeColors[post.post_type as keyof typeof postTypeColors] || "from-gray-500 to-gray-600"} text-white border-0 text-xs px-2 py-0.5`}
                >
                  <PostTypeIcon className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{post.post_type}</span>
                </Badge>
              </div>
              {post.startup && (
                <Link href={`/dashboard/projects`}>
                  <p className="text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 mt-0.5">
                    <Rocket className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{post.startup.name}</span>
                  </p>
                </Link>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0 text-gray-500 hover:text-gray-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Reportar</DropdownMenuItem>
              <DropdownMenuItem>Ocultar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6">
        {post.title && (
          <h4 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800">{post.title}</h4>
        )}
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3 sm:mb-4 text-sm sm:text-base">
          {post.content}
        </p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`grid gap-2 mb-3 sm:mb-4 ${
            post.images.length === 1 ? "grid-cols-1" :
            post.images.length === 2 ? "grid-cols-2" :
            "grid-cols-2 sm:grid-cols-3"
          }`}>
            {post.images.slice(0, 4).map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt={`Post image ${idx + 1}`}
                className="w-full h-48 sm:h-64 object-cover rounded-lg border border-blue-200/60 hover:scale-[1.02] transition-transform cursor-pointer"
              />
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            {post.tags.map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs border-blue-200/60 text-gray-600 hover:bg-blue-50">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-blue-100/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleComments}
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold">{post.comments_count || 0}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
            onClick={() => onShare(post)}
          >
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Compartir</span>
          </Button>
        </div>

        {/* Comments Section */}
        {expandedComments && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-100/60 space-y-3 sm:space-y-4">
            {loadingComments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="space-y-2 sm:space-y-3">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-blue-50/50 border border-blue-100/60">
                      {comment.author?.avatar_url ? (
                        <img
                          src={comment.author.avatar_url}
                          alt={comment.author.full_name}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-blue-200/50 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-semibold border border-blue-200/50 flex-shrink-0">
                          {comment.author?.full_name?.[0]?.toUpperCase() || comment.author?.email?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="font-semibold text-xs sm:text-sm text-gray-800">
                            {comment.author?.full_name || comment.author?.email}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escribe un comentario..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 min-h-[70px] sm:min-h-[80px] resize-none text-sm border-blue-200/60 focus:border-blue-400 focus:ring-blue-200 bg-white/80"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        onComment(commentText);
                      }
                    }}
                  />
                  <Button
                    onClick={async () => {
                      await onComment(commentText);
                      // Refresh comments after posting
                      setTimeout(() => {
                        loadComments();
                      }, 500);
                    }}
                    disabled={isPostingComment || !commentText.trim()}
                    className="self-end bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-md"
                  >
                    {isPostingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

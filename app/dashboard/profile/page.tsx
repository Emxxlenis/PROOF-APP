"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Mail, 
  Save, 
  Edit2, 
  X, 
  Loader2, 
  CheckCircle2, 
  Calendar,
  Building2,
  GraduationCap,
  MapPin,
  Phone,
  Globe,
  Linkedin,
  Github,
  Twitter,
  AlertCircle,
  Sparkles,
  Rocket,
  Target,
  BookOpen
} from "lucide-react";
import { TutorialOverlay } from "@/components/ui/tutorial-overlay";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingState } from "@/components/ui/loading-state";

// Componente para mostrar estadísticas reales
function StatsCard({ userId }: { userId?: string }) {
  const [stats, setStats] = useState({ startups: 0, validations: 0 });
  const supabase = createClient();

  useEffect(() => {
    const loadStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Contar startups
      const { count: startupsCount } = await supabase
        .from("startups")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id);

      // Contar validaciones
      const { data: startups } = await supabase
        .from("startups")
        .select("id")
        .eq("student_id", user.id);

      if (startups && startups.length > 0) {
        const { count: validationsCount } = await supabase
          .from("validations")
          .select("*", { count: "exact", head: true })
          .in("startup_id", startups.map(s => s.id));

        setStats({
          startups: startupsCount || 0,
          validations: validationsCount || 0,
        });
      } else {
        setStats({
          startups: startupsCount || 0,
          validations: 0,
        });
      }
    };

    loadStats();
  }, [supabase]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <Card className="border-blue-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Startups creadas</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.startups}</p>
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
              <p className="text-xs sm:text-sm text-gray-500 truncate">Validaciones</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.validations}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-cyan-50 flex-shrink-0 ml-2">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
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

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    role: "student",
    bio: "",
    avatar_url: "",
    skills: [] as string[],
    university: "",
    major: "",
    location: "",
    phone: "",
    website: "",
    linkedin: "",
    github: "",
    twitter: "",
  });
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [originalProfile, setOriginalProfile] = useState(profile);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
        return;
      }

      // Obtener datos del usuario desde auth.users
      const { data: { user } } = await supabase.auth.getUser();
      
      // Obtener datos del perfil desde public.users
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError);
      }

      // Obtener metadata adicional del usuario (si está en user_metadata)
      const metadata = user?.user_metadata || {};

      setProfile({
        full_name: userProfile?.full_name || metadata.full_name || metadata.name || "",
        email: user?.email || "",
        role: userProfile?.role || "student",
        bio: userProfile?.public_bio || metadata.bio || "",
        avatar_url: userProfile?.avatar_url || "",
        skills: userProfile?.skills || [],
        university: metadata.university || "",
        major: metadata.major || "",
        location: metadata.location || "",
        phone: metadata.phone || "",
        website: metadata.website || "",
        linkedin: metadata.linkedin || "",
        github: metadata.github || "",
        twitter: metadata.twitter || "",
      });

      setOriginalProfile({
        full_name: userProfile?.full_name || metadata.full_name || metadata.name || "",
        email: user?.email || "",
        role: userProfile?.role || "student",
        bio: userProfile?.public_bio || metadata.bio || "",
        avatar_url: userProfile?.avatar_url || "",
        skills: userProfile?.skills || [],
        university: metadata.university || "",
        major: metadata.major || "",
        location: metadata.location || "",
        phone: metadata.phone || "",
        website: metadata.website || "",
        linkedin: metadata.linkedin || "",
        github: metadata.github || "",
        twitter: metadata.twitter || "",
      });
    } catch (error: any) {
      console.error("Error loading profile:", error);
      setError("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Debes iniciar sesión para guardar tu perfil");
        return;
      }

      // Verificar que el usuario existe en public.users
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!existingUser) {
        // Crear usuario si no existe
        const { error: createError } = await supabase
          .from("users")
          .insert({
            id: session.user.id,
            email: session.user.email || "",
            full_name: profile.full_name,
            role: "student",
          });

        if (createError) {
          console.error("Error creating user:", createError);
        }
      }

      // Actualizar perfil en public.users (campos que existen en la tabla)
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url || null,
          skills: profile.skills || [],
          public_bio: profile.bio || null,
        })
        .eq("id", session.user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        setError(updateError.message || "Error al guardar el perfil");
        return;
      }

      // Normalizar URLs antes de guardar
      const normalizedProfile = {
        full_name: profile.full_name,
        name: profile.full_name,
        bio: profile.bio,
        university: profile.university,
        major: profile.major,
        location: profile.location,
        phone: profile.phone,
        website: profile.website ? normalizeUrl(profile.website, 'website') : '',
        linkedin: profile.linkedin ? normalizeUrl(profile.linkedin, 'linkedin') : '',
        github: profile.github ? normalizeUrl(profile.github, 'github') : '',
        twitter: profile.twitter ? normalizeUrl(profile.twitter, 'twitter') : '',
      };

      // Actualizar metadata en auth.users con toda la información del perfil
      const { error: authError } = await supabase.auth.updateUser({
        data: normalizedProfile,
      });

      if (authError) {
        console.error("Error updating auth metadata:", authError);
      }

      setOriginalProfile(profile);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setError(error.message || "Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditing(false);
    setError(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WEBP)");
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. Máximo 5MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Debes iniciar sesión para subir un avatar");
        return;
      }

      // Crear FormData
      const formData = new FormData();
      formData.append("file", file);

      // Subir avatar
      const response = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al subir el avatar");
        return;
      }

      // Actualizar el estado del perfil con la nueva URL
      setProfile({ ...profile, avatar_url: data.url });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setError(error.message || "Error al subir el avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const profileTutorialSteps = [
    {
      id: "welcome",
      title: "¡Bienvenido a tu Perfil!",
      description: "Aquí puedes gestionar tu información personal y profesional. Completa tu perfil para que otros puedan conocerte mejor.",
      position: "center" as const,
    },
    {
      id: "edit",
      title: "Editar Perfil",
      description: "Haz clic en 'Editar Perfil' para actualizar tu información. Puedes agregar biografía, educación, ubicación y enlaces a tus redes sociales.",
      target: "[data-tutorial='edit-button']",
      position: "bottom" as const,
    },
    {
      id: "info",
      title: "Información del Perfil",
      description: "Completa todos los campos: nombre, biografía, universidad, carrera y ubicación. También puedes agregar enlaces a tus redes sociales.",
      target: "[data-tutorial='profile-info']",
      position: "top" as const,
    },
  ];

  if (loading) {
    return <LoadingState message="Cargando perfil..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <TutorialOverlay
          steps={profileTutorialSteps}
          storageKey="profile"
          title="Tutorial del Perfil"
          description="Aprende a gestionar tu información personal y profesional"
        />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="truncate">Mi Perfil</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Gestiona tu información personal y profesional
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <HelpTooltip
              content="Gestiona tu información personal y profesional. Completa tu perfil para que otros puedan conocerte mejor y para mejorar tu experiencia en la plataforma."
              variant="info"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem("tutorial_profile_completed");
                window.location.reload();
              }}
              className="text-xs sm:text-sm"
            >
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Tutorial</span>
            </Button>
            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md text-sm sm:text-base w-full sm:w-auto"
                data-tutorial="edit-button"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Editar Perfil</span>
                <span className="sm:hidden">Editar</span>
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm sm:text-base flex-1 sm:flex-initial"
                >
                  <X className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Cancelar</span>
                  <span className="sm:hidden">Cancelar</span>
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md text-sm sm:text-base flex-1 sm:flex-initial"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Guardando...</span>
                      <span className="sm:hidden">Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Guardar Cambios</span>
                      <span className="sm:hidden">Guardar</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="border-blue-100 bg-white rounded-xl shadow-sm">
            <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                <p className="font-medium text-green-800 text-xs sm:text-sm break-words flex-1">
                  Perfil actualizado exitosamente
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 rounded-xl shadow-sm">
            <CardContent className="py-2.5 sm:py-3 px-3 sm:px-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                <p className="font-medium text-red-800 text-xs sm:text-sm break-words flex-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6" data-tutorial="profile-info">
          {/* Profile Card - Left Column */}
          <div className="lg:col-span-1">
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className="relative">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || "Avatar"}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-lg border-2 border-blue-200"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg border-2 border-blue-200">
                        <User className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                      </div>
                    )}
                    {editing && (
                      <label className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-cyan-600 rounded-full border-2 border-white shadow-md cursor-pointer hover:bg-cyan-700 transition-colors">
                        {uploadingAvatar ? (
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white animate-spin" />
                        ) : (
                          <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                      </label>
                    )}
                  </div>
                  <div className="w-full">
                    {editing ? (
                      <Input
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="text-center text-base sm:text-xl font-bold border-2 border-blue-200 focus:border-blue-400 h-10 sm:h-12 text-xs sm:text-sm"
                        placeholder="Tu nombre"
                      />
                    ) : (
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                        {profile.full_name || "Usuario"}
                      </h2>
                    )}
                    <Badge className={`mt-2 text-xs ${
                      profile.role === "student" 
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                    }`}>
                      {profile.role === "student" ? "Estudiante" : profile.role}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 break-words truncate">{profile.email}</span>
                  </div>
                  {(profile.location || editing) && (
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      {editing ? (
                        <Input
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          placeholder="Ubicación"
                          className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                        />
                      ) : (
                        <span className="text-gray-800 break-words">{profile.location || "No especificada"}</span>
                      )}
                    </div>
                  )}
                  {(profile.phone || editing) && (
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      {editing ? (
                        <Input
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="Teléfono"
                          className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                        />
                      ) : (
                        <span className="text-gray-800 break-words">{profile.phone || "No especificado"}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(profile.website || profile.linkedin || profile.github || profile.twitter || editing) && (
                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-700">Redes Sociales</h3>
                    <div className="space-y-2">
                      {editing ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                            <Input
                              value={profile.website}
                              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                              placeholder="Sitio web"
                              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                            <Input
                              value={profile.linkedin}
                              onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                              placeholder="LinkedIn"
                              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                            <Input
                              value={profile.github}
                              onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                              placeholder="GitHub"
                              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                            <Input
                              value={profile.twitter}
                              onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                              placeholder="Twitter/X"
                              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {profile.website && (
                            <a
                              href={normalizeUrl(profile.website, 'website')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline break-words"
                            >
                              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{profile.website}</span>
                            </a>
                          )}
                          {profile.linkedin && (
                            <a
                              href={normalizeUrl(profile.linkedin, 'linkedin')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              LinkedIn
                            </a>
                          )}
                          {profile.github && (
                            <a
                              href={normalizeUrl(profile.github, 'github')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              GitHub
                            </a>
                          )}
                          {profile.twitter && (
                            <a
                              href={normalizeUrl(profile.twitter, 'twitter')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              Twitter/X
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Right Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Bio Section */}
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Sobre Mí
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Cuéntanos sobre ti y tus intereses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Escribe una breve descripción sobre ti..."
                      className="min-h-[120px] resize-none text-xs sm:text-sm"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 text-right">
                      {profile.bio.length}/500 caracteres
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed text-xs sm:text-sm break-words">
                    {profile.bio || "No has agregado una biografía aún. Haz clic en 'Editar Perfil' para agregar una."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Education Section */}
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Educación
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Información académica
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="university" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                    Universidad
                  </Label>
                  {editing ? (
                    <Input
                      id="university"
                      value={profile.university}
                      onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                      placeholder="Nombre de tu universidad"
                      className="h-10 sm:h-12 text-xs sm:text-sm"
                    />
                  ) : (
                    <p className="text-gray-800 text-xs sm:text-sm break-words">
                      {profile.university || "No especificada"}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="major" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                    Carrera / Programa
                  </Label>
                  {editing ? (
                    <Input
                      id="major"
                      value={profile.major}
                      onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                      placeholder="Tu carrera o programa de estudio"
                      className="h-10 sm:h-12 text-xs sm:text-sm"
                    />
                  ) : (
                    <p className="text-gray-800 text-xs sm:text-sm break-words">
                      {profile.major || "No especificada"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills Section */}
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Habilidades
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Selecciona tus habilidades y competencias
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {editing ? (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Lista de habilidades predefinidas */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold text-gray-700">
                        Habilidades disponibles:
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                        {[
                          "JavaScript",
                          "TypeScript",
                          "Python",
                          "Java",
                          "React",
                          "Next.js",
                          "Node.js",
                          "Vue.js",
                          "Angular",
                          "HTML/CSS",
                          "SQL",
                          "MongoDB",
                          "PostgreSQL",
                          "Firebase",
                          "AWS",
                          "Docker",
                          "Git",
                          "GraphQL",
                          "REST API",
                          "UI/UX Design",
                          "Figma",
                          "Adobe XD",
                          "Marketing Digital",
                          "SEO",
                          "Content Marketing",
                          "Social Media",
                          "Analytics",
                          "Project Management",
                          "Agile/Scrum",
                          "Leadership",
                          "Comunicación",
                          "Trabajo en Equipo",
                          "Resolución de Problemas",
                          "Pensamiento Crítico",
                          "Emprendimiento",
                          "Ventas",
                          "Finanzas",
                          "Contabilidad",
                          "Diseño Gráfico",
                          "Video Editing",
                          "Fotografía",
                          "Copywriting",
                          "Negociación",
                          "Networking",
                          "Mentoring",
                        ].map((skill) => {
                          const isSelected = profile.skills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setProfile({
                                    ...profile,
                                    skills: profile.skills.filter((s) => s !== skill),
                                  });
                                } else {
                                  setProfile({
                                    ...profile,
                                    skills: [...profile.skills, skill],
                                  });
                                }
                              }}
                              className={`px-3 py-2 text-xs sm:text-sm rounded-lg border transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Input para habilidades personalizadas */}
                    <div className="space-y-2">
                      <Label htmlFor="custom-skill-input" className="text-xs sm:text-sm font-semibold text-gray-700">
                        Agregar habilidad personalizada:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-skill-input"
                          placeholder="Escribe una habilidad y presiona Enter"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const skill = input.value.trim();
                              if (skill && !profile.skills.includes(skill)) {
                                setProfile({
                                  ...profile,
                                  skills: [...profile.skills, skill],
                                });
                                input.value = "";
                              }
                            }
                          }}
                          className="flex-1 h-10 sm:h-12 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Habilidades seleccionadas */}
                    {profile.skills.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-semibold text-gray-700">
                          Habilidades seleccionadas ({profile.skills.length}):
                        </Label>
                        <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-blue-50/50">
                          {profile.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              className="text-xs sm:text-sm px-2 sm:px-3 py-1 flex items-center gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    skills: profile.skills.filter((_, i) => i !== index),
                                  });
                                }}
                                className="ml-0.5 hover:text-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.length > 0 ? (
                      profile.skills.map((skill, index) => (
                        <Badge 
                          key={index} 
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm">
                        No has agregado habilidades aún. Haz clic en &quot;Editar Perfil&quot; para agregar.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="border-blue-100 bg-white rounded-2xl shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <StatsCard userId={profile.email ? undefined : ""} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

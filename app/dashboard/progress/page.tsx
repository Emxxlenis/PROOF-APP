"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";
import { 
  Trophy, 
  Award, 
  Target, 
  Rocket, 
  DollarSign, 
  TrendingUp,
  CheckCircle2,
  Clock,
  Star,
  Zap,
  Flame,
  Calendar,
  BarChart3,
  Activity,
  Loader2,
  Sparkles,
  Users,
  FileCheck,
  BookOpen,
  Crown,
  Shield,
  Gem,
  Medal,
  Gift,
  ArrowUp,
  TrendingDown
} from "lucide-react";
import { TutorialOverlay } from "@/components/ui/tutorial-overlay";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import type { Startup, ProgressLog, Achievement, MilestoneType } from "@/types/database";

// Cloudinary config
const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Sistema de etapas de startup
const STARTUP_STAGES = [
  { level: 1, name: "Validation", minPoints: 0, maxPoints: 100, icon: Shield, color: "from-gray-400 to-gray-500" },
  { level: 2, name: "MVP", minPoints: 100, maxPoints: 300, icon: Star, color: "from-blue-400 to-blue-600" },
  { level: 3, name: "First Users", minPoints: 300, maxPoints: 600, icon: Sparkles, color: "from-cyan-400 to-cyan-600" },
  { level: 4, name: "First Sale", minPoints: 600, maxPoints: 1000, icon: Zap, color: "from-purple-400 to-purple-600" },
  { level: 5, name: "Growth", minPoints: 1000, maxPoints: 1500, icon: Medal, color: "from-orange-400 to-orange-600" },
  { level: 6, name: "Scale", minPoints: 1500, maxPoints: 2200, icon: Award, color: "from-red-400 to-red-600" },
  { level: 7, name: "Expansion", minPoints: 2200, maxPoints: 3000, icon: Gem, color: "from-pink-400 to-pink-600" },
  { level: 8, name: "Market Leader", minPoints: 3000, maxPoints: 4000, icon: Trophy, color: "from-yellow-400 to-yellow-600" },
  { level: 9, name: "Established", minPoints: 4000, maxPoints: 5500, icon: Crown, color: "from-amber-400 to-amber-600" },
  { level: 10, name: "Enterprise", minPoints: 5500, maxPoints: 999999, icon: Crown, color: "from-yellow-300 to-orange-500" },
];

const STAGES = [
  { 
    id: "ideation", 
    name: "Ideación", 
    progress: 0,
    description: "Definiendo tu idea de negocio",
    color: "from-blue-500 to-cyan-500",
    icon: Sparkles
  },
  { 
    id: "validation", 
    name: "Validación", 
    progress: 20,
    description: "Validando tu idea con el mercado",
    color: "from-purple-500 to-pink-500",
    icon: Target
  },
  { 
    id: "mvp", 
    name: "MVP", 
    progress: 40,
    description: "Desarrollando tu producto mínimo viable",
    color: "from-orange-500 to-red-500",
    icon: Rocket
  },
  { 
    id: "first_sale", 
    name: "Primera Venta", 
    progress: 60,
    description: "Cerrando tu primera venta",
    color: "from-green-500 to-emerald-500",
    icon: DollarSign
  },
  { 
    id: "growth", 
    name: "Crecimiento", 
    progress: 80,
    description: "Escalando tu startup",
    color: "from-indigo-500 to-purple-500",
    icon: TrendingUp
  },
];

const MILESTONES = [
  { 
    id: "first_validation", 
    name: "Validation Milestone", 
    description: "Completaste tu primera validación de idea",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    points: 100
  },
  { 
    id: "mvp_launched", 
    name: "MVP Milestone", 
    description: "Lanzaste tu producto mínimo viable",
    icon: Rocket,
    color: "from-orange-500 to-red-500",
    points: 200
  },
  { 
    id: "first_user", 
    name: "First User Milestone", 
    description: "Conseguiste tu primer usuario",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    points: 150
  },
  { 
    id: "first_sale", 
    name: "First Sale Milestone", 
    description: "Cerraste tu primera venta",
    icon: DollarSign,
    color: "from-yellow-500 to-orange-500",
    points: 300
  },
  { 
    id: "1k_mrr", 
    name: "$1K MRR Milestone", 
    description: "Alcanzaste $1,000 en ingresos recurrentes mensuales",
    icon: Award,
    color: "from-purple-500 to-pink-500",
    points: 500
  },
  { 
    id: "streak_7", 
    name: "7 Weeks Active", 
    description: "Mantuviste actividad por 7 semanas consecutivas",
    icon: Flame,
    color: "from-red-500 to-orange-500",
    points: 75
  },
];

// Mensajes motivacionales según el nivel
const MOTIVATIONAL_MESSAGES = [
  "¡Estás comenzando tu viaje emprendedor! Cada paso cuenta.",
  "¡Vas por buen camino! Sigue validando tus ideas.",
  "¡Excelente progreso! Tu startup está tomando forma.",
  "¡Impresionante! Estás construyendo algo grande.",
  "¡Eres imparable! Tu dedicación está dando frutos.",
  "¡Nivel veterano alcanzado! Pocos llegan tan lejos.",
  "¡Experto en startups! Tu experiencia es invaluable.",
  "¡Maestro emprendedor! Inspiras a otros.",
  "¡Leyenda viviente! Tu historia será recordada.",
  "¡Titán del emprendimiento! Has alcanzado la cima.",
];

export default function ProgressPage() {
  // Imagen de Lola
  const lolaProgressUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-happy_i1mkbl`;

  const [startup, setStartup] = useState<Startup | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [okrs, setOkrs] = useState<any[]>([]);
  const [coachInteractions, setCoachInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalValidations: 0,
    avgViabilityScore: 0,
    completedOKRs: 0,
    totalOKRs: 0,
    daysActive: 0,
    totalPoints: 0,
    streakDays: 0,
    weeklyValidations: 0,
    weeklyOKRs: 0,
    weeklyCoachSessions: 0,
    previousWeekValidations: 0,
  });
  const supabase = createClient();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  const calculateStreakDays = (
    startup: Startup,
    validations: any[],
    okrs: any[],
    coachInteractions: any[]
  ): number => {
    if (!startup.created_at) return 0;

    // Obtener todas las fechas de actividad
    const activityDates = new Set<string>();
    
    // Fechas de validaciones
    validations.forEach(v => {
      if (v.created_at) {
        const date = new Date(v.created_at).toDateString();
        activityDates.add(date);
      }
    });

    // Fechas de OKRs (creación o actualización)
    okrs.forEach(okr => {
      const date = new Date(okr.updated_at || okr.created_at).toDateString();
      activityDates.add(date);
    });

    // Fechas de interacciones con coach
    coachInteractions.forEach(ci => {
      if (ci.created_at) {
        const date = new Date(ci.created_at).toDateString();
        activityDates.add(date);
      }
    });

    // Ordenar fechas
    const sortedDates = Array.from(activityDates)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length === 0) return 0;

    // Calcular consistencia desde hoy hacia atrás
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      const dateStr = checkDate.toDateString();
      if (activityDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateStats = useCallback((
    validations: any[], 
    okrsData: any[], 
    coachData: any[], 
    startupData: Startup, 
    achievementsData: Achievement[],
    landingPages: any[] = []
  ) => {
    const totalValidations = validations.length;
    const avgViabilityScore = totalValidations > 0
      ? validations.reduce((sum, v) => sum + (v.viability_score || 0), 0) / totalValidations
      : 0;

    const completedOKRs = okrsData.filter((okr: any) => 
      okr.kr1_status === 'completed' && 
      okr.kr2_status === 'completed' && 
      okr.kr3_status === 'completed'
    ).length;

    const daysActive = startupData.created_at
      ? Math.floor((new Date().getTime() - new Date(startupData.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calcular puntos totales de logros (sin duplicados)
    // Usar un Set para evitar contar logros duplicados del mismo tipo
    const uniqueAchievements = new Set<string>();
    const totalPoints = achievementsData.reduce((sum, a) => {
      // Si ya contamos este tipo de logro, no sumar puntos de nuevo
      if (uniqueAchievements.has(a.achievement_type)) {
        return sum;
      }
      uniqueAchievements.add(a.achievement_type);
      const achievement = MILESTONES.find(ach => ach.id === a.achievement_type);
      return sum + (achievement?.points || 0);
    }, 0);

    // Calcular consistencia (semanas activas) basada en actividad
    const streakDays = calculateStreakDays(startupData, validations, okrsData, coachData);

    // Calcular actividad semanal
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const weeklyValidations = validations.filter(v => 
      v.created_at && new Date(v.created_at) >= oneWeekAgo
    ).length;

    const previousWeekValidations = validations.filter(v => 
      v.created_at && new Date(v.created_at) >= twoWeeksAgo && new Date(v.created_at) < oneWeekAgo
    ).length;

    const weeklyOKRs = okrsData.filter(o => {
      const date = new Date(o.updated_at || o.created_at);
      return date >= oneWeekAgo;
    }).length;

    const weeklyCoachSessions = coachData.filter(c => 
      c.created_at && new Date(c.created_at) >= oneWeekAgo
    ).length;

    setStats({
      totalValidations,
      avgViabilityScore: Math.round(avgViabilityScore),
      completedOKRs,
      totalOKRs: okrsData.length,
      daysActive,
      totalPoints,
      streakDays,
      weeklyValidations,
      weeklyOKRs,
      weeklyCoachSessions,
      previousWeekValidations,
    });
  }, []);

  const checkAndUnlockAchievement = useCallback(async (achievementType: string, studentId: string) => {
    try {
      // Verificar si ya existe el milestone
      const { data: existing, error: checkError } = await supabase
        .from("achievements")
        .select("id")
        .eq("student_id", studentId)
        .eq("achievement_type", achievementType)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error checking achievement:", checkError);
        return false;
      }

      // Si ya existe, no hacer nada
      if (existing) {
        return false;
      }

      // Insertar el milestone (con manejo de error por si hay constraint único)
      const { error: insertError } = await supabase
        .from("achievements")
        .insert({
          student_id: studentId,
          achievement_type: achievementType,
        });

      if (insertError) {
        // Si el error es por duplicado (constraint único), ignorarlo
        if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
          return false;
        }
        console.error("Error inserting achievement:", insertError);
        return false;
      }

      return true; // Milestone alcanzado exitosamente
    } catch (error) {
      console.error("Unexpected error in checkAndUnlockAchievement:", error);
      return false;
    }
  }, [supabase]);

  const checkAllAchievements = useCallback(async (
    studentId: string,
    validations: any[],
    okrs: any[],
    startup: Startup,
    landingPages: any[],
    coachInteractions: any[]
  ) => {
    // 1. Primera Validación
    if (validations.length > 0) {
      await checkAndUnlockAchievement("first_validation", studentId);
    }

    // 2. MVP Lanzado - verificar si hay landing pages publicadas o si el stage es mvp o superior
    if (startup.stage === "mvp" || startup.stage === "first_sale" || startup.stage === "growth") {
      await checkAndUnlockAchievement("mvp_launched", studentId);
    }

    // 3. Primer Usuario - verificar si hay validaciones con usuarios o si hay landing pages con tráfico
    // Por ahora, si hay validaciones con viability_score > 70, asumimos que hay interés de usuarios
    const viableValidations = validations.filter(v => v.viability_score && v.viability_score >= 70);
    if (viableValidations.length > 0 || landingPages.length > 0) {
      await checkAndUnlockAchievement("first_user", studentId);
    }

    // 4. Primera Venta - verificar si el stage es first_sale o superior
    if (startup.stage === "first_sale" || startup.stage === "growth") {
      await checkAndUnlockAchievement("first_sale", studentId);
    }

    // 5. $1K MRR - esto requeriría datos financieros reales, por ahora lo dejamos para cuando se implemente
    // Se puede verificar si hay revenue en el startup o en validaciones

    // 6. 7 Weeks Active - calcular consistencia
    const streakDays = calculateStreakDays(startup, validations, okrs, coachInteractions);
    if (streakDays >= 7) {
      await checkAndUnlockAchievement("streak_7", studentId);
    }
  }, [checkAndUnlockAchievement]);

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // Usar selectedProjectId del hook o leer de localStorage como fallback
      const projectId = selectedProjectId || localStorage.getItem("selected_project_id");
      
      // Load startup - use selected project or fallback to first one
      let query = supabase
        .from("startups")
        .select("*");
      
      if (projectId) {
        query = query.eq("id", projectId);
      } else {
        query = query.eq("student_id", session.user.id);
      }
      
      const { data: startupData } = await query.maybeSingle();

      if (startupData) {
        setStartup(startupData);

        // Load validations
        const { data: validationsData } = await supabase
          .from("validations")
          .select("*")
          .eq("startup_id", startupData.id)
          .order("created_at", { ascending: false });

        if (validationsData) {
          setValidations(validationsData);
        }

        // Load OKRs
        const { data: okrsData } = await supabase
          .from("okrs")
          .select("*")
          .eq("startup_id", startupData.id)
          .order("created_at", { ascending: false });

        if (okrsData) {
          setOkrs(okrsData);
        }

        // Load coach interactions - filter by startup_id
        const { data: coachData } = await supabase
          .from("coach_interactions")
          .select("*")
          .eq("startup_id", startupData.id)
          .order("created_at", { ascending: false });

        if (coachData) {
          setCoachInteractions(coachData);
        }

        // Load landing pages
        const { data: landingPagesData } = await supabase
          .from("landing_pages")
          .select("*")
          .eq("startup_id", startupData.id)
          .order("created_at", { ascending: false });

        // Load progress logs
        const { data: logsData } = await supabase
          .from("progress_logs")
          .select("*")
          .eq("student_id", session.user.id)
          .order("milestone_date", { ascending: false });

        if (logsData) {
          setProgressLogs(logsData);
        }

        // Load achievements (sin duplicados - solo el más reciente de cada tipo)
        const { data: allAchievements } = await supabase
          .from("achievements")
          .select("*")
          .eq("student_id", session.user.id)
          .order("unlocked_at", { ascending: false });

        // Filtrar duplicados: mantener solo el más reciente de cada tipo
        const achievementsMap = new Map<string, Achievement>();
        if (allAchievements) {
          allAchievements.forEach((ach: Achievement) => {
            const existing = achievementsMap.get(ach.achievement_type);
            if (!existing || new Date(ach.unlocked_at) > new Date(existing.unlocked_at)) {
              achievementsMap.set(ach.achievement_type, ach);
            }
          });
        }
        const achievementsData = Array.from(achievementsMap.values());

        if (achievementsData) {
          setAchievements(achievementsData);
        }

        // Verificar y desbloquear logros basados en datos reales
        await checkAllAchievements(
          session.user.id,
          validationsData || [],
          okrsData || [],
          startupData,
          landingPagesData || [],
          coachData || []
        );

        // Recargar achievements después de verificar (sin duplicados)
        const { data: allUpdatedAchievements } = await supabase
          .from("achievements")
          .select("*")
          .eq("student_id", session.user.id)
          .order("unlocked_at", { ascending: false });

        // Filtrar duplicados: mantener solo el más reciente de cada tipo
        const updatedAchievementsMap = new Map<string, Achievement>();
        if (allUpdatedAchievements) {
          allUpdatedAchievements.forEach((ach: Achievement) => {
            const existing = updatedAchievementsMap.get(ach.achievement_type);
            if (!existing || new Date(ach.unlocked_at) > new Date(existing.unlocked_at)) {
              updatedAchievementsMap.set(ach.achievement_type, ach);
            }
          });
        }
        const updatedAchievements = Array.from(updatedAchievementsMap.values());

        if (updatedAchievements) {
          setAchievements(updatedAchievements);
        }

        // Calculate stats
        calculateStats(
          validationsData || [], 
          okrsData || [], 
          coachData || [], 
          startupData, 
          updatedAchievements || achievementsData || [],
          landingPagesData || []
        );
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, calculateStats, checkAllAchievements, selectedProjectId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress, selectedProjectId]);
  
  // También escuchar cambios en localStorage como respaldo
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected_project_id') {
        loadProgress();
      }
    };

    const handleCustomStorageChange = () => {
      loadProgress();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('project-selected', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('project-selected', handleCustomStorageChange);
    };
  }, [loadProgress]);

  const getCurrentStageIndex = () => {
    if (!startup) return 0;
    return STAGES.findIndex((s) => s.id === startup.stage);
  };

  const getOverallProgress = () => {
    const currentIndex = getCurrentStageIndex();
    if (currentIndex === -1) return 0;
    return STAGES[currentIndex].progress;
  };

  const hasAchievement = (achievementId: string) => {
    return achievements.some((a) => a.achievement_type === achievementId);
  };

  const getAchievementDate = (achievementId: string) => {
    const achievement = achievements.find((a) => a.achievement_type === achievementId);
    return achievement ? new Date(achievement.unlocked_at).toLocaleDateString("es-CO") : null;
  };

  // Funciones de etapa de startup
  const getCurrentStage = () => {
    return STARTUP_STAGES.find(l => stats.totalPoints >= l.minPoints && stats.totalPoints < l.maxPoints) || STARTUP_STAGES[0];
  };

  const getTractionProgress = () => {
    const stage = getCurrentStage();
    const pointsInStage = stats.totalPoints - stage.minPoints;
    const pointsNeeded = stage.maxPoints - stage.minPoints;
    return Math.min((pointsInStage / pointsNeeded) * 100, 100);
  };

  const getPointsToNextStage = () => {
    const stage = getCurrentStage();
    return stage.maxPoints - stats.totalPoints;
  };

  if (loading) {
    return <LoadingState message="Cargando tu progreso..." />;
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mi Progreso
            </h1>
            <p className="text-gray-600 mt-1">
              Visualiza tu camino hacia el éxito
            </p>
          </div>
          <Card className="border-2 border-dashed border-purple-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-6">
                <div className="relative w-32 h-32 mx-auto">
                  <Image 
                    src={lolaProgressUrl} 
                    alt="Lola" 
                    width={128}
                    height={128}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">¡Comienza tu aventura!</h3>
                  <p className="text-gray-600 mb-4">
                    Registra tu startup para comenzar a ganar Execution Points y alcanzar milestones
                  </p>
                  <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    <a href="/vitavalidator">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Validar mi idea
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentStage = getCurrentStage();
  const StageIcon = currentStage.icon;

  const progressTutorialSteps = [
    {
      id: "welcome",
      title: "Bienvenido a Mi Progreso",
      description: "Aquí puedes ver todo tu progreso: Startup Stage, Traction Score, milestones alcanzados, etapas completadas y tu actividad semanal.",
      position: "center" as const,
    },
    {
      id: "level",
      title: "Startup Stages",
      description: "Gana Execution Points completando milestones y avanza de etapa. Cada etapa representa un hito en el crecimiento de tu startup.",
      target: "[data-tutorial='level-card']",
      position: "bottom" as const,
    },
    {
      id: "weekly",
      title: "Resumen Semanal",
      description: "Ve tu actividad de los últimos 7 días: validaciones, OKRs y sesiones con el coach.",
      target: "[data-tutorial='weekly-summary']",
      position: "bottom" as const,
    },
    {
      id: "achievements",
      title: "Milestones Alcanzados",
      description: "Aquí verás todos los milestones que has alcanzado. Los milestones dorados son los que ya tienes.",
      target: "[data-tutorial='achievements']",
      position: "top" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <TutorialOverlay
        steps={progressTutorialSteps}
        storageKey="progress"
        title="Tutorial de Progreso"
        description="Aprende a ver y entender tu progreso en la plataforma"
      />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con nivel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mi Progreso
              </h1>
              <HelpTooltip
                content="Visualiza tu progreso completo: nivel, XP, logros y actividad. El sistema rastrea automáticamente tu avance."
                variant="info"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                onClick={() => {
                  localStorage.removeItem("tutorial_progress_completed");
                  window.location.reload();
                }}
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Tutorial
              </Button>
            </div>
            <p className="text-gray-600">
              {startup.name} • Startup Stage {currentStage.level}: {currentStage.name}
            </p>
          </div>
          
          {/* Badge de etapa */}
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-purple-100 shadow-lg">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${currentStage.color}`}>
              <StageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Stage {currentStage.level}</p>
              <p className="text-xs text-gray-500">{stats.totalPoints} Execution Points</p>
            </div>
            {stats.streakDays > 0 && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <Flame className="h-3 w-3" />
                {stats.streakDays} weeks
              </div>
            )}
          </div>
        </div>

        {/* Hero Card con Lola */}
        <Card className="border border-purple-200/50 bg-gradient-to-br from-indigo-500/85 via-purple-400/80 to-pink-400/75 text-white overflow-hidden shadow-lg" data-tutorial="level-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Imagen de Lola */}
              <div className="flex justify-center md:justify-start md:pl-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-3xl transform scale-125" />
                  <Image 
                    src={lolaProgressUrl} 
                    alt="Lola celebrando" 
                    width={208}
                    height={208}
                    className="relative w-32 h-32 md:w-52 md:h-52 object-contain drop-shadow-xl"
                    unoptimized
                  />
                </div>
              </div>

              {/* Info de etapa y mensaje */}
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <StageIcon className="h-6 w-6" />
                  <span className="text-2xl font-bold">{currentStage.name}</span>
                </div>
                <p className="text-white/90 text-sm mb-4">
                  {MOTIVATIONAL_MESSAGES[currentStage.level - 1]}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/90">
                    <span>Stage {currentStage.level}</span>
                    <span>Stage {Math.min(currentStage.level + 1, 10)}</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden border border-white/30">
                    <div 
                      className="h-full bg-gradient-to-r from-white/90 to-white rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${getTractionProgress()}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/90">
                    {getPointsToNextStage()} Execution Points para el siguiente stage
                  </p>
                </div>
              </div>

              {/* Stats principales */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                  <Star className="h-5 w-5 mx-auto mb-1 text-yellow-200" />
                  <p className="text-2xl font-bold">{stats.totalPoints}</p>
                  <p className="text-xs text-white/90">Traction Score</p>
                </div>
                <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                  <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-200" />
                  <p className="text-2xl font-bold">{achievements.length}</p>
                  <p className="text-xs text-white/90">Milestones</p>
                </div>
                <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                  <Target className="h-5 w-5 mx-auto mb-1 text-cyan-200" />
                  <p className="text-2xl font-bold">{stats.totalValidations}</p>
                  <p className="text-xs text-white/90">Validaciones</p>
                </div>
                <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-orange-200" />
                  <p className="text-2xl font-bold">{stats.streakDays}</p>
                  <p className="text-xs text-white/90">Weeks Active</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen Semanal */}
        <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg" data-tutorial="weekly-summary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
              <Calendar className="h-5 w-5 text-purple-600" />
              Resumen Semanal
            </CardTitle>
            <CardDescription>Tu actividad de los últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Validaciones */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  {stats.weeklyValidations > stats.previousWeekValidations ? (
                    <div className="flex items-center text-green-600 text-xs">
                      <ArrowUp className="h-3 w-3" />
                      <span>{stats.weeklyValidations - stats.previousWeekValidations}</span>
                    </div>
                  ) : stats.weeklyValidations < stats.previousWeekValidations ? (
                    <div className="flex items-center text-red-500 text-xs">
                      <TrendingDown className="h-3 w-3" />
                      <span>{stats.previousWeekValidations - stats.weeklyValidations}</span>
                    </div>
                  ) : null}
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.weeklyValidations}</p>
                <p className="text-xs text-gray-500">Validaciones</p>
              </div>

              {/* OKRs actualizados */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.weeklyOKRs}</p>
                <p className="text-xs text-gray-500">OKRs Actualizados</p>
              </div>

              {/* Sesiones de Coach */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.weeklyCoachSessions}</p>
                <p className="text-xs text-gray-500">Sesiones Coach</p>
              </div>

              {/* Consistency */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  {stats.streakDays >= 7 && (
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs border-0">
                      MAX
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.streakDays}</p>
                <p className="text-xs text-gray-500">Weeks Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Etapas de Startup */}
        <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
              <Crown className="h-5 w-5 text-yellow-500" />
              Startup Stages
            </CardTitle>
            <CardDescription>Avanza de etapa ganando Execution Points con milestones y actividades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {STARTUP_STAGES.slice(0, 10).map((level) => {
                const Icon = level.icon;
                const isUnlocked = stats.totalPoints >= level.minPoints;
                const isCurrent = level.level === currentStage.level;
                
                return (
                  <div
                    key={level.level}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                      isCurrent 
                        ? `bg-gradient-to-r ${level.color} text-white border-transparent shadow-lg scale-105`
                        : isUnlocked 
                          ? "bg-gray-100 border-gray-200 text-gray-700"
                          : "bg-gray-50 border-gray-100 text-gray-400 opacity-60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isCurrent ? "" : isUnlocked ? "text-gray-600" : "text-gray-400"}`} />
                    <span className="text-sm font-medium">Lv.{level.level}</span>
                    {isCurrent && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-current" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg" data-tutorial="achievements">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Milestones
                </CardTitle>
                <CardDescription className="mt-1">
                  {achievements.length} de {MILESTONES.length} milestones alcanzados
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3">
                {Math.round((achievements.length / MILESTONES.length) * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MILESTONES.map((achievement) => {
                const Icon = achievement.icon;
                const unlocked = hasAchievement(achievement.id);
                const unlockedDate = getAchievementDate(achievement.id);
                
                return (
                  <div
                    key={achievement.id}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
                      unlocked
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-transparent shadow-lg hover:shadow-xl hover:scale-[1.02]"
                        : "bg-gray-100 border-gray-200 opacity-60 hover:opacity-80"
                    }`}
                  >
                    {/* Efecto de brillo para logros desbloqueados */}
                    {unlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl animate-shimmer" />
                    )}
                    
                    {unlocked && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-white drop-shadow-md" />
                      </div>
                    )}
                    
                    <div className="relative flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl flex-shrink-0 ${
                          unlocked
                            ? "bg-white/25 backdrop-blur-sm"
                            : "bg-gray-200"
                        }`}
                      >
                        <Icon
                          className={`h-7 w-7 ${
                            unlocked ? "text-white" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-bold text-base ${
                            unlocked ? "text-white" : "text-gray-600"
                          }`}
                        >
                          {achievement.name}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${
                            unlocked ? "text-white/90" : "text-gray-500"
                          }`}
                        >
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={`${
                              unlocked
                                ? "bg-white/25 text-white border-white/30"
                                : "bg-gray-200 text-gray-500 border-gray-300"
                            }`}
                          >
                            +{achievement.points} Execution Points
                          </Badge>
                          {unlocked && unlockedDate && (
                            <span className="text-xs text-white/70 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {unlockedDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Etapas */}
        <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg" data-tutorial="stages">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                  <Rocket className="h-5 w-5 text-orange-500" />
                  Tu Camino de Startup
                </CardTitle>
                <CardDescription className="mt-1">
                  Etapa actual: <span className="font-semibold text-purple-600">{currentStage.name}</span>
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-3 py-1 text-sm">
                {getOverallProgress()}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Vista móvil - vertical */}
            <div className="md:hidden space-y-3">
              {STAGES.map((stage, idx) => {
                const StageIcon = stage.icon;
                const isActive = idx <= getCurrentStageIndex();
                const isCurrent = idx === getCurrentStageIndex();
                
                return (
                  <div 
                    key={stage.id} 
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      isCurrent 
                        ? "bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-md" 
                        : isActive 
                          ? "bg-gray-50 border border-gray-100" 
                          : "opacity-50"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCurrent
                          ? `bg-gradient-to-br ${stage.color} shadow-lg ring-2 ring-purple-200`
                          : isActive
                            ? `bg-gradient-to-br ${stage.color} shadow-md`
                            : "bg-gray-200"
                      }`}
                    >
                      <StageIcon
                        className={`h-5 w-5 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-semibold ${
                            isActive ? "text-gray-800" : "text-gray-400"
                          }`}
                        >
                          {stage.name}
                        </p>
                        {isCurrent && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs border-0">
                            Actual
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
                    </div>
                    <div className={`text-sm font-bold ${isActive ? "text-purple-600" : "text-gray-300"}`}>
                      {stage.progress}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista desktop - horizontal */}
            <div className="hidden md:block relative pt-4">
              {/* Línea de conexión */}
              <div className="absolute top-[3.5rem] left-0 right-0 h-1 bg-gray-200 rounded-full mx-8" />
              <div 
                className="absolute top-[3.5rem] left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-8 transition-all duration-500"
                style={{ width: `calc(${getOverallProgress()}% - 4rem)` }}
              />
              
              <div className="relative flex justify-between">
                {STAGES.map((stage, idx) => {
                  const StageIcon = stage.icon;
                  const isActive = idx <= getCurrentStageIndex();
                  const isCurrent = idx === getCurrentStageIndex();
                  
                  return (
                    <div key={stage.id} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 ${
                          isCurrent
                            ? `bg-gradient-to-br ${stage.color} border-white shadow-lg scale-110 ring-4 ring-purple-200`
                            : isActive
                              ? `bg-gradient-to-br ${stage.color} border-white shadow-md`
                              : "bg-gray-100 border-gray-200"
                        }`}
                      >
                        <StageIcon
                          className={`h-6 w-6 ${
                            isActive ? "text-white" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <p
                          className={`text-sm font-semibold ${
                            isActive ? "text-gray-800" : "text-gray-400"
                          }`}
                        >
                          {stage.name}
                        </p>
                        {isCurrent && (
                          <Badge className="mt-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs border-0">
                            Actual
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial Reciente */}
        <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Tus últimos milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {progressLogs.length === 0 && achievements.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-800">Sin actividad reciente</h3>
                  <p className="text-gray-500 text-sm">
                    Completa acciones para ver tu historial aquí
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[...achievements.map(a => ({
                  type: 'achievement' as const,
                  id: a.id,
                  date: a.unlocked_at,
                  data: a,
                })), ...progressLogs.map(l => ({
                  type: 'milestone' as const,
                  id: l.id,
                  date: l.milestone_date,
                  data: l,
                }))].sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                ).slice(0, 5).map((item) => {
                  if (item.type === 'achievement') {
                    const achievement = MILESTONES.find(
                      (a) => a.id === item.data.achievement_type
                    );
                    const Icon = achievement?.icon || Trophy;
                    
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:shadow-md transition-all"
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white flex-shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800 truncate">{achievement?.name || "Milestone"}</h3>
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs border-0">
                              +{achievement?.points} Execution Points
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.date).toLocaleDateString("es-CO", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    const log = item.data as ProgressLog;
                    const achievement = MILESTONES.find(
                      (a) => a.id === log.milestone_type
                    );
                    const Icon = achievement?.icon || Gift;
                    
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all"
                      >
                        <div className="p-2 rounded-lg bg-gray-200 flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {achievement?.name || log.milestone_type}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.milestone_date).toLocaleDateString("es-CO", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CSS para animación de brillo */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

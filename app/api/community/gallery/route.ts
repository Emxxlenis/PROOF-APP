import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Try to get user (optional for gallery - public access)
    let currentUserId: string | undefined;
    let supabaseClient;
    
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        } as any, // Type assertion for @supabase/ssr compatibility
        }
      );
      
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
      supabaseClient = supabase;
    } catch {
      // If auth fails, continue with anonymous access
      const { createClient } = await import("@supabase/supabase-js");
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }

    // Get startups that the user can view:
    // - Their own projects (regardless of visibility)
    // - Public projects from others
    // Note: RLS policy "Users can view own or public projects" will filter automatically
    // We don't filter by visibility here - RLS handles it
    let query = supabaseClient
      .from("startups")
      .select("*")
      .not("student_id", "is", null)
      .limit(limit * 3); // Get more to account for filtering

    if (stage && stage !== "all") {
      query = query.eq("stage", stage);
      logger.debug("Filtering by stage", { stage });
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
      logger.debug("Filtering by category", { category });
    }

    const { data: startups, error } = await query;

    if (error) {
      logger.error("Error fetching startups", error as Error, { currentUserId });
      throw new Error(`Error fetching startups: ${error.message}. Verifica que las políticas RLS permitan ver startups públicas y propias.`);
    }

    logger.debug("Startups fetched", {
      userId: currentUserId || "no autenticado",
      total: startups?.length || 0,
    });

    // Filter projects: only public projects (no privados en galería)
    let filteredStartups = startups || [];
    const beforeFilter = filteredStartups.length;
    filteredStartups = filteredStartups.filter((startup: any) => startup.visibility === 'public');
    logger.debug("Filtered startups", { before: beforeFilter, after: filteredStartups.length });

    // Apply limit after filtering
    filteredStartups = filteredStartups.slice(0, limit);

    if (filteredStartups.length === 0) {
      return NextResponse.json({
        projects: [],
        message: currentUserId 
          ? "No se encontraron startups. Crea una startup o hazla pública para que aparezca en la galería."
          : "No se encontraron startups públicas. Inicia sesión para ver tus propias startups también."
      });
    }

    // Get student data for each startup
    // Filter out null, undefined, and invalid UUIDs
    const studentIds = [...new Set(
      filteredStartups
        .map((s: any) => s.student_id)
        .filter((id: any): id is string => {
          return Boolean(id) && 
                 id !== 'undefined' && 
                 id !== 'null' && 
                 typeof id === 'string' &&
                 id.length > 0 &&
                 Boolean(id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)); // UUID format
        })
    )];
    
    logger.debug("Fetching student data", { studentIdsCount: studentIds.length });
    
    let students: any[] = [];
    let studentsError: any = null;

    if (studentIds.length > 0) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (serviceRoleKey) {
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );

        const { data, error } = await adminClient
          .from("users")
          .select("id, full_name, avatar_url, email")
          .in("id", studentIds);

        students = data || [];
        studentsError = error;
      } else {
        const { data, error } = await supabaseClient
          .from("users")
          .select("id, full_name, avatar_url, email")
          .in("id", studentIds);

        students = data || [];
        studentsError = error;
      }
    }

    if (studentsError) {
      logger.warn("Error fetching students", { error: studentsError.message, studentIdsCount: studentIds.length });
    }
    
    logger.debug("Students fetched", {
      found: students?.length || 0,
      requested: studentIds.length,
    });

    // Get showcase posts for each startup
    const startupIds = filteredStartups.map((s: any) => s.id);
    const { data: showcasePosts } = startupIds.length > 0
      ? await supabaseClient
          .from("community_posts")
          .select("id, startup_id, title, content, images, created_at")
          .eq("post_type", "showcase")
          .eq("status", "published")
          .in("startup_id", startupIds)
      : { data: [] };

    // Create lookup maps
    const studentsMap = new Map(students?.map((s: any) => [s.id, s]) || []);
    const postsByStartup = new Map<string, any[]>();
    
    showcasePosts?.forEach((post: any) => {
      if (post.startup_id) {
        if (!postsByStartup.has(post.startup_id)) {
          postsByStartup.set(post.startup_id, []);
        }
        postsByStartup.get(post.startup_id)!.push(post);
      }
    });

    // Enrich startups with student and showcase posts data
    const enrichedProjects = filteredStartups.map((startup: any) => {
      const student = startup.student_id ? studentsMap.get(startup.student_id) : null;
      
      // Log if student is missing
      if (startup.student_id && !student) {
        logger.warn("Student not found for startup", { startupId: startup.id, studentId: startup.student_id });
      }
      
      return {
        ...startup,
        student: student || null,
        showcase_posts: postsByStartup.get(startup.id) || [],
        isOwnProject: currentUserId ? startup.student_id === currentUserId : false,
      };
    });

    return NextResponse.json({
      projects: enrichedProjects,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/community/gallery');
  }
}

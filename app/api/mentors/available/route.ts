import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let user: any = null;
    let supabaseClient = supabase;

    if (token) {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const supabaseWithToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user: userFromToken } } = await supabaseWithToken.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
        supabaseClient = supabaseWithToken;
      }
    }

    if (!user) {
      const { data: { user: userFromCookies } } = await supabase.auth.getUser();
      user = userFromCookies;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    // Get all mentors using service role key to bypass RLS
    let mentors: any[] = [];
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      
      // Use service role key to bypass RLS for public mentor info
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
        
        const { data: mentorsData, error: mentorsError } = await adminClient
          .from("users")
          .select("id, email, full_name, avatar_url, public_bio, skills, created_at")
          .eq("role", "mentor")
          .order("created_at", { ascending: false });
        
        if (!mentorsError && mentorsData) {
          mentors = mentorsData;
        } else if (mentorsError) {
          console.error("Error fetching mentors with service role:", mentorsError);
        }
      }
      
      // Fallback: try with regular client (may fail due to RLS)
      if (mentors.length === 0) {
        const { data: mentorsData } = await supabaseClient
          .from("users")
          .select("id, email, full_name, avatar_url, public_bio, skills, created_at")
          .eq("role", "mentor")
          .order("created_at", { ascending: false });
        
        if (mentorsData) {
          mentors = mentorsData;
        }
      }
    } catch (error) {
      console.error("Error fetching mentors:", error);
    }

    // Get user's current mentor assignments and sessions
    const { data: assignments } = await supabaseClient
      .from("mentor_assignments")
      .select("mentor_id, status")
      .eq("student_id", user.id)
      .eq("status", "active");

    const { data: sessions } = await supabaseClient
      .from("mentor_sessions")
      .select("mentor_id, status, scheduled_at")
      .eq("student_id", user.id)
      .in("status", ["scheduled", "in_progress"]);

    // Enrich mentors with assignment and session info
    const assignedMentorIds = new Set(assignments?.map((a: any) => a.mentor_id) || []);
    const upcomingSessionsByMentor = new Map(
      sessions?.map((s: any) => [s.mentor_id, s]) || []
    );

    const enrichedMentors = mentors.map((mentor: any) => ({
      ...mentor,
      isAssigned: assignedMentorIds.has(mentor.id),
      upcomingSession: upcomingSessionsByMentor.get(mentor.id) || null,
    }));

    return NextResponse.json({
      mentors: enrichedMentors || [],
    });
  } catch (error: any) {
    console.error("Error getting available mentors:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener mentores disponibles" },
      { status: 500 }
    );
  }
}








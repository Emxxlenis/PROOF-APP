import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      return NextResponse.json(
        { error: "ID de startup inválido" },
        { status: 400 }
      );
    }

    // Try to get user from cookies first
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

    // Try to get user from cookies
    let user: any = null;
    let supabaseClient = supabase;
    
    const { data: { user: userFromCookies } } = await supabase.auth.getUser();
    user = userFromCookies;
    
    // If no user from cookies, try from Authorization header
    if (!user) {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.replace("Bearer ", "");
      
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
    }

    // Get project - RLS will handle permissions
    const { data: project, error: projectError } = await supabaseClient
      .from("startups")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Error fetching project:", projectError);
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: "Startup no encontrada" },
        { status: 404 }
      );
    }

    // Verify user can view this project
    const canView = user?.id === project.student_id || project.visibility === 'public';
    
    if (!canView) {
      return NextResponse.json(
        { error: "No tienes permisos para ver esta startup" },
        { status: 403 }
      );
    }

    // Get creator information
    // Use service role key to bypass RLS for public user info
    // This is safe because we're only selecting public fields
    let creator = null;
    if (project.student_id) {
      try {
        const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
        
        // Try service role key first (bypasses RLS)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceRoleKey) {
          const adminClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
          );
          
          const { data: creatorData, error: creatorError } = await adminClient
            .from("users")
            .select("id, full_name, email, avatar_url, public_bio, skills, role")
            .eq("id", project.student_id)
            .maybeSingle();

          if (!creatorError && creatorData) {
            creator = creatorData;
          } else if (creatorError) {
            console.error("Error fetching creator with service role:", creatorError);
          }
        } else {
          // Fallback: try with anonymous client (may fail due to RLS)
          const anonymousClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          const { data: creatorData, error: creatorError } = await anonymousClient
            .from("users")
            .select("id, full_name, email, avatar_url, public_bio, skills, role")
            .eq("id", project.student_id)
            .maybeSingle();

          if (!creatorError && creatorData) {
            creator = creatorData;
          } else if (creatorError) {
            console.error("Error fetching creator with anonymous client:", creatorError);
          }
        }
      } catch (error) {
        console.error("Error in creator fetch:", error);
      }
    }

    // Get team members count
    const { count: teamMembersCount } = await supabaseClient
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("startup_id", projectId);

    return NextResponse.json({
      project,
      creator,
      teamMembersCount: teamMembersCount || 0,
    });
  } catch (error: any) {
    console.error("Error in project detail:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener startup" },
      { status: 500 }
    );
  }
}

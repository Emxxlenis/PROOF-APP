import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId || userId === 'undefined' || userId === 'null') {
      return NextResponse.json(
        { error: "ID de usuario inválido" },
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

    // Get profile user information
    // Use service role key to bypass RLS for public user info
    let profileUser = null;
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      
      // Try service role key first (bypasses RLS)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
        
        const { data: userData, error: userError } = await adminClient
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!userError && userData) {
          profileUser = userData;
        } else if (userError) {
          console.error("Error fetching user with service role:", userError);
          return NextResponse.json(
            { error: "Usuario no encontrado" },
            { status: 404 }
          );
        }
      } else {
        // Fallback: try with anonymous client (may fail due to RLS)
        const anonymousClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: userData, error: userError } = await anonymousClient
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!userError && userData) {
          profileUser = userData;
        } else if (userError) {
          console.error("Error fetching user with anonymous client:", userError);
          return NextResponse.json(
            { error: "Usuario no encontrado" },
            { status: 404 }
          );
        }
      }
    } catch (error) {
      console.error("Error in user fetch:", error);
      return NextResponse.json(
        { error: "Error al obtener usuario" },
        { status: 500 }
      );
    }

    if (!profileUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Get user metadata from auth.users (for social media links)
    let userMetadata: any = {};
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (serviceRoleKey) {
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
        
        // Get user from auth.users to access user_metadata
        const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
        if (authUser?.user?.user_metadata) {
          userMetadata = authUser.user.user_metadata;
        }
      }
    } catch (error) {
      console.error("Error fetching user metadata:", error);
      // Continue without metadata if there's an error
    }

    // Merge user data with metadata (social media links)
    const enrichedUser = {
      ...profileUser,
      website: userMetadata.website || null,
      linkedin: userMetadata.linkedin || null,
      github: userMetadata.github || null,
      twitter: userMetadata.twitter || null,
    };

    // Get user's startups
    // If viewing own profile, show all startups (private and public)
    // If viewing someone else's profile, only show public startups
    const isOwnProfile = user && user.id === userId;
    
    let startupsQuery = supabaseClient
      .from("startups")
      .select("*")
      .eq("student_id", userId);
    
    // Only show public startups if viewing someone else's profile
    if (!isOwnProfile) {
      startupsQuery = startupsQuery.eq("visibility", "public");
    }
    
    const { data: startups } = await startupsQuery.order("created_at", { ascending: false });

    // Get user's published posts
    const { data: posts } = await supabaseClient
      .from("community_posts")
      .select("*")
      .eq("author_id", userId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      user: enrichedUser,
      startups: startups || [],
      posts: posts || [],
    });
  } catch (error: any) {
    console.error("Error in profile fetch:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener perfil" },
      { status: 500 }
    );
  }
}








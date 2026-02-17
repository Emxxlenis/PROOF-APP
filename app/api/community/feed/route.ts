import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") || "recent";

    const { user, supabaseClient } = await authenticateRequest(request);

    // Build query - Fetch posts first, then enrich with author and startup data
    let query = supabaseClient
      .from("community_posts")
      .select("*")
      .eq("status", "published");

    // Filter by type
    if (type && type !== "all") {
      query = query.eq("post_type", type);
    }

    // Sort
    if (sort === "trending") {
      // Trending: combination of likes, comments, and recency
      query = query.order("likes_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Enrich posts with author and startup data
    if (posts && posts.length > 0) {
      const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))];
      const startupIds = [...new Set(posts.map((p: any) => p.startup_id).filter(Boolean))];

      // Fetch authors using service role key to bypass RLS for public user info
      let authors: any[] = [];
      if (authorIds.length > 0) {
        try {
          const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
          
          // Try service role key first (bypasses RLS)
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (serviceRoleKey) {
            const adminClient = createSupabaseClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              serviceRoleKey
            );
            
            const { data: authorsData, error: authorsError } = await adminClient
              .from("users")
              .select("id, email, full_name, avatar_url")
              .in("id", authorIds);
            
            if (!authorsError && authorsData) {
              authors = authorsData;
            } else if (authorsError) {
              console.error("Error fetching authors with service role:", authorsError);
            }
          }
          
          // Fallback: try with regular client (may fail due to RLS)
          if (authors.length === 0) {
            const { data: authorsData } = await supabaseClient
              .from("users")
              .select("id, email, full_name, avatar_url")
              .in("id", authorIds);
            
            if (authorsData) {
              authors = authorsData;
            }
          }
        } catch (error) {
          console.error("Error fetching authors:", error);
        }
      }

      // Fetch startups
      const { data: startups } = startupIds.length > 0
        ? await supabaseClient
            .from("startups")
            .select("id, name")
            .in("id", startupIds)
        : { data: [] };

      // Create lookup maps
      const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);
      const startupsMap = new Map(startups?.map((s: any) => [s.id, s]) || []);

      // Enrich posts
      const enrichedPosts = posts.map((post: any) => ({
        ...post,
        author: authorsMap.get(post.author_id) || null,
        startup: post.startup_id ? (startupsMap.get(post.startup_id) || null) : null,
      }));

      // Replace posts with enriched version
      posts.splice(0, posts.length, ...enrichedPosts);
    }

    // Get likes for current user
    const postIds = posts?.map((p: any) => p.id) || [];
    const { data: userLikes } = postIds.length > 0
      ? await supabaseClient
          .from("community_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds)
      : { data: [] };

    const likedPostIds = new Set(userLikes?.map((l: any) => l.post_id) || []);

    // Mark posts as liked
    const postsWithLikes = posts?.map((post: any) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));

    return NextResponse.json({
      posts: postsWithLikes || [],
      hasMore: (posts?.length || 0) === limit,
    });
  } catch (error: any) {
    return handleApiError(error, "GET /api/community/feed");
  }
}

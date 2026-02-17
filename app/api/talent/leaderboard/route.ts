import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");
    const region = searchParams.get("region");
    const limit = parseInt(searchParams.get("limit") || "10");

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

    // Build query
    let query = supabase
      .from("talent_scores")
      .select(`
        *,
        user:users!talent_scores_user_id_fkey (
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .order("score", { ascending: false })
      .limit(limit);

    // Apply filters if provided
    if (industry || region) {
      // Join with startups to filter by industry/region
      // For MVP, we'll filter after fetching
    }

    const { data: scores, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get user projects for additional context
    const userIds = scores?.map((s: any) => s.user_id) || [];
    const { data: projects } = userIds.length > 0
      ? await supabase
          .from("startups")
          .select("student_id, name, category")
          .in("student_id", userIds)
      : { data: [] };

    // Enrich scores with project data
    const enrichedScores = scores?.map((score: any) => {
      const userProjects = projects?.filter((p: any) => p.student_id === score.user_id) || [];
      return {
        ...score,
        user: {
          ...score.user,
          projects: userProjects,
        },
        rank: scores.indexOf(score) + 1,
      };
    });

    return NextResponse.json({
      leaderboard: enrichedScores || [],
      total: enrichedScores?.length || 0,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/talent/leaderboard');
  }
}



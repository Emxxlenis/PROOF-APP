import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");
    const leaderboardType = searchParams.get("type") || "global";

    const { supabaseClient } = await authenticateRequest(request);

    let query = supabaseClient
      .from("leaderboards")
      .select(`
        *,
        student:users!leaderboards_student_id_fkey (
          id,
          email,
          full_name
        ),
        startup:startups (
          id,
          name
        )
      `)
      .eq("leaderboard_type", leaderboardType)
      .order("rank", { ascending: true })
      .limit(100);

    if (challengeId) {
      query = query.eq("challenge_id", challengeId);
    }

    const { data: leaderboard, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ leaderboard: leaderboard || [] });
  } catch (error: any) {
    return handleApiError(error, "GET /api/challenges/leaderboard");
  }
}

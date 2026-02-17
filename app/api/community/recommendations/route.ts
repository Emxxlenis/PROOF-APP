import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/api-error-handler";

/**
 * GET /api/community/recommendations
 *
 * Returns a list of users suggested to follow. Excludes self and already-followed.
 * Selection and ranking logic are proprietary and not implemented in this repo.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    const { data: following } = await supabaseClient
      .from("community_follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const excludeIds = new Set(following?.map((f: { following_id: string }) => f.following_id) || []);
    excludeIds.add(user.id);

    let query = supabaseClient
      .from("users")
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        skills,
        role,
        public_bio,
        startup:startups!startups_student_id_fkey (
          id,
          name,
          description,
          stage
        )
      `)
      .neq("id", user.id)
      .limit(10);

    if (excludeIds.size > 0) {
      const arr = Array.from(excludeIds);
      query = query.not("id", "in", `(${arr.map((id) => `'${id}'`).join(",")})`);
    }

    const { data: recommendedUsers, error } = await query;

    if (error) {
      return NextResponse.json({
        users: (recommendedUsers || []).map((u: Record<string, unknown>) => ({ ...u, isFollowing: false })),
      });
    }

    const ids = recommendedUsers?.map((u: { id: string }) => u.id) || [];
    const { data: follows } =
      ids.length > 0
        ? await supabaseClient
            .from("community_follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .in("following_id", ids)
        : { data: [] };

    const followedSet = new Set(follows?.map((f: { following_id: string }) => f.following_id) || []);

    return NextResponse.json({
      users: (recommendedUsers || []).map((u: Record<string, unknown> & { id: string; startup?: unknown }) => ({
        ...u,
        isFollowing: followedSet.has(u.id),
        startup: Array.isArray(u.startup) ? u.startup[0] : u.startup,
      })),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/community/recommendations");
  }
}

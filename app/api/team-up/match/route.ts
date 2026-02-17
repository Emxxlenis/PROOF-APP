import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { computeCompatibility } from "@/lib/services/team-up-matching";
import { handleApiError } from "@/lib/api-error-handler";

/**
 * GET /api/team-up/match?profileId=...
 *
 * Returns compatible team-up profiles for the given profile, sorted by compatibility.
 * Requires authentication (cookie or Bearer token).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId es requerido" },
        { status: 400 }
      );
    }

    const { supabaseClient } = await authenticateRequest(request);

    const { data: profile } = await supabaseClient
      .from("team_up_profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    const { data: compatibleProfiles } = await supabaseClient
      .from("team_up_profiles")
      .select("*")
      .eq("active", true)
      .neq("user_id", profile.user_id)
      .limit(10);

    const matches = (compatibleProfiles || []).map((p: Record<string, unknown>) => {
      const { compatibilityScore, compatibilityLevel } = computeCompatibility(profile, p);
      return {
        ...p,
        compatibilityScore,
        compatibilityLevel,
      };
    }).sort(
      (a: { compatibilityScore: number }, b: { compatibilityScore: number }) =>
        b.compatibilityScore - a.compatibilityScore
    );

    return NextResponse.json({ matches });
  } catch (error) {
    return handleApiError(error, "GET /api/team-up/match");
  }
}

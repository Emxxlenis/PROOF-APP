import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const { challengeId, startupId } = await request.json();

    if (!challengeId) {
      throw ApiErrors.badRequest("challengeId es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    const { data: participation, error } = await supabaseClient
      .from("challenge_participations")
      .insert({
        challenge_id: challengeId,
        student_id: user.id,
        startup_id: startupId || null,
        status: "joined",
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, participation });
  } catch (error: any) {
    return handleApiError(error, "POST /api/challenges/join");
  }
}



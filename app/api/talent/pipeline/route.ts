import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      throw ApiErrors.badRequest("organizationId es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Get pipeline entries
    const { data: pipeline, error } = await supabaseClient
      .from("talent_pipeline")
      .select(`
        *,
        student:users!talent_pipeline_student_id_fkey (
          id,
          email,
          full_name
        ),
        startup:startups (
          id,
          name,
          description,
          stage
        ),
        talent_scores:talent_scores!talent_scores_student_id_startup_id_fkey (
          total_score,
          execution_score,
          engagement_score,
          traction_score
        )
      `)
      .eq("organization_id", organizationId)
      .order("score", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Group by stage
    const pipelineByStage = {
      screening: pipeline?.filter((p: any) => p.stage === "screening") || [],
      interview: pipeline?.filter((p: any) => p.stage === "interview") || [],
      accepted: pipeline?.filter((p: any) => p.stage === "accepted") || [],
      rejected: pipeline?.filter((p: any) => p.stage === "rejected") || [],
    };

    return NextResponse.json({
      pipeline: pipeline || [],
      byStage: pipelineByStage,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/talent/pipeline');
  }
}



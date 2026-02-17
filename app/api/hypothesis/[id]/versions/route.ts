import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError, validateUUID, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

// GET: Obtener historial de versiones de una hipótesis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const hypothesisId = resolvedParams.id;
    validateUUID(hypothesisId, 'hypothesisId');

    // Autenticación
    const { user, supabaseClient } = await authenticateRequest(request);

    // Verify access to hypothesis
    const { data: hypothesis, error: hypError } = await supabaseClient
      .from("hypotheses")
      .select("startup_id")
      .eq("id", hypothesisId)
      .single();

    if (hypError || !hypothesis) {
      throw ApiErrors.notFound('Hipótesis');
    }

    const hypothesisTyped = hypothesis as any;
    const { data: startup } = await supabaseClient
      .from("startups")
      .select("id, student_id")
      .eq("id", hypothesisTyped.startup_id)
      .single() as { data: any | null };

    if (!startup) {
      throw ApiErrors.notFound('Proyecto');
    }

    const isOwner = (startup as any).student_id === user.id;
    const { data: teamMember } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("startup_id", hypothesisTyped.startup_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isOwner && !teamMember) {
      throw ApiErrors.forbidden('No tienes acceso a esta hipótesis');
    }

    // Get current hypothesis
    const { data: currentHypothesis } = await supabaseClient
      .from("hypotheses")
      .select("*")
      .eq("id", hypothesisId)
      .single() as { data: any | null };

    // Get version history
    const { data: versions, error: versionsError } = await supabaseClient
      .from("hypothesis_versions")
      .select("*")
      .eq("hypothesis_id", hypothesisId)
      .order("version_number", { ascending: false });

    if (versionsError) {
      return NextResponse.json(
        { error: `Error al obtener versiones: ${versionsError.message}` },
        { status: 500 }
      );
    }

    // Include current version in the list
    const currentHypothesisTyped = currentHypothesis as any;
    const allVersions = currentHypothesisTyped
      ? [
          {
            ...currentHypothesisTyped,
            is_current: true,
            version_type: "current",
          },
          ...(versions || []).map((v: any) => ({
            ...v,
            is_current: false,
            version_type: "historical",
          })),
        ]
      : (versions || []).map((v: any) => ({
          ...v,
          is_current: false,
          version_type: "historical",
        }));

    return NextResponse.json({
      versions: allVersions,
      count: allVersions.length,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/hypothesis/[id]/versions');
  }
}



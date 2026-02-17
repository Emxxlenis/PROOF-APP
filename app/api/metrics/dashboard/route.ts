import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get("startupId");

    if (!startupId) {
      throw ApiErrors.badRequest("startupId es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    // Get startup
    const { data: startup, error: startupError } = await supabaseClient
      .from("startups")
      .select("*")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      throw ApiErrors.notFound('Startup');
    }

    const startupTyped = startup as { student_id?: string; total_users?: number; active_users?: number; mrr?: number };
    if (startupTyped.student_id !== user.id) {
      return NextResponse.json(
        { error: "Startup no encontrada" },
        { status: 404 }
      );
    }

    // Get all metrics
    const [
      { data: activationRate },
      { data: retention },
      { data: nps },
      { data: cacLtv },
      { data: seanEllis },
      { data: churn },
    ] = await Promise.all([
      supabaseClient
        .from("metrics")
        .select("*")
        .eq("startup_id", startupId)
        .eq("metric_type", "activation")
        .order("calculation_date", { ascending: false })
        .limit(1),
      supabaseClient
        .from("retention_cohorts")
        .select("*")
        .eq("startup_id", startupId)
        .order("cohort_date", { ascending: false })
        .limit(10),
      supabaseClient
        .from("nps_surveys")
        .select("*")
        .eq("startup_id", startupId)
        .order("survey_date", { ascending: false })
        .limit(100),
      supabaseClient
        .from("financial_metrics")
        .select("*")
        .eq("startup_id", startupId)
        .order("metric_date", { ascending: false })
        .limit(1),
      supabaseClient
        .from("sean_ellis_tests")
        .select("*")
        .eq("startup_id", startupId),
      supabaseClient
        .from("metrics")
        .select("*")
        .eq("startup_id", startupId)
        .eq("metric_type", "churn")
        .order("calculation_date", { ascending: false })
        .limit(1),
    ]);

    // Calculate aggregated metrics
    const dashboard = {
      activationRate: activationRate?.[0]?.metric_value || 0,
      retention: {
        D7: retention?.find((r: any) => r.retention_period === "D7")?.retention_rate || 0,
        D30: retention?.find((r: any) => r.retention_period === "D30")?.retention_rate || 0,
        D90: retention?.find((r: any) => r.retention_period === "D90")?.retention_rate || 0,
      },
      nps: calculateNPS(nps || []),
      cacLtv: {
        cac: cacLtv?.[0]?.cac || 0,
        ltv: cacLtv?.[0]?.ltv || 0,
        ratio: cacLtv?.[0]?.cac_ltv_ratio || 0,
      },
      seanEllis: {
        total: seanEllis?.length || 0,
        passed: seanEllis?.filter((t: any) => t.passed_threshold).length || 0,
        passRate: seanEllis && seanEllis.length > 0
          ? (seanEllis.filter((t: any) => t.passed_threshold).length / seanEllis.length) * 100
          : 0,
      },
      churn: churn?.[0]?.metric_value || 0,
      startup: {
        totalUsers: startupTyped.total_users || 0,
        activeUsers: startupTyped.active_users || 0,
        mrr: startupTyped.mrr || 0,
      },
    };

    return NextResponse.json({ dashboard });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/metrics/dashboard');
  }
}

function calculateNPS(surveys: any[]): number {
  if (surveys.length === 0) return 0;

  const promoters = surveys.filter((s: any) => s.category === "promoter").length;
  const detractors = surveys.filter((s: any) => s.category === "detractor").length;
  const total = surveys.length;

  return Math.round(((promoters - detractors) / total) * 100);
}



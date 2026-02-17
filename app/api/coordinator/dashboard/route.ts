import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    // Check if user is coordinator
    const { data: userData, error: userDataError } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const userDataTyped = userData as { role?: string } | null;
    if (userDataError || !userDataTyped || (userDataTyped.role !== "coordinator" && userDataTyped.role !== "admin")) {
      return NextResponse.json(
        { error: "Solo coordinadores pueden acceder a este dashboard" },
        { status: 403 }
      );
    }

    // Get organizations where user is coordinator
    const { data: organizations } = await supabaseClient
      .from("workspace_members")
      .select(`
        organization:organizations (*)
      `)
      .eq("user_id", user.id)
      .in("role", ["admin", "coordinator"]);

    const orgIds = organizations?.map((o: any) => o.organization?.id).filter(Boolean) || [];

    // Get cohorts
    const { data: cohorts } = orgIds.length > 0
      ? await supabaseClient
          .from("cohorts")
          .select("*")
          .in("organization_id", orgIds)
      : { data: [] };

    // Get students in cohorts
    const cohortIds = cohorts?.map((c: any) => c.id) || [];
    const { data: students } = cohortIds.length > 0
      ? await supabaseClient
          .from("users")
          .select("*")
          .in("cohort_id", cohortIds)
      : { data: [] };

    // Get startups
    const studentIds = students?.map((s: any) => s.id) || [];
    const { data: startups } = studentIds.length > 0
      ? await supabaseClient
          .from("startups")
          .select("*")
          .in("student_id", studentIds)
      : { data: [] };

    // Get talent scores
    const { data: talentScores } = studentIds.length > 0
      ? await supabaseClient
          .from("talent_scores")
          .select("*")
          .in("user_id", studentIds)
      : { data: [] };

    // Calculate statistics
    const stats = {
      totalOrganizations: orgIds.length,
      totalCohorts: cohorts?.length || 0,
      totalStudents: students?.length || 0,
      totalStartups: startups?.length || 0,
      activeStartups: startups?.filter((s: any) => s.stage !== "ideation").length || 0,
      highPerformers: talentScores?.filter((s: any) => s.category === "high_performer").length || 0,
      atRisk: talentScores?.filter((s: any) => s.category === "at_risk").length || 0,
    };

    return NextResponse.json({
      organizations: organizations?.map((o: any) => o.organization) || [],
      cohorts: cohorts || [],
      students: students || [],
      startups: startups || [],
      talentScores: talentScores || [],
      statistics: stats,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/coordinator/dashboard');
  }
}



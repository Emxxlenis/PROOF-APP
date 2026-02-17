import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get("cohortId");
    const organizationId = searchParams.get("organizationId");

    const { supabaseClient } = await authenticateRequest(request);

    // Build query for students
    let query = supabaseClient
      .from("users")
      .select(`
        id,
        full_name,
        email,
        cohort_id,
        cohort:cohorts (
          id,
          name,
          organization_id,
          organization:organizations (id, name)
        ),
        startups (
          id,
          name,
          stage,
          category
        ),
        talent_scores (
          score,
          category,
          trend
        )
      `)
      .eq("role", "student");

    if (cohortId) {
      query = query.eq("cohort_id", cohortId);
    } else if (organizationId) {
      // Get cohorts for organization
      const { data: orgCohorts } = await supabaseClient
        .from("cohorts")
        .select("id")
        .eq("organization_id", organizationId);
      
      const orgCohortIds = orgCohorts?.map((c: any) => c.id) || [];
      if (orgCohortIds.length > 0) {
        query = query.in("cohort_id", orgCohortIds);
      } else {
        query = query.eq("cohort_id", "00000000-0000-0000-0000-000000000000"); // No results
      }
    }

    const { data: students, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Generate heatmap data
    // Format: { studentId: { score, category, activity, projects } }
    const heatmapData: Record<string, any> = {};

    students?.forEach((student: any) => {
      const score = student.talent_scores?.[0];
      const projects = student.startups || [];
      
      heatmapData[student.id] = {
        student: {
          id: student.id,
          name: student.full_name || student.email,
          email: student.email,
        },
        cohort: student.cohort,
        score: score?.score || 0,
        category: score?.category || "on_track",
        trend: score?.trend || "stable",
        projects: projects.length,
        activeProjects: projects.filter((p: any) => p.stage !== "ideation").length,
        stage: projects[0]?.stage || "ideation",
      };
    });

    return NextResponse.json({
      heatmap: heatmapData,
      total: students?.length || 0,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/coordinator/heatmap');
  }
}



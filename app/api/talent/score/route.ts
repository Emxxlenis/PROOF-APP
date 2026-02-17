import { NextRequest, NextResponse } from "next/server";
import { calculateTalentScore } from "@/lib/services/talent-scoring";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get("startupId");
    const studentId = searchParams.get("studentId");

    if (!startupId && !studentId) {
      throw ApiErrors.badRequest("startupId o studentId es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Get startup
    let startup;
    if (startupId) {
      const { data: s } = await supabaseClient
        .from("startups")
        .select("*")
        .eq("id", startupId)
        .single();
      startup = s;
    } else if (studentId) {
      const { data: s } = await supabaseClient
        .from("startups")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();
      startup = s;
    }

    if (!startup) {
      return NextResponse.json(
        { error: "Startup no encontrada" },
        { status: 404 }
      );
    }

    const targetStudentId = startup.student_id;

    // Collect data for scoring
    const [
      { data: okrs },
      { data: progressLogs },
      { data: validations },
      { data: coachInteractions },
      { data: communityPosts },
      { data: communityLikes },
      { data: communityComments },
      { data: teamUpMatches },
      { data: mentorSessions },
      { data: pivotAnalyses },
      { data: hypotheses },
      { data: seanEllisTests },
    ] = await Promise.all([
      supabaseClient.from("okrs").select("*").eq("startup_id", startup.id),
      supabaseClient.from("progress_logs").select("*").eq("student_id", targetStudentId),
      supabaseClient.from("validations").select("*").eq("startup_id", startup.id).order("created_at", { ascending: false }).limit(1),
      supabaseClient.from("coach_interactions").select("*").eq("startup_id", startup.id),
      supabaseClient.from("community_posts").select("*").eq("author_id", targetStudentId),
      supabaseClient.from("community_likes").select("*").in("post_id", []), // Will be populated
      supabaseClient.from("community_comments").select("*").eq("author_id", targetStudentId),
      supabaseClient.from("team_up_matches").select("*").or(`profile_1_id.in.(${targetStudentId}),profile_2_id.in.(${targetStudentId})`),
      supabaseClient.from("mentor_sessions").select("*").eq("student_id", targetStudentId),
      supabaseClient.from("pivot_analysis").select("*").eq("startup_id", startup.id),
      supabaseClient.from("hypothesis").select("*").eq("startup_id", startup.id),
      supabaseClient.from("sean_ellis_tests").select("*").eq("startup_id", startup.id),
    ]);

    // Calculate days active
    const daysActive = startup.created_at
      ? Math.floor((new Date().getTime() - new Date(startup.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const lastActivity = startup.last_activity 
      ? new Date(startup.last_activity)
      : new Date(startup.created_at);
    const lastActivityDays = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate scores
    const completedOKRs = okrs?.filter((okr: any) => 
      okr.kr1_status === "completed" && 
      okr.kr2_status === "completed" && 
      okr.kr3_status === "completed"
    ).length || 0;

    const seanEllisPassRate = seanEllisTests && seanEllisTests.length > 0
      ? (seanEllisTests.filter((t: any) => t.passed_threshold).length / seanEllisTests.length) * 100
      : 0;

    const score = calculateTalentScore({
      studentId: targetStudentId,
      startupId: startup.id,
      executionData: {
        okrsCompleted: completedOKRs,
        totalOKRs: okrs?.length || 0,
        milestonesReached: progressLogs?.length || 0,
        validationScore: validations?.[0]?.viability_score,
      },
      engagementData: {
        daysActive,
        coachInteractions: coachInteractions?.length || 0,
        communityPosts: communityPosts?.length || 0,
        lastActivityDays,
      },
      tractionData: {
        totalUsers: startup.total_users || 0,
        activeUsers: startup.active_users || 0,
        mrr: startup.mrr || 0,
        validationPassed: validations?.[0]?.viability_score >= 70,
        seanEllisPassRate,
      },
      collaborationData: {
        communityLikes: communityLikes?.length || 0,
        communityComments: communityComments?.length || 0,
        teamUpMatches: teamUpMatches?.length || 0,
        mentorSessions: mentorSessions?.length || 0,
      },
      innovationData: {
        pivotsAttempted: pivotAnalyses?.length || 0,
        hypothesesTested: hypotheses?.length || 0,
        improvementsImplemented: startup.improvements ? 1 : 0,
      },
    });

    // Save or update score
    const { data: existing } = await supabaseClient
      .from("talent_scores")
      .select("*")
      .eq("user_id", targetStudentId)
      .eq("startup_id", startup.id)
      .maybeSingle();

    if (existing) {
      await supabaseClient
        .from("talent_scores")
        .update({
          score: score.totalScore,
          category: score.category,
          trend: score.trend,
          factors: score.factors,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabaseClient
        .from("talent_scores")
        .insert({
          user_id: targetStudentId,
          startup_id: startup.id,
          score: score.totalScore,
          category: score.category,
          trend: score.trend,
          factors: score.factors,
        });
    }

    return NextResponse.json({
      score,
      breakdown: {
        execution: score.executionScore,
        engagement: score.engagementScore,
        traction: score.tractionScore,
        collaboration: score.collaborationScore,
        innovation: score.innovationScore,
      },
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/talent/score');
  }
}


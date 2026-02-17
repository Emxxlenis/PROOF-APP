import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    // Check if user is a mentor
    const { data: userData } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "mentor" && userData?.role !== "admin") {
      throw ApiErrors.forbidden("No eres mentor");
    }

    // Get mentor assignments
    const { data: assignments } = await supabaseClient
      .from("mentor_assignments")
      .select(`
        *,
        student:users!mentor_assignments_student_id_fkey (
          id,
          email,
          full_name
        ),
        startup:startups (
          id,
          name,
          description,
          stage,
          last_activity
        )
      `)
      .eq("mentor_id", user.id)
      .eq("status", "active");

    // Get inactivity alerts for assigned students
    const studentIds = assignments?.map((a: any) => a.student_id) || [];
    const { data: alerts } = studentIds.length > 0
      ? await supabaseClient
          .from("inactivity_alerts")
          .select(`
            *,
            student:users!inactivity_alerts_student_id_fkey (
              id,
              email,
              full_name
            ),
            startup:startups (
              id,
              name
            )
          `)
          .in("student_id", studentIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : { data: [] };

    // Get upcoming sessions
    const { data: sessions } = await supabaseClient
      .from("mentor_sessions")
      .select(`
        *,
        student:users!mentor_sessions_student_id_fkey (
          id,
          email,
          full_name
        ),
        startup:startups (
          id,
          name
        )
      `)
      .eq("mentor_id", user.id)
      .in("status", ["scheduled", "in_progress"])
      .order("scheduled_at", { ascending: true });

    // Get recommendations
    const { data: recommendations } = await supabaseClient
      .from("mentor_recommendations")
      .select(`
        *,
        student:users!mentor_recommendations_student_id_fkey (
          id,
          email,
          full_name
        ),
        startup:startups (
          id,
          name
        )
      `)
      .eq("mentor_id", user.id)
      .eq("used", false)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      assignments: assignments || [],
      alerts: alerts || [],
      sessions: sessions || [],
      recommendations: recommendations || [],
    });
  } catch (error: any) {
    return handleApiError(error, "GET /api/mentor/inbox");
  }
}



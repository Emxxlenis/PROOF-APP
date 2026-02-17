import { NextRequest, NextResponse } from "next/server";
import { sendEmail, generateEmailTemplate } from "@/lib/services/email-service";
import { handleApiError, validateRequestBody, validateUUID, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    validateRequestBody<{
      studentId: string;
      startupId?: string;
      scheduledAt: string;
      durationMinutes?: number;
      meetingUrl?: string;
      notes?: string;
    }>(body, ['studentId', 'scheduledAt']);

    validateUUID(body.studentId, 'studentId');
    if (body.startupId) {
      validateUUID(body.startupId, 'startupId');
    }

    const {
      studentId,
      startupId,
      scheduledAt,
      durationMinutes = 60,
      meetingUrl,
      notes,
    } = body;

    const { user, supabaseClient } = await authenticateRequest(request);

    if (!user) {
      throw ApiErrors.unauthorized();
    }

    // Get student and startup info
    const [{ data: student }, { data: startup }] = await Promise.all([
      supabaseClient
        .from("users")
        .select("*")
        .eq("id", studentId)
        .single(),
      startupId
        ? supabaseClient
            .from("startups")
            .select("*")
            .eq("id", startupId)
            .single()
        : { data: null },
    ]);

    const studentTyped = student as any;
    const startupTyped = startup as any;
    
    if (!studentTyped) {
      throw ApiErrors.notFound('Estudiante');
    }

    // Create session
    const { data: session, error: insertError } = await supabaseClient
      .from("mentor_sessions")
      .insert({
        mentor_id: user.id,
        student_id: studentId,
        startup_id: startupId || null,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        meeting_url: meetingUrl || null,
        notes: notes || null,
        status: "scheduled",
      } as any)
      .select()
      .single() as { data: any | null; error: any | null };

    if (insertError) {
      throw ApiErrors.internalError(`Error al crear sesión: ${insertError.message}`);
    }

    // Send email notification to student
    if (studentTyped.email) {
      await sendEmail({
        to: studentTyped.email,
        subject: `Sesión de Mentoría Programada - ${startupTyped?.name || "Tu Startup"}`,
        html: generateEmailTemplate("mentor_session_scheduled", {
          studentName: studentTyped.full_name || studentTyped.email,
          mentorName: user.user_metadata?.full_name || user.email,
          scheduledAt: scheduledAt,
          meetingUrl: meetingUrl,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/mentor/create-session');
  }
}



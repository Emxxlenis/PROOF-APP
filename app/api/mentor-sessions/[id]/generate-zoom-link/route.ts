import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-error-handler";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { scheduledAt, durationMinutes = 60 } = await request.json();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let user: any = null;
    let supabaseClient = supabase;

    if (token) {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const supabaseWithToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user: userFromToken } } = await supabaseWithToken.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
        supabaseClient = supabaseWithToken;
      }
    }

    if (!user) {
      const { data: { user: userFromCookies } } = await supabase.auth.getUser();
      user = userFromCookies;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    // Get session
    const { data: session, error: sessionError } = await supabaseClient
      .from("mentor_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    // Verify user is mentor or student
    if (session.mentor_id !== user.id && session.student_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Generate Zoom meeting
    const zoomMeeting = await createZoomMeeting({
      topic: `Sesión de Mentoría - ${session.startup_id ? "Proyecto" : "General"}`,
      start_time: scheduledAt || session.scheduled_at,
      duration: durationMinutes,
      type: 2, // Scheduled meeting
      settings: {
        join_before_host: false,
        waiting_room: true,
      },
    });

    // Save Zoom meeting to database
    const { data: zoomRecord, error: insertError } = await supabaseClient
      .from("zoom_meetings")
      .insert({
        mentor_session_id: sessionId,
        meeting_id: zoomMeeting.id,
        join_url: zoomMeeting.join_url,
        start_url: zoomMeeting.start_url,
        password: zoomMeeting.password,
        start_time: scheduledAt || session.scheduled_at,
        duration_minutes: durationMinutes,
      })
      .select()
      .single();

    if (insertError) {
      logger.warn("Error saving Zoom meeting", { error: insertError.message, sessionId });
    }

    // Update session with meeting URL
    await supabaseClient
      .from("mentor_sessions")
      .update({
        meeting_url: zoomMeeting.join_url,
      })
      .eq("id", sessionId);

    return NextResponse.json({
      success: true,
      zoomMeeting: {
        id: zoomMeeting.id,
        join_url: zoomMeeting.join_url,
        start_url: zoomMeeting.start_url,
        password: zoomMeeting.password,
      },
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/mentor-sessions/[id]/generate-zoom-link');
  }
}

async function createZoomMeeting(params: any): Promise<any> {
  // TODO: Implement Zoom API integration
  // For MVP, return mock data
  // In production, use Zoom API with JWT or OAuth
  
  // Example:
  // const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${zoomAccessToken}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(params),
  // });
  // return await response.json();

  // Mock response for MVP
  return {
    id: `zoom_${Date.now()}`,
    join_url: `https://zoom.us/j/${Math.random().toString(36).substring(7)}`,
    start_url: `https://zoom.us/s/${Math.random().toString(36).substring(7)}`,
    password: Math.random().toString(36).substring(2, 8),
  };
}



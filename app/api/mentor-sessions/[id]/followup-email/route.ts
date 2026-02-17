import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError } from "@/lib/api-error-handler";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

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

    // Get session with related data
    const { data: session, error: sessionError } = await supabase
      .from("mentor_sessions")
      .select(`
        *,
        mentor:users!mentor_sessions_mentor_id_fkey (*),
        student:users!mentor_sessions_student_id_fkey (*),
        project:startups!mentor_sessions_startup_id_fkey (*)
      `)
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    // Get next session if exists
    const { data: nextSession } = await supabase
      .from("mentor_sessions")
      .select("scheduled_at")
      .eq("student_id", session.student_id)
      .eq("mentor_id", session.mentor_id)
      .gt("scheduled_at", session.scheduled_at)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .single();

    // Generate follow-up email
    const emailHtml = generateFollowupEmail(session, nextSession);

    return NextResponse.json({
      success: true,
      email: {
        to: session.student.email,
        subject: `Resumen de sesión con ${session.mentor.full_name || session.mentor.email}`,
        html: emailHtml,
      },
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/mentor-sessions/[id]/followup-email');
  }
}

function generateFollowupEmail(session: any, nextSession: any | null): string {
  const actionItems = session.action_items || [];
  const notes = session.notes || "No hay notas disponibles.";
  const aiSummary = session.ai_summary ? JSON.parse(session.ai_summary) : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #208791; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #208791; }
        .action-item { background: white; padding: 15px; margin-bottom: 10px; border-left: 4px solid #208791; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Resumen de Sesión de Mentoría</h1>
        </div>
        <div class="content">
          <p>Hola ${session.student.full_name || session.student.email},</p>
          <p>Aquí está el resumen de tu sesión con ${session.mentor.full_name || session.mentor.email}:</p>
          
          <div class="section">
            <div class="section-title">📝 Temas Discutidos</div>
            <div style="background: white; padding: 15px; border-radius: 5px;">
              ${aiSummary?.summary_points 
                ? aiSummary.summary_points.map((point: string) => `<p>• ${point}</p>`).join("")
                : `<p>${notes}</p>`
              }
            </div>
          </div>
          
          ${actionItems.length > 0 ? `
            <div class="section">
              <div class="section-title">✅ Action Items</div>
              ${actionItems.map((item: string) => `
                <div class="action-item">
                  ${item}
                </div>
              `).join("")}
            </div>
          ` : ""}
          
          ${nextSession ? `
            <div class="section">
              <div class="section-title">📅 Próxima Sesión</div>
              <p>Tu próxima sesión está programada para: <strong>${new Date(nextSession.scheduled_at).toLocaleDateString("es-ES", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}</strong></p>
            </div>
          ` : ""}
          
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/mentor" 
               style="background: #208791; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Ver en Proof →
            </a>
          </p>
        </div>
        <div class="footer">
          <p>Proof - Where Execution Speaks</p>
        </div>
      </div>
    </body>
    </html>
  `;
}



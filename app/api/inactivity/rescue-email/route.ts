import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-error-handler";
import { generateJSON, ChatMessage } from "@/lib/gemini";

const RESCUE_EMAIL_PROMPT = `Genera un email de rescate para un founder inactivo:

Nombre: {name}
Proyecto: {project_name}
Descripción: {description}
Días sin actividad: {days_ago}
Severidad: {severity}
{session_context}

Genera un email:
- Tono amigable pero urgente
- Personalizado con datos del proyecto
- Incluye próximo paso sugerido
- Motiva a continuar

Responde SOLO JSON:
{
  "subject": "Asunto del email",
  "html_content": "Contenido HTML del email",
  "text_content": "Versión texto plano"
}`;

export async function POST(request: NextRequest) {
  try {
    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: "alertId es requerido" },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        } as any,
      }
    );

    // Get alert
    const { data: alert, error: alertError } = await supabase
      .from("inactivity_alerts")
      .select(`
        *,
        user:users!inactivity_alerts_user_id_fkey (*),
        project:startups!inactivity_alerts_startup_id_fkey (*)
      `)
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    const user = alert.user;
    const project = alert.project;

    const daysAgo = Math.floor(
      (Date.now() - new Date(alert.last_activity).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get last mentor session notes if available
    const { data: lastSession } = await supabase
      .from("mentor_sessions")
      .select("notes, action_items")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Build session context
    let sessionContext = "";
    if (lastSession?.notes) {
      sessionContext += `\nÚltima sesión con mentor: ${lastSession.notes}`;
    }
    if (lastSession?.action_items) {
      sessionContext += `\nAction items pendientes: ${JSON.stringify(lastSession.action_items)}`;
    }

    const prompt = RESCUE_EMAIL_PROMPT
      .replace("{name}", user.full_name || user.email)
      .replace("{project_name}", project.name)
      .replace("{description}", project.description || "")
      .replace("{days_ago}", daysAgo.toString())
      .replace("{severity}", alert.severity)
      .replace("{session_context}", sessionContext);

    const messages: ChatMessage[] = [
      { role: "system", content: "You are an assistant. Write a short re-engagement email. Respond with the email content only." },
      { role: "user", content: prompt },
    ];

    const result = await generateJSON(messages, { temperature: 0.8 });
    const emailData = result.data;

    // Mark as sent
    const { error: updateError } = await supabase
      .from("inactivity_alerts")
      .update({
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (updateError) {
      logger.warn("Error updating alert", { error: updateError.message });
    }

    return NextResponse.json({
      success: true,
      email: {
        to: user.email,
        subject: emailData.subject,
        html: emailData.html_content,
        text: emailData.text_content,
      },
      message: "Email generado. En producción se enviará automáticamente.",
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/inactivity/rescue-email');
  }
}

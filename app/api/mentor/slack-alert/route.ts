import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError } from "@/lib/api-error-handler";

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
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    // Get alert with related data
    const { data: alert, error: alertError } = await supabase
      .from("inactivity_alerts")
      .select(`
        *,
        user:users!inactivity_alerts_user_id_fkey (*),
        project:startups!inactivity_alerts_startup_id_fkey (*),
        mentor:mentor_assignments!inactivity_alerts_startup_id_fkey (
          mentor_id,
          mentor:users!mentor_assignments_mentor_id_fkey (*)
        )
      `)
      .eq("id", alertId)
      .single();

    if (alertError || !alert) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    // Get mentor's Slack integration
    const mentorId = alert.mentor?.mentor_id;
    if (!mentorId) {
      return NextResponse.json(
        { error: "No hay mentor asignado" },
        { status: 400 }
      );
    }

    const { data: slackIntegration } = await supabase
      .from("slack_integrations")
      .select("*")
      .eq("user_id", mentorId)
      .eq("is_active", true)
      .single();

    if (!slackIntegration) {
      return NextResponse.json(
        { error: "El mentor no tiene Slack configurado" },
        { status: 400 }
      );
    }

    // Calculate days since last activity
    const daysAgo = Math.floor(
      (Date.now() - new Date(alert.last_activity).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Prepare Slack message
    const severityEmoji = {
      critical: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
    };

    const message = {
      channel: slackIntegration.channel_id,
      text: `${severityEmoji[alert.severity as keyof typeof severityEmoji] || "⚠️"} Alerta de Inactividad: ${alert.user.full_name || alert.user.email}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${severityEmoji[alert.severity as keyof typeof severityEmoji] || "⚠️"} Alerta de Inactividad`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Founder:*\n${alert.user.full_name || alert.user.email}`,
            },
            {
              type: "mrkdwn",
              text: `*Proyecto:*\n${alert.project.name}`,
            },
            {
              type: "mrkdwn",
              text: `*Días sin actividad:*\n${daysAgo}`,
            },
            {
              type: "mrkdwn",
              text: `*Severidad:*\n${alert.severity}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Descripción del proyecto:*\n${alert.project.description || "Sin descripción"}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Ver Perfil",
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/community/profile/${alert.user.id}`,
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Agendar Sesión",
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/mentor?founderId=${alert.user.id}`,
            },
          ],
        },
      ],
    };

    // Send to Slack
    const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${slackIntegration.bot_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const slackData = await slackResponse.json();

    if (!slackData.ok) {
      return NextResponse.json(
        { error: `Error al enviar a Slack: ${slackData.error}` },
        { status: 500 }
      );
    }

    // Mark alert as sent
    await supabase
      .from("inactivity_alerts")
      .update({
        slack_sent_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    return NextResponse.json({
      success: true,
      message: "Alerta enviada a Slack",
      slackMessageId: slackData.ts,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/mentor/slack-alert');
  }
}



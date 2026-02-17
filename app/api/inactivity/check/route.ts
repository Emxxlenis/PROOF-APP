import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateContent, generateJSON, ChatMessage } from "@/lib/gemini";
import { INACTIVITY_EMAIL_PROMPT, MENTOR_RECOMMENDATIONS_PROMPT } from "@/lib/prompts/mentor-email";
import { sendEmail, generateEmailTemplate } from "@/lib/services/email-service";
import { sendSlackMessage, createInactivityAlertBlock } from "@/lib/services/slack-service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { force = false } = await request.json().catch(() => ({ force: false }));

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

    // Get all active startups
    const { data: startups, error: startupsError } = await supabase
      .from("startups")
      .select(`
        *,
        users!startups_student_id_fkey (
          id,
          email,
          full_name,
          last_login
        )
      `)
      .not("student_id", "is", null);

    if (startupsError) {
      return NextResponse.json(
        { error: startupsError.message },
        { status: 500 }
      );
    }

    const now = new Date();
    const alertsCreated = [];

    for (const startup of startups || []) {
      const user = startup.users;
      if (!user) continue;

      // Calculate days since last activity
      const lastActivity = startup.last_activity 
        ? new Date(startup.last_activity)
        : new Date(startup.created_at);
      
      const daysInactive = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if inactive for 48+ hours
      if (daysInactive >= 2 || force) {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from("inactivity_alerts")
          .select("*")
          .eq("student_id", user.id)
          .eq("startup_id", startup.id)
          .eq("status", "pending")
          .single();

        if (existingAlert && !force) {
          continue;
        }

        // Get mentor assignment
        const { data: mentorAssignment } = await supabase
          .from("mentor_assignments")
          .select(`
            *,
            mentor:users!mentor_assignments_mentor_id_fkey (
              id,
              email,
              full_name
            )
          `)
          .eq("student_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        // Generate personalized email with AI
        const emailPrompt = INACTIVITY_EMAIL_PROMPT({
          studentName: user.full_name || user.email,
          startupName: startup.name,
          startupDescription: startup.description,
          lastActivity: lastActivity.toLocaleDateString("es-CO"),
          daysInactive,
        });

        const emailMessages: ChatMessage[] = [
          { role: "system", content: "You are an assistant. Write a short motivational message. Respond with the content only." },
          { role: "user", content: emailPrompt },
        ];

        const emailResult = await generateContent(emailMessages, { temperature: 0.7 });
        const emailContent = emailResult.content;

        // Generate mentor recommendations
        let recommendations: string[] = [];
        if (mentorAssignment) {
          const recPrompt = MENTOR_RECOMMENDATIONS_PROMPT({
            studentName: user.full_name || user.email,
            startupName: startup.name,
            startupStage: startup.stage,
          });

          const recMessages: ChatMessage[] = [
            { role: "system", content: "You are an assistant. Generate recommendations. Respond with valid JSON only." },
            { role: "user", content: recPrompt },
          ];

          try {
            const recResult = await generateJSON(recMessages, { temperature: 0.7 });
            recommendations = recResult.data.recommendations?.map((r: any) => r.title) || [];
          } catch (e) {
            recommendations = ["Revisar progreso", "Ofrecer apoyo", "Agendar sesión"];
          }
        }

        // Create alert
        const { data: alert, error: alertError } = await supabase
          .from("inactivity_alerts")
          .insert({
            student_id: user.id,
            startup_id: startup.id,
            mentor_id: mentorAssignment?.mentor_id || null,
            alert_type: "no_activity",
            last_activity_date: lastActivity.toISOString(),
            days_inactive: daysInactive,
            status: "pending",
            email_content: emailContent,
          })
          .select()
          .single();

        if (alertError) {
          logger.error("Error creating alert", alertError as Error);
          continue;
        }

        // Send email
        const emailSent = await sendEmail({
          to: user.email,
          subject: `¿Necesitas ayuda con ${startup.name}?`,
          html: emailContent || generateEmailTemplate("inactivity_alert", {
            name: user.full_name || user.email,
            startupName: startup.name,
            personalizedMessage: emailContent,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
          }),
        });

        if (emailSent) {
          await supabase
            .from("inactivity_alerts")
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
            })
            .eq("id", alert.id);
        }

        // Send Slack alert to mentor if assigned
        if (mentorAssignment?.mentor) {
          const slackMessage = createInactivityAlertBlock({
            studentName: user.full_name || user.email,
            startupName: startup.name,
            daysInactive,
            recommendations,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
          });

          const slackSent = await sendSlackMessage({
            channel: process.env.SLACK_MENTOR_CHANNEL || "#mentors",
            text: `Alerta de inactividad: ${user.full_name || user.email}`,
            blocks: slackMessage,
          });

          if (slackSent) {
            await supabase
              .from("inactivity_alerts")
              .update({
                slack_alert_sent: true,
                slack_alert_sent_at: new Date().toISOString(),
                slack_message: JSON.stringify(slackMessage),
              })
              .eq("id", alert.id);
          }
        }

        alertsCreated.push({
          studentId: user.id,
          startupId: startup.id,
          daysInactive,
        });
      }
    }

    return NextResponse.json({
      success: true,
      alertsCreated: alertsCreated.length,
      alerts: alertsCreated,
    });
  } catch (error: any) {
    logger.error("Error checking inactivity", error as Error);
    return NextResponse.json(
      { error: error.message || "Error al verificar inactividad" },
      { status: 500 }
    );
  }
}

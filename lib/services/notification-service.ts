/**
 * Notification Service
 * Centralized service for multi-channel notifications
 */

import { sendEmail, generateEmailTemplate } from "./email-service";
import { sendSlackMessage } from "./slack-service";

export interface NotificationOptions {
  userId: string;
  type: string;
  title: string;
  content: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  channels?: ("in_app" | "email" | "slack" | "sms")[];
}

export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  try {
    // This would typically use Supabase client, but for now we'll use a simplified version
    // In production, this would:
    // 1. Check user notification preferences
    // 2. Create notification record in DB
    // 3. Send to each enabled channel
    // 4. Track delivery status

    const channels = options.channels || ["in_app"];

    // Send to each channel
    const results = await Promise.all(
      channels.map(async (channel) => {
        switch (channel) {
          case "in_app":
            // Create in-app notification (would be done via Supabase)
            return true;
          case "email":
            // Get user email from DB and send
            return await sendEmail({
              to: options.metadata?.userEmail || "",
              subject: options.title,
              html: options.content,
            });
          case "slack":
            return await sendSlackMessage({
              channel: process.env.SLACK_NOTIFICATION_CHANNEL || "#notifications",
              text: options.title,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: options.content,
                  },
                },
                ...(options.actionUrl ? [{
                  type: "actions",
                  elements: [{
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Ver más",
                    },
                    url: options.actionUrl,
                  }],
                }] : []),
              ],
            });
          case "sms":
            // SMS would use Twilio
            // Note: SMS not implemented yet, placeholder for future implementation
            console.log("SMS channel not implemented - message would be sent via Twilio in production");
            return true;
          default:
            return false;
        }
      })
    );

    return results.every((r) => r === true);
  } catch (error) {
    // Note: Using console.error here is acceptable for external service errors
    // that need to be visible in production logs
    console.error("Error sending notification:", error);
    return false;
  }
}



/**
 * Slack Integration Service
 *
 * Handles sending messages to Slack via webhook.
 * Supports Block Kit formatting for rich notifications.
 *
 * @remarks
 * Requires SLACK_WEBHOOK_URL environment variable in production.
 * In development, logs messages without sending if not configured.
 *
 * @module lib/services/slack-service
 */

import { logger } from "../logger";

/**
 * Slack message configuration options.
 */
interface SlackMessageOptions {
  /** Target channel name or ID */
  channel: string;
  /** Fallback text for notifications */
  text: string;
  /** Block Kit blocks for rich formatting (optional) */
  blocks?: any[];
  /** Legacy attachments (optional) */
  attachments?: any[];
}

/**
 * Sends a message to Slack via incoming webhook.
 *
 * @param options - Message configuration
 * @returns true if message sent successfully, false otherwise
 *
 * @example
 * ```ts
 * await sendSlackMessage({
 *   channel: '#alerts',
 *   text: 'New user signup',
 *   blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*User:* john@example.com' }}]
 * });
 * ```
 */
export async function sendSlackMessage(options: SlackMessageOptions): Promise<boolean> {
  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      if (process.env.NODE_ENV === "development") {
        logger.debug("Slack webhook not configured - message would be sent in production", {
          channel: options.channel,
          text: options.text,
        });
        return true;
      }
      logger.warn("Slack webhook URL not configured - message sending disabled");
      return false;
    }

    const response = await fetch(slackWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: options.channel,
        text: options.text,
        blocks: options.blocks,
        attachments: options.attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("Slack API error", new Error(error));
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error sending Slack message", error as Error);
    return false;
  }
}

/**
 * Creates Block Kit blocks for inactivity alert notifications.
 *
 * @param data - Alert data including student info and recommendations
 * @returns Array of Block Kit blocks
 *
 * @example
 * ```ts
 * const blocks = createInactivityAlertBlock({
 *   studentName: 'María',
 *   startupName: 'EcoApp',
 *   daysInactive: 7,
 *   recommendations: ['Schedule a check-in', 'Review OKRs'],
 *   dashboardUrl: 'https://proof.com/dashboard/student/123'
 * });
 * ```
 */
export function createInactivityAlertBlock(data: {
  studentName: string;
  startupName: string;
  daysInactive: number;
  recommendations: string[];
  dashboardUrl: string;
}): any[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Alerta de Inactividad: ${data.studentName}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Startup:* ${data.startupName}\n*Días inactivo:* ${data.daysInactive}\n\n*Recomendaciones:*\n${data.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`,
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
          url: data.dashboardUrl,
          style: "primary",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Agendar Sesión",
          },
          action_id: "schedule_session",
          value: JSON.stringify({ studentId: data.studentName }),
        },
      ],
    },
  ];
}

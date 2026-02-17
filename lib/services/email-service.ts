/**
 * Email Service
 *
 * Handles transactional email delivery via SendGrid API.
 * Provides template generation for common email types.
 *
 * @remarks
 * - Requires SENDGRID_API_KEY environment variable in production
 * - In development, logs emails without sending if not configured
 * - Supports HTML and plain text content
 *
 * @module lib/services/email-service
 */

import { logger } from "../logger";

/**
 * Email configuration options.
 */
interface EmailOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML content body */
  html: string;
  /** Plain text fallback (optional) */
  text?: string;
}

/**
 * Sends an email via SendGrid API.
 *
 * @param options - Email configuration (to, subject, html, text)
 * @returns true if email sent successfully, false otherwise
 *
 * @remarks
 * In development without API key, logs intent and returns true for testing.
 * In production without API key, logs warning and returns false.
 *
 * @example
 * ```ts
 * const sent = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Welcome to Proof</h1>',
 *   text: 'Welcome to Proof'
 * });
 * ```
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const sendGridApiKey = process.env.SENDGRID_API_KEY;

    if (!sendGridApiKey) {
      if (process.env.NODE_ENV === "development") {
        logger.debug("SendGrid not configured - email would be sent in production", {
          to: options.to,
          subject: options.subject,
        });
        return true;
      }
      logger.warn("SendGrid API key not configured - email sending disabled");
      return false;
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject,
          },
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@proof.com",
          name: process.env.SENDGRID_FROM_NAME || "Proof Platform",
        },
        content: [
          ...(options.text ? [{
            type: "text/plain",
            value: options.text,
          }] : []),
          {
            type: "text/html",
            value: options.html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("SendGrid API error", new Error(error));
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error sending email", error as Error);
    return false;
  }
}

/**
 * Generates HTML email content from predefined templates.
 *
 * @param templateName - Name of the template to use
 * @param data - Template variables to interpolate
 * @returns HTML string for email content
 *
 * @remarks
 * Available templates:
 * - inactivity_alert: Re-engagement email for inactive users
 * - mentor_session_scheduled: Session confirmation email
 *
 * @example
 * ```ts
 * const html = generateEmailTemplate('inactivity_alert', {
 *   name: 'María',
 *   startupName: 'EcoApp',
 *   personalizedMessage: 'Tu última sesión fue hace 7 días.',
 *   dashboardUrl: 'https://proof.com/dashboard'
 * });
 * ```
 */
export function generateEmailTemplate(templateName: string, data: Record<string, any>): string {
  const templates: Record<string, (data: Record<string, any>) => string> = {
    inactivity_alert: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Hola ${data.name}!</h1>
          </div>
          <div class="content">
            <p>Notamos que no has estado activo en tu startup <strong>${data.startupName}</strong> en los últimos días.</p>
            <p>${data.personalizedMessage}</p>
            <p>¿Necesitas ayuda? Estamos aquí para apoyarte.</p>
            <a href="${data.dashboardUrl}" class="button">Ir a mi Dashboard</a>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Este es un email automático de Proof Platform.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    mentor_session_scheduled: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sesión de Mentoría Programada</h1>
          </div>
          <div class="content">
            <p>Hola ${data.studentName},</p>
            <p>Tu sesión de mentoría con ${data.mentorName} ha sido programada para:</p>
            <p><strong>${new Date(data.scheduledAt).toLocaleString("es-CO")}</strong></p>
            ${data.meetingUrl ? `<p>Link de la reunión: <a href="${data.meetingUrl}">${data.meetingUrl}</a></p>` : ""}
            <p>¡Nos vemos pronto!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const template = templates[templateName];
  if (!template) {
    return `<p>Template ${templateName} not found</p>`;
  }

  return template(data);
}

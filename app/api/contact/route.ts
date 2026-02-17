/**
 * Contact Form API Route
 *
 * Processes contact form submissions, sending notifications
 * to the admin team and confirmation emails to users.
 *
 * @module app/api/contact
 */

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/services/email-service";
import { logger } from "@/lib/logger";

/**
 * Contact form data structure.
 */
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Processes contact form submission.
 *
 * Flow:
 * 1. Validate all required fields
 * 2. Validate email format
 * 3. Send notification to admin team
 * 4. Send confirmation email to user
 *
 * @route POST /api/contact
 *
 * @param request - NextRequest with contact form data
 * @returns JSON with success status
 *
 * @throws 400 - Missing required fields or invalid email
 * @throws 500 - Email sending failed
 */
export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Simple email format validation (RFC 5322 simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "El formato del email no es válido" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.CONTACT_EMAIL || process.env.SENDGRID_FROM_EMAIL || "soporte@proof.com";

    // Admin notification email with branded HTML template
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .value { margin-top: 5px; padding: 10px; background: white; border-radius: 5px; border-left: 3px solid #3b82f6; }
          .message-box { background: white; padding: 20px; border-radius: 5px; border-left: 3px solid #06b6d4; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nuevo Mensaje de Contacto</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Nombre Completo</div>
              <div class="value">${body.firstName} ${body.lastName}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${body.email}">${body.email}</a></div>
            </div>
            <div class="field">
              <div class="label">Asunto</div>
              <div class="value">${body.subject}</div>
            </div>
            <div class="field">
              <div class="label">Mensaje</div>
              <div class="message-box">${body.message}</div>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Este mensaje fue enviado desde el formulario de contacto de Proof.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const adminEmailSent = await sendEmail({
      to: adminEmail,
      subject: `[Contacto Proof] ${body.subject}`,
      html: adminEmailHtml,
      text: `Nuevo mensaje de contacto de ${body.firstName} ${body.lastName} (${body.email})\n\nAsunto: ${body.subject}\n\nMensaje:\n${body.message}`,
    });

    // User confirmation email
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Hemos recibido tu mensaje!</h1>
          </div>
          <div class="content">
            <p>Hola ${body.firstName},</p>
            <p>Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
            <div class="highlight">
              <strong>Tu mensaje:</strong><br/>
              <em>"${body.subject}"</em>
            </div>
            <p>Nuestro equipo revisará tu consulta y te responderá en un plazo de 24-48 horas hábiles.</p>
            <p style="margin-top: 30px;">
              Saludos,<br/>
              <strong>El equipo de Proof</strong>
            </p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Este es un email automático de confirmación. Por favor no respondas a este mensaje.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: body.email,
      subject: "Hemos recibido tu mensaje - Proof",
      html: userEmailHtml,
      text: `Hola ${body.firstName},\n\nGracias por contactarnos. Hemos recibido tu mensaje sobre "${body.subject}" y te responderemos lo antes posible.\n\nSaludos,\nEl equipo de Proof`,
    });

    if (!adminEmailSent) {
      // In development, allow success even if email not configured
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          message: "Mensaje recibido (modo desarrollo)",
        });
      }

      return NextResponse.json(
        { error: "Error al enviar el mensaje. Por favor intenta de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mensaje enviado exitosamente",
    });
  } catch (error) {
    logger.error("Error in contact form", error as Error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

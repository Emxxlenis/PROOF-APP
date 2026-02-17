import { NextRequest, NextResponse } from "next/server";
import { generateJSON, ChatMessage } from "@/lib/gemini";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { logger } from "@/lib/logger";

const SUMMARY_PROMPT = `Resume esta transcripción de mentoría en 5 puntos clave y lista action items:

Transcripción:
{transcription}

Responde JSON:
{
  "summary_points": ["punto 1", "punto 2", ...],
  "action_items": ["acción 1", "acción 2", ...]
}`;

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      notes,
      transcription,
    } = await request.json();

    if (!sessionId || !notes) {
      throw ApiErrors.badRequest("sessionId y notes son requeridos");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Get session
    const { data: session } = await supabaseClient
      .from("mentor_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session || session.mentor_id !== user.id) {
      return NextResponse.json(
        { error: "Sesión no encontrada o no autorizado" },
        { status: 404 }
      );
    }

    // Generate AI summary if transcription is provided
    let aiSummary = null;
    if (transcription) {
      const prompt = SUMMARY_PROMPT.replace("{transcription}", transcription);

      const messages: ChatMessage[] = [
        { role: "system", content: "You are an assistant. Summarize the session notes. Respond in the requested format." },
        { role: "user", content: prompt },
      ];

      try {
        const result = await generateJSON(messages, { temperature: 0.7 });
        aiSummary = result.data;
      } catch (e) {
        logger.error("Error generating AI summary", e as Error);
      }
    }

    // Parse action items
    const actionItems = aiSummary?.action_items || [];

    // Update session
    const { data: updatedSession, error: updateError } = await supabaseClient
      .from("mentor_sessions")
      .update({
        notes,
        transcription: transcription || null,
        ai_summary: aiSummary ? JSON.stringify(aiSummary) : null,
        action_items: actionItems,
        status: "completed",
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Error al actualizar: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
      aiSummary,
    });
  } catch (error: any) {
    return handleApiError(error, "POST /api/mentor/submit-notes");
  }
}

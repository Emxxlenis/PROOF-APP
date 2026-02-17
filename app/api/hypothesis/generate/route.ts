/**
 * Hypothesis Generation API Route
 *
 * Generates validation hypotheses using AI based on
 * problem, user, urgency, and risk inputs.
 * Outputs hypotheses in If/Then/Because format.
 *
 * @module app/api/hypothesis/generate
 */

import { NextRequest, NextResponse } from "next/server";
import { generateJSON, ChatMessage } from "@/lib/gemini";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { rateLimiter, getRateLimitIdentifier, getClientIP } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

/**
 * Prompt template for hypothesis generation.
 * Generates 3-5 hypotheses in If/Then/Because format.
 */
const HYPOTHESIS_PROMPT = `Genera 3-5 hipótesis de validación en formato Si/Entonces/Porque.

CONTEXTO:
- Problema: {problema}
- Usuario: {usuario}
- Por qué ahora: {por_que_ahora}
- Riesgo principal: {riesgo}

FORMATO REQUERIDO:
Cada hipótesis debe ser:
- Específica y medible
- Accionable (se puede validar)
- Relevante al problema y usuario
- Enfocada en el riesgo

Responde SOLO JSON:
{
  "hypotheses": [{
    "hypothesis_text": "Hipótesis completa",
    "si_clause": "Si [condición]",
    "entonces_clause": "Entonces [resultado]",
    "porque_clause": "Porque [razón]",
    "validation_method": "Método de validación",
    "target_metric": "Métrica objetivo",
    "success_criteria": "Criterios de éxito"
  }]
}`;

/**
 * Generates validation hypotheses using AI.
 *
 * Flow:
 * 1. Validate required inputs (startupId, problema, usuario, por_que_ahora, riesgo)
 * 2. Authenticate user and verify startup ownership/membership
 * 3. Generate hypotheses via AI
 * 4. Persist each hypothesis to database
 *
 * @route POST /api/hypothesis/generate
 *
 * @param request - NextRequest with startup context and inputs
 * @returns JSON with generated and saved hypotheses
 *
 * @throws {ApiError} 400 - Missing required fields
 * @throws {ApiError} 403 - User doesn't have access to startup
 * @throws {ApiError} 404 - Startup not found
 * @throws {ApiError} 429 - Rate limit exceeded
 */
export async function POST(request: NextRequest) {
  try {
    const {
      startupId,
      problema,
      usuario,
      por_que_ahora,
      riesgo
    } = await request.json();

    if (!startupId) {
      throw ApiErrors.badRequest("startupId es requerido");
    }

    if (!problema || !usuario || !por_que_ahora || !riesgo) {
      throw ApiErrors.badRequest("Todos los campos son requeridos: problema, usuario, por_que_ahora, riesgo");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      throw ApiErrors.rateLimitExceeded(rateCheck.retryAfter);
    }

    // Verify startup exists
    const { data: startup, error: startupError } = await supabaseClient
      .from("startups")
      .select("*")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      return NextResponse.json(
        { error: "Startup no encontrada" },
        { status: 404 }
      );
    }

    // Verify user has access (owner or team member)
    const startupTyped = startup as { student_id?: string };
    const isOwner = startupTyped.student_id === user.id;
    const { data: teamMember } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("startup_id", startupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isOwner && !teamMember) {
      return NextResponse.json(
        { error: "No tienes acceso a este proyecto" },
        { status: 403 }
      );
    }

    // Build prompt with user inputs
    const prompt = HYPOTHESIS_PROMPT
      .replace("{problema}", problema)
      .replace("{usuario}", usuario)
      .replace("{por_que_ahora}", por_que_ahora)
      .replace("{riesgo}", riesgo);

    const messages: ChatMessage[] = [
      { role: "system", content: "You are an assistant. Generate hypotheses in the requested format. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ];

    logger.info("Generating hypotheses", { startupId, userId: user.id });

    const result = await generateJSON(messages, { temperature: 0.7 });
    const hypothesesData = result.data;

    if (!hypothesesData.hypotheses || !Array.isArray(hypothesesData.hypotheses)) {
      return NextResponse.json(
        { error: "Formato de respuesta inválido de la IA" },
        { status: 500 }
      );
    }

    // Persist each valid hypothesis to database
    const savedHypotheses: any[] = [];
    for (const hyp of hypothesesData.hypotheses) {
      if (!hyp.si_clause || !hyp.entonces_clause || !hyp.porque_clause) {
        logger.warn("Incomplete hypothesis, skipping", { hyp });
        continue;
      }

      const fullText = `${hyp.si_clause} ${hyp.entonces_clause} ${hyp.porque_clause}`;

      const { data: hypothesis, error: insertError } = await supabaseClient
        .from("hypotheses")
        .insert({
          startup_id: startupId,
          student_id: user.id,
          hypothesis_text: hyp.hypothesis_text || fullText,
          si_clause: hyp.si_clause,
          entonces_clause: hyp.entonces_clause,
          porque_clause: hyp.porque_clause,
          validation_method: hyp.validation_method || null,
          target_metric: hyp.target_metric || null,
          success_criteria: hyp.success_criteria || null,
          status: "draft",
          version_number: 1,
          is_current_version: true,
          input_problema: problema,
          input_usuario: usuario,
          input_por_que_ahora: por_que_ahora,
          input_riesgo: riesgo,
        })
        .select()
        .single();

      if (insertError) {
        logger.error("Error inserting hypothesis", insertError as Error);
        continue;
      }

      if (hypothesis) {
        savedHypotheses.push(hypothesis);
      }
    }

    if (savedHypotheses.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron guardar las hipótesis generadas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hypotheses: savedHypotheses,
      count: savedHypotheses.length,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/hypothesis/generate');
  }
}

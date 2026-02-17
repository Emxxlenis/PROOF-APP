/**
 * Startup Builder Brainstorm API Route
 *
 * Generates creative expansion ideas for startups using AI.
 * Considers Colombian market context and startup viability score.
 *
 * @module app/api/startup-builder/brainstorm
 */

import { NextRequest, NextResponse } from "next/server";
import { generateContent, ChatMessage } from "@/lib/gemini";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { rateLimiter, getRateLimitIdentifier, getClientIP } from "@/lib/rate-limiter";

/** Placeholder template. Production prompt not in repo. */
const BRAINSTORM_PROMPT = `Generate 8-12 expansion ideas. Startup: {name} {description} {problem} {solution} {target_audience} {business_model} {competitive_advantage} {market_opportunity}. Viability: {viability_score}/100. Respond with a numbered list only.`;

/**
 * Generates expansion ideas for a startup.
 *
 * @route POST /api/startup-builder/brainstorm
 *
 * @param request - NextRequest with startupData and validation objects
 * @returns JSON with array of ideas and token usage
 *
 * @throws {ApiError} 400 - Missing startup data
 * @throws {ApiError} 401 - Not authenticated
 * @throws {ApiError} 429 - Rate limit exceeded
 *
 * @example
 * Request body:
 * ```json
 * {
 *   "startupData": {
 *     "name": "EcoApp",
 *     "description": "App de reciclaje gamificada",
 *     ...
 *   },
 *   "validation": {
 *     "viability_score": 75
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const { startupData, validation } = await request.json();

    if (!startupData || !startupData.description) {
      throw ApiErrors.badRequest("Se requiere información de la startup");
    }

    const { user } = await authenticateRequest(request);

    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      throw ApiErrors.rateLimitExceeded(rateCheck.retryAfter);
    }

    const prompt = BRAINSTORM_PROMPT
      .replace("{name}", startupData.name || "Sin nombre")
      .replace("{description}", startupData.description || "")
      .replace("{problem}", startupData.problem || "No especificado")
      .replace("{solution}", startupData.solution || "No especificada")
      .replace("{target_audience}", startupData.target_audience || "No especificada")
      .replace("{business_model}", startupData.business_model || "No especificado")
      .replace("{competitive_advantage}", startupData.competitive_advantage || "No especificada")
      .replace("{market_opportunity}", startupData.market_opportunity || "No especificada")
      .replace("{viability_score}", validation?.viability_score?.toString() || "N/A");

    const messages: ChatMessage[] = [
      { role: "system", content: "You are an assistant. Respond with a numbered list of ideas only." },
      { role: "user", content: prompt },
    ];

    // Higher temperature for creative brainstorming
    const result = await generateContent(messages, { temperature: 0.8 });

    // Parse numbered list into array of ideas
    const ideas = result.content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim())
      .filter((line) => line.length > 10);

    return NextResponse.json({
      ideas: ideas.slice(0, 12),
      tokensUsed: result.tokensUsed || 0,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/startup-builder/brainstorm');
  }
}

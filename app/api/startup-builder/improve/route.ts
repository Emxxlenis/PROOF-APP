import { NextRequest, NextResponse } from "next/server";
import { generateContent, getModelInfo, ChatMessage } from "@/lib/gemini";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { rateLimiter, getRateLimitIdentifier, getClientIP } from "@/lib/rate-limiter";

/** Placeholder template. Production prompt not in repo. */
const IMPROVE_PROMPT = `Suggest 5-7 improvements. Startup: {name} {description} {problem} {solution} {target_audience} {business_model} {competitive_advantage} {market_opportunity} {additional_context}. Validation: {viability_score} {technical_score} {market_score} {competition_score} {business_model_score} {context_score}. Strengths: {strengths}. Risks: {risks}. Use markdown sections.`;

export async function POST(request: NextRequest) {
  try {
    const { startupData, validation } = await request.json();

    if (!startupData || !startupData.description) {
      throw ApiErrors.badRequest("Se requiere información de la startup");
    }

    // Autenticación
    const { user } = await authenticateRequest(request);

    // Rate limiting
    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      throw ApiErrors.rateLimitExceeded(rateCheck.retryAfter);
    }

    // Build prompt
    const strengths = validation?.strengths?.top_3?.join("\n- ") || "No especificadas";
    const risks = validation?.risks?.top_3?.join("\n- ") || "No especificados";

    const prompt = IMPROVE_PROMPT
      .replace("{name}", startupData.name || "Sin nombre")
      .replace("{description}", startupData.description || "")
      .replace("{problem}", startupData.problem || "No especificado")
      .replace("{solution}", startupData.solution || "No especificada")
      .replace("{target_audience}", startupData.target_audience || "No especificada")
      .replace("{business_model}", startupData.business_model || "No especificado")
      .replace("{competitive_advantage}", startupData.competitive_advantage || "No especificada")
      .replace("{market_opportunity}", startupData.market_opportunity || "No especificada")
      .replace("{additional_context}", startupData.additional_context || "Ninguno")
      .replace("{viability_score}", validation?.viability_score?.toString() || "N/A")
      .replace("{technical_score}", validation?.technical_score?.toString() || "N/A")
      .replace("{market_score}", validation?.market_score?.toString() || "N/A")
      .replace("{competition_score}", validation?.competition_score?.toString() || "N/A")
      .replace("{business_model_score}", validation?.business_model_score?.toString() || "N/A")
      .replace("{context_score}", validation?.context_score?.toString() || "N/A")
      .replace("{strengths}", strengths)
      .replace("{risks}", risks);

    const messages: ChatMessage[] = [
      { role: "system", content: "You are an assistant. Provide structured suggestions in markdown." },
      { role: "user", content: prompt },
    ];

    const result = await generateContent(messages, { temperature: 0.7 });

    return NextResponse.json({
      improvements: result.content,
      tokensUsed: result.tokensUsed || 0,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/startup-builder/improve');
  }
}

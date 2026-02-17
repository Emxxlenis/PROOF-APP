/**
 * VitaCoach Multi-Agent API Route
 *
 * AI coaching system with specialized agents for different startup aspects.
 * Routes queries to appropriate agents and maintains conversation context.
 *
 * @module app/api/vitacoach
 */

import { NextRequest, NextResponse } from "next/server";
import { generateContent, getModelInfo, ChatMessage } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { handleApiError, validateRequestBody, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { rateLimiter, getRateLimitIdentifier, getClientIP } from "@/lib/rate-limiter";
import {
  ORCHESTRATOR_SYSTEM_PROMPT,
  VALIDATION_AGENT_SYSTEM_PROMPT,
  TECHNICAL_AGENT_SYSTEM_PROMPT,
  MARKET_AGENT_SYSTEM_PROMPT,
  SALES_AGENT_SYSTEM_PROMPT,
  FINANCE_AGENT_SYSTEM_PROMPT,
  PROGRESS_AGENT_SYSTEM_PROMPT,
} from "@/lib/prompts/vitacoach";
import type { AgentType } from "@/types/database";

/**
 * Processes a VitaCoach conversation request.
 *
 * Flow:
 * 1. Validate request body and agent type
 * 2. Authenticate user and check rate limits
 * 3. Fetch user's startup context (startup, validations, OKRs)
 * 4. Build enriched system prompt for selected agent
 * 5. Include conversation history (max 10 recent messages)
 * 6. Generate AI response
 *
 * @route POST /api/vitacoach
 *
 * @param request - NextRequest with JSON body
 * @returns JSON with AI response and token usage
 *
 * @throws {ApiError} 400 - Missing query or invalid agentType
 * @throws {ApiError} 401 - Not authenticated
 * @throws {ApiError} 429 - Rate limit exceeded
 * @throws {ApiError} 503 - AI service unavailable
 *
 * @example
 * Request body:
 * ```json
 * {
 *   "query": "How should I validate my MVP?",
 *   "agentType": "validation",
 *   "conversationHistory": [
 *     { "role": "user", "content": "Previous message" },
 *     { "role": "assistant", "content": "Previous response" }
 *   ]
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    validateRequestBody<{ query: string; agentType: AgentType; context?: any; conversationHistory?: any[]; startupId?: string }>(body, ['query', 'agentType']);

    const { query, agentType, context, conversationHistory, startupId } = body;

    const validAgentTypes: AgentType[] = ['orchestrator', 'validation', 'technical', 'market', 'sales', 'finance', 'progress'];
    if (!validAgentTypes.includes(agentType)) {
      throw ApiErrors.validationFailed(`agentType debe ser uno de: ${validAgentTypes.join(', ')}`);
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      throw ApiErrors.rateLimitExceeded(rateCheck.retryAfter);
    }

    const modelInfo = getModelInfo();
    logger.info("VitaCoach request", { userId: user.id, agentType, model: modelInfo.name, startupId });

    // Fetch student context from database - use startupId if provided, otherwise fallback to first startup
    let queryBuilder = supabaseClient
      .from("startups")
      .select("*");
    
    if (startupId) {
      queryBuilder = queryBuilder.eq("id", startupId).eq("student_id", user.id);
    } else {
      queryBuilder = queryBuilder.eq("student_id", user.id);
    }
    
    const { data: startup } = await queryBuilder.maybeSingle();

    const startupTyped = startup as any;

    const { data: validations } = startupTyped
      ? await supabaseClient
          .from("validations")
          .select("*")
          .eq("startup_id", startupTyped.id)
          .order("created_at", { ascending: false })
          .limit(3)
      : { data: [] };

    const { data: okrs } = startupTyped
      ? await supabaseClient
          .from("okrs")
          .select("*")
          .eq("startup_id", startupTyped.id)
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [] };

    const enrichedContext = {
      startup: startupTyped || null,
      validations: validations || [],
      okrs: okrs || [],
    };

    // Build OKRs summary for context injection
    const okrsSummary = okrs && okrs.length > 0
      ? okrs
          .map((okr: any, idx: number) =>
            `${idx + 1}. ${okr.objective} - KR1: ${okr.key_result_1} (${okr.kr1_status}), KR2: ${okr.key_result_2} (${okr.kr2_status}), KR3: ${okr.key_result_3} (${okr.kr3_status})`
          )
          .join("\n")
      : "No hay OKRs definidos";

    // Select base prompt for agent type
    let systemPrompt = ORCHESTRATOR_SYSTEM_PROMPT;
    const startupData = enrichedContext.startup as any;

    // Build compact startup context block
    const startupContext = startupData
      ? `\n\nCONTEXTO STARTUP:
- Nombre: ${startupData.name || "N/A"}
- Descripción: ${startupData.description || "N/A"}
- Etapa: ${startupData.stage || "ideation"}
- Problema: ${startupData.problem || "N/A"}
- Solución: ${startupData.solution || "N/A"}
- Audiencia: ${startupData.target_audience || "N/A"}
- Modelo: ${startupData.business_model || "N/A"}
${startupData.improvements ? `- Mejoras IA: ${startupData.improvements}` : ''}`
      : "\n\nCONTEXTO: Sin startup registrada.";

    const validationsContext = enrichedContext.validations && enrichedContext.validations.length > 0
      ? `\n\nVALIDACIONES:
${enrichedContext.validations
  .map((val: any, idx: number) =>
    `${idx + 1}. Score: ${val.viability_score}/100 (Téc:${val.technical_score} Mkt:${val.market_score} Comp:${val.competition_score} Mod:${val.business_model_score} Ctx:${val.context_score})`
  )
  .join("\n")}`
      : "";

    const okrsContext = `\n\nOKRs:\n${okrsSummary}`;

    // Build OKR evidence context for progress agent
    const okrEvidenceContext = context?.okrEvidence && context.okrEvidence.length > 0
      ? `\n\nEVIDENCIAS OKRs:
${context.okrEvidence.map((ev: any, idx: number) =>
  `${idx + 1}. "${ev.objective}" - ${ev.key_result}: ${ev.file_name}`
).join("\n")}`
      : "";

    const attachedFilesContext = context?.attachedFiles && context.attachedFiles.length > 0
      ? `\n\nARCHIVOS ADJUNTOS: ${context.attachedFiles.map((f: any) => f.name).join(", ")}`
      : "";

    // Configure agent-specific system prompt with context
    switch (agentType) {
      case "orchestrator":
        systemPrompt = ORCHESTRATOR_SYSTEM_PROMPT.replace(
          "{startup_name}",
          startupData?.name || "Sin startup"
        )
          .replace("{startup_stage}", startupData?.stage || "ideation")
          .replace(
            "{last_validation_score}",
            ((enrichedContext.validations?.[0] as any)?.viability_score?.toString()) || "N/A"
          )
          .replace("{current_okrs}", okrsSummary) + startupContext + validationsContext + okrsContext;
        break;
      case "validation":
        systemPrompt = VALIDATION_AGENT_SYSTEM_PROMPT + startupContext + validationsContext;
        break;
      case "technical":
        systemPrompt = TECHNICAL_AGENT_SYSTEM_PROMPT + startupContext + validationsContext;
        break;
      case "market":
        systemPrompt = MARKET_AGENT_SYSTEM_PROMPT + startupContext + validationsContext;
        break;
      case "sales":
        systemPrompt = SALES_AGENT_SYSTEM_PROMPT + startupContext + validationsContext;
        break;
      case "finance":
        systemPrompt = FINANCE_AGENT_SYSTEM_PROMPT + startupContext + validationsContext + okrsContext;
        break;
      case "progress":
        systemPrompt = PROGRESS_AGENT_SYSTEM_PROMPT + startupContext + okrsContext + okrEvidenceContext;
        break;
    }

    if (attachedFilesContext) {
      systemPrompt += attachedFilesContext;
    }

    // Build message array with history (limited to last 10 for context window)
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: { role: string; content: string }) => {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      });
    }

    messages.push({ role: "user", content: query });

    logger.debug("Calling AI for VitaCoach", { userId: user.id, agentType, messageCount: messages.length });

    // Extended timeout for conversational AI (2 minutes)
    const result = await generateContent(messages, {
      temperature: 0.7,
      timeout: 120000,
    });

    logger.info("VitaCoach response received", { userId: user.id, agentType, tokensUsed: result.tokensUsed });

    return NextResponse.json({
      success: true,
      response: result.content,
      tokensUsed: result.tokensUsed,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/vitacoach');
  }
}

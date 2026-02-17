import { NextRequest, NextResponse } from "next/server";
import { generateJSON, ChatMessage } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, validateRequestBody, validateUUID, ApiErrors } from "@/lib/api-error-handler";
import { rateLimiter, getRateLimitIdentifier, getClientIP } from "@/lib/rate-limiter";

const ANALYSIS_PROMPT = `Analiza las métricas y OKRs de esta startup:

STARTUP:
- Nombre: {name}
- Descripción: {description}
- Problema: {problem}
- Solución: {solution}
- Audiencia: {target_audience}
- Modelo: {business_model}
- Etapa: {stage}

MÉTRICAS: {metrics}

OKRs: {okrs}

Proporciona análisis JSON:
{
  "executive_summary": "Resumen 2-3 oraciones",
  "trends": [{"description": "tendencia", "type": "positive|negative|neutral"}],
  "improvement_areas": ["recomendación1", "recomendación2"],
  "next_steps": ["acción1", "acción2"],
  "health_score": 0-100
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    validateRequestBody<{ startupId: string }>(body, ['startupId']);
    validateUUID(body.startupId, 'startupId');

    const { startupId } = body;

    const { user, supabaseClient } = await authenticateRequest(request);
    
    // Rate limiting
    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      throw ApiErrors.rateLimitExceeded(rateCheck.retryAfter);
    }
    
    logger.info("Metrics AI analysis request", { userId: user.id, startupId });

    // Validar startup
    const { data: startup, error: startupError } = await supabaseClient
      .from('startups')
      .select('id, student_id, name, description, problem, solution, target_audience, business_model, stage')
      .eq('id', startupId)
      .single();

    if (startupError || !startup) {
      throw ApiErrors.notFound('Startup');
    }

    const startupTyped = startup as any;
    if (startupTyped.student_id !== user.id) {
      throw ApiErrors.forbidden('No eres dueño de esta startup');
    }

    // Obtener métricas
    const { data: metrics } = await supabaseClient
      .from('metrics')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Obtener OKRs
    const { data: okrs } = await supabaseClient
      .from('okrs')
      .select('*')
      .eq('startup_id', startupId)
      .order('week_number', { ascending: false })
      .limit(4);

    // Construir prompt
    const metricsSummary = metrics?.map((m: any) => ({
      date: m.created_at,
      views: m.views_count || 0,
      clicks: m.clicks_count || 0,
      conversions: m.conversions_count || 0,
    })) || [];

    const okrsSummary = okrs?.map((okr: any) => ({
      week: okr.week_number,
      objective: okr.objective,
      kr1: { name: okr.key_result_1, status: okr.kr1_status },
      kr2: { name: okr.key_result_2, status: okr.kr2_status },
      kr3: { name: okr.key_result_3, status: okr.kr3_status },
    })) || [];

    const prompt = ANALYSIS_PROMPT
      .replace("{name}", startupTyped.name || "Sin nombre")
      .replace("{description}", startupTyped.description || "Sin descripción")
      .replace("{problem}", startupTyped.problem || "No especificado")
      .replace("{solution}", startupTyped.solution || "No especificada")
      .replace("{target_audience}", startupTyped.target_audience || "No especificada")
      .replace("{business_model}", startupTyped.business_model || "No especificado")
      .replace("{stage}", startupTyped.stage || "No especificada")
      .replace("{metrics}", JSON.stringify(metricsSummary))
      .replace("{okrs}", JSON.stringify(okrsSummary));

    const messages: ChatMessage[] = [
      { role: "system", content: "You are an assistant. Analyze the metrics and provide actionable insights. Respond in the requested format." },
      { role: "user", content: prompt },
    ];

    const result = await generateJSON(messages, { temperature: 0.7, timeout: 60000 });

    logger.info("Metrics AI analysis completed", { userId: user.id, startupId });

    return NextResponse.json({
      success: true,
      analysis: result.data,
      metricsCount: metrics?.length || 0,
      okrsCount: okrs?.length || 0,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/metrics/analyze-with-ai');
  }
}

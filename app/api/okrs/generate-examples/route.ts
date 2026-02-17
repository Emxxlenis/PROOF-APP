import { NextRequest, NextResponse } from "next/server";
import { generateJSON, ChatMessage } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { handleApiError, validateRequestBody, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

const OKR_PROMPT = `Genera 3 ejemplos de OKRs para la Semana {weekNumber} de esta startup.

STARTUP:
- Nombre: {name}
- Descripción: {description}
- Problema: {problem}
- Solución: {solution}
- Audiencia: {target_audience}
- Modelo: {business_model}
- Etapa: {stage}

OKRs ANTERIORES:
{previousOKRs}

VALIDACIÓN:
{validation}

REQUISITOS:
- Relevantes para la etapa actual
- Progresivos respecto a OKRs anteriores
- Accionables y medibles
- Contexto colombiano cuando aplique

Responde SOLO JSON:
{
  "examples": [{
    "objective": "Objetivo principal para la semana",
    "key_result_1": "KR1 medible",
    "key_result_2": "KR2 medible",
    "key_result_3": "KR3 medible",
    "rationale": "Por qué este OKR es relevante ahora"
  }]
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    validateRequestBody<{ weekNumber?: number }>(body, []);

    const { user, supabaseClient } = await authenticateRequest(request);
    const { weekNumber } = body;

    // Obtener startup
    const { data: startup } = await supabaseClient
      .from("startups")
      .select("*")
      .eq("student_id", user.id)
      .single();

    if (!startup) {
      throw ApiErrors.notFound('Startup');
    }

    const startupTyped = startup as any;

    // Obtener OKRs anteriores
    const { data: previousOKRs } = await supabaseClient
      .from("okrs")
      .select("*")
      .eq("startup_id", startupTyped.id)
      .order("week_number", { ascending: false })
      .limit(3);

    // Obtener validación más reciente
    const { data: latestValidation } = await supabaseClient
      .from("validations")
      .select("*")
      .eq("startup_id", startupTyped.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Construir contexto
    const previousOKRsText = previousOKRs && previousOKRs.length > 0
      ? previousOKRs.map((okr: any) => 
          `Semana ${okr.week_number}: ${okr.objective}\n  - KR1: ${okr.key_result_1} (${okr.kr1_status})\n  - KR2: ${okr.key_result_2} (${okr.kr2_status})\n  - KR3: ${okr.key_result_3} (${okr.kr3_status})`
        ).join("\n")
      : "No hay OKRs anteriores.";

    const validationText = latestValidation
      ? `Score: ${(latestValidation as any).viability_score}/100`
      : "Sin validación disponible.";

    const prompt = OKR_PROMPT
      .replace("{weekNumber}", (weekNumber || 1).toString())
      .replace("{name}", startupTyped.name || "")
      .replace("{description}", startupTyped.description || "")
      .replace("{problem}", startupTyped.problem || "No especificado")
      .replace("{solution}", startupTyped.solution || "No especificada")
      .replace("{target_audience}", startupTyped.target_audience || "No especificada")
      .replace("{business_model}", startupTyped.business_model || "No especificado")
      .replace("{stage}", startupTyped.stage || "ideation")
      .replace("{previousOKRs}", previousOKRsText)
      .replace("{validation}", validationText);

    const messages: ChatMessage[] = [
      { role: "system", content: "You are an assistant. Generate example OKRs. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ];

    logger.info("Generating OKR examples", { userId: user.id, startupId: startupTyped.id });

    const result = await generateJSON(messages, { temperature: 0.7, timeout: 60000 });
    const examples = result.data.examples || [];

    logger.info("OKR examples generated", { userId: user.id, count: examples.length });

    return NextResponse.json({
      success: true,
      examples: examples.slice(0, 3),
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/okrs/generate-examples');
  }
}

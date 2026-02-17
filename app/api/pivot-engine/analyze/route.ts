/**
 * Pivot Engine Analysis API Route
 *
 * Multi-agent system for analyzing pivot opportunities.
 * Runs 4 specialized agents in parallel (market, technical, finance, validation)
 * and synthesizes their analyses through an orchestrator agent.
 *
 * @module app/api/pivot-engine/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, ChatMessage } from '@/lib/gemini';
import { logger } from '@/lib/logger';
import { handleApiError, validateRequestBody, validateUUID, ApiErrors } from '@/lib/api-error-handler';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { rateLimiter, getRateLimitIdentifier, getClientIP } from '@/lib/rate-limiter';
import {
  marketAgentPivotPrompt,
  technicalAgentPivotPrompt,
  financeAgentPivotPrompt,
  validationAgentPivotPrompt,
  orchestratorPivotPrompt,
} from '@/lib/prompts/pivot-agents';

/**
 * Analyzes pivot options using multi-agent AI system.
 *
 * Flow:
 * 1. Validate request body and UUIDs
 * 2. Authenticate and verify startup ownership
 * 3. Run 4 agents in parallel (Promise.all for efficiency)
 * 4. Synthesize results through orchestrator agent
 * 5. Persist analysis to database
 *
 * @route POST /api/pivot-engine/analyze
 *
 * @param request - NextRequest with startup context and constraints
 * @returns JSON with analysis from all agents and orchestrator recommendation
 *
 * @throws {ApiError} 400 - Missing required fields
 * @throws {ApiError} 403 - User doesn't own the startup
 * @throws {ApiError} 404 - Startup not found
 * @throws {ApiError} 429 - Rate limit exceeded
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    validateRequestBody<{
      startupId: string;
      studentId: string;
      currentSituation: any;
      marketData: any;
      constraints: any;
    }>(body, ['startupId', 'studentId', 'currentSituation', 'marketData', 'constraints']);

    validateUUID(body.startupId, 'startupId');
    validateUUID(body.studentId, 'studentId');

    const { user, supabaseClient } = await authenticateRequest(request);

    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      throw ApiErrors.rateLimitExceeded(rateCheck.retryAfter);
    }

    const { startupId, studentId, currentSituation, marketData, constraints } = body;

    logger.info("Pivot Engine analysis request", { userId: user.id, startupId });

    // Verify startup exists and user has ownership
    const { data: startup, error: startupError } = await supabaseClient
      .from('startups')
      .select('id, student_id, name, description, problem, solution, target_audience, business_model, competitive_advantage, market_opportunity, stage, created_at')
      .eq('id', startupId)
      .single();

    if (startupError || !startup) {
      throw ApiErrors.notFound('Startup');
    }

    const startupTyped = startup as any;
    if (startupTyped.student_id !== studentId || startupTyped.student_id !== user.id) {
      throw ApiErrors.forbidden('No eres dueño de esta startup');
    }

    // Execute parallel analysis with all 4 agents for optimal performance
    logger.info("Starting parallel pivot analysis", { startupId, userId: user.id });

    const [
      marketAnalysis,
      technicalAnalysis,
      financeAnalysis,
      validationAnalysis
    ] = await Promise.all([
      analyzeMarket(startup, currentSituation, marketData, constraints),
      analyzeTechnical(startup, currentSituation, constraints),
      analyzeFinance(startup, currentSituation, constraints),
      analyzeValidation(startup, currentSituation, marketData)
    ]);

    logger.info("Agent analysis completed", { startupId, userId: user.id });

    // Orchestrator synthesizes all agent analyses
    const orchestratorRecommendation = await synthesizeRecommendation(
      startup,
      marketAnalysis,
      technicalAnalysis,
      financeAnalysis,
      validationAnalysis
    );

    logger.info("Orchestrator recommendation completed", { startupId, userId: user.id });

    // Prepare pivot options for persistence
    const pivotOptions = [
      {
        name: orchestratorRecommendation.pivot_options_ranked[0]?.option_name || 'Opción 1',
        analysis: {
          market: marketAnalysis,
          technical: technicalAnalysis,
          finance: financeAnalysis,
          validation: validationAnalysis,
        },
      },
      {
        name: orchestratorRecommendation.pivot_options_ranked[1]?.option_name || 'Opción 2',
        analysis: {
          market: marketAnalysis,
          technical: technicalAnalysis,
          finance: financeAnalysis,
          validation: validationAnalysis,
        },
      },
      {
        name: orchestratorRecommendation.pivot_options_ranked[2]?.option_name || 'Opción 3',
        analysis: {
          market: marketAnalysis,
          technical: technicalAnalysis,
          finance: financeAnalysis,
          validation: validationAnalysis,
        },
      },
    ];

    // Persist analysis to database
    const { data: analysis, error: insertError } = await supabaseClient
      .from('pivot_analysis')
      .insert({
        startup_id: startupId,
        student_id: studentId,
        current_situation: currentSituation,
        market_data: marketData,
        constraints: constraints,
        pivot_options: pivotOptions,
        orchestrator_recommendation: orchestratorRecommendation,
        execution_status: 'analyzed',
      } as any)
      .select()
      .single() as { data: any | null; error: any | null };

    if (insertError) {
      logger.error("Error saving pivot analysis", insertError as Error, { startupId, userId: user.id });
      throw ApiErrors.internalError('Error al guardar el análisis');
    }

    logger.info("Pivot analysis saved successfully", { analysisId: (analysis as any)?.id, startupId, userId: user.id });

    return NextResponse.json({
      success: true,
      analysisId: (analysis as any)?.id,
      marketAnalysis,
      technicalAnalysis,
      financeAnalysis,
      validationAnalysis,
      orchestratorRecommendation,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/pivot-engine/analyze');
  }
}

/**
 * Market Agent: Analyzes alternative market opportunities.
 * @internal
 */
async function analyzeMarket(startup: any, situation: any, marketData: any, constraints: any) {
  try {
    const prompt = marketAgentPivotPrompt
      .replace('{startup_name}', startup.name || 'Sin nombre')
      .replace('{startup_description}', startup.description || 'Sin descripción')
      .replace('{startup_problem}', startup.problem || 'Sin problema')
      .replace('{startup_solution}', startup.solution || 'Sin solución')
      .replace('{startup_target_audience}', startup.target_audience || 'Sin audiencia')
      .replace('{startup_business_model}', startup.business_model || 'Sin modelo')
      .replace('{startup_competitive_advantage}', startup.competitive_advantage || 'Sin ventaja')
      .replace('{startup_market_opportunity}', startup.market_opportunity || 'Sin oportunidad')
      .replace('{current_market}', marketData.currentMarket || 'No especificado')
      .replace('{current_users}', situation.currentUsers || '0')
      .replace('{current_traction}', situation.currentTraction || 'Sin traction')
      .replace('{problems}', JSON.stringify(situation.problems || []))
      .replace('{alternative_markets}', JSON.stringify(marketData.alternativeMarkets || []));

    const messages: ChatMessage[] = [
      { role: "system", content: prompt },
      { role: "user", content: "Analiza los mercados alternativos y responde en JSON." },
    ];

    const result = await generateJSON(messages, { temperature: 0.7 });
    return result.data;
  } catch (error: any) {
    logger.error('Error in Market Agent', error as Error);
    return {
      error: error.message,
      market_analysis: [],
      recommended_markets: [],
      market_ranking: [],
    };
  }
}

/**
 * Technical Agent: Evaluates technical feasibility of pivot options.
 * @internal
 */
async function analyzeTechnical(startup: any, situation: any, constraints: any) {
  try {
    const techStack = constraints.techStack || startup.competitive_advantage || 'No especificado';
    const mvpDescription = startup.description || 'No especificado';
    const techDebt = constraints.techDebt || 'Baja';
    const teamSize = constraints.teamSize || 1;

    const pivotOptions = situation.pivotOptions || [
      'Cambio de mercado objetivo',
      'Cambio de modelo de negocio',
      'Cambio de stack tecnológico',
    ];

    const prompt = technicalAgentPivotPrompt
      .replace('{startup_name}', startup.name || 'Sin nombre')
      .replace('{startup_description}', startup.description || 'Sin descripción')
      .replace('{startup_problem}', startup.problem || 'Sin problema')
      .replace('{startup_solution}', startup.solution || 'Sin solución')
      .replace('{startup_competitive_advantage}', startup.competitive_advantage || 'Sin ventaja')
      .replace('{tech_stack}', techStack)
      .replace('{mvp_description}', mvpDescription)
      .replace('{tech_debt}', techDebt)
      .replace('{team_size}', teamSize.toString())
      .replace('{pivot_options}', JSON.stringify(pivotOptions));

    const messages: ChatMessage[] = [
      { role: "system", content: prompt },
      { role: "user", content: "Evalúa la factibilidad técnica de cada opción en JSON." },
    ];

    const result = await generateJSON(messages, { temperature: 0.7 });
    return result.data;
  } catch (error: any) {
    logger.error('Error in Technical Agent', error as Error);
    return {
      error: error.message,
      technical_analysis: [],
      feasibility_ranking: [],
    };
  }
}

/**
 * Finance Agent: Projects financial impact of pivot options.
 * @internal
 */
async function analyzeFinance(startup: any, situation: any, constraints: any) {
  try {
    const actualCac = constraints.actualCac || 0;
    const actualLtv = constraints.actualLtv || 0;
    const burnRate = constraints.burnRate || 0;
    const runway = constraints.runway || 0;
    const availableBudget = constraints.availableBudget || 0;

    const pivotOptions = situation.pivotOptions || [
      'Opción 1: Cambio de mercado',
      'Opción 2: Cambio de modelo',
      'Opción 3: Cambio de stack',
    ];

    const prompt = financeAgentPivotPrompt
      .replace('{startup_name}', startup.name || 'Sin nombre')
      .replace('{startup_description}', startup.description || 'Sin descripción')
      .replace('{startup_problem}', startup.problem || 'Sin problema')
      .replace('{startup_solution}', startup.solution || 'Sin solución')
      .replace('{startup_business_model}', startup.business_model || 'Sin modelo')
      .replace('{startup_target_audience}', startup.target_audience || 'Sin audiencia')
      .replace('{actual_cac}', actualCac.toString())
      .replace('{actual_ltv}', actualLtv.toString())
      .replace('{burn_rate}', burnRate.toString())
      .replace('{runway}', runway.toString())
      .replace('{available_budget}', availableBudget.toString())
      .replace('{pivot_options}', JSON.stringify(pivotOptions));

    const messages: ChatMessage[] = [
      { role: "system", content: prompt },
      { role: "user", content: "Proyecta las finanzas para cada opción en JSON." },
    ];

    const result = await generateJSON(messages, { temperature: 0.7 });
    return result.data;
  } catch (error: any) {
    logger.error('Error in Finance Agent', error as Error);
    return {
      error: error.message,
      finance_analysis: [],
      financial_viability_ranking: [],
    };
  }
}

/**
 * Validation Agent: Designs rapid validation plans for pivot options.
 * @internal
 */
async function analyzeValidation(startup: any, situation: any, marketData: any) {
  try {
    const pivotOption = situation.pivotOption || 'Opción de pivot';
    const targetMarket = marketData.targetMarket || marketData.currentMarket || 'Mercado objetivo';

    const prompt = validationAgentPivotPrompt
      .replace('{startup_name}', startup.name || 'Sin nombre')
      .replace('{startup_description}', startup.description || 'Sin descripción')
      .replace('{startup_problem}', startup.problem || 'Sin problema')
      .replace('{startup_solution}', startup.solution || 'Sin solución')
      .replace('{startup_target_audience}', startup.target_audience || 'Sin audiencia')
      .replace('{startup_business_model}', startup.business_model || 'Sin modelo')
      .replace('{pivot_option}', pivotOption)
      .replace('{target_market}', targetMarket);

    const messages: ChatMessage[] = [
      { role: "system", content: prompt },
      { role: "user", content: "Diseña un plan de validación rápida en JSON." },
    ];

    const result = await generateJSON(messages, { temperature: 0.7 });
    return result.data;
  } catch (error: any) {
    logger.error('Error in Validation Agent', error as Error);
    return {
      error: error.message,
      pivot_option: 'Error',
      critical_hypotheses: [],
      quick_validation_plan: {},
      key_metrics: [],
      go_no_go_criteria: 'Error en análisis',
    };
  }
}

/**
 * Orchestrator Agent: Synthesizes all agent analyses into final recommendation.
 * @internal
 */
async function synthesizeRecommendation(
  startup: any,
  marketAnalysis: any,
  technicalAnalysis: any,
  financeAnalysis: any,
  validationAnalysis: any
) {
  try {
    const prompt = orchestratorPivotPrompt
      .replace('{startup_name}', startup.name || 'Sin nombre')
      .replace('{startup_description}', startup.description || 'Sin descripción')
      .replace('{startup_problem}', startup.problem || 'Sin problema')
      .replace('{startup_solution}', startup.solution || 'Sin solución')
      .replace('{startup_target_audience}', startup.target_audience || 'Sin audiencia')
      .replace('{startup_business_model}', startup.business_model || 'Sin modelo')
      .replace('{startup_competitive_advantage}', startup.competitive_advantage || 'Sin ventaja')
      .replace('{startup_market_opportunity}', startup.market_opportunity || 'Sin oportunidad')
      .replace('{market_analysis}', JSON.stringify(marketAnalysis))
      .replace('{technical_analysis}', JSON.stringify(technicalAnalysis))
      .replace('{finance_analysis}', JSON.stringify(financeAnalysis))
      .replace('{validation_analysis}', JSON.stringify(validationAnalysis));

    const messages: ChatMessage[] = [
      { role: "system", content: prompt },
      { role: "user", content: "Sintetiza los análisis y da tu recomendación final en JSON." },
    ];

    const result = await generateJSON(messages, { temperature: 0.7 });
    return result.data;
  } catch (error: any) {
    logger.error('Error in Orchestrator', error as Error);
    return {
      error: error.message,
      pivot_options_ranked: [],
      orchestrator_recommendation: {
        recommended_option: 'Error en análisis',
        confidence: 0,
        rationale: 'Error al sintetizar',
        next_steps: [],
        timeline: 'Error',
      },
      alternative_plan: {
        if_pivot_fails: 'Reanalizar',
        fallback_options: [],
        exit_criteria: 'Error',
      },
      decision_confidence: 0,
      key_insights: [],
    };
  }
}

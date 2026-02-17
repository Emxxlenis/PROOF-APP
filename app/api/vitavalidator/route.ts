/**
 * VitaValidator API Route
 *
 * Validates startup ideas using AI analysis across 5 dimensions:
 * technical feasibility, market opportunity, competition,
 * business model, and Colombian context.
 *
 * @module app/api/vitavalidator
 */

import { NextRequest, NextResponse } from "next/server";
import { generateJSON, generateContent, getModelInfo, ChatMessage } from "@/lib/gemini";
import { VITAVALIDATOR_SYSTEM_PROMPT, VITAVALIDATOR_USER_PROMPT } from "@/lib/prompts/vitavalidator";
import { handleApiError, validateRequestBody, validateStringLength, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { rateLimiter, getRateLimitIdentifier, getClientIP } from "@/lib/rate-limiter";

/**
 * Validates a startup idea and optionally persists results.
 *
 * Flow:
 * 1. Validate request body (description required, min 10 chars)
 * 2. Authenticate user via session/token
 * 3. Check rate limit (15 req/min, 1500 req/day)
 * 4. Call AI for multi-dimensional analysis
 * 5. Ensure user and startup records exist (create if needed)
 * 6. Optionally save validation results (if save=true)
 * 7. Update startup stage based on viability score
 *
 * @route POST /api/vitavalidator
 *
 * @param request - NextRequest with JSON body
 * @returns JSON with validation result and scores
 *
 * @throws {ApiError} 400 - Invalid or missing description
 * @throws {ApiError} 401 - Not authenticated
 * @throws {ApiError} 429 - Rate limit exceeded
 * @throws {ApiError} 503 - AI service unavailable
 *
 * @example
 * Request body:
 * ```json
 * {
 *   "description": "App de reciclaje gamificada para jóvenes colombianos",
 *   "save": true
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "result": {
 *     "viability_score": 75,
 *     "technical_score": 80,
 *     ...
 *   },
 *   "saved": true
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    validateRequestBody<{ description: string; save?: boolean; startupId?: string }>(body, ['description']);
    validateStringLength(body.description, 10, 'description');

    const { user, supabaseClient } = await authenticateRequest(request);

    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      throw ApiErrors.rateLimitExceeded(rateCheck.retryAfter);
    }

    const description = body.description;
    const modelInfo = getModelInfo();
    logger.info("Calling AI for validation", { userId: user.id, model: modelInfo.name, type: modelInfo.type });

    const messages: ChatMessage[] = [
      { role: "system", content: VITAVALIDATOR_SYSTEM_PROMPT },
      { role: "user", content: VITAVALIDATOR_USER_PROMPT(description) },
    ];

    let validationResult;
    try {
      const result = await generateJSON(messages, {
        temperature: 0.7,
        timeout: 60000,
      });
      validationResult = result.data;
      logger.debug("AI response received", { userId: user.id, tokensUsed: result.tokensUsed });
    } catch (aiError: any) {
      logger.error("Error calling AI", aiError as Error, { userId: user.id, model: modelInfo.name, errorMessage: aiError?.message });
      throw ApiErrors.aiServiceUnavailable();
    }

    // Ensure user exists in users table (handles first-time validation)
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (userCheckError && userCheckError.code !== "PGRST116") {
      logger.warn("Error checking user", { error: userCheckError.message, userId: user.id });
    }

    if (!existingUser) {
      logger.debug("User does not exist in users table, creating", { userId: user.id });

      const userRole = user.user_metadata?.role === "mentor" ? "mentor" : "student";

      const { error: userCreateError } = await supabaseClient
        .from("users")
        .insert({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          role: userRole,
        } as any)
        .select()
        .single();

      if (userCreateError) {
        // Handle race condition where user was created by parallel request
        if (userCreateError.code === "23505") {
          logger.debug("User already exists (race condition)", { userId: user.id });
        } else {
          logger.warn("Could not create user manually", {
            error: userCreateError.message,
            userId: user.id,
          });
        }
      } else {
        logger.info("User created in users table", { userId: user.id });
      }
    }

    // Get startup record only if needed (for saving) or if startupId is provided
    let startup: any | null = null;
    
    // Only fetch startup if:
    // 1. User wants to save the validation (save=true), OR
    // 2. User provided a specific startupId
    const needsStartup = body.save === true || body.startupId;
    
    if (needsStartup) {
      if (body.startupId) {
        // Use the provided startupId and verify ownership
        const { data: startupData, error: error } = await supabaseClient
          .from("startups")
          .select("*")
          .eq("id", body.startupId)
          .eq("student_id", user.id)
          .single() as { data: any | null; error: any | null };
        
        if (error && error.code !== "PGRST116") {
          logger.error("Error fetching startup by ID", error as Error, { startupId: body.startupId, userId: user.id });
          throw ApiErrors.internalError(
            `Error al acceder a la base de datos: ${error.message}.`
          );
        }
        
        if (!startupData) {
          logger.error("Startup not found or access denied", undefined, { startupId: body.startupId, userId: user.id });
          throw ApiErrors.notFound("Proyecto no encontrado o no tienes acceso a él.");
        }
        
        startup = startupData;
      } else {
        // Find by student_id (for backward compatibility when saving)
        const result = await supabaseClient
          .from("startups")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false })
          .maybeSingle() as { data: any | null; error: any | null };
        
        if (result.error && result.error.code !== "PGRST116") {
          logger.error("Error fetching startup", result.error as Error, { userId: user.id });
          throw ApiErrors.internalError(
            `Error al acceder a la base de datos: ${result.error.message}.`
          );
        }
        
        startup = result.data;
      }

      // If trying to save but no startup found, require project creation
      if (body.save === true && !startup) {
        logger.warn("Attempt to save validation without startup", { userId: user.id, startupId: body.startupId });
        throw ApiErrors.notFound(
          "No se encontró un proyecto. Por favor, crea un proyecto primero antes de guardar la validación."
        );
      }

      // Verificación de ownership ya está hecha al buscar por startupId (eq("student_id", user.id))
      // No necesitamos verificar nuevamente si ya lo encontramos con el filtro correcto
    }

    // Only persist if explicitly requested
    const shouldSave = body.save === true;

    if (shouldSave) {
      // At this point, startup should exist (checked above)
      if (!startup || !startup.id) {
        throw ApiErrors.notFound(
          "No se encontró un proyecto. Por favor, crea un proyecto primero antes de guardar la validación."
        );
      }

      const startupTyped = startup as any;

      // Generar descripción corta con IA basada en la validación (sin nombres)
      let aiDescription = startupTyped.description; // Mantener la descripción actual por defecto
      
      try {
        const descriptionPrompt = `Summarize this startup validation in one short professional description (max 200 chars). Validation score: ${validationResult.viability_score}/100. Input: ${description.substring(0, 300)}. Respond with plain text only, no names.`;

        const descriptionMessages: ChatMessage[] = [
          { role: "system", content: "You are an assistant. Generate a short professional summary. Plain text only." },
          { role: "user", content: descriptionPrompt },
        ];

        const descriptionResult = await generateContent(descriptionMessages, {
          temperature: 0.7,
          timeout: 30000,
        });

        if (descriptionResult?.content) {
          // Limpiar la respuesta (quitar comillas, espacios extra)
          aiDescription = descriptionResult.content
            .trim()
            .replace(/^["']|["']$/g, '') // Quitar comillas al inicio/final
            .substring(0, 500); // Limitar a 500 caracteres
        }
      } catch (descError: any) {
        logger.warn("Error generating AI description", { 
          startupId: startupTyped.id,
          error: descError instanceof Error ? descError.message : String(descError)
        });
        // Si falla la generación, usar la descripción original pero truncada
        aiDescription = description.substring(0, 500);
      }

      // Actualizar SOLO la descripción, NO el nombre (el nombre lo da el usuario)
      logger.debug("Updating startup description (keeping name)", { startupId: startupTyped.id, userId: user.id });
      const updateResult = await ((supabaseClient
        .from("startups") as any)
        .update({
          description: aiDescription,
          // NO actualizar el nombre - mantener el que el usuario puso
        })
        .eq("id", startupTyped.id));
      const { error: updateDescError } = (updateResult || { error: null }) as { error: any | null };

      if (updateDescError) {
        logger.warn("Error updating startup description", { error: updateDescError.message, startupId: startupTyped.id });
      } else {
        logger.debug("Startup description updated (name preserved)", { startupId: startupTyped.id });
        startupTyped.description = aiDescription;
        // NO actualizar startupTyped.name - mantener el original
      }

      logger.info("Saving validation to database", { startupId: startupTyped.id, userId: user.id });
      const { data: validationData, error: validationError } = await supabaseClient
        .from("validations")
        .insert({
          startup_id: startupTyped.id,
          viability_score: validationResult.viability_score,
          technical_score: validationResult.technical_score,
          market_score: validationResult.market_score,
          competition_score: validationResult.competition_score,
          business_model_score: validationResult.business_model_score,
          context_score: validationResult.context_score,
          strengths: validationResult.strengths,
          risks: validationResult.risks,
          recommendations: validationResult.recommendations,
        } as any)
        .select()
        .single();

      if (validationError) {
        logger.error("Error creating validation", validationError as Error, {
          startupId: startupTyped.id,
          userId: user.id,
          errorCode: validationError.code,
        });

        if (validationError.code === '42501' || validationError.message.includes('row-level security')) {
          throw ApiErrors.forbidden(
            `Error de permisos (RLS): ${validationError.message}.`
          );
        }

        throw ApiErrors.internalError(`Error al guardar validación: ${validationError.message}`);
      }

      logger.info("Validation saved successfully", { validationId: (validationData as any)?.id, startupId: startupTyped.id, userId: user.id });

      // Stage transition logic: advance to validation if score >= 70, revert to ideation if < 70
      const shouldBeInValidation = validationResult.viability_score >= 70;
      const currentStage = startupTyped.stage;
      let newStage = currentStage;

      if (shouldBeInValidation) {
        if (currentStage === "ideation") {
          newStage = "validation";
          logger.info("Advancing startup stage", {
            startupId: startupTyped.id,
            from: currentStage,
            to: newStage,
            score: validationResult.viability_score,
          });
        }
      } else {
        if (currentStage === "validation" || currentStage === "mvp" || currentStage === "first_sale" || currentStage === "growth") {
          newStage = "ideation";
          logger.info("Reverting startup stage", {
            startupId: startupTyped.id,
            from: currentStage,
            to: newStage,
            score: validationResult.viability_score,
          });
        }
      }

      if (newStage !== currentStage) {
        const updateResult = await ((supabaseClient
          .from("startups") as any)
          .update({ stage: newStage })
          .eq("id", startupTyped.id));
        const { error: updateError } = (updateResult || { error: null }) as { error: any | null };

        if (updateError) {
          logger.warn("Error updating startup stage", {
            error: updateError.message,
            startupId: startupTyped.id,
            from: currentStage,
            to: newStage,
          });
        } else {
          logger.info("Startup stage updated", {
            startupId: startupTyped.id,
            from: currentStage,
            to: newStage,
          });
        }
      }
    } else {
      logger.info("Validation result returned without saving", { 
        hasStartup: !!startup, 
        startupId: startup?.id || null, 
        userId: user.id 
      });
    }

    return NextResponse.json({ success: true, result: validationResult, saved: shouldSave });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/vitavalidator');
  }
}

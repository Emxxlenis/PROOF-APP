import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validateRequestBody, validateUUID, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { z } from "zod";

const SeanEllisTestSchema = z.object({
  startupId: z.string().uuid("startupId debe ser un UUID válido"),
  landingPageId: z.string().uuid().optional(),
  respondentEmail: z.string().email().optional(),
  respondentName: z.string().optional(),
  question1Score: z.enum(["very_disappointed", "somewhat_disappointed", "not_disappointed", "does_not_apply"]),
  question2Score: z.enum(["very_disappointed", "somewhat_disappointed", "not_disappointed", "does_not_apply"]).optional(),
  question3Score: z.enum(["very_disappointed", "somewhat_disappointed", "not_disappointed", "does_not_apply"]).optional(),
  additionalFeedback: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validar request body
    const body = await request.json();
    
    // Validar con Zod
    const validationResult = SeanEllisTestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      startupId,
      landingPageId,
      respondentEmail,
      respondentName,
      question1Score,
      question2Score,
      question3Score,
      additionalFeedback,
    } = validationResult.data;

    const { user, supabaseClient } = await authenticateRequest(request);

    // Get startup to find student_id
    const { data: startup, error: startupError } = await supabaseClient
      .from("startups")
      .select("student_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      throw ApiErrors.notFound('Startup');
    }

    // Calculate total score
    const scoreMap: Record<string, number> = {
      very_disappointed: 3,
      somewhat_disappointed: 2,
      not_disappointed: 1,
      does_not_apply: 0,
    };

    const scores = [question1Score, question2Score, question3Score].filter(Boolean);
    const totalScore = scores.reduce((sum, score) => sum + (scoreMap[score as string] || 0), 0);
    const maxScore = scores.length * 3;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passedThreshold = percentage >= 40; // 40% rule

    // Save Sean Ellis test
    const { data: seanEllisTest, error: insertError } = await supabaseClient
      .from("sean_ellis_tests")
      .insert({
        startup_id: startupId,
        student_id: startup.student_id,
        landing_page_id: landingPageId || null,
        respondent_email: respondentEmail || null,
        respondent_name: respondentName || null,
        question_1_score: question1Score,
        question_2_score: question2Score || null,
        question_3_score: question3Score || null,
        additional_feedback: additionalFeedback || null,
        total_score: totalScore,
        passed_threshold: passedThreshold,
      })
      .select()
      .single();

    if (insertError) {
      throw ApiErrors.internalError(`Error al guardar: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      seanEllisTest,
      percentage: Math.round(percentage),
      passedThreshold,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/validation/sean-ellis');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get("startupId");
    const landingPageId = searchParams.get("landingPageId");

    if (!startupId) {
      throw ApiErrors.badRequest('startupId es requerido');
    }

    validateUUID(startupId, 'startupId');

    const { user, supabaseClient } = await authenticateRequest(request);

    if (!user) {
      throw ApiErrors.unauthorized();
    }

    // Verificar que el usuario tiene acceso a esta startup
    const { data: startup, error: startupError } = await supabaseClient
      .from("startups")
      .select("student_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      throw ApiErrors.notFound('Startup');
    }

    // Solo el dueño de la startup puede ver sus tests
    if ((startup as any).student_id !== user.id) {
      throw ApiErrors.forbidden('No tienes acceso a esta startup');
    }

    let query = supabaseClient
      .from("sean_ellis_tests")
      .select("*")
      .eq("startup_id", startupId);

    if (landingPageId) {
      query = query.eq("landing_page_id", landingPageId);
    }

    const { data: tests, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw ApiErrors.internalError(error.message);
    }

    // Calculate aggregate statistics
    const totalTests = tests?.length || 0;
    const passedTests = tests?.filter((t: any) => t.passed_threshold).length || 0;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const avgScore = totalTests > 0
      ? tests?.reduce((sum: number, t: any) => sum + (t.total_score || 0), 0) / totalTests
      : 0;

    return NextResponse.json({
      tests: tests || [],
      statistics: {
        totalTests,
        passedTests,
        passRate: Math.round(passRate),
        avgScore: Math.round(avgScore),
      },
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/validation/sean-ellis');
  }
}



import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError, validateUUID, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    validateUUID(projectId, 'projectId');

    // Autenticación
    const { user, supabaseClient } = await authenticateRequest(request);

    // Get Sean Ellis tests for this project
    const { data: tests, error: testsError } = await supabaseClient
      .from("sean_ellis_tests")
      .select("*")
      .eq("startup_id", projectId)
      .order("created_at", { ascending: false });

    if (testsError) {
      return NextResponse.json(
        { error: `Error al obtener tests: ${testsError.message}` },
        { status: 500 }
      );
    }

    const totalTests = tests?.length || 0;
    
    // Need at least 10 responses for reliable data
    if (totalTests < 10) {
      return NextResponse.json({
        status: "needs_more_data",
        message: `Necesitas al menos 10 respuestas. Actualmente tienes ${totalTests}.`,
        totalTests,
        percentageDisappointed: null,
        signal: null,
      });
    }

    // Calculate percentage "very disappointed"
    const veryDisappointedCount = tests?.filter(
      (t: any) => t.question_1_score === "very_disappointed"
    ).length || 0;
    
    const percentageDisappointed = totalTests > 0
      ? (veryDisappointedCount / totalTests) * 100
      : 0;

    // Determine status based on 40% rule
    let status: string;
    let signal: string;
    let message: string;

    if (percentageDisappointed >= 40) {
      status = "validated";
      signal = "strong";
      message = "✅ VALIDADA: Tu idea tiene un fuerte product-market fit. El 40%+ de usuarios estarían muy decepcionados si desapareciera.";
    } else if (percentageDisappointed >= 20) {
      status = "unclear";
      signal = "medium";
      message = "🟡 NECESITA MÁS VALIDACIÓN: Hay interés pero no suficiente. Considera pivotear o mejorar tu propuesta de valor.";
    } else {
      status = "rejected";
      signal = "weak";
      message = "🔴 RECHAZADA: Menos del 20% estarían muy decepcionados. Considera pivotear tu idea o encontrar un problema más urgente.";
    }

    return NextResponse.json({
      status,
      signal,
      message,
      totalTests,
      percentageDisappointed: Math.round(percentageDisappointed),
      veryDisappointedCount,
      qualifiesForMVP: status === "validated",
      suggestion: status === "rejected" 
        ? "Considera pivotear tu idea o encontrar un problema más urgente para tu audiencia."
        : status === "unclear"
        ? "Mejora tu propuesta de valor y vuelve a validar."
        : "¡Excelente! Puedes proceder con el MVP Builder.",
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/projects/[id]/validation-status');
  }
}



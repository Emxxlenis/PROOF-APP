import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get("startupId");

    if (!startupId) {
      throw ApiErrors.badRequest("startupId es requerido");
    }

    const { supabaseClient } = await authenticateRequest(request);

    // Get NPS surveys
    const { data: surveys } = await supabaseClient
      .from("nps_surveys")
      .select("*")
      .eq("startup_id", startupId)
      .order("survey_date", { ascending: false });

    if (!surveys || surveys.length === 0) {
      return NextResponse.json({
        nps: 0,
        total: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        surveys: [],
      });
    }

    const promoters = surveys.filter((s: any) => s.category === "promoter").length;
    const passives = surveys.filter((s: any) => s.category === "passive").length;
    const detractors = surveys.filter((s: any) => s.category === "detractor").length;
    const total = surveys.length;

    const nps = Math.round(((promoters - detractors) / total) * 100);

    return NextResponse.json({
      nps,
      total,
      promoters,
      passives,
      detractors,
      surveys: surveys.slice(0, 50), // Return last 50
    });
  } catch (error: any) {
    return handleApiError(error, "GET /api/metrics/nps");
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      startupId,
      respondentEmail,
      respondentName,
      score,
      feedbackText,
    } = await request.json();

    if (!startupId || score === undefined) {
      throw ApiErrors.badRequest("startupId y score son requeridos");
    }

    if (score < 0 || score > 10) {
      throw ApiErrors.badRequest("Score debe estar entre 0 y 10");
    }

    const { supabaseClient } = await authenticateRequest(request);

    // Get startup
    const { data: startup } = await supabaseClient
      .from("startups")
      .select("student_id")
      .eq("id", startupId)
      .single();

    if (!startup) {
      throw ApiErrors.notFound("Startup");
    }

    // Determine category
    let category: "promoter" | "passive" | "detractor";
    if (score >= 9) {
      category = "promoter";
    } else if (score >= 7) {
      category = "passive";
    } else {
      category = "detractor";
    }

    // Save survey
    const { data: survey, error: insertError } = await supabaseClient
      .from("nps_surveys")
      .insert({
        startup_id: startupId,
        respondent_email: respondentEmail || null,
        respondent_name: respondentName || null,
        score,
        category,
        feedback_text: feedbackText || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error al guardar: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      survey,
    });
  } catch (error: any) {
    return handleApiError(error, "POST /api/metrics/nps");
  }
}

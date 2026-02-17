import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validateUUID, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const landingPageId = params.id;
    validateUUID(landingPageId, 'landingPageId');

    // Autenticación
    const { user, supabaseClient } = await authenticateRequest(request);

    // Get landing page
    const { data: landingPage, error: fetchError } = await supabaseClient
      .from("landing_pages")
      .select("*")
      .eq("id", landingPageId)
      .single() as { data: any | null; error: any | null };

    if (fetchError || !landingPage) {
      throw ApiErrors.notFound('Landing page');
    }

    const landingPageTyped = landingPage as any;
    // Check ownership
    if (landingPageTyped.student_id !== user.id) {
      throw ApiErrors.forbidden('No eres dueño de esta landing page');
    }

    // Validate that landing page is complete
    if (!landingPageTyped.headline || !landingPageTyped.html_content) {
      throw ApiErrors.validationFailed("La landing page no está completa. Faltan campos requeridos.");
    }

    // Generate unique slug/URL
    const slug = landingPageTyped.published_url || 
      `${landingPageTyped.id.substring(0, 8)}-${Date.now().toString(36)}`;
    
    const publishedUrl = `/l/${slug}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${publishedUrl}`;

    // Update landing page to published
    const updateResult = await ((supabaseClient
      .from("landing_pages") as any)
      .update({
        status: "published",
        published_url: slug,
        published_at: new Date().toISOString(),
      })
      .eq("id", landingPageId)
      .select()
      .single());
    const { data: updatedLandingPage, error: updateError } = (updateResult || { data: null, error: null }) as { data: any | null; error: any | null };

    if (updateError) {
      throw ApiErrors.internalError(`Error al publicar: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      landingPage: updatedLandingPage,
      publishedUrl: fullUrl,
      slug: slug,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/landing-pages/[id]/publish');
  }
}



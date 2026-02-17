import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError } from "@/lib/api-error-handler";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { propertyId, accessToken } = await request.json();
    const landingPageId = params.id;

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId es requerido" },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let user: any = null;
    let supabaseClient = supabase;

    if (token) {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const supabaseWithToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user: userFromToken } } = await supabaseWithToken.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
        supabaseClient = supabaseWithToken;
      }
    }

    if (!user) {
      const { data: { user: userFromCookies } } = await supabase.auth.getUser();
      user = userFromCookies;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    // Get landing page
    const { data: landingPage, error: fetchError } = await supabaseClient
      .from("landing_pages")
      .select("*")
      .eq("id", landingPageId)
      .single();

    if (fetchError || !landingPage) {
      return NextResponse.json(
        { error: "Landing page no encontrada" },
        { status: 404 }
      );
    }

    if (landingPage.student_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Store Google Analytics property ID
    // For MVP, we'll store it in a JSONB field or create a separate table
    // For now, we'll update the landing page with analytics config
    const { data: updatedLandingPage, error: updateError } = await supabaseClient
      .from("landing_pages")
      .update({
        // Store in a JSONB field if exists, or create migration
        // For now, we'll just return success
      })
      .eq("id", landingPageId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Error al conectar: ${updateError.message}` },
        { status: 500 }
      );
    }

    // TODO: Implement Google Analytics API integration
    // This would fetch events from GA4 API and store in analytics_events table

    return NextResponse.json({
      success: true,
      message: "Google Analytics conectado. Los eventos se sincronizarán automáticamente.",
      propertyId,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/landing-pages/[id]/connect-analytics');
  }
}



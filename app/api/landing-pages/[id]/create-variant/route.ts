import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError } from "@/lib/api-error-handler";
import { openai, MODEL_NAME } from "@/lib/openai";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { variantType, variantName, customContent } = await request.json();
    const landingPageId = params.id;

    if (!variantType || !variantName) {
      return NextResponse.json(
        { error: "variantType y variantName son requeridos" },
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

    // Get original landing page
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

    // Get startup data for context
    const { data: startup } = await supabaseClient
      .from("startups")
      .select("*")
      .eq("id", landingPage.startup_id)
      .single();

    // Generate variant with AI
    const prompt = `Genera una variante ${variantType} para esta landing page:

Original:
- Headline: ${landingPage.headline}
- Subheadline: ${landingPage.subheadline}
- CTA: ${landingPage.cta_text}

Startup: ${startup?.name || "Startup"}
Descripción: ${startup?.description || ""}

Variante: ${variantName}
Tipo: ${variantType}

${customContent ? `Contenido personalizado: ${customContent}` : ""}

Genera HTML y CSS para la variante. Responde SOLO con JSON:
{
  "html_content": "<html>...</html>",
  "css_content": "<style>...</style>"
}`;

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are an assistant. Generate landing page variants. Respond in the requested format." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return NextResponse.json(
        { error: "No se recibió respuesta de la IA" },
        { status: 500 }
      );
    }

    let variantData;
    try {
      variantData = JSON.parse(responseContent);
    } catch (parseError: any) {
      return NextResponse.json(
        { error: `Error al procesar respuesta: ${parseError.message}` },
        { status: 500 }
      );
    }

    // Create variant
    const { data: variant, error: insertError } = await supabaseClient
      .from("landing_page_variants")
      .insert({
        landing_page_id: landingPageId,
        variant_type: variantType,
        variant_name: variantName,
        html_content: variantData.html_content,
        css_content: variantData.css_content,
        traffic_percentage: 50.00, // Default 50/50 split
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Error al crear variante: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      variant,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/landing-pages/[id]/create-variant');
  }
}



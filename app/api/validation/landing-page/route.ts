import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateJSON, isGeminiAvailable, ChatMessage } from "@/lib/gemini";
import { rateLimiter, getRateLimitIdentifier, getClientIP } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import { handleApiError, validateRequestBody, validateUUID, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

type LandingPagePayload = {
  title?: string;
  headline?: string;
  subheadline?: string;
  description?: string;
  cta_text?: string;
  html_content?: string;
  css_content?: string;
};

// Paletas de colores por template
const TEMPLATE_STYLES: Record<string, { colors: string; style: string }> = {
  modern: {
    colors: "primary:#3b82f6, secondary:#8b5cf6, accent:#f59e0b, bg:#ffffff, text:#1f2937",
    style: "Gradientes sutiles, bordes redondeados (1rem), sombras medias, tipografía Inter/sans-serif"
  },
  minimal: {
    colors: "primary:#111827, secondary:#6b7280, accent:#2563eb, bg:#ffffff, text:#111827",
    style: "Mucho espacio blanco, sin gradientes, bordes finos, tipografía elegante, max-width:800px"
  },
  bold: {
    colors: "primary:#ec4899, secondary:#6366f1, accent:#f97316, bg:#fdf2f8, text:#1f2937",
    style: "Colores vibrantes, gradientes audaces, tipografía grande (4-5rem hero), elementos llamativos"
  },
  professional: {
    colors: "primary:#1e3a8a, secondary:#0f172a, accent:#10b981, bg:#f8fafc, text:#0f172a",
    style: "Diseño corporativo, colores sobrios, layout estructurado, aspecto confiable"
  }
};

function extractInlineCss(html: string): string {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1].trim() : "";
}

function validateHtml(html: string | undefined): string[] {
  const issues: string[] = [];
  if (!html) {
    issues.push("No se recibió html_content");
    return issues;
  }
  if (html.length < 2000) issues.push(`HTML muy corto (${html.length} chars)`);
  if (!/<style[\s\S]*?>[\s\S]{500,}<\/style>/i.test(html)) issues.push("CSS insuficiente");
  if (!/<section/i.test(html)) issues.push("Faltan secciones HTML");
  
  // Validación más flexible de placeholders - solo detectar si son obvios y no están en comentarios
  const placeholderPattern = /\{ *\.\.\. *\}|TODO[^<]*>|PLACEHOLDER[^<]*>/i;
  const htmlWithoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  if (placeholderPattern.test(htmlWithoutComments)) {
    // Limpiar placeholders comunes antes de reportar
    const cleanedHtml = htmlWithoutComments
      .replace(/\{ *\.\.\. *\}/g, '')
      .replace(/TODO[^<]*>/gi, '')
      .replace(/PLACEHOLDER[^<]*>/gi, '');
    
    // Solo reportar si quedan placeholders después de limpiar
    if (placeholderPattern.test(cleanedHtml)) {
      issues.push("Contiene placeholders");
    }
  }
  
  return issues;
}

export async function POST(request: NextRequest) {
  try {
    // Validar request body
    const body = await request.json();
    validateRequestBody<{ startupId: string; templateName?: string; customContent?: any }>(body, ['startupId']);
    validateUUID(body.startupId, 'startupId');

    // Autenticación
    const { user, supabaseClient } = await authenticateRequest(request);
    
    const { startupId, templateName = "modern", customContent } = body;

    // Obtener startup
    const { data: startup, error: startupError } = await supabaseClient
      .from("startups")
      .select("*")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      throw ApiErrors.notFound('Startup');
    }

    const startupTyped = startup as any;
    if (startupTyped.student_id !== user.id) {
      throw ApiErrors.forbidden('No eres dueño de esta startup');
    }

    if (!isGeminiAvailable()) {
      throw ApiErrors.internalError("Gemini no está configurado. Configura GOOGLE_GEMINI_API_KEY en .env.local");
    }

    // Rate limiting para Gemini API
    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      const retryAfter = rateCheck.retryAfter || 60;
      throw ApiErrors.rateLimitExceeded(retryAfter);
    }

    const style = TEMPLATE_STYLES[templateName] || TEMPLATE_STYLES.modern;

    const prompt = `Generate a complete HTML5 landing page. Startup: ${startupTyped.name}, ${startupTyped.description || ""}, problem: ${startupTyped.problem || ""}, solution: ${startupTyped.solution || ""}, audience: ${startupTyped.target_audience || ""}. Style: ${templateName}, colors: ${style.colors}. ${customContent ? `Extra: ${customContent}` : ""} Respond with valid JSON: { "title", "headline", "subheadline", "description", "cta_text", "html_content" }. Use inline CSS and data URIs for images, no external URLs.`;

    const systemInstruction = "You are an assistant. Generate a complete HTML5 landing page with inline CSS. Respond with valid JSON only. No placeholders.";

    logger.info("Generating landing page with Gemini", { templateName, startupId: startupTyped.id, startupName: startupTyped.name });

    let landingPageData: LandingPagePayload;
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ];
      const result = await generateJSON<LandingPagePayload>(messages, { temperature: 0.7 });
      landingPageData = result.data;
      logger.debug("Gemini response received", { htmlLength: landingPageData.html_content?.length || 0 });
      
      // Limpiar placeholders y reemplazar URLs externas
      if (landingPageData.html_content) {
        landingPageData.html_content = landingPageData.html_content
          .replace(/\{ *\.\.\. *\}/g, '')
          .replace(/<!--\s*TODO[^>]*-->/gi, '')
          .replace(/<!--\s*PLACEHOLDER[^>]*-->/gi, '')
          .replace(/placeholder\s*=\s*["'][^"']*["']/gi, '');
        
        // Reemplazar URLs de via.placeholder.com con data URIs SVG
        const placeholderPattern = /https?:\/\/via\.placeholder\.com\/[^"'\s)]+/gi;
        landingPageData.html_content = landingPageData.html_content.replace(placeholderPattern, (match) => {
          // Extraer dimensiones y colores si están en la URL
          const sizeMatch = match.match(/(\d+)x(\d+)/);
          const colorMatch = match.match(/([a-f0-9]{6}|[a-f0-9]{3})/gi);
          const textMatch = match.match(/text=([^&]+)/);
          
          const width = sizeMatch ? sizeMatch[1] : '600';
          const height = sizeMatch ? sizeMatch[2] : '400';
          const bgColor = colorMatch && colorMatch[0] ? `#${colorMatch[0]}` : '#3b82f6';
          const textColor = colorMatch && colorMatch[1] ? `#${colorMatch[1]}` : '#ffffff';
          const text = textMatch ? decodeURIComponent(textMatch[1].replace(/\+/g, ' ')) : '';
          
          // Generar SVG data URI (usar encodeURIComponent para evitar problemas con Buffer)
          const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
          return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        });
      }
      
      const issues = validateHtml(landingPageData.html_content);
      if (issues.length > 0) {
        logger.warn("HTML validation issues", { issues, startupId: startupTyped.id });
        return NextResponse.json(
          { error: `Contenido incompleto: ${issues.join(", ")}. Intenta regenerar.` },
          { status: 500 }
        );
      }
    } catch (error: any) {
      logger.error("Gemini error generating landing page", error as Error, { startupId: startupTyped.id, errorMessage: error?.message });
      return NextResponse.json(
        { error: 'El servicio de IA no está disponible en este momento. Por favor, intenta de nuevo en unos minutos.' },
        { status: 503 }
      );
    }

    // Valores por defecto
    landingPageData.title = landingPageData.title || `${startupTyped.name} | Validación`;
    landingPageData.headline = landingPageData.headline || `Descubre ${startupTyped.name}`;
    landingPageData.subheadline = landingPageData.subheadline || startupTyped.description || "La solución que necesitas";
    landingPageData.description = landingPageData.description || startupTyped.description || "";
    landingPageData.cta_text = landingPageData.cta_text || "Comenzar Ahora";
    landingPageData.css_content = landingPageData.css_content || extractInlineCss(landingPageData.html_content || "");

    // Guardar en DB
    const { data: landingPage, error: insertError } = await supabaseClient
      .from("landing_pages")
      .insert({
        startup_id: startupId,
        student_id: user.id,
        title: landingPageData.title,
        headline: landingPageData.headline,
        subheadline: landingPageData.subheadline,
        description: landingPageData.description,
        cta_text: landingPageData.cta_text,
        template_name: templateName,
        html_content: landingPageData.html_content,
        css_content: landingPageData.css_content,
        status: "draft",
      } as any)
      .select()
      .single() as { data: any | null; error: any | null };

    if (insertError || !landingPage) {
      logger.error("DB error saving landing page", insertError as Error, { startupId: startupTyped.id, userId: user.id });
      return NextResponse.json(
        { error: `Error al guardar: ${insertError?.message || "Error desconocido"}` },
        { status: 500 }
      );
    }

    logger.info("Landing page created", { landingPageId: (landingPage as any).id, startupId: startupTyped.id, userId: user.id });
    
    // Obtener remaining actualizado para el header (sin incrementar contador)
    const remainingInfo = rateLimiter.getRemaining(identifier);
    
    return NextResponse.json(
      { success: true, landingPage },
      {
        headers: {
          'X-RateLimit-Limit': '15',
          'X-RateLimit-Remaining': remainingInfo.remaining.toString(),
        },
      }
    );

  } catch (error: any) {
    return handleApiError(error, 'POST /api/validation/landing-page');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const landingPageId = searchParams.get("id");
    const publishedUrl = searchParams.get("url");

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
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
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user: u } } = await supabaseWithToken.auth.getUser();
      if (u) { user = u; supabaseClient = supabaseWithToken; }
    }

    // Para URLs publicadas, acceso público
    if (publishedUrl) {
      const { data: landingPage, error } = await supabaseClient
        .from("landing_pages")
        .select("*")
        .eq("published_url", publishedUrl)
        .eq("status", "published")
        .single();

      if (error || !landingPage) {
        return NextResponse.json({ error: "Landing page no encontrada" }, { status: 404 });
      }
      return NextResponse.json({ landingPage });
    }

    if (!landingPageId) {
      return NextResponse.json({ error: "id o url es requerido" }, { status: 400 });
    }

    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;
    }

    if (user) {
      const { data: landingPage, error } = await supabaseClient
        .from("landing_pages")
        .select("*")
        .eq("id", landingPageId)
        .single();

      if (error || !landingPage) {
        return NextResponse.json({ error: "Landing page no encontrada" }, { status: 404 });
      }

      if (landingPage.student_id !== user.id && landingPage.status !== "published") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      return NextResponse.json({ landingPage });
    }

    // Sin auth, solo páginas publicadas
    const { data: landingPage, error } = await supabaseClient
      .from("landing_pages")
      .select("*")
      .eq("id", landingPageId)
      .eq("status", "published")
      .single();

    if (error || !landingPage) {
      return NextResponse.json({ error: "Landing page no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ landingPage });

  } catch (error: any) {
    logger.error("Error in GET landing page", error as Error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
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
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user: u } } = await supabaseWithToken.auth.getUser();
      if (u) { user = u; supabaseClient = supabaseWithToken; }
    }

    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;
    }

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
    }

    const { data: existing } = await supabaseClient
      .from("landing_pages")
      .select("student_id")
      .eq("id", id)
      .single();

    if (!existing || existing.student_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data: landingPage, error } = await supabaseClient
      .from("landing_pages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ landingPage });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
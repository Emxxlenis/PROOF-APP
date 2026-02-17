import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateContent, isGeminiAvailable, ChatMessage } from "@/lib/gemini";
import { ApiErrors } from "@/lib/api-error-handler";
import { rateLimiter, getRateLimitIdentifier, getClientIP } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

function parseAIResponse(response: string): any {
  let cleaned = response.trim();
  
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```\s*$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
    }
    
    throw new Error(`No se pudo parsear JSON`);
  }
}

// Reemplazar texto de forma flexible
function flexibleReplace(html: string, search: string, replace: string): string {
  if (!search || !replace || search === replace) return html;
  
  // Primero intentar reemplazo exacto (más confiable)
  if (html.includes(search)) {
    return html.split(search).join(replace);
  }
  
  // Si no funciona, intentar con regex flexible (para espacios variables)
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flexible = escaped.replace(/\s+/g, '\\s+');
  
  try {
    const regex = new RegExp(flexible, 'gi');
    return html.replace(regex, replace);
  } catch (e) {
    // Si todo falla, intentar reemplazo case-insensitive simple
    const lowerHtml = html.toLowerCase();
    const lowerSearch = search.toLowerCase();
    if (lowerHtml.includes(lowerSearch)) {
      const index = lowerHtml.indexOf(lowerSearch);
      return html.substring(0, index) + replace + html.substring(index + search.length);
    }
    return html;
  }
}

// Detectar y reemplazar colores automáticamente
function applyColorChange(html: string, colorName: string): { html: string; changes: number } {
  let updated = html;
  let changes = 0;
  
  // Mapeo de colores comunes
  const colorMap: Record<string, string[]> = {
    verde: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#6ee7b7'],
    green: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#34d399', '#6ee7b7'],
    azul: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#60a5fa', '#93c5fd'],
    blue: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#60a5fa', '#93c5fd'],
    rojo: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#f87171', '#fca5a5'],
    red: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#f87171', '#fca5a5'],
    naranja: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#fb923c', '#fdba74'],
    orange: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#fb923c', '#fdba74'],
    morado: ['#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#c084fc', '#d8b4fe'],
    purple: ['#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#c084fc', '#d8b4fe'],
  };
  
  const normalizedColor = colorName.toLowerCase().trim();
  const newColors = colorMap[normalizedColor] || [];
  
  if (newColors.length === 0) return { html: updated, changes: 0 };
  
  // Encontrar todos los colores hex en el HTML
  const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const matches = [...updated.matchAll(hexColorRegex)];
  const uniqueColors = [...new Set(matches.map(m => m[0]))];
  
  // Reemplazar colores principales con los nuevos
  uniqueColors.forEach((oldColor, index) => {
    if (index < newColors.length) {
      const newColor = newColors[index];
      if (oldColor !== newColor) {
        const before = updated;
        updated = updated.replace(new RegExp(oldColor, 'g'), newColor);
        if (before !== updated) {
          changes++;
          logger.debug(`Color automático aplicado`, { oldColor, newColor });
        }
      }
    }
  });
  
  return { html: updated, changes };
}

// Extraer TODOS los textos visibles del HTML
function extractVisibleTexts(html: string): string[] {
  const texts: string[] = [];
  
  // Extraer texto entre tags
  const matches = html.match(/>([^<]+)</g);
  if (matches) {
    matches.forEach(match => {
      const text = match.slice(1, -1).trim();
      // Filtrar textos útiles
      if (text.length > 2 && 
          text.length < 500 && 
          !/^[\s\d.,$%:;]+$/.test(text) &&
          !text.startsWith('/*') &&
          !text.startsWith('//') &&
          !text.includes('{') &&
          !text.includes('}')) {
        texts.push(text);
      }
    });
  }
  
  // También extraer contenido de title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    texts.unshift(titleMatch[1].trim());
  }
  
  // Eliminar duplicados
  return [...new Set(texts)];
}

export async function POST(request: NextRequest) {
  try {
    if (!isGeminiAvailable()) {
      return NextResponse.json({ error: "Gemini no configurado" }, { status: 500 });
    }

    const { landingPageId, instructions, currentContent } = await request.json();

    if (!landingPageId || !instructions || !currentContent) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // Auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } as any }
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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: existing } = await supabaseClient
      .from("landing_pages")
      .select("student_id, startup_id")
      .eq("id", landingPageId)
      .single();

    if (!existing || existing.student_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Rate limiting para Gemini API
    const clientIP = getClientIP(request);
    const identifier = getRateLimitIdentifier(user.id, clientIP);
    const rateCheck = rateLimiter.check(identifier, 'gemini');

    if (!rateCheck.allowed) {
      const retryAfter = rateCheck.retryAfter || 60;
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          limit: rateCheck.limit,
          retryAfter: retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': rateCheck.limit === 'minute' ? '15' : '1500',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
          },
        }
      );
    }

    logger.info("Editando landing page con IA", { 
      landingPageId, 
      instructionsPreview: instructions.substring(0, 100),
      userId: user.id 
    });

    const htmlContent = currentContent.html_content || '';
    
    // Extraer TODOS los textos visibles
    const allTexts = extractVisibleTexts(htmlContent);
    logger.debug(`Textos encontrados en HTML`, { count: allTexts.length });
    
    // Usar hasta 50 textos para dar más contexto a la IA
    const textsForAI = allTexts.slice(0, 50);

    // Extraer colores principales del CSS para contexto
    const colorMatches = htmlContent.match(/(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|var\(--[^)]+\))/g) || [];
    const uniqueColors = [...new Set(colorMatches)].slice(0, 10);
    const cssVariables = htmlContent.match(/--[a-zA-Z-]+:\s*[^;]+/g) || [];

    const prompt = `Edit landing page per instructions: "${instructions}"

Current texts (use exact for find): ${textsForAI.map((t, i) => `${i + 1}. "${t}"`).join('\n')}
Title: "${currentContent.title || ''}" Headline: "${currentContent.headline || ''}" Subheadline: "${currentContent.subheadline || ''}" CTA: "${currentContent.cta_text || ''}"
Colors: ${uniqueColors.length > 0 ? uniqueColors.slice(0, 5).join(', ') : 'none'} ${cssVariables.length > 0 ? `CSS vars: ${cssVariables.slice(0, 5).join(', ')}` : ''}

Respond with valid JSON: { "title?", "headline?", "subheadline?", "cta_text?", "replacements": [{"find","replace"}], "css_changes": { "variables": {}, "replacements": [] }, "summary": "" }`;

    const systemInstruction = "You are an assistant. Apply the requested edits. Respond with valid JSON only.";

    let response: string;
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ];
      const result = await generateContent(messages, { temperature: 0.3 });
      response = result.content;
      logger.debug("Respuesta de Gemini recibida", { responseLength: response.length });
    } catch (e: any) {
      logger.error("Error de IA generando edición", e as Error, { landingPageId, userId: user.id, errorMessage: e?.message });
      throw ApiErrors.aiServiceUnavailable();
    }

    let changes: any;
    try {
      changes = parseAIResponse(response);
      logger.debug("Cambios parseados", { replacementsCount: changes.replacements?.length || 0 });
    } catch (e: any) {
      logger.error("Error procesando respuesta de IA", e as Error, { landingPageId });
      throw new Error(`Error procesando respuesta`);
    }

    // Aplicar cambios
    let updatedHtml = htmlContent;
    let appliedCount = 0;

    // 0. Detectar si es un cambio de color y aplicar automáticamente
    const colorKeywords = ['verde', 'green', 'azul', 'blue', 'rojo', 'red', 'naranja', 'orange', 'morado', 'purple'];
    const isColorChange = colorKeywords.some(keyword => 
      instructions.toLowerCase().includes(keyword)
    );
    
    if (isColorChange) {
      const colorMatch = instructions.match(new RegExp(`(${colorKeywords.join('|')})`, 'i'));
      if (colorMatch) {
        const colorResult = applyColorChange(updatedHtml, colorMatch[1]);
        updatedHtml = colorResult.html;
        appliedCount += colorResult.changes;
        logger.debug("Cambio de color automático aplicado", { changes: colorResult.changes });
      }
    }

    // 1. Aplicar replacements de la IA
    if (changes.replacements && Array.isArray(changes.replacements)) {
      for (const r of changes.replacements) {
        if (r.find && r.replace && r.find !== r.replace) {
          const before = updatedHtml;
          updatedHtml = flexibleReplace(updatedHtml, r.find, r.replace);
          if (before !== updatedHtml) {
            appliedCount++;
            logger.debug("Reemplazo de texto aplicado", { 
              find: r.find.substring(0, 30), 
              replace: r.replace.substring(0, 30) 
            });
          }
        }
      }
    }

    // 2. Aplicar cambios de campos principales
    const fieldChanges = [
      { old: currentContent.headline, new: changes.headline },
      { old: currentContent.subheadline, new: changes.subheadline },
      { old: currentContent.cta_text, new: changes.cta_text },
      { old: currentContent.title, new: changes.title },
    ];

    for (const change of fieldChanges) {
      if (change.old && change.new && change.old !== change.new) {
        const before = updatedHtml;
        updatedHtml = flexibleReplace(updatedHtml, change.old, change.new);
        if (before !== updatedHtml) {
          appliedCount++;
        }
      }
    }

    // 3. Aplicar cambios de CSS
    if (changes.css_changes) {
      // 3.1 Modificar variables CSS en :root
      if (changes.css_changes.variables && typeof changes.css_changes.variables === 'object') {
        for (const [varName, varValue] of Object.entries(changes.css_changes.variables)) {
          // Buscar y reemplazar la variable en :root (con o sin --)
          const normalizedVarName = varName.startsWith('--') ? varName : `--${varName}`;
          const varRegex = new RegExp(`(${normalizedVarName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*)[^;]+`, 'gi');
          if (varRegex.test(updatedHtml)) {
            updatedHtml = updatedHtml.replace(varRegex, `$1${varValue}`);
            appliedCount++;
            logger.debug("CSS Variable modificada", { varName: normalizedVarName, varValue });
          } else {
            // Si no existe, agregarla en :root
            const rootMatch = updatedHtml.match(/:root\s*\{([^}]*)\}/i);
            if (rootMatch) {
              updatedHtml = updatedHtml.replace(/:root\s*\{([^}]*)\}/i, `:root {$1  ${normalizedVarName}: ${varValue};\n}`);
              appliedCount++;
              logger.debug("CSS Variable agregada", { varName: normalizedVarName, varValue });
            } else {
              // Si no hay :root, crear uno
              if (updatedHtml.includes('<style')) {
                updatedHtml = updatedHtml.replace(/(<style[^>]*>)/i, `$1\n:root {\n  ${normalizedVarName}: ${varValue};\n}\n`);
                appliedCount++;
                logger.debug(":root creado con variable", { varName: normalizedVarName, varValue });
              }
            }
          }
        }
      }

      // 3.2 Reemplazos directos de valores de color en CSS
      if (changes.css_changes.replacements && Array.isArray(changes.css_changes.replacements)) {
        for (const r of changes.css_changes.replacements) {
          if (r.find && r.replace && r.find !== r.replace) {
            const before = updatedHtml;
            
            // Intentar reemplazo exacto primero
            if (updatedHtml.includes(r.find)) {
              updatedHtml = updatedHtml.split(r.find).join(r.replace);
              appliedCount++;
              logger.debug("CSS Replacement (exacto) aplicado", { 
                find: r.find.substring(0, 40), 
                replace: r.replace.substring(0, 40) 
              });
            } else {
              // Intentar con regex flexible
              try {
                const escapedFind = r.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedFind, 'gi');
                const matches = updatedHtml.match(regex);
                if (matches && matches.length > 0) {
                  updatedHtml = updatedHtml.replace(regex, r.replace);
                  appliedCount++;
                  logger.debug("CSS Replacement (regex) aplicado", { 
                    find: r.find.substring(0, 40), 
                    replace: r.replace.substring(0, 40),
                    matches: matches.length 
                  });
                } else {
                  logger.warn("No se encontró texto para reemplazar en CSS", { find: r.find.substring(0, 40) });
                }
              } catch (e) {
                logger.warn("Error en regex para CSS replacement", { find: r.find.substring(0, 40), error: e });
              }
            }
          }
        }
      }
    }

    // 3.3 CSS adicional (legacy, para compatibilidad)
    if (changes.css && changes.css.trim()) {
      if (updatedHtml.includes('</style>')) {
        updatedHtml = updatedHtml.replace('</style>', `\n/* AI Changes */\n${changes.css.trim()}\n</style>`);
        appliedCount++;
        logger.debug("CSS adicional agregado");
      }
    }

    logger.info("Cambios aplicados a landing page", { 
      appliedCount, 
      htmlLengthBefore: htmlContent.length, 
      htmlLengthAfter: updatedHtml.length,
      landingPageId 
    });

    // Verificar que hubo cambios
    if (htmlContent === updatedHtml && appliedCount === 0) {
      logger.warn("No se aplicaron cambios a landing page", { 
        landingPageId, 
        responsePreview: response.substring(0, 500) 
      });
    }

    // Guardar
    const updateData = {
      title: changes.title || currentContent.title,
      headline: changes.headline || currentContent.headline,
      subheadline: changes.subheadline || currentContent.subheadline,
      description: changes.description || currentContent.description,
      cta_text: changes.cta_text || currentContent.cta_text,
      html_content: updatedHtml,
    };

    logger.debug("Guardando cambios en la base de datos", { landingPageId });
    const { data: landingPage, error: updateError } = await supabaseClient
      .from("landing_pages")
      .update(updateData)
      .eq("id", landingPageId)
      .select()
      .single();

    if (updateError) {
      logger.error("Error guardando landing page", updateError as Error, { landingPageId, userId: user.id });
      throw new Error(`Error guardando: ${updateError.message}`);
    }

    logger.info("Landing page actualizada exitosamente", { 
      landingPageId: landingPage?.id, 
      appliedCount,
      summary: changes.summary 
    });

    // Obtener remaining actualizado para el header (sin incrementar contador)
    const remainingInfo = rateLimiter.getRemaining(identifier);

    return NextResponse.json(
      {
        success: true,
        landingPage,
        changes: changes.summary || `${appliedCount} cambios aplicados`,
        appliedCount
      },
      {
        headers: {
          'X-RateLimit-Limit': '15',
          'X-RateLimit-Remaining': remainingInfo.remaining.toString(),
        },
      }
    );

  } catch (error: any) {
    logger.error("Error editing landing page with AI", error as Error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
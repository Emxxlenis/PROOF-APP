import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const {
      startupId,
      landingPageId,
      hypothesisId,
      eventType,
      eventData,
    } = await request.json();

    if (!startupId || !eventType) {
      return NextResponse.json(
        { error: "startupId y eventType son requeridos" },
        { status: 400 }
      );
    }

    const validEventTypes = ["page_view", "click", "conversion", "bounce"];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `eventType debe ser uno de: ${validEventTypes.join(", ")}` },
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

    // Get startup to find student_id
    const { data: startup } = await supabase
      .from("startups")
      .select("student_id")
      .eq("id", startupId)
      .single();

    if (!startup) {
      return NextResponse.json(
        { error: "Startup no encontrada" },
        { status: 404 }
      );
    }

    // Get request metadata
    const userAgent = request.headers.get("user-agent") || null;
    const referrer = request.headers.get("referer") || null;
    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || null;

    // Save event
    const { data: event, error: insertError } = await supabase
      .from("validation_routes")
      .insert({
        startup_id: startupId,
        student_id: startup.student_id,
        landing_page_id: landingPageId || null,
        hypothesis_id: hypothesisId || null,
        event_type: eventType,
        event_data: eventData || {},
        user_agent: userAgent,
        referrer: referrer,
        ip_address: ipAddress,
        session_id: eventData?.sessionId || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Error al guardar evento: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Update landing page counts if applicable
    if (landingPageId) {
      const updateField = eventType === "page_view" ? "views_count" :
                          eventType === "click" ? "clicks_count" :
                          eventType === "conversion" ? "conversions_count" : null;

      if (updateField) {
        const rpcResult = await supabase.rpc("increment_landing_page_count", {
          page_id: landingPageId,
          field_name: updateField,
        });
        
        if (rpcResult.error) {
          // Fallback if function doesn't exist
          // Fallback if function doesn't exist
          const { data: page } = await supabase
            .from("landing_pages")
            .select(updateField)
            .eq("id", landingPageId)
            .single();

          if (page) {
            const currentValue = (page as any)[updateField] || 0;
            await supabase
              .from("landing_pages")
              .update({ [updateField]: currentValue + 1 })
              .eq("id", landingPageId);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/validation/track-event');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get("startupId");
    const landingPageId = searchParams.get("landingPageId");
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startupId) {
      return NextResponse.json(
        { error: "startupId es requerido" },
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

    let query = supabaseClient
      .from("validation_routes")
      .select("*")
      .eq("startup_id", startupId);

    if (landingPageId) {
      query = query.eq("landing_page_id", landingPageId);
    }

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: events, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      totalEvents: events?.length || 0,
      pageViews: events?.filter((e: any) => e.event_type === "page_view").length || 0,
      clicks: events?.filter((e: any) => e.event_type === "click").length || 0,
      conversions: events?.filter((e: any) => e.event_type === "conversion").length || 0,
      bounces: events?.filter((e: any) => e.event_type === "bounce").length || 0,
      conversionRate: 0,
      clickThroughRate: 0,
    };

    if (stats.pageViews > 0) {
      stats.conversionRate = (stats.conversions / stats.pageViews) * 100;
      stats.clickThroughRate = (stats.clicks / stats.pageViews) * 100;
    }

    return NextResponse.json({
      events: events || [],
      statistics: stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener eventos" },
      { status: 500 }
    );
  }
}


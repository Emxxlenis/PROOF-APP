import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get("startupId");

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

    // Get financial metrics
    const { data: metrics } = await supabaseClient
      .from("financial_metrics")
      .select("*")
      .eq("startup_id", startupId)
      .order("metric_date", { ascending: false })
      .limit(12);

    const latest = metrics?.[0];

    return NextResponse.json({
      cac: latest?.cac || 0,
      ltv: latest?.ltv || 0,
      ratio: latest?.cac_ltv_ratio || 0,
      arpu: latest?.arpu || 0,
      mrr: latest?.mrr || 0,
      churnRate: latest?.churn_rate || 0,
      history: metrics || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener CAC/LTV" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      startupId,
      cac,
      ltv,
      arpu,
      mrr,
      churnRate,
    } = await request.json();

    if (!startupId || cac === undefined || ltv === undefined) {
      return NextResponse.json(
        { error: "startupId, cac y ltv son requeridos" },
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

    // Calculate CAC/LTV ratio (for backwards compatibility, but we use LTV/CAC in frontend)
    const cacLtvRatio = ltv > 0 ? cac / ltv : 0;

    // Save financial metrics
    const { data: metric, error: insertError } = await supabaseClient
      .from("financial_metrics")
      .insert({
        startup_id: startupId,
        cac: Number(cac),
        ltv: Number(ltv),
        cac_ltv_ratio: cacLtvRatio,
        arpu: arpu ? Number(arpu) : null,
        mrr: mrr ? Number(mrr) : null,
        churn_rate: churnRate ? Number(churnRate) : null,
        metric_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Error al guardar: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metric,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al guardar métricas financieras" },
      { status: 500 }
    );
  }
}



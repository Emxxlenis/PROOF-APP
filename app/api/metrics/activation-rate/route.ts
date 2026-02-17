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

    // Get activation events
    const { data: events } = await supabaseClient
      .from("activation_events")
      .select("*")
      .eq("startup_id", startupId)
      .order("activation_date", { ascending: false });

    // Get total users (from startup or calculate)
    const { data: startup } = await supabaseClient
      .from("startups")
      .select("total_users")
      .eq("id", startupId)
      .single();

    const totalUsers = startup?.total_users || 0;
    const activatedUsers = events?.length || 0;
    const activationRate = totalUsers > 0 ? (activatedUsers / totalUsers) * 100 : 0;

    // Save or update metric
    const { data: existing } = await supabaseClient
      .from("metrics")
      .select("*")
      .eq("startup_id", startupId)
      .eq("metric_type", "activation")
      .eq("calculation_date", new Date().toISOString().split("T")[0])
      .single();

    if (existing) {
      await supabaseClient
        .from("metrics")
        .update({ metric_value: activationRate })
        .eq("id", existing.id);
    } else {
      await supabaseClient
        .from("metrics")
        .insert({
          startup_id: startupId,
          student_id: user.id,
          metric_type: "activation",
          metric_value: activationRate,
          calculation_date: new Date().toISOString().split("T")[0],
        });
    }

    return NextResponse.json({
      activationRate: Math.round(activationRate * 100) / 100,
      totalUsers,
      activatedUsers,
      events: events || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al calcular activation rate" },
      { status: 500 }
    );
  }
}



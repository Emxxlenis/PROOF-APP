import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get("startupId");
    const period = searchParams.get("period") || "D7"; // D7, D30, D90

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

    // Get retention cohorts
    const { data: cohorts } = await supabaseClient
      .from("retention_cohorts")
      .select("*")
      .eq("startup_id", startupId)
      .eq("retention_period", period)
      .order("cohort_date", { ascending: false })
      .limit(12);

    // Calculate average retention
    const avgRetention = cohorts && cohorts.length > 0
      ? cohorts.reduce((sum: number, c: any) => sum + Number(c.retention_rate), 0) / cohorts.length
      : 0;

    return NextResponse.json({
      period,
      averageRetention: Math.round(avgRetention * 100) / 100,
      cohorts: cohorts || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al calcular retention" },
      { status: 500 }
    );
  }
}



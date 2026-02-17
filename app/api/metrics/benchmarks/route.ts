import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry") || "general";
    const metricType = searchParams.get("metricType");

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

    let query = supabase
      .from("benchmarks")
      .select("*")
      .eq("industry", industry);

    if (metricType) {
      query = query.eq("metric_type", metricType);
    }

    const { data: benchmarks, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Default benchmarks if none exist
    const defaultBenchmarks = [
      { metric_type: "activation", benchmark_value: 25, percentile: 50 },
      { metric_type: "retention", benchmark_value: 40, percentile: 50 },
      { metric_type: "nps", benchmark_value: 30, percentile: 50 },
      { metric_type: "cac", benchmark_value: 50, percentile: 50 },
      { metric_type: "ltv", benchmark_value: 300, percentile: 50 },
    ];

    return NextResponse.json({
      benchmarks: benchmarks && benchmarks.length > 0 ? benchmarks : defaultBenchmarks,
      industry,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener benchmarks" },
      { status: 500 }
    );
  }
}



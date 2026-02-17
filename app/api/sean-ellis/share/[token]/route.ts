import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

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

    // Get Sean Ellis test by token (we'll use startup_id as token for now, or create a share_token field)
    // For MVP, we'll use startup_id directly
    const startupId = token;

    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("id, name, description")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      return NextResponse.json(
        { error: "Encuesta no encontrada" },
        { status: 404 }
      );
    }

    // Get existing test data to show results if needed
    const { data: existingTests } = await supabase
      .from("sean_ellis_tests")
      .select("*")
      .eq("startup_id", startupId)
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      startup,
      existingTests: existingTests || [],
      shareToken: token,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/sean-ellis/share/[token]');
  }
}



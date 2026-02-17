import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { supabaseClient } = await authenticateRequest(request);

    const { data: challenges, error } = await supabaseClient
      .from("challenges")
      .select("*")
      .eq("status", "active")
      .order("start_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ challenges: challenges || [] });
  } catch (error: any) {
    return handleApiError(error, "GET /api/challenges/list");
  }
}

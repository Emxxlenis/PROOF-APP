import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    // Check admin role
    const { data: userData } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      throw ApiErrors.forbidden("No autorizado - Se requiere rol de administrador");
    }

    const { data: users, error } = await supabaseClient
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    return handleApiError(error, "GET /api/admin/users");
  }
}



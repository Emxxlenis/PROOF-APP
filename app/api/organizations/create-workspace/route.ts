import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const { name, description, organizationType } = await request.json();

    if (!name) {
      throw ApiErrors.badRequest("name es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Check if user is coordinator or admin
    const { data: userData } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "coordinator" && userData?.role !== "admin") {
      throw ApiErrors.forbidden("Solo coordinadores y administradores pueden crear workspaces");
    }

    // Create organization/workspace
    const { data: organization, error: insertError } = await supabaseClient
      .from("organizations")
      .insert({
        name,
        description: description || null,
        organization_type: organizationType || "accelerator",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Error al crear workspace: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Add creator as workspace member
    await supabaseClient
      .from("workspace_members")
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: "admin",
      });

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/organizations/create-workspace');
  }
}



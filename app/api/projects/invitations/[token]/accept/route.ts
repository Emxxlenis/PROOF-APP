import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    const { user, supabaseClient } = await authenticateRequest(request);

    // Buscar la invitación
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("team_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Invitación no encontrada o ya procesada" },
        { status: 404 }
      );
    }

    // Verificar que la invitación no haya expirado
    if (new Date(invitation.expires_at) < new Date()) {
      // Marcar como expirada
      await supabaseClient
        .from("team_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "La invitación ha expirado" },
        { status: 400 }
      );
    }

    // Verificar que el email coincida
    const { data: userData } = await supabaseClient
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!userData || userData.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Esta invitación no es para tu cuenta" },
        { status: 403 }
      );
    }

    // Verificar que no sea ya miembro
    const { data: existingMember } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("startup_id", invitation.startup_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      // Marcar invitación como aceptada aunque ya sea miembro
      await supabaseClient
        .from("team_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      return NextResponse.json({
        success: true,
        message: "Ya eres miembro de este equipo",
        startup_id: invitation.startup_id,
      });
    }

    // Agregar como miembro
    const { data: member, error: memberError } = await supabaseClient
      .from("team_members")
      .insert({
        startup_id: invitation.startup_id,
        user_id: user.id,
        role: invitation.role,
      })
      .select()
      .single();

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: `Error al agregar miembro: ${memberError.message}` },
        { status: 500 }
      );
    }

    // Actualizar invitación
    await supabaseClient
      .from("team_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    return NextResponse.json({
      success: true,
      member: member,
      startup_id: invitation.startup_id,
    });
  } catch (error: any) {
    return handleApiError(error, "POST /api/projects/invitations/[token]/accept");
  }
}



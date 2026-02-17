import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError } from "@/lib/api-error-handler";

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

    // Marcar como rechazada
    const { error: updateError } = await supabaseClient
      .from("team_invitations")
      .update({ status: "rejected", rejected_at: new Date().toISOString() })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error rejecting invitation:", updateError);
      return NextResponse.json(
        { error: `Error al rechazar la invitación: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitación rechazada",
    });
  } catch (error: any) {
    return handleApiError(error, "POST /api/projects/invitations/[token]/reject");
  }
}



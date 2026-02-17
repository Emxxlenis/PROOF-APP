import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

// DELETE: Eliminar/cancelar una invitación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> | { id: string; invitationId: string } }
) {
  try {
    // Manejar params como Promise (Next.js 15+) o objeto directo
    const resolvedParams = await Promise.resolve(params);
    const startupId = resolvedParams.id;
    const invitationId = resolvedParams.invitationId;

    if (!invitationId) {
      throw ApiErrors.badRequest("invitationId es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Verificar que el usuario es el creador del proyecto
    const { data: startup, error: startupError } = await supabaseClient
      .from("startups")
      .select("id, student_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    if (startup.student_id !== user.id) {
      return NextResponse.json(
        { error: "Solo el creador del proyecto puede eliminar invitaciones" },
        { status: 403 }
      );
    }

    // Verificar que la invitación existe y pertenece al proyecto
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("team_invitations")
      .select("id, status")
      .eq("id", invitationId)
      .eq("startup_id", startupId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Invitación no encontrada" },
        { status: 404 }
      );
    }

    // Solo se pueden eliminar invitaciones pendientes
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar invitaciones pendientes" },
        { status: 400 }
      );
    }

    // Eliminar la invitación
    const { data: deletedData, error: deleteError } = await supabaseClient
      .from("team_invitations")
      .delete()
      .eq("id", invitationId)
      .eq("startup_id", startupId)
      .select();


    if (deleteError) {
      console.error("Error deleting invitation:", deleteError);
      return NextResponse.json(
        { error: `Error al eliminar la invitación: ${deleteError.message}`, details: deleteError },
        { status: 500 }
      );
    }

    // Verificar que se eliminó
    if (!deletedData || deletedData.length === 0) {
      console.warn("No se eliminó ninguna invitación, puede ser un problema de RLS");
      return NextResponse.json(
        { error: "No se pudo eliminar la invitación. Verifica los permisos." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitación eliminada exitosamente",
    });
  } catch (error: any) {
    return handleApiError(error, "DELETE /api/projects/[id]/invitations/[invitationId]");
  }
}


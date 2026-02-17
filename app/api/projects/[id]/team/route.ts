import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

// GET: Obtener miembros del equipo e invitaciones
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const startupId = params.id;

    const { user, supabaseClient } = await authenticateRequest(request);

    // Verificar que el usuario tiene acceso al proyecto
    const { data: startup, error: startupError } = await supabaseClient
      .from("startups")
      .select("id, student_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      throw ApiErrors.notFound('Proyecto');
    }

    // Verificar que es el creador o miembro del equipo
    const startupTyped = startup as { id: string; student_id?: string };
    const isCreator = startupTyped.student_id === user.id;
    const { data: member } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("startup_id", startupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isCreator && !member) {
      return NextResponse.json(
        { error: "No tienes acceso a este proyecto" },
        { status: 403 }
      );
    }

    // Obtener miembros del equipo
    const { data: members, error: membersError } = await supabaseClient
      .from("team_members")
      .select(`
        id,
        role,
        joined_at,
        user:users!team_members_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("startup_id", startupId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching members:", membersError);
    }

    // Obtener invitaciones (solo si es el creador)
    let invitations = [];
    if (isCreator) {
      const { data: invs, error: invsError } = await supabaseClient
        .from("team_invitations")
        .select("*")
        .eq("startup_id", startupId)
        .in("status", ["pending"])
        .order("created_at", { ascending: false });

      if (!invsError && invs) {
        invitations = invs;
      }
    }

    return NextResponse.json({
      members: members || [],
      invitations: invitations,
      isCreator: isCreator,
    });
  } catch (error: any) {
    return handleApiError(error, 'GET /api/projects/[id]/team');
  }
}

// DELETE: Eliminar miembro del equipo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { memberId } = await request.json();
    const startupId = params.id;

    if (!memberId) {
      throw ApiErrors.badRequest("memberId es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Verificar que el usuario es el creador
    const { data: startup, error: startupError } = await supabaseClient
      .from("startups")
      .select("id, student_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      throw ApiErrors.notFound('Proyecto');
    }

    const startupTyped = startup as { id: string; student_id?: string };
    if (startupTyped.student_id !== user.id) {
      throw ApiErrors.forbidden("Solo el creador puede eliminar miembros");
    }

    // Eliminar miembro
    const { error: deleteError } = await supabaseClient
      .from("team_members")
      .delete()
      .eq("id", memberId)
      .eq("startup_id", startupId);

    if (deleteError) {
      console.error("Error deleting member:", deleteError);
      return NextResponse.json(
        { error: `Error al eliminar miembro: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Miembro eliminado exitosamente",
    });
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/projects/[id]/team');
  }
}



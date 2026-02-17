import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { z } from "zod";

const InviteUserSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["founder", "co_founder", "team_member"], {
    errorMap: () => ({ message: "Rol inválido. Debe ser: founder, co_founder o team_member" })
  }),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const startupId = params.id;

    // Validar con Zod
    const validationResult = InviteUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, role } = validationResult.data;

    const { user, supabaseClient } = await authenticateRequest(request);

    // Verificar que el usuario es el creador de la startup
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
        { error: "Solo el creador del proyecto puede invitar miembros" },
        { status: 403 }
      );
    }

    // Verificar que no haya una invitación pendiente para este email
    const { data: existingInvitation } = await supabaseClient
      .from("team_invitations")
      .select("id")
      .eq("startup_id", startupId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este email" },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe antes de enviar la invitación
    let existingUserId: string | null = null;
    let userExists = false;
    
    try {
      const { data: existingUserData, error: userCheckError } = await supabaseClient
        .rpc('user_exists_by_email', { user_email: email.toLowerCase().trim() });

      if (!userCheckError && existingUserData && existingUserData.length > 0) {
        existingUserId = existingUserData[0].id;
        userExists = true;
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
      // Si la función no existe o hay un error, permitimos continuar
      // pero informamos al usuario que el email podría no estar registrado
    }

    // Si el usuario existe, verificar que no sea ya miembro
    if (userExists && existingUserId) {
      const { data: existingMember } = await supabaseClient
        .from("team_members")
        .select("id")
        .eq("startup_id", startupId)
        .eq("user_id", existingUserId)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json(
          { error: "Este usuario ya es miembro del equipo" },
          { status: 400 }
        );
      }
    }

    // Si el usuario no existe, informamos claramente que debe registrarse primero
    // La invitación se enviará pero el usuario no podrá aceptarla hasta que se registre

    // Crear invitación
    // Nota: No hacemos .select() inmediatamente para evitar problemas con políticas RLS
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("team_invitations")
      .insert({
        startup_id: startupId,
        invited_by: user.id,
        email: email.toLowerCase().trim(),
        role: role,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return NextResponse.json(
        { error: `Error al crear la invitación: ${inviteError.message}` },
        { status: 500 }
      );
    }

    // TODO: Enviar email de invitación aquí
    // Por ahora solo retornamos la invitación

    return NextResponse.json({
      success: true,
      invitation: invitation,
      userExists: userExists,
      warning: !userExists 
        ? "⚠️ IMPORTANTE: Este email no está registrado en la plataforma. El usuario invitado DEBE registrarse primero en la plataforma antes de poder aceptar la invitación. Una vez que se registre con este email, podrá aceptar la invitación desde el enlace que recibirá o desde su sección de invitaciones pendientes."
        : undefined,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/projects/[id]/invite');
  }
}


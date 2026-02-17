import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    const { data: notifications, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    const unreadCount = notifications?.filter((n: any) => !n.read_at).length || 0;

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount,
    });
  } catch (error: any) {
    return handleApiError(error, "GET /api/notifications/in-app");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { notificationId, read } = await request.json();

    if (!notificationId) {
      throw ApiErrors.badRequest("notificationId es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    const update: any = {};
    if (read !== undefined) {
      update.read_at = read ? new Date().toISOString() : null;
    }

    const { data: notification, error } = await supabaseClient
      .from("notifications")
      .update(update)
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ notification });
  } catch (error: any) {
    return handleApiError(error, "PUT /api/notifications/in-app");
  }
}

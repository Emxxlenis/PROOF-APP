import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    const { userId } = await request.json();

    if (!userId) {
      throw ApiErrors.badRequest("userId es requerido");
    }

    if (userId === user.id) {
      throw ApiErrors.badRequest("No puedes seguirte a ti mismo");
    }

    // Check if already following
    const { data: existing } = await supabaseClient
      .from("community_follows")
      .select("*")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .maybeSingle();

    if (existing) {
      throw ApiErrors.badRequest("Ya estás siguiendo a este usuario");
    }

    // Create follow
    const { error } = await supabaseClient
      .from("community_follows")
      .insert({
        follower_id: user.id,
        following_id: userId,
      });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error, "POST /api/community/follow");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    let userId: string | null = null;
    
    try {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get("userId");
    } catch (e) {
      // URL parsing failed, try body
    }

    if (!userId) {
      try {
        const body = await request.json();
        userId = body.userId;
      } catch (e) {
        // Body parsing failed
      }
    }

    if (!userId) {
      throw ApiErrors.badRequest("userId es requerido");
    }

    // Delete follow
    const { error } = await supabaseClient
      .from("community_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error, "DELETE /api/community/follow");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { handleApiError, validateUUID, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    validateUUID(postId, 'postId');

    // Autenticación
    const { user, supabaseClient } = await authenticateRequest(request);

    // Find and delete like
    const { data: existingLike } = await supabaseClient
      .from("community_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle() as { data: any | null };

    if (existingLike) {
      await supabaseClient
        .from("community_likes")
        .delete()
        .eq("id", (existingLike as any).id);

      // Decrement likes count
      const { error: rpcError } = await supabaseClient.rpc("decrement_likes_count", { post_id: postId } as any);
      if (rpcError) {
        logger.debug("RPC decrement_likes_count error (ignored)", { error: rpcError.message, postId });
      }
    }

    return NextResponse.json({
      success: true,
      liked: false,
    });
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/community/posts/[id]/like');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    validateUUID(postId, 'postId');

    // Autenticación
    const { user, supabaseClient } = await authenticateRequest(request);

    // Check if already liked
    const { data: existingLike } = await supabaseClient
      .from("community_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle() as { data: any | null };

    if (existingLike) {
      // Unlike
      await supabaseClient
        .from("community_likes")
        .delete()
        .eq("id", (existingLike as any).id);

      // Decrement likes count
      const { error: rpcError1 } = await supabaseClient.rpc("decrement_likes_count", { post_id: postId } as any);
      if (rpcError1) {
        logger.debug("RPC decrement_likes_count error (ignored)", { error: rpcError1.message, postId });
      }

      return NextResponse.json({
        success: true,
        liked: false,
      });
    } else {
      // Like
      await supabaseClient
        .from("community_likes")
        .insert({
          post_id: postId,
          user_id: user.id,
        } as any);

      // Increment likes count
      const { error: rpcError2 } = await supabaseClient.rpc("increment_likes_count", { post_id: postId } as any);
      if (rpcError2) {
        logger.debug("RPC increment_likes_count error (ignored)", { error: rpcError2.message, postId });
      }

      return NextResponse.json({
        success: true,
        liked: true,
      });
    }
  } catch (error: any) {
    return handleApiError(error, 'POST /api/community/posts/[id]/like');
  }
}

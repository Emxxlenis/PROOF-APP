import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";

export async function POST(request: NextRequest) {
  try {
    const {
      startupId,
      postType,
      title,
      content,
      images,
      tags,
    } = await request.json();

    if (!content) {
      throw ApiErrors.badRequest("content es requerido");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Create post
    const { data: post, error: insertError } = await (supabaseClient
      .from("community_posts") as any)
      .insert({
        author_id: user.id,
        startup_id: startupId || null,
        post_type: postType || "update",
        title: title || null,
        content,
        images: images || [],
        tags: tags || [],
        status: "published",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Error al crear post: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/community/post');
  }
}



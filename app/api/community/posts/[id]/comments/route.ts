import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    // Get user for authentication check
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let user: any = null;
    let supabaseClient = supabase;

    if (token) {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const supabaseWithToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user: userFromToken } } = await supabaseWithToken.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
        supabaseClient = supabaseWithToken;
      }
    }

    if (!user) {
      const { data: { user: userFromCookies } } = await supabase.auth.getUser();
      user = userFromCookies;
    }

    // Fetch comments - use separate query to avoid relationship issues
    const { data: comments, error } = await supabaseClient
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .is("parent_comment_id", null) // Only top-level comments
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Enrich comments with author data
    if (comments && comments.length > 0) {
      const authorIds = [...new Set(comments.map((c: any) => c.author_id).filter(Boolean))];
      
      // Fetch authors using service role key to bypass RLS for public user info
      let authors: any[] = [];
      if (authorIds.length > 0) {
        try {
          const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
          
          // Try service role key first (bypasses RLS)
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (serviceRoleKey) {
            const adminClient = createSupabaseClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              serviceRoleKey
            );
            
            const { data: authorsData, error: authorsError } = await adminClient
              .from("users")
              .select("id, email, full_name, avatar_url")
              .in("id", authorIds);
            
            if (!authorsError && authorsData) {
              authors = authorsData;
            } else if (authorsError) {
              console.error("Error fetching comment authors with service role:", authorsError);
            }
          }
          
          // Fallback: try with regular client (may fail due to RLS)
          if (authors.length === 0) {
            const { data: authorsData } = await supabaseClient
              .from("users")
              .select("id, email, full_name, avatar_url")
              .in("id", authorIds);
            
            if (authorsData) {
              authors = authorsData;
            }
          }
        } catch (error) {
          console.error("Error fetching comment authors:", error);
        }
      }

      const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);

      // Enrich comments
      const enrichedComments = comments.map((comment: any) => ({
        ...comment,
        author: authorsMap.get(comment.author_id) || null,
      }));

      return NextResponse.json({
        comments: enrichedComments || [],
      });
    }

    return NextResponse.json({
      comments: [],
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener comentarios" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const { content, parentCommentId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "content es requerido" },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let user: any = null;
    let supabaseClient = supabase;

    if (token) {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const supabaseWithToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user: userFromToken } } = await supabaseWithToken.auth.getUser();
      if (userFromToken) {
        user = userFromToken;
        supabaseClient = supabaseWithToken;
      }
    }

    if (!user) {
      const { data: { user: userFromCookies } } = await supabase.auth.getUser();
      user = userFromCookies;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    // Create comment
    const { data: comment, error: insertError } = await supabaseClient
      .from("community_comments")
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
        parent_comment_id: parentCommentId || null,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Error al crear comentario: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Enrich comment with author data using service role key to bypass RLS
    let author = null;
    try {
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      
      // Try service role key first (bypasses RLS)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
        
        const { data: authorData, error: authorError } = await adminClient
          .from("users")
          .select("id, email, full_name, avatar_url")
          .eq("id", user.id)
          .single();
        
        if (!authorError && authorData) {
          author = authorData;
        } else if (authorError) {
          console.error("Error fetching comment author with service role:", authorError);
        }
      }
      
      // Fallback: try with regular client (may fail due to RLS)
      if (!author) {
        const { data: authorData } = await supabaseClient
          .from("users")
          .select("id, email, full_name, avatar_url")
          .eq("id", user.id)
          .single();
        
        if (authorData) {
          author = authorData;
        }
      }
    } catch (error) {
      console.error("Error fetching comment author:", error);
    }

    const enrichedComment = {
      ...comment,
      author: author || null,
    };

    // Increment comments count (trigger should handle this, but we call RPC as backup)
    // Error is intentionally ignored - trigger may have already handled it or RPC may not exist
    try {
      await supabaseClient.rpc("increment_comments_count", { post_id: postId });
    } catch {
      // Ignore RPC errors - trigger may have already handled it
    }

    return NextResponse.json({
      success: true,
      comment: enrichedComment,
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear comentario" },
      { status: 500 }
    );
  }
}

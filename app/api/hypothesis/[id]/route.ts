import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// GET: Obtener una hipótesis específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const hypothesisId = resolvedParams.id;

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

    const { data: hypothesis, error } = await supabaseClient
      .from("hypotheses")
      .select("*")
      .eq("id", hypothesisId)
      .single();

    if (error || !hypothesis) {
      return NextResponse.json(
        { error: "Hipótesis no encontrada" },
        { status: 404 }
      );
    }

    // Verify access
    const { data: startup } = await supabaseClient
      .from("startups")
      .select("id, student_id")
      .eq("id", hypothesis.startup_id)
      .single();

    if (!startup) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const isOwner = startup.student_id === user.id;
    const { data: teamMember } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("startup_id", hypothesis.startup_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isOwner && !teamMember) {
      return NextResponse.json(
        { error: "No tienes acceso a esta hipótesis" },
        { status: 403 }
      );
    }

    return NextResponse.json({ hypothesis });
  } catch (error: any) {
    console.error("Error fetching hypothesis:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener la hipótesis" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una hipótesis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const hypothesisId = resolvedParams.id;
    const {
      hypothesis_text,
      si_clause,
      entonces_clause,
      porque_clause,
      validation_method,
      target_metric,
      success_criteria,
      status,
      change_reason,
    } = await request.json();

    if (!si_clause || !entonces_clause || !porque_clause) {
      return NextResponse.json(
        { error: "si_clause, entonces_clause y porque_clause son requeridos" },
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

    // Get current hypothesis
    const { data: currentHypothesis, error: fetchError } = await supabaseClient
      .from("hypotheses")
      .select("*")
      .eq("id", hypothesisId)
      .single();

    if (fetchError || !currentHypothesis) {
      return NextResponse.json(
        { error: "Hipótesis no encontrada" },
        { status: 404 }
      );
    }

    // Verify access
    const { data: startup } = await supabaseClient
      .from("startups")
      .select("id, student_id")
      .eq("id", currentHypothesis.startup_id)
      .single();

    if (!startup) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const isOwner = startup.student_id === user.id;
    const { data: teamMember } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("startup_id", currentHypothesis.startup_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isOwner && !teamMember) {
      return NextResponse.json(
        { error: "No tienes acceso a esta hipótesis" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      si_clause,
      entonces_clause,
      porque_clause,
      updated_at: new Date().toISOString(),
    };

    if (hypothesis_text) updateData.hypothesis_text = hypothesis_text;
    if (validation_method !== undefined) updateData.validation_method = validation_method;
    if (target_metric !== undefined) updateData.target_metric = target_metric;
    if (success_criteria !== undefined) updateData.success_criteria = success_criteria;
    if (status) updateData.status = status;

    // Update hypothesis (trigger will create version automatically)
    const { data: updatedHypothesis, error: updateError } = await supabaseClient
      .from("hypotheses")
      .update(updateData)
      .eq("id", hypothesisId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating hypothesis:", updateError);
      return NextResponse.json(
        { error: `Error al actualizar la hipótesis: ${updateError.message}` },
        { status: 500 }
      );
    }

    // If change_reason provided, update the latest version
    if (change_reason && updatedHypothesis) {
      await supabaseClient
        .from("hypothesis_versions")
        .update({ change_reason })
        .eq("hypothesis_id", hypothesisId)
        .eq("version_number", updatedHypothesis.version_number - 1)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    return NextResponse.json({
      success: true,
      hypothesis: updatedHypothesis,
    });
  } catch (error: any) {
    console.error("Error updating hypothesis:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la hipótesis" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una hipótesis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const hypothesisId = resolvedParams.id;

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

    // Get hypothesis to verify access
    const { data: hypothesis, error: fetchError } = await supabaseClient
      .from("hypotheses")
      .select("startup_id")
      .eq("id", hypothesisId)
      .single();

    if (fetchError || !hypothesis) {
      return NextResponse.json(
        { error: "Hipótesis no encontrada" },
        { status: 404 }
      );
    }

    // Verify access
    const { data: startup } = await supabaseClient
      .from("startups")
      .select("id, student_id")
      .eq("id", hypothesis.startup_id)
      .single();

    if (!startup) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const isOwner = startup.student_id === user.id;
    const { data: teamMember } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("startup_id", hypothesis.startup_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isOwner && !teamMember) {
      return NextResponse.json(
        { error: "No tienes acceso a esta hipótesis" },
        { status: 403 }
      );
    }

    // Delete hypothesis (cascade will delete versions)
    const { error: deleteError } = await supabaseClient
      .from("hypotheses")
      .delete()
      .eq("id", hypothesisId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Error al eliminar la hipótesis: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting hypothesis:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar la hipótesis" },
      { status: 500 }
    );
  }
}



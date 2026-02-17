import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Crear cliente de Supabase con las cookies del request
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

    // Verificar autenticación - intentar primero con token del header, luego con cookies
    let user: any = null;
    let supabaseClient = supabase;

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Si hay token en el header, crear un cliente con el token
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

    // Si no hay usuario de token, intentar con cookies
    if (!user) {
      const { data: { user: userFromCookies } } = await supabase.auth.getUser();
      user = userFromCookies;
    }

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const landingPageId = params.id;

    if (!landingPageId) {
      return NextResponse.json(
        { error: "ID de landing page requerido" },
        { status: 400 }
      );
    }

    // Verificar que el landing page pertenece al usuario
    const { data: landingPage, error: fetchError } = await supabaseClient
      .from("landing_pages")
      .select("id, startup_id, startups!inner(student_id)")
      .eq("id", landingPageId)
      .single();

    if (fetchError || !landingPage) {
      return NextResponse.json(
        { error: "Landing page no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es dueño del startup asociado
    const startupData = landingPage.startups as any;
    if (startupData?.student_id !== user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta landing page" },
        { status: 403 }
      );
    }

    // Eliminar el landing page
    const { error: deleteError } = await supabaseClient
      .from("landing_pages")
      .delete()
      .eq("id", landingPageId);

    if (deleteError) {
      console.error("Error deleting landing page:", deleteError);
      return NextResponse.json(
        { error: `Error al eliminar: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Landing page eliminada exitosamente",
    });
  } catch (error: any) {
    console.error("Error in delete landing page:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// También podemos agregar GET para obtener un landing page específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Crear cliente de Supabase con las cookies del request
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
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user: u } } = await supabaseWithToken.auth.getUser();
      if (u) {
        user = u;
        supabaseClient = supabaseWithToken;
      }
    }

    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;
    }

    const landingPageId = params.id;

    if (!landingPageId) {
      return NextResponse.json(
        { error: "ID de landing page requerido" },
        { status: 400 }
      );
    }

    // Obtener el landing page
    const { data: landingPage, error: fetchError } = await supabaseClient
      .from("landing_pages")
      .select("*")
      .eq("id", landingPageId)
      .single();

    if (fetchError || !landingPage) {
      return NextResponse.json(
        { error: "Landing page no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ landingPage });
  } catch (error: any) {
    console.error("Error fetching landing page:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
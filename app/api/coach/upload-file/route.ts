import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    // Verificar autenticación
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }

      const formData = await request.formData();
      const file = formData.get("file") as File;
      const description = formData.get("description") as string | null;

      if (!file) {
        return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
      }

      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "El archivo no puede superar 10MB" }, { status: 400 });
      }

      // Validar tipos permitidos
      const allowedTypes = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain", "text/csv"
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: "Tipo de archivo no permitido. Usa: imágenes, PDF, Word, Excel, TXT o CSV" 
        }, { status: 400 });
      }

      // Generar nombre único
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("coach-chat-files")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        // Note: Upload errors are returned to client, no need to log
        return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("coach-chat-files")
        .getPublicUrl(filePath);

      // Guardar en base de datos
      const { data: fileRecord, error: dbError } = await supabase
        .from("coach_chat_files")
        .insert({
          student_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          description: description,
        })
        .select()
        .single();

      if (dbError) {
        // Intentar eliminar el archivo subido
        await supabase.storage.from("coach-chat-files").remove([filePath]);
        // Note: DB errors are returned to client, no need to log
        return NextResponse.json({ error: "Error al guardar registro del archivo" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        file: fileRecord,
      });
    }

    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/coach/upload-file');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        } as any, // Type assertion for @supabase/ssr compatibility
      }
    );

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "ID de archivo requerido" }, { status: 400 });
    }

    // Obtener archivo
    const { data: fileRecord, error: fetchError } = await supabase
      .from("coach_chat_files")
      .select("*")
      .eq("id", fileId)
      .eq("student_id", user.id)
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    // Extraer path del archivo
    const urlParts = fileRecord.file_url.split("/coach-chat-files/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from("coach-chat-files").remove([filePath]);
    }

    // Eliminar registro
    const { error: deleteError } = await supabase
      .from("coach_chat_files")
      .delete()
      .eq("id", fileId);

    if (deleteError) {
      return NextResponse.json({ error: "Error al eliminar archivo" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/coach/upload-file');
  }
}


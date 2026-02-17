import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw ApiErrors.badRequest("No se proporcionó ningún archivo");
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw ApiErrors.badRequest("Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WEBP)");
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw ApiErrors.badRequest("El archivo es demasiado grande. Máximo 5MB");
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Generar nombre único para el archivo
    // El path debe ser: {user_id}/{timestamp}.{ext}
    // NO incluir "avatars/" porque ya estamos usando .from("avatars")
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo a Supabase Storage
    // El path es relativo al bucket, así que solo usamos {user_id}/{filename}
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Reemplazar si ya existe
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      console.error("Upload error details:", {
        message: uploadError.message,
        statusCode: (uploadError as any).statusCode,
        error: (uploadError as any).error,
      });
      return NextResponse.json(
        { error: `Error al subir el avatar: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabaseClient.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Actualizar avatar_url en la tabla users
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating avatar_url:", updateError);
      // No fallar si la actualización falla, el archivo ya está subido
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    return handleApiError(error, "POST /api/profile/upload-avatar");
  }
}


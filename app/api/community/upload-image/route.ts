import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, validateRequestBody, ApiErrors } from "@/lib/api-error-handler";
import { logger } from "@/lib/logger";

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

    // Autenticación
    const { user, supabaseClient } = await authenticateRequest(request);

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo a Supabase Storage (bucket: community)
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("community")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error("Error uploading image to community", uploadError as Error, { userId: user.id });
      throw ApiErrors.internalError(`Error al subir la imagen: ${uploadError.message}`);
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabaseClient.storage
      .from("community")
      .getPublicUrl(filePath);

    logger.info("Image uploaded successfully", { userId: user.id, filePath });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/community/upload-image');
  }
}

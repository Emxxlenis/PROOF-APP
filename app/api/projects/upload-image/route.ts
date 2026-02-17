import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "logo" or "cover"

    if (!file) {
      throw ApiErrors.badRequest("No se proporcionó ningún archivo");
    }

    if (!type || !["logo", "cover"].includes(type)) {
      throw ApiErrors.badRequest("Tipo de imagen inválido. Debe ser 'logo' o 'cover'");
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw ApiErrors.badRequest("Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WEBP)");
    }

    // Validar tamaño
    const maxSize = type === "logo" ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB para logo, 10MB para cover
    if (file.size > maxSize) {
      throw ApiErrors.badRequest(`El archivo es demasiado grande. Máximo ${type === "logo" ? "5MB" : "10MB"}`);
    }

    const { user, supabaseClient } = await authenticateRequest(request);

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${type}/${fileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("projects")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      console.error("Upload error details:", {
        message: uploadError.message,
        statusCode: (uploadError as any).statusCode,
        error: (uploadError as any).error,
      });
      
      // Mensaje más descriptivo para errores de RLS
      if (uploadError.message.includes("row-level security") || uploadError.message.includes("RLS")) {
        return NextResponse.json(
          { 
            error: `Error de permisos (RLS): ${uploadError.message}. Verifica que:\n1. El bucket 'projects' existe en Supabase Storage\n2. El bucket está marcado como público\n3. Las políticas RLS están configuradas correctamente\n\nVer: CONFIGURAR_STORAGE_PROJECTS.md` 
          },
          { status: 403 }
        );
      }
      
      if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("does not exist")) {
        return NextResponse.json(
          { 
            error: `El bucket 'projects' no existe. Créalo desde Supabase Dashboard > Storage. Ver: CONFIGURAR_STORAGE_PROJECTS.md` 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `Error al subir la imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabaseClient.storage
      .from("projects")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    return handleApiError(error, "POST /api/projects/upload-image");
  }
}


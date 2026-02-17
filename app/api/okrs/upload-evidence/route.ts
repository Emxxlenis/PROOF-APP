import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiErrors } from "@/lib/api-error-handler";
import { authenticateRequest } from "@/lib/auth/api-auth";
import { z } from "zod";

const BUCKET = "okr-evidence";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const UploadEvidenceSchema = z.object({
  okrId: z.string().uuid("okrId debe ser un UUID válido"),
  keyResultNumber: z.number().int().min(1).max(3),
  description: z.string().optional(),
});

function extractFilePath(publicUrl: string) {
  const match = publicUrl.match(/okr-evidence\/(.+)$/);
  if (match?.[1]) return match[1];
  try {
    const url = new URL(publicUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === BUCKET);
    if (idx !== -1 && idx < parts.length - 1) {
      return parts.slice(idx + 1).join("/");
    }
  } catch (_) {
    /* ignore */
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const okrId = formData.get("okrId") as string;
    const keyResultNumberStr = formData.get("keyResultNumber") as string;
    const description = formData.get("description") as string | null;

    if (!file) {
      throw ApiErrors.badRequest("No se proporcionó ningún archivo");
    }

    if (file.size > MAX_SIZE) {
      throw ApiErrors.badRequest("El archivo es demasiado grande. El tamaño máximo es 10MB");
    }

    // Validar con Zod
    const validationResult = UploadEvidenceSchema.safeParse({
      okrId,
      keyResultNumber: keyResultNumberStr ? parseInt(keyResultNumberStr) : undefined,
      description,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { okrId: validatedOkrId, keyResultNumber } = validationResult.data;

    const { data: userStartup, error: startupError } = await supabaseClient
      .from("startups")
      .select("id")
      .eq("student_id", user.id)
      .single();

    if (startupError || !userStartup) {
      throw ApiErrors.notFound("Startup");
    }

    const { data: okrData, error: okrError } = await supabaseClient
      .from("okrs")
      .select("id, startup_id")
      .eq("id", validatedOkrId)
      .eq("startup_id", userStartup.id)
      .single();

    if (okrError || !okrData) {
      return NextResponse.json(
        { error: "OKR no encontrado o sin permisos" },
        { status: 404 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `${validatedOkrId}/${keyResultNumber}/${timestamp}.${fileExt}`;
    const filePath = `${user.id}/okr-evidence/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "El bucket 'okr-evidence' no existe. Créalo desde Supabase Dashboard > Storage.",
            details: "Ver: CONFIGURAR_STORAGE_OKR_EVIDENCE.md",
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: `Error al subir el archivo: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseClient.storage.from(BUCKET).getPublicUrl(filePath);

    const { data: evidenceData, error: dbError } = await supabaseClient
      .from("okr_evidence")
      .insert({
        okr_id: validatedOkrId,
        key_result_number: keyResultNumber,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      await supabaseClient.storage.from(BUCKET).remove([filePath]);
      throw ApiErrors.internalError(`Error al guardar la evidencia: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      evidence: evidenceData,
      message: "Evidencia subida exitosamente",
    });
  } catch (error: any) {
    return handleApiError(error, 'POST /api/okrs/upload-evidence');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabaseClient } = await authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const evidenceId = searchParams.get("id");
    if (!evidenceId) {
      return NextResponse.json({ error: "Se requiere el ID de la evidencia" }, { status: 400 });
    }

    const { data: evidence, error: fetchError } = await supabaseClient
      .from("okr_evidence")
      .select(
        `
          *,
          okrs!inner (
            id,
            startups!inner (
              student_id
            )
          )
        `
      )
      .eq("id", evidenceId)
      .single();

    if (fetchError || !evidence) {
      throw ApiErrors.notFound("Evidencia");
    }

    const filePath = extractFilePath(evidence.file_url);
    if (filePath) {
      const { error: storageError } = await supabaseClient.storage.from(BUCKET).remove([filePath]);
      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
      }
    }

    const { error: deleteError } = await supabaseClient.from("okr_evidence").delete().eq("id", evidenceId);
    if (deleteError) {
      throw ApiErrors.internalError(`Error al eliminar la evidencia: ${deleteError.message}`);
    }

    return NextResponse.json({ success: true, message: "Evidencia eliminada exitosamente" });
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/okrs/upload-evidence');
  }
}




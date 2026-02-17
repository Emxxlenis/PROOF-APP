/**
 * Cloudinary configuration and upload helpers
 *
 * WHAT: Server-side image upload/delete using Cloudinary. Used for avatars,
 * community images, and documentation assets.
 *
 * WHY: Credentials (cloud name, API key, secret) must never be hardcoded;
 * they are read from env (CLOUDINARY_*) so the repo stays safe for public use.
 *
 * @module lib/cloudinary
 */

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { logger } from "./logger";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Verifica si Cloudinary está configurado
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Sube una imagen a Cloudinary
 * 
 * @param file - Buffer o string (base64) de la imagen
 * @param folder - Carpeta donde guardar la imagen (opcional)
 * @param options - Opciones adicionales de Cloudinary
 * @returns URL pública de la imagen subida
 */
export async function uploadImage(
  file: Buffer | string,
  folder?: string,
  options?: {
    resource_type?: "image" | "video" | "raw" | "auto";
    transformation?: any[];
    public_id?: string;
    overwrite?: boolean;
    invalidate?: boolean;
  }
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary no está configurado. Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env.local"
    );
  }

  try {
    const uploadOptions: any = {
      folder: folder || "mvp-makers",
      resource_type: options?.resource_type || "image",
      overwrite: options?.overwrite || false,
      invalidate: options?.invalidate || true,
    };

    if (options?.public_id) {
      uploadOptions.public_id = options.public_id;
    }

    if (options?.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    let uploadResult;
    if (Buffer.isBuffer(file)) {
      // Subir desde buffer
      uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(file);
      });
    } else {
      // Subir desde base64 o URL
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    }

    return (uploadResult as any).secure_url;
  } catch (error: any) {
    logger.error("Error uploading to Cloudinary", error as Error, { folder, resourceType: options?.resource_type });
    throw new Error(`Error al subir imagen a Cloudinary: ${error.message}`);
  }
}

/**
 * Elimina una imagen de Cloudinary
 * 
 * @param publicId - ID público de la imagen en Cloudinary
 * @returns Resultado de la eliminación
 */
export async function deleteImage(publicId: string): Promise<any> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary no está configurado");
  }

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    logger.error("Error deleting from Cloudinary", error as Error, { publicId });
    throw new Error(`Error al eliminar imagen de Cloudinary: ${error.message}`);
  }
}

export { cloudinary };

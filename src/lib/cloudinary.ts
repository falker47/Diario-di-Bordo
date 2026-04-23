import type { MediaItem } from "@/types";
import { supabase } from "@/lib/supabase";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  throw new Error(
    "VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET mancanti. Compila .env.local.",
  );
}

type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  resource_type: "image" | "video" | "raw";
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
};

export type UploadProgress = (percent: number) => void;

export async function uploadToCloudinary(
  file: File | Blob,
  folder: string,
  onProgress?: UploadProgress,
): Promise<MediaItem> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const result = await uploadWithProgress(formData, onProgress);

  if (result.resource_type === "video") {
    return {
      type: "video",
      public_id: result.public_id,
      url: result.secure_url,
      thumbnail: buildVideoThumbnailUrl(result.public_id),
      duration: result.duration ?? 0,
    };
  }
  return {
    type: "image",
    public_id: result.public_id,
    url: result.secure_url,
    width: result.width ?? 0,
    height: result.height ?? 0,
  };
}

function uploadWithProgress(
  formData: FormData,
  onProgress?: UploadProgress,
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResponse);
        } catch {
          reject(new Error("Risposta Cloudinary non valida."));
        }
      } else {
        reject(new Error(`Upload Cloudinary fallito (HTTP ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Errore di rete durante l'upload."));
    xhr.send(formData);
  });
}

function buildUrl(
  resource: "image" | "video",
  publicId: string,
  transformations: string,
  extension?: string,
): string {
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/${resource}/upload`;
  const ext = extension ? `.${extension}` : "";
  return `${base}/${transformations}/${publicId}${ext}`;
}

export function buildImageUrl(publicId: string, transformations: string): string {
  return buildUrl("image", publicId, transformations);
}

export function buildVideoUrl(publicId: string, transformations: string): string {
  return buildUrl("video", publicId, transformations);
}

export function buildVideoThumbnailUrl(publicId: string): string {
  return buildUrl("video", publicId, "so_auto,w_800,c_fill,f_auto,q_auto", "jpg");
}

export function thumbnailUrl(item: MediaItem): string {
  if (item.type === "image") {
    return buildImageUrl(item.public_id, "w_400,h_400,c_fill,f_auto,q_auto");
  }
  return item.thumbnail;
}

export function fullViewUrl(item: MediaItem): string {
  if (item.type === "image") {
    return buildImageUrl(item.public_id, "w_1600,f_auto,q_auto");
  }
  return buildVideoUrl(item.public_id, "f_auto,q_auto");
}

export async function deleteMediaFromCloudinary(
  publicId: string,
  resourceType: "image" | "video",
): Promise<void> {
  const { error } = await supabase.functions.invoke("delete-media", {
    body: { public_id: publicId, resource_type: resourceType },
  });
  if (error) throw error;
}

export async function bestEffortCleanupMedia(items: MediaItem[]): Promise<{
  cleaned: number;
  failed: number;
}> {
  let cleaned = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await deleteMediaFromCloudinary(item.public_id, item.type);
      cleaned += 1;
    } catch {
      failed += 1;
    }
  }
  return { cleaned, failed };
}

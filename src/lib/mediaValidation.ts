export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic"]);
export const VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);
export const ALLOWED_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_VIDEO_SECONDS = 60;

export type ValidationResult =
  | { ok: true; kind: "image" | "video"; ext: string }
  | { ok: false; reason: string };

export function fileExtension(file: File): string {
  const dot = file.name.lastIndexOf(".");
  if (dot < 0) return "";
  return file.name.slice(dot + 1).toLowerCase();
}

export async function validateFile(file: File): Promise<ValidationResult> {
  const ext = fileExtension(file);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      reason: `Formato non supportato (.${ext || "?"}). Usa JPG, PNG, WEBP, HEIC, MP4 o MOV.`,
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      ok: false,
      reason: `Il file pesa ${mb} MB, il massimo è 50 MB.`,
    };
  }
  if (VIDEO_EXTENSIONS.has(ext)) {
    let duration: number;
    try {
      duration = await readVideoDuration(file);
    } catch {
      return {
        ok: false,
        reason: "Impossibile leggere la durata del video. Riprova con un altro file.",
      };
    }
    if (duration > MAX_VIDEO_SECONDS) {
      return {
        ok: false,
        reason: `Video troppo lungo (${Math.round(duration)}s). Il massimo è 60 secondi.`,
      };
    }
    return { ok: true, kind: "video", ext };
  }
  return { ok: true, kind: "image", ext };
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(url);
      if (Number.isFinite(d)) resolve(d);
      else reject(new Error("Durata non finita"));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Errore caricamento metadata video"));
    };
    video.src = url;
  });
}

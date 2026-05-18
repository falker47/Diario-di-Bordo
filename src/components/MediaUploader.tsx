import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { IMAGE_EXTENSIONS, validateFile } from "@/lib/mediaValidation";
import { useToast } from "@/hooks/useToast";
import type { MediaItem } from "@/types";

type Pending = {
  localId: number;
  name: string;
  progress: number;
  error: string | null;
};

let nextLocalId = 1;

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.85,
};

export function MediaUploader({
  value,
  onChange,
  diaryDate,
}: {
  value: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  diaryDate: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const { push } = useToast();

  function pickFiles() {
    inputRef.current?.click();
  }

  /* ── Drag-and-drop handlers ─────────────────────────── */

  function handleDragEnter(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setDragOver(true);
  }

  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);
    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      void handleFiles(files);
    }
  }

  /* ── File processing (shared by click & drop) ───────── */

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    if (inputRef.current) inputRef.current.value = "";

    for (const file of arr) {
      const validation = await validateFile(file);
      if (!validation.ok) {
        push(`${file.name}: ${validation.reason}`, "error");
        continue;
      }

      const localId = nextLocalId++;
      setPending((p) => [...p, { localId, name: file.name, progress: 0, error: null }]);

      try {
        let toUpload: File | Blob = file;
        if (IMAGE_EXTENSIONS.has(validation.ext)) {
          toUpload = await imageCompression(file, COMPRESSION_OPTIONS);
        }
        const folder = folderFromDate(diaryDate);
        const result = await uploadToCloudinary(toUpload, folder, (pct) => {
          setPending((p) =>
            p.map((it) => (it.localId === localId ? { ...it, progress: pct } : it)),
          );
        });
        onChange([...value, result]);
        setPending((p) => p.filter((it) => it.localId !== localId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore sconosciuto";
        setPending((p) =>
          p.map((it) => (it.localId === localId ? { ...it, error: msg } : it)),
        );
        push(`${file.name}: upload fallito (${msg})`, "error");
      }
    }
  }

  function removeAt(index: number) {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  }

  function clearPendingError(localId: number) {
    setPending((p) => p.filter((it) => it.localId !== localId));
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <button
        type="button"
        onClick={pickFiles}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-colors duration-200 ${
          dragOver
            ? "border-accent bg-accent/10 text-accent"
            : "border-hairline-strong bg-surface text-secondary hover:border-accent/60 hover:bg-surface-2"
        }`}
      >
        <span>+ Aggiungi foto o video</span>
        <span className="hidden text-xs text-muted sm:inline">
          o trascina qui i file
        </span>
      </button>

      {(value.length > 0 || pending.length > 0) && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.map((item, idx) => (
            <li
              key={item.public_id}
              className="relative overflow-hidden rounded-lg border border-hairline bg-surface-2"
            >
              <div className="aspect-square">
                <img
                  src={item.type === "image" ? item.url : item.thumbnail}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              {item.type === "video" && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  ▶ {Math.round(item.duration)}s
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label="Rimuovi media"
                className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white hover:bg-black"
              >
                ✕
              </button>
            </li>
          ))}
          {pending.map((p) => (
            <li
              key={p.localId}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-hairline bg-surface-2 p-2 text-center text-xs text-secondary"
            >
              <p className="truncate w-full" title={p.name}>{p.name}</p>
              {p.error ? (
                <>
                  <p className="text-red-600 dark:text-red-400">{p.error}</p>
                  <button
                    type="button"
                    onClick={() => clearPendingError(p.localId)}
                    className="text-muted underline"
                  >
                    rimuovi
                  </button>
                </>
              ) : (
                <>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full bg-inverted transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <p>{p.progress}%</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function folderFromDate(diaryDate: string): string {
  const [yyyy, mm] = diaryDate.split("-");
  return `diario/${yyyy}/${mm}`;
}

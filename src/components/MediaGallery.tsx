import { useEffect, useState } from "react";
import type { MediaItem } from "@/types";
import { fullViewUrl, thumbnailUrl } from "@/lib/cloudinary";

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, idx) => (
          <li key={item.public_id} className="relative">
            <button
              type="button"
              onClick={() => setOpenIndex(idx)}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
              aria-label={
                item.type === "image" ? "Apri immagine" : "Apri video"
              }
            >
              <img
                src={thumbnailUrl(item)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              {item.type === "video" && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="rounded-full bg-white/90 px-3 py-2 text-xs font-medium text-slate-800">
                    ▶ {Math.round(item.duration)}s
                  </span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {openIndex !== null && (
        <Lightbox
          items={items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const item = items[index];

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      else if (event.key === "ArrowRight" && index < items.length - 1)
        onNavigate(index + 1);
    }
    window.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
    };
  }, [index, items.length, onClose, onNavigate]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizzazione media"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
      >
        Chiudi ✕
      </button>
      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
          aria-label="Precedente"
          className="absolute left-4 rounded-full bg-white/10 px-4 py-3 text-xl text-white hover:bg-white/20"
        >
          ‹
        </button>
      )}
      {index < items.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
          aria-label="Successivo"
          className="absolute right-4 rounded-full bg-white/10 px-4 py-3 text-xl text-white hover:bg-white/20"
        >
          ›
        </button>
      )}
      <div
        className="max-h-full max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "image" ? (
          <img
            src={fullViewUrl(item)}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        ) : (
          <video
            src={fullViewUrl(item)}
            poster={item.thumbnail}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
          />
        )}
      </div>
    </div>
  );
}

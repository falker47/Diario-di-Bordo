import { useState } from "react";
import { Link } from "react-router-dom";
import { addYears, format, parseISO } from "date-fns";
import { SECTION_LABELS, SECTIONS } from "@/types";
import type { MediaItem, Section } from "@/types";
import { isValidISODate, todayISO } from "@/lib/dates";
import { MediaUploader } from "@/components/MediaUploader";

export type EditorInitial = {
  diary_date: string;
  section: Section;
  text_content: string;
  media: MediaItem[];
};

export type EditorSubmit = {
  diary_date: string;
  section: Section;
  text_content: string | null;
  media: MediaItem[];
};

export function ContributionEditor({
  initial,
  submitLabel,
  cancelTo,
  onSubmit,
}: {
  initial: EditorInitial;
  submitLabel: string;
  cancelTo: string;
  onSubmit: (data: EditorSubmit) => Promise<void>;
}) {
  const today = todayISO();
  const minDate = format(addYears(parseISO(today), -2), "yyyy-MM-dd");

  const [diaryDate, setDiaryDate] = useState(initial.diary_date);
  const [section, setSection] = useState<Section>(initial.section);
  const [text, setText] = useState(initial.text_content);
  const [media, setMedia] = useState<MediaItem[]>(initial.media);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const trimmedText = text.trim();
  const hasContent = trimmedText.length > 0 || media.length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!isValidISODate(diaryDate)) {
      setFormError("Data non valida.");
      return;
    }
    if (diaryDate > today) {
      setFormError("Non puoi scrivere contributi nel futuro.");
      return;
    }
    if (diaryDate < minDate) {
      setFormError("Data troppo vecchia (massimo 2 anni indietro).");
      return;
    }
    if (!hasContent) {
      setFormError("Aggiungi almeno del testo o un media.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        diary_date: diaryDate,
        section,
        text_content: trimmedText || null,
        media,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore di salvataggio.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Data del contributo
          <input
            type="date"
            value={diaryDate}
            min={minDate}
            max={today}
            onChange={(e) => setDiaryDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Puoi scegliere oggi o una data passata (entro 2 anni).
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Sezione</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SECTIONS.map((s) => (
            <label
              key={s}
              className={[
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors",
                section === s
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <input
                type="radio"
                name="section"
                value={s}
                checked={section === s}
                onChange={() => setSection(s)}
                className="sr-only"
              />
              {SECTION_LABELS[s]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Testo
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Cosa è successo oggi?"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">Foto e video</p>
        <p className="mb-2 text-xs text-slate-500">
          Formati: JPG, PNG, WEBP, HEIC, MP4, MOV. Max 50 MB. Video max 60 secondi.
        </p>
        <MediaUploader value={media} onChange={setMedia} diaryDate={diaryDate} />
      </div>

      {formError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Link
          to={cancelTo}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
        >
          Annulla
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? "Salvataggio…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

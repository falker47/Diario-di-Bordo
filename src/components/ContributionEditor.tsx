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
  title: string;
  text_content: string;
  media: MediaItem[];
};

export type EditorSubmit = {
  diary_date: string;
  section: Section;
  title: string | null;
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
  const [title, setTitle] = useState(initial.title);
  const [text, setText] = useState(initial.text_content);
  const [media, setMedia] = useState<MediaItem[]>(initial.media);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const trimmedTitle = title.trim();
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
    if (trimmedTitle.length > 120) {
      setFormError("Il titolo non può superare 120 caratteri.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        diary_date: diaryDate,
        section,
        title: trimmedTitle || null,
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
        <label className="block text-sm font-medium text-primary">
          Data del contributo
          <input
            type="date"
            value={diaryDate}
            min={minDate}
            max={today}
            onChange={(e) => setDiaryDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <p className="mt-1 text-xs text-muted">
          Puoi scegliere oggi o una data passata (entro 2 anni).
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-primary">Sezione</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SECTIONS.map((s) => (
            <label
              key={s}
              className={[
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors",
                section === s
                  ? "border-inverted bg-inverted text-on-inverted"
                  : "border-hairline-strong bg-surface text-secondary hover:bg-surface-2",
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
        <label className="block text-sm font-medium text-primary">
          Titolo (opzionale)
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Es. Laboratorio di pittura"
            className="mt-1 block w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-primary placeholder:text-subtle shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <p className="mt-1 text-xs text-muted">
          Un breve titolo per identificare l'attività. Puoi anche lasciarlo vuoto.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary">
          Testo
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Cosa è successo oggi?"
            className="mt-1 block w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-primary placeholder:text-subtle shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-primary">Foto e video</p>
        <p className="mb-2 text-xs text-muted">
          Formati: JPG, PNG, WEBP, HEIC, MP4, MOV. Max 50 MB. Video max 60 secondi.
        </p>
        <MediaUploader value={media} onChange={setMedia} diaryDate={diaryDate} />
      </div>

      {formError && (
        <div role="alert" className="rounded-xl border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Link
          to={cancelTo}
          className="rounded-lg border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-secondary shadow-sm hover:bg-surface-2"
        >
          Annulla
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-inverted px-4 py-2 text-sm font-medium text-on-inverted shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Salvataggio…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

import type { ContributionWithAuthor } from "@/types";
import { formatShortDate, formatTime } from "@/lib/dates";
import { MediaGallery } from "@/components/MediaGallery";

export function ContributionCard({ contribution }: { contribution: ContributionWithAuthor }) {
  const authorName = contribution.author?.full_name ?? "Autore sconosciuto";
  const time = formatTime(contribution.created_at);
  const editedAt = contribution.last_edited_at;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{authorName}</p>
        <p className="text-xs text-slate-500" title={contribution.created_at}>
          {time}
        </p>
      </header>
      {contribution.text_content && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {contribution.text_content}
        </p>
      )}
      <MediaGallery items={contribution.media ?? []} />
      {editedAt && (
        <p className="mt-3 text-xs italic text-slate-400">
          Modificato il {formatShortDate(editedAt)}
        </p>
      )}
    </article>
  );
}

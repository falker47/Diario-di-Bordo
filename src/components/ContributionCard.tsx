import type { ContributionWithAuthor } from "@/types";
import { formatShortDate, formatTime } from "@/lib/dates";
import { MediaGallery } from "@/components/MediaGallery";

export function ContributionCard({ contribution }: { contribution: ContributionWithAuthor }) {
  const authorName = contribution.author?.full_name ?? "Autore sconosciuto";
  const time = formatTime(contribution.created_at);
  const editedAt = contribution.last_edited_at;

  return (
    <article className="rounded-2xl border border-hairline bg-surface p-4 shadow-card">
      {contribution.title && (
        <h3 className="mb-1 text-base font-medium text-primary">{contribution.title}</h3>
      )}
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-primary">{authorName}</p>
        <p className="text-xs text-muted" title={contribution.created_at}>
          {time}
        </p>
      </header>
      {contribution.text_content && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary">
          {contribution.text_content}
        </p>
      )}
      <MediaGallery items={contribution.media ?? []} />
      {editedAt && (
        <p className="mt-3 text-xs italic text-subtle">
          Modificato il {formatShortDate(editedAt)}
        </p>
      )}
    </article>
  );
}

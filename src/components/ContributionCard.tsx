import { Link } from "react-router-dom";
import type { ContributionWithAuthor } from "@/types";
import { formatShortDate, formatTime } from "@/lib/dates";
import { MediaGallery } from "@/components/MediaGallery";
import { CommentSection } from "@/components/CommentSection";
import { useAuth } from "@/hooks/useAuth";

export function ContributionCard({
  contribution,
  onDelete,
}: {
  contribution: ContributionWithAuthor;
  onDelete?: (contribution: ContributionWithAuthor) => void;
}) {
  const { user } = useAuth();
  const authorName = contribution.author?.full_name ?? "Autore sconosciuto";
  const time = formatTime(contribution.created_at);
  const editedAt = contribution.last_edited_at;
  const isOwner = !!user && user.id === contribution.author_id;

  return (
    <article className="rounded-2xl border border-hairline bg-surface p-4 shadow-card">
      {contribution.title && (
        <h3 className="mb-1 text-base font-medium text-primary">{contribution.title}</h3>
      )}
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-primary">{authorName}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted" title={contribution.created_at}>
            {time}
          </p>
          {isOwner && (
            <div className="flex items-center gap-1">
              <Link
                to={`/admin/modifica/${contribution.id}`}
                aria-label="Modifica contributo"
                className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-primary transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(contribution)}
                  aria-label="Elimina contributo"
                  className="rounded-md p-1 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
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
      <CommentSection contributionId={contribution.id} />
    </article>
  );
}

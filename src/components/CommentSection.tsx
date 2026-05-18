import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatShortDate, formatTime } from "@/lib/dates";
import { COMMENT_MAX_LENGTH, type CommentWithAuthor } from "@/types";

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function formatCommentTimestamp(iso: string): string {
  return `${formatShortDate(iso)} · ${formatTime(iso)}`;
}

export function CommentSection({ contributionId }: { contributionId: string }) {
  const { user, isAuthenticated, isSuperadmin } = useAuth();
  const { push } = useToast();
  const { data, loading, error, refresh } = useComments(contributionId);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CommentWithAuthor | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const canPost = isAuthenticated && !isSuperadmin;
  const trimmed = text.trim();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!user) {
      setFormError("Sessione mancante.");
      return;
    }
    if (trimmed.length === 0) {
      setFormError("Scrivi qualcosa prima di pubblicare.");
      return;
    }
    if (trimmed.length > COMMENT_MAX_LENGTH) {
      setFormError(`Il commento non può superare ${COMMENT_MAX_LENGTH} caratteri.`);
      return;
    }
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("comments").insert({
        contribution_id: contributionId,
        author_id: user.id,
        text_content: trimmed,
      });
      if (insertError) throw new Error(insertError.message);
      setText("");
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto";
      setFormError(msg);
      push(`Commento non pubblicato: ${msg}`, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("comments")
        .delete()
        .eq("id", pendingDelete.id);
      if (deleteError) throw new Error(deleteError.message);
      push("Commento eliminato.", "success");
      setPendingDelete(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto";
      push(`Errore eliminazione: ${msg}`, "error");
    } finally {
      setDeleting(false);
    }
  }

  function canDelete(comment: CommentWithAuthor): boolean {
    if (isSuperadmin) return true;
    return user?.id === comment.author_id;
  }

  return (
    <section className="mt-4 border-t border-hairline pt-3">
      <h4 className="text-xs font-medium uppercase tracking-wider text-subtle">
        Commenti{data.length > 0 ? ` (${data.length})` : ""}
      </h4>

      <div className="mt-2 space-y-2">
        {loading && (
          <p className="text-xs text-muted">Caricamento commenti…</p>
        )}
        {!loading && error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {!loading && !error && data.length === 0 && (
          <p className="text-xs text-muted">
            Nessun commento. {canPost ? "Sii il primo a scrivere." : ""}
          </p>
        )}
        {!loading &&
          !error &&
          data.map((c) => {
            const authorName = c.author?.full_name ?? "Autore sconosciuto";
            const removable = canDelete(c);
            return (
              <article
                key={c.id}
                className="rounded-xl bg-surface-2 px-3 py-2"
              >
                <header className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-semibold text-primary">
                    {authorName}
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className="text-[11px] text-muted"
                      title={c.created_at}
                    >
                      {formatCommentTimestamp(c.created_at)}
                    </p>
                    {removable && (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(c)}
                        aria-label="Elimina commento"
                        className="rounded-md p-1 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </header>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary">
                  {c.text_content}
                </p>
              </article>
            );
          })}
      </div>

      {canPost && (
        <form onSubmit={handleSubmit} className="mt-3">
          <label className="sr-only" htmlFor={`comment-${contributionId}`}>
            Aggiungi un commento
          </label>
          <textarea
            id={`comment-${contributionId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder="Scrivi un commento…"
            className="block w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-primary placeholder:text-subtle shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {formError && (
            <p
              role="alert"
              className="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {formError}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-subtle">
              {trimmed.length}/{COMMENT_MAX_LENGTH}
            </span>
            <button
              type="submit"
              disabled={submitting || trimmed.length === 0}
              className="rounded-lg bg-inverted px-3 py-1.5 text-xs font-medium text-on-inverted shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Pubblico…" : "Pubblica"}
            </button>
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <p className="mt-3 text-xs text-muted">
          <Link
            to="/admin/login"
            className="font-medium text-accent hover:underline"
          >
            Accedi
          </Link>{" "}
          per lasciare un commento.
        </p>
      )}

      {isSuperadmin && (
        <p className="mt-3 text-xs text-muted">
          L'account amministratore non può commentare.
        </p>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminare il commento?"
        message={
          pendingDelete
            ? `Stai per eliminare il commento di ${
                pendingDelete.author?.full_name ?? "autore sconosciuto"
              }. L'azione non si può annullare.`
            : ""
        }
        confirmLabel="Elimina"
        destructive
        busy={deleting}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyContributions } from "@/hooks/useMyContributions";
import { useToast } from "@/hooks/useToast";
import { AdminShell } from "@/components/AdminShell";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SECTION_LABELS } from "@/types";
import type { Contribution } from "@/types";
import { formatLongDate, todayISO } from "@/lib/dates";
import { bestEffortCleanupMedia } from "@/lib/cloudinary";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const { user, profile, profileLoading } = useAuth();
  const { data, loading, error, refresh } = useMyContributions(user?.id ?? null);
  const { push } = useToast();
  const [pendingDelete, setPendingDelete] = useState<Contribution | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const mediaCount = pendingDelete.media?.length ?? 0;
      const cleanup =
        mediaCount > 0
          ? await bestEffortCleanupMedia(pendingDelete.media)
          : { cleaned: 0, failed: 0 };

      const { error: deleteError } = await supabase
        .from("contributions")
        .delete()
        .eq("id", pendingDelete.id);
      if (deleteError) throw new Error(deleteError.message);

      if (cleanup.failed > 0) {
        push(
          `Contributo eliminato. ${cleanup.failed} media non rimossi da Cloudinary (resteranno orfani).`,
          "info",
        );
      } else {
        push("Contributo eliminato.", "success");
      }
      setPendingDelete(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto";
      push(`Errore eliminazione: ${msg}`, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary">
            Ciao{profile ? ` ${profile.full_name}` : ""}
          </h1>
          <p className="text-sm text-muted">I tuoi ultimi contributi</p>
        </div>
        <Link
          to={`/admin/nuovo?date=${todayISO()}`}
          className="rounded-lg bg-inverted px-4 py-2 text-sm font-medium text-on-inverted shadow-sm hover:opacity-90"
        >
          + Nuovo contributo
        </Link>
      </div>

      {(loading || profileLoading) && <ListSkeleton count={4} />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          title="Non hai ancora contributi"
          description="Quando ne crei uno comparirà in questa lista."
          action={
            <Link
              to={`/admin/nuovo?date=${todayISO()}`}
              className="mt-2 rounded-lg bg-inverted px-4 py-2 text-sm font-medium text-on-inverted hover:opacity-90"
            >
              Scrivi il primo contributo
            </Link>
          }
        />
      )}
      {!loading && !error && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-4 py-3 shadow-card"
            >
              <div className="min-w-0 flex-1">
                {c.title && (
                  <p className="text-sm font-medium text-primary">{c.title}</p>
                )}
                <p className={`text-sm ${c.title ? "text-muted" : "font-medium text-primary"}`}>
                  {formatLongDate(c.diary_date)}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  {SECTION_LABELS[c.section]}
                </p>
                {c.text_content && (
                  <p className="mt-1 line-clamp-2 text-sm text-secondary">
                    {c.text_content}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to={`/admin/modifica/${c.id}`}
                  className="rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm font-medium text-secondary shadow-sm hover:bg-surface-2"
                >
                  Modifica
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(c)}
                  className="rounded-lg border border-red-300/60 bg-surface px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  Elimina
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminare il contributo?"
        message={
          pendingDelete
            ? `Stai per eliminare il contributo del ${formatLongDate(
                pendingDelete.diary_date,
              )} (${SECTION_LABELS[pendingDelete.section]}). L'azione non si può annullare${
                (pendingDelete.media?.length ?? 0) > 0
                  ? `: anche ${pendingDelete.media.length} media verranno rimossi.`
                  : "."
              }`
            : ""
        }
        confirmLabel="Elimina"
        destructive
        busy={deleting}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </AdminShell>
  );
}

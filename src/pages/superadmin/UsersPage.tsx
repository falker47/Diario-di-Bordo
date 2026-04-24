import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/AdminShell";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserFormModal } from "@/components/UserFormModal";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useToast } from "@/hooks/useToast";
import { deactivateUserFn, reactivateUserFn } from "@/lib/superadminFns";
import type { Profile } from "@/types";
import { formatShortDate } from "@/lib/dates";

export default function UsersPage() {
  const { data: users, loading, error, refresh } = useAllUsers();
  const { push } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Profile | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  async function handleReactivate(user: Profile) {
    try {
      await reactivateUserFn(user.id);
      push(`${user.full_name} riattivato.`, "success");
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto.";
      push(`Riattivazione fallita: ${msg}`, "error");
    }
  }

  async function handleConfirmDeactivate() {
    if (!deactivateTarget) return;
    setActionBusy(true);
    try {
      await deactivateUserFn(deactivateTarget.id);
      push(`${deactivateTarget.full_name} disattivato.`, "success");
      setDeactivateTarget(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto.";
      push(`Disattivazione fallita: ${msg}`, "error");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <AdminShell>
      <Link
        to="/superadmin"
        className="mb-3 inline-flex items-center text-sm text-muted hover:text-primary"
      >
        ‹ Menu amministrazione
      </Link>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary">Utenti</h1>
          <p className="text-sm text-muted">
            {users.length} {users.length === 1 ? "utente" : "utenti"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-inverted px-4 py-2 text-sm font-medium text-on-inverted shadow-sm hover:opacity-90"
        >
          + Nuovo utente
        </button>
      </div>

      {loading && <TableSkeleton rows={4} columns={5} />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && users.length === 0 && (
        <EmptyState
          title="Nessun utente ancora"
          description="Crea il primo educatore."
        />
      )}
      {!loading && !error && users.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface shadow-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-2 font-medium">Username</th>
                <th className="px-4 py-2 font-medium">Nome completo</th>
                <th className="px-4 py-2 font-medium">Stato</th>
                <th className="px-4 py-2 font-medium">Creato il</th>
                <th className="px-4 py-2 font-medium text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-hairline last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3 font-mono text-xs text-secondary">
                    {u.username}
                  </td>
                  <td className="px-4 py-3 text-primary">{u.full_name}</td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Attivo
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-muted">
                        Disattivato
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {formatShortDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditTarget(u)}
                        className="rounded-lg border border-hairline-strong bg-surface px-2.5 py-1 text-xs font-medium text-secondary shadow-sm hover:bg-surface-2"
                      >
                        Modifica
                      </button>
                      {u.is_active ? (
                        <button
                          type="button"
                          onClick={() => setDeactivateTarget(u)}
                          className="rounded-lg border border-red-300/60 bg-surface px-2.5 py-1 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          Disattiva
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(u)}
                          className="rounded-lg border border-emerald-300/60 bg-surface px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                        >
                          Riattiva
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <UserFormModal
          mode="create"
          target={null}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            refresh();
          }}
        />
      )}
      {editTarget && (
        <UserFormModal
          mode="update"
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Disattivare l'utente?"
        message={
          deactivateTarget
            ? `Sei sicuro? ${deactivateTarget.full_name} non potrà più loggarsi. I suoi contributi resteranno visibili.`
            : ""
        }
        confirmLabel="Disattiva"
        destructive
        busy={actionBusy}
        onCancel={() => !actionBusy && setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </AdminShell>
  );
}

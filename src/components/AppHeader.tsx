import {
  useCallback,
  useEffect,
  useState,
  type SVGProps,
} from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { formatLongDate, todayISO } from "@/lib/dates";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useMyContributions } from "@/hooks/useMyContributions";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { bestEffortCleanupMedia } from "@/lib/cloudinary";
import { supabase } from "@/lib/supabase";
import { SECTION_LABELS } from "@/types";
import type { Contribution } from "@/types";

/* ------------------------------------------------------------------ */
/*  Inline icons (no extra dependencies)                              */
/* ------------------------------------------------------------------ */

type IconProps = SVGProps<SVGSVGElement>;

function IconMenu(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function IconPlus(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconPencil(props: IconProps) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function IconTrash(props: IconProps) {
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

function IconLogout(props: IconProps) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  UserMenu — hamburger + sliding drawer (ChatGPT/Claude-inspired)   */
/* ------------------------------------------------------------------ */

function UserMenu() {
  const { user, profile, isSuperadmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Contribution | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fullName = isSuperadmin
    ? "Amministrazione"
    : profile?.full_name ?? "Utente";

  const firstName = isSuperadmin
    ? "Amministrazione"
    : profile?.full_name?.trim().split(" ")[0] ?? "Utente";

  // Per il superadmin la lista non si popola (l'account non ha contributi).
  const authorId = !isSuperadmin && user ? user.id : null;
  const { data, loading, error, refresh } = useMyContributions(authorId, 50);

  const close = useCallback(() => setOpen(false), []);

  // Chiudi con ESC e blocca lo scroll del body quando il drawer è aperto.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function handleLogout() {
    close();
    await signOut();
    navigate("/admin/login");
  }

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
          `Contributo eliminato. ${cleanup.failed} media non rimossi da Cloudinary.`,
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Apri menu utente"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-primary hover:bg-surface-2 transition-colors"
      >
        <IconMenu className="h-5 w-5" />
        <span className="max-w-[7rem] truncate sm:max-w-[12rem]">
          <span className="sm:hidden">{firstName}</span>
          <span className="hidden sm:inline">{fullName}</span>
        </span>
      </button>

      {open &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              aria-hidden="true"
              onClick={close}
              className="fixed inset-0 z-40 cursor-pointer bg-black/50 backdrop-blur-sm"
            />

          {/* Drawer */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu utente"
            className="fixed left-0 top-0 z-50 flex h-[100dvh] w-[min(20rem,88vw)] flex-col border-r border-hairline bg-surface shadow-2xl"
          >
            {/* Header — same hamburger + name, click toggles closed */}
            <div className="border-b border-hairline px-2 py-2">
              <button
                type="button"
                onClick={close}
                aria-label="Chiudi menu"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2 transition-colors"
              >
                <IconMenu className="h-5 w-5 text-muted shrink-0" />
                <span className="truncate text-sm font-medium text-primary">
                  <span className="sm:hidden">{firstName}</span>
                  <span className="hidden sm:inline">{fullName}</span>
                </span>
              </button>
            </div>

            {!isSuperadmin ? (
              <>
                {/* Primary action — new contribution */}
                <div className="px-3 pt-3">
                  <Link
                    to={`/admin/nuovo?date=${todayISO()}`}
                    onClick={close}
                    className="flex items-center justify-center gap-2 rounded-xl bg-inverted px-4 py-3 text-sm font-semibold text-on-inverted shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <IconPlus className="h-4 w-4" />
                    Nuovo contributo
                  </Link>
                </div>

                {/* My contributions */}
                <div className="flex-1 overflow-y-auto px-2 pt-4 pb-3">
                  <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-subtle">
                    I miei contributi
                  </p>
                  {loading && (
                    <p className="px-2 py-2 text-sm text-muted">Caricamento…</p>
                  )}
                  {!loading && error && (
                    <p className="px-2 py-2 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  {!loading && !error && data.length === 0 && (
                    <p className="px-2 py-3 text-sm text-muted">
                      Non hai ancora contributi.
                    </p>
                  )}
                  {!loading && !error && data.length > 0 && (
                    <ul className="space-y-0.5">
                      {data.map((c) => {
                        const label = c.title ?? formatLongDate(c.diary_date);
                        return (
                          <li
                            key={c.id}
                            className="group flex items-center rounded-lg hover:bg-surface-2 transition-colors"
                          >
                            <Link
                              to={`/giorno/${c.diary_date}`}
                              onClick={close}
                              className="min-w-0 flex-1 px-2.5 py-2"
                              title={label}
                            >
                              <p className="truncate text-sm text-primary">
                                {label}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {formatLongDate(c.diary_date)} ·{" "}
                                {SECTION_LABELS[c.section]}
                              </p>
                            </Link>
                            <div className="flex shrink-0 items-center gap-0.5 pr-1.5">
                              <Link
                                to={`/admin/modifica/${c.id}`}
                                onClick={close}
                                aria-label={`Modifica ${label}`}
                                className="rounded-md p-1.5 text-muted hover:bg-surface-3 hover:text-primary transition-colors"
                              >
                                <IconPencil className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setPendingDelete(c)}
                                aria-label={`Elimina ${label}`}
                                className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                              >
                                <IconTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
                <Link
                  to="/superadmin"
                  onClick={close}
                  className="block rounded-lg bg-surface-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-surface-3 transition-colors"
                >
                  Pannello amministrazione
                </Link>
                <p className="px-1 text-xs text-muted">
                  L'account amministratore non può creare contributi.
                </p>
              </div>
            )}

            {/* Footer — logout */}
            <div className="border-t border-hairline p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:bg-surface-2 transition-colors"
              >
                <IconLogout className="h-4 w-4" />
                Esci
              </button>
            </div>
          </aside>
          </>,
          document.body,
        )}

      {createPortal(
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
        />,
        document.body,
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  AppHeader — shared header bar                                     */
/* ------------------------------------------------------------------ */

export function AppHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b border-hairline bg-surface/80 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-3 items-center gap-3 px-4 py-3">
        <div className="flex items-center justify-start">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link
              to="/admin/login"
              className="text-sm text-muted hover:text-primary"
            >
              Accedi
            </Link>
          )}
        </div>
        <div className="flex items-center justify-center">
          <Link
            to={`/giorno/${todayISO()}`}
            className="text-base font-semibold text-primary text-center"
          >
            Diario di Bordo
          </Link>
        </div>
        <div className="flex items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

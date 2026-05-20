import {
  useCallback,
  useEffect,
  useState,
  type SVGProps,
} from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { todayISO } from "@/lib/dates";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { SECTIONS, SECTION_LABELS } from "@/types";

/* ------------------------------------------------------------------ */
/*  Inline icons (no extra dependencies)                              */
/* ------------------------------------------------------------------ */

type IconProps = SVGProps<SVGSVGElement>;

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

function IconFolder(props: IconProps) {
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
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconHome(props: IconProps) {
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
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  UserMenu — hamburger + sliding drawer (ChatGPT/Claude-inspired)   */
/* ------------------------------------------------------------------ */

function UserMenu() {
  const { profile, isSuperadmin, signOut } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const fullName = isSuperadmin
    ? "Amministrazione"
    : profile?.full_name ?? "Utente";

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

  /* Derive initials for the avatar */
  const initials = isSuperadmin
    ? "A"
    : (profile?.full_name ?? "U")
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

  return (
    <>
      {/* Hamburger trigger — visually prominent with accent avatar + pulse ring */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Apri menu utente"
        style={{
          /* Custom CSS variables consumed below */
          // @ts-ignore
          "--hw-accent": "rgb(var(--color-accent))",
        }}
        className={
          [
            "group relative flex items-center gap-2 rounded-xl px-2 py-1.5",
            "text-sm font-semibold text-[rgb(var(--color-accent))]",
            "border border-[rgb(var(--color-accent)/0.25)]",
            "bg-[rgb(var(--color-accent)/0.08)]",
            "hover:bg-[rgb(var(--color-accent)/0.15)] hover:border-[rgb(var(--color-accent)/0.5)]",
            "transition-all duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-accent))]",
          ].join(" ")
        }
      >
        {/* Animated hamburger bars */}
        <span className="hamburger-bars flex h-5 w-5 shrink-0 flex-col justify-between py-[3px] group-hover:gap-[1px] transition-all">
          <span className="hamburger-bar block h-[2px] rounded-full bg-current origin-left transition-all duration-300" />
          <span className="hamburger-bar block h-[2px] rounded-full bg-current transition-all duration-300" />
          <span className="hamburger-bar block h-[2px] rounded-full bg-current origin-left transition-all duration-300" />
        </span>
        {/* Avatar circle with initials */}
        <span
          aria-hidden="true"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-accent))] text-[10px] font-bold text-white shadow-sm"
        >
          {initials}
        </span>
        {/* Name — hidden on very small screens */}
        <span className="hidden sm:block max-w-[10rem] truncate">{fullName}</span>
      </button>

      {open &&
        createPortal(
          <>
            {/* Backdrop — fade-in */}
            <div
              aria-hidden="true"
              onClick={close}
              className="fixed inset-0 z-40 cursor-pointer bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
            />

            {/* Drawer — slide-in from left */}
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu utente"
              className="fixed left-0 top-0 z-50 flex h-[100dvh] w-[min(22rem,90vw)] flex-col border-r border-[rgb(var(--color-accent)/0.2)] bg-surface shadow-2xl animate-[slideInLeft_200ms_cubic-bezier(0.25,0.46,0.45,0.94)]"
            >
              {/* Drawer header — accent gradient bar + avatar + name */}
              <div className="border-b border-[rgb(var(--color-accent)/0.2)] bg-[rgb(var(--color-accent)/0.06)] px-3 py-3">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Chiudi menu"
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[rgb(var(--color-accent)/0.1)] transition-colors group"
                >
                  {/* Large avatar inside drawer */}
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-accent))] text-sm font-bold text-white shadow-md"
                  >
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-primary">
                      {fullName}
                    </span>
                  </span>
                  {/* Animated close X */}
                  <span
                    className="ml-auto text-muted group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      className="h-4 w-4"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
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

                  {/* Sections — three big buttons */}
                  <div className="flex-1 overflow-y-auto px-3 pt-4 pb-3">
                    <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Navigazione
                    </p>
                    <ul className="space-y-1.5 pb-3">
                      <li>
                        <Link
                          to={`/giorno/${todayISO()}`}
                          onClick={close}
                          className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-3 py-3 text-sm font-medium text-primary shadow-sm hover:border-[rgb(var(--color-accent)/0.5)] hover:bg-[rgb(var(--color-accent)/0.06)] transition-colors"
                        >
                          <IconHome className="h-4 w-4 text-[rgb(var(--color-accent))]" />
                          Home
                        </Link>
                      </li>
                    </ul>

                    <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Categorie
                    </p>
                    <ul className="space-y-1.5">
                      {SECTIONS.map((s) => (
                        <li key={s}>
                          <Link
                            to={`/categoria/${s}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-3 py-3 text-sm font-medium text-primary shadow-sm hover:border-[rgb(var(--color-accent)/0.5)] hover:bg-[rgb(var(--color-accent)/0.06)] transition-colors"
                          >
                            <IconFolder className="h-4 w-4 text-[rgb(var(--color-accent))]" />
                            {SECTION_LABELS[s]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
                  <Link
                    to={`/giorno/${todayISO()}`}
                    onClick={close}
                    className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-surface-3 transition-colors"
                  >
                    <IconHome className="h-4 w-4 text-[rgb(var(--color-accent))]" />
                    Home
                  </Link>
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

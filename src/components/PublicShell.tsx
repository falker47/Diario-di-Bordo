import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { todayISO } from "@/lib/dates";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  UserMenu — dropdown visible only when authenticated               */
/* ------------------------------------------------------------------ */

function UserMenu() {
  const { profile, isSuperadmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = isSuperadmin
    ? "Amministrazione"
    : profile?.full_name ?? "Utente";

  // Close on outside click (mousedown covers touch-start on mobile)
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  async function handleLogout() {
    close();
    await signOut();
    navigate("/admin/login");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-surface-2 transition-colors"
      >
        <span className="max-w-[10rem] truncate">{displayName}</span>
        <span aria-hidden="true" className="text-muted">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-hairline bg-surface shadow-card"
        >
          {/* Regular user links — hidden for superadmin */}
          {!isSuperadmin && (
            <>
              <Link
                to="/admin/nuovo"
                role="menuitem"
                onClick={close}
                className="block px-4 py-2.5 text-sm text-primary hover:bg-surface-2 transition-colors"
              >
                Nuovo contributo
              </Link>
              <Link
                to="/admin"
                role="menuitem"
                onClick={close}
                className="block px-4 py-2.5 text-sm text-primary hover:bg-surface-2 transition-colors"
              >
                I miei contributi
              </Link>
            </>
          )}

          {/* Superadmin link */}
          {isSuperadmin && (
            <Link
              to="/superadmin"
              role="menuitem"
              onClick={close}
              className="block px-4 py-2.5 text-sm text-primary hover:bg-surface-2 transition-colors"
            >
              Amministrazione
            </Link>
          )}

          {/* Separator */}
          <div className="border-t border-hairline" role="separator" />

          {/* Logout */}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-surface-2 transition-colors"
          >
            Esci
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PublicShell                                                        */
/* ------------------------------------------------------------------ */

export function PublicShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-hairline bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to={`/giorno/${todayISO()}`}
            className="text-base font-semibold text-primary"
          >
            Diario di Bordo
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

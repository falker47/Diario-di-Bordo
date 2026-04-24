import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminShell({ children }: { children: ReactNode }) {
  const { profile, isSuperadmin, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = isSuperadmin
    ? "Amministrazione"
    : profile?.full_name ?? "Utente";

  async function handleLogout() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-hairline bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to={isSuperadmin ? "/superadmin" : "/admin"}
            className="text-base font-semibold text-primary"
          >
            Diario di Bordo · Area riservata
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <ThemeToggle />
            <span className="hidden text-secondary sm:inline">{displayName}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 font-medium text-secondary shadow-sm hover:bg-surface-2"
            >
              Esci
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

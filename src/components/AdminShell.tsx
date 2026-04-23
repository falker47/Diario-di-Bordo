import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to={isSuperadmin ? "/superadmin" : "/admin"}
            className="text-base font-semibold text-slate-800"
          >
            Diario di Bordo · Area riservata
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{displayName}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-100"
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

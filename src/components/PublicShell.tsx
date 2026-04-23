import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { todayISO } from "@/lib/dates";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to={`/giorno/${todayISO()}`} className="text-base font-semibold text-slate-800">
            Diario di Bordo
          </Link>
          <Link
            to="/admin/login"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Accedi
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

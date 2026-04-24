import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { todayISO } from "@/lib/dates";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PublicShell({ children }: { children: ReactNode }) {
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
            <Link
              to="/admin/login"
              className="text-sm text-muted hover:text-primary"
            >
              Accedi
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

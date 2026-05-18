import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

/* ------------------------------------------------------------------ */
/*  PublicShell                                                        */
/* ------------------------------------------------------------------ */

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

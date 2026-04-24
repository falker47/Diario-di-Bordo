import { Link } from "react-router-dom";
import { AdminShell } from "@/components/AdminShell";

export default function MenuPage() {
  return (
    <AdminShell>
      <h1 className="mb-1 text-xl font-semibold text-primary">Amministrazione</h1>
      <p className="mb-6 text-sm text-muted">
        Strumenti di gestione per l'account amministrazione.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/superadmin/posts"
          className="group rounded-2xl border border-hairline bg-surface p-6 shadow-card hover:border-hairline-strong hover:shadow-md"
        >
          <p className="text-base font-semibold text-primary">Modifica post esistenti</p>
          <p className="mt-1 text-sm text-muted">
            Tutti i contributi della comunità, filtrabili per autore, data e sezione.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-secondary group-hover:underline">
            Apri →
          </span>
        </Link>

        <Link
          to="/superadmin/utenti"
          className="group rounded-2xl border border-hairline bg-surface p-6 shadow-card hover:border-hairline-strong hover:shadow-md"
        >
          <p className="text-base font-semibold text-primary">Gestisci utenti</p>
          <p className="mt-1 text-sm text-muted">
            Crea nuovi educatori, modifica i dati esistenti, disattiva chi non fa più
            parte del gruppo.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-secondary group-hover:underline">
            Apri →
          </span>
        </Link>
      </div>
    </AdminShell>
  );
}

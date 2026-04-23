import { Link } from "react-router-dom";
import { AdminShell } from "@/components/AdminShell";

export default function MenuPage() {
  return (
    <AdminShell>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Amministrazione</h1>
      <p className="mb-6 text-sm text-slate-500">
        Strumenti di gestione per l'account amministrazione.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/superadmin/posts"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-400 hover:shadow-md"
        >
          <p className="text-base font-semibold text-slate-900">Modifica post esistenti</p>
          <p className="mt-1 text-sm text-slate-500">
            Tutti i contributi della comunità, filtrabili per autore, data e sezione.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-slate-700 group-hover:underline">
            Apri →
          </span>
        </Link>

        <Link
          to="/superadmin/utenti"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-400 hover:shadow-md"
        >
          <p className="text-base font-semibold text-slate-900">Gestisci utenti</p>
          <p className="mt-1 text-sm text-slate-500">
            Crea nuovi educatori, modifica i dati esistenti, disattiva chi non fa più
            parte del gruppo.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-slate-700 group-hover:underline">
            Apri →
          </span>
        </Link>
      </div>
    </AdminShell>
  );
}

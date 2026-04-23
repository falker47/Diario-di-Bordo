import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/AdminShell";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  PAGE_SIZE,
  useAllContributions,
  type ContributionFilters,
} from "@/hooks/useAllContributions";
import { useAllUsers } from "@/hooks/useAllUsers";
import { SECTIONS, SECTION_LABELS } from "@/types";
import type { Section } from "@/types";
import { formatShortDate } from "@/lib/dates";

export default function PostsPage() {
  const [authorId, setAuthorId] = useState<string>("");
  const [section, setSection] = useState<Section | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const filters = useMemo<ContributionFilters>(
    () => ({
      authorId: authorId || undefined,
      section: section || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [authorId, section, dateFrom, dateTo],
  );

  const {
    data: contributions,
    totalCount,
    loading,
    error,
  } = useAllContributions(filters, page);
  const { data: users } = useAllUsers();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasFilters = Boolean(authorId || section || dateFrom || dateTo);

  function resetFilters() {
    setAuthorId("");
    setSection("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }

  function handleFilterChange<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(0);
    };
  }

  return (
    <AdminShell>
      <Link
        to="/superadmin"
        className="mb-3 inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        ‹ Menu amministrazione
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Tutti i contributi</h1>
      <p className="mb-4 text-sm text-slate-500">
        {totalCount} {totalCount === 1 ? "contributo" : "contributi"}
        {hasFilters && " con i filtri correnti"}.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Autore
          <select
            value={authorId}
            onChange={(e) => handleFilterChange(setAuthorId)(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          >
            <option value="">Tutti</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} {u.is_active ? "" : "(disattivato)"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Sezione
          <select
            value={section}
            onChange={(e) =>
              handleFilterChange(setSection)(e.target.value as Section | "")
            }
            className="mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          >
            <option value="">Tutte</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {SECTION_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Dal
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Al
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleFilterChange(setDateTo)(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          />
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="justify-self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:col-span-4"
          >
            Pulisci filtri
          </button>
        )}
      </div>

      {loading && <ListSkeleton count={5} />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && contributions.length === 0 && (
        <EmptyState
          title="Nessun contributo trovato"
          description={
            hasFilters ? "Prova a pulire o allargare i filtri." : "Il diario è vuoto."
          }
        />
      )}
      {!loading && !error && contributions.length > 0 && (
        <>
          <ul className="space-y-2">
            {contributions.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {formatShortDate(c.diary_date)} · {SECTION_LABELS[c.section]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.author?.full_name ?? "Autore sconosciuto"}
                    {c.author?.is_active === false && " (disattivato)"}
                  </p>
                  {c.text_content && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {c.text_content}
                    </p>
                  )}
                </div>
                <Link
                  to={`/admin/modifica/${c.id}`}
                  className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
                >
                  Apri
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="Paginazione"
              className="mt-4 flex items-center justify-between gap-2"
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹ Precedente
              </button>
              <span className="text-sm text-slate-500">
                Pagina {page + 1} di {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Successiva ›
              </button>
            </nav>
          )}
        </>
      )}
    </AdminShell>
  );
}

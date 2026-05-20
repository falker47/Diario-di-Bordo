import { useEffect, useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  // Debounce per la search (300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset pagina quando la search applicata cambia.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const filters = useMemo<ContributionFilters>(
    () => ({
      authorId: authorId || undefined,
      section: section || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      searchQuery: debouncedSearch || undefined,
    }),
    [authorId, section, dateFrom, dateTo, debouncedSearch],
  );

  const {
    data: contributions,
    totalCount,
    loading,
    error,
  } = useAllContributions(filters, page);
  const { data: users } = useAllUsers();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasFilters = Boolean(
    authorId || section || dateFrom || dateTo || debouncedSearch,
  );

  function resetFilters() {
    setAuthorId("");
    setSection("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setDebouncedSearch("");
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
        className="mb-3 inline-flex items-center text-sm text-muted hover:text-primary"
      >
        ‹ Menu amministrazione
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-primary">Tutti i contributi</h1>
      <p className="mb-4 text-sm text-muted">
        {totalCount} {totalCount === 1 ? "contributo" : "contributi"}
        {hasFilters && " con i filtri correnti"}.
      </p>

      <div className="mb-4 space-y-3 rounded-xl border border-hairline bg-surface p-4 shadow-card">
        <label className="relative block">
          <span className="sr-only">Cerca nei contributi</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nel testo o nel titolo…"
            className="block w-full rounded-lg border border-hairline-strong bg-surface py-2 pl-9 pr-3 text-sm text-primary placeholder:text-subtle shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="flex flex-col text-xs font-medium text-secondary">
          Autore
          <select
            value={authorId}
            onChange={(e) => handleFilterChange(setAuthorId)(e.target.value)}
            className="mt-1 rounded-lg border border-hairline-strong bg-surface px-2 py-1.5 text-sm text-primary"
          >
            <option value="">Tutti</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} {u.is_active ? "" : "(disattivato)"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-secondary">
          Sezione
          <select
            value={section}
            onChange={(e) =>
              handleFilterChange(setSection)(e.target.value as Section | "")
            }
            className="mt-1 rounded-lg border border-hairline-strong bg-surface px-2 py-1.5 text-sm text-primary"
          >
            <option value="">Tutte</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {SECTION_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-secondary">
          Dal
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)}
            className="mt-1 rounded-lg border border-hairline-strong bg-surface px-2 py-1.5 text-sm text-primary"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-secondary">
          Al
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleFilterChange(setDateTo)(e.target.value)}
            className="mt-1 rounded-lg border border-hairline-strong bg-surface px-2 py-1.5 text-sm text-primary"
          />
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="justify-self-start rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2 sm:col-span-4"
          >
            Pulisci filtri
          </button>
        )}
        </div>
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
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-4 py-3 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  {c.title && (
                    <p className="text-sm font-medium text-primary">{c.title}</p>
                  )}
                  <p className={`text-sm ${c.title ? "text-muted" : "font-medium text-primary"}`}>
                    {formatShortDate(c.diary_date)} · {SECTION_LABELS[c.section]}
                  </p>
                  <p className="text-xs text-muted">
                    {c.author?.full_name ?? "Autore sconosciuto"}
                    {c.author?.is_active === false && " (disattivato)"}
                  </p>
                  {c.text_content && (
                    <p className="mt-1 line-clamp-2 text-sm text-secondary">
                      {c.text_content}
                    </p>
                  )}
                </div>
                <Link
                  to={`/admin/modifica/${c.id}`}
                  className="shrink-0 rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm font-medium text-secondary shadow-sm hover:bg-surface-2"
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
                className="rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm font-medium text-secondary shadow-sm hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹ Precedente
              </button>
              <span className="text-sm text-muted">
                Pagina {page + 1} di {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm font-medium text-secondary shadow-sm hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
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

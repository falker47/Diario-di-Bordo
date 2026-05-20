import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, useParams } from "react-router-dom";
import { PublicShell } from "@/components/PublicShell";
import { ContributionCard } from "@/components/ContributionCard";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  PAGE_SIZE,
  useAllContributions,
  type ContributionFilters,
} from "@/hooks/useAllContributions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";
import { bestEffortCleanupMedia } from "@/lib/cloudinary";
import { formatLongDate, todayISO } from "@/lib/dates";
import {
  SECTIONS,
  SECTION_LABELS,
  type ContributionWithAuthor,
  type Section,
} from "@/types";

function isSection(value: string | undefined): value is Section {
  return !!value && (SECTIONS as readonly string[]).includes(value);
}

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function SectionPage() {
  const { section: sectionParam } = useParams<{ section: string }>();
  const { isAuthenticated, isSuperadmin } = useAuth();
  const { push } = useToast();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pendingDelete, setPendingDelete] =
    useState<ContributionWithAuthor | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce per la search (300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset di filtri e pagina quando cambia categoria (il componente è riusato).
  useEffect(() => {
    setSearch("");
    setDebouncedSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }, [sectionParam]);

  // Reset pagina quando cambiano i filtri.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, dateFrom, dateTo]);

  const sectionValid = isSection(sectionParam);
  // Fallback per non rompere l'ordine degli hook quando la URL è invalida.
  const section: Section = sectionValid ? sectionParam : "quotidiani";

  const filters = useMemo<ContributionFilters>(
    () => ({
      section,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      searchQuery: debouncedSearch || undefined,
    }),
    [section, dateFrom, dateTo, debouncedSearch],
  );
  const { data, totalCount, loading, error, refresh } = useAllContributions(
    filters,
    page,
  );

  if (!sectionValid) {
    return <Navigate to="/" replace />;
  }

  const canWrite = isAuthenticated && !isSuperadmin;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const label = SECTION_LABELS[section];
  const hasActiveFilters = !!(debouncedSearch || dateFrom || dateTo);

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setDateFrom("");
    setDateTo("");
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const mediaCount = pendingDelete.media?.length ?? 0;
      const cleanup =
        mediaCount > 0
          ? await bestEffortCleanupMedia(pendingDelete.media)
          : { cleaned: 0, failed: 0 };

      const { error: deleteError } = await supabase
        .from("contributions")
        .delete()
        .eq("id", pendingDelete.id);
      if (deleteError) throw new Error(deleteError.message);

      if (cleanup.failed > 0) {
        push(
          `Contributo eliminato. ${cleanup.failed} media non rimossi da Cloudinary (resteranno orfani).`,
          "info",
        );
      } else {
        push("Contributo eliminato.", "success");
      }
      setPendingDelete(null);
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto";
      push(`Errore eliminazione: ${msg}`, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PublicShell>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">
            Categoria
          </p>
          <h1 className="text-2xl font-semibold text-primary">{label}</h1>
          <p className="mt-1 text-sm text-muted">
            {totalCount} {totalCount === 1 ? "contributo" : "contributi"}
            {hasActiveFilters ? " (filtrati)" : ""}
          </p>
        </div>
        {canWrite && (
          <Link
            to={`/admin/nuovo?date=${todayISO()}&section=${section}`}
            className="shrink-0 rounded-lg bg-inverted px-4 py-2 text-sm font-medium text-on-inverted shadow-sm hover:opacity-90"
          >
            + Nuovo contributo
          </Link>
        )}
      </div>

      {/* Tab switch tra categorie */}
      <nav
        aria-label="Cambia categoria"
        className="mb-4 flex gap-1.5 overflow-x-auto rounded-xl border border-hairline bg-surface p-1 shadow-card"
      >
        {SECTIONS.map((s) => (
          <NavLink
            key={s}
            to={`/categoria/${s}`}
            className={({ isActive }) =>
              [
                "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
                isActive
                  ? "bg-inverted text-on-inverted shadow-sm"
                  : "text-secondary hover:bg-surface-2",
              ].join(" ")
            }
          >
            {SECTION_LABELS[s]}
          </NavLink>
        ))}
      </nav>

      {/* Toolbar: search + filtri data */}
      <div className="mb-5 space-y-3 rounded-xl border border-hairline bg-surface p-3 shadow-card">
        <label className="relative block">
          <span className="sr-only">Cerca nei contributi</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <IconSearch className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nel testo o nel titolo…"
            className="block w-full rounded-lg border border-hairline-strong bg-surface py-2 pl-9 pr-3 text-sm text-primary placeholder:text-subtle shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col text-xs font-medium text-secondary">
            Dal
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="mt-1 rounded-lg border border-hairline-strong bg-surface px-2 py-1.5 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-secondary">
            Al
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="mt-1 rounded-lg border border-hairline-strong bg-surface px-2 py-1.5 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="w-full rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm text-secondary shadow-sm hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading && <ListSkeleton count={4} />}
      {!loading && error && <ErrorBox message={error} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          title={
            hasActiveFilters
              ? "Nessun contributo trovato"
              : `Nessun contributo in "${label}"`
          }
          description={
            hasActiveFilters
              ? "Prova ad allargare il periodo o cambia la ricerca."
              : canWrite
                ? "Quando ne crei uno comparirà qui."
                : "Torna più tardi per leggere i nuovi contributi."
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 rounded-lg border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-2"
              >
                Azzera filtri
              </button>
            ) : canWrite ? (
              <Link
                to={`/admin/nuovo?date=${todayISO()}&section=${section}`}
                className="mt-2 rounded-lg bg-inverted px-4 py-2 text-sm font-medium text-on-inverted hover:opacity-90"
              >
                Scrivi il primo
              </Link>
            ) : undefined
          }
        />
      )}
      {!loading && !error && data.length > 0 && (
        <div className="space-y-4">
          {data.map((c) => (
            <div key={c.id}>
              <p className="mb-1 pl-1 text-xs text-muted">
                <Link
                  to={`/giorno/${c.diary_date}`}
                  className="hover:text-primary"
                >
                  {formatLongDate(c.diary_date)}
                </Link>
              </p>
              <ContributionCard
                contribution={c}
                onDelete={setPendingDelete}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <nav
          aria-label="Paginazione"
          className="mt-6 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm text-secondary shadow-sm hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ‹ Precedente
          </button>
          <p className="text-xs text-muted">
            Pagina {page + 1} di {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm text-secondary shadow-sm hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Successiva ›
          </button>
        </nav>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminare il contributo?"
        message={
          pendingDelete
            ? `Stai per eliminare il contributo del ${formatLongDate(
                pendingDelete.diary_date,
              )} (${SECTION_LABELS[pendingDelete.section]}). L'azione non si può annullare${
                (pendingDelete.media?.length ?? 0) > 0
                  ? `: anche ${pendingDelete.media.length} media verranno rimossi.`
                  : "."
              }`
            : ""
        }
        confirmLabel="Elimina"
        destructive
        busy={deleting}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </PublicShell>
  );
}

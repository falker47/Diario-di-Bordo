import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { it } from "date-fns/locale";
import {
  formatLongDate,
  isValidYear,
  toISODate,
  toYearMonth,
  todayISO,
} from "@/lib/dates";
import { useContributionCountsByDate } from "@/hooks/useContributions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSwipe } from "@/hooks/useSwipe";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { PublicShell } from "@/components/PublicShell";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorBox } from "@/components/ui/ErrorBox";

const WEEKDAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];

export default function YearPage() {
  const { yyyy } = useParams<{ yyyy: string }>();
  const navigate = useNavigate();

  if (!yyyy || !isValidYear(yyyy)) {
    return <Navigate to={`/anno/${new Date().getFullYear()}`} replace />;
  }

  const year = Number(yyyy);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const { data: counts, loading, error } = useContributionCountsByDate(
    toISODate(yearStart),
    toISODate(yearEnd),
  );

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, m) => new Date(year, m, 1)),
    [year],
  );

  const daysWithContent = useMemo(() => {
    let n = 0;
    for (const value of counts.values()) if (value > 0) n++;
    return n;
  }, [counts]);

  useKeyboardShortcuts({
    ArrowLeft: () => navigate(`/anno/${year - 1}`),
    ArrowRight: () => navigate(`/anno/${year + 1}`),
    t: () => navigate(`/anno/${parseISO(todayISO()).getFullYear()}`),
    T: () => navigate(`/anno/${parseISO(todayISO()).getFullYear()}`),
  });

  useSwipe({
    onSwipeRight: () => navigate(`/anno/${year - 1}`),
    onSwipeLeft: () => navigate(`/anno/${year + 1}`),
  });

  const currentYearStr = String(parseISO(todayISO()).getFullYear());
  const isCurrentYear = yyyy === currentYearStr;

  return (
    <PublicShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb level="year" value={yyyy} />
        <ViewSwitcher anchor={{ kind: "year", value: yyyy }} />
      </div>

      <div className="mb-4 flex items-start justify-between gap-2">
        <Link
          to={`/anno/${year - 1}`}
          className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm text-secondary shadow-card hover:bg-surface-2"
          aria-label="Anno precedente"
        >
          ‹ Precedente
        </Link>

        <div className="inline-flex items-center overflow-hidden rounded-lg border border-hairline-strong bg-surface shadow-card">
          <input
            type="number"
            value={year}
            min="2000"
            max={currentYearStr}
            onChange={(event) => {
              const next = event.target.value;
              if (isValidYear(next)) navigate(`/anno/${next}`);
            }}
            aria-label="Scegli un anno"
            className="w-20 border-0 bg-transparent px-3 py-1.5 text-center text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {isCurrentYear ? (
            <span
              aria-disabled="true"
              className="border-l border-hairline bg-surface-2 px-3 py-1.5 text-sm font-medium text-subtle"
            >
              Corrente
            </span>
          ) : (
            <Link
              to={`/anno/${currentYearStr}`}
              className="border-l border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
            >
              Corrente
            </Link>
          )}
        </div>

        <Link
          to={`/anno/${year + 1}`}
          aria-label="Anno successivo"
          className={`rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm shadow-card ${
            isCurrentYear
              ? "pointer-events-none text-subtle"
              : "text-secondary hover:bg-surface-2"
          }`}
          aria-disabled={isCurrentYear}
        >
          Successivo ›
        </Link>
      </div>

      <h1 className="mb-4 text-xl font-semibold text-primary">
        {year}
        {isCurrentYear && <span className="ml-2 text-sm font-normal text-muted">(anno corrente)</span>}
      </h1>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <>
          {!loading && (
            <p className="mb-4 text-center text-sm text-muted">
              {daysWithContent === 0
                ? "Nessun contributo in questo anno"
                : daysWithContent === 1
                  ? "1 giornata con contributi"
                  : `${daysWithContent} giornate con contributi`}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {months.map((m) => (
              <MiniMonth key={m.getMonth()} anchor={m} counts={counts} />
            ))}
          </div>
          <Legend />
        </>
      )}
    </PublicShell>
  );
}

function MiniMonth({
  anchor,
  counts,
}: {
  anchor: Date;
  counts: Map<string, number>;
}) {
  const monthLabel = format(anchor, "LLLL", { locale: it });
  const yyyymm = toYearMonth(anchor);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const today = todayISO();

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-3 shadow-card">
      <Link
        to={`/mese/${yyyymm}`}
        className="mb-2 block text-center text-sm font-semibold capitalize text-primary hover:text-accent"
      >
        {monthLabel}
      </Link>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-subtle">
        {WEEKDAY_LABELS.map((d, i) => (
          <div 
            key={i} 
            className={i === 5 || i === 6 ? "font-bold text-red-500 dark:text-red-500" : ""}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((day, i) => {
          const iso = toISODate(day);
          const inMonth = day >= monthStart && day <= monthEnd;
          if (!inMonth) {
            return <span key={i} className="aspect-square" aria-hidden />;
          }
          const count = counts.get(iso) ?? 0;
          const isToday = iso === today;
          const title =
            count > 0
              ? `${formatLongDate(iso)} · ${count} ${count === 1 ? "contributo" : "contributi"}`
              : formatLongDate(iso);
          return (
            <Link
              key={iso}
              to={`/giorno/${iso}`}
              title={title}
              aria-label={title}
              className={[
                "flex aspect-square items-center justify-center rounded text-[11px] transition-colors",
                cellClass(count),
                isToday
                  ? "ring-1 ring-accent ring-offset-1 ring-offset-surface"
                  : "",
              ].join(" ")}
            >
              {day.getDate()}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function buildMonthGrid(anchor: Date): Date[] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (
    let d = start;
    d <= end;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    days.push(d);
  }
  return days;
}

function cellClass(count: number): string {
  if (count === 0) return "text-subtle hover:bg-surface-2";
  if (count === 1)
    return "bg-emerald-200 text-emerald-950 hover:opacity-90 dark:bg-emerald-900 dark:text-emerald-100";
  if (count <= 3)
    return "bg-emerald-400 text-emerald-950 hover:opacity-90 dark:bg-emerald-700 dark:text-emerald-50";
  if (count <= 6)
    return "bg-emerald-600 font-semibold text-white hover:opacity-90 dark:bg-emerald-500 dark:text-emerald-950";
  return "bg-emerald-800 font-semibold text-white hover:opacity-90 dark:bg-emerald-300 dark:text-emerald-950";
}

function Legend() {
  const items: Array<{ label: string; cls: string }> = [
    { label: "nessuno", cls: "border border-hairline bg-surface" },
    { label: "1", cls: "bg-emerald-200 dark:bg-emerald-900" },
    { label: "2-3", cls: "bg-emerald-400 dark:bg-emerald-700" },
    { label: "4-6", cls: "bg-emerald-600 dark:bg-emerald-500" },
    { label: "7+", cls: "bg-emerald-800 dark:bg-emerald-300" },
  ];
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted">
      <span>Contributi al giorno:</span>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded ${item.cls}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

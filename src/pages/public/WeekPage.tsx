import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { addWeeks, format, parseISO, isWeekend, isToday } from "date-fns";
import { it } from "date-fns/locale";
import {
  fromISOWeekString,
  isValidISOWeekString,
  toISOWeekString,
  todayISO,
  weekDays,
} from "@/lib/dates";
import { useContributionCountsByDate } from "@/hooks/useContributions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSwipe } from "@/hooks/useSwipe";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { PublicShell } from "@/components/PublicShell";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorBox } from "@/components/ui/ErrorBox";

export default function WeekPage() {
  const { isoWeek } = useParams<{ isoWeek: string }>();
  const navigate = useNavigate();

  if (!isoWeek || !isValidISOWeekString(isoWeek)) {
    const today = parseISO(todayISO());
    return <Navigate to={`/settimana/${toISOWeekString(today)}`} replace />;
  }

  const days = useMemo(() => weekDays(isoWeek), [isoWeek]);
  const start = days[0];
  const end = days[days.length - 1];

  const prevWeek = useMemo(() => {
    const d = fromISOWeekString(isoWeek);
    return d ? toISOWeekString(addWeeks(d, -1)) : isoWeek;
  }, [isoWeek]);
  const nextWeek = useMemo(() => {
    const d = fromISOWeekString(isoWeek);
    return d ? toISOWeekString(addWeeks(d, 1)) : isoWeek;
  }, [isoWeek]);

  const { data: counts, loading, error } = useContributionCountsByDate(start, end);

  useKeyboardShortcuts({
    ArrowLeft: () => navigate(`/settimana/${prevWeek}`),
    ArrowRight: () => navigate(`/settimana/${nextWeek}`),
    t: () => navigate(`/settimana/${toISOWeekString(parseISO(todayISO()))}`),
    T: () => navigate(`/settimana/${toISOWeekString(parseISO(todayISO()))}`),
  });

  useSwipe({
    onSwipeRight: () => navigate(`/settimana/${prevWeek}`),
    onSwipeLeft: () => navigate(`/settimana/${nextWeek}`),
  });

  const currentWeek = toISOWeekString(parseISO(todayISO()));
  const isCurrentWeek = isoWeek === currentWeek;

  // Label leggibile: "Settimana 20 · 12–18 mag 2025"
  const weekLabel = `Settimana ${isoWeek.slice(-2)}`;
  const rangeLabel = `${format(parseISO(days[0]), "d MMM", { locale: it })} – ${format(parseISO(days[days.length - 1]), "d MMM yyyy", { locale: it })}`;

  return (
    <PublicShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb level="week" value={isoWeek} />
        <ViewSwitcher anchor={{ kind: "week", value: isoWeek }} />
      </div>

      <div className="mb-4 flex items-start justify-between gap-2">
        <Link
          to={`/settimana/${prevWeek}`}
          className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm text-secondary shadow-card hover:bg-surface-2"
          aria-label="Settimana precedente"
        >
          ‹ Precedente
        </Link>

        <div className="inline-flex items-center overflow-hidden rounded-lg border border-hairline-strong bg-surface shadow-card">
          <input
            type="week"
            value={isoWeek}
            max={currentWeek}
            onChange={(event) => {
              const next = event.target.value;
              if (isValidISOWeekString(next)) navigate(`/settimana/${next}`);
            }}
            aria-label="Scegli una settimana"
            className="border-0 bg-transparent px-3 py-1.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {isCurrentWeek ? (
            <span
              aria-disabled="true"
              className="border-l border-hairline bg-surface-2 px-3 py-1.5 text-sm font-medium text-subtle"
            >
              Corrente
            </span>
          ) : (
            <Link
              to={`/settimana/${currentWeek}`}
              className="border-l border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
            >
              Corrente
            </Link>
          )}
        </div>

        <Link
          to={`/settimana/${nextWeek}`}
          aria-label="Settimana successiva"
          className={`rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm shadow-card ${
            isCurrentWeek
              ? "pointer-events-none text-subtle"
              : "text-secondary hover:bg-surface-2"
          }`}
          aria-disabled={isCurrentWeek}
        >
          Successiva ›
        </Link>
      </div>

      <h1 className="mb-4 text-xl font-semibold text-primary">
        {weekLabel}
        <span className="ml-2 text-sm font-normal text-muted">{rangeLabel}</span>
        {isCurrentWeek && <span className="ml-2 text-sm font-normal text-muted">(questa settimana)</span>}
      </h1>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <ul className="grid grid-cols-1 gap-3">
          {days.map((day) => {
            const count = counts.get(day) ?? 0;
            const date = parseISO(day);
            const today = isToday(date);
            const weekend = isWeekend(date);

            return (
              <li key={day}>
                <Link
                  to={`/giorno/${day}`}
                  className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${
                    today
                      ? "border-accent ring-1 ring-accent/30 dark:ring-accent/50"
                      : weekend
                        ? "border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-800/50"
                        : "border-hairline hover:border-hairline-strong"
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl shadow-sm ${
                      today
                        ? "bg-accent text-white"
                        : weekend
                          ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                          : "bg-surface-2 text-primary"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                      {format(date, "EEE", { locale: it })}
                    </span>
                    <span className="mt-0.5 text-xl font-bold leading-none">
                      {format(date, "d")}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold capitalize text-primary transition-colors group-hover:text-accent">
                        {format(date, "MMMM yyyy", { locale: it })}
                      </span>
                      {count > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                          {count} {count === 1 ? "contributo" : "contributi"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-medium text-subtle">
                          Vuoto
                        </span>
                      )}
                    </div>

                    {count > 0 ? (
                      <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="bg-accent transition-all duration-500 ease-out"
                          style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
                        />
                      </div>
                    ) : (
                      <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-transparent">
                        <div className="bg-transparent" />
                      </div>
                    )}
                  </div>

                  <div className="text-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PublicShell>
  );
}

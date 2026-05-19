import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  formatLongDate,
  isValidISODate,
  shiftDay,
  todayISO,
} from "@/lib/dates";
import { useContributionsByDate } from "@/hooks/useContributions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSwipe } from "@/hooks/useSwipe";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { DayView } from "@/components/DayView";
import { PublicShell } from "@/components/PublicShell";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorBox } from "@/components/ui/ErrorBox";

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const today = todayISO();

  if (!date || !isValidISODate(date)) {
    return <Navigate to={`/giorno/${today}`} replace />;
  }

  const prevDate = useMemo(() => shiftDay(date, -1), [date]);
  const nextDate = useMemo(() => shiftDay(date, 1), [date]);
  const isToday = date === today;

  const { data, loading, error } = useContributionsByDate(date);

  useKeyboardShortcuts({
    ArrowLeft: () => navigate(`/giorno/${prevDate}`),
    ArrowRight: () => {
      if (!isToday) navigate(`/giorno/${nextDate}`);
    },
    t: () => navigate(`/giorno/${today}`),
    T: () => navigate(`/giorno/${today}`),
  });

  useSwipe({
    onSwipeRight: () => navigate(`/giorno/${prevDate}`),
    onSwipeLeft: () => {
      if (!isToday) navigate(`/giorno/${nextDate}`);
    },
  });

  return (
    <PublicShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb level="day" value={date} />
        <ViewSwitcher anchor={{ kind: "day", value: date }} />
      </div>

      <div className="mb-4 flex items-start justify-between gap-2">
        <Link
          to={`/giorno/${prevDate}`}
          className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm text-secondary shadow-card hover:bg-surface-2"
          aria-label="Giorno precedente"
        >
          <span className="text-base font-bold leading-none">‹</span>
          <span className="hidden sm:inline"> Precedente</span>
        </Link>

        <div className="inline-flex items-center overflow-hidden rounded-lg border border-hairline-strong bg-surface shadow-card">
          <input
            type="date"
            value={date}
            max={today}
            onChange={(event) => {
              const next = event.target.value;
              if (isValidISODate(next)) navigate(`/giorno/${next}`);
            }}
            aria-label="Scegli una data"
            className="border-0 bg-transparent px-2 py-1.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {isToday ? (
            <span
              aria-disabled="true"
              className="border-l border-hairline bg-surface-2 px-2.5 py-1.5 text-sm font-medium text-subtle"
            >
              Oggi
            </span>
          ) : (
            <Link
              to={`/giorno/${today}`}
              className="border-l border-hairline px-2.5 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
            >
              Oggi
            </Link>
          )}
        </div>

        <Link
          to={`/giorno/${nextDate}`}
          aria-label="Giorno successivo"
          className={`rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm shadow-card ${
            isToday
              ? "pointer-events-none text-subtle"
              : "text-secondary hover:bg-surface-2"
          }`}
          aria-disabled={isToday}
        >
          <span className="hidden sm:inline">Successivo </span>
          <span className="text-base font-bold leading-none">›</span>
        </Link>
      </div>

      <h1 className="mb-4 text-xl font-semibold text-primary">
        {formatLongDate(date)}
        {isToday && <span className="ml-2 text-sm font-normal text-muted">(oggi)</span>}
      </h1>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && <DayView contributions={data} />}
    </PublicShell>
  );
}

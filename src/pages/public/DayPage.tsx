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
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
          aria-label="Giorno precedente"
        >
          ‹ Precedente
        </Link>

        <div className="inline-flex flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
          <input
            type="date"
            value={date}
            max={today}
            onChange={(event) => {
              const next = event.target.value;
              if (isValidISODate(next)) navigate(`/giorno/${next}`);
            }}
            aria-label="Scegli una data"
            className="border-0 bg-transparent px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          {isToday ? (
            <span
              aria-disabled="true"
              className="border-t border-slate-200 px-3 py-1.5 text-center text-xs font-medium text-slate-300"
            >
              Sei alla giornata di oggi
            </span>
          ) : (
            <Link
              to={`/giorno/${today}`}
              className="border-t border-slate-200 px-3 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Vai alla giornata di oggi
            </Link>
          )}
        </div>

        <Link
          to={`/giorno/${nextDate}`}
          aria-label="Giorno successivo"
          className={`rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm ${
            isToday
              ? "pointer-events-none text-slate-300"
              : "text-slate-700 hover:bg-slate-100"
          }`}
          aria-disabled={isToday}
        >
          Successivo ›
        </Link>
      </div>

      <h1 className="mb-4 text-xl font-semibold text-slate-900">
        {formatLongDate(date)}
        {isToday && <span className="ml-2 text-sm font-normal text-slate-500">(oggi)</span>}
      </h1>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && <DayView contributions={data} />}
    </PublicShell>
  );
}

import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { addWeeks, format, parseISO } from "date-fns";
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

  return (
    <PublicShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb level="week" value={isoWeek} />
        <ViewSwitcher anchor={{ kind: "week", value: isoWeek }} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/settimana/${prevWeek}`}
          aria-label="Settimana precedente"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
        >
          ‹ Precedente
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">{`Settimana ${isoWeek.slice(-2)}`}</h1>
        <Link
          to={`/settimana/${nextWeek}`}
          aria-label="Settimana successiva"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
        >
          Successiva ›
        </Link>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {days.map((day) => {
            const count = counts.get(day) ?? 0;
            const date = parseISO(day);
            return (
              <li key={day}>
                <Link
                  to={`/giorno/${day}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-slate-400 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {format(date, "EEEE d MMMM", { locale: it })}
                    </p>
                    <p className="text-xs text-slate-500">{day}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      count > 0
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {count > 0 ? `${count} contributi` : "vuoto"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PublicShell>
  );
}

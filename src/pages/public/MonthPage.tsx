import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { it } from "date-fns/locale";
import {
  fromYearMonth,
  isValidYearMonth,
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

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function MonthPage() {
  const { yyyymm } = useParams<{ yyyymm: string }>();
  const navigate = useNavigate();

  if (!yyyymm || !isValidYearMonth(yyyymm)) {
    return <Navigate to={`/mese/${toYearMonth(parseISO(todayISO()))}`} replace />;
  }

  const anchor = useMemo(() => fromYearMonth(yyyymm)!, [yyyymm]);
  const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const monthLabel = format(anchor, "LLLL yyyy", { locale: it });
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);

  const prevMonth = toYearMonth(addMonths(anchor, -1));
  const nextMonth = toYearMonth(addMonths(anchor, 1));

  const { data: counts, loading, error } = useContributionCountsByDate(
    toISODate(grid[0]),
    toISODate(grid[grid.length - 1]),
  );

  useKeyboardShortcuts({
    ArrowLeft: () => navigate(`/mese/${prevMonth}`),
    ArrowRight: () => navigate(`/mese/${nextMonth}`),
    t: () => navigate(`/mese/${toYearMonth(parseISO(todayISO()))}`),
    T: () => navigate(`/mese/${toYearMonth(parseISO(todayISO()))}`),
  });

  useSwipe({
    onSwipeRight: () => navigate(`/mese/${prevMonth}`),
    onSwipeLeft: () => navigate(`/mese/${nextMonth}`),
  });

  return (
    <PublicShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb level="month" value={yyyymm} />
        <ViewSwitcher anchor={{ kind: "month", value: yyyymm }} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/mese/${prevMonth}`}
          aria-label="Mese precedente"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
        >
          ‹
        </Link>
        <h1 className="text-xl font-semibold capitalize text-slate-900">{monthLabel}</h1>
        <Link
          to={`/mese/${nextMonth}`}
          aria-label="Mese successivo"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
        >
          ›
        </Link>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day) => {
              const iso = toISODate(day);
              const count = counts.get(iso) ?? 0;
              const inMonth = day >= monthStart && day <= monthEnd;
              const today = iso === todayISO();
              return (
                <Link
                  key={iso}
                  to={`/giorno/${iso}`}
                  className={[
                    "flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                    inMonth
                      ? "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      : "border-transparent bg-slate-50 text-slate-300",
                    today ? "ring-2 ring-slate-900 ring-offset-1" : "",
                  ].join(" ")}
                >
                  <span className="font-medium">{day.getDate()}</span>
                  {count > 0 && (
                    <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-slate-900" aria-label={`${count} contributi`} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </PublicShell>
  );
}

function buildMonthGrid(anchor: Date): Date[] {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    days.push(d);
  }
  return days;
}

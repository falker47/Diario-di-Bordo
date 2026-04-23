import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { addDays, endOfYear, getISODay, parseISO, startOfYear } from "date-fns";
import { isValidYear, toISODate, todayISO } from "@/lib/dates";
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
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(yearStart);

  const grid = useMemo(() => buildYearGrid(yearStart, yearEnd), [year]);
  const { data: counts, loading, error } = useContributionCountsByDate(
    toISODate(yearStart),
    toISODate(yearEnd),
  );

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

  return (
    <PublicShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb level="year" value={yyyy} />
        <ViewSwitcher anchor={{ kind: "year", value: yyyy }} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/anno/${year - 1}`}
          aria-label="Anno precedente"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
        >
          ‹
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">{year}</h1>
        <Link
          to={`/anno/${year + 1}`}
          aria-label="Anno successivo"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
        >
          ›
        </Link>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-1.5">
            <div className="flex flex-col justify-around pr-1 text-[10px] text-slate-400">
              {WEEKDAY_LABELS.map((d, i) => (
                <span key={i} className="leading-3">
                  {d}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell, di) => {
                    if (!cell) return <span key={di} className="h-3 w-3" />;
                    const count = counts.get(cell.iso) ?? 0;
                    return (
                      <Link
                        key={cell.iso}
                        to={`/giorno/${cell.iso}`}
                        title={`${cell.iso} · ${count} contributi`}
                        className={[
                          "h-3 w-3 rounded-sm transition-transform hover:scale-125",
                          intensityClass(count),
                        ].join(" ")}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <Legend />
        </div>
      )}
    </PublicShell>
  );
}

type Cell = { iso: string };

function buildYearGrid(start: Date, end: Date): Array<Array<Cell | null>> {
  const weeks: Array<Array<Cell | null>> = [];
  let current = start;
  let week: Array<Cell | null> = new Array(7).fill(null);
  const startDow = getISODay(current);
  for (let i = 0; i < startDow - 1; i++) week[i] = null;
  while (current <= end) {
    const dow = getISODay(current) - 1;
    week[dow] = { iso: toISODate(current) };
    if (dow === 6) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
    current = addDays(current, 1);
  }
  if (week.some((c) => c !== null)) weeks.push(week);
  return weeks;
}

function intensityClass(count: number): string {
  if (count === 0) return "bg-slate-100";
  if (count === 1) return "bg-emerald-200";
  if (count <= 3) return "bg-emerald-400";
  if (count <= 6) return "bg-emerald-600";
  return "bg-emerald-800";
}

function Legend() {
  return (
    <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
      <span>meno</span>
      <span className="h-3 w-3 rounded-sm bg-slate-100" />
      <span className="h-3 w-3 rounded-sm bg-emerald-200" />
      <span className="h-3 w-3 rounded-sm bg-emerald-400" />
      <span className="h-3 w-3 rounded-sm bg-emerald-600" />
      <span className="h-3 w-3 rounded-sm bg-emerald-800" />
      <span>più</span>
    </div>
  );
}


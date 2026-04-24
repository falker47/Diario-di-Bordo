import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  fromISOWeekString,
  fromYearMonth,
  toISOWeekString,
  toYearMonth,
} from "@/lib/dates";

type Crumb = { to: string; label: string };

function buildCrumbs(level: BreadcrumbProps["level"], value: string): Crumb[] {
  if (level === "year") {
    return [{ to: `/anno/${value}`, label: `Anno ${value}` }];
  }
  if (level === "month") {
    const date = fromYearMonth(value);
    if (!date) return [];
    const year = format(date, "yyyy");
    const monthLabel = format(date, "LLLL", { locale: it });
    return [
      { to: `/anno/${year}`, label: year },
      { to: `/mese/${value}`, label: capitalize(monthLabel) },
    ];
  }
  if (level === "week") {
    const start = fromISOWeekString(value);
    if (!start) return [];
    const year = format(start, "yyyy");
    const yyyymm = toYearMonth(start);
    const monthLabel = format(start, "LLLL", { locale: it });
    return [
      { to: `/anno/${year}`, label: year },
      { to: `/mese/${yyyymm}`, label: capitalize(monthLabel) },
      { to: `/settimana/${value}`, label: `Sett. ${value.slice(-2)}` },
    ];
  }
  // day
  const date = parseISO(value);
  const year = format(date, "yyyy");
  const yyyymm = toYearMonth(date);
  const monthLabel = format(date, "LLLL", { locale: it });
  const isoWeek = toISOWeekString(date);
  const dayLabel = format(date, "d MMMM", { locale: it });
  return [
    { to: `/anno/${year}`, label: year },
    { to: `/mese/${yyyymm}`, label: capitalize(monthLabel) },
    { to: `/settimana/${isoWeek}`, label: `Sett. ${isoWeek.slice(-2)}` },
    { to: `/giorno/${value}`, label: dayLabel },
  ];
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

type BreadcrumbProps = {
  level: "day" | "week" | "month" | "year";
  value: string;
};

export function Breadcrumb({ level, value }: BreadcrumbProps) {
  const crumbs = buildCrumbs(level, value);
  return (
    <nav aria-label="Percorso" className="flex items-center gap-1 text-sm text-muted">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.to} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">›</span>}
            {isLast ? (
              <span className="font-medium text-primary">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.to}
                className="rounded px-1 hover:bg-surface-2 hover:text-primary"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

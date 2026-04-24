import { NavLink } from "react-router-dom";
import { parseISO } from "date-fns";
import { fromISOWeekString, fromYearMonth, toISOWeekString, toYearMonth } from "@/lib/dates";

type Anchor =
  | { kind: "day"; value: string }
  | { kind: "week"; value: string }
  | { kind: "month"; value: string }
  | { kind: "year"; value: string };

function anchorDate(anchor: Anchor): Date {
  if (anchor.kind === "day") return parseISO(anchor.value);
  if (anchor.kind === "week") return fromISOWeekString(anchor.value) ?? new Date();
  if (anchor.kind === "month") return fromYearMonth(anchor.value) ?? new Date();
  return new Date(Number(anchor.value), 0, 1);
}

export function ViewSwitcher({ anchor }: { anchor: Anchor }) {
  const date = anchorDate(anchor);
  const dayPath = `/giorno/${date.toISOString().slice(0, 10)}`;
  const weekPath = `/settimana/${toISOWeekString(date)}`;
  const monthPath = `/mese/${toYearMonth(date)}`;
  const yearPath = `/anno/${date.getFullYear()}`;

  const items = [
    { to: dayPath, label: "Giorno" },
    { to: weekPath, label: "Settimana" },
    { to: monthPath, label: "Mese" },
    { to: yearPath, label: "Anno" },
  ];

  return (
    <div
      role="tablist"
      className="inline-flex items-center rounded-full border border-hairline bg-surface p-1 shadow-card"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            [
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-inverted text-on-inverted"
                : "text-secondary hover:bg-surface-2",
            ].join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

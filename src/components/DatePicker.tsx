import { isValidISODate, todayISO } from "@/lib/dates";

export function DatePicker({
  value,
  onChange,
  max = todayISO(),
}: {
  value: string;
  onChange: (next: string) => void;
  max?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-secondary">
      <span className="sr-only">Scegli una data</span>
      <input
        type="date"
        value={value}
        max={max}
        onChange={(event) => {
          const next = event.target.value;
          if (isValidISODate(next)) onChange(next);
        }}
        className="rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}

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
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="sr-only">Scegli una data</span>
      <input
        type="date"
        value={value}
        max={max}
        onChange={(event) => {
          const next = event.target.value;
          if (isValidISODate(next)) onChange(next);
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

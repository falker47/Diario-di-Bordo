export function Spinner({ label = "Caricamento…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 py-12 text-muted"
    >
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-hairline border-t-primary"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

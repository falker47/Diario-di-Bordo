export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-2 h-3 w-3/5" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Caricamento contenuti">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 4,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      role="status"
      aria-label="Caricamento tabella"
    >
      <table className="w-full text-sm">
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r} className="border-b border-slate-100 last:border-0">
              {Array.from({ length: columns }, (__, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className="h-3 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

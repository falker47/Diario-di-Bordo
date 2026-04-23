import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContributionWithAuthor, Section } from "@/types";

export type ContributionFilters = {
  authorId?: string;
  section?: Section;
  dateFrom?: string;
  dateTo?: string;
};

export const PAGE_SIZE = 50;

const SELECT = "*, author:profiles(username, full_name, is_active)";

export function useAllContributions(filters: ContributionFilters, page: number) {
  const [data, setData] = useState<ContributionWithAuthor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      let query = supabase
        .from("contributions")
        .select(SELECT, { count: "exact" })
        .order("diary_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (filters.authorId) query = query.eq("author_id", filters.authorId);
      if (filters.section) query = query.eq("section", filters.section);
      if (filters.dateFrom) query = query.gte("diary_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("diary_date", filters.dateTo);

      const { data: rows, error: err, count } = await query.returns<
        ContributionWithAuthor[]
      >();

      if (cancelled) return;
      if (err) {
        setError(err.message);
        setData([]);
        setTotalCount(0);
      } else {
        setData(rows ?? []);
        setTotalCount(count ?? 0);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    filters.authorId,
    filters.section,
    filters.dateFrom,
    filters.dateTo,
    page,
    tick,
  ]);

  return { data, totalCount, loading, error, refresh };
}

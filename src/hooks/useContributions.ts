import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ContributionWithAuthor } from "@/types";

const SELECT = "*, author:profiles(username, full_name, is_active)";

export type FetchState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export function useContributionsByDate(date: string) {
  const [state, setState] = useState<FetchState<ContributionWithAuthor[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select(SELECT)
        .eq("diary_date", date)
        .order("created_at", { ascending: true })
        .returns<ContributionWithAuthor[]>();
      if (cancelled) return;
      if (error) setState({ data: [], loading: false, error: error.message });
      else setState({ data: data ?? [], loading: false, error: null });
    })();

    return () => {
      cancelled = true;
    };
  }, [date]);

  return state;
}

export function useContributionsByDateRange(startISO: string, endISO: string) {
  const [state, setState] = useState<FetchState<ContributionWithAuthor[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select(SELECT)
        .gte("diary_date", startISO)
        .lte("diary_date", endISO)
        .order("diary_date", { ascending: true })
        .order("created_at", { ascending: true })
        .returns<ContributionWithAuthor[]>();
      if (cancelled) return;
      if (error) setState({ data: [], loading: false, error: error.message });
      else setState({ data: data ?? [], loading: false, error: null });
    })();

    return () => {
      cancelled = true;
    };
  }, [startISO, endISO]);

  return state;
}

export function useContributionCountsByDate(startISO: string, endISO: string) {
  const [state, setState] = useState<FetchState<Map<string, number>>>({
    data: new Map(),
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("diary_date")
        .gte("diary_date", startISO)
        .lte("diary_date", endISO)
        .returns<Array<{ diary_date: string }>>();
      if (cancelled) return;
      if (error) {
        setState({ data: new Map(), loading: false, error: error.message });
        return;
      }
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.diary_date, (counts.get(row.diary_date) ?? 0) + 1);
      }
      setState({ data: counts, loading: false, error: null });
    })();

    return () => {
      cancelled = true;
    };
  }, [startISO, endISO]);

  return state;
}


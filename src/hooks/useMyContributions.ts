import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Contribution } from "@/types";

export function useMyContributions(authorId: string | null, limit = 20) {
  const [data, setData] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!authorId) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from("contributions")
        .select("*")
        .eq("author_id", authorId)
        .order("diary_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cancelled) return;
      if (err) setError(err.message);
      else setData((rows ?? []) as Contribution[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authorId, limit, tick]);

  return { data, loading, error, refresh };
}

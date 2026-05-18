import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CommentWithAuthor } from "@/types";

const SELECT = "*, author:profiles(username, full_name, is_active)";

export function useComments(contributionId: string) {
  const [data, setData] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data: rows, error: err } = await supabase
        .from("comments")
        .select(SELECT)
        .eq("contribution_id", contributionId)
        .order("created_at", { ascending: true })
        .returns<CommentWithAuthor[]>();
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData(rows ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [contributionId, tick]);

  return { data, loading, error, refresh };
}

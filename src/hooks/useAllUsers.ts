import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export function useAllUsers() {
  const [data, setData] = useState<Profile[]>([]);
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
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData((rows ?? []) as Profile[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { data, loading, error, refresh };
}

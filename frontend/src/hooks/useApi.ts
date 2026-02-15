import { useState, useEffect, useCallback } from "react";

/** Lightweight data-fetching hook with loading/error states. */
export const useApi = <T,>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setData)
      .catch((e) => setError(e.message ?? "Unknown error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};

/** Lazy fetch hook — only executes when `execute` is called. */
export const useLazyApi = <T, A extends unknown[]>(
  fetcher: (...args: A) => Promise<T>,
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: A) => void;
} => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    (...args: A) => {
      setLoading(true);
      setError(null);
      fetcher(...args)
        .then(setData)
        .catch((e) => setError(e.message ?? "Unknown error"))
        .finally(() => setLoading(false));
    },
    [fetcher],
  );

  return { data, loading, error, execute };
};

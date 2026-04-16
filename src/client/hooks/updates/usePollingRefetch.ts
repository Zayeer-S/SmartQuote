import { useEffect, useRef } from 'react';

/**
 * Calls `refetch` on mount and then every `intervalMs` milliseconds.
 * The initial call is intentionally omitted -- callers are responsible for
 * their own initial fetch. This hook only handles the periodic repeat.
 *
 * `refetch` is stabilized via ref so callers do not need to memoize it.
 */
export function usePollingRefetch(refetch: () => void, intervalMs: number): void {
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    const id = setInterval(() => {
      refetchRef.current();
    }, intervalMs);
    return () => {
      clearInterval(id);
    };
  }, [intervalMs]);
}

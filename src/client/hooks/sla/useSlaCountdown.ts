import { useEffect, useRef, useState } from 'react';

interface SlaCountdownResult {
  /** Whole seconds remaining until the SLA deadline. 0 when breached. */
  secondsRemaining: number;
  /** True when the deadline has passed. */
  breached: boolean;
  /** Formatted countdown string, e.g. "2h 34m 12s" or "Breached". */
  display: string;
}

function computeSeconds(deadline: string): number {
  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
}

function formatDisplay(seconds: number): string {
  if (seconds <= 0) return 'Breached';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = m < 10 ? `0${String(m)}` : String(m);
  const ss = s < 10 ? `0${String(s)}` : String(s);
  if (h > 0) return `${String(h)}h ${mm}m ${ss}s`;
  if (m > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
}

/**
 * Client-side SLA countdown.
 *
 * Ticks every second from the provided ISO deadline string.
 * When the countdown reaches zero, fires `onBreach` once so the caller can
 * immediately refetch from the server to confirm breach state.
 *
 * Pass null for `slaDeadline` when no SLA policy covers the ticket --
 * the hook returns a stable zero/breached=false result without starting
 * any interval.
 *
 * @param slaDeadline ISO 8601 deadline string, or null
 * @param onBreach Optional callback fired once when countdown hits zero
 */
export function useSlaCountdown(
  slaDeadline: string | null,
  onBreach?: () => void
): SlaCountdownResult {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
    slaDeadline ? computeSeconds(slaDeadline) : 0
  );

  // Track whether onBreach has been fired to ensure it only fires once per mount.
  const breachFiredRef = useRef(false);
  const onBreachRef = useRef(onBreach);

  useEffect(() => {
    onBreachRef.current = onBreach;
  }, [onBreach]);

  // Re-initialize when the deadline string changes (e.g. after a server refetch).
  useEffect(() => {
    // Re-sync initial value when the deadline prop changes, then start the
    // interval. Using the functional updater form avoids stale closure issues.
    if (!slaDeadline) {
      breachFiredRef.current = false;
      return;
    }

    breachFiredRef.current = false;

    const id = setInterval(() => {
      const remaining = computeSeconds(slaDeadline);
      setSecondsRemaining(remaining);

      if (remaining === 0 && !breachFiredRef.current) {
        breachFiredRef.current = true;
        onBreachRef.current?.();
        clearInterval(id);
      }
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, [slaDeadline]);

  const breached = slaDeadline !== null && secondsRemaining === 0;

  return {
    secondsRemaining,
    breached,
    display: slaDeadline ? formatDisplay(secondsRemaining) : '',
  };
}

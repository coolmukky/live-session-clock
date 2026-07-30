import { useEffect, useState } from 'react';

/**
 * Returns the current epoch time in ms, refreshed on an interval. Drives both
 * the live wall-clock and every countdown in the app, so a single ticking
 * source keeps everything in sync.
 *
 * @param intervalMs how often to update (default 250ms for smooth countdowns).
 */
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

import { useEffect, useRef } from 'react';

/**
 * Holds a Screen Wake Lock while `active` is true so the display doesn't sleep
 * during a running session. Re-acquires when the tab becomes visible again
 * (the browser drops the lock when a tab is hidden). No-ops where unsupported.
 */
export function useWakeLock(active: boolean): void {
  // WakeLockSentinel isn't in every TS lib target; keep it loosely typed.
  const sentinel = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<typeof sentinel.current> };
    };
    if (!nav.wakeLock) return;

    const request = async () => {
      if (!active || document.visibilityState !== 'visible' || sentinel.current) {
        return;
      }
      try {
        sentinel.current = await nav.wakeLock!.request('screen');
      } catch {
        /* denied or not allowed — ignore */
      }
    };
    const release = async () => {
      try {
        await sentinel.current?.release();
      } catch {
        /* ignore */
      }
      sentinel.current = null;
    };

    if (active) void request();
    else void release();

    const onVisibility = () => {
      if (active && document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      void release();
    };
  }, [active]);
}

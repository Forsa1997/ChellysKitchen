import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

/**
 * Keeps the screen awake via the Screen Wake Lock API while `active` is true.
 * Browsers drop the lock when the tab goes to the background, so it is
 * re-requested on visibilitychange. Silently does nothing when the API is
 * unavailable or the request is denied (e.g. battery saver) — the screen then
 * simply times out as usual.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;
    if (!wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const next = await wakeLock.request('screen');
        if (cancelled) {
          next.release().catch(() => undefined);
          return;
        }
        sentinel = next;
      } catch {
        // Denied (battery saver, browser policy) — nothing to do.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sentinel?.release().catch(() => undefined);
      sentinel = null;
    };
  }, [active]);
}

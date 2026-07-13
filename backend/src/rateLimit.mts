// Sliding-window rate limiter for login attempts. In-memory by design:
// a restart clearing the counters is acceptable, brute-forcing a password
// is not. Only FAILED attempts count; a successful login resets its key.

export interface RateLimiterOptions {
  maxFailures: number;
  windowMs: number;
}

export interface BlockCheck {
  blocked: boolean;
  retryAfterSeconds?: number;
}

export interface RateLimiter {
  isBlocked(key: string, now?: number): BlockCheck;
  recordFailure(key: string, now?: number): void;
  reset(key: string): void;
  size(): number;
}

export function createRateLimiter({ maxFailures, windowMs }: RateLimiterOptions): RateLimiter {
  // key -> array of failure timestamps (ms), oldest first
  const failures = new Map<string, number[]>();

  const prune = (now: number): void => {
    for (const [key, timestamps] of failures) {
      const fresh = timestamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) {
        failures.delete(key);
      } else if (fresh.length !== timestamps.length) {
        failures.set(key, fresh);
      }
    }
  };

  return {
    isBlocked(key: string, now: number = Date.now()): BlockCheck {
      const fresh = (failures.get(key) ?? []).filter((t) => now - t < windowMs);
      if (fresh.length < maxFailures) {
        return { blocked: false };
      }
      const oldest = fresh[0];
      return {
        blocked: true,
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
      };
    },

    recordFailure(key: string, now: number = Date.now()): void {
      prune(now);
      const timestamps = failures.get(key) ?? [];
      timestamps.push(now);
      failures.set(key, timestamps);
    },

    reset(key: string): void {
      failures.delete(key);
    },

    size(): number {
      return failures.size;
    },
  };
}

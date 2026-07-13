// Sliding-window rate limiter for login attempts. In-memory by design:
// a restart clearing the counters is acceptable, brute-forcing a password
// is not. Only FAILED attempts count; a successful login resets its key.

export function createRateLimiter({ maxFailures, windowMs }) {
  // key -> array of failure timestamps (ms), oldest first
  const failures = new Map();

  const prune = (now) => {
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
    isBlocked(key, now = Date.now()) {
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

    recordFailure(key, now = Date.now()) {
      prune(now);
      const timestamps = failures.get(key) ?? [];
      timestamps.push(now);
      failures.set(key, timestamps);
    },

    reset(key) {
      failures.delete(key);
    },

    size() {
      return failures.size;
    },
  };
}

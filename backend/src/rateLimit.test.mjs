import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRateLimiter } from './rateLimit.mjs';

test('allows attempts below the limit and blocks above it', () => {
  const limiter = createRateLimiter({ maxFailures: 3, windowMs: 60_000 });
  const now = 1_000_000;

  for (let i = 0; i < 3; i += 1) {
    assert.equal(limiter.isBlocked('k', now).blocked, false);
    limiter.recordFailure('k', now);
  }

  const check = limiter.isBlocked('k', now);
  assert.equal(check.blocked, true);
  assert.ok(check.retryAfterSeconds >= 1, 'tells the caller when to retry');
});

test('failures expire after the window', () => {
  const limiter = createRateLimiter({ maxFailures: 2, windowMs: 1_000 });

  limiter.recordFailure('k', 0);
  limiter.recordFailure('k', 500);
  assert.equal(limiter.isBlocked('k', 900).blocked, true);
  // The first failure leaves the window at t=1000, the second at t=1500.
  assert.equal(limiter.isBlocked('k', 1_100).blocked, false);
  assert.equal(limiter.isBlocked('k', 1_600).blocked, false);
});

test('a success clears the counter', () => {
  const limiter = createRateLimiter({ maxFailures: 2, windowMs: 60_000 });

  limiter.recordFailure('k', 0);
  limiter.recordFailure('k', 1);
  assert.equal(limiter.isBlocked('k', 2).blocked, true);

  limiter.reset('k');
  assert.equal(limiter.isBlocked('k', 3).blocked, false);
});

test('keys are independent', () => {
  const limiter = createRateLimiter({ maxFailures: 1, windowMs: 60_000 });

  limiter.recordFailure('a', 0);
  assert.equal(limiter.isBlocked('a', 1).blocked, true);
  assert.equal(limiter.isBlocked('b', 1).blocked, false);
});

test('stale keys are pruned so the map cannot grow without bound', () => {
  const limiter = createRateLimiter({ maxFailures: 2, windowMs: 100 });

  for (let i = 0; i < 50; i += 1) {
    limiter.recordFailure(`key-${i}`, 0);
  }
  // Recording far in the future prunes everything expired.
  limiter.recordFailure('fresh', 10_000);
  assert.ok(limiter.size() <= 2, `expected pruning, still holding ${limiter.size()} keys`);
});

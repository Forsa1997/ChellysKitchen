import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ACCESS_TTL_MS,
  REFRESH_TTL_MS,
  createSessionEntry,
  normalizeSessionMap,
  pruneExpiredSessions,
  resolveSession,
} from './sessions.mts';

const NOW = 1_000_000;

test('resolveSession returns the userId for a valid, unexpired token', () => {
  const sessions = new Map([['token-a', createSessionEntry('user_1', NOW, ACCESS_TTL_MS)]]);
  assert.equal(resolveSession(sessions, 'token-a', NOW + 1000), 'user_1');
});

test('resolveSession rejects and removes expired tokens', () => {
  const sessions = new Map([['token-a', createSessionEntry('user_1', NOW, 1000)]]);
  assert.equal(resolveSession(sessions, 'token-a', NOW + 2000), null);
  assert.equal(sessions.has('token-a'), false);
});

test('resolveSession handles unknown tokens', () => {
  assert.equal(resolveSession(new Map(), 'nope', NOW), null);
});

test('normalizeSessionMap upgrades legacy string entries to expiring entries', () => {
  const sessions = new Map([
    ['legacy-token', 'user_1'],
    ['new-token', createSessionEntry('user_2', NOW, ACCESS_TTL_MS)],
  ]);

  normalizeSessionMap(sessions, NOW, ACCESS_TTL_MS);

  assert.equal(resolveSession(sessions, 'legacy-token', NOW + 1000), 'user_1');
  assert.equal(resolveSession(sessions, 'new-token', NOW + 1000), 'user_2');
  // Legacy entries received a real expiry rather than living forever.
  assert.equal(resolveSession(sessions, 'legacy-token', NOW + ACCESS_TTL_MS + 1), null);
});

test('pruneExpiredSessions drops only expired entries', () => {
  const sessions = new Map([
    ['fresh', createSessionEntry('user_1', NOW, ACCESS_TTL_MS)],
    ['stale', createSessionEntry('user_2', NOW - REFRESH_TTL_MS * 2, 1000)],
  ]);

  pruneExpiredSessions(sessions, NOW);

  assert.equal(sessions.has('fresh'), true);
  assert.equal(sessions.has('stale'), false);
});

test('TTL constants: refresh tokens outlive access tokens', () => {
  assert.ok(REFRESH_TTL_MS > ACCESS_TTL_MS);
});

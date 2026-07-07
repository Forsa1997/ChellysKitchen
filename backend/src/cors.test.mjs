import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveCorsOrigin } from './cors.mjs';

test('no configured origin echoes request origin', () => {
  assert.equal(
    resolveCorsOrigin({ requestOrigin: 'https://foo.example', allowedOrigin: '' }),
    'https://foo.example',
  );
  assert.equal(resolveCorsOrigin({ requestOrigin: undefined, allowedOrigin: '' }), '*');
});

test('matching origin is echoed, trailing slash ignored', () => {
  assert.equal(
    resolveCorsOrigin({
      requestOrigin: 'https://app.example',
      allowedOrigin: 'https://app.example/',
    }),
    'https://app.example',
  );
});

test('comma-separated allowlist matches any entry', () => {
  assert.equal(
    resolveCorsOrigin({
      requestOrigin: 'https://b.example',
      allowedOrigin: 'https://a.example, https://b.example',
    }),
    'https://b.example',
  );
});

test('mismatch falls back to first configured origin (never "null")', () => {
  const result = resolveCorsOrigin({
    requestOrigin: 'https://evil.example',
    allowedOrigin: 'https://app.example',
  });
  assert.equal(result, 'https://app.example');
  assert.notEqual(result, 'null');
});

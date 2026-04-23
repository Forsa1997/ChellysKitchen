import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCorsOrigin } from './src/cors.mjs';

test('resolveCorsOrigin erlaubt bei fehlender Konfiguration die anfragende Origin', () => {
  assert.equal(
    resolveCorsOrigin({
      requestOrigin: 'https://chellys-kitchen-web.onrender.com',
      allowedOrigin: undefined,
    }),
    'https://chellys-kitchen-web.onrender.com',
  );
});

test('resolveCorsOrigin akzeptiert exakt konfigurierte Origin', () => {
  assert.equal(
    resolveCorsOrigin({
      requestOrigin: 'https://chellys-kitchen-web.onrender.com',
      allowedOrigin: 'https://chellys-kitchen-web.onrender.com',
    }),
    'https://chellys-kitchen-web.onrender.com',
  );
});

test('resolveCorsOrigin blockiert fremde Origin bei gesetzter Konfiguration', () => {
  assert.equal(
    resolveCorsOrigin({
      requestOrigin: 'https://evil.example',
      allowedOrigin: 'https://chellys-kitchen-web.onrender.com',
    }),
    'null',
  );
});

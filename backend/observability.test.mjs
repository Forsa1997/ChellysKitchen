import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRequestId, createMetricsRecorder } from './src/observability.mjs';

test('resolveRequestId übernimmt eine gültige eingehende Request-ID', () => {
  assert.equal(resolveRequestId('client-abc_123'), 'client-abc_123');
});

test('resolveRequestId generiert eine neue ID, wenn keine übergeben wurde', () => {
  const id = resolveRequestId(undefined);
  assert.match(id, /^req_[a-f0-9]{16}$/);
});

test('resolveRequestId ersetzt ungültige Zeichen durch eine neue ID', () => {
  const id = resolveRequestId('böse id mit spaces\n');
  assert.match(id, /^req_[a-f0-9]{16}$/);
});

test('resolveRequestId ersetzt überlange IDs durch eine neue ID', () => {
  const id = resolveRequestId('a'.repeat(200));
  assert.match(id, /^req_[a-f0-9]{16}$/);
});

test('Metriken zählen Requests nach Statusklasse', () => {
  const metrics = createMetricsRecorder();
  metrics.record(200, 12);
  metrics.record(201, 30);
  metrics.record(404, 5);
  metrics.record(500, 80);

  const snapshot = metrics.snapshot();
  assert.equal(snapshot.totalRequests, 4);
  assert.equal(snapshot.statusCounts['2xx'], 2);
  assert.equal(snapshot.statusCounts['4xx'], 1);
  assert.equal(snapshot.statusCounts['5xx'], 1);
});

test('Metriken berechnen die Fehlerquote aus 5xx-Antworten', () => {
  const metrics = createMetricsRecorder();
  metrics.record(200, 10);
  metrics.record(500, 10);

  assert.equal(metrics.snapshot().errorRate, 0.5);
});

test('Metriken liefern Latenz-Kennzahlen (avg, p95, max)', () => {
  const metrics = createMetricsRecorder();
  for (let i = 1; i <= 100; i += 1) {
    metrics.record(200, i);
  }

  const { latencyMs } = metrics.snapshot();
  assert.equal(latencyMs.avg, 50.5);
  assert.equal(latencyMs.p95, 95);
  assert.equal(latencyMs.max, 100);
});

test('Leere Metriken liefern eine Fehlerquote und Latenz von 0', () => {
  const snapshot = createMetricsRecorder().snapshot();
  assert.equal(snapshot.totalRequests, 0);
  assert.equal(snapshot.errorRate, 0);
  assert.equal(snapshot.latencyMs.avg, 0);
});

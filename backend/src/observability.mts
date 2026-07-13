import { randomBytes } from 'node:crypto';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function resolveRequestId(headerValue: unknown): string {
  if (typeof headerValue === 'string' && REQUEST_ID_PATTERN.test(headerValue)) {
    return headerValue;
  }

  return `req_${randomBytes(8).toString('hex')}`;
}

// Latenz-Stichprobe begrenzen, damit der Speicher bei langem Betrieb konstant bleibt.
const MAX_LATENCY_SAMPLES = 1000;

export interface MetricsSnapshot {
  totalRequests: number;
  statusCounts: Record<string, number>;
  errorRate: number;
  latencyMs: {
    avg: number;
    p95: number;
    max: number;
  };
}

export interface MetricsRecorder {
  record(statusCode: number, durationMs: number): void;
  snapshot(): MetricsSnapshot;
}

export function createMetricsRecorder(): MetricsRecorder {
  let totalRequests = 0;
  const statusCounts: Record<string, number> = { '1xx': 0, '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
  const durations: number[] = [];

  return {
    record(statusCode: number, durationMs: number): void {
      totalRequests += 1;

      const statusClass = `${Math.floor(statusCode / 100)}xx`;
      if (statusCounts[statusClass] !== undefined) {
        statusCounts[statusClass] += 1;
      }

      durations.push(durationMs);
      if (durations.length > MAX_LATENCY_SAMPLES) {
        durations.shift();
      }
    },

    snapshot(): MetricsSnapshot {
      const sorted = [...durations].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, value) => acc + value, 0);
      const avg = sorted.length ? sum / sorted.length : 0;
      const p95 = sorted.length
        ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]
        : 0;
      const max = sorted.length ? sorted[sorted.length - 1] : 0;

      return {
        totalRequests,
        statusCounts: { ...statusCounts },
        errorRate: totalRequests ? statusCounts['5xx'] / totalRequests : 0,
        latencyMs: {
          avg: Math.round(avg * 100) / 100,
          p95: Math.round(p95 * 100) / 100,
          max: Math.round(max * 100) / 100,
        },
      };
    },
  };
}

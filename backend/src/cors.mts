function normalizeOrigin(origin: string | undefined): string {
  return String(origin ?? '').trim().replace(/\/+$/, '');
}

export interface CorsOriginInput {
  requestOrigin?: string;
  allowedOrigin?: string;
}

/**
 * Resolve the value for the Access-Control-Allow-Origin header.
 *
 * - No configured origin -> echo the request origin (or `*` when absent).
 * - A configured origin (single value or comma-separated allowlist) ->
 *   echo the request origin when it matches (ignoring trailing slashes),
 *   otherwise fall back to the first configured origin.
 *
 * The previous implementation returned the literal string `'null'` on any
 * mismatch, which blocked every request whenever CORS_ORIGIN was set with a
 * trailing slash, a different scheme, or a custom domain.
 */
export function resolveCorsOrigin({ requestOrigin, allowedOrigin }: CorsOriginInput): string {
  const configured = String(allowedOrigin ?? '').trim();

  if (!configured) {
    return requestOrigin ?? '*';
  }

  const allowList = configured
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  if (allowList.length === 0) {
    return requestOrigin ?? '*';
  }

  const requestNorm = normalizeOrigin(requestOrigin);
  if (requestOrigin && requestNorm && allowList.includes(requestNorm)) {
    // Echo the exact origin the browser sent (with its original casing/slash).
    return requestOrigin;
  }

  return allowList[0];
}

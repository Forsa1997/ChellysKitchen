export function resolveCorsOrigin({ requestOrigin, allowedOrigin }) {
  const configuredOrigin = String(allowedOrigin ?? '').trim();

  if (!configuredOrigin) {
    return requestOrigin ?? '*';
  }

  return requestOrigin === configuredOrigin ? configuredOrigin : 'null';
}

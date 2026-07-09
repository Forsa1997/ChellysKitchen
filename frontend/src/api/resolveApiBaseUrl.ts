// Where the frontend should send API requests, resolved from the environment.
// Kept as a pure function so it is testable without a browser: `client.ts`
// feeds it the real window/env values.
//
// Precedence:
//   1. VITE_API_BASE_URL (build-time override — always wins)
//   2. Render web host `*-web.onrender.com` → sibling `*-api.onrender.com`
//   3. The known custom domain → the API's onrender host
//   4. localhost during development
//   5. the current origin (last resort)
export function resolveApiBaseUrl({
  configuredUrl,
  protocol,
  hostname,
}: {
  configuredUrl: string | undefined;
  protocol: string;
  hostname: string;
}): string {
  if (configuredUrl) {
    return configuredUrl;
  }

  if (hostname.endsWith('onrender.com') && hostname.includes('-web')) {
    return `${protocol}//${hostname.replace('-web', '-api')}`;
  }

  // The production site runs under a custom domain; its API keeps the Render
  // URL. Without this the app would call itself (window.location.origin) and
  // never reach the backend.
  if (hostname === 'chellys-kitchen.de' || hostname === 'www.chellys-kitchen.de') {
    return 'https://chellys-kitchen-api.onrender.com';
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }

  return `${protocol}//${hostname}`;
}

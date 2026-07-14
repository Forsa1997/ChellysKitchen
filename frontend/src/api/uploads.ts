/**
 * Uploaded recipe images are served from the backend's `/uploads/` path, which
 * is now behind authentication (the whole app is private). Such images can no
 * longer be loaded through a plain `<img src>` because the browser would not
 * attach the bearer token — they must be fetched with `Authorization` and shown
 * via an object URL.
 *
 * This helper decides whether a given image URL points at that protected path.
 * External images (imported recipes), bundled static assets under
 * `/recipe-images/…`, and `data:`/`blob:` URLs are all served without auth and
 * must NOT be routed through the authenticated fetch.
 */
export function isProtectedImageUrl(
  raw: string | null | undefined,
  apiBaseUrl: string,
): boolean {
  if (!raw) return false;

  // Relative same-origin upload path.
  if (raw.startsWith('/uploads/')) return true;

  // Absolute URL — only treat it as protected when it points at the backend's
  // own uploads path. Anything else (external hosts, data/blob URLs) stays as-is.
  try {
    const url = new URL(raw, apiBaseUrl);
    const base = new URL(apiBaseUrl);
    return url.origin === base.origin && url.pathname.startsWith('/uploads/');
  } catch {
    return false;
  }
}

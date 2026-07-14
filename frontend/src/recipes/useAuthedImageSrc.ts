import { useEffect, useState } from 'react';
import { apiClient, getApiBaseUrl } from '../api/client';
import { isProtectedImageUrl } from '../api/uploads';

/**
 * Resolves an image URL for rendering while the app is private.
 *
 * - Public URLs (external images, bundled `/recipe-images/…` assets, `data:`
 *   URLs) are returned unchanged and synchronously.
 * - Protected uploads under `/uploads/…` are fetched with the bearer token and
 *   exposed as an object URL, because a plain `<img>` can't send the token.
 *
 * Returns `undefined` while a protected image is still loading (or if it failed
 * to load), so callers can show a placeholder in the meantime.
 */
export function useAuthedImageSrc(rawUrl: string | null | undefined): string | undefined {
  const apiBaseUrl = getApiBaseUrl();
  const isProtected = isProtectedImageUrl(rawUrl, apiBaseUrl);

  // Only protected uploads need asynchronous, token-authenticated loading. The
  // fetched object URL is tagged with the raw URL it belongs to, so a stale
  // (already revoked) result is never rendered after `rawUrl` changes.
  const [loaded, setLoaded] = useState<{ raw: string; objectUrl: string } | null>(null);

  useEffect(() => {
    if (!rawUrl || !isProtectedImageUrl(rawUrl, apiBaseUrl)) return;

    let cancelled = false;
    let created: string | undefined;

    apiClient
      .fetchImageObjectUrl(rawUrl)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        created = objectUrl;
        setLoaded({ raw: rawUrl, objectUrl });
      })
      .catch(() => {
        // Swallow: the caller falls back to a placeholder when nothing resolves.
      });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [rawUrl, apiBaseUrl]);

  if (!rawUrl) return undefined;
  if (!isProtected) return rawUrl;
  return loaded && loaded.raw === rawUrl ? loaded.objectUrl : undefined;
}

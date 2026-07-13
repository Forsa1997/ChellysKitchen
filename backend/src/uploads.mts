const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function contentTypeForExt(ext: unknown): string {
  return EXT_TO_MIME[String(ext ?? '').toLowerCase()] ?? 'application/octet-stream';
}

function extFromFilename(filename: unknown): string {
  const match = /\.([a-z0-9]+)$/i.exec(String(filename ?? ''));
  return match ? match[1].toLowerCase() : '';
}

export interface ImageUploadInput {
  filename?: unknown;
  data?: unknown;
}

export interface ValidatedImageUpload {
  ext: string;
  mime: string;
  buffer: Buffer;
}

/**
 * Validate and decode an image upload posted as JSON `{ filename, data }`.
 * `data` may be a data URL (`data:image/png;base64,....`) or raw base64.
 * Returns `{ ext, mime, buffer }` or throws an Error with a user-facing
 * German message.
 */
export function validateImageUpload({ filename, data }: ImageUploadInput = {}, maxBytes: number = MAX_UPLOAD_BYTES): ValidatedImageUpload {
  if (!data || typeof data !== 'string') {
    throw new Error('Kein Bild-Daten übermittelt.');
  }

  let mime: string | undefined;
  let base64: string;

  const dataUrlMatch = /^data:([^;]+);base64,(.*)$/s.exec(data);
  if (dataUrlMatch) {
    mime = dataUrlMatch[1].toLowerCase();
    base64 = dataUrlMatch[2];
  } else {
    base64 = data;
    const ext = extFromFilename(filename);
    mime = EXT_TO_MIME[ext];
  }

  const ext = mime === undefined ? undefined : MIME_TO_EXT[mime];
  if (!ext || mime === undefined) {
    throw new Error('Nur JPG-, PNG-, WebP- oder GIF-Bilder sind erlaubt.');
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    throw new Error('Ungültige Bild-Daten.');
  }

  if (buffer.length === 0) {
    throw new Error('Ungültige Bild-Daten.');
  }

  if (buffer.length > maxBytes) {
    throw new Error('Bild ist zu groß (max. 5 MB).');
  }

  return { ext, mime, buffer };
}

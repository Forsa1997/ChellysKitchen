import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contentTypeForExt, validateImageUpload } from './uploads.mjs';

// 1x1 transparent PNG
const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('accepts a valid PNG data URL', () => {
  const result = validateImageUpload({ filename: 'pic.png', data: PNG_DATA_URL });
  assert.equal(result.ext, 'png');
  assert.equal(result.mime, 'image/png');
  assert.ok(result.buffer.length > 0);
});

test('accepts raw base64 using filename extension', () => {
  const base64 = PNG_DATA_URL.split(',')[1];
  const result = validateImageUpload({ filename: 'photo.PNG', data: base64 });
  assert.equal(result.ext, 'png');
});

test('rejects non-image mime types', () => {
  assert.throws(
    () => validateImageUpload({ filename: 'evil.svg', data: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }),
    /erlaubt/,
  );
});

test('rejects missing data', () => {
  assert.throws(() => validateImageUpload({ filename: 'x.png' }), /übermittelt/);
});

test('rejects oversized images', () => {
  assert.throws(
    () => validateImageUpload({ filename: 'big.png', data: PNG_DATA_URL }, 10),
    /zu groß/,
  );
});

test('contentTypeForExt maps known extensions', () => {
  assert.equal(contentTypeForExt('jpg'), 'image/jpeg');
  assert.equal(contentTypeForExt('webp'), 'image/webp');
  assert.equal(contentTypeForExt('unknown'), 'application/octet-stream');
});

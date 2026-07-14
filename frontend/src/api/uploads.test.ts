import { describe, expect, it } from 'vitest';
import { isProtectedImageUrl } from './uploads';

const API_BASE = 'http://localhost:4000';

describe('isProtectedImageUrl', () => {
  it('treats relative /uploads paths as protected', () => {
    expect(isProtectedImageUrl('/uploads/abc123.png', API_BASE)).toBe(true);
  });

  it('treats absolute upload URLs on the backend origin as protected', () => {
    expect(isProtectedImageUrl('http://localhost:4000/uploads/abc123.png', API_BASE)).toBe(true);
  });

  it('leaves external images untouched', () => {
    expect(isProtectedImageUrl('https://picsum.photos/800/450', API_BASE)).toBe(false);
    expect(isProtectedImageUrl('https://example.com/uploads/foo.png', API_BASE)).toBe(false);
  });

  it('leaves bundled static assets untouched', () => {
    expect(isProtectedImageUrl('/recipe-images/renders/bbq-burger.jpg', API_BASE)).toBe(false);
    expect(isProtectedImageUrl('/brand/chellys-kitchen-icon.svg', API_BASE)).toBe(false);
  });

  it('leaves data and blob URLs untouched', () => {
    expect(isProtectedImageUrl('data:image/png;base64,AAAA', API_BASE)).toBe(false);
    expect(isProtectedImageUrl('blob:http://localhost:4000/uuid', API_BASE)).toBe(false);
  });

  it('returns false for empty values', () => {
    expect(isProtectedImageUrl('', API_BASE)).toBe(false);
    expect(isProtectedImageUrl(null, API_BASE)).toBe(false);
    expect(isProtectedImageUrl(undefined, API_BASE)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './resolveApiBaseUrl';

describe('resolveApiBaseUrl', () => {
  it('prefers an explicitly configured URL above everything', () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: 'https://api.example.com',
        protocol: 'https:',
        hostname: 'chellys-kitchen.de',
      }),
    ).toBe('https://api.example.com');
  });

  it('derives the API host from the Render web host', () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: undefined,
        protocol: 'https:',
        hostname: 'chellys-kitchen-web.onrender.com',
      }),
    ).toBe('https://chellys-kitchen-api.onrender.com');
  });

  it('maps the custom Chellys Kitchen domain to the API service', () => {
    for (const hostname of ['chellys-kitchen.de', 'www.chellys-kitchen.de']) {
      expect(
        resolveApiBaseUrl({ configuredUrl: undefined, protocol: 'https:', hostname }),
      ).toBe('https://chellys-kitchen-api.onrender.com');
    }
  });

  it('uses the local backend during development', () => {
    for (const hostname of ['localhost', '127.0.0.1']) {
      expect(
        resolveApiBaseUrl({ configuredUrl: undefined, protocol: 'http:', hostname }),
      ).toBe('http://localhost:4000');
    }
  });

  it('falls back to the current origin for unknown hosts', () => {
    expect(
      resolveApiBaseUrl({ configuredUrl: undefined, protocol: 'https:', hostname: 'irgendwas.example' }),
    ).toBe('https://irgendwas.example');
  });
});

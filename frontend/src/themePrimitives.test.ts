import { describe, expect, it } from 'vitest';
import { colorSchemes } from './themePrimitives';

describe('dark color scheme', () => {
  it('uses layered blue-charcoal surfaces instead of near-black backgrounds', () => {
    expect(colorSchemes.dark.palette.background).toEqual({
      default: 'hsl(220, 26%, 8%)',
      paper: 'hsl(220, 24%, 11%)',
    });
  });

  it('keeps text, borders, and interaction states legible on dark surfaces', () => {
    expect(colorSchemes.dark.palette).toMatchObject({
      divider: 'hsla(220, 20%, 65%, 0.24)',
      text: {
        primary: 'hsl(220, 20%, 96%)',
        secondary: 'hsl(220, 18%, 72%)',
      },
      action: {
        hover: 'hsla(220, 20%, 65%, 0.1)',
        selected: 'hsla(220, 20%, 65%, 0.16)',
      },
    });
  });
});

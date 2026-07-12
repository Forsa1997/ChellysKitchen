import { describe, expect, it } from 'vitest';
import { colorSchemes, getDesignTokens, shape, typography } from './themePrimitives';

describe('Chellys Kitchen design tokens', () => {
  it('uses the warm cream and berry palette from the design handoff in light mode', () => {
    const tokens = getDesignTokens('light');

    expect(tokens.palette.primary.main).toBe('hsl(342, 72%, 42%)');
    expect(tokens.palette.background.default).toBe('hsl(30, 45%, 97%)');
    expect(tokens.palette.text.primary).toBe('hsl(340, 25%, 14%)');
    expect(colorSchemes.light.palette.divider).toBe('hsl(30, 18%, 88%)');
  });

  it('uses warm anthracite surfaces and readable pink actions in dark mode', () => {
    const tokens = getDesignTokens('dark');

    expect(tokens.palette.primary.main).toBe('hsl(342, 80%, 68%)');
    expect(tokens.palette.primary.contrastText).toBe('hsl(342, 60%, 10%)');
    expect(tokens.palette.background.default).toBe('hsl(336, 14%, 8%)');
    expect(tokens.palette.background.paper).toBe('hsl(336, 12%, 12%)');
    expect(colorSchemes.dark.palette.divider).toBe('hsl(336, 10%, 21%)');
  });

  it('uses the two-font type system and the 12px base radius', () => {
    expect(typography.fontFamily).toContain('Instrument Sans');
    expect(typography.h1.fontFamily).toContain('Bricolage Grotesque');
    expect(typography.h6.fontFamily).toContain('Bricolage Grotesque');
    expect(shape.borderRadius).toBe(12);
  });
});

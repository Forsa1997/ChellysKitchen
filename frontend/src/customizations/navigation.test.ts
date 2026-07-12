import { createTheme } from '@mui/material/styles';
import { expect, it } from 'vitest';
import { colorSchemes } from '../themePrimitives';
import { navigationCustomizations } from './navigation';

it('uses the brand focus treatment for selects in dark mode', () => {
  const theme = createTheme({
    cssVariables: { colorSchemeSelector: 'data-mui-color-scheme', cssVarPrefix: 'template' },
    colorSchemes,
  });
  const root = navigationCustomizations.MuiSelect?.styleOverrides?.root;
  expect(typeof root).toBe('function');

  const styles = (root as unknown as (params: { theme: typeof theme }) => Record<string, unknown>)({ theme });
  const serialized = JSON.stringify(styles);
  expect(serialized).toContain('hsl(342, 80%, 68%)');
  expect(serialized).toContain('3px solid');
});

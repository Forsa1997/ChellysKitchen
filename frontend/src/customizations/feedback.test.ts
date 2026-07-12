import { createTheme } from '@mui/material/styles';
import { expect, it } from 'vitest';
import { feedbackCustomizations } from './feedback';

it('does not collapse every alert severity into one generic warning treatment', () => {
  const theme = createTheme();
  const root = feedbackCustomizations.MuiAlert?.styleOverrides?.root;
  expect(typeof root).toBe('function');

  const styles = (root as unknown as (params: { theme: typeof theme }) => Record<string, unknown>)({ theme });
  expect(styles).not.toHaveProperty('backgroundColor');
  expect(styles).not.toHaveProperty('& .MuiAlert-icon');
});

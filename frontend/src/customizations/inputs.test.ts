import { createTheme } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';
import { inputsCustomizations } from './inputs';

const theme = createTheme();

type TestedInputComponent = 'MuiButton' | 'MuiIconButton' | 'MuiToggleButton' | 'MuiOutlinedInput';

function resolveRoot(component: TestedInputComponent) {
  const customization = inputsCustomizations[component] as { styleOverrides?: { root?: unknown } } | undefined;
  const root = customization?.styleOverrides?.root;
  expect(typeof root).toBe('function');
  return (root as unknown as (params: { theme: typeof theme }) => Record<string, unknown>)({ theme });
}

describe('input interaction customizations', () => {
  it('gives floating icon actions an explicit high-contrast style', () => {
    const styles = resolveRoot('MuiIconButton');

    expect(styles).toHaveProperty('&&[data-floating-action="true"]');
  });

  it('raises button, icon and toggle touch targets on coarse pointers', () => {
    expect(resolveRoot('MuiButton')).toHaveProperty('@media (pointer: coarse)');
    expect(resolveRoot('MuiIconButton')).toHaveProperty('@media (pointer: coarse)');
    expect(resolveRoot('MuiToggleButton')).toHaveProperty('@media (pointer: coarse)');
  });

  it('keeps invalid outlined inputs visibly marked', () => {
    const styles = resolveRoot('MuiOutlinedInput');

    expect(Object.keys(styles).some((key) => key.includes('Mui-error'))).toBe(true);
  });

  it('does not dim placeholder text below the selected contrast token', () => {
    const input = inputsCustomizations.MuiInputBase?.styleOverrides?.input as Record<string, Record<string, unknown>>;

    expect(input['&::placeholder']).toMatchObject({ opacity: 1 });
  });
});

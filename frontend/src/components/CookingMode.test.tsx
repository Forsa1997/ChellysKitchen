import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { CookingMode } from './CookingMode';
import type { Recipe } from '../types/domain';

const installWakeLockMock = () => {
  const release = vi.fn().mockResolvedValue(undefined);
  const request = vi.fn().mockResolvedValue({ release });
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    value: { request },
  });
  return { request, release };
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'wakeLock');
});

const recipe = {
  id: 'recipe-1',
  slug: 'pasta',
  title: 'Pasta',
  shortDescription: 'Schnell und lecker',
  difficulty: 'EINFACH',
  servings: 2,
  preparationTime: 10,
  cookingTime: 20,
  category: 'Pasta',
  status: 'PUBLISHED',
  ingredients: [{ name: 'Spaghetti', amount: 200, unit: 'g' }],
  steps: [
    { stepNumber: 1, instruction: 'Wasser kochen und Pasta garen.' },
    { stepNumber: 2, instruction: 'Sauce erwärmen und mischen.' },
  ],
  createdBy: { id: 'u1', name: 'Chris' },
  createdAt: '2026-04-30T12:00:00.000Z',
  updatedAt: '2026-04-30T12:00:00.000Z',
} as Recipe;

describe('CookingMode', () => {
  const renderCookingMode = (props: Partial<Parameters<typeof CookingMode>[0]> = {}) =>
    render(
      <CookingMode
        recipe={recipe}
        servings={recipe.servings}
        open
        onClose={() => undefined}
        {...props}
      />,
    );

  it('starts with the ingredient overview scaled to the selected servings', () => {
    const screen = renderCookingMode({ servings: 3 });

    expect(screen.getByText('Zutaten für 3 Portionen')).toBeInTheDocument();
    expect(screen.getByText(/300 g/)).toBeInTheDocument();
    expect(screen.getByText('Spaghetti')).toBeInTheDocument();
  });

  it('walks through the steps one at a time with a step counter', () => {
    const screen = renderCookingMode();

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(screen.getByText('Schritt 1 von 2')).toBeInTheDocument();
    expect(screen.getByText('Wasser kochen und Pasta garen.')).toBeInTheDocument();
    expect(screen.queryByText('Sauce erwärmen und mischen.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(screen.getByText('Schritt 2 von 2')).toBeInTheDocument();
    expect(screen.getByText('Sauce erwärmen und mischen.')).toBeInTheDocument();
    expect(screen.queryByText('Wasser kochen und Pasta garen.')).not.toBeInTheDocument();
  });

  it('navigates back to the previous step and the ingredient overview', () => {
    const screen = renderCookingMode();

    expect(screen.getByRole('button', { name: 'Zurück' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zurück' }));

    expect(screen.getByText('Zutaten für 2 Portionen')).toBeInTheDocument();
  });

  it('finishes cooking mode from the last step', () => {
    const onClose = vi.fn();
    const screen = renderCookingMode({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fertig' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes via the close button in the header', () => {
    const onClose = vi.fn();
    const screen = renderCookingMode({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Kochmodus schließen' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the screen awake while open and releases the lock on close', async () => {
    const { request, release } = installWakeLockMock();

    const screen = renderCookingMode();
    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'));

    screen.rerender(
      <CookingMode recipe={recipe} servings={recipe.servings} open={false} onClose={() => undefined} />,
    );

    await waitFor(() => expect(release).toHaveBeenCalledTimes(1));
  });

  it('restarts at the ingredient overview when reopened', () => {
    const screen = renderCookingMode();

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(screen.getByText('Schritt 1 von 2')).toBeInTheDocument();

    screen.rerender(
      <CookingMode recipe={recipe} servings={recipe.servings} open={false} onClose={() => undefined} />,
    );
    screen.rerender(
      <CookingMode recipe={recipe} servings={recipe.servings} open onClose={() => undefined} />,
    );

    expect(screen.getByText('Zutaten für 2 Portionen')).toBeInTheDocument();
  });
});

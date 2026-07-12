import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
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
  vi.useRealTimers();
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

const recipeWithSteps = (...instructions: string[]): Recipe => ({
  ...recipe,
  steps: instructions.map((instruction, index) => ({
    stepNumber: index + 1,
    instruction,
  })),
});

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

  it.each([
    ['30 Sekunden ziehen lassen.', '30 Sekunden'],
    ['Noch 45 Sek. köcheln lassen.', '45 Sek.'],
    ['Für 5 Minuten ruhen lassen.', '5 Minuten'],
    ['Weitere 10 Min. backen.', '10 Min.'],
    ['Den Teig 2 Stunden kalt stellen.', '2 Stunden'],
    ['Mindestens 3 Std. durchziehen lassen.', '3 Std.'],
    ['Für 1 Stunde 15 Minuten in den Kühlschrank stellen.', '1 Stunde 15 Minuten'],
    ['Für 1 Stunde und 15 Minuten in den Kühlschrank stellen.', '1 Stunde und 15 Minuten'],
  ])('renders the recognized duration "%s" as an accessible start button', (instruction, duration) => {
    const screen = renderCookingMode({ recipe: recipeWithSteps(instruction) });

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(screen.getByRole('button', { name: `Timer für ${duration} starten` })).toBeInTheDocument();
  });

  it('does not mistake temperatures or ingredient amounts for timers', () => {
    const instruction = '200 g Mehl mit 2 EL Öl mischen und bei 180 °C backen.';
    const screen = renderCookingMode({ recipe: recipeWithSteps(instruction) });

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(screen.getByText(instruction)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Timer .* starten/i })).not.toBeInTheDocument();
  });

  it('starts, pauses and resumes a countdown before announcing completion', () => {
    vi.useFakeTimers();
    const screen = renderCookingMode({ recipe: recipeWithSteps('5 Sekunden ziehen lassen.') });

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Timer für 5 Sekunden starten' }));
    expect(screen.getByText('00:05')).toBeInTheDocument();
    expect(screen.getByText('00:05').closest('[aria-live]')).toBeNull();

    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.getByText('00:03')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Timer pausieren' }));
    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.getByText('00:03')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Timer fortsetzen' }));
    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.getByRole('status')).toHaveTextContent('Zeit ist um');
  });

  it('starts a replacement timer with a fresh full-second tick', () => {
    vi.useFakeTimers();
    const screen = renderCookingMode({ recipe: recipeWithSteps('5 Sekunden ziehen lassen.') });

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    const startButton = screen.getByRole('button', { name: 'Timer für 5 Sekunden starten' });
    fireEvent.click(startButton);
    act(() => vi.advanceTimersByTime(900));

    fireEvent.click(startButton);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText('00:05')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByText('00:04')).toBeInTheDocument();
  });

  it('keeps an active timer running while the cooking step changes', () => {
    vi.useFakeTimers();
    const screen = renderCookingMode({
      recipe: recipeWithSteps('5 Sekunden ziehen lassen.', 'Danach direkt servieren.'),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Timer für 5 Sekunden starten' }));
    act(() => vi.advanceTimersByTime(2_000));

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(screen.getByText('Schritt 2 von 2')).toBeInTheDocument();
    expect(screen.getByText('00:03')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByText('00:02')).toBeInTheDocument();
  });

  it('resets the timer after closing and reopening cooking mode', () => {
    vi.useFakeTimers();
    const timedRecipe = recipeWithSteps('5 Sekunden ziehen lassen.');
    const screen = renderCookingMode({ recipe: timedRecipe });

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Timer für 5 Sekunden starten' }));
    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.getByText('00:03')).toBeInTheDocument();

    screen.rerender(
      <CookingMode recipe={timedRecipe} servings={timedRecipe.servings} open={false} onClose={() => undefined} />,
    );
    screen.rerender(
      <CookingMode recipe={timedRecipe} servings={timedRecipe.servings} open onClose={() => undefined} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(screen.getByRole('button', { name: 'Timer für 5 Sekunden starten' })).toBeInTheDocument();
    expect(screen.queryByText('00:03')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Timer pausieren' })).not.toBeInTheDocument();
  });

  it('keeps instructions without a duration normally readable', () => {
    const instruction = 'Mit Salz abschmecken und direkt servieren.';
    const screen = renderCookingMode({ recipe: recipeWithSteps(instruction) });

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(screen.getByText(instruction)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Timer .* starten/i })).not.toBeInTheDocument();
  });
});

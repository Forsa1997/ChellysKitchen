import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CreateRecipePage } from './CreateRecipePage';

const importRecipeMock = vi.fn();

vi.mock('../api/client', () => ({
  apiClient: {
    importRecipe: (...args: unknown[]) => importRecipeMock(...args),
    uploadImage: vi.fn(),
  },
}));

vi.mock('../hooks/useRecipes', () => ({
  useCreateRecipe: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({ data: [{ id: 'c1', name: 'Cooking' }] }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreateRecipePage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  importRecipeMock.mockReset();
});

describe('CreateRecipePage import', () => {
  it('prefills the form from an imported recipe URL', async () => {
    importRecipeMock.mockResolvedValue({
      recipe: {
        title: 'Importierte Linsensuppe',
        shortDescription: 'Von einer fremden Seite.',
        servings: 4,
        preparationTime: 15,
        cookingTime: 40,
        img: undefined,
        ingredients: [{ name: 'Linsen', amount: 250, unit: 'g' }],
        steps: [{ stepNumber: 1, instruction: 'Alles kochen.' }],
      },
      source: 'https://example.com/rezept',
    });

    renderPage();

    fireEvent.change(screen.getByLabelText('Rezept-URL'), {
      target: { value: 'https://example.com/rezept' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }));

    await waitFor(() => expect(importRecipeMock).toHaveBeenCalledWith('https://example.com/rezept'));
    await waitFor(() => {
      expect(screen.getByLabelText(/Titel/)).toHaveValue('Importierte Linsensuppe');
    });
    expect(screen.getByLabelText(/Kurzbeschreibung/)).toHaveValue('Von einer fremden Seite.');
    expect(screen.getAllByLabelText(/^Zutat/)[0]).toHaveValue('Linsen');
    expect(screen.getAllByLabelText(/Anweisung/)[0]).toHaveValue('Alles kochen.');
  });

  it('shows the server error when the import fails', async () => {
    importRecipeMock.mockRejectedValue(new Error('Auf dieser Seite wurde kein Rezept gefunden.'));

    renderPage();

    fireEvent.change(screen.getByLabelText('Rezept-URL'), {
      target: { value: 'https://example.com/kein-rezept' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }));

    expect(await screen.findByText('Auf dieser Seite wurde kein Rezept gefunden.')).toBeInTheDocument();
  });
});

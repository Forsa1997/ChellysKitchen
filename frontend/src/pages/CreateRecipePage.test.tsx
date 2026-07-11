import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CreateRecipePage } from './CreateRecipePage';

const importRecipeMock = vi.fn();
const importRecipeFromPhotoMock = vi.fn();
const uploadImageMock = vi.fn();

vi.mock('../api/client', () => ({
  apiClient: {
    importRecipe: (...args: unknown[]) => importRecipeMock(...args),
    importRecipeFromPhoto: (...args: unknown[]) => importRecipeFromPhotoMock(...args),
    uploadImage: (...args: unknown[]) => uploadImageMock(...args),
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
  importRecipeFromPhotoMock.mockReset();
  uploadImageMock.mockReset();
  window.localStorage.clear();
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
    // Success bar summarizes what was taken over.
    expect(await screen.findByText(/Rezept erkannt/)).toBeInTheDocument();
    expect(screen.getByText(/1 Zutat/)).toBeInTheDocument();
  });

  it('restores the previous form state via Rückgängig', async () => {
    importRecipeMock.mockResolvedValue({
      recipe: {
        title: 'Importierter Titel',
        shortDescription: 'Importierte Beschreibung.',
        ingredients: [{ name: 'Linsen', amount: 250, unit: 'g' }],
        steps: [{ stepNumber: 1, instruction: 'Alles kochen.' }],
      },
      source: 'https://example.com/rezept',
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Mein eigener Titel' } });
    fireEvent.change(screen.getByLabelText('Rezept-URL'), {
      target: { value: 'https://example.com/rezept' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }));

    await waitFor(() => expect(screen.getByLabelText(/Titel/)).toHaveValue('Importierter Titel'));

    fireEvent.click(screen.getByRole('button', { name: 'Rückgängig' }));

    expect(screen.getByLabelText(/Titel/)).toHaveValue('Mein eigener Titel');
  });

  it('shows the server error with retry and leaves the form untouched', async () => {
    importRecipeMock.mockRejectedValue(new Error('Auf dieser Seite wurde kein Rezept gefunden.'));

    renderPage();

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Mein eigener Titel' } });
    fireEvent.change(screen.getByLabelText('Rezept-URL'), {
      target: { value: 'https://example.com/kein-rezept' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }));

    expect(await screen.findByText('Auf dieser Seite wurde kein Rezept gefunden.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Titel/)).toHaveValue('Mein eigener Titel');
  });
});

describe('CreateRecipePage photo import', () => {
  it('prefills the form and takes the photo over as recipe image', async () => {
    importRecipeFromPhotoMock.mockResolvedValue({
      recipe: {
        title: 'Foto-Pfannkuchen',
        shortDescription: 'Vom Kochbuchfoto.',
        servings: 4,
        preparationTime: 10,
        cookingTime: 20,
        ingredients: [{ name: 'Mehl', amount: 250, unit: 'g' }],
        steps: [{ stepNumber: 1, instruction: 'Alles verrühren.' }],
      },
      source: 'photo',
    });
    uploadImageMock.mockResolvedValue({ url: '/uploads/rezept.jpg' });

    renderPage();

    const file = new File(['fake-image'], 'rezept.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(/Foto importieren/), {
      target: { files: [file] },
    });

    await waitFor(() => expect(importRecipeFromPhotoMock).toHaveBeenCalledWith(file));
    await waitFor(() => {
      expect(screen.getByLabelText(/Titel/)).toHaveValue('Foto-Pfannkuchen');
    });
    expect(screen.getAllByLabelText(/^Zutat/)[0]).toHaveValue('Mehl');
    expect(screen.getAllByLabelText(/Anweisung/)[0]).toHaveValue('Alles verrühren.');
    // The photographed page becomes the recipe image.
    await waitFor(() => expect(uploadImageMock).toHaveBeenCalledWith(file));
    await waitFor(() => {
      expect(screen.getByLabelText(/oder Bild-URL/)).toHaveValue('/uploads/rezept.jpg');
    });
  });

  it('still fills the form when the image upload fails', async () => {
    importRecipeFromPhotoMock.mockResolvedValue({
      recipe: {
        title: 'Foto-Pfannkuchen',
        shortDescription: 'Vom Kochbuchfoto.',
        ingredients: [{ name: 'Mehl', amount: 250, unit: 'g' }],
        steps: [{ stepNumber: 1, instruction: 'Alles verrühren.' }],
      },
      source: 'photo',
    });
    uploadImageMock.mockRejectedValue(new Error('Upload kaputt.'));

    renderPage();

    const file = new File(['fake-image'], 'rezept.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(/Foto importieren/), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Titel/)).toHaveValue('Foto-Pfannkuchen');
    });
    expect(screen.getByLabelText(/oder Bild-URL/)).toHaveValue('');
  });

  it('shows the server error when the photo import fails', async () => {
    importRecipeFromPhotoMock.mockRejectedValue(new Error('Auf dem Foto wurde kein Rezept erkannt.'));

    renderPage();

    const file = new File(['fake-image'], 'katze.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(/Foto importieren/), {
      target: { files: [file] },
    });

    expect(await screen.findByText('Auf dem Foto wurde kein Rezept erkannt.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
  });
});

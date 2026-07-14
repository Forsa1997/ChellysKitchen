import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecipeForm } from './RecipeForm';
import type { CreateRecipeRequest } from '../api/client';

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({ data: [{ id: 'c1', name: 'Cooking' }, { id: 'c2', name: 'Baking' }] }),
}));

vi.mock('../api/client', () => ({
  apiClient: {
    uploadImage: vi.fn(),
    fetchImageObjectUrl: vi.fn(() => Promise.resolve('blob:mock-image')),
  },
  getApiBaseUrl: () => 'http://localhost:4000',
}));

function renderForm(
  initialValues?: React.ComponentProps<typeof RecipeForm>['initialValues'],
  extraProps?: Partial<React.ComponentProps<typeof RecipeForm>>,
) {
  const onSubmit = vi.fn<(data: CreateRecipeRequest) => Promise<unknown>>(() => Promise.resolve(undefined));
  const onCancel = vi.fn(() => undefined);
  render(
    <RecipeForm
      heading="Neues Rezept erstellen"
      submitLabel="Rezept speichern"
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...extraProps}
    />,
  );
  return { onSubmit, onCancel };
}

function fillMinimalRecipe() {
  fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Honigkuchen' } });
  fireEvent.change(screen.getByLabelText(/Kurzbeschreibung/), { target: { value: 'Süß und saftig' } });
  fireEvent.change(screen.getAllByLabelText(/Menge/)[0], { target: { value: '1,5' } });
  fireEvent.change(screen.getAllByLabelText(/Einheit/)[0], { target: { value: 'EL' } });
  fireEvent.change(screen.getAllByLabelText(/^Zutat/)[0], { target: { value: 'Honig' } });
  fireEvent.change(screen.getAllByLabelText(/Anweisung/)[0], { target: { value: 'Alles verrühren.' } });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('RecipeForm', () => {
  it('shows every section at once instead of a step wizard', () => {
    renderForm();

    expect(screen.getByText('Grundinformationen')).toBeInTheDocument();
    expect(screen.getByText('Zutaten')).toBeInTheDocument();
    expect(screen.getByText('Zubereitung')).toBeInTheDocument();
    expect(screen.getByText(/Nährwerte/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Weiter' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rezept speichern' })).toBeEnabled();
  });

  it('lists what is missing instead of silently refusing to submit', async () => {
    const { onSubmit } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Titel/);
    expect(screen.getByRole('alert')).toHaveTextContent(/Zutat/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a complete recipe and parses German decimal amounts', async () => {
    const { onSubmit } = renderForm();

    fillMinimalRecipe();
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Honigkuchen',
        shortDescription: 'Süß und saftig',
        category: 'Cooking',
        difficulty: 'MITTEL',
        ingredients: [{ name: 'Honig', amount: 1.5, unit: 'EL' }],
        steps: [{ stepNumber: 1, instruction: 'Alles verrühren.' }],
      }),
    );
  });

  it('drops fully empty ingredient and step rows instead of blocking', async () => {
    const { onSubmit } = renderForm();

    fillMinimalRecipe();
    fireEvent.click(screen.getByRole('button', { name: 'Zutat hinzufügen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Schritt hinzufügen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.ingredients).toHaveLength(1);
    expect(payload.steps).toHaveLength(1);
  });

  it('blocks the submit when an ingredient has an amount but no name', async () => {
    const { onSubmit } = renderForm();

    fillMinimalRecipe();
    fireEvent.click(screen.getByRole('button', { name: 'Zutat hinzufügen' }));
    fireEvent.change(screen.getAllByLabelText(/Menge/)[1], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/vervollständige/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts ingredients without amount or unit, like Salz', async () => {
    const { onSubmit } = renderForm();

    fillMinimalRecipe();
    fireEvent.click(screen.getByRole('button', { name: 'Zutat hinzufügen' }));
    fireEvent.change(screen.getAllByLabelText(/^Zutat/)[1], { target: { value: 'Salz' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].ingredients).toEqual([
      { name: 'Honig', amount: 1.5, unit: 'EL' },
      { name: 'Salz', amount: 0, unit: '' },
    ]);
  });

  it('offers German difficulty labels', async () => {
    const { onSubmit } = renderForm();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Schwierigkeit' }));
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('Einfach')).toBeInTheDocument();
    expect(within(listbox).getByText('Mittel')).toBeInTheDocument();
    expect(within(listbox).getByText('Schwer')).toBeInTheDocument();

    fireEvent.click(within(listbox).getByText('Einfach'));
    fillMinimalRecipe();
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].difficulty).toBe('EINFACH');
  });

  it('renumbers steps when one is removed', async () => {
    const { onSubmit } = renderForm();

    fillMinimalRecipe();
    fireEvent.click(screen.getByRole('button', { name: 'Schritt hinzufügen' }));
    fireEvent.change(screen.getAllByLabelText(/Anweisung/)[1], { target: { value: 'Backen.' } });

    // Remove the first step; the remaining one must become step 1.
    fireEvent.click(screen.getAllByRole('button', { name: 'Schritt entfernen' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].steps).toEqual([{ stepNumber: 1, instruction: 'Backen.' }]);
  });

  it('exposes a cancel action', () => {
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('mirrors the form state into the live preview as you type', () => {
    renderForm();

    const preview = screen.getByRole('region', { name: 'Live-Vorschau' });
    expect(within(preview).getByText('Noch kein Titel')).toBeInTheDocument();
    expect(within(preview).getByText('Die Kurzbeschreibung erscheint hier.')).toBeInTheDocument();
    // Defaults: 10 Min. Vorbereitung + 20 Min. Kochzeit, 2 Portionen.
    expect(within(preview).getByText(/30 Min\./)).toBeInTheDocument();
    expect(within(preview).getByText(/2 Portionen/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Kürbissuppe' } });
    fireEvent.change(screen.getByLabelText(/Kurzbeschreibung/), { target: { value: 'Cremig und warm.' } });
    fireEvent.change(screen.getAllByLabelText(/Menge/)[0], { target: { value: '1,5' } });
    fireEvent.change(screen.getAllByLabelText(/Einheit/)[0], { target: { value: 'kg' } });
    fireEvent.change(screen.getAllByLabelText(/^Zutat/)[0], { target: { value: 'Kürbis' } });
    fireEvent.change(screen.getAllByLabelText(/Anweisung/)[0], { target: { value: 'Alles pürieren.' } });

    expect(within(preview).getByText('Kürbissuppe')).toBeInTheDocument();
    expect(within(preview).getByText('Cremig und warm.')).toBeInTheDocument();
    expect(within(preview).getByText(/1,5 kg Kürbis/)).toBeInTheDocument();
    expect(within(preview).getByText('Alles pürieren.')).toBeInTheDocument();
  });

  it('only shows named ingredients in the preview', () => {
    renderForm();

    const preview = screen.getByRole('region', { name: 'Live-Vorschau' });
    // The initial empty ingredient row must not create an empty preview entry.
    fireEvent.change(screen.getAllByLabelText(/Menge/)[0], { target: { value: '2' } });
    expect(within(preview).queryByText(/^2\s*$/)).not.toBeInTheDocument();
  });

  it('restores a saved draft when a draftKey is provided', () => {
    window.localStorage.setItem(
      'recipe-draft:test',
      JSON.stringify({
        title: 'Entwurf-Titel',
        shortDescription: 'Aus dem Entwurf.',
        ingredients: [{ name: 'Mehl', amount: '250', unit: 'g' }],
        steps: [{ stepNumber: 1, instruction: 'Kneten.' }],
      }),
    );

    renderForm(undefined, { draftKey: 'recipe-draft:test' });

    expect(screen.getByLabelText(/Titel/)).toHaveValue('Entwurf-Titel');
    expect(screen.getByLabelText(/Kurzbeschreibung/)).toHaveValue('Aus dem Entwurf.');
    expect(screen.getAllByLabelText(/^Zutat/)[0]).toHaveValue('Mehl');
    expect(screen.getAllByLabelText(/Anweisung/)[0]).toHaveValue('Kneten.');
  });

  it('persists the form state as a draft while typing', async () => {
    renderForm(undefined, { draftKey: 'recipe-draft:test' });

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Autosave-Kuchen' } });

    await waitFor(
      () => {
        const raw = window.localStorage.getItem('recipe-draft:test');
        expect(raw).not.toBeNull();
        expect(JSON.parse(raw as string).title).toBe('Autosave-Kuchen');
      },
      { timeout: 3000 },
    );
    expect(screen.getByText(/Entwurf automatisch gespeichert/)).toBeInTheDocument();
  });

  it('clears the draft after a successful submit', async () => {
    renderForm(undefined, { draftKey: 'recipe-draft:test' });

    fillMinimalRecipe();
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    await waitFor(() => {
      expect(window.localStorage.getItem('recipe-draft:test')).toBeNull();
    }, { timeout: 3000 });
  });

  it('submits an explicit empty image when an existing recipe image is removed', async () => {
    const { onSubmit } = renderForm({
      title: 'Honigkuchen',
      shortDescription: 'Süß und saftig',
      img: '/uploads/honigkuchen.jpg',
      ingredients: [{ name: 'Honig', amount: 1.5, unit: 'EL' }],
      steps: [{ stepNumber: 1, instruction: 'Alles verrühren.' }],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Bild entfernen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual(expect.objectContaining({ img: '' }));
  });
});

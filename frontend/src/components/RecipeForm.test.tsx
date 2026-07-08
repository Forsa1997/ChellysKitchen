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
  },
}));

function renderForm() {
  const onSubmit = vi.fn<(data: CreateRecipeRequest) => Promise<unknown>>(() => Promise.resolve(undefined));
  const onCancel = vi.fn(() => undefined);
  render(
    <RecipeForm
      heading="Neues Rezept erstellen"
      submitLabel="Rezept speichern"
      onSubmit={onSubmit}
      onCancel={onCancel}
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

  it('blocks the submit when an ingredient is only partially filled', async () => {
    const { onSubmit } = renderForm();

    fillMinimalRecipe();
    fireEvent.click(screen.getByRole('button', { name: 'Zutat hinzufügen' }));
    fireEvent.change(screen.getAllByLabelText(/^Zutat/)[1], { target: { value: 'Mehl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rezept speichern' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/vervollständige/i);
    expect(onSubmit).not.toHaveBeenCalled();
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
});

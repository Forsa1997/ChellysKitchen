import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { WeekPlanPage } from './WeekPlanPage';

const useWeekPlanMock = vi.fn();
const removeMutation = { isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) };
const addMutation = { isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) };
const clearMutation = { isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) };

vi.mock('../hooks/useWeekPlan', () => ({
  useWeekPlan: () => useWeekPlanMock(),
  useAddToWeekPlan: () => addMutation,
  useRemoveFromWeekPlan: () => removeMutation,
  useClearWeekPlan: () => clearMutation,
}));

vi.mock('../api/client', () => ({
  getApiBaseUrl: () => 'https://api.example.com',
}));

const emptyDays = {
  monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <WeekPlanPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  removeMutation.mutateAsync.mockClear();
  addMutation.mutateAsync.mockClear();
  clearMutation.mutateAsync.mockClear();
});

describe('WeekPlanPage', () => {
  it('shows all seven days with German labels', () => {
    useWeekPlanMock.mockReturnValue({ data: { days: emptyDays }, isLoading: false, error: null });

    renderPage();

    for (const label of ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('lists planned recipes and removes them', () => {
    useWeekPlanMock.mockReturnValue({
      data: {
        days: {
          ...emptyDays,
          monday: [{
            recipeId: 'r1',
            servings: 4,
            recipe: { id: 'r1', slug: 'pasta', title: 'Pasta', img: '', servings: 4, category: 'Cooking' },
          }],
        },
      },
      isLoading: false,
      error: null,
    });

    renderPage();

    expect(screen.getByRole('link', { name: 'Pasta' })).toHaveAttribute('href', '/recipes/pasta');
    fireEvent.click(screen.getByRole('button', { name: 'Pasta vom Plan entfernen' }));
    expect(removeMutation.mutateAsync).toHaveBeenCalledWith({ day: 'monday', recipeId: 'r1' });
  });

  it('links the aggregated Bring! shopping list when something is planned', () => {
    useWeekPlanMock.mockReturnValue({
      data: {
        days: {
          ...emptyDays,
          friday: [{
            recipeId: 'r1',
            servings: 2,
            recipe: { id: 'r1', slug: 'pasta', title: 'Pasta', img: '', servings: 4, category: 'Cooking' },
          }],
        },
      },
      isLoading: false,
      error: null,
    });

    renderPage();

    const link = screen.getByRole('link', { name: /Bring/ });
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('https://api.example.com/api/weekplan/bring');
  });

  it('clears the whole week after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    useWeekPlanMock.mockReturnValue({
      data: {
        days: {
          ...emptyDays,
          sunday: [{
            recipeId: 'r1',
            servings: 2,
            recipe: { id: 'r1', slug: 'pasta', title: 'Pasta', img: '', servings: 4, category: 'Cooking' },
          }],
        },
      },
      isLoading: false,
      error: null,
    });

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Woche leeren' }));
    expect(clearMutation.mutateAsync).toHaveBeenCalledTimes(1);
  });
});

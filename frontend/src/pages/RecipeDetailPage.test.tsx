import { afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RecipeDetailPage } from './RecipeDetailPage';

const useRecipeMock = vi.fn();
const useAuthMock = vi.fn();
const useCreateRatingMock = vi.fn();
const useDeleteRatingMock = vi.fn();

vi.mock('../hooks/useRecipes', () => ({
  useRecipe: (...args: unknown[]) => useRecipeMock(...args),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../hooks/useRatings', () => ({
  useCreateRating: () => useCreateRatingMock(),
  useDeleteRating: () => useDeleteRatingMock(),
}));

afterEach(() => {
  cleanup();
});

describe('RecipeDetailPage', () => {
  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/recipes/pasta']}>
        <Routes>
          <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('shows loading state while recipe is fetched', () => {
    useRecipeMock.mockReturnValue({ data: null, isLoading: true, error: null });
    useAuthMock.mockReturnValue({ user: null });
    useCreateRatingMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useDeleteRatingMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });

    renderPage();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows 404 state with back navigation', () => {
    useRecipeMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: { statusCode: 404, message: 'Recipe not found' },
    });
    useAuthMock.mockReturnValue({ user: null });
    useCreateRatingMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useDeleteRatingMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });

    renderPage();

    expect(screen.getByText('Rezept nicht gefunden.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zurück zur Übersicht' })).toHaveAttribute('href', '/');
  });

  it('renders recipe details and owner todo button for owners', () => {
    useRecipeMock.mockReturnValue({
      data: {
        id: 'recipe-1',
        slug: 'pasta',
        title: 'Pasta',
        shortDescription: 'Schnell und lecker',
        description: 'Mit Tomaten und Basilikum',
        img: 'https://example.com/pasta.jpg',
        tag: 'abendessen',
        difficulty: 'EINFACH',
        servings: 2,
        preparationTime: 10,
        cookingTime: 20,
        category: 'Pasta',
        status: 'PUBLISHED',
        ingredients: [{ name: 'Spaghetti', amount: 200, unit: 'g' }],
        steps: [{ stepNumber: 1, instruction: 'Wasser kochen und Pasta garen.' }],
        nutritionalValues: {},
        createdBy: { id: 'u1', name: 'Chris' },
        createdAt: '2026-04-30T12:00:00.000Z',
        updatedAt: '2026-04-30T12:00:00.000Z',
        averageRating: 4.5,
        totalRatings: 10,
      },
      isLoading: false,
      error: null,
    });
    useAuthMock.mockReturnValue({ user: { id: 'u1' } });
    useCreateRatingMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useDeleteRatingMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });

    renderPage();

    expect(screen.getByRole('heading', { name: 'Pasta' })).toBeInTheDocument();
    expect(screen.getByText('Schnell und lecker')).toBeInTheDocument();
    expect(screen.getByText('Zutaten')).toBeInTheDocument();
    expect(screen.getByText('Zubereitung')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bearbeiten (TODO)' })).toBeDisabled();
  });
});

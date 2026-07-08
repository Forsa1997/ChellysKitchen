import { afterEach } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RecipeDetailPage } from './RecipeDetailPage';

const useRecipeMock = vi.fn();
const useAuthMock = vi.fn();
const useCreateRatingMock = vi.fn();
const useDeleteRatingMock = vi.fn();
const useRecipeRatingsMock = vi.fn();
const useDeleteRecipeMock = vi.fn();
const usePublishRecipeMock = vi.fn();
const useArchiveRecipeMock = vi.fn();

vi.mock('../hooks/useRecipes', () => ({
  useRecipe: (...args: unknown[]) => useRecipeMock(...args),
  useDeleteRecipe: () => useDeleteRecipeMock(),
  usePublishRecipe: () => usePublishRecipeMock(),
  useArchiveRecipe: () => useArchiveRecipeMock(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../hooks/useRatings', () => ({
  useCreateRating: () => useCreateRatingMock(),
  useDeleteRating: () => useDeleteRatingMock(),
  useRecipeRatings: (...args: unknown[]) => useRecipeRatingsMock(...args),
}));

const getRandomRecipeMock = vi.fn();

vi.mock('../api/client', () => ({
  apiClient: {
    getRandomRecipe: (...args: unknown[]) => getRandomRecipeMock(...args),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="current-path">{location.pathname}</output>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mockMutation = () => ({ isPending: false, mutateAsync: vi.fn() });

const mockDefaults = () => {
  useCreateRatingMock.mockReturnValue(mockMutation());
  useDeleteRatingMock.mockReturnValue(mockMutation());
  useRecipeRatingsMock.mockReturnValue({ data: null });
  useDeleteRecipeMock.mockReturnValue(mockMutation());
  usePublishRecipeMock.mockReturnValue(mockMutation());
  useArchiveRecipeMock.mockReturnValue(mockMutation());
};

describe('RecipeDetailPage', () => {
  const recipe = {
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
  };

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/recipes/pasta']}>
        <LocationProbe />
        <Routes>
          <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('shows loading state while recipe is fetched', () => {
    useRecipeMock.mockReturnValue({ data: null, isLoading: true, error: null });
    useAuthMock.mockReturnValue({ user: null });
    mockDefaults();

    const screen = renderPage();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows 404 state with back navigation', () => {
    useRecipeMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: { statusCode: 404, message: 'Recipe not found' },
    });
    useAuthMock.mockReturnValue({ user: null });
    mockDefaults();

    const screen = renderPage();

    expect(screen.getByText('Rezept nicht gefunden.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zurück zur Übersicht' })).toHaveAttribute('href', '/');
  });

  it('renders recipe details and edit action for owners', () => {
    useRecipeMock.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'MEMBER' } });
    mockDefaults();

    const screen = renderPage();

    expect(screen.getByRole('heading', { name: 'Pasta' })).toBeInTheDocument();
    expect(screen.getByText('Schnell und lecker')).toBeInTheDocument();
    expect(screen.getByText('Zutaten')).toBeInTheDocument();
    expect(screen.getByText('Zubereitung')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bearbeiten' })).toHaveAttribute('href', '/recipes/pasta/edit');
  });

  it('shows the rendered photo together with the SVG illustration for bundled recipes', () => {
    useRecipeMock.mockReturnValue({
      data: { ...recipe, img: '/recipe-images/pasta-spinat-lachs.svg' },
      isLoading: false,
      error: null,
    });
    useAuthMock.mockReturnValue({ user: null });
    mockDefaults();

    const screen = renderPage();

    expect(screen.getByAltText('Pasta')).toHaveAttribute('src', '/recipe-images/renders/pasta-spinat-lachs.jpg');
    expect(screen.getByAltText('Illustration: Pasta')).toHaveAttribute('src', '/recipe-images/pasta-spinat-lachs.svg');
  });

  it('shows only the original image for uploaded recipe photos', () => {
    useRecipeMock.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });
    useAuthMock.mockReturnValue({ user: null });
    mockDefaults();

    const screen = renderPage();

    expect(screen.getByAltText('Pasta')).toHaveAttribute('src', 'https://example.com/pasta.jpg');
    expect(screen.queryByAltText('Illustration: Pasta')).not.toBeInTheDocument();
  });

  it('scales ingredient amounts when servings are adjusted', () => {
    useRecipeMock.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });
    useAuthMock.mockReturnValue({ user: null });
    mockDefaults();

    const screen = renderPage();

    expect(screen.getByText('Für 2 Portionen')).toBeInTheDocument();
    expect(screen.getByText(/200 g/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Portionen erhöhen' }));

    expect(screen.getByText('Für 3 Portionen')).toBeInTheDocument();
    expect(screen.getByText(/300 g/)).toBeInTheDocument();
  });

  it('prints the recipe from the recipe action bar', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    useRecipeMock.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });
    useAuthMock.mockReturnValue({ user: null });
    mockDefaults();

    const screen = renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Drucken' }));

    expect(print).toHaveBeenCalledTimes(1);
  });

  it('rolls again for another random recipe, excluding the current one', async () => {
    useRecipeMock.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });
    useAuthMock.mockReturnValue({ user: null });
    mockDefaults();
    getRandomRecipeMock.mockResolvedValue({ slug: 'tomatensuppe' });

    const screen = renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Nochmal würfeln' }));

    expect(getRandomRecipeMock).toHaveBeenCalledWith({ exclude: 'pasta' });
    await waitFor(() => {
      expect(screen.getByLabelText('current-path')).toHaveTextContent('/recipes/tomatensuppe');
    });
  });

  it('copies the recipe link from the recipe action bar', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    useRecipeMock.mockReturnValue({
      data: recipe,
      isLoading: false,
      error: null,
    });
    useAuthMock.mockReturnValue({ user: null });
    mockDefaults();

    const screen = renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Link kopieren' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/recipes/pasta')));
    expect(screen.getByText('Link kopiert')).toBeInTheDocument();
  });
});

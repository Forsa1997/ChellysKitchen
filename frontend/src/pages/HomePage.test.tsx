import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { HomePage } from './HomePage';

const useAuthMock = vi.fn();
const useCategoriesMock = vi.fn();
const useQueryRecipesMock = vi.fn();
const getRandomRecipeMock = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => useCategoriesMock(),
}));

vi.mock('../recipes/useQueryRecipes', () => ({
  useQueryRecipes: (...args: unknown[]) => useQueryRecipesMock(...args),
}));

vi.mock('../hooks/useRecipes', () => ({
  useToggleFavorite: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../api/client', () => ({
  apiClient: {
    getRandomRecipe: (...args: unknown[]) => getRandomRecipeMock(...args),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="current-path">{location.pathname}</output>;
}

const defaultMeta = {
  page: 1,
  pageSize: 6,
  total: 2,
  totalPages: 1,
  q: '',
  category: 'all',
  sort: 'newest',
  difficulty: 'all',
  maxTotalMinutes: null,
};

const recipes = [
  {
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
    ingredients: [],
    steps: [],
    createdBy: { id: 'u1', name: 'Chris' },
    createdAt: '2026-04-30T12:00:00.000Z',
    updatedAt: '2026-04-30T12:00:00.000Z',
  },
  {
    id: 'recipe-2',
    slug: 'tomatensuppe',
    title: 'Tomatensuppe',
    shortDescription: 'Warm und samtig',
    difficulty: 'MITTEL',
    servings: 4,
    preparationTime: 15,
    cookingTime: 30,
    category: 'Suppe',
    status: 'PUBLISHED',
    ingredients: [],
    steps: [],
    createdBy: { id: 'u2', name: 'Chelly' },
    createdAt: '2026-04-30T12:00:00.000Z',
    updatedAt: '2026-04-30T12:00:00.000Z',
  },
] as const;

function renderHomePage(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes/:slug" element={null} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomePage random recipe action', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    getRandomRecipeMock.mockReset();
  });

  it('asks the server for a random recipe and navigates to it', async () => {
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });
    getRandomRecipeMock.mockResolvedValue({ slug: 'tomatensuppe' });

    renderHomePage();

    fireEvent.click(screen.getByRole('button', { name: 'Zufälliges Rezept' }));

    await waitFor(() => {
      expect(screen.getByLabelText('current-path')).toHaveTextContent('/recipes/tomatensuppe');
    });
  });

  it('passes the active filters on to the random request', async () => {
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });
    getRandomRecipeMock.mockResolvedValue({ slug: 'pasta' });

    renderHomePage('/?category=Suppe&difficulty=Mittel&maxTotalMinutes=30&q=warm');

    fireEvent.click(screen.getByRole('button', { name: 'Zufälliges Rezept' }));

    await waitFor(() => {
      expect(getRandomRecipeMock).toHaveBeenCalledWith(expect.objectContaining({
        category: 'Suppe',
        difficulty: 'Mittel',
        maxTotalMinutes: 30,
        q: 'warm',
      }));
    });
  });

  it('shows a message when no recipe matches the filters', async () => {
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });
    getRandomRecipeMock.mockRejectedValue({ statusCode: 404, message: 'Kein passendes Rezept gefunden.' });

    renderHomePage();

    fireEvent.click(screen.getByRole('button', { name: 'Zufälliges Rezept' }));

    await waitFor(() => {
      expect(screen.getByText('Kein passendes Rezept gefunden.')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('current-path')).toHaveTextContent('/');
  });

  it('disables the random recipe button when no recipe is available', () => {
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes: [],
      meta: { ...defaultMeta, total: 0 },
      loading: false,
      error: null,
    });

    renderHomePage();

    expect(screen.getByRole('button', { name: 'Zufälliges Rezept' })).toBeDisabled();
  });

  it('offers a favorites-only filter to signed-in users that updates the URL', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'MEMBER' } });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });

    renderHomePage();

    fireEvent.click(screen.getByRole('button', { name: 'Nur Favoriten' }));

    expect(useQueryRecipesMock).toHaveBeenLastCalledWith(expect.objectContaining({ favorites: true }));
  });

  it('hides the favorites filter for anonymous visitors', () => {
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });

    renderHomePage();

    expect(screen.queryByRole('button', { name: 'Nur Favoriten' })).not.toBeInTheDocument();
  });

  it('no longer renders the recipe lottery panel', () => {
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });

    renderHomePage();

    expect(screen.queryByLabelText('Zufallskategorie')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eingeschränkt zufällig' })).not.toBeInTheDocument();
  });

  it('keeps the current recipe list visible while filtered results are refreshing', () => {
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: true,
      fetching: true,
      error: null,
    });

    renderHomePage();

    expect(screen.getByRole('link', { name: /Pasta/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tomatensuppe/ })).toBeInTheDocument();
    expect(screen.getByText(/Rezepte werden aktualisiert/)).toBeInTheDocument();
  });
});

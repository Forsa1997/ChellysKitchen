import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { HomePage } from './HomePage';

const useAuthMock = vi.fn();
const useCategoriesMock = vi.fn();
const useQueryRecipesMock = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => useCategoriesMock(),
}));

vi.mock('../recipes/useQueryRecipes', () => ({
  useQueryRecipes: (...args: unknown[]) => useQueryRecipesMock(...args),
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

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
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
  });

  it('navigates to one of the loaded recipes when the random recipe button is clicked', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });

    renderHomePage();

    fireEvent.click(screen.getByRole('button', { name: 'Zufälliges Rezept' }));

    expect(screen.getByLabelText('current-path')).toHaveTextContent('/recipes/tomatensuppe');
  });

  it('navigates to a random recipe within the selected random category', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });

    renderHomePage();

    fireEvent.mouseDown(screen.getByLabelText('Zufallskategorie'));
    fireEvent.click(screen.getByRole('option', { name: 'Suppe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eingeschränkt zufällig' }));

    expect(screen.getByLabelText('current-path')).toHaveTextContent('/recipes/tomatensuppe');
  });

  it('uses selected recipes as the random pool before the random category', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });

    renderHomePage();

    fireEvent.mouseDown(screen.getByLabelText('Zufallskategorie'));
    fireEvent.click(screen.getByRole('option', { name: 'Suppe' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pasta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eingeschränkt zufällig' }));

    expect(screen.getByLabelText('current-path')).toHaveTextContent('/recipes/pasta');
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

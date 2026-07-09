import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { HomePage } from './HomePage';

const useAuthMock = vi.fn();
const useCategoriesMock = vi.fn();
const useQueryRecipesMock = vi.fn();
const useInfiniteQueryRecipesMock = vi.fn();
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

// Falls back to an empty result so desktop-focused tests don't need to stub
// the infinite hook explicitly.
vi.mock('../recipes/useInfiniteQueryRecipes', () => ({
  useInfiniteQueryRecipes: (...args: unknown[]) =>
    useInfiniteQueryRecipesMock(...args) ?? {
      recipes: [],
      meta: { page: 1, pageSize: 12, total: 0, totalPages: 1 },
      loading: false,
      fetching: false,
      fetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: () => {},
      error: null,
    },
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

    expect(useQueryRecipesMock).toHaveBeenLastCalledWith(expect.objectContaining({ favorites: true }), expect.anything());
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

describe('HomePage mobile filter sheet', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function setup() {
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [{ id: 'c1', name: 'Suppe' }] });
    useQueryRecipesMock.mockReturnValue({
      recipes,
      meta: defaultMeta,
      loading: false,
      error: null,
    });
    return renderHomePage();
  }

  it('opens the filter sheet via the filter button and applies a filter to the URL', () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: /Filter/ }));

    // Sheet content: category/difficulty/time/sort controls become reachable.
    const sheet = screen.getByRole('presentation');
    expect(sheet).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mittel' }));

    expect(useQueryRecipesMock).toHaveBeenLastCalledWith(expect.objectContaining({ difficulty: 'Mittel' }), expect.anything());
  });

  it('closes the sheet via the result-count button', async () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: /Filter/ }));
    fireEvent.click(screen.getByRole('button', { name: '2 Rezepte anzeigen' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '2 Rezepte anzeigen' })).not.toBeInTheDocument();
    });
  });
});

describe('HomePage mobile infinite scroll', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // Simulate a phone viewport so useMediaQuery(breakpoints.down('md')) matches.
  function mockMobileViewport() {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query.includes('max-width') && parseFloat(query.match(/max-width:\s*([\d.]+)px/)?.[1] ?? '0') < 900,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList);
  }

  function setupMobile(infiniteOverrides: Record<string, unknown> = {}) {
    mockMobileViewport();
    useAuthMock.mockReturnValue({ user: null });
    useCategoriesMock.mockReturnValue({ data: [] });
    useQueryRecipesMock.mockReturnValue({
      recipes: [],
      meta: { ...defaultMeta, total: 0 },
      loading: false,
      error: null,
    });
    useInfiniteQueryRecipesMock.mockReturnValue({
      recipes,
      meta: { ...defaultMeta, totalPages: 2 },
      loading: false,
      fetching: false,
      fetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: vi.fn(),
      error: null,
      ...infiniteOverrides,
    });
    return renderHomePage();
  }

  it('uses the infinite list on mobile and hides the pagination', () => {
    setupMobile();

    expect(useInfiniteQueryRecipesMock).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'all' }),
      expect.objectContaining({ enabled: true }),
    );
    expect(useQueryRecipesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    );
    expect(screen.getByRole('link', { name: /Pasta/ })).toBeInTheDocument();
    expect(screen.queryByText(/Seite 1 von/)).not.toBeInTheDocument();
  });

  it('fetches the next page once the sentinel becomes visible', async () => {
    let intersectionCallback: IntersectionObserverCallback = () => {};
    const observeMock = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }
      observe = observeMock;
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    });

    const fetchNextPage = vi.fn();
    setupMobile({ fetchNextPage });

    expect(observeMock).toHaveBeenCalled();

    intersectionCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('reports when everything is loaded instead of paginating', () => {
    setupMobile({ hasNextPage: false, meta: { ...defaultMeta, total: 2, totalPages: 1 } });

    expect(screen.getByText('Alle 2 Rezepte geladen')).toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { RecipeWorldPage } from './RecipeWorldPage';

const useQueryRecipesMock = vi.fn();

vi.mock('../recipes/useQueryRecipes', () => ({
  useQueryRecipes: (...args: unknown[]) => useQueryRecipesMock(...args),
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="recipe-world-canvas" />,
}));

vi.mock('@react-three/drei', () => ({
  Float: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Html: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  OrbitControls: () => null,
  Sparkles: () => null,
}));

const recipes = [
  {
    id: 'pasta', slug: 'cremige-pasta', title: 'Cremige Pasta', shortDescription: 'Schnell und cremig',
    difficulty: 'EINFACH', servings: 2, preparationTime: 10, cookingTime: 15, category: 'Pasta', status: 'PUBLISHED',
    ingredients: [], steps: [], createdBy: { id: '1', name: 'Chelly' }, createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'suppe', slug: 'tomatensuppe', title: 'Tomatensuppe', shortDescription: 'Warm und samtig',
    difficulty: 'MITTEL', servings: 4, preparationTime: 20, cookingTime: 25, category: 'Suppen', status: 'PUBLISHED',
    ingredients: [], steps: [], createdBy: { id: '1', name: 'Chelly' }, createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
];

function renderPage() {
  return render(<MemoryRouter><RecipeWorldPage /></MemoryRouter>);
}

describe('RecipeWorldPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders published recipes as explorable recipe stations', () => {
    useQueryRecipesMock.mockReturnValue({ recipes, loading: false, error: null });

    renderPage();

    expect(screen.getByRole('heading', { name: 'Rezeptwelt' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cremige Pasta entdecken/i })).toHaveAttribute('href', '/recipes/cremige-pasta');
    expect(screen.getByRole('link', { name: /Tomatensuppe entdecken/i })).toHaveAttribute('href', '/recipes/tomatensuppe');
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });

  it('shows which little 3D dish each station serves', () => {
    useQueryRecipesMock.mockReturnValue({ recipes, loading: false, error: null });

    renderPage();

    expect(screen.getByRole('link', { name: /Cremige Pasta entdecken/i })).toHaveTextContent('Pastateller');
    expect(screen.getByRole('link', { name: /Tomatensuppe entdecken/i })).toHaveTextContent('Suppenschüssel');
  });

  it('lets players filter the world by recipe category', () => {
    useQueryRecipesMock.mockReturnValue({ recipes, loading: false, error: null });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Pasta' }));

    expect(screen.getByRole('link', { name: /Cremige Pasta entdecken/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Tomatensuppe entdecken/i })).not.toBeInTheDocument();
  });

  it('communicates loading and empty states', () => {
    useQueryRecipesMock.mockReturnValue({ recipes: [], loading: true, error: null });
    const { rerender } = renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    useQueryRecipesMock.mockReturnValue({ recipes: [], loading: false, error: null });
    rerender(<MemoryRouter><RecipeWorldPage /></MemoryRouter>);
    expect(screen.getByText('Noch keine Stationen in Sicht.')).toBeInTheDocument();
  });
});

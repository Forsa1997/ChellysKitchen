import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);
import { RecipeGrid } from './RecipeGrid';
import type { Recipe } from '../types/domain';

// MUI's useMediaQuery reads window.matchMedia; make breakpoint queries below
// `md` (900px) report a match to simulate a phone viewport.
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

afterEach(() => {
  vi.restoreAllMocks();
});

const favoriteRecipe: Recipe = {
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
  isFavorite: false,
  createdBy: { id: 'u1', name: 'Chris' },
  createdAt: '2026-04-30T12:00:00.000Z',
  updatedAt: '2026-04-30T12:00:00.000Z',
};

describe('RecipeGrid', () => {
  it('renders card metadata and links to detail page', () => {
    const screen = render(
      <MemoryRouter>
        <RecipeGrid
          recipes={[
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
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Schnell und lecker')).toBeInTheDocument();
    expect(screen.getByText('30 Minuten · 2 Portionen')).toBeInTheDocument();
    expect(screen.getByText(/Chris/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/recipes/pasta');
  });

  it('shows the average star rating with its count on the card', () => {
    const screen = render(
      <MemoryRouter>
        <RecipeGrid recipes={[{ ...favoriteRecipe, averageRating: 4.5, totalRatings: 3 }]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.getByLabelText('4.5 Stars')).toBeInTheDocument();
  });

  it('shows empty stars with a zero count for unrated recipes', () => {
    const screen = render(
      <MemoryRouter>
        <RecipeGrid recipes={[{ ...favoriteRecipe, averageRating: 0, totalRatings: 0 }]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('(0)')).toBeInTheDocument();
  });

  it('shows no favorite button without an onToggleFavorite handler', () => {
    const screen = render(
      <MemoryRouter>
        <RecipeGrid recipes={[{ ...favoriteRecipe }]} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: /Favorit/ })).not.toBeInTheDocument();
  });

  it('toggles a favorite via the heart button without navigating', () => {
    const onToggleFavorite = vi.fn();
    const screen = render(
      <MemoryRouter>
        <RecipeGrid recipes={[{ ...favoriteRecipe }]} onToggleFavorite={onToggleFavorite} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Als Favorit markieren' }));

    expect(onToggleFavorite).toHaveBeenCalledWith(expect.objectContaining({ slug: 'pasta', isFavorite: false }));
  });

  it('labels the heart button for removal when the recipe is already a favorite', () => {
    const screen = render(
      <MemoryRouter>
        <RecipeGrid recipes={[{ ...favoriteRecipe, isFavorite: true }]} onToggleFavorite={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Favorit entfernen' })).toBeInTheDocument();
  });

  it('shows the rendered photo together with the SVG illustration for bundled recipes', () => {
    const screen = render(
      <MemoryRouter>
        <RecipeGrid
          recipes={[
            {
              id: 'recipe-1',
              slug: 'bbq-burger',
              title: 'BBQ Burger',
              shortDescription: 'Saftig vom Grill',
              img: '/recipe-images/bbq-burger.svg',
              difficulty: 'EINFACH',
              servings: 2,
              preparationTime: 10,
              cookingTime: 20,
              category: 'Grillen',
              status: 'PUBLISHED',
              ingredients: [],
              steps: [],
              createdBy: { id: 'u1', name: 'Chris' },
              createdAt: '2026-04-30T12:00:00.000Z',
              updatedAt: '2026-04-30T12:00:00.000Z',
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByAltText('BBQ Burger')).toHaveAttribute('src', '/recipe-images/renders/bbq-burger.jpg');
    expect(screen.getByAltText('Illustration: BBQ Burger')).toHaveAttribute('src', '/recipe-images/bbq-burger.svg');
  });

  it('keeps showing only the original image for uploaded recipe photos', () => {
    const screen = render(
      <MemoryRouter>
        <RecipeGrid
          recipes={[
            {
              id: 'recipe-1',
              slug: 'pasta',
              title: 'Pasta',
              shortDescription: 'Schnell und lecker',
              img: 'https://example.com/pasta.jpg',
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
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByAltText('Pasta')).toHaveAttribute('src', 'https://example.com/pasta.jpg');
    expect(screen.queryByAltText('Illustration: Pasta')).not.toBeInTheDocument();
  });

  describe('mobile viewport', () => {
    it('renders a compact list item with title, difficulty and total minutes', () => {
      mockMobileViewport();
      const screen = render(
        <MemoryRouter>
          <RecipeGrid recipes={[{ ...favoriteRecipe }]} />
        </MemoryRouter>,
      );

      expect(screen.getByText('Pasta')).toBeInTheDocument();
      expect(screen.getByText('EINFACH')).toBeInTheDocument();
      expect(screen.getByText('30 Min.')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/recipes/pasta');
      // The compact card drops description, author and date to save space.
      expect(screen.queryByText('Schnell und lecker')).not.toBeInTheDocument();
      expect(screen.queryByText(/Chris/)).not.toBeInTheDocument();
    });

    it('still toggles favorites from the compact card without navigating', () => {
      mockMobileViewport();
      const onToggleFavorite = vi.fn();
      const screen = render(
        <MemoryRouter>
          <RecipeGrid recipes={[{ ...favoriteRecipe }]} onToggleFavorite={onToggleFavorite} />
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Als Favorit markieren' }));

      expect(onToggleFavorite).toHaveBeenCalledWith(expect.objectContaining({ slug: 'pasta', isFavorite: false }));
    });

    it('uses the rendered photo as the compact thumbnail for bundled recipes', () => {
      mockMobileViewport();
      const screen = render(
        <MemoryRouter>
          <RecipeGrid recipes={[{ ...favoriteRecipe, slug: 'bbq-burger', title: 'BBQ Burger', img: '/recipe-images/bbq-burger.svg' }]} />
        </MemoryRouter>,
      );

      expect(screen.getByAltText('BBQ Burger')).toHaveAttribute('src', '/recipe-images/renders/bbq-burger.jpg');
      expect(screen.queryByAltText('Illustration: BBQ Burger')).not.toBeInTheDocument();
    });
  });
});

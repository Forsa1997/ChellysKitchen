import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RecipeGrid } from './RecipeGrid';

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
});

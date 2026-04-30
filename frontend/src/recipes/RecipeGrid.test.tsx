import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RecipeGrid } from './RecipeGrid';

describe('RecipeGrid', () => {
  it('renders card metadata and links to detail page', () => {
    render(
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
    expect(screen.getByText(/Chris/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/recipes/pasta');
  });
});

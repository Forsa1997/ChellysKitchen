import test from 'node:test';
import assert from 'node:assert/strict';
import { RecipeUseCases } from './index';

function buildValidRecipeInput() {
  return {
    title: 'Spaghetti Bolognese',
    shortDescription: 'Ein klassisches Pasta-Gericht mit herzhafter Sauce.',
    description: 'Lecker und schnell gemacht.',
    img: 'https://example.com/spaghetti.jpg',
    tag: 'pasta',
    difficulty: 'EINFACH',
    servings: 2,
    preparationTime: 15,
    cookingTime: 30,
    category: 'Pasta',
    ingredients: [{ name: 'Spaghetti', amount: 200, unit: 'g' }],
    steps: [{ stepNumber: 1, instruction: 'Alles kochen und servieren.' }],
    nutritionalValues: { calories: 600 },
  };
}

test('getAllRecipes shows only published recipes for guests', async () => {
  const useCases = new RecipeUseCases() as any;
  let receivedWhere: any;

  useCases.prisma = {
    recipe: {
      findMany: async ({ where }: any) => {
        receivedWhere = where;
        return [];
      },
      count: async () => 0,
    },
  };

  await useCases.getAllRecipes({});

  assert.deepEqual(receivedWhere.OR, [{ status: 'PUBLISHED' }]);
});

test('getAllRecipes includes own recipes for authenticated users', async () => {
  const useCases = new RecipeUseCases() as any;
  let receivedWhere: any;

  useCases.prisma = {
    recipe: {
      findMany: async ({ where }: any) => {
        receivedWhere = where;
        return [];
      },
      count: async () => 0,
    },
  };

  await useCases.getAllRecipes({}, 'user-123');

  assert.deepEqual(receivedWhere.OR, [{ status: 'PUBLISHED' }, { createdById: 'user-123' }]);
});

test('getAllRecipes uses explicit status filter without visibility OR fallback', async () => {
  const useCases = new RecipeUseCases() as any;
  let receivedWhere: any;

  useCases.prisma = {
    recipe: {
      findMany: async ({ where }: any) => {
        receivedWhere = where;
        return [];
      },
      count: async () => 0,
    },
  };

  await useCases.getAllRecipes({ status: 'DRAFT' }, 'user-123');

  assert.equal(receivedWhere.status, 'DRAFT');
  assert.equal(receivedWhere.OR, undefined);
});

test('createRecipe creates draft recipe owned by current user and generated slug', async () => {
  const useCases = new RecipeUseCases() as any;
  const input = buildValidRecipeInput();
  let createCall: any;

  useCases.prisma = {
    recipe: {
      findMany: async () => [{ slug: 'spaghetti-bolognese' }],
      create: async (args: any) => {
        createCall = args;
        return {
          id: 'recipe-1',
          ...args.data,
          createdBy: { id: args.data.createdById, name: 'Test User' },
        };
      },
    },
  };

  const result = await useCases.createRecipe(input, 'user-123');

  assert.equal(createCall.data.status, 'DRAFT');
  assert.equal(createCall.data.createdById, 'user-123');
  assert.equal(createCall.data.slug, 'spaghetti-bolognese-1');
  assert.equal(result.status, 'DRAFT');
  assert.equal(result.createdById, 'user-123');
  assert.equal(result.slug, 'spaghetti-bolognese-1');
});

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

  assert.deepEqual(receivedWhere, {
    AND: [{ OR: [{ status: 'PUBLISHED' }] }],
  });
});

test('getAllRecipes public list does not expose draft visibility even when status query is provided', async () => {
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

  await useCases.getAllRecipes({ status: 'DRAFT' });

  assert.deepEqual(receivedWhere, {
    AND: [{ OR: [{ status: 'PUBLISHED' }] }],
  });
});

test('getAllRecipes authenticated list combines search filter with published-plus-own visibility', async () => {
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

  await useCases.getAllRecipes({ search: 'pasta' }, 'user-123');

  assert.deepEqual(receivedWhere.AND, [
    {
      OR: [
        { title: { contains: 'pasta', mode: 'insensitive' } },
        { shortDescription: { contains: 'pasta', mode: 'insensitive' } },
      ],
    },
    {
      OR: [{ status: 'PUBLISHED' }, { createdById: 'user-123' }],
    },
  ]);
});

test('getAllRecipes maps UI difficulty labels to persistence enum values consistently', async () => {
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

  await useCases.getAllRecipes({ difficulty: 'Einfach' }, 'user-123');

  assert.deepEqual(receivedWhere.AND, [
    { difficulty: 'EINFACH' },
    { OR: [{ status: 'PUBLISHED' }, { createdById: 'user-123' }] },
  ]);
});

test('getRecipeBySlug allows owner to access draft but blocks non-owner access', async () => {
  const useCases = new RecipeUseCases() as any;
  const draftRecipe = {
    id: 'recipe-1',
    slug: 'private-draft',
    status: 'DRAFT',
    createdById: 'owner-1',
  };

  useCases.prisma = {
    recipe: {
      findUnique: async () => draftRecipe,
    },
  };

  const ownerView = await useCases.getRecipeBySlug('private-draft', 'owner-1');
  assert.equal(ownerView.id, 'recipe-1');

  await assert.rejects(
    () => useCases.getRecipeBySlug('private-draft', 'other-user'),
    /permission|forbidden|not found/i,
  );
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
test('updateRecipe does not allow status escalation through general update payload', async () => {
  const useCases = new RecipeUseCases() as any;

  useCases.prisma = {
    recipe: {
      findUnique: async () => ({
        id: 'recipe-1',
        createdById: 'user-123',
        status: 'DRAFT',
      }),
      update: async () => ({ id: 'recipe-1' }),
    },
  };

  await assert.rejects(
    () =>
      useCases.updateRecipe(
        'recipe-1',
        {
          title: 'Updated Recipe Title',
          status: 'PUBLISHED',
        },
        'user-123',
        'MEMBER',
      ),
    /not allowed/i,
  );
});

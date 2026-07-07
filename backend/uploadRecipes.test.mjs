import test from 'node:test';
import assert from 'node:assert/strict';
import { selectMissingRecipes } from './scripts/upload-recipes.mjs';

test('selectMissingRecipes skips recipes already present on the target API', () => {
  const localRecipes = [
    { slug: 'already-there', title: 'Already There' },
    { slug: 'new-recipe', title: 'New Recipe' },
  ];
  const remoteRecipes = [
    { slug: 'already-there', title: 'Already There' },
  ];

  assert.deepEqual(selectMissingRecipes(localRecipes, remoteRecipes), [
    { slug: 'new-recipe', title: 'New Recipe' },
  ]);
});

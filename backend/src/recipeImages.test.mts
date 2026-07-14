import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_RECIPE_IMAGES,
  pickDefaultRecipeImage,
} from './recipeImages.mts';

test('default recipe images contain the available SVG illustrations', () => {
  assert.ok(DEFAULT_RECIPE_IMAGES.length > 0);
  assert.ok(DEFAULT_RECIPE_IMAGES.every((image) => /^\/recipe-images\/[a-z0-9-]+\.svg$/.test(image)));
  assert.equal(new Set(DEFAULT_RECIPE_IMAGES).size, DEFAULT_RECIPE_IMAGES.length);
});

test('pickDefaultRecipeImage can select the first and last illustration', () => {
  assert.equal(
    pickDefaultRecipeImage({ random: () => 0 }),
    DEFAULT_RECIPE_IMAGES[0],
  );
  assert.equal(
    pickDefaultRecipeImage({ random: () => 0.999999 }),
    DEFAULT_RECIPE_IMAGES.at(-1),
  );
});

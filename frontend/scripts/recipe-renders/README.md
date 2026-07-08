# Recipe render generator

Generates the realistic rendered recipe photos in
`frontend/public/recipe-images/renders/*.jpg`. Each scene in `scenes.mjs`
builds a 1600x1000 SVG "food photograph" (lighting, textures, depth of
field via SVG filters) that is rasterized to JPEG with headless Chromium.

The generated JPGs are committed, so this only needs to be re-run when a
scene changes.

## Usage

```bash
cd frontend
npm install --no-save playwright-core   # if not already available
node scripts/recipe-renders/generate-renders.mjs             # all scenes
node scripts/recipe-renders/generate-renders.mjs bbq-burger  # single scene
```

If Playwright cannot find a browser, point it at an existing Chromium
binary with `CHROMIUM_PATH=/path/to/chrome`.

Adding a new scene: add a builder in `scenes.mjs`, register the slug in the
`scenes` map, re-run the generator, and add the slug to
`RENDERED_RECIPE_SLUGS` in `frontend/src/recipes/recipeImages.ts`.

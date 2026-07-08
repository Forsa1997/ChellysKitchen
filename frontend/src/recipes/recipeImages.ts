// The bundled seed recipes ship with flat SVG illustrations. For each of them
// a realistic rendered photo exists under /recipe-images/renders/. Uploaded or
// external recipe images have no companion render.
const RENDERED_RECIPE_SLUGS = new Set([
  'apfel-zimt-porridge',
  'asia-nudelpfanne',
  'bbq-burger',
  'bbq-rippchen',
  'couscous-salat',
  'gemuese-lasagne',
  'karottentorte',
  'linsen-kokos-suppe',
  'panna-cotta-beeren',
  'pasta-spinat-lachs',
  'schoko-himbeer-brownies',
  'zitronen-haehnchen-blech',
]);

const ILLUSTRATION_PATTERN = /^\/recipe-images\/([a-z0-9-]+)\.svg$/;

export function recipeRenderImage(img: string | null | undefined): string | null {
  if (!img) return null;

  const match = ILLUSTRATION_PATTERN.exec(img);
  if (!match || !RENDERED_RECIPE_SLUGS.has(match[1])) return null;

  return `/recipe-images/renders/${match[1]}.jpg`;
}

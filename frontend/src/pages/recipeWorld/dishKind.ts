import type { Recipe } from '../../types/domain';

export type DishKind =
  | 'pasta'
  | 'soup'
  | 'pizza'
  | 'cake'
  | 'burger'
  | 'salad'
  | 'fish'
  | 'meat'
  | 'bread'
  | 'drink'
  | 'pot';

export const dishKindLabels: Record<DishKind, string> = {
  pasta: 'Pastateller',
  soup: 'Suppenschüssel',
  pizza: 'Pizza',
  cake: 'Kuchen',
  burger: 'Burger',
  salad: 'Salatschüssel',
  fish: 'Fischteller',
  meat: 'Fleischgericht',
  bread: 'Frisch gebacken',
  drink: 'Erfrischung',
  pot: 'Kochtopf',
};

// Order matters: earlier entries win when several keywords match the same text.
const keywordRules: Array<[DishKind, RegExp]> = [
  ['pizza', /pizza|flammkuchen/],
  ['burger', /burger/],
  ['pasta', /pasta|nudel|spaghetti|lasagne|tortellini|gnocchi|spätzle|penne|tagliatelle|mac.?aroni|ramen/],
  ['soup', /suppe|eintopf|brühe|chili con|curry|gulasch/],
  ['cake', /kuchen|torte|dessert|süß|muffin|keks|cookie|gebäck|waffel|pancake|pfannkuchen|crêpe|\beis(?:creme)?\b|pudding|tiramisu|brownie/],
  ['salad', /salat|bowl/],
  ['fish', /fisch|lachs|forelle|thunfisch|garnele|shrimp|scampi|dorade|kabeljau/],
  ['meat', /fleisch|steak|braten|schnitzel|hähnchen|hühnchen|huhn|pute|rind|schwein|lamm|hack|frikadelle|bratwurst|grill|gyros|filet/],
  ['bread', /frühstück|brot|brötchen|toast|baguette|brezel|bagel/],
  ['drink', /getränk|drink|smoothie|cocktail|saft|limonade|punsch|shake|kakao/],
];

function matchKind(text: string): DishKind | null {
  const normalized = text.toLowerCase();
  if (!normalized) return null;
  for (const [kind, pattern] of keywordRules) {
    if (pattern.test(normalized)) return kind;
  }
  return null;
}

type DishSource = Pick<Recipe, 'title' | 'category' | 'ingredients'> & { tag?: string };

/**
 * Picks the small 3D dish shown on a recipe's station in the Rezeptwelt.
 * The category is the strongest signal, then title/tag, then ingredient names.
 */
export function pickDishKind(recipe: DishSource): DishKind {
  return (
    matchKind(recipe.category) ??
    matchKind(`${recipe.title} ${recipe.tag ?? ''}`) ??
    matchKind(recipe.ingredients.map((ingredient) => ingredient.name).join(' ')) ??
    'pot'
  );
}

/** Deterministic pseudo-random value in [0, 1) so each station gets a stable little twist. */
export function dishSeed(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

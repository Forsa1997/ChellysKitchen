// Import recipes from other websites: most recipe sites embed their recipe
// as schema.org/Recipe JSON-LD (the same format our Bring! export serves).
// The server fetches the page (browsers can't, because of CORS), extracts
// the JSON-LD and maps it onto our recipe shape for the create form.

const UNIT_WORDS = new Set([
  'g', 'gramm', 'kg', 'mg',
  'ml', 'l', 'liter',
  'el', 'tl', 'msp',
  'stk', 'stück', 'stueck',
  'prise', 'prisen', 'bund', 'zehe', 'zehen',
  'becher', 'dose', 'dosen', 'packung', 'päckchen', 'pck', 'pkt', 'glas',
  'scheibe', 'scheiben', 'tasse', 'tassen', 'zweig', 'zweige', 'blatt', 'blätter',
]);

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç',
  ndash: '–', mdash: '—', hellip: '…', middot: '·', times: '×', deg: '°',
  frac12: '½', frac14: '¼', frac34: '¾',
};

function decodeEntities(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
      const code = parseInt(hex, 16);
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/&#(\d+);/g, (match, dec) => {
      const code = Number(dec);
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/&([a-zA-Z]+\d*);/g, (match, name) => NAMED_ENTITIES[name] ?? match);
}

function isRecipeNode(node) {
  if (!node || typeof node !== 'object') return false;
  const type = node['@type'];
  if (Array.isArray(type)) return type.includes('Recipe');
  return type === 'Recipe';
}

function findRecipeNode(node) {
  if (!node || typeof node !== 'object') return null;
  if (isRecipeNode(node)) return node;
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findRecipeNode(entry);
      if (found) return found;
    }
    return null;
  }
  if (Array.isArray(node['@graph'])) {
    return findRecipeNode(node['@graph']);
  }
  return null;
}

export function extractRecipeJsonLd(html) {
  const scripts = String(html).matchAll(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const match of scripts) {
    let parsed;
    try {
      parsed = JSON.parse(match[1].trim());
    } catch {
      continue; // broken JSON-LD block, try the next one
    }
    const recipe = findRecipeNode(parsed);
    if (recipe) return recipe;
  }
  return null;
}

export function parseIsoDurationToMinutes(value) {
  if (typeof value !== 'string') return undefined;
  const match = value.match(/^P(?:\d+D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:\d+S)?)?$/i);
  if (!match || (match[1] === undefined && match[2] === undefined)) return undefined;
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

export function parseIngredientText(text) {
  const cleaned = decodeEntities(text).replace(/\s+/g, ' ').trim();

  // Leading amount: "200", "1,5", "1.5" or a simple fraction like "1/2".
  const amountMatch = cleaned.match(/^(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!amountMatch) {
    return { amount: 0, unit: '', name: cleaned };
  }

  let amount;
  const amountText = amountMatch[1];
  if (amountText.includes('/')) {
    const [numerator, denominator] = amountText.split('/').map((part) => Number(part.trim()));
    amount = denominator ? Number((numerator / denominator).toFixed(2)) : 0;
  } else {
    amount = Number(amountText.replace(',', '.'));
  }

  let rest = amountMatch[2].trim();
  let unit = '';
  const firstWordMatch = rest.match(/^([^\s]+)\s+(.*)$/);
  if (firstWordMatch && UNIT_WORDS.has(firstWordMatch[1].toLowerCase().replace(/\.$/, ''))) {
    unit = firstWordMatch[1].replace(/\.$/, '');
    rest = firstWordMatch[2].trim();
  }

  return { amount, unit, name: rest };
}

function parseServings(recipeYield) {
  const first = Array.isArray(recipeYield) ? recipeYield[0] : recipeYield;
  const match = String(first ?? '').match(/\d+/);
  const servings = match ? Number(match[0]) : NaN;
  return Number.isFinite(servings) && servings >= 1 ? servings : 2;
}

function parseImage(image) {
  const first = Array.isArray(image) ? image[0] : image;
  const url = typeof first === 'object' && first !== null ? first.url : first;
  return typeof url === 'string' && /^https?:\/\//.test(url) ? url : undefined;
}

function flattenInstructions(instructions) {
  const steps = [];
  const visit = (node) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node === 'string') {
      const text = decodeEntities(node).trim();
      if (text) steps.push(text);
      return;
    }
    if (typeof node === 'object') {
      if (Array.isArray(node.itemListElement)) {
        visit(node.itemListElement); // HowToSection
        return;
      }
      const text = decodeEntities(node.text ?? node.name ?? '').trim();
      if (text) steps.push(text);
    }
  };
  visit(instructions);
  return steps.map((instruction, index) => ({ stepNumber: index + 1, instruction }));
}

export function mapJsonLdToRecipe(jsonLd) {
  const prep = parseIsoDurationToMinutes(jsonLd.prepTime);
  const cook = parseIsoDurationToMinutes(jsonLd.cookTime);
  const total = parseIsoDurationToMinutes(jsonLd.totalTime);

  return {
    title: decodeEntities(jsonLd.name ?? '').trim(),
    shortDescription: decodeEntities(jsonLd.description ?? '').trim(),
    servings: parseServings(jsonLd.recipeYield),
    preparationTime: prep ?? 0,
    // With only a total time, book it all as cooking time.
    cookingTime: cook ?? (total !== undefined ? Math.max(total - (prep ?? 0), 0) : 0),
    img: parseImage(jsonLd.image),
    ingredients: (Array.isArray(jsonLd.recipeIngredient) ? jsonLd.recipeIngredient : [])
      .map((line) => parseIngredientText(line))
      .filter((ingredient) => ingredient.name),
    steps: flattenInstructions(jsonLd.recipeInstructions),
  };
}

// --- Fallback for pages without schema.org/JSON-LD: plain HTML parsing ---
// Two heuristics, in order: schema.org microdata (itemprop attributes) and
// content sections under "Zutaten"/"Zubereitung"-style headings.

function stripTags(html) {
  return decodeEntities(String(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function metaContent(html, key) {
  const tag = html.match(new RegExp(`<meta\\b[^>]*(?:property|name)\\s*=\\s*["']${key}["'][^>]*>`, 'i'))?.[0];
  const content = tag?.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
  const text = content ? decodeEntities(content).trim() : '';
  return text || undefined;
}

function microdataValues(html, prop) {
  const matches = html.matchAll(
    new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\bitemprop\\s*=\\s*["']${prop}["'][^>]*>([\\s\\S]*?)<\\/\\1>`, 'gi'),
  );
  return [...matches].map((match) => stripTags(match[2])).filter(Boolean);
}

// Markup between a heading whose text matches `keywords` and the next heading.
function sectionAfterHeading(html, keywords) {
  const headings = [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  for (let i = 0; i < headings.length; i++) {
    if (!keywords.test(stripTags(headings[i][1]))) continue;
    const start = headings[i].index + headings[i][0].length;
    const end = i + 1 < headings.length ? headings[i + 1].index : html.length;
    return html.slice(start, end);
  }
  return null;
}

function listItems(sectionHtml) {
  const list = sectionHtml?.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/i);
  if (!list) return null;
  const items = [...list[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
  return items.length ? items : null;
}

function paragraphTexts(sectionHtml) {
  const items = [...(sectionHtml ?? '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
  return items.length ? items : null;
}

/**
 * Best-effort extraction for pages without JSON-LD. Returns the same shape
 * as mapJsonLdToRecipe, or null when no ingredient list is recognizable —
 * without ingredients an "import" would be an empty form.
 */
export function extractRecipeFromHtml(html) {
  const source = String(html);

  const ingredientLines =
    [microdataValues(source, 'recipeIngredient'), microdataValues(source, 'ingredients')]
      .find((values) => values.length) ??
    listItems(sectionAfterHeading(source, /zutaten|ingredients/i));
  if (!ingredientLines?.length) return null;

  let stepTexts = microdataValues(source, 'recipeInstructions');
  if (!stepTexts.length) {
    const section = sectionAfterHeading(source, /zubereitung|anleitung|instructions|directions|preparation/i);
    stepTexts = listItems(section) ?? paragraphTexts(section) ?? [];
  }

  const title =
    stripTags(source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '') ||
    metaContent(source, 'og:title') ||
    (stripTags(source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').split('|')[0] ?? '').trim();

  const bodyText = stripTags(source.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' '));
  const servingsMatch = bodyText.match(/(\d+)\s*(?:portionen?|personen?|servings?)\b/i);

  return {
    title,
    shortDescription: metaContent(source, 'description') ?? metaContent(source, 'og:description') ?? '',
    servings: servingsMatch ? Number(servingsMatch[1]) : 2,
    preparationTime: 0,
    cookingTime: 0,
    img: parseImage(metaContent(source, 'og:image')),
    ingredients: ingredientLines.map((line) => parseIngredientText(line)).filter((ingredient) => ingredient.name),
    steps: stepTexts.map((instruction, index) => ({ stepNumber: index + 1, instruction })),
  };
}

/**
 * Guard against SSRF: only public http(s) targets may be fetched. Set
 * IMPORT_ALLOW_PRIVATE=1 to bypass (used by the end-to-end tests, which
 * serve their fixture pages from localhost).
 */
export function isAllowedImportUrl(url, { allowPrivate = process.env.IMPORT_ALLOW_PRIVATE === '1' } = {}) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }
  if (allowPrivate) {
    return true;
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return false;
  }
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
    return false;
  }
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    return false;
  }
  return true;
}

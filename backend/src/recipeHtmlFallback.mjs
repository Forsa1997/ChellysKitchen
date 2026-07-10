// Fallback import for pages without schema.org JSON-LD: many older or
// hand-built recipe sites either use schema.org microdata (itemprop
// attributes) or just plain markup with "Zutaten"/"Zubereitung" headings
// followed by lists. This module extracts both shapes with simple,
// dependency-free HTML parsing. The result is best-effort - it only
// prefills the create form, the user reviews everything before saving.

import { parseIngredientText, parseIsoDurationToMinutes } from './recipeImport.mjs';

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', deg: '°',
  frac12: '½', frac14: '¼', frac34: '¾', ndash: '–', mdash: '—', hellip: '…',
};

function decodeEntities(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name] ?? NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function stripTags(fragment) {
  return decodeEntities(String(fragment).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function removeNoise(html) {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function getAttr(openTag, name) {
  const match = openTag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? decodeEntities(match[1]).trim() : undefined;
}

function parseHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//.test(value) ? value : undefined;
}

function parseServingsNumber(text, fallback = 2) {
  const match = String(text ?? '').match(/\d+/);
  const servings = match ? Number(match[0]) : NaN;
  return Number.isFinite(servings) && servings >= 1 ? servings : fallback;
}

function listItems(fragment) {
  return [...String(fragment).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
}

function toSteps(texts) {
  return texts.map((instruction, index) => ({ stepNumber: index + 1, instruction }));
}

// ---------------------------------------------------------------------------
// Strategy 1: schema.org microdata (itemscope/itemprop attributes)
// ---------------------------------------------------------------------------

// Elements whose value lives in an attribute rather than the element body.
const ATTRIBUTE_VALUE_TAGS = { meta: ['content'], img: ['src', 'content'], time: ['datetime', 'content'], link: ['href'], source: ['src'] };

function itempropElements(html, props) {
  const results = [];
  const re = new RegExp(`<([a-z0-9]+)\\b[^>]*\\bitemprop\\s*=\\s*["'](?:${props})["'][^>]*>`, 'gi');
  let match;
  while ((match = re.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const openTag = match[0];
    const attrNames = ATTRIBUTE_VALUE_TAGS[tag];
    if (attrNames) {
      const value = attrNames.map((name) => getAttr(openTag, name)).find(Boolean) ?? '';
      results.push({ openTag, inner: '', value });
      continue;
    }
    const closeIndex = html.indexOf(`</${tag}`, re.lastIndex);
    const inner = closeIndex === -1 ? '' : html.slice(re.lastIndex, closeIndex);
    results.push({ openTag, inner, value: stripTags(inner) });
  }
  return results;
}

function itempropValue(html, props) {
  return itempropElements(html, props)[0]?.value || undefined;
}

function itempropMinutes(html, prop) {
  return parseIsoDurationToMinutes(itempropValue(html, prop));
}

function extractMicrodataRecipe(html) {
  const typeMatch = html.match(/\bitemtype\s*=\s*["'][^"']*schema\.org\/Recipe["']/i);
  if (!typeMatch) return null;
  // Parse from the recipe scope onwards so page-header itemprops (site name,
  // breadcrumbs) don't win over the recipe's own properties.
  const scope = html.slice(typeMatch.index);

  const ingredients = itempropElements(scope, 'recipeIngredient|ingredients')
    .map((element) => parseIngredientText(element.value))
    .filter((ingredient) => ingredient.name);

  const stepTexts = itempropElements(scope, 'recipeInstructions').flatMap((element) => {
    const items = listItems(element.inner);
    return items.length > 0 ? items : element.value ? [element.value] : [];
  });

  if (ingredients.length === 0 && stepTexts.length === 0) return null;

  const prep = itempropMinutes(scope, 'prepTime');
  const cook = itempropMinutes(scope, 'cookTime');
  const total = itempropMinutes(scope, 'totalTime');

  return {
    title: itempropValue(scope, 'name') ?? '',
    shortDescription: itempropValue(scope, 'description') ?? '',
    servings: parseServingsNumber(itempropValue(scope, 'recipeYield')),
    preparationTime: prep ?? 0,
    cookingTime: cook ?? (total !== undefined ? Math.max(total - (prep ?? 0), 0) : 0),
    img: parseHttpUrl(itempropValue(scope, 'image')),
    ingredients,
    steps: toSteps(stepTexts),
  };
}

// ---------------------------------------------------------------------------
// Strategy 2: heuristic parsing via "Zutaten"/"Zubereitung" style headings
// ---------------------------------------------------------------------------

const INGREDIENTS_HEADING = /zutaten|ingredients?/i;
const STEPS_HEADING = /zubereitung|anleitung|arbeitsschritte|so geht|instructions?|directions|preparation|method/i;

function metaContent(html, attribute, name) {
  const re = new RegExp(`<meta\\b[^>]*\\b${attribute}\\s*=\\s*["']${name}["'][^>]*>`, 'i');
  const match = html.match(re);
  return match ? getAttr(match[0], 'content') : undefined;
}

function findHeadings(html) {
  return [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)].map((match) => ({
    text: stripTags(match[2]),
    start: match.index,
    end: match.index + match[0].length,
  }));
}

function sectionAfter(html, headings, index) {
  const from = headings[index].end;
  const to = headings[index + 1]?.start ?? html.length;
  return html.slice(from, to);
}

function firstListItems(section) {
  const match = section.match(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1\s*>/i);
  return match ? listItems(match[2]) : [];
}

function paragraphTexts(section) {
  return [...section.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
}

function extractHeuristicRecipe(html) {
  const headings = findHeadings(html);

  let ingredients = [];
  let stepTexts = [];
  for (const [index, heading] of headings.entries()) {
    if (ingredients.length === 0 && INGREDIENTS_HEADING.test(heading.text)) {
      ingredients = firstListItems(sectionAfter(html, headings, index))
        .map((line) => parseIngredientText(line))
        .filter((ingredient) => ingredient.name);
    } else if (stepTexts.length === 0 && STEPS_HEADING.test(heading.text)) {
      const section = sectionAfter(html, headings, index);
      const items = firstListItems(section);
      stepTexts = items.length > 0 ? items : paragraphTexts(section);
    }
  }

  if (ingredients.length === 0 && stepTexts.length === 0) return null;

  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i);
  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
  const title = metaContent(html, 'property', 'og:title')
    ?? (h1 ? stripTags(h1[1]) : undefined)
    ?? (titleTag ? stripTags(titleTag[1]) : undefined)
    ?? '';

  const servingsMatch = stripTags(html).match(/(\d+)\s*(?:portionen|personen|servings?)\b/i);

  return {
    title,
    shortDescription: metaContent(html, 'name', 'description') ?? metaContent(html, 'property', 'og:description') ?? '',
    servings: servingsMatch ? parseServingsNumber(servingsMatch[1]) : 2,
    preparationTime: 0,
    cookingTime: 0,
    img: parseHttpUrl(metaContent(html, 'property', 'og:image')),
    ingredients,
    steps: toSteps(stepTexts),
  };
}

/**
 * Best-effort recipe extraction from a page without JSON-LD. Tries
 * schema.org microdata first, then heading-based heuristics. Returns the
 * recipe form shape (same as mapJsonLdToRecipe) or null when the page
 * yields neither ingredients nor steps.
 */
export function extractRecipeFromHtml(html) {
  const cleaned = removeNoise(String(html ?? ''));
  return extractMicrodataRecipe(cleaned) ?? extractHeuristicRecipe(cleaned);
}

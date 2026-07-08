// Shared building blocks for the rendered recipe images.
// Every scene is a 1600x1000 SVG composed of photographic layers:
// blurred backdrop with bokeh, textured table, dishware with soft
// shadows, food built from gradients + turbulence displacement,
// then vignette and film grain on top.

export const W = 1600;
export const H = 1000;

// Deterministic RNG so re-running the generator produces identical assets.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let uid = 0;
export const id = (name) => `${name}${++uid}`;

// --- Filters -------------------------------------------------------------

// Organic edges: turbulence-driven displacement roughens vector shapes.
export function displaceFilter(fid, { scale = 12, freq = 0.02, octaves = 3 } = {}) {
  return `<filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
}

export function blurFilter(fid, dev) {
  return `<filter id="${fid}" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="${dev}"/>
  </filter>`;
}

// Rough surface texture (bread crust, sponge cake, oat cream...):
// dark noise speckle composited onto the shape. Darkening preserves the
// shape's hue and saturation, a white overlay would wash it out.
export function textureFilter(fid, { freq = 0.08, octaves = 4, alpha = 0.35 } = {}) {
  const a = (0.6 * alpha).toFixed(3);
  return `<filter id="${fid}" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="11" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${a} ${a} ${a} 0 0" result="dark"/>
    <feComposite in="dark" in2="SourceGraphic" operator="in" result="tex"/>
    <feMerge>
      <feMergeNode in="SourceGraphic"/>
      <feMergeNode in="tex"/>
    </feMerge>
  </filter>`;
}

// Film grain over the whole frame.
export function grainOverlay() {
  const fid = id('grain');
  return `<filter id="${fid}">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.6 0"/>
    </filter>
    <rect width="${W}" height="${H}" filter="url(#${fid})" opacity="0.055" style="mix-blend-mode: overlay"/>`;
}

// --- Environment ---------------------------------------------------------

// Dark blurred kitchen backdrop with warm window light and bokeh discs.
export function backdrop({ top = '#2b2320', bottom = '#191311', lightX = 420, warm = '#f5c98a', bokeh = [] } = {}) {
  const g = id('bg');
  const l = id('light');
  const b = id('bokehBlur');
  const discs = bokeh
    .map(
      ([x, y, r, c, o]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}" filter="url(#${b})"/>`,
    )
    .join('\n');
  return `<defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${top}"/>
        <stop offset="1" stop-color="${bottom}"/>
      </linearGradient>
      <radialGradient id="${l}" cx="${lightX / W}" cy="0.12" r="0.75">
        <stop offset="0" stop-color="${warm}" stop-opacity="0.32"/>
        <stop offset="0.5" stop-color="${warm}" stop-opacity="0.10"/>
        <stop offset="1" stop-color="${warm}" stop-opacity="0"/>
      </radialGradient>
      ${blurFilter(b, 26)}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${g})"/>
    ${discs}
    <rect width="${W}" height="${H}" fill="url(#${l})"/>`;
}

// Wooden table with plank seams, grain noise and a light pool under the dish.
export function woodTable({ y = 470, base = '#6d4a2f', dark = '#4a3120', light = '#8a6240', poolX = 800, poolY = 760, seed = 5 } = {}) {
  const g = id('wood');
  const pool = id('pool');
  const noise = id('woodNoise');
  const r = rng(seed);
  let planks = '';
  const plankH = (H - y) / 5;
  for (let i = 0; i < 5; i++) {
    const py = y + i * plankH;
    const tint = 0.85 + r() * 0.3;
    planks += `<rect x="0" y="${py}" width="${W}" height="${plankH + 1}" fill="${base}" opacity="${tint.toFixed(2)}"/>
      <line x1="0" y1="${py}" x2="${W}" y2="${py}" stroke="${dark}" stroke-width="3" opacity="0.7"/>`;
  }
  return `<defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${light}"/>
        <stop offset="1" stop-color="${dark}"/>
      </linearGradient>
      <radialGradient id="${pool}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffe9c4" stop-opacity="0.30"/>
        <stop offset="1" stop-color="#ffe9c4" stop-opacity="0"/>
      </radialGradient>
      <filter id="${noise}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="turbulence" baseFrequency="0.004 0.09" numOctaves="4" seed="${seed}" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0.4 0 0 0" result="a"/>
        <feComposite in="a" in2="SourceGraphic" operator="in"/>
      </filter>
    </defs>
    <rect x="0" y="${y}" width="${W}" height="${H - y}" fill="url(#${g})"/>
    ${planks}
    <rect x="0" y="${y}" width="${W}" height="${H - y}" filter="url(#${noise})" opacity="0.35"/>
    <ellipse cx="${poolX}" cy="${poolY}" rx="620" ry="240" fill="url(#${pool})"/>`;
}

// Neutral stone/slate table variant.
export function stoneTable({ y = 470, base = '#3d3b3a', light = '#57534f', poolX = 800, poolY = 760 } = {}) {
  const g = id('stone');
  const pool = id('pool');
  const noise = id('stoneNoise');
  return `<defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${light}"/>
        <stop offset="1" stop-color="${base}"/>
      </linearGradient>
      <radialGradient id="${pool}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#fff1d6" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#fff1d6" stop-opacity="0"/>
      </radialGradient>
      <filter id="${noise}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="5" seed="9" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.1  0.7 0.7 0.7 0 0" result="a"/>
        <feComposite in="a" in2="SourceGraphic" operator="in"/>
      </filter>
    </defs>
    <rect x="0" y="${y}" width="${W}" height="${H - y}" fill="url(#${g})"/>
    <rect x="0" y="${y}" width="${W}" height="${H - y}" filter="url(#${noise})" opacity="0.4"/>
    <ellipse cx="${poolX}" cy="${poolY}" rx="620" ry="240" fill="url(#${pool})"/>`;
}

// White ceramic plate with drop shadow, inner well and rim highlight.
export function plate({ cx = 800, cy = 700, rx = 430, ry = 165, tone = '#f4f0e9', rim = '#d9d2c6' } = {}) {
  const g = id('plate');
  const wellG = id('well');
  const sh = id('plateShadow');
  return `<defs>
      <radialGradient id="${g}" cx="0.42" cy="0.35" r="0.75">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.72" stop-color="${tone}"/>
        <stop offset="1" stop-color="${rim}"/>
      </radialGradient>
      <radialGradient id="${wellG}" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stop-color="${tone}"/>
        <stop offset="0.85" stop-color="#e6dfd3"/>
        <stop offset="1" stop-color="#cfc7b9"/>
      </radialGradient>
      ${blurFilter(sh, 22)}
    </defs>
    <ellipse cx="${cx + 18}" cy="${cy + 42}" rx="${rx * 1.02}" ry="${ry * 0.82}" fill="#0a0605" opacity="0.5" filter="url(#${sh})"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${g})"/>
    <ellipse cx="${cx}" cy="${cy - 4}" rx="${rx * 0.78}" ry="${ry * 0.74}" fill="url(#${wellG})"/>
    <ellipse cx="${cx}" cy="${cy - 6}" rx="${rx * 0.76}" ry="${ry * 0.7}" fill="none" stroke="#b9b0a0" stroke-width="2" opacity="0.45"/>
    <path d="M ${cx - rx * 0.85} ${cy - ry * 0.35} A ${rx} ${ry} 0 0 1 ${cx - rx * 0.1} ${cy - ry * 0.98}"
      fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.75"/>`;
}

// Deep ceramic bowl (for soups, porridge, salads).
export function bowl({ cx = 800, cy = 640, rx = 360, ry = 130, depth = 210, glaze = '#e8e2d6', glazeDark = '#b8ae9c', inner = '#ddd5c6' } = {}) {
  const outer = id('bowlOuter');
  const innerG = id('bowlInner');
  const sh = id('bowlShadow');
  return `<defs>
      <linearGradient id="${outer}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${glaze}"/>
        <stop offset="0.55" stop-color="${glaze}"/>
        <stop offset="1" stop-color="${glazeDark}"/>
      </linearGradient>
      <radialGradient id="${innerG}" cx="0.45" cy="0.3" r="0.85">
        <stop offset="0" stop-color="${inner}"/>
        <stop offset="1" stop-color="#9c917d"/>
      </radialGradient>
      ${blurFilter(sh, 24)}
    </defs>
    <ellipse cx="${cx + 14}" cy="${cy + depth * 0.9}" rx="${rx * 0.86}" ry="${ry * 0.5}" fill="#0a0605" opacity="0.55" filter="url(#${sh})"/>
    <path d="M ${cx - rx} ${cy} C ${cx - rx * 0.96} ${cy + depth * 1.3} ${cx + rx * 0.96} ${cy + depth * 1.3} ${cx + rx} ${cy} L ${cx - rx} ${cy} Z" fill="url(#${outer})"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${innerG})"/>
    <ellipse cx="${cx}" cy="${cy + 6}" rx="${rx * 0.92}" ry="${ry * 0.86}" fill="#00000022"/>
    <ellipse cx="${cx - rx * 0.42}" cy="${cy + depth * 0.52}" rx="${rx * 0.22}" ry="${depth * 0.28}" fill="#ffffff" opacity="0.22" filter="url(#${sh})"/>`;
}

// Rising steam: blurred wavy strands.
export function steam(strands, { blur = 13, opacity = 0.16 } = {}) {
  const f = id('steam');
  const paths = strands
    .map(
      ([x, y, h2]) =>
        `<path d="M ${x} ${y} c -26 -${h2 * 0.3} 30 -${h2 * 0.45} 6 -${h2 * 0.7} c -20 -${h2 * 0.22} 22 -${h2 * 0.3} 2 -${h2 * 0.5}"
          fill="none" stroke="#ffffff" stroke-width="30" stroke-linecap="round"/>`,
    )
    .join('\n');
  return `<defs>${blurFilter(f, blur)}</defs>
    <g filter="url(#${f})" opacity="${opacity}">${paths}</g>`;
}

// Darkened corners + gentle top glow to finish the "photo".
export function vignette() {
  const v = id('vig');
  return `<defs>
      <radialGradient id="${v}" cx="0.5" cy="0.46" r="0.72">
        <stop offset="0" stop-color="#000000" stop-opacity="0"/>
        <stop offset="0.72" stop-color="#000000" stop-opacity="0.05"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0.42"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${v})"/>`;
}

// Small occlusion shadow under a piece of food.
export function contactShadow(cx, cy, rx, ry, opacity = 0.4) {
  const f = id('cSh');
  return `<defs>${blurFilter(f, 10)}</defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#140b06" opacity="${opacity}" filter="url(#${f})"/>`;
}

// Glossy specular highlight dot.
export function gloss(cx, cy, rx, ry, rot = 0, opacity = 0.55) {
  const f = id('gl');
  return `<defs>${blurFilter(f, 4)}</defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})"
      fill="#ffffff" opacity="${opacity}" filter="url(#${f})"/>`;
}

// Simple two-leaf herb garnish.
export function herb(x, y, scale = 1, rot = 0, tone = '#3f7d32', toneLight = '#5ea344') {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">
    <path d="M0 0 C -14 -10 -16 -30 -2 -40 C 10 -28 10 -12 0 0 Z" fill="${tone}"/>
    <path d="M0 0 C -10 -8 -12 -26 -2 -34 C 6 -25 6 -10 0 0 Z" fill="${toneLight}" opacity="0.7"/>
    <path d="M-1 -2 C -4 -14 -4 -24 -2 -34" stroke="#2c5c23" stroke-width="1.6" fill="none"/>
  </g>`;
}

export function svgDoc(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;
}

// Standard scene wrapper: backdrop & table come from the scene itself,
// vignette + grain are always applied last.
export function finish(...layers) {
  return svgDoc(layers.join('\n') + vignette() + grainOverlay());
}

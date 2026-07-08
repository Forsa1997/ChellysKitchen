// One scene per bundled recipe. Each returns a complete SVG string.
// The compositions aim for a moody food-photography look: warm key light
// from the upper left, shallow depth of field, textured surfaces.

import {
  W, H, rng, id, finish, backdrop, woodTable, stoneTable, plate, bowl,
  steam, contactShadow, gloss, herb, displaceFilter, blurFilter, textureFilter,
} from './lib.mjs';

const warmBokeh = [
  [220, 160, 70, '#f6c37c', 0.32],
  [1380, 120, 90, '#e8a34e', 0.26],
  [1200, 260, 46, '#f2d8a0', 0.22],
  [420, 90, 40, '#f8e2b8', 0.2],
];

// --- helpers used by several scenes --------------------------------------

function noodleNest({ cx, cy, rx, ry, count, seed, tones, width = 13, shadow = '#8a6420' }) {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const a0 = r() * Math.PI * 2;
    const sx = cx + Math.cos(a0) * rx * (0.2 + r() * 0.75);
    const sy = cy + Math.sin(a0) * ry * (0.2 + r() * 0.75);
    const dx1 = (r() - 0.5) * rx * 1.6;
    const dy1 = (r() - 0.5) * ry * 1.7;
    const dx2 = (r() - 0.5) * rx * 1.6;
    const dy2 = (r() - 0.5) * ry * 1.7;
    const ex = cx + (r() - 0.5) * rx * 1.5;
    const ey = cy + (r() - 0.5) * ry * 1.5;
    const tone = tones[Math.floor(r() * tones.length)];
    out += `<path d="M ${sx.toFixed(0)} ${sy.toFixed(0)} c ${dx1.toFixed(0)} ${dy1.toFixed(0)} ${dx2.toFixed(0)} ${dy2.toFixed(0)} ${(ex - sx).toFixed(0)} ${(ey - sy).toFixed(0)}"
      fill="none" stroke="${shadow}" stroke-width="${width + 3}" stroke-linecap="round" opacity="0.5"/>
      <path d="M ${sx.toFixed(0)} ${sy.toFixed(0)} c ${dx1.toFixed(0)} ${dy1.toFixed(0)} ${dx2.toFixed(0)} ${dy2.toFixed(0)} ${(ex - sx).toFixed(0)} ${(ey - sy).toFixed(0)}"
      fill="none" stroke="${tone}" stroke-width="${width}" stroke-linecap="round"/>`;
  }
  return out;
}

function raspberry(cx, cy, s = 1) {
  const r = rng(cx * 7 + cy);
  let cells = '';
  const g = id('rasp');
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4 - row; col++) {
      const x = cx + (col - (3 - row) / 2) * 10.5 * s;
      const y = cy - 14 * s + row * 10 * s;
      cells += `<circle cx="${x}" cy="${y}" r="${7.6 * s}" fill="url(#${g})"/>
        <circle cx="${x - 2 * s}" cy="${y - 2.5 * s}" r="${2 * s}" fill="#ffb3c2" opacity="${(0.5 + r() * 0.3).toFixed(2)}"/>`;
    }
  }
  return `<defs>
      <radialGradient id="${g}" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0" stop-color="#e8546f"/>
        <stop offset="0.7" stop-color="#c22745"/>
        <stop offset="1" stop-color="#8f1430"/>
      </radialGradient>
    </defs>
    ${contactShadow(cx, cy + 16 * s, 20 * s, 6 * s, 0.35)}
    <path d="M ${cx - 22 * s} ${cy - 12 * s} a ${22 * s} ${24 * s} 0 1 0 ${44 * s} 0 z" fill="#a01b38"/>
    ${cells}`;
}

function blueberry(cx, cy, s = 1) {
  const g = id('blue');
  return `<defs>
      <radialGradient id="${g}" cx="0.35" cy="0.3" r="0.95">
        <stop offset="0" stop-color="#7f92c9"/>
        <stop offset="0.55" stop-color="#3c4a86"/>
        <stop offset="1" stop-color="#232a52"/>
      </radialGradient>
    </defs>
    ${contactShadow(cx, cy + 10 * s, 13 * s, 5 * s, 0.35)}
    <circle cx="${cx}" cy="${cy}" r="${12 * s}" fill="url(#${g})"/>
    <circle cx="${cx - 3 * s}" cy="${cy - 4 * s}" r="${3 * s}" fill="#c6d2f2" opacity="0.7"/>
    <path d="M ${cx - 4 * s} ${cy - 10 * s} l 3 3 l 3 -3 l -3 -2 z" fill="#1a1f3d"/>`;
}

function tomatoHalf(cx, cy, s = 1, rot = 0) {
  const g = id('tom');
  return `<defs>
      <radialGradient id="${g}" cx="0.4" cy="0.35" r="0.85">
        <stop offset="0" stop-color="#f26749"/>
        <stop offset="0.75" stop-color="#d63c25"/>
        <stop offset="1" stop-color="#9c2312"/>
      </radialGradient>
    </defs>
    <g transform="rotate(${rot} ${cx} ${cy})">
    ${contactShadow(cx, cy + 14 * s, 24 * s, 8 * s, 0.4)}
    <circle cx="${cx}" cy="${cy}" r="${21 * s}" fill="url(#${g})"/>
    <circle cx="${cx}" cy="${cy}" r="${16 * s}" fill="#ef8265" opacity="0.85"/>
    <path d="M ${cx - 12 * s} ${cy} a ${12 * s} ${12 * s} 0 0 1 ${24 * s} 0 l ${-5 * s} 0 a ${7 * s} ${7 * s} 0 0 0 ${-14 * s} 0 z" fill="#f9c9a8" opacity="0.85"/>
    <circle cx="${cx}" cy="${cy}" r="${4 * s}" fill="#f6d9b5"/>
    ${gloss(cx - 7 * s, cy - 9 * s, 6 * s, 3.5 * s, -25, 0.65)}
    </g>`;
}

// --- 1. Pasta mit Spinat & Lachs ------------------------------------------

export function pastaSpinatLachs() {
  const disp = id('disp');
  const salmonG = id('salmon');
  const creamG = id('cream');
  const px = 800, py = 660;
  let salmon = '';
  const chunks = [
    [640, 630, 1.6, -12], [920, 600, 1.45, 18], [790, 700, 1.7, 5],
    [990, 680, 1.3, -20], [590, 710, 1.25, 30],
  ];
  for (const [x, y, s, rot] of chunks) {
    salmon += `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#${disp})">
      ${contactShadow(0, 26, 58, 14, 0.42)}
      <path d="M -55 0 q 10 -34 55 -34 q 48 0 58 30 q 4 22 -18 30 q -44 14 -78 0 q -20 -8 -17 -26 z" fill="url(#${salmonG})"/>
      <path d="M -40 -12 q 24 -10 62 -4 M -45 4 q 30 -8 74 -2 M -32 16 q 26 -6 58 -2"
        stroke="#ffd9c4" stroke-width="4" fill="none" opacity="0.8" stroke-linecap="round"/>
      ${gloss(-12, -16, 16, 6, -12, 0.4)}
    </g>`;
  }
  let spinach = '';
  const leaves = [[620, 640, 1.3, -40], [900, 620, 1.2, 15], [720, 740, 1.15, 160], [980, 700, 1.1, 60], [580, 700, 1.05, -110], [850, 680, 1.0, 100], [760, 620, 1.1, -20]];
  for (const [x, y, s, rot] of leaves) {
    spinach += herb(x, y, s * 1.6, rot, '#2e5d26', '#47823a');
  }
  return finish(
    backdrop({ bokeh: warmBokeh }),
    woodTable({ poolX: px, poolY: py + 90 }),
    `<defs>
      ${displaceFilter(disp, { scale: 9, freq: 0.03 })}
      <radialGradient id="${salmonG}" cx="0.4" cy="0.35" r="0.9">
        <stop offset="0" stop-color="#fb9a72"/>
        <stop offset="0.65" stop-color="#ef7a50"/>
        <stop offset="1" stop-color="#c65a34"/>
      </radialGradient>
      <radialGradient id="${creamG}" cx="0.45" cy="0.4" r="0.75">
        <stop offset="0" stop-color="#f7ecd4"/>
        <stop offset="1" stop-color="#dcc9a4"/>
      </radialGradient>
    </defs>`,
    plate({ cx: px, cy: py + 40, rx: 470, ry: 180 }),
    `<ellipse cx="${px}" cy="${py + 30}" rx="340" ry="125" fill="url(#${creamG})" filter="url(#${disp})"/>
     <ellipse cx="${px}" cy="${py + 30}" rx="340" ry="125" fill="none" stroke="#c9ab72" stroke-width="5" opacity="0.5" filter="url(#${disp})"/>`,
    noodleNest({ cx: px, cy: py + 10, rx: 300, ry: 105, count: 95, seed: 21, width: 17, shadow: '#8a6420', tones: ['#eec66f', '#e4b34f', '#f3d489', '#d9a63e'] }),
    spinach,
    salmon,
    `<g opacity="0.9">${Array.from({ length: 26 }, (_, i) => { const r = rng(i * 13 + 5); const x = px - 300 + r() * 600; const y = py - 60 + r() * 160; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + r() * 2.6).toFixed(1)}" fill="${r() > 0.5 ? '#2e5d26' : '#f6f0e0'}" opacity="0.85"/>`; }).join('')}</g>`,
    steam([[660, 470, 300], [830, 440, 340], [960, 480, 260]]),
  );
}

// --- 2. Karottentorte ------------------------------------------------------

export function karottentorte() {
  const disp = id('disp');
  const spongeT = id('spTex');
  const cx = 780, cy = 600;
  const spongeG = id('sponge');
  const frostG = id('frost');
  const sliceW = 460;
  const lx = cx - sliceW / 2, rx2 = cx + sliceW / 2;
  // straight-sided slice, front face towards the camera
  const spongeLayer = (y, h) => `
    <g filter="url(#${spongeT})">
      <path d="M ${lx} ${y} L ${rx2} ${y - 14} q 36 4 38 24 l 0 ${h} q -2 20 -38 26 L ${lx} ${y + h + 12} z" fill="url(#${spongeG})"/>
    </g>
    ${Array.from({ length: 16 }, (_, i) => { const r = rng(i * 7 + y); const x = lx + 16 + r() * (sliceW - 30); const yy = y + 8 + r() * (h - 10); return `<rect x="${x.toFixed(0)}" y="${yy.toFixed(0)}" width="${(6 + r() * 9).toFixed(0)}" height="4" rx="2" fill="#e8762e" opacity="0.9" transform="rotate(${(r() * 60 - 30).toFixed(0)} ${x.toFixed(0)} ${yy.toFixed(0)})"/>`; }).join('')}
    ${Array.from({ length: 10 }, (_, i) => { const r = rng(i * 13 + y * 2); const x = lx + 16 + r() * (sliceW - 30); const yy = y + 8 + r() * (h - 10); return `<circle cx="${x.toFixed(0)}" cy="${yy.toFixed(0)}" r="${(2 + r() * 2.4).toFixed(1)}" fill="#6b3d16"/>`; }).join('')}`;
  const creamBand = (y, h) => `
    <path d="M ${lx} ${y} L ${rx2} ${y - 14} q 36 4 38 24 l 0 ${h - 14} q -2 16 -38 20 L ${lx} ${y + h + 6} z"
      fill="url(#${frostG})" filter="url(#${disp})"/>`;
  return finish(
    backdrop({ top: '#33251c', bottom: '#1a120c', bokeh: warmBokeh }),
    woodTable({ base: '#7a5535', poolX: cx, poolY: 760 }),
    `<defs>
      ${displaceFilter(disp, { scale: 5, freq: 0.04 })}
      ${textureFilter(spongeT, { freq: 0.14, octaves: 4, alpha: 0.4 })}
      <linearGradient id="${spongeG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b5732f"/>
        <stop offset="1" stop-color="#7e491c"/>
      </linearGradient>
      <linearGradient id="${frostG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffdf7"/>
        <stop offset="1" stop-color="#e6d9bd"/>
      </linearGradient>
    </defs>`,
    plate({ cx, cy: cy + 200, rx: 430, ry: 158, tone: '#f1ece2' }),
    contactShadow(cx + 10, cy + 218, 280, 40, 0.45),
    // slice: sponge / cream / sponge / cream / thick top frosting
    spongeLayer(cy + 128, 58),
    creamBand(cy + 96, 36),
    spongeLayer(cy + 34, 58),
    creamBand(cy + 2, 36),
    `<path d="M ${lx - 6} ${cy - 44} L ${rx2 + 4} ${cy - 60} q 40 6 42 28 l 0 22 q -2 18 -40 24 L ${lx - 6} ${cy + 4} z"
      fill="url(#${frostG})" filter="url(#${disp})"/>
     <path d="M ${lx + 30} ${cy - 30} q 60 -14 130 -10 M ${lx + 210} ${cy - 44} q 70 -6 150 0" stroke="#d8c9a8" stroke-width="6" fill="none" opacity="0.8" stroke-linecap="round"/>`,
    gloss(cx - 80, cy - 40, 110, 12, -4, 0.3),
    // marzipan carrot on top
    `<g transform="translate(${cx - 60} ${cy - 68}) rotate(10)">
      ${contactShadow(46, 22, 50, 9, 0.3)}
      <path d="M0 0 q 48 -10 92 6 q 10 10 0 18 q -46 12 -92 -2 q -10 -12 0 -22 z" fill="#e8762e"/>
      <path d="M8 5 q 36 -5 66 4 M 12 14 q 30 3 58 4" stroke="#b6521a" stroke-width="3.4" fill="none" opacity="0.75"/>
      ${gloss(30, 4, 16, 4, -8, 0.5)}
      <path d="M -2 10 q -24 -16 -38 -5 q 11 7 20 7 q -18 4 -25 13 q 16 5 29 -2 z" fill="#4c8631"/>
    </g>`,
    // walnut pieces + crumbs on the plate
    `${[[cx - 290, cy + 190], [cx + 250, cy + 170], [cx + 320, cy + 210]].map(([x, y]) => `
      ${contactShadow(x, y + 10, 20, 6, 0.3)}
      <circle cx="${x}" cy="${y}" r="15" fill="#a5713c"/>
      <path d="M ${x - 8} ${y - 5} q 4 7 0 12 M ${x} ${y - 8} q 4 8 0 15 M ${x + 8} ${y - 5} q 3 7 0 11" stroke="#6e441c" stroke-width="2.6" fill="none"/>`).join('')}`,
    `${Array.from({ length: 16 }, (_, i) => { const r = rng(i * 31 + 3); const x = cx - 300 + r() * 600; const y = cy + 200 + r() * 50; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2.4 + r() * 3.4).toFixed(1)}" fill="${r() > 0.5 ? '#8d5423' : '#c07b3a'}"/>`; }).join('')}`,
  );
}

// --- 3. BBQ Rippchen -------------------------------------------------------

export function bbqRippchen() {
  const disp = id('disp');
  const meatT = id('meatTex');
  const glazeG = id('glaze');
  const boneG = id('bone');
  const cx = 800, cy = 640;
  const rackW = 940, rackH = 240;
  const left = cx - rackW / 2;
  // one horizontal rack, slightly tilted, rib ridges running vertically
  let ridges = '';
  for (let i = 0; i < 8; i++) {
    const x = left + 60 + i * ((rackW - 120) / 7);
    ridges += `
      <path d="M ${x - 34} ${cy - rackH / 2 + 26} q 34 -14 68 0 l -4 ${rackH - 44} q -30 12 -60 0 z"
        fill="url(#${glazeG})" filter="url(#${disp})"/>
      <ellipse cx="${x}" cy="${cy - rackH / 2 + 18}" rx="19" ry="12" fill="url(#${boneG})"/>
      <ellipse cx="${x - 3}" cy="${cy - rackH / 2 + 15}" rx="8" ry="4.5" fill="#fdf7e8" opacity="0.85"/>
      ${gloss(x - 8, cy - rackH / 2 + 78, 13, 42, 3, 0.34)}
      ${gloss(x + 6, cy + 30, 8, 26, -4, 0.2)}`;
  }
  return finish(
    backdrop({ top: '#241a16', bottom: '#120c0a', bokeh: [[260, 140, 80, '#f08c3a', 0.3], [1340, 180, 70, '#e2622a', 0.24], [1180, 90, 44, '#ffbe7a', 0.2]] }),
    woodTable({ y: 460, base: '#4c3826', dark: '#332417', light: '#5f4730', poolX: cx, poolY: 760 }),
    `<defs>
      ${displaceFilter(disp, { scale: 10, freq: 0.02 })}
      ${textureFilter(meatT, { freq: 0.05, octaves: 4, alpha: 0.3 })}
      <linearGradient id="${glazeG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b8481f"/>
        <stop offset="0.45" stop-color="#8e2c12"/>
        <stop offset="1" stop-color="#571708"/>
      </linearGradient>
      <linearGradient id="${boneG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f3e8d4"/>
        <stop offset="1" stop-color="#cbb58f"/>
      </linearGradient>
    </defs>`,
    // dark wooden serving board
    contactShadow(cx, cy + 210, 560, 66, 0.55),
    `<rect x="${cx - 590}" y="${cy - 10}" width="1180" height="196" rx="30" fill="#2c1a0c"/>
     <rect x="${cx - 590}" y="${cy - 22}" width="1180" height="190" rx="30" fill="#462b14"/>
     <rect x="${cx - 590}" y="${cy - 22}" width="1180" height="190" rx="30" fill="none" stroke="#5c3c1e" stroke-width="5" opacity="0.6"/>`,
    // rack of ribs lying on the board
    `<g transform="rotate(-3 ${cx} ${cy})">
      ${contactShadow(cx, cy + rackH / 2 + 4, rackW * 0.5, 34, 0.5)}
      <path d="M ${left} ${cy - rackH / 2 + 30} q ${rackW / 2} -44 ${rackW} 0 q 18 ${rackH / 2 - 20} -6 ${rackH - 40} q -${rackW / 2 - 20} 34 -${rackW - 28} 0 q -24 -${rackH / 2 - 26} -6 -${rackH - 40} z"
        fill="url(#${glazeG})" filter="url(#${meatT})"/>
      ${ridges}
      <path d="M ${left + 30} ${cy + rackH / 2 - 26} q ${rackW / 2 - 30} 30 ${rackW - 70} 2" stroke="#3c0f05" stroke-width="10" fill="none" opacity="0.55"/>
      ${gloss(cx - 190, cy - rackH / 2 + 46, 180, 16, -3, 0.3)}
      ${[[left + 130, cy + 60], [cx + 40, cy + 90], [cx + 300, cy + 40], [left + 320, cy - 20]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="8" fill="#2a0d06" opacity="0.75" filter="url(#${disp})"/>`).join('')}
    </g>`,
    // sauce pool + brush on the board
    `<path d="M ${cx - 380} ${cy + 128} q 220 -20 520 -4 q 110 6 160 18 q -220 20 -520 10 q -120 -4 -160 -24 z" fill="#5c150c" opacity="0.75" filter="url(#${disp})"/>`,
    `${Array.from({ length: 20 }, (_, i) => { const r = rng(i * 17 + 9); const x = cx - 400 + r() * 800; const y = cy + 100 + r() * 60; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + r() * 3).toFixed(1)}" fill="${r() > 0.4 ? '#2a0d06' : '#c97a2c'}"/>`; }).join('')}`,
    herb(cx + 480, cy + 120, 1.6, 24, '#375f2b', '#4f8038'),
    herb(cx - 500, cy + 140, 1.3, -140, '#375f2b', '#4f8038'),
    steam([[620, 470, 300], [810, 440, 360], [990, 480, 280]], { opacity: 0.2 }),
  );
}

// --- 4. Zitronen-Hähnchen vom Blech ---------------------------------------

export function zitronenHaehnchen() {
  const disp = id('disp');
  const skinG = id('skin');
  const skinT = id('skinTex');
  const lemG = id('lem');
  const potG = id('pot');
  const boneEnd = id('boneEnd');
  const cx = 800, cy = 560;
  const chicken = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#${disp})">
      ${contactShadow(0, 62, 120, 32, 0.5)}
      <path d="M -120 0 q 8 -70 80 -82 q 86 -14 138 30 q 30 26 16 66 q -16 50 -104 54 q -104 6 -124 -38 q -8 -16 -6 -30 z"
        fill="url(#${skinG})" filter="url(#${skinT})"/>
      <path d="M -90 -40 q 56 -30 148 -6 M -100 -6 q 70 -22 190 -4" stroke="#7e3f12" stroke-width="8" fill="none" opacity="0.5"/>
      <path d="M -120 0 q 8 -70 80 -82 q 40 -6 74 2" stroke="#f6cf8a" stroke-width="9" fill="none" opacity="0.65" stroke-linecap="round"/>
      ${gloss(-28, -36, 40, 15, -14, 0.55)}
      ${gloss(46, 8, 22, 9, 12, 0.4)}
      <rect x="96" y="-14" width="52" height="20" rx="10" fill="url(#${boneEnd})"/>
    </g>`;
  const lemon = (x, y, s, rot) => `<g transform="rotate(${rot} ${x} ${y})">
      ${contactShadow(x, y + 12 * s, 30 * s, 9 * s, 0.4)}
      <circle cx="${x}" cy="${y}" r="${30 * s}" fill="#e9c235"/>
      <circle cx="${x}" cy="${y}" r="${25 * s}" fill="#f8e28a"/>
      ${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M ${x} ${y} L ${x + Math.cos(a) * 23 * s} ${y + Math.sin(a) * 23 * s}" stroke="#e9c235" stroke-width="${2.4 * s}"/>`; }).join('')}
      <circle cx="${x}" cy="${y}" r="${4 * s}" fill="#e9c235"/>
      ${gloss(x - 8 * s, y - 9 * s, 8 * s, 4 * s, -20, 0.5)}
    </g>`;
  const potato = (x, y, s, rot) => `<g transform="rotate(${rot} ${x} ${y})" filter="url(#${disp})">
      ${contactShadow(x, y + 18 * s, 34 * s, 10 * s, 0.42)}
      <path d="M ${x - 32 * s} ${y} q 2 -26 32 -26 q 32 0 34 24 q 2 24 -32 26 q -32 2 -34 -24 z" fill="url(#${potG})"/>
      <path d="M ${x - 20 * s} ${y - 14 * s} q 20 -8 40 -2" stroke="#8a5a22" stroke-width="4" fill="none" opacity="0.6"/>
      ${gloss(x - 8 * s, y - 10 * s, 12 * s, 5 * s, -10, 0.4)}
    </g>`;
  return finish(
    backdrop({ bokeh: warmBokeh }),
    woodTable({ poolX: cx, poolY: 700 }),
    `<defs>
      ${displaceFilter(disp, { scale: 10, freq: 0.024 })}
      ${textureFilter(skinT, { freq: 0.11, octaves: 5, alpha: 0.4 })}
      <radialGradient id="${skinG}" cx="0.4" cy="0.3" r="0.95">
        <stop offset="0" stop-color="#e9a34e"/>
        <stop offset="0.6" stop-color="#c97a28"/>
        <stop offset="1" stop-color="#93511a"/>
      </radialGradient>
      <radialGradient id="${lemG}" cx="0.4" cy="0.35" r="0.9">
        <stop offset="0" stop-color="#f8e28a"/>
        <stop offset="1" stop-color="#e9c235"/>
      </radialGradient>
      <linearGradient id="${potG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e9b96a"/>
        <stop offset="1" stop-color="#b98338"/>
      </linearGradient>
      <linearGradient id="${boneEnd}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#d9b988"/>
        <stop offset="1" stop-color="#f6ecd6"/>
      </linearGradient>
    </defs>`,
    // sheet pan, slightly angled
    contactShadow(cx, cy + 320, 600, 70, 0.5),
    `<rect x="${cx - 620}" y="${cy - 160}" width="1240" height="470" rx="34" fill="#33302c"/>
     <rect x="${cx - 596}" y="${cy - 138}" width="1192" height="424" rx="24" fill="#4a443d"/>
     <rect x="${cx - 596}" y="${cy - 138}" width="1192" height="424" rx="24" fill="none" stroke="#5f5850" stroke-width="5" opacity="0.7"/>
     ${gloss(cx - 380, cy - 120, 240, 20, -3, 0.15)}`,
    // roasting juices
    `<ellipse cx="${cx}" cy="${cy + 90}" rx="520" ry="160" fill="#7a4d14" opacity="0.6" filter="url(#${disp})"/>
     ${gloss(cx + 150, cy + 140, 160, 30, -4, 0.12)}`,
    potato(cx - 440, cy - 30, 1.7, 10), potato(cx - 360, cy + 130, 1.5, -30), potato(cx + 430, cy - 20, 1.65, 40),
    potato(cx + 360, cy + 170, 1.55, 80), potato(cx - 80, cy + 220, 1.45, -15), potato(cx + 140, cy - 100, 1.4, 25),
    potato(cx - 250, cy - 110, 1.35, 55), potato(cx + 260, cy + 240, 1.4, -70),
    chicken(cx - 200, cy + 30, 1.35, -8),
    chicken(cx + 190, cy + 70, 1.45, 5),
    lemon(cx - 340, cy + 200, 1.5, 0), lemon(cx + 30, cy - 70, 1.35, 0), lemon(cx + 450, cy + 130, 1.45, 0),
    lemon(cx - 130, cy + 120, 1.25, 0),
    herb(cx - 30, cy + 150, 1.7, -60, '#38622c', '#548a3c'),
    herb(cx + 280, cy - 60, 1.5, 120, '#38622c', '#548a3c'),
    herb(cx - 470, cy + 90, 1.4, 30, '#38622c', '#548a3c'),
    steam([[600, 350, 260], [820, 330, 300], [1030, 360, 240]]),
  );
}

// --- 5. Linsen-Kokos-Suppe -------------------------------------------------

export function linsenKokosSuppe() {
  const disp = id('disp');
  const soupG = id('soup');
  const cx = 800, cy = 600;
  return finish(
    backdrop({ top: '#2c211a', bottom: '#170f0b', bokeh: warmBokeh }),
    woodTable({ base: '#6a4527', poolX: cx, poolY: 770 }),
    `<defs>
      ${displaceFilter(disp, { scale: 8, freq: 0.03 })}
      <radialGradient id="${soupG}" cx="0.45" cy="0.35" r="0.8">
        <stop offset="0" stop-color="#eb9a3c"/>
        <stop offset="0.7" stop-color="#d97e22"/>
        <stop offset="1" stop-color="#a85812"/>
      </radialGradient>
    </defs>`,
    bowl({ cx, cy, rx: 390, ry: 140, depth: 230, glaze: '#5a6d5c', glazeDark: '#32403a', inner: '#d9d2c2' }),
    // soup surface
    `<ellipse cx="${cx}" cy="${cy + 8}" rx="352" ry="118" fill="url(#${soupG})" filter="url(#${disp})"/>`,
    // red lentils texture near the surface
    `${Array.from({ length: 60 }, (_, i) => { const r = rng(i * 7 + 2); const a = r() * Math.PI * 2; const rad = Math.sqrt(r()); const x = cx + Math.cos(a) * 330 * rad; const y = cy + 8 + Math.sin(a) * 100 * rad; return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(4 + r() * 3).toFixed(1)}" ry="${(2.5 + r() * 2).toFixed(1)}" fill="#c26a14" opacity="${(0.4 + r() * 0.4).toFixed(2)}"/>`; }).join('')}`,
    // coconut cream spiral
    `<path d="M ${cx - 10} ${cy + 12} q 50 -16 92 4 q 36 20 -6 34 q -70 22 -150 0 q -74 -22 -16 -50 q 90 -40 210 -14 q 96 22 34 58"
      stroke="#f7f1e2" stroke-width="17" fill="none" stroke-linecap="round" opacity="0.95" filter="url(#${disp})"/>
     <path d="M ${cx - 6} ${cy + 14} q 44 -12 80 4" stroke="#fffbef" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.8"/>`,
    gloss(cx - 130, cy - 30, 110, 26, -8, 0.22),
    herb(cx + 130, cy + 30, 1.3, 25, '#3a7028', '#57963c'),
    herb(cx + 90, cy + 60, 1.0, -60, '#3a7028', '#57963c'),
    // chili flakes
    `${Array.from({ length: 14 }, (_, i) => { const r = rng(i * 11 + 8); const x = cx - 200 + r() * 420; const y = cy - 30 + r() * 110; return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(4 + r() * 4).toFixed(1)}" height="${(2.4 + r() * 2).toFixed(1)}" rx="1" fill="#a3230f" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`; }).join('')}`,
    // spoon resting on the table
    `<g transform="rotate(18 1210 800)">
      ${contactShadow(1210, 830, 150, 22, 0.4)}
      <rect x="1150" y="786" width="300" height="22" rx="11" fill="#8a6a4a"/>
      <ellipse cx="1116" cy="797" rx="64" ry="40" fill="#96755305"/>
      <ellipse cx="1116" cy="797" rx="62" ry="38" fill="#a07d58"/>
      <ellipse cx="1108" cy="790" rx="40" ry="22" fill="#7c5c3c"/>
    </g>`,
    steam([[660, 420, 300], [820, 390, 350], [950, 430, 260]], { opacity: 0.2 }),
  );
}

// --- 6. Couscous-Salat -----------------------------------------------------

export function couscousSalat() {
  const cx = 800, cy = 600;
  const disp = id('disp');
  const fetaG = id('feta');
  const grains = Array.from({ length: 420 }, (_, i) => {
    const r = rng(i * 3 + 1);
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const x = cx + Math.cos(a) * 340 * rad;
    const y = cy + Math.sin(a) * 112 * rad - 8;
    const tones = ['#f0d492', '#e6c377', '#f7e3ae', '#dcb35f'];
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(3 + r() * 3.4).toFixed(1)}" fill="${tones[Math.floor(r() * 4)]}"/>`;
  }).join('');
  const cucumber = (x, y, s, rot) => `<g transform="rotate(${rot} ${x} ${y})">
      <circle cx="${x}" cy="${y}" r="${19 * s}" fill="#8fb944"/>
      <circle cx="${x}" cy="${y}" r="${15 * s}" fill="#d8ecab"/>
      <circle cx="${x}" cy="${y}" r="${6 * s}" fill="#eef7d8"/>
      ${gloss(x - 5 * s, y - 6 * s, 6 * s, 3 * s, -15, 0.5)}
    </g>`;
  const feta = (x, y, s, rot) => `<g transform="rotate(${rot} ${x} ${y})">
      ${contactShadow(x, y + 14 * s, 22 * s, 7 * s, 0.32)}
      <rect x="${x - 18 * s}" y="${y - 15 * s}" width="${36 * s}" height="${30 * s}" rx="4" fill="url(#${fetaG})"/>
      ${gloss(x - 6 * s, y - 8 * s, 8 * s, 4 * s, -10, 0.5)}
    </g>`;
  return finish(
    backdrop({ top: '#31261d', bottom: '#1b130d', bokeh: warmBokeh }),
    woodTable({ base: '#77502e', poolX: cx, poolY: 760 }),
    `<defs>
      ${displaceFilter(disp, { scale: 8, freq: 0.03 })}
      <linearGradient id="${fetaG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fdfbf4"/>
        <stop offset="1" stop-color="#e3dcc8"/>
      </linearGradient>
    </defs>`,
    bowl({ cx, cy, rx: 380, ry: 135, depth: 220, glaze: '#c9d5dd', glazeDark: '#8fa2ad', inner: '#e7e1d2' }),
    `<ellipse cx="${cx}" cy="${cy}" rx="345" ry="112" fill="#e2c983" filter="url(#${disp})"/>`,
    grains,
    tomatoHalf(cx - 190, cy - 20, 1.25, -15), tomatoHalf(cx + 130, cy + 34, 1.15, 20), tomatoHalf(cx + 240, cy - 34, 1.0, 65),
    cucumber(cx - 40, cy + 48, 1.2, 0), cucumber(cx - 300, cy + 24, 1.0, 0), cucumber(cx + 40, cy - 58, 1.05, 0),
    feta(cx - 120, cy - 50, 1.1, -8), feta(cx + 210, cy + 60, 1.2, 14), feta(cx - 230, cy + 70, 1.0, 22),
    // red onion slivers
    `${[[cx - 60, cy - 6, 24], [cx + 110, cy - 40, -30], [cx - 260, cy - 30, 60]].map(([x, y, rot]) => `<path d="M ${x} ${y} a 26 26 0 0 1 44 10" stroke="#a34a7c" stroke-width="6" fill="none" stroke-linecap="round" transform="rotate(${rot} ${x} ${y})"/>`).join('')}`,
    herb(cx + 60, cy + 20, 1.35, 40, '#3f7d32', '#63a24a'),
    herb(cx - 160, cy + 40, 1.2, -30, '#3f7d32', '#63a24a'),
    herb(cx + 300, cy + 10, 1.05, 140, '#3f7d32', '#63a24a'),
    // lemon wedge in the salad
    `<g transform="translate(${cx + 250} ${cy - 55}) rotate(-14)">
      ${contactShadow(0, 14, 44, 10, 0.3)}
      <path d="M -46 0 a 46 46 0 0 1 92 0 z" fill="#f2d258"/>
      <path d="M -38 -2 a 38 38 0 0 1 76 0 z" fill="#f9e88f"/>
      <path d="M -30 -4 a 30 30 0 0 1 60 0" stroke="#f2d258" stroke-width="3" fill="none"/>
      ${gloss(-10, -14, 12, 5, -12, 0.5)}
    </g>`,
  );
}

// --- 7. Schoko-Himbeer-Brownies ---------------------------------------------

export function schokoBrownies() {
  const disp = id('disp');
  const brT = id('brTex');
  const brG = id('brownie');
  const topG = id('crackle');
  const cx = 800, cy = 620;
  const brownie = (x, y, w, h, rot) => `<g transform="rotate(${rot} ${x} ${y})">
      ${contactShadow(x, y + h * 0.62, w * 0.62, 20, 0.5)}
      <path d="M ${x - w / 2} ${y - h / 2 + 12} l ${w} -10 l 4 ${h} l -${w} 8 z" fill="url(#${brG})" filter="url(#${brT})"/>
      <path d="M ${x - w / 2} ${y - h / 2 + 12} l ${w} -10 l 2 22 q -${w * 0.5} 16 -${w} 10 z" fill="url(#${topG})" filter="url(#${disp})"/>
      ${gloss(x - w * 0.2, y - h * 0.32, w * 0.22, 7, -5, 0.25)}
    </g>`;
  return finish(
    backdrop({ top: '#221a18', bottom: '#100b0a', bokeh: [[280, 130, 66, '#e8a34e', 0.25], [1330, 160, 84, '#c96a4e', 0.22], [1150, 70, 40, '#f2d8a0', 0.18]] }),
    stoneTable({ y: 490, base: '#2c2927', light: '#403c39', poolX: cx, poolY: 790 }),
    `<defs>
      ${displaceFilter(disp, { scale: 10, freq: 0.05 })}
      ${textureFilter(brT, { freq: 0.14, octaves: 5, alpha: 0.35 })}
      <linearGradient id="${brG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4a2a17"/>
        <stop offset="1" stop-color="#2a150a"/>
      </linearGradient>
      <linearGradient id="${topG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7a4a2c"/>
        <stop offset="1" stop-color="#57301a"/>
      </linearGradient>
    </defs>`,
    // parchment paper
    `${contactShadow(cx, cy + 220, 460, 54, 0.45)}
     <path d="M ${cx - 470} ${cy + 60} q 470 -44 940 0 q 26 84 -8 148 q -462 40 -924 0 q -34 -64 -8 -148 z" fill="#cbbc9d" filter="url(#${disp})"/>
     ${gloss(cx - 200, cy + 90, 200, 24, -2, 0.18)}`,
    // stacked brownies
    brownie(cx + 130, cy + 130, 300, 130, 3),
    brownie(cx - 190, cy + 110, 300, 135, -4),
    brownie(cx - 40, cy - 10, 310, 140, 2),
    // chocolate drizzle
    `<path d="M ${cx - 190} ${cy - 60} q 120 -18 300 -4 M ${cx - 160} ${cy - 30} q 100 -14 260 -2 M ${cx - 120} ${cy + 40} q 90 -10 220 0"
      stroke="#1c0d05" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.85" filter="url(#${disp})"/>`,
    raspberry(cx - 110, cy - 60, 1.35), raspberry(cx + 60, cy - 46, 1.2), raspberry(cx + 260, cy + 60, 1.4),
    raspberry(cx - 330, cy + 100, 1.25), raspberry(cx - 30, cy + 190, 1.15),
    blueberry(cx + 170, cy + 170, 1.2), blueberry(cx - 240, cy + 190, 1.1),
    herb(cx + 320, cy + 30, 1.15, 130, '#2f6a2a', '#4d9440'),
    // powdered sugar dust
    `${Array.from({ length: 90 }, (_, i) => { const r = rng(i * 5 + 4); const x = cx - 400 + r() * 800; const y = cy - 110 + r() * 320; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + r() * 1.8).toFixed(1)}" fill="#fffef8" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`; }).join('')}`,
  );
}

// --- 8. Gemüse-Lasagne -------------------------------------------------------

export function gemueseLasagne() {
  const disp = id('disp');
  const cheeseG = id('cheese');
  const ragoutG = id('ragout');
  const pastaG = id('pastaL');
  const cx = 790, cy = 600;
  const w = 430, lh = 46;
  const layer = (y, fill, f) => `
    <path d="M ${cx - w / 2} ${y} l ${w} -22 l 34 14 l 0 ${lh} l -${w} 24 l -34 -16 z" fill="${fill}" ${f ? `filter="url(#${f})"` : ''}/>`;
  return finish(
    backdrop({ bokeh: warmBokeh }),
    woodTable({ poolX: cx, poolY: 760 }),
    `<defs>
      ${displaceFilter(disp, { scale: 9, freq: 0.03 })}
      <linearGradient id="${cheeseG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f2c168"/>
        <stop offset="0.5" stop-color="#e8a83e"/>
        <stop offset="1" stop-color="#c47d20"/>
      </linearGradient>
      <linearGradient id="${ragoutG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c8451f"/>
        <stop offset="1" stop-color="#8e2a10"/>
      </linearGradient>
      <linearGradient id="${pastaG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f3dfae"/>
        <stop offset="1" stop-color="#ddba79"/>
      </linearGradient>
    </defs>`,
    plate({ cx, cy: cy + 210, rx: 440, ry: 165 }),
    // tomato sauce pool
    `<ellipse cx="${cx + 10}" cy="${cy + 220}" rx="300" ry="86" fill="url(#${ragoutG})" opacity="0.85" filter="url(#${disp})"/>`,
    contactShadow(cx, cy + 235, 300, 46, 0.42),
    // lasagna stack: pasta / ragout / pasta / ragout / cheese top
    layer(cy + 150, `url(#${pastaG})`),
    layer(cy + 112, `url(#${ragoutG})`, disp),
    // zucchini + pepper bits poking out of ragout layers
    `${[[cx - 150, cy + 122], [cx + 60, cy + 106], [cx + 170, cy + 118]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#6f9c37"/><circle cx="${x + 26}" cy="${y + 6}" r="7" fill="#e2b23a"/>`).join('')}`,
    layer(cy + 74, `url(#${pastaG})`),
    layer(cy + 36, `url(#${ragoutG})`, disp),
    `${[[cx - 100, cy + 46], [cx + 120, cy + 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#6f9c37"/><circle cx="${x - 30}" cy="${y + 4}" r="7" fill="#d8483a"/>`).join('')}`,
    layer(cy - 2, `url(#${pastaG})`),
    // molten cheese top with browned spots and drips
    `<path d="M ${cx - w / 2 - 6} ${cy - 4} l ${w + 12} -24 l 40 16 q 8 20 -4 30 q -30 22 -70 26 q 6 26 -12 28 q -16 2 -18 -22 q -60 10 -120 6 q 4 30 -14 30 q -16 0 -16 -28 q -70 -6 -110 -22 q -14 -10 -8 -26 z"
      fill="url(#${cheeseG})" filter="url(#${disp})"/>`,
    `${[[cx - 130, cy - 12, 16], [cx + 30, cy - 22, 20], [cx + 150, cy - 8, 13]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.55}" fill="#a05c14" opacity="0.7" filter="url(#${disp})"/>`).join('')}`,
    gloss(cx - 60, cy - 20, 110, 16, -6, 0.3),
    herb(cx + 130, cy - 30, 1.5, 30, '#2f6a2a', '#4d9440'),
    herb(cx - 210, cy + 6, 1.2, -50, '#2f6a2a', '#4d9440'),
    steam([[640, 400, 300], [800, 370, 340], [950, 410, 260]]),
  );
}

// --- 9. Asia-Nudelpfanne -----------------------------------------------------

export function asiaNudelpfanne() {
  const disp = id('disp');
  const wokG = id('wok');
  const cx = 800, cy = 600;
  const pepper = (x, y, rot, col, hi) => `<g transform="rotate(${rot} ${x} ${y})">
      <path d="M ${x - 40} ${y} q 40 -18 84 -4 q 8 8 -2 14 q -42 12 -82 2 q -8 -6 0 -12 z" fill="${col}"/>
      ${gloss(x - 4, y - 3, 22, 5, -4, 0.45)}
      <path d="M ${x - 30} ${y + 2} q 30 -8 62 -2" stroke="${hi}" stroke-width="3" fill="none" opacity="0.7"/>
    </g>`;
  const broccoli = (x, y, s) => `<g>
      ${contactShadow(x, y + 22 * s, 34 * s, 10 * s, 0.4)}
      <rect x="${x - 7 * s}" y="${y}" width="${14 * s}" height="${26 * s}" rx="6" fill="#a9c98a"/>
      ${[[-20, -10, 19], [2, -22, 22], [22, -8, 18], [-2, -2, 16]].map(([dx, dy, r]) => `<circle cx="${x + dx * s}" cy="${y + dy * s}" r="${r * s}" fill="#3c6e2b"/>`).join('')}
      ${[[-20, -10, 19], [2, -22, 22], [22, -8, 18]].map(([dx, dy, r]) => `<circle cx="${x + dx * s - 4}" cy="${y + dy * s - 4}" r="${r * 0.6 * s}" fill="#548a3c" opacity="0.8"/>`).join('')}
    </g>`;
  return finish(
    backdrop({ top: '#251d19', bottom: '#120d0b', bokeh: [[240, 150, 72, '#f0a04e', 0.28], [1360, 130, 88, '#e2622a', 0.22], [1150, 240, 44, '#ffd89a', 0.18]] }),
    woodTable({ base: '#5c3d24', dark: '#3c2715', poolX: cx, poolY: 780 }),
    `<defs>
      ${displaceFilter(disp, { scale: 9, freq: 0.028 })}
      <radialGradient id="${wokG}" cx="0.45" cy="0.3" r="0.9">
        <stop offset="0" stop-color="#4a4643"/>
        <stop offset="0.75" stop-color="#2b2826"/>
        <stop offset="1" stop-color="#151312"/>
      </radialGradient>
    </defs>`,
    // wok pan with handles
    contactShadow(cx, cy + 230, 520, 66, 0.55),
    `<rect x="${cx - 660}" y="${cy + 20}" width="220" height="36" rx="18" fill="#3a3633" transform="rotate(6 ${cx - 660} ${cy + 20})"/>
     <rect x="${cx + 440}" y="${cy + 44}" width="220" height="36" rx="18" fill="#3a3633" transform="rotate(-6 ${cx + 660} ${cy + 44})"/>
     <ellipse cx="${cx}" cy="${cy + 40}" rx="470" ry="190" fill="url(#${wokG})"/>
     <ellipse cx="${cx}" cy="${cy + 20}" rx="440" ry="168" fill="#1c1a18"/>
     <path d="M ${cx - 430} ${cy - 10} A 470 190 0 0 1 ${cx - 80} ${cy - 118}" stroke="#6b6560" stroke-width="8" fill="none" opacity="0.5"/>`,
    // noodles
    noodleNest({ cx, cy: cy + 10, rx: 330, ry: 118, count: 54, seed: 33, width: 12, shadow: '#7a5210', tones: ['#eec96a', '#f5d98c', '#e0b34f', '#f9e3a6'] }),
    pepper(cx - 190, cy - 30, -18, '#c2321c', '#e8654a'), pepper(cx + 90, cy + 60, 12, '#c2321c', '#e8654a'),
    pepper(cx + 200, cy - 40, 40, '#e2892a', '#f7b45e'), pepper(cx - 60, cy + 100, -8, '#e2892a', '#f7b45e'),
    broccoli(cx - 280, cy + 50, 1.25), broccoli(cx + 240, cy + 70, 1.1), broccoli(cx + 20, cy - 70, 1.15),
    // spring onion rings + sesame
    `${Array.from({ length: 16 }, (_, i) => { const r = rng(i * 19 + 6); const x = cx - 280 + r() * 560; const y = cy - 60 + r() * 180; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(5 + r() * 4).toFixed(1)}" fill="none" stroke="#7fae4a" stroke-width="3.5"/>`; }).join('')}`,
    `${Array.from({ length: 30 }, (_, i) => { const r = rng(i * 23 + 2); const x = cx - 300 + r() * 600; const y = cy - 70 + r() * 200; return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="3.4" ry="1.9" fill="#f7ecd2" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`; }).join('')}`,
    // chopsticks
    `<g transform="rotate(-24 1240 460)">
      ${contactShadow(1240, 500, 210, 16, 0.35)}
      <rect x="1030" y="440" width="430" height="14" rx="7" fill="#b98a4e"/>
      <rect x="1050" y="466" width="430" height="14" rx="7" fill="#a87b40"/>
    </g>`,
    steam([[640, 380, 320], [820, 350, 380], [980, 390, 280]], { opacity: 0.22 }),
  );
}

// --- 10. Apfel-Zimt-Porridge --------------------------------------------------

export function apfelZimtPorridge() {
  const disp = id('disp');
  const oatT = id('oatTex');
  const oatG = id('oat');
  const appleG = id('apple');
  const cx = 800, cy = 590;
  const appleFan = (x, y, rot, s = 2.2) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
      ${contactShadow(30, 6, 40, 10, 0.28)}
      ${[0, 16, 32, 48].map((off) => `
        <path d="M ${off} 0 a 56 56 0 0 1 56 -54 l 0 16 a 40 40 0 0 0 -40 38 z" fill="url(#${appleG})"/>
        <path d="M ${off + 56} -54 l 0 16" stroke="#c04b32" stroke-width="5"/>
        <path d="M ${off} 0 a 56 56 0 0 1 56 -54" stroke="#c04b32" stroke-width="5" fill="none"/>
      `).join('')}
    </g>`;
  return finish(
    backdrop({ top: '#332619', bottom: '#1d140c', bokeh: warmBokeh }),
    woodTable({ base: '#7d5732', poolX: cx, poolY: 760 }),
    `<defs>
      ${displaceFilter(disp, { scale: 8, freq: 0.035 })}
      ${textureFilter(oatT, { freq: 0.12, octaves: 4, alpha: 0.18 })}
      <radialGradient id="${oatG}" cx="0.45" cy="0.35" r="0.8">
        <stop offset="0" stop-color="#f4e8ce"/>
        <stop offset="0.75" stop-color="#e6d2ac"/>
        <stop offset="1" stop-color="#c9ac7c"/>
      </radialGradient>
      <linearGradient id="${appleG}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fdf3d9"/>
        <stop offset="1" stop-color="#f4dfa8"/>
      </linearGradient>
    </defs>`,
    bowl({ cx, cy, rx: 380, ry: 135, depth: 225, glaze: '#b7c6cf', glazeDark: '#7f929e', inner: '#e4ddcd' }),
    `<ellipse cx="${cx}" cy="${cy + 4}" rx="345" ry="112" fill="url(#${oatG})" filter="url(#${oatT})"/>`,
    // oat flakes
    `${Array.from({ length: 40 }, (_, i) => { const r = rng(i * 9 + 7); const a = r() * Math.PI * 2; const rad = Math.sqrt(r()); const x = cx + Math.cos(a) * 320 * rad; const y = cy + 4 + Math.sin(a) * 96 * rad; return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(5 + r() * 3).toFixed(1)}" ry="${(3 + r() * 2).toFixed(1)}" fill="#d9bd8c" opacity="0.8" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`; }).join('')}`,
    appleFan(cx - 230, cy + 30, 8, 1.6),
    appleFan(cx + 60, cy + 50, 16, 1.5),
    // cinnamon dust
    `${Array.from({ length: 120 }, (_, i) => { const r = rng(i * 3 + 11); const a = r() * Math.PI * 2; const rad = Math.sqrt(r()); const x = cx - 60 + Math.cos(a) * 190 * rad; const y = cy - 6 + Math.sin(a) * 62 * rad; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1 + r() * 2).toFixed(1)}" fill="#8a4f22" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>`; }).join('')}`,
    // honey drizzle
    `<path d="M ${cx - 170} ${cy - 26} q 120 -34 330 -8 M ${cx - 130} ${cy + 12} q 100 -22 270 -4 M ${cx - 80} ${cy + 48} q 80 -16 210 -2"
      stroke="#d99a2b" stroke-width="13" fill="none" stroke-linecap="round" opacity="0.85" filter="url(#${disp})"/>
     <path d="M ${cx - 150} ${cy - 30} q 110 -30 300 -8" stroke="#f2c25e" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8"/>`,
    gloss(cx - 90, cy - 34, 90, 20, -6, 0.3),
    // walnuts
    `${[[cx + 240, cy - 40], [cx - 60, cy + 74], [cx + 150, cy + 66]].map(([x, y]) => `
      ${contactShadow(x, y + 12, 22, 7, 0.3)}
      <circle cx="${x}" cy="${y}" r="17" fill="#a5713c"/>
      <path d="M ${x - 10} ${y - 6} q 5 8 0 14 M ${x} ${y - 10} q 5 10 0 18 M ${x + 9} ${y - 6} q 4 8 0 13" stroke="#6e441c" stroke-width="3" fill="none"/>`).join('')}`,
    // cinnamon sticks on the table
    `<g transform="rotate(14 1200 810)">
      ${contactShadow(1200, 836, 130, 14, 0.4)}
      <rect x="1080" y="800" width="240" height="26" rx="13" fill="#8a5426"/>
      <rect x="1080" y="800" width="240" height="10" rx="5" fill="#a86e38"/>
      <rect x="1110" y="828" width="240" height="26" rx="13" fill="#7a4a20"/>
    </g>`,
    steam([[680, 420, 280], [830, 390, 320], [950, 430, 240]]),
  );
}

// --- 11. BBQ Burger ------------------------------------------------------------

export function bbqBurger() {
  const disp = id('disp');
  const bunT = id('bunTex');
  const bunG = id('bun');
  const pattyG = id('patty');
  const cheeseG = id('ched');
  const cx = 800;
  const by = 700; // bottom of stack
  return finish(
    backdrop({ top: '#261c16', bottom: '#130d09', bokeh: [[230, 140, 76, '#f0a04e', 0.3], [1370, 170, 92, '#e2622a', 0.24], [1180, 80, 44, '#ffd89a', 0.2], [420, 260, 54, '#c96a2e', 0.18]] }),
    woodTable({ base: '#5f3f26', poolX: cx, poolY: 800 }),
    `<defs>
      ${displaceFilter(disp, { scale: 10, freq: 0.022 })}
      ${textureFilter(bunT, { freq: 0.09, octaves: 4, alpha: 0.3 })}
      <radialGradient id="${bunG}" cx="0.42" cy="0.25" r="0.95">
        <stop offset="0" stop-color="#e8a75c"/>
        <stop offset="0.6" stop-color="#c97f35"/>
        <stop offset="1" stop-color="#96591f"/>
      </radialGradient>
      <linearGradient id="${pattyG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5c3319"/>
        <stop offset="1" stop-color="#31180b"/>
      </linearGradient>
      <linearGradient id="${cheeseG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f5b93e"/>
        <stop offset="1" stop-color="#d88f1d"/>
      </linearGradient>
    </defs>`,
    // rustic wooden board
    contactShadow(cx, by + 180, 520, 60, 0.55),
    `<ellipse cx="${cx}" cy="${by + 130}" rx="500" ry="120" fill="#33200f"/>
     <ellipse cx="${cx}" cy="${by + 118}" rx="500" ry="112" fill="#4c2f16"/>
     <ellipse cx="${cx}" cy="${by + 118}" rx="500" ry="112" fill="none" stroke="#5f3d1e" stroke-width="6" opacity="0.6"/>`,
    // bottom bun
    `<g filter="url(#${bunT})">
      <path d="M ${cx - 250} ${by - 16} q 250 64 500 0 l -6 44 q -12 38 -52 44 q -192 34 -386 0 q -40 -6 -50 -44 z" fill="url(#${bunG})" filter="url(#${disp})"/>
    </g>`,
    // thick patty with char marks
    `<path d="M ${cx - 272} ${by - 88} q 272 72 544 0 q 8 48 -18 66 q -252 64 -508 0 q -26 -18 -18 -66 z" fill="url(#${pattyG})" filter="url(#${disp})"/>
     ${[[cx - 190, by - 52], [cx - 50, by - 34], [cx + 110, by - 46], [cx + 200, by - 62]].map(([x, y]) => `<path d="M ${x} ${y} q 30 8 62 2" stroke="#180a04" stroke-width="8" fill="none" opacity="0.8"/>`).join('')}
     ${gloss(cx - 130, by - 88, 70, 11, -4, 0.2)}`,
    // melted cheddar draping down over the patty
    `<path d="M ${cx - 254} ${by - 112} q 254 58 508 0 l 20 16 q -18 22 -54 28 q 12 44 -12 50 q -22 6 -28 -40 q -82 16 -172 16 q 6 48 -18 48 q -22 0 -22 -48 q -92 -2 -166 -18 q -2 44 -24 38 q -22 -8 -10 -46 q -36 -8 -52 -26 z"
      fill="url(#${cheeseG})" filter="url(#${disp})"/>
     ${gloss(cx - 80, by - 104, 100, 11, -3, 0.4)}`,
    // tomato slices
    `<path d="M ${cx - 236} ${by - 140} q 236 52 472 0 q 6 22 -10 32 q -222 48 -452 0 q -16 -10 -10 -32 z" fill="#d63c25" filter="url(#${disp})"/>
     ${gloss(cx + 60, by - 134, 80, 9, -2, 0.4)}`,
    // lettuce ruffle: scalloped leaves poking out
    `<g filter="url(#${disp})">
      ${Array.from({ length: 9 }, (_, i) => {
        const x = cx - 240 + i * 60;
        const lift = Math.sin((i / 8) * Math.PI) * 42;
        const y = by - 148 + lift * 0.55 - 10;
        return `<ellipse cx="${x}" cy="${y}" rx="46" ry="26" fill="${i % 2 ? '#5f9e35' : '#6fae42'}"/>
          <path d="M ${x - 34} ${y + 6} q 34 18 68 0" stroke="#477c24" stroke-width="5" fill="none" opacity="0.8"/>`;
      }).join('')}
    </g>`,
    // bbq sauce drips
    `${[[cx - 170, by - 118], [cx + 40, by - 110], [cx + 200, by - 120]].map(([x, y]) => `<path d="M ${x} ${y} q 10 40 0 62 q -14 -16 -14 -38 q 0 -16 14 -24 z" fill="#7e2410" opacity="0.9"/>`).join('')}`,
    // top bun with sesame
    `<g filter="url(#${bunT})">
      <path d="M ${cx - 262} ${by - 166} q 24 -156 262 -158 q 238 2 262 158 q 4 24 -22 30 q -240 44 -480 0 q -26 -6 -22 -30 z" fill="url(#${bunG})" filter="url(#${disp})"/>
    </g>
    <path d="M ${cx - 210} ${by - 200} q 40 -96 210 -110" stroke="#f2c684" stroke-width="10" fill="none" opacity="0.4" stroke-linecap="round"/>
    ${gloss(cx - 110, by - 266, 120, 30, -10, 0.3)}
    ${[[cx - 130, by - 232, 18], [cx - 30, by - 258, -8], [cx + 80, by - 244, 22], [cx - 190, by - 196, -16], [cx + 10, by - 216, 6], [cx + 160, by - 200, -20], [cx - 80, by - 180, 12], [cx + 90, by - 178, -6], [cx + 210, by - 168, 14], [cx - 230, by - 164, -10]].map(([x, y, rot]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="5.5" fill="#f7e8c6" transform="rotate(${rot} ${x} ${y})"/><ellipse cx="${x - 2}" cy="${y - 1.5}" rx="4" ry="2" fill="#fdf6e2" transform="rotate(${rot} ${x} ${y})"/>`).join('')}`,
    // skewer through the top
    `<rect x="${cx - 5}" y="${by - 356}" width="10" height="110" rx="5" fill="#8a6034"/>
     <circle cx="${cx}" cy="${by - 356}" r="12" fill="#6e4a24"/>`,
    steam([[660, 420, 240], [940, 430, 220]], { opacity: 0.12 }),
  );
}

// --- 12. Panna Cotta mit Beeren --------------------------------------------------

export function pannaCottaBeeren() {
  const disp = id('disp');
  const pcG = id('pc');
  const coulisG = id('coulis');
  const cx = 780, cy = 610;
  return finish(
    backdrop({ top: '#2a2027', bottom: '#161016', bokeh: [[260, 140, 70, '#e8a0b4', 0.24], [1340, 170, 86, '#c96a8e', 0.2], [1150, 80, 42, '#f2d8e0', 0.18]] }),
    stoneTable({ y: 500, base: '#38343a', light: '#4e4950', poolX: cx, poolY: 780 }),
    `<defs>
      ${displaceFilter(disp, { scale: 7, freq: 0.03 })}
      <linearGradient id="${pcG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fdfaf2"/>
        <stop offset="0.7" stop-color="#f3ead8"/>
        <stop offset="1" stop-color="#ddcfb4"/>
      </linearGradient>
      <linearGradient id="${coulisG}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d8365e"/>
        <stop offset="1" stop-color="#8f1430"/>
      </linearGradient>
    </defs>`,
    plate({ cx, cy: cy + 190, rx: 420, ry: 155, tone: '#f6f2ea' }),
    // coulis pool on plate
    `<ellipse cx="${cx + 30}" cy="${cy + 200}" rx="250" ry="70" fill="url(#${coulisG})" opacity="0.8" filter="url(#${disp})"/>`,
    contactShadow(cx, cy + 205, 220, 40, 0.4),
    // panna cotta dome (flan shape)
    `<path d="M ${cx - 190} ${cy + 180} q -14 -150 34 -206 q 42 -46 156 -46 q 114 0 156 46 q 48 56 34 206 q -190 44 -380 0 z"
      fill="url(#${pcG})" filter="url(#${disp})"/>
     <ellipse cx="${cx}" cy="${cy + 178}" rx="192" ry="42" fill="#e9dfc9"/>
     ${gloss(cx - 90, cy + 10, 40, 90, 8, 0.5)}
     ${gloss(cx + 110, cy + 60, 20, 50, -6, 0.25)}`,
    // vanilla specks
    `${Array.from({ length: 26 }, (_, i) => { const r = rng(i * 13 + 3); const x = cx - 140 + r() * 280; const y = cy - 20 + r() * 170; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.2 + r() * 1.4).toFixed(1)}" fill="#4a3a22" opacity="0.6"/>`; }).join('')}`,
    // berry coulis draped over the top, dripping
    `<path d="M ${cx - 158} ${cy - 28} q 22 -46 158 -46 q 136 0 158 46 q 6 18 -12 26 q -22 10 -36 6 q 8 34 -12 38 q -18 4 -24 -30 q -34 8 -74 8 q 6 42 -16 42 q -22 0 -18 -42 q -42 -2 -72 -10 q -2 36 -22 30 q -18 -6 -10 -36 q -16 -2 -26 -10 q -12 -10 -6 -22 z"
      fill="url(#${coulisG})" filter="url(#${disp})"/>
     ${gloss(cx - 40, cy - 48, 70, 12, -4, 0.45)}`,
    raspberry(cx - 250, cy + 190, 1.3), raspberry(cx + 260, cy + 160, 1.35), raspberry(cx + 180, cy + 220, 1.1),
    raspberry(cx - 60, cy - 60, 1.15),
    blueberry(cx - 200, cy + 230, 1.15), blueberry(cx + 90, cy + 235, 1.2), blueberry(cx - 300, cy + 150, 1.0),
    blueberry(cx + 40, cy - 74, 1.0),
    herb(cx + 10, cy - 80, 1.2, -15, '#2f6a2a', '#4d9440'),
    // dusting
    `${Array.from({ length: 40 }, (_, i) => { const r = rng(i * 7 + 6); const x = cx - 300 + r() * 600; const y = cy + 120 + r() * 140; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="#fffef8" opacity="${(0.3 + r() * 0.4).toFixed(2)}"/>`; }).join('')}`,
  );
}

export const scenes = {
  'pasta-spinat-lachs': pastaSpinatLachs,
  'karottentorte': karottentorte,
  'bbq-rippchen': bbqRippchen,
  'zitronen-haehnchen-blech': zitronenHaehnchen,
  'linsen-kokos-suppe': linsenKokosSuppe,
  'couscous-salat': couscousSalat,
  'schoko-himbeer-brownies': schokoBrownies,
  'gemuese-lasagne': gemueseLasagne,
  'asia-nudelpfanne': asiaNudelpfanne,
  'apfel-zimt-porridge': apfelZimtPorridge,
  'bbq-burger': bbqBurger,
  'panna-cotta-beeren': pannaCottaBeeren,
};

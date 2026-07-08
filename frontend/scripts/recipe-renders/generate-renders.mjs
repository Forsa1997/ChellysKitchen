#!/usr/bin/env node
// Rasterizes the recipe scenes to JPGs in public/recipe-images/renders/.
// Requires a Playwright-compatible Chromium; see README.md.

import { createRequire } from 'module';
import { mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { scenes } from './scenes.mjs';
import { W, H } from './lib.mjs';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  for (const name of ['playwright', 'playwright-core']) {
    try {
      return require(name);
    } catch {
      /* try next */
    }
  }
  throw new Error('Playwright not found. Run: npm install --no-save playwright-core');
}

const outDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public/recipe-images/renders',
);

const only = process.argv.slice(2);

const { chromium } = loadPlaywright();

const launchOptions = {};
if (process.env.CHROMIUM_PATH) {
  launchOptions.executablePath = process.env.CHROMIUM_PATH;
}

await mkdir(outDir, { recursive: true });
const workDir = await import('fs/promises').then((fs) =>
  fs.mkdtemp(path.join(tmpdir(), 'ck-renders-')),
);

const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: { width: W, height: H } });

for (const [slug, build] of Object.entries(scenes)) {
  if (only.length && !only.includes(slug)) continue;
  const svg = build();
  const svgPath = path.join(workDir, `${slug}.svg`);
  await writeFile(svgPath, svg);
  await page.goto(pathToFileURL(svgPath).href);
  await page.screenshot({
    path: path.join(outDir, `${slug}.jpg`),
    type: 'jpeg',
    quality: 82,
    clip: { x: 0, y: 0, width: W, height: H },
  });
  console.log(`rendered ${slug}.jpg`);
}

await browser.close();
await rm(workDir, { recursive: true, force: true });
console.log(`done -> ${outDir}`);

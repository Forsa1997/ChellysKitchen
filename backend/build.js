#!/usr/bin/env node

/**
 * Build script - compiles TypeScript and moves server files to root dist directory
 */

const fs = require('fs');
const path = require('path');

const files = ['server.js', 'server.d.ts', 'server.d.ts.map', 'server.js.map'];
const srcDir = path.join(__dirname, 'dist', 'src');
const dstDir = path.join(__dirname, 'dist');

console.log('Moving server files from dist/src to dist...');

files.forEach((file) => {
  const src = path.join(srcDir, file);
  const dst = path.join(dstDir, file);

  if (fs.existsSync(src)) {
    fs.renameSync(src, dst);
    console.log(`✓ Moved ${file}`);
  }
});

console.log('Build complete!');


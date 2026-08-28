// Stage 3 and 4 of step 2: optimise losslessly, then give each file a
// content-hashed name.
//
//   node scripts/finalise-shots.mjs 12 12.1
//
// Lossless means lossless: no palette quantisation, no resizing, no colour
// changes. Only the deflate settings are turned up. The script asserts the
// dimensions and the raw pixels are unchanged before it writes anything, and
// refuses to shrink a file by making it different.
//
// The name is <nn>-<slug>.<hash8>.png where hash8 is the first 8 hex characters
// of the SHA-256 of the optimised bytes. A changed image therefore gets a new
// URL, so a stale CDN copy can never stand in for it.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const [collection, article] = process.argv.slice(2);
if (!collection || !article) {
  console.error('usage: node scripts/finalise-shots.mjs <collection> <article>');
  process.exit(1);
}

const dir = path.join('screenshots', collection, article);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();

const alreadyHashed = /\.[0-9a-f]{8}\.png$/;
let bytesBefore = 0;
let bytesAfter = 0;
const out = [];

for (const file of files) {
  const full = path.join(dir, file);
  if (alreadyHashed.test(file)) {
    out.push({ file, note: 'already finalised - left alone' });
    continue;
  }

  const original = fs.readFileSync(full);
  const before = await sharp(original).raw().toBuffer({ resolveWithObject: true });

  const optimised = await sharp(original)
    .png({ compressionLevel: 9, effort: 10, palette: false, adaptiveFiltering: true })
    .toBuffer();

  const after = await sharp(optimised).raw().toBuffer({ resolveWithObject: true });

  // Prove it is lossless before replacing anything.
  if (before.info.width !== after.info.width || before.info.height !== after.info.height) {
    throw new Error(`${file}: dimensions changed ${before.info.width}x${before.info.height} -> ${after.info.width}x${after.info.height}`);
  }
  if (!before.data.equals(after.data)) {
    throw new Error(`${file}: pixels changed - that is not lossless, refusing to write`);
  }

  // Keep whichever is smaller; the hash is of what actually gets written.
  const finalBytes = optimised.length < original.length ? optimised : original;
  const hash = crypto.createHash('sha256').update(finalBytes).digest('hex').slice(0, 8);
  const slug = file.replace(/\.png$/, '');
  const named = `${slug}.${hash}.png`;

  fs.writeFileSync(path.join(dir, named), finalBytes);
  fs.unlinkSync(full);

  bytesBefore += original.length;
  bytesAfter += finalBytes.length;
  out.push({
    file: named,
    dimensions: `${after.info.width}x${after.info.height}`,
    kb: (finalBytes.length / 1024).toFixed(0),
    saved: `${(100 - (finalBytes.length / original.length) * 100).toFixed(1)}%`,
  });
}

for (const o of out) console.log(JSON.stringify(o));
if (bytesBefore) {
  console.log(`\ntotal ${(bytesBefore / 1024).toFixed(0)}kB -> ${(bytesAfter / 1024).toFixed(0)}kB ` +
    `(${(100 - (bytesAfter / bytesBefore) * 100).toFixed(1)}% smaller, pixel-identical)`);
}

// The one image collection 19 attaches to a comment.
//
//   node scripts/make-assets-19.mjs
//
// 19.1 documents the **Add Media** button on the comment composer, and shows
// both what a chosen file looks like before the comment is posted and what the
// posted comment looks like afterwards. That needs a real file.
//
// Drawn from SVG rather than committed as an opaque binary, so a later session
// can see exactly what it is and rebuild identical bytes. No clock, no
// randomness.
//
// It is a flat graphic of a folded shirt, in KB Comets' colours - deliberately
// not the product's own blue, so a reader can tell the attachment from the app's
// chrome, and deliberately not a photograph of anybody.
//
// Two encodings, because there are two ways in:
//
//   .png   what 19.1's spec hands to the composer's file input, whose accept
//          filter is `image/*`.
//   .webp  what scripts/seed-19.mjs POSTs straight to /comments/media. The
//          upload endpoints take WebP and nothing else - see lib/api.mjs,
//          upload().

import fs from 'node:fs';
import sharp from 'sharp';

const SHIRT = '#E4572E';
const TRIM = '#1B2A41';
const CLOTH = '#F4F1EA';

// 1200 x 800. Large enough that the composer's preview and the posted
// attachment are both sharp at deviceScaleFactor 2, and a plain 3:2 so neither
// crops to something surprising.
const kit = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <rect width="1200" height="800" fill="${CLOTH}"/>
  <rect x="24" y="24" width="1152" height="752" fill="none" stroke="${TRIM}" stroke-width="8"/>
  <path d="M420 200h360l120 90-70 100-50-38v250H420V352l-50 38-70-100z" fill="${SHIRT}"/>
  <path d="M540 200h120a60 60 0 0 1-120 0z" fill="${TRIM}"/>
  <rect x="470" y="430" width="260" height="14" fill="${TRIM}"/>
  <rect x="470" y="470" width="180" height="14" fill="${TRIM}"/>
  <circle cx="820" cy="560" r="60" fill="none" stroke="${TRIM}" stroke-width="14"/>
  <path d="M820 500v120M760 560h120" stroke="${TRIM}" stroke-width="14"/>
</svg>`;

fs.mkdirSync('assets/19', { recursive: true });
for (const [ext, opts] of [['png', {}], ['webp', { lossless: true }]]) {
  const out = `assets/19/kb-comets-kit.${ext}`;
  await sharp(Buffer.from(kit))[ext](opts).toFile(out);
  console.log('wrote', out, fs.statSync(out).size, 'bytes');
}

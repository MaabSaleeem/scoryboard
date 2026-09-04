// The one image collection 22 uploads: the logo 22.1 gives KB 22 Scratch Pitch.
//
//   node scripts/make-assets-22.mjs
//
// Drawn from SVG rather than committed as an opaque binary, so a later session
// can see exactly what it is and rebuild identical bytes. No clock, no
// randomness.
//
// A flat graphic in a colour that is plainly not the product's own blue, so a
// reader can tell the logo from the app's chrome. 1024 square: the cropper is
// round and centred, and anything smaller gets a zoom slider pushed to its
// minimum, which reads as a different screenshot.

import fs from 'node:fs';
import sharp from 'sharp';

const GREEN = '#0F6E4C';
const SAND = '#E8D9A0';

const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <rect width="1024" height="1024" fill="${GREEN}"/>
  <rect x="160" y="272" width="704" height="480" fill="none" stroke="${SAND}" stroke-width="22"/>
  <line x1="512" y1="272" x2="512" y2="752" stroke="${SAND}" stroke-width="22"/>
  <circle cx="512" cy="512" r="96" fill="none" stroke="${SAND}" stroke-width="22"/>
  <rect x="160" y="412" width="120" height="200" fill="none" stroke="${SAND}" stroke-width="22"/>
  <rect x="744" y="412" width="120" height="200" fill="none" stroke="${SAND}" stroke-width="22"/>
  <text x="512" y="880" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700"
        fill="${SAND}" text-anchor="middle">KB 22</text>
</svg>`;

fs.mkdirSync('assets/22', { recursive: true });
await sharp(Buffer.from(logo)).png({ compressionLevel: 9 }).toFile('assets/22/scratch-pitch-logo.png');
console.log('assets/22/scratch-pitch-logo.png', fs.statSync('assets/22/scratch-pitch-logo.png').size, 'bytes');

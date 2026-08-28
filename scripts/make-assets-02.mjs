// The two images collection 02 uploads: the persona's profile photo and banner.
//
//   node scripts/make-assets-02.mjs
//
// Drawn from SVG rather than committed as opaque binaries, so a later session can
// see exactly what they are and rebuild identical bytes. No clock, no randomness.
//
// 02.5 documents adding a profile photo and a banner. That needs real files, and
// a real person's photograph is not something this project may put in a help
// article - so these are flat graphics in the product's own blue.

import fs from 'node:fs';
import sharp from 'sharp';

const BLUE = '#1D4ED8';
const PALE = '#93C5FD';
const INK = '#0F172A';

// 1024 square and 3200 x 800. Both are deliberately large: the Crop Banner
// dialog puts a yellow advisory - "for optimal banner experience use image with
// at least 1728 * 672 size" - over anything smaller, and an advisory in a help
// screenshot is noise the reader has to explain away. 3200 x 800 keeps the 4:1
// shape the banner is stored at, so the crop window covers the whole image.
const avatar = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <rect width="1024" height="1024" fill="${BLUE}"/>
  <circle cx="512" cy="400" r="172" fill="${PALE}"/>
  <path d="M192 920c0-176 144-280 320-280s320 104 320 280z" fill="${PALE}"/>
</svg>`;

const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="3200" height="800">
  <rect width="3200" height="800" fill="${INK}"/>
  <rect x="8" y="8" width="3184" height="784" fill="none" stroke="${BLUE}" stroke-width="12"/>
  <line x1="1600" y1="0" x2="1600" y2="800" stroke="${BLUE}" stroke-width="10"/>
  <circle cx="1600" cy="400" r="180" fill="none" stroke="${BLUE}" stroke-width="10"/>
  <rect x="8" y="240" width="360" height="320" fill="none" stroke="${BLUE}" stroke-width="10"/>
  <rect x="2832" y="240" width="360" height="320" fill="none" stroke="${BLUE}" stroke-width="10"/>
</svg>`;

// Two encodings of each image, because the two ways in differ:
//
//   .png   what 02.5's spec hands to the file input on Profile settings. The
//          page's cropper re-encodes it to WebP itself before uploading.
//   .webp  what scripts/seed-02.mjs POSTs straight to /players/avatar and
//          /players/:playerId/banner. Those endpoints refuse a PNG with 415
//          "Unsupported file type" - see lib/api.mjs, upload().

fs.mkdirSync('assets/02', { recursive: true });
for (const [name, svg] of [['pia-avatar', avatar], ['pia-banner', banner]]) {
  const png = `assets/02/${name}.png`;
  const webp = `assets/02/${name}.webp`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: false }).toFile(png);
  await sharp(Buffer.from(svg)).webp({ lossless: true }).toFile(webp);
  for (const out of [png, webp]) console.log(out, fs.statSync(out).size, 'bytes');
}

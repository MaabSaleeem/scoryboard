// The two images collection 07 uploads: KB 07 United's crest and its banner.
//
//   node scripts/make-assets-07.mjs
//
// Drawn from SVG rather than committed as opaque binaries, so a later session can
// see exactly what they are and rebuild identical bytes. No clock, no randomness.
//
// 07.3 documents giving a team a crest, a banner and a bio. That needs real
// files, and a real club's badge is not something this project may put in a help
// article - so these are flat graphics, in a colour that is plainly not the
// product's own blue, so a reader can tell the crest from the app's chrome.

import fs from 'node:fs';
import sharp from 'sharp';

const GREEN = '#0F6E4C';
const SAND = '#E8D9A0';
const INK = '#08301F';

// 1024 square and 3200 x 800. Both are deliberately large: the crop dialog puts
// a yellow advisory - "for optimal banner experience use image with at least
// 1728 * 672 size" - over anything smaller, and an advisory in a help screenshot
// is noise the reader has to explain away. 4:1 keeps the shape the banner is
// stored at, so the crop window covers the whole image.
const crest = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <rect width="1024" height="1024" fill="${GREEN}"/>
  <path d="M512 96 176 224v336c0 208 144 312 336 368 192-56 336-160 336-368V224z" fill="${SAND}"/>
  <path d="M512 176 256 272v288c0 168 112 254 256 302 144-48 256-134 256-302V272z" fill="${GREEN}"/>
  <circle cx="512" cy="520" r="132" fill="none" stroke="${SAND}" stroke-width="28"/>
  <path d="M512 388v264M380 520h264" stroke="${SAND}" stroke-width="28"/>
</svg>`;

const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="3200" height="800">
  <rect width="3200" height="800" fill="${INK}"/>
  <rect x="8" y="8" width="3184" height="784" fill="none" stroke="${SAND}" stroke-width="12"/>
  <line x1="1600" y1="0" x2="1600" y2="800" stroke="${SAND}" stroke-width="10"/>
  <circle cx="1600" cy="400" r="180" fill="none" stroke="${SAND}" stroke-width="10"/>
  <rect x="8" y="240" width="360" height="320" fill="none" stroke="${SAND}" stroke-width="10"/>
  <rect x="2832" y="240" width="360" height="320" fill="none" stroke="${SAND}" stroke-width="10"/>
  <rect x="1240" y="120" width="720" height="120" fill="${GREEN}"/>
</svg>`;

// Two encodings of each image, because the two ways in differ:
//
//   .png   what 07.3's spec hands to the file input on the team settings page.
//          The page's cropper re-encodes it to WebP itself before uploading.
//   .webp  what scripts/seed-07.mjs POSTs straight to /teams/avatar and
//          /teams/:teamId/banner. Collection 02 found those upload endpoints
//          take WebP and nothing else - see lib/api.mjs, upload().

fs.mkdirSync('assets/07', { recursive: true });
for (const [name, svg] of [['united-crest', crest], ['united-banner', banner]]) {
  const png = `assets/07/${name}.png`;
  const webp = `assets/07/${name}.webp`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: false }).toFile(png);
  await sharp(Buffer.from(svg)).webp({ lossless: true }).toFile(webp);
  for (const out of [png, webp]) console.log(out, fs.statSync(out).size, 'bytes');
}

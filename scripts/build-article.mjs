// Stage 7 of step 2: turn the prose in articles/src/<id>.html into the JSON that
// gets posted to Intercom, with real, already-verified image URLs.
//
//   node scripts/build-article.mjs 12.1 <commit-sha>
//
// The prose carries placeholders instead of URLs:
//
//   {{shot:01|Alt text for the screenshot}}
//
// The number matches the <nn> prefix on the screenshot file. The builder refuses
// to run if a placeholder has no matching file, or if a screenshot in the folder
// is never referenced - either one means the article and the capture disagree,
// which is exactly the mismatch this stage should catch rather than publish.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

const [articleId, sha] = process.argv.slice(2);
if (!articleId || !sha) {
  console.error('usage: node scripts/build-article.mjs <article-id> <commit-sha>');
  process.exit(1);
}

const collection = articleId.split('.')[0];
const intercom = yaml.parse(fs.readFileSync('config/intercom.yaml', 'utf8'));
const collectionId = intercom.collections[collection]?.id;
if (!collectionId) throw new Error(`No Intercom id for collection ${collection}`);

const REPO = process.env.GITHUB_REPO;
const dir = path.join('screenshots', collection, articleId);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();

const byNumber = new Map();
for (const f of files) {
  const n = f.slice(0, 2);
  if (byNumber.has(n)) throw new Error(`Two screenshots share the prefix ${n} in ${dir}`);
  byNumber.set(n, `https://cdn.jsdelivr.net/gh/${REPO}@${sha}/screenshots/${collection}/${articleId}/${f}`);
}

const srcPath = path.join('articles', 'src', `${articleId}.html`);
const src = fs.readFileSync(srcPath, 'utf8');

const title = src.match(/<!--\s*title:\s*(.+?)\s*-->/)?.[1];
const description = src.match(/<!--\s*description:\s*(.+?)\s*-->/)?.[1];
if (!title) throw new Error(`${srcPath} has no <!-- title: ... --> line`);
if (!description) throw new Error(`${srcPath} has no <!-- description: ... --> line`);

// Intercom strips the `start` attribute from <ol>, so a procedure split into
// several lists to interleave screenshots renders as 1. 2. 1. 2. 1. rather than
// 1. to 5. The fix is one list per procedure with each screenshot nested inside
// the <li> it belongs to - Intercom keeps that, and the numbering runs unbroken.
// Both faults are rejected here rather than left to be spotted after publishing.
// Verified against the rendered help centre, 2026-08-28.
const startAttr = src.match(/<ol\s+start=/i);
if (startAttr) {
  throw new Error(
    `${articleId}: <ol start="..."> - Intercom drops the start attribute, so this list ` +
    `restarts at 1. Merge the steps into one <ol> and put each screenshot inside its <li>.`,
  );
}

// Two ordered lists with no heading between them are one procedure that has been
// cut in half, which is the same defect wearing a different hat.
const betweenLists = src.split(/<\/ol>/i).slice(1, -1);
for (const chunk of betweenLists) {
  if (!/<h[1-6][\s>]/i.test(chunk) && /<ol[\s>]/i.test(chunk)) {
    throw new Error(
      `${articleId}: two <ol> blocks with no heading between them. Intercom numbers each ` +
      `list from 1. Merge them, and nest the screenshots inside their <li>.`,
    );
  }
}

const used = new Set();
const body = src
  .replace(/<!--.*?-->\n?/gs, '')
  .replace(/\{\{shot:(\d\d)\|(.+?)\}\}/g, (_, n, alt) => {
    const url = byNumber.get(n);
    if (!url) throw new Error(`${articleId}: placeholder {{shot:${n}}} has no screenshot in ${dir}`);
    used.add(n);
    return `<p><img src="${url}" alt="${alt.replace(/"/g, '&quot;')}"></p>`;
  })
  .trim();

const unused = [...byNumber.keys()].filter((n) => !used.has(n));
if (unused.length) {
  throw new Error(`${articleId}: captured but never shown in the article: ${unused.join(', ')}. ` +
    `The brief lists every screenshot as part of the article, so this is a mismatch.`);
}

const out = {
  id: articleId,
  title,
  description,
  collection,
  intercom_collection_id: String(collectionId),
  author_id: String(intercom.author_id),
  state: 'published',
  spec: `specs/${collection}/${articleId}.spec.ts`,
  commit_sha: sha,
  screenshots: files.map((f) => path.posix.join('screenshots', collection, articleId, f)),
  body,
};

fs.mkdirSync('articles', { recursive: true });
fs.writeFileSync(path.join('articles', `${articleId}.json`), `${JSON.stringify(out, null, 2)}\n`);
console.log(`articles/${articleId}.json  "${title}"  ${used.size} screenshots, ${body.length} bytes of HTML`);

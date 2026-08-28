// Stages 8 and 9 of step 2: publish one article to Intercom, then record its id.
//
//   node scripts/publish-article.mjs 12.1
//   node scripts/publish-article.mjs 12.1 --state published   # human's call only
//
// Idempotent by article id. If state/manifest.json already holds an intercom_id
// for this article the script PUTs; otherwise it POSTs and records the new id.
// Re-running the whole collection is therefore safe and does not create
// duplicates.
//
// Articles land as DRAFT. The human reviews the drafts in Intercom and publishes
// from there, so `--state published` exists for them, not for the agent.
//
// One exception, and the reason this is not just a constant: an article that is
// already published must not be silently knocked back to draft by a re-run. When
// the manifest says an article is published, `state` is omitted from the PUT and
// Intercom keeps whatever state it has. Pass --state explicitly to override.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const [articleId] = args.filter((a) => !a.startsWith('--'));
if (!articleId) {
  console.error('usage: node scripts/publish-article.mjs <article-id> [--state draft|published]');
  process.exit(1);
}

const stateFlagIndex = args.indexOf('--state');
const stateFlag = stateFlagIndex === -1 ? null : args[stateFlagIndex + 1];
if (stateFlag && !['draft', 'published'].includes(stateFlag)) {
  console.error(`--state must be draft or published, got "${stateFlag}"`);
  process.exit(1);
}

const TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
if (!TOKEN) throw new Error('INTERCOM_ACCESS_TOKEN missing from .env');

const MANIFEST = 'state/manifest.json';
const article = JSON.parse(fs.readFileSync(path.join('articles', `${articleId}.json`), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const existing = manifest.articles[articleId];

// Draft by default. Leave an already-published article's state alone unless the
// caller was explicit, so a re-run cannot unpublish live content.
const alreadyPublished = existing?.status === 'published';
const state = stateFlag ?? (alreadyPublished ? null : 'draft');
if (!stateFlag && alreadyPublished) {
  console.log(`${articleId} is already published; leaving its state untouched. ` +
    'Pass --state to change it.');
}

const payload = {
  title: article.title,
  description: article.description,
  body: article.body,
  author_id: Number(article.author_id),
  parent_id: Number(article.intercom_collection_id),
  parent_type: 'collection',
  ...(state ? { state } : {}),
};

const url = existing?.intercom_id
  ? `https://api.intercom.io/articles/${existing.intercom_id}`
  : 'https://api.intercom.io/articles';
const method = existing?.intercom_id ? 'PUT' : 'POST';

const res = await fetch(url, {
  method,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Intercom-Version': '2.11',
  },
  body: JSON.stringify(payload),
});
const body = await res.json();

if (!res.ok) {
  console.error(`${method} ${url} -> ${res.status}`);
  console.error(JSON.stringify(body, null, 2).slice(0, 1500));
  process.exit(1);
}

console.log(`${method} -> ${res.status}  id=${body.id}  state=${body.state}  ` +
  `parent=${body.parent_id}  "${body.title}"`);

manifest.articles[articleId] = {
  intercom_id: String(body.id),
  collection: article.collection,
  intercom_collection_id: article.intercom_collection_id,
  brief: `briefs/${article.collection}.md`,
  spec: article.spec,
  commit_sha: article.commit_sha,
  screenshots: article.screenshots,
  published_at: body.updated_at
    ? new Date(body.updated_at * 1000).toISOString()
    : (existing?.published_at ?? null),
  status: body.state === 'published' ? 'published' : 'draft',
};
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`recorded ${articleId} -> ${body.id} in ${MANIFEST}`);

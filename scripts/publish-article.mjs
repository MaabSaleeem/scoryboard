// Stages 8 and 9 of step 2: publish one article to Intercom, then record its id.
//
//   node scripts/publish-article.mjs 12.1
//
// Idempotent by article id. If state/manifest.json already holds an intercom_id
// for this article the script PUTs; otherwise it POSTs and records the new id.
// Re-running the whole collection is therefore safe and does not create
// duplicates.
//
// Articles default to draft, and an article outside a collection is invisible in
// the help centre, so both `state` and `parent_id`/`parent_type` are always sent.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const [articleId] = process.argv.slice(2);
if (!articleId) {
  console.error('usage: node scripts/publish-article.mjs <article-id>');
  process.exit(1);
}

const TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
if (!TOKEN) throw new Error('INTERCOM_ACCESS_TOKEN missing from .env');

const MANIFEST = 'state/manifest.json';
const article = JSON.parse(fs.readFileSync(path.join('articles', `${articleId}.json`), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const existing = manifest.articles[articleId];

const payload = {
  title: article.title,
  description: article.description,
  body: article.body,
  author_id: Number(article.author_id),
  state: 'published',
  parent_id: Number(article.intercom_collection_id),
  parent_type: 'collection',
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
  status: 'published',
};
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`recorded ${articleId} -> ${body.id} in ${MANIFEST}`);

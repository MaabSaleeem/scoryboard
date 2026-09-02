// Bring state/manifest.json back in line with what Intercom actually holds.
//
//   node scripts/reconcile-manifest.mjs            # report only, writes nothing
//   node scripts/reconcile-manifest.mjs --write    # apply what it found
//
// READ-ONLY against Intercom. It sends GETs and nothing else, so it can neither
// publish nor unpublish anything. The only file it can change is the manifest.
//
// --- Why this exists ------------------------------------------------------
//
// docs/workflow.md says the manifest "only knows about publishes the script
// itself did, and publishing is something the reviewer does in the Intercom UI
// between sessions - so it is stale by default". `publish-article.mjs` already
// reconciles, but only for the one article it is publishing. Nothing reconciled
// the rest, and two things read the manifest for every OTHER article:
//
//   - `build-article.mjs`, to turn {{link:<id>|text}} into an anchor. It needs
//     `status: "published"` AND an `intercom_url`. A stale row silently degrades
//     the link to quoted plain text, and nothing fails.
//   - the end-of-session report, which is where a wrong status gets believed.
//
// Collection 18 hit exactly that on 2026-09-02: four of collection 04's six
// articles had been published by the reviewer, the manifest still said `draft`,
// and two cross-references into 04 came out as plain text for no visible reason.
//
// A row whose id answers 404 is REPORTED and left alone. Deciding what an
// article that no longer exists means is not this script's call - see the same
// refusal in publish-article.mjs.

import 'dotenv/config';
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const MANIFEST = 'state/manifest.json';

const TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
if (!TOKEN) throw new Error('Missing INTERCOM_ACCESS_TOKEN in .env');
const HEADERS = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' };

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const ids = Object.keys(manifest.articles).sort();

const changed = [];
const missing = [];
let checked = 0;

for (const articleId of ids) {
  const row = manifest.articles[articleId];
  if (!row?.intercom_id) continue;
  checked += 1;

  const res = await fetch(`https://api.intercom.io/articles/${row.intercom_id}`, { headers: HEADERS });
  if (res.status === 404) {
    missing.push(`${articleId} -> ${row.intercom_id}`);
    continue;
  }
  if (!res.ok) {
    console.warn(`${articleId}: Intercom answered ${res.status}; left alone.`);
    continue;
  }
  const live = await res.json();
  const status = live.state === 'published' ? 'published' : 'draft';
  const url = live.url ?? null;

  const wasStatus = row.status;
  const wasUrl = row.intercom_url ?? null;
  if (wasStatus === status && wasUrl === url) continue;

  const notes = [];
  if (wasStatus !== status) notes.push(`status ${wasStatus} -> ${status}`);
  if (wasUrl !== url) notes.push(url ? 'gained a url' : 'lost its url');
  changed.push(`${articleId}  ${notes.join(', ')}`);

  row.status = status;
  row.intercom_url = url;
}

console.log(`checked ${checked} article(s) against Intercom`);
if (missing.length) {
  console.log(`\n${missing.length} id(s) answer 404 and were LEFT ALONE - decide by hand:`);
  for (const m of missing) console.log(`  ${m}`);
}
if (!changed.length) {
  console.log('\nnothing to change; the manifest already matches Intercom');
} else {
  console.log(`\n${changed.length} row(s) ${WRITE ? 'updated' : 'would change'}:`);
  for (const c of changed) console.log(`  ${c}`);
  if (WRITE) {
    fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`\nwrote ${MANIFEST}`);
  } else {
    console.log('\nre-run with --write to apply');
  }
}

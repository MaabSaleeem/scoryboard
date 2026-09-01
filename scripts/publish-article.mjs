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
// --- Why this asks Intercom before it decides -----------------------------
//
// An article that is already published must not be knocked back to draft by a
// re-run. That has always been the rule; what changed is where the answer comes
// from.
//
// It used to read `status` out of state/manifest.json. The manifest is written by
// this script and by nothing else, so it only ever knew about publishes the
// script itself had done - and publishing is the reviewer's action, taken in the
// Intercom UI, between sessions. The manifest was stale by default, not by
// accident, and the guard was reading a stale record:
//
//   2026-08-28  collection 01. Four articles the reviewer had published were
//               still recorded as drafts. The next re-run would have sent
//               state: "draft" and taken them off the help centre.
//   2026-08-29  collections 01, 02, 07, 13 and 14. Forty-one live articles, all
//               recorded as drafts. Caught by hand, again.
//
// So the state now comes from Intercom on every run, and the manifest is
// corrected from the same read - self-healing, rather than something a human has
// to remember to reconcile.
//
// The safe direction is always to OMIT `state`: Intercom then keeps whatever it
// has. Every path that cannot establish the live state omits it rather than
// guessing.

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

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Intercom-Version': '2.11',
};

const MANIFEST = 'state/manifest.json';

/**
 * What state Intercom actually holds this article in.
 *
 * Three outcomes, deliberately distinct:
 *   {found: true,  state}  - it is there, and this is its state
 *   {found: false}         - 404. The manifest's id points at nothing
 *   {found: null,  error}  - the lookup itself failed. We know nothing
 */
async function liveState(intercomId) {
  let res;
  try {
    res = await fetch(`https://api.intercom.io/articles/${intercomId}`, { headers: HEADERS });
  } catch (err) {
    return { found: null, error: err.message };
  }
  if (res.status === 404) return { found: false };
  if (!res.ok) return { found: null, error: `HTTP ${res.status}` };
  const body = await res.json();
  return { found: true, state: body.state };
}

/**
 * The work, in a function so a refusal can `return` rather than call
 * process.exit().
 *
 * process.exit() with a fetch still open aborts the process instead of ending
 * it: on Windows under Node 24 it trips a libuv assertion and exits 127, which
 * reads as a crash rather than the deliberate refusal it is. Setting
 * process.exitCode and returning lets the runtime close its handles first.
 */
async function main() {
  const article = JSON.parse(fs.readFileSync(path.join('articles', `${articleId}.json`), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const existing = manifest.articles[articleId];

  let state = stateFlag ?? 'draft';

  if (existing?.intercom_id) {
    const live = await liveState(existing.intercom_id);

    if (live.found === false) {
      // The id points at nothing. PUTting would write into a void, and silently
      // POSTing a replacement would strand whatever the reviewer did with the
      // original. Neither is this script's call to make.
      console.error(`${articleId}: state/manifest.json holds Intercom id ${existing.intercom_id}, `
        + 'and Intercom answers 404 for it.');
      console.error('If the article was deleted on purpose, remove the entry from '
        + `${MANIFEST} and re-run; this script will then create a new one.`);
      process.exitCode = 1;
      return;
    }

    if (live.found === null) {
      // We could not ask. Omitting `state` cannot unpublish anything, so that is
      // what an unknown answer gets.
      console.warn(`${articleId}: could not read the live state from Intercom (${live.error}).`);
      console.warn('Sending no state at all, so whatever Intercom holds is kept.');
      state = stateFlag ?? null;
    } else {
      if (existing.status !== live.state) {
        // The reconcile, and the whole point of the lookup.
        console.log(`${articleId}: manifest said "${existing.status}", Intercom says `
          + `"${live.state}". Going with Intercom.`);
      }
      if (!stateFlag && live.state === 'published') {
        console.log(`${articleId} is already published; leaving its state untouched. `
          + 'Pass --state to change it.');
        state = null;
      }
      if (stateFlag === 'draft' && live.state === 'published') {
        console.warn(`${articleId}: --state draft on a PUBLISHED article. `
          + 'This takes it off the help centre.');
      }
    }
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

  const res = await fetch(url, { method, headers: HEADERS, body: JSON.stringify(payload) });
  const body = await res.json();

  if (!res.ok) {
    console.error(`${method} ${url} -> ${res.status}`);
    console.error(JSON.stringify(body, null, 2).slice(0, 1500));
    process.exitCode = 1;
    return;
  }

  console.log(`${method} -> ${res.status}  id=${body.id}  state=${body.state}  `
    + `parent=${body.parent_id}  "${body.title}"`);

  manifest.articles[articleId] = {
    intercom_id: String(body.id),
    // The article's own public address, as Intercom reports it. Recorded so
    // scripts/build-article.mjs can turn a {{link:<id>|text}} placeholder into a
    // real anchor without a network call and without anybody hand-typing a URL.
    //
    // Only present on a PUBLISHED article: Intercom answers `url: null` for a
    // draft, because a draft has no public address. That is what stops the
    // builder emitting a dead link.
    intercom_url: body.url ?? existing?.intercom_url ?? null,
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
}

await main();

// Read-only audit of what is actually live on the help centre.
//
//   node scripts/audit-live.mjs
//
// READ-ONLY against Intercom - GETs only. Writes nothing, anywhere.
//
// --- Why this exists ------------------------------------------------------
//
// Since 2026-09-02 the run publishes and nobody reads a draft first
// (docs/workflow.md, "Where the review happens"). The only thing standing between
// a bad build and a public article is a check like this one, so it is worth being
// able to ask "is the live help centre what this repo thinks it is?" at any time.
//
// It answers three questions the per-article stages cannot:
//
//   1. **Unresolved cross-references.** Every {{link:}} in every prose source:
//      can the manifest resolve it, and is it an anchor in the built JSON? A
//      placeholder that resolved to nothing renders as a quoted title and fails
//      nothing at build time.
//   2. **Built vs live.** Does each live article carry the anchors and images its
//      built JSON says it should? This is what catches a build that was never
//      published, or a publish that half-landed.
//   3. **The workspace.** Articles Intercom holds that the manifest does not know
//      about, and articles filed in the wrong collection.
//
// Comparison is on COUNTS and TARGETS, never on raw HTML. Intercom rewrites what
// it stores: it rehosts every image, and it turns `<a href="x">` into
// `<a href="x" target="_blank" class="intercom-content-link">`. A regex that
// expects the tag to close right after the href matches nothing and reads as a
// total failure - it cost collection 17 a session.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

const TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
if (!TOKEN) throw new Error('Missing INTERCOM_ACCESS_TOKEN in .env');
const HEADERS = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' };

const manifest = JSON.parse(fs.readFileSync('state/manifest.json', 'utf8')).articles;
const intercom = yaml.parse(fs.readFileSync('config/intercom.yaml', 'utf8'));
const collectionName = {};
for (const [num, c] of Object.entries(intercom.collections)) {
  if (c?.id) collectionName[String(c.id)] = `${num} ${c.name}`;
}

const hrefs = (html) => [...(html || '').matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);
const imgs = (html) => [...(html || '').matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);

let failures = 0;
const fail = (line) => { failures += 1; console.log(`  ${line}`); };

// --- 1: cross-references in the prose sources -------------------------------
console.log('== cross-references ==');
const srcDir = path.join('articles', 'src');
let links = 0, unresolvable = 0, notAnchor = 0;
for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith('.html')).sort()) {
  const id = file.replace(/\.html$/, '');
  const src = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const jsonPath = path.join('articles', `${id}.json`);
  const body = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')).body : '';
  for (const [, target, text] of src.matchAll(/\{\{link:([0-9]+\.[0-9]+)\|(.+?)\}\}/g)) {
    links += 1;
    const row = manifest[target];
    const url = row?.status === 'published' ? row.intercom_url : null;
    if (!url) {
      unresolvable += 1;
      fail(`${id} -> ${target}: not resolvable (${row ? `status ${row.status}, url ${row.intercom_url ?? 'none'}` : 'not in the manifest'})`);
    } else if (!body.includes(`<a href="${url}">${text}</a>`)) {
      notAnchor += 1;
      fail(`${id} -> ${target}: resolvable, but plain text in articles/${id}.json - rebuild it`);
    }
  }
}
console.log(`  ${links} cross-reference(s); ${unresolvable} unresolvable, ${notAnchor} built as plain text`);

// --- 2: built JSON vs what Intercom holds -----------------------------------
console.log('\n== built vs live ==');
let compared = 0;
for (const id of Object.keys(manifest).sort()) {
  const row = manifest[id];
  const jsonPath = `articles/${id}.json`;
  if (!row?.intercom_id || !fs.existsSync(jsonPath)) continue;
  const want = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const res = await fetch(`https://api.intercom.io/articles/${row.intercom_id}`, { headers: HEADERS });
  if (!res.ok) { fail(`${id}: Intercom answered ${res.status} for ${row.intercom_id}`); continue; }
  const live = await res.json();
  compared += 1;

  const wantLinks = hrefs(want.body);
  const liveLinks = hrefs(live.body);
  const missing = wantLinks.filter((u) => !liveLinks.includes(u));
  if (wantLinks.length !== liveLinks.length || missing.length) {
    fail(`${id}: built has ${wantLinks.length} link(s), live has ${liveLinks.length}${missing.length ? ` - missing ${missing.join(', ')}` : ''}`);
  }
  const wantImgs = imgs(want.body).length;
  const liveImgs = imgs(live.body).length;
  if (wantImgs !== liveImgs) fail(`${id}: built has ${wantImgs} image(s), live has ${liveImgs}`);
  if (live.state !== row.status) fail(`${id}: manifest says ${row.status}, Intercom says ${live.state} - run reconcile-manifest.mjs`);
  // A Related list item still carrying a quoted title is an unresolved link that
  // was published.
  for (const m of (live.body || '').matchAll(/<li>\s*"([^"]{10,})"\s*<\/li>/g)) {
    fail(`${id}: live body still shows a quoted title where a link belongs - "${m[1]}"`);
  }
}
console.log(`  ${compared} article(s) compared`);

// --- 3: the workspace -------------------------------------------------------
console.log('\n== workspace ==');
const byIntercomId = {};
for (const [artId, row] of Object.entries(manifest)) byIntercomId[String(row.intercom_id)] = { artId, row };

const all = [];
for (let page = 1; ; page += 1) {
  const res = await fetch(`https://api.intercom.io/articles?per_page=50&page=${page}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET /articles page ${page}: ${res.status}`);
  const body = await res.json();
  all.push(...(body.data ?? []));
  if (!body.pages || page >= body.pages.total_pages) break;
}

const untracked = [];
for (const a of all) {
  const known = byIntercomId[String(a.id)];
  if (!known) { untracked.push(a); continue; }
  const want = String(known.row.intercom_collection_id);
  const got = (a.parent_ids ?? []).map(String);
  if (!got.includes(want)) {
    fail(`${known.artId} (${a.id}) is in collection ${got.join(',') || 'none'}, manifest says ${want} ${collectionName[want] ?? ''}`);
  }
}
const states = {};
for (const a of all) states[a.state] = (states[a.state] ?? 0) + 1;
console.log(`  Intercom holds ${all.length}; manifest knows ${Object.keys(manifest).length}`);
console.log(`  states: ${Object.entries(states).map(([k, v]) => `${k}=${v}`).join(', ')}`);

// Untracked articles are REPORTED, not failed. Two of Intercom's own starter and
// test articles have sat in this workspace since the beginning, in no collection,
// and deleting them needs a human's say-so (docs/workflow.md, one-off setup).
if (untracked.length) {
  console.log(`  ${untracked.length} untracked article(s) - not a failure, but know they are there:`);
  for (const a of untracked) {
    const parents = (a.parent_ids ?? []).map((p) => collectionName[String(p)] ?? String(p));
    console.log(`    ${a.id}  ${a.state.padEnd(9)} ${parents.join(',') || 'NO COLLECTION'}  "${(a.title || '').slice(0, 60)}"`);
  }
}

console.log(`\n${failures ? `${failures} PROBLEM(S)` : 'clean - the live help centre matches this repo'}`);
process.exitCode = failures ? 1 : 0;

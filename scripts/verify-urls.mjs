// Stage 6 of step 2: HEAD every screenshot URL and refuse anything that is not
// a 200 with an image content type.
//
//   node scripts/verify-urls.mjs <commit-sha> <article-dir> [...]
//
// jsDelivr is the primary host. raw.githubusercontent.com is the fallback and it
// throttles bursts by IP, so a failure is retried with a delay before it is
// called broken. A 404 here becomes a permanently broken article, which is why
// this stage exists at all.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const [sha, ...dirs] = process.argv.slice(2);
const REPO = process.env.GITHUB_REPO;
if (!sha || !dirs.length || !REPO) {
  console.error('usage: node scripts/verify-urls.mjs <sha> <screenshots/12/12.1> [...]');
  process.exit(1);
}

const jsdelivr = (p) => `https://cdn.jsdelivr.net/gh/${REPO}@${sha}/${p.split(path.sep).join('/')}`;
const raw = (p) => `https://raw.githubusercontent.com/${REPO}/${sha}/${p.split(path.sep).join('/')}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function head(url, attempt = 1) {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  const ct = res.headers.get('content-type') ?? '';
  if (res.ok && ct.startsWith('image/')) return { ok: true, status: res.status, ct };
  if (attempt < 4) {
    await sleep(attempt * 2500);
    return head(url, attempt + 1);
  }
  return { ok: false, status: res.status, ct };
}

let bad = 0;
const results = [];
for (const dir of dirs) {
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.png')).sort()) {
    const rel = path.join(dir, f);
    let r = await head(jsdelivr(rel));
    let host = 'jsdelivr';
    if (!r.ok) { r = await head(raw(rel)); host = 'raw'; }
    if (!r.ok) bad++;
    results.push({ ok: r.ok, host, status: r.status, ct: r.ct, url: r.ok && host === 'jsdelivr' ? jsdelivr(rel) : raw(rel) });
    console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.status} ${r.ct.padEnd(10)} ${host.padEnd(9)} ${rel}`);
  }
}
fs.writeFileSync('.verified-urls.json', JSON.stringify(results, null, 2));
console.log(`\n${results.length} URLs, ${bad} broken`);
process.exit(bad ? 1 : 0);

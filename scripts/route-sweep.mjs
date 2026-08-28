// Route sweep: pull the app's own route names and API paths out of its JS chunks.
// Read-only. Writes nothing into the repo.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const APP = process.env.SCORYBOARD_APP_BASE.replace(/\/$/, '');
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const html = await (await fetch(APP + '/')).text();
const seen = new Set();
const queue = [...html.matchAll(/\/_next\/static\/[^"'\s)]+?\.js/g)].map((m) => m[0]);
console.log('chunks referenced by /:', queue.length);

const bodies = [];
while (queue.length) {
  const c = queue.shift();
  if (seen.has(c)) continue;
  seen.add(c);
  const res = await fetch(APP + c);
  if (!res.ok) continue;
  const body = await res.text();
  bodies.push([c, body]);
  fs.writeFileSync(path.join(OUT, c.split('/').pop()), body);
  // follow one level down
  for (const m of body.matchAll(/"static\/chunks\/[^"]+?\.js"/g)) {
    const p = '/_next/' + m[0].slice(1, -1);
    if (!seen.has(p)) queue.push(p);
  }
}
console.log('chunks downloaded:', seen.size);

const all = bodies.map(([, b]) => b).join('\n');
const lits = new Set();
for (const m of all.matchAll(/["'`](\/[a-zA-Z0-9_\-/:[\]{}.$]{2,60})["'`]/g)) lits.add(m[1]);

const routes = [...lits].filter((s) => !s.startsWith('/_next') && !s.includes('.') && !s.startsWith('//')).sort();
fs.writeFileSync(path.join(OUT, '_paths.txt'), routes.join('\n'));
console.log('distinct path literals:', routes.length, '->', path.join(OUT, '_paths.txt'));

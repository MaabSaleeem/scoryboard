#!/usr/bin/env node
// One-off bootstrap: create the 24 help centre collections in Intercom and write
// their ids back into config/intercom.yaml.
//
//   node scripts/bootstrap-intercom-collections.mjs --dry-run
//   node scripts/bootstrap-intercom-collections.mjs
//
// Idempotent: a row that already has an id is skipped, so a partial run can be
// finished by running it again. Order of creation sets the help centre's sidebar
// order, so it walks 01 to 24 in sequence rather than in parallel.
//
// API: POST https://api.intercom.io/help_center/collections
//      required: name. optional: description, parent_id, help_center_id (integer).
// No dependencies - Node 20+ has fetch, and intercom.yaml is parsed line by line.

import { readFileSync, writeFileSync } from 'node:fs';

const DRY_RUN = process.argv.includes('--dry-run');
const ENV_PATH = '.env';
const YAML_PATH = 'config/intercom.yaml';
const API = 'https://api.intercom.io/help_center/collections';
const VERSION = '2.14';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

// config/intercom.yaml is flat and machine-generated. Walk it rather than pull in
// a YAML dependency: "<id>:" then name: then id: , two spaces deeper.
function parseCollections(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const key = lines[i].match(/^ {2}"(\d{2})":\s*$/);
    if (key) {
      current = { key: key[1], name: null, id: null, idLine: null };
      rows.push(current);
      continue;
    }
    if (!current) continue;
    const name = lines[i].match(/^ {4}name:\s*"(.*)"\s*$/);
    if (name) current.name = name[1].replace(/\\"/g, '"');
    const id = lines[i].match(/^ {4}id:\s*"(.*)"\s*$/);
    if (id) {
      current.id = id[1];
      current.idLine = i;
    }
  }
  return { lines, rows };
}

const env = loadEnv(ENV_PATH);
const token = env.INTERCOM_ACCESS_TOKEN;
const helpCenterId = Number(env.INTERCOM_HELP_CENTER_ID);
if (!token) throw new Error('INTERCOM_ACCESS_TOKEN missing from .env');
if (!helpCenterId) throw new Error('INTERCOM_HELP_CENTER_ID missing from .env');

const original = readFileSync(YAML_PATH, 'utf8');
const { lines, rows } = parseCollections(original);

const todo = rows.filter((r) => !r.id);
const done = rows.filter((r) => r.id);
console.log(`${rows.length} collections in ${YAML_PATH}: ${done.length} already have an id, ${todo.length} to create`);
for (const r of rows) if (!r.name || r.idLine === null) throw new Error(`could not parse row ${r.key}`);

if (DRY_RUN) {
  for (const r of todo) console.log(`  would POST ${JSON.stringify({ name: r.name, help_center_id: helpCenterId })}`);
  process.exit(0);
}

let created = 0;
for (const r of todo) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Intercom-Version': VERSION,
    },
    body: JSON.stringify({ name: r.name, help_center_id: helpCenterId }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.id) {
    console.error(`FAILED ${r.key} ${r.name}: HTTP ${res.status} ${JSON.stringify(body)}`);
    console.error('Stopping. Ids created so far are written below; re-run to finish.');
    break;
  }
  lines[r.idLine] = `    id: "${body.id}"`;
  created++;
  console.log(`  ${r.key} ${r.name} -> ${body.id} (order ${body.order})`);
}

if (created > 0) {
  writeFileSync(YAML_PATH, lines.join('\n'), 'utf8');
  console.log(`\nWrote ${created} id(s) into ${YAML_PATH}`);
} else {
  console.log('\nNothing created, file untouched');
}

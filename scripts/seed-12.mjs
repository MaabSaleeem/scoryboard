// Idempotent seed for collection 12 - "Tournaments - setting one up".
//
//   node scripts/seed-12.mjs
//
// Safe to re-run. Every entity is looked up by its fixed name and only created
// when missing; strays that match the collection's naming prefix are removed.
// Nothing here uses a clock or a random value, so the fixtures a spec sees on
// Tuesday are the ones it saw on Monday.
//
// Naming: every fixture is "KB 12 ..." or kb-12-...@yopmail.com, except the
// shared organiser persona and the two tournaments, "KB Cup" and "KB New Cup".
// No other collection uses those names.

import { admin, asUser, mintSession, j } from '../lib/api.mjs';

const ORGANISER = 'kb-organiser@yopmail.com';
const SUPPORTING = [
  { email: 'kb-12-admin@yopmail.com', name: 'Ada' },     // tournament admin on KB Cup
  { email: 'kb-12-outsider@yopmail.com', name: 'Otto' }, // no relationship to any fixture
];

const ids = {};
const note = (method, path, status, detail) =>
  console.log(`${method.padEnd(6)} ${path} -> ${status}  ${detail ?? ''}`);

// --- 1. accounts ------------------------------------------------------------
for (const p of [{ email: ORGANISER, name: 'Oona' }, ...SUPPORTING]) {
  const res = await admin('/admins/users', {
    method: 'POST',
    body: { name: p.name, lastName: 'KB', email: p.email },
  });
  note('POST', '/admins/users', res.status,
    res.ok ? `${p.email} uid=${res.body.data.uid}` : `${p.email} already exists - reused`);
}

const session = await mintSession(ORGANISER);
const T = session.idToken;
const me = (await asUser(T, '/users/me')).body.data;
ids.organiser = { userId: me.id, playerId: me.playerId, uid: me.uid };
note('GET', '/users/me', 200, `organiser id=${me.id} playerId=${me.playerId}`);

// --- 2. Pro membership and the Tournament Pro allowance ---------------------
let r = await admin(`/admins/change-user-membership/${me.id}`, {
  method: 'POST', body: { membership: 'Pro' },
});
note('POST', `/admins/change-user-membership/${me.id}`, r.status, 'membership=Pro');

// The grant is ADDITIVE, not a set, and there is no revoke. Only top up when the
// remaining allowance is below the target, or a second run doubles it.
const PRO_SLOTS = 4;
const shortfall = PRO_SLOTS - (me.freeTournamentProAllowanceRemaining ?? 0);
if (shortfall > 0) {
  r = await admin('/admins/users/tournament-free-pro/grant', {
    method: 'POST', body: { email: ORGANISER, plan: 'Pro', quantity: shortfall },
  });
  note('POST', '/admins/users/tournament-free-pro/grant', r.status,
    r.ok ? `total=${r.body.data.totalQuantity} remaining=${r.body.data.remainingQuantity}` : '');
} else {
  note('GET', '/users/me', 200,
    `Tournament Pro slots already ${me.freeTournamentProAllowanceRemaining} - no grant needed`);
}

// --- 3. venues --------------------------------------------------------------
// The wizard's club picker calls GET /club-locations?tournamentSelectionOnly=true
// and only lists venues created with BOTH isTournament and
// saveForFutureTournaments true. The plain ?query= listing is disjoint from it.
const VENUES = [
  { name: 'KB 12 Astro Park', location: 'Hackney, London' },
  { name: 'KB 12 Riverside 3G', location: 'Bermondsey, London' },
];
const WANTED_VENUES = new Set(VENUES.map((v) => v.name));

const allKbVenues = [
  ...((await asUser(T, '/club-locations?query=KB%2012')).body.data ?? []),
  ...((await asUser(T, '/club-locations?tournamentSelectionOnly=true')).body.data ?? []),
].filter((v) => v.name.startsWith('KB 12 '));

const selectable = ((await asUser(T, '/club-locations?tournamentSelectionOnly=true')).body.data ?? [])
  .filter((v) => WANTED_VENUES.has(v.name));
const keepVenue = new Map();
for (const v of selectable) if (!keepVenue.has(v.name)) keepVenue.set(v.name, v.id);

for (const v of allKbVenues) {
  if (keepVenue.get(v.name) === v.id) continue;
  const del = await asUser(T, `/club-locations/${v.id}`, { method: 'DELETE' });
  note('DELETE', `/club-locations/${v.id}`, del.status, `stale venue "${v.name}"`);
}

ids.venues = {};
for (const v of VENUES) {
  if (keepVenue.has(v.name)) {
    ids.venues[v.name] = keepVenue.get(v.name);
    note('GET', '/club-locations', 200, `${v.name} exists ${keepVenue.get(v.name)}`);
    continue;
  }
  const res = await asUser(T, '/club-locations', {
    method: 'POST',
    body: { ...v, saveForFutureTournaments: true, isTournament: true },
  });
  ids.venues[v.name] = res.body.data.id;
  note('POST', '/club-locations', res.status, `${v.name} = ${res.body.data.id}`);
}

// --- 4. tournaments ---------------------------------------------------------
// Two fixtures, and they must stay two: every tournament created burns one of the
// organiser's Tournament Pro slots and the slot cannot be given back.
//
//   KB Cup      - fully configured. 8 teams, Round Robin, 2 groups of 4, one
//                 encounter, one invited team owner, one tournament admin.
//   KB New Cup  - created and nothing else. The state a tournament is in the
//                 second after the Create Tournament modal closes.
const TEAM_NAMES = ['KB 12 Reds', 'KB 12 Blues', 'KB 12 Greens', 'KB 12 Yellows',
                    'KB 12 Whites', 'KB 12 Blacks', 'KB 12 Purples', 'KB 12 Oranges'];

const existing = (await asUser(T, '/tournaments')).body.data ?? [];

async function ensureTournament(title, startDate) {
  const found = existing.find((t) => t.title === title);
  if (found) {
    const id = found._id ?? found.id;
    note('GET', '/tournaments', 200, `${title} exists ${id}`);
    return id;
  }
  const res = await asUser(T, '/tournaments', {
    method: 'POST',
    body: {
      title,
      gameType: 'Football',
      startDate,
      duration: '10 min',
      clubLocationIds: [ids.venues['KB 12 Astro Park']],
      isAutoStartEnable: false,
      startTime: '10:00',
      // Pinned. The app sends the browser's own zone here, which would otherwise
      // differ per machine and shift every rendered kick-off time.
      timeZone: 'Europe/London',
    },
  });
  note('POST', '/tournaments', res.status, `${title} = ${res.body.data.id}`);
  return res.body.data.id;
}

ids.tournaments = {};
ids.tournaments['KB Cup'] = await ensureTournament('KB Cup', '2026-09-19');
ids.tournaments['KB New Cup'] = await ensureTournament('KB New Cup', '2026-09-26');

const cup = ids.tournaments['KB Cup'];
let cupState = (await asUser(T, `/tournaments/${cup}`)).body.data;

// KB Cup: teams
const missingTeams = TEAM_NAMES.filter((n) => !cupState.teams.some((t) => t.name === n));
if (missingTeams.length) {
  r = await asUser(T, `/tournaments/${cup}/teams/bulk`, {
    method: 'POST', body: { teamNames: missingTeams },
  });
  note('POST', `/tournaments/${cup}/teams/bulk`, r.status, missingTeams.join(', '));
  cupState = (await asUser(T, `/tournaments/${cup}`)).body.data;
} else {
  note('GET', `/tournaments/${cup}`, 200, `all ${TEAM_NAMES.length} teams already present`);
}
ids.tournamentTeams = Object.fromEntries(cupState.teams.map((t) => [t.name, t.id]));

// KB Cup: format. Saving the format is what generates the groups and the fixtures.
if (!cupState.format) {
  r = await asUser(T, `/tournaments/${cup}`, {
    method: 'PUT',
    body: {
      teamCount: 8,
      teamSize: '5 VS 5',
      teamIds: TEAM_NAMES.map((n) => ids.tournamentTeams[n]),
      isComplete: true,
      format: 'RoundRobin',
      groupCount: 2,
      teamsPerGroup: 4,
      matchesPerTeam: 1,
      autoScheduleMatchesNextDay: true,
      status: 'Published',
    },
  });
  note('PUT', `/tournaments/${cup}`, r.status, 'RoundRobin, 2 groups of 4, 1 encounter');
} else {
  note('GET', `/tournaments/${cup}`, 200, `format already ${cupState.format}`);
}

// KB Cup: an owner invited onto one team, so 12.5 has a team with a pending owner.
const redsId = ids.tournamentTeams['KB 12 Reds'];
const reds = ((await asUser(T, `/teams/${redsId}/players?includeFans=true`)).body.data ?? [])
  .filter((tp) => !tp.isDeleted);
if (!reds.some((tp) => tp.player?.name === 'Tess Owner')) {
  r = await asUser(T, '/team-players', {
    method: 'POST',
    body: { name: 'Tess Owner', email: 'kb-12-team-owner@yopmail.com', teamId: redsId, role: 'Owner' },
  });
  note('POST', '/team-players', r.status, 'KB 12 Reds owner invite = Tess Owner');
} else {
  note('GET', `/teams/${redsId}/players`, 200, 'KB 12 Reds already has an invited owner');
}

// KB Cup: exactly one tournament admin, and exactly two referees.
// Both lists come back on GET /tournaments/:id as adminPlayers and refereePlayers.
cupState = (await asUser(T, `/tournaments/${cup}`)).body.data;

const WANTED_ADMIN = 'kb-12-admin@yopmail.com';
for (const a of cupState.adminPlayers ?? []) {
  if (a.email === WANTED_ADMIN) continue;
  r = await asUser(T, `/tournaments/${cup}/admin`, { method: 'DELETE', body: { email: a.email } });
  note('DELETE', `/tournaments/${cup}/admin`, r.status, `stray admin ${a.email}`);
}
if (!(cupState.adminPlayers ?? []).some((a) => a.email === WANTED_ADMIN)) {
  r = await asUser(T, `/tournaments/${cup}/admin`, { method: 'POST', body: { email: WANTED_ADMIN } });
  note('POST', `/tournaments/${cup}/admin`, r.status, WANTED_ADMIN);
} else {
  note('GET', `/tournaments/${cup}`, 200, `admin ${WANTED_ADMIN} already added`);
}

// "Rae Whistle" can start and end matches, "Sam Flag" cannot, so 12.9 can show
// both sides of the permission toggle without editing anything mid-capture.
const WANTED_REFS = [
  { name: 'Rae Whistle', canStartEndMatches: true },
  { name: 'Sam Flag', canStartEndMatches: false },
];
const wantedRefNames = new Set(WANTED_REFS.map((x) => x.name));
for (const rp of cupState.refereePlayers ?? []) {
  const wanted = WANTED_REFS.find((x) => x.name === rp.name);
  const isDuplicate = (cupState.refereePlayers ?? []).filter((x) => x.name === rp.name)[0]?.id !== rp.id;
  if (wanted && !isDuplicate && rp.canStartEndMatches === wanted.canStartEndMatches) continue;
  r = await asUser(T, `/tournaments/${cup}/referee/${rp.id}`, { method: 'DELETE' });
  note('DELETE', `/tournaments/${cup}/referee/${rp.id}`, r.status,
    wantedRefNames.has(rp.name) ? `re-adding ${rp.name} with the right permission` : `stray referee ${rp.name}`);
}
cupState = (await asUser(T, `/tournaments/${cup}`)).body.data;
for (const ref of WANTED_REFS) {
  if ((cupState.refereePlayers ?? []).some((x) => x.name === ref.name)) {
    note('GET', `/tournaments/${cup}`, 200, `referee ${ref.name} already added`);
    continue;
  }
  r = await asUser(T, `/tournaments/${cup}/referee`, { method: 'POST', body: ref });
  note('POST', `/tournaments/${cup}/referee`, r.status,
    `${ref.name} canStartEndMatches=${ref.canStartEndMatches}`);
}

// KB New Cup must stay untouched - no teams, no format, no referees, no admins.
// Anything found on it is a leftover from a previous exploration.
const fresh = (await asUser(T, `/tournaments/${ids.tournaments['KB New Cup']}`)).body.data;
for (const rp of fresh.refereePlayers ?? []) {
  r = await asUser(T, `/tournaments/${fresh.id}/referee/${rp.id}`, { method: 'DELETE' });
  note('DELETE', `/tournaments/${fresh.id}/referee/${rp.id}`, r.status, `KB New Cup must be empty (${rp.name})`);
}
for (const a of fresh.adminPlayers ?? []) {
  r = await asUser(T, `/tournaments/${fresh.id}/admin`, { method: 'DELETE', body: { email: a.email } });
  note('DELETE', `/tournaments/${fresh.id}/admin`, r.status, `KB New Cup must be empty (${a.email})`);
}
if ((fresh.teams ?? []).length || fresh.format) {
  console.log(`\nWARNING: "KB New Cup" (${fresh.id}) has ${fresh.teams?.length ?? 0} teams and format ` +
    `${fresh.format ?? 'none'}. It must be an untouched tournament. Delete it and re-run:\n` +
    `  DELETE /tournaments/${fresh.id}`);
}

ids.referees = Object.fromEntries(
  ((await asUser(T, `/tournaments/${cup}`)).body.data.refereePlayers ?? []).map((x) => [x.name, x.id]));

console.log('\n--- IDs ---');
console.log(j(ids));

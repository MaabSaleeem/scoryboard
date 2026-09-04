// Idempotent seed for collection 22 - "Venues & club locations".
//
//   node scripts/seed-22.mjs
//   node scripts/seed-22.mjs --rebuild     # delete both accounts first
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the two addresses in lib/fixtures-22.mjs and the
// entities those accounts own.
//
// --- Reconciled, and swept --------------------------------------------------
//
// Both accounts, their memberships and profiles, Mo's three venues, the
// tournament, Ana's admin row and the two tournament-only venues are all
// looked up before they are written. A second run makes no writes to any of
// them.
//
// Anything else the two accounts hold is deleted: a venue that is not in the
// fixture file, a tournament of Mo's that is not KB 22 Cup. 22.1 photographs
// the Locations list on Profile settings and the venue list on the match form,
// and both show every venue the account holds, so a stray venue changes the
// capture. Step 1's probes left a dozen behind; this is what cleared them.
//
// --- The clock --------------------------------------------------------------
//
// The tournament starts on a FIXED future date that the settings page prints.
// The seed refuses to run once it has passed: a tournament whose start date
// arrives changes state on its own (collections 13 and 15).

import 'dotenv/config';
import { admin, asUser, mintSession } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, PROFILE_FIELDS, VENUES, SAVED_VENUE, ONE_OFF_VENUES,
  TOURNAMENT, CREATOR_ONLY_MESSAGE,
} from '../lib/fixtures-22.mjs';

const REBUILD = process.argv.includes('--rebuild');

let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(60)} -> ${status}  ${detail ?? ''}`);
};
const fail = (what, r) => {
  throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
};

if (Date.parse(`${TOURNAMENT.startDate}T00:00:00.000Z`) <= Date.now()) {
  throw new Error(
    `TOURNAMENT.startDate ${TOURNAMENT.startDate} has passed. 22.2 photographs a tournament that has not started:\n` +
    'move startDate forward in lib/fixtures-22.mjs (and TOURNAMENT_DATE_SHOWN with it), run\n' +
    'node scripts/seed-22.mjs --rebuild, then re-run specs/22/22.2.spec.ts.',
  );
}

/** The account's Scoryboard user plus a session token, or null if there is none. */
async function lookup(email) {
  try {
    const session = await mintSession(email);
    const me = (await asUser(session.idToken, '/users/me')).body?.data ?? null;
    return me ? { ...me, token: session.idToken, email } : null;
  } catch {
    return null;
  }
}

async function ensureAccount(key) {
  const email = ACCOUNTS[key];
  const { name, membership } = PROFILES[key];

  if (REBUILD) {
    const existing = await lookup(email);
    if (existing) {
      const r = await admin(`/admins/user-delete/${existing.id}`, { method: 'DELETE' });
      note('DELETE', `/admins/user-delete/${existing.id}`, r.status, `${key} torn down`);
    }
  }

  let me = await lookup(email);
  if (!me) {
    const r = await admin('/admins/users', { method: 'POST', body: { name, lastName: 'KB', email } });
    if (!r.ok) fail(`create ${email}`, r);
    note('POST', '/admins/users', r.status, `${key} ${email}`);
    me = await lookup(email);
    if (!me) fail(`lookup after create ${email}`, { status: 0, body: null });
  } else {
    note('GET', '/users/me', 200, `${key} exists ${me.id} ${me.membership}`);
  }

  if (me.membership !== membership) {
    const r = await admin(`/admins/change-user-membership/${me.id}`, {
      method: 'POST', body: { membership },
    });
    if (!r.ok) fail(`membership ${email}`, r);
    note('POST', `/admins/change-user-membership/${me.id}`, r.status, `-> ${membership}`);
    me.membership = membership;
  }
  return me;
}

/**
 * The whole profile, in one PUT. `PUT /users/:userId` is a full REPLACE
 * (config/api.md, "Users"), so the bio and `isTourCompleted` ride together.
 * Profile settings is 22.1's page, and an admin-created account with empty
 * gender, sports and position prints "3 highlighted fields are still missing"
 * at the top of it. Only written when the account is not already as fixture.
 */
async function ensureProfile(user) {
  const details = (await asUser(user.token, `/players/${user.playerId}?all=true`)).body?.data ?? {};
  const ok = user.isTourCompleted === true
    && (details.bio ?? '') === ''
    && details.playerGender === PROFILE_FIELDS.gender
    && (details.sports ?? []).join() === PROFILE_FIELDS.sports.join()
    && details.playerPosition === PROFILE_FIELDS.position;
  if (ok) {
    note('GET', `/players/${user.playerId}?all=true`, 200, `${user.email} profile already as fixture`);
    return;
  }
  const r = await asUser(user.token, `/users/${user.id}`, {
    method: 'PUT',
    body: {
      name: user.name,
      lastName: user.lastName,
      ...PROFILE_FIELDS,
      isMarketingOpted: user.isMarketingOpted ?? true,
      isTourCompleted: true,
      bio: '',
    },
  });
  if (!r.ok) fail(`set profile ${user.email}`, r);
  note('PUT', `/users/${user.id}`, r.status, `${user.email} profile fields set, tour dismissed`);
}

// --- venues -------------------------------------------------------------------

const list = async (user, qs = '') => (await asUser(user.token, `/club-locations${qs}`)).body?.data ?? [];
const plainVenues = (user) => list(user);
const savedVenues = (user) => list(user, '?tournamentSelectionOnly=true');
const tournamentVenues = (user, tid) => list(user, `?tournamentId=${tid}`);

async function deleteVenue(actors, v, why) {
  // Only the creator may delete (403 otherwise), and a tournament's list mixes
  // the Owner's venues with the Admin's, so try each account in turn.
  for (const user of actors) {
    const r = await asUser(user.token, `/club-locations/${v.id}`, { method: 'DELETE' });
    if (r.ok) { note('DELETE', `/club-locations/${v.id}`, r.status, `"${v.name}" ${why} (as ${user.name})`); return; }
    if (r.status !== 403) fail(`delete venue ${v.name}`, r);
  }
  throw new Error(`nobody could delete venue "${v.name}" ${v.id}`);
}

/**
 * One venue of `user`'s, matched by name in the list its flags put it in, and
 * brought to the fixture's location and flags if it drifted.
 */
async function ensureVenue(user, spec) {
  const rows = spec.isTournament && spec.saveForFutureTournaments ? await savedVenues(user) : await plainVenues(user);
  const hit = rows.find((v) => v.name === spec.name);
  if (hit) {
    const full = (await asUser(user.token, `/club-locations/${hit.id}`)).body?.data ?? {};
    const same = full.location === spec.location
      && !!full.isTournament === !!spec.isTournament
      && !!full.saveForFutureTournaments === !!spec.saveForFutureTournaments;
    if (same) { note('GET', '/club-locations', 200, `"${spec.name}" exists ${hit.id}`); return hit.id; }
    const r = await asUser(user.token, `/club-locations/${hit.id}`, { method: 'PUT', body: { ...spec } });
    if (!r.ok) fail(`update venue ${spec.name}`, r);
    note('PUT', `/club-locations/${hit.id}`, r.status, `"${spec.name}" brought back to fixture`);
    return hit.id;
  }
  const r = await asUser(user.token, '/club-locations', { method: 'POST', body: { ...spec } });
  if (!r.ok) fail(`create venue ${spec.name}`, r);
  note('POST', '/club-locations', r.status, `"${spec.name}" ${r.body.data.id}`);
  return r.body.data.id;
}

/** A tournament-only venue on `tid`, created by `user` with the tournament id so it attaches on creation. */
async function ensureOneOff(user, tid, spec) {
  const hit = (await tournamentVenues(user, tid)).find((v) => v.name === spec.name);
  if (hit) { note('GET', `/club-locations?tournamentId=${tid}`, 200, `"${spec.name}" exists ${hit.id}`); return hit.id; }
  const r = await asUser(user.token, '/club-locations', {
    method: 'POST',
    body: { ...spec, isTournament: true, saveForFutureTournaments: false, tournamentId: tid },
  });
  if (!r.ok) fail(`create one-off venue ${spec.name}`, r);
  note('POST', '/club-locations', r.status, `"${spec.name}" ${r.body.data.id} on ${tid} (as ${user.name})`);
  return r.body.data.id;
}

/** Delete every venue in `user`'s personal lists whose name is not in `keep`. */
async function sweepPersonalVenues(user, keep) {
  const rows = [...await plainVenues(user), ...await savedVenues(user)];
  for (const v of rows) {
    if (keep.has(v.name)) continue;
    await deleteVenue([user], v, 'is not a fixture');
  }
}

// --- tournament ---------------------------------------------------------------

async function ensureTournament(owner, adminUser, savedId) {
  const rows = (await asUser(owner.token, '/tournaments')).body?.data ?? [];
  // Stray tournaments first: their venues, then the tournament itself.
  for (const t of rows.filter((x) => x.isOwner && x.title !== TOURNAMENT.title)) {
    const id = t._id ?? t.id;
    for (const v of await tournamentVenues(owner, id)) {
      if (v.name === SAVED_VENUE.name) continue;
      await deleteVenue([owner, adminUser], v, `was on stray tournament "${t.title}"`);
    }
    const r = await asUser(owner.token, `/tournaments/${id}`, { method: 'DELETE' });
    if (!r.ok) fail(`delete stray tournament ${t.title}`, r);
    note('DELETE', `/tournaments/${id}`, r.status, `"${t.title}" is not a fixture`);
  }
  let hit = rows.find((x) => x.isOwner && x.title === TOURNAMENT.title);
  let id = hit?._id ?? hit?.id;
  if (id) {
    note('GET', '/tournaments', 200, `"${TOURNAMENT.title}" exists ${id}`);
  } else {
    const r = await asUser(owner.token, '/tournaments', {
      method: 'POST', body: { ...TOURNAMENT, clubLocationIds: [savedId] },
    });
    if (!r.ok) fail('create tournament', r);
    id = r.body.data.id ?? r.body.data._id;
    note('POST', '/tournaments', r.status, `"${TOURNAMENT.title}" ${id}`);
  }
  const detail = (await asUser(owner.token, `/tournaments/${id}`)).body?.data ?? {};
  if (detail.startDate && !String(detail.startDate).startsWith(TOURNAMENT.startDate)) {
    throw new Error(`"${TOURNAMENT.title}" starts ${detail.startDate}, fixture says ${TOURNAMENT.startDate} - run with --rebuild`);
  }
  const onIt = (detail.clubLocations ?? []).map((c) => c.id);
  if (!onIt.includes(savedId)) {
    const r = await asUser(owner.token, `/tournaments/${id}`, { method: 'PUT', body: { clubLocationIds: [...onIt, savedId] } });
    if (!r.ok) fail('attach saved venue', r);
    note('PUT', `/tournaments/${id}`, r.status, `${SAVED_VENUE.name} attached`);
  }
  return id;
}

async function ensureAdmin(owner, tid, adminUser) {
  const seen = (await asUser(adminUser.token, `/tournaments/${tid}`)).body?.data;
  if (seen?.isAdmin) { note('GET', `/tournaments/${tid}`, 200, `${adminUser.email} already Admin`); return; }
  const r = await asUser(owner.token, `/tournaments/${tid}/admin`, { method: 'POST', body: { email: adminUser.email } });
  if (!r.ok) fail('add admin', r);
  note('POST', `/tournaments/${tid}/admin`, r.status, adminUser.email);
  const after = (await asUser(adminUser.token, `/tournaments/${tid}`)).body?.data;
  if (!after?.isAdmin) throw new Error(`${adminUser.email} does not read ${TOURNAMENT.title} as Admin`);
}

/** Delete every venue on the tournament that is not one of the three fixtures. */
async function sweepTournamentVenues(owner, adminUser, tid, keep) {
  for (const v of await tournamentVenues(owner, tid)) {
    if (keep.has(v.name)) continue;
    await deleteVenue([owner, adminUser], v, 'is not a fixture on the tournament');
  }
}

// --- run ----------------------------------------------------------------------

const owner = await ensureAccount('owner');
const adminUser = await ensureAccount('admin');
await ensureProfile(owner);
await ensureProfile(adminUser);

const astroId = await ensureVenue(owner, VENUES.astro);
const parkId = await ensureVenue(owner, VENUES.park);
const savedId = await ensureVenue(owner, SAVED_VENUE);
await sweepPersonalVenues(owner, new Set([VENUES.astro.name, VENUES.park.name, SAVED_VENUE.name]));
await sweepPersonalVenues(adminUser, new Set());

const tid = await ensureTournament(owner, adminUser, savedId);
await ensureAdmin(owner, tid, adminUser);
const overflowId = await ensureOneOff(owner, tid, ONE_OFF_VENUES.owner);
const adminPitchId = await ensureOneOff(adminUser, tid, ONE_OFF_VENUES.admin);
await sweepTournamentVenues(owner, adminUser, tid, new Set([SAVED_VENUE.name, ONE_OFF_VENUES.owner.name, ONE_OFF_VENUES.admin.name]));

// --- verify -------------------------------------------------------------------

const names = (rows) => rows.map((v) => v.name).sort().join(', ');
const plain = names(await plainVenues(owner));
if (plain !== [VENUES.astro.name, VENUES.park.name].sort().join(', ')) throw new Error(`Mo's plain venues are [${plain}]`);
const saved = names(await savedVenues(owner));
if (saved !== SAVED_VENUE.name) throw new Error(`Mo's saved venues are [${saved}]`);
const onTournament = names(await tournamentVenues(owner, tid));
const wanted = [SAVED_VENUE.name, ONE_OFF_VENUES.owner.name, ONE_OFF_VENUES.admin.name].sort().join(', ');
if (onTournament !== wanted) throw new Error(`${TOURNAMENT.title} holds [${onTournament}], expected [${wanted}]`);
if ((await plainVenues(adminUser)).length || (await savedVenues(adminUser)).length) throw new Error('Ana holds venues of her own; she must not');
// The one-off venues are invisible outside the tournament - the thing 22.2 says.
if (plain.includes(ONE_OFF_VENUES.owner.name) || saved.includes(ONE_OFF_VENUES.owner.name)) throw new Error('the one-off venue leaked into a personal list');
// Only the creator may edit - the check, not a write.
const crossA = await asUser(adminUser.token, `/club-locations/${overflowId}`, { method: 'PUT', body: { ...ONE_OFF_VENUES.owner } });
if (crossA.status !== 403 || crossA.body?.reason !== CREATOR_ONLY_MESSAGE) throw new Error(`Ana's PUT on Mo's venue answered ${crossA.status} ${JSON.stringify(crossA.body)}`);
const crossB = await asUser(owner.token, `/club-locations/${adminPitchId}`, { method: 'PUT', body: { ...ONE_OFF_VENUES.admin } });
if (crossB.status !== 403) throw new Error(`Mo's PUT on Ana's venue answered ${crossB.status}`);
note('PUT', `/club-locations/${overflowId}`, crossA.status, `as Ana - "${crossA.body.reason}" (the check, not a write)`);
writes -= 1;

console.log('\n--- collection 22 fixture ---');
console.log(`owner    ${ACCOUNTS.owner.padEnd(32)} user ${owner.id}  player ${owner.playerId}  Pro`);
console.log(`admin    ${ACCOUNTS.admin.padEnd(32)} user ${adminUser.id}  player ${adminUser.playerId}  Free, Admin of ${TOURNAMENT.title}`);
console.log(`venue    ${VENUES.astro.name.padEnd(32)} ${astroId}  Mo's, plain`);
console.log(`venue    ${VENUES.park.name.padEnd(32)} ${parkId}  Mo's, plain`);
console.log(`venue    ${SAVED_VENUE.name.padEnd(32)} ${savedId}  Mo's, tournament + saved`);
console.log(`venue    ${ONE_OFF_VENUES.owner.name.padEnd(32)} ${overflowId}  Mo's, tournament-only on ${TOURNAMENT.title}`);
console.log(`venue    ${ONE_OFF_VENUES.admin.name.padEnd(32)} ${adminPitchId}  Ana's, tournament-only on ${TOURNAMENT.title}`);
console.log(`tourn    ${TOURNAMENT.title.padEnd(32)} ${tid}  starts ${TOURNAMENT.startDate} ${TOURNAMENT.startTime}`);
console.log(`\n${writes} write(s).`);

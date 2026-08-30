// Idempotent seed for collection 05 - "Friends".
//
//   node scripts/seed-05.mjs
//   node scripts/seed-05.mjs --rebuild     # delete the four accounts first
//
// Safe to re-run. Every account, team, friend and team membership is read
// before it is written, so a second run makes zero writes. Nothing here reads a
// clock, a random value or a mailbox.
//
// Accounts are isolated per collection (config/personas.yaml,
// account_isolation). This script touches ONLY the four addresses in
// lib/fixtures-05.mjs.
//
// --- what this collection needs, and why -----------------------------------
//
// The friends list is the whole subject, so its CONTENTS and its ORDER are the
// fixture. GET /friends comes back in record-creation order, so the seed builds
// the five rows in the order lib/fixtures-05.mjs lists them and deletes
// anything else. Three of the five differ in kind, and every difference is
// something an article photographs:
//
//   * a name-only friend has a live Edit control and a share code;
//   * a friend linked to a real account has neither - Edit is greyed out and
//     GET /friends/:id/shareCode answers 400 - but its Chat button works;
//   * a friend already on one of your teams is the one the Free plan refuses to
//     put on a second.
//
// The seed also deletes the two teams every account is born with. Their names
// are derived from the account name and carry a DATE suffix when they clash -
// "Marc K FC 3008" - and 05.1 photographs the Select Team dropdown.
//
// --- the repair this seed exists for ---------------------------------------
//
// 05.1's spec photographs the ONE_FRIEND_PER_TEAM refusal, and that refusal
// soft-deletes the friend record (config/api.md, observed 2026-08-30). The spec
// puts it back itself. If it dies between the two, this seed is the recovery:
// it re-creates the missing friend and re-adds their player to the team, and it
// prunes the team player rows left behind by any earlier record.

import 'dotenv/config';
import { admin, asUser, mintSession, j } from '../lib/api.mjs';
import { ACCOUNTS, PROFILES, TEAMS, FRIENDS, NEW_FRIEND } from '../lib/fixtures-05.mjs';

const REBUILD = process.argv.includes('--rebuild');

const note = (method, path, status, detail) =>
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(44)} -> ${status}  ${detail ?? ''}`);

/** The account's Scoryboard user plus a session token, or null if there is none. */
async function lookup(email) {
  try {
    const session = await mintSession(email);
    const me = (await asUser(session.idToken, '/users/me')).body?.data ?? null;
    return me ? { ...me, token: session.idToken } : null;
  } catch {
    return null;
  }
}

async function ensureAccount(key) {
  const email = ACCOUNTS[key];
  const profile = PROFILES[key];

  if (REBUILD) {
    const existing = await lookup(email);
    if (existing?.id) {
      const r = await admin(`/admins/user-delete/${existing.id}`, { method: 'DELETE' });
      note('DELETE', `/admins/user-delete/${existing.id}`, r.status, `${email} torn down`);
    }
  }

  let existing = await lookup(email);

  // The account's NAME is on screen in two articles - the friend row for
  // ACCOUNTS.mate, and "invitation from Marc KB" in 05.4 - so an account
  // carrying the wrong name is not usable.
  //
  // It is NOT repaired by deleting and re-creating it. Deleting an account
  // leaves its PLAYER behind, anonymised - name blanked, address rewritten to
  // `<userId>@scoryboard.com` - and an account made again at the same email is
  // handed that same playerId. Every friend record that pointed at it is still
  // there, soft-deleted, and `POST /friends/join/:shareCode` will revive one of
  // those in preference to the record whose link was used. That is exactly how
  // `kb-05-claimer@` was burnt on 2026-08-30, and it cost 05.4 a run. Both
  // behaviours are recorded in config/api.md.
  if (existing && (existing.name !== profile.name || existing.lastName !== profile.lastName)) {
    throw new Error(
      `${email} is "${existing.name} ${existing.lastName}" and this collection needs ` +
      `"${profile.name} ${profile.lastName}". Do NOT fix this by deleting the account: the ` +
      `player survives anonymised and is handed back to the next account at the same ` +
      `address, along with every soft-deleted friend record pointing at it. Use a new ` +
      `address in lib/fixtures-05.mjs instead.`,
    );
  }

  if (existing) {
    note('GET', '/users/me', 200, `${email} exists - id=${existing.id} playerId=${existing.playerId}`);
    return existing;
  }
  const made = await admin('/admins/users', {
    method: 'POST', body: { name: profile.name, lastName: profile.lastName, email },
  });
  if (!made.ok) throw new Error(`POST /admins/users ${email}: ${j(made.body)}`);
  note('POST', '/admins/users', made.status, `${email} created`);
  const me = await lookup(email);
  if (!me) throw new Error(`${email} was created but has no Scoryboard user`);
  return me;
}

async function ensureMembership(me, membership) {
  if (me.membership === membership) {
    note('-', 'membership', '-', `${me.email} already ${membership}`);
    return;
  }
  const r = await admin(`/admins/change-user-membership/${me.id}`, {
    method: 'POST', body: { membership },
  });
  if (!r.ok) throw new Error(`change-user-membership ${me.email}: ${j(r.body)}`);
  note('POST', `/admins/change-user-membership/${me.id}`, r.status, `${me.email} -> ${membership}`);
}

/**
 * Exactly the two teams in TEAMS, and nothing else.
 *
 * The born teams have to go: their names carry the date the account was made,
 * and 05.1 photographs the team dropdown. Free has no team-count limit, so
 * creating two costs nothing.
 */
async function ensureTeams(me) {
  const wanted = new Set(Object.values(TEAMS));
  let owned = (await asUser(me.token, '/teams')).body?.data ?? [];

  for (const team of owned) {
    if (wanted.has(team.name)) continue;
    const id = String(team.teamId ?? team.id);
    const r = await asUser(me.token, `/teams/${id}`, { method: 'DELETE' });
    note('DELETE', `/teams/${id}`, r.status, `removed stray team "${team.name}"`);
  }

  owned = (await asUser(me.token, '/teams')).body?.data ?? [];
  const byName = new Map(owned.map((t) => [t.name, String(t.teamId ?? t.id)]));
  for (const name of Object.values(TEAMS)) {
    if (byName.has(name)) {
      note('GET', '/teams', 200, `${name} exists - ${byName.get(name)}`);
      continue;
    }
    const r = await asUser(me.token, '/teams', {
      method: 'POST',
      body: { name, teamSize: '5 VS 5', defaultFormation: { formation: '2-1-1' } },
    });
    if (!r.ok) throw new Error(`POST /teams ${name}: ${j(r.body)}`);
    byName.set(name, String(r.body.data.id));
    note('POST', '/teams', r.status, `${name} created - ${r.body.data.id}`);
  }
  return { main: byName.get(TEAMS.main), other: byName.get(TEAMS.other) };
}

/**
 * The friends list, exactly the five rows in FRIENDS and in that order.
 *
 * Strays are deleted first, so a run that follows a crashed spec - or a run
 * that follows 05.2, which adds and removes a friend of its own - starts from
 * the same place. A friend is matched by the name that ends up on the row:
 * a linked row shows the ACCOUNT's name, not the name that was typed.
 */
async function ensureFriends(me, accounts) {
  const rowName = (f) => `${f.name ?? ''} ${f.lastName ?? ''}`.trim();
  const wanted = new Set(FRIENDS.map((f) => f.name));

  let list = (await asUser(me.token, '/friends')).body?.data ?? [];
  for (const row of list) {
    if (wanted.has(rowName(row))) continue;
    const r = await asUser(me.token, `/friends/${row.id}`, { method: 'DELETE' });
    note('DELETE', `/friends/${row.id}`, r.status, `removed stray friend "${rowName(row)}"`);
  }

  list = (await asUser(me.token, '/friends')).body?.data ?? [];
  const have = new Map(list.map((f) => [rowName(f), f]));

  for (const spec of FRIENDS) {
    if (have.has(spec.name)) continue;
    // A friend that stands for a real account is created BY PLAYER ID. Creating
    // it by email works too, but only from a clean start: on a second run the
    // address is already on the row and the server answers "A player with this
    // email already exists", which is 05.3's subject and not something a seed
    // should be arguing with.
    const body = spec.account
      ? { playerId: accounts[spec.account].playerId }
      : { name: spec.name, ...(spec.email ? { email: spec.email } : {}) };
    const r = await asUser(me.token, '/friends', { method: 'POST', body });
    if (!r.ok) throw new Error(`POST /friends ${spec.name}: ${j(r.body)}`);
    note('POST', '/friends', r.status, `${spec.name} created - ${r.body.data.id}`);
  }

  // --- order -----------------------------------------------------------------
  //
  // GET /friends comes back in record-creation order, so the array in
  // lib/fixtures-05.mjs is the order of the rows on screen. Two things make a
  // row land in the wrong place, and only one of them is repairable here.
  //
  // A NAME-ONLY row that was rebuilt lands at the end, because it is a genuinely
  // new record. Deleting it and creating it again in turn puts it back, which is
  // what the loop below does.
  //
  // A row that stands for a real ACCOUNT cannot be moved at all. Deleting it is
  // a soft delete, and both ways of creating it again - by playerId and by
  // email - revive the SAME record with its original creation time, so it
  // returns to the slot it has always had. If one of those is out of place, say
  // so and stop rather than looping.
  const expected = FRIENDS.map((f) => f.name);
  const movable = new Set(FRIENDS.filter((f) => !f.account).map((f) => f.name));

  for (let pass = 0; pass < FRIENDS.length; pass++) {
    list = (await asUser(me.token, '/friends')).body?.data ?? [];
    const order = list.map(rowName);
    if (order.join('|') === expected.join('|')) break;

    const at = order.findIndex((n, i) => n !== expected[i]);
    const wanted = expected[at];
    if (!movable.has(wanted) || !movable.has(order[at])) {
      throw new Error(
        `${me.email}'s friends list reads [${order.join(', ')}] and the specs expect ` +
        `[${expected.join(', ')}]. "${order[at]}" or "${wanted}" stands for a real account, ` +
        `and such a row cannot be moved - deleting and re-adding it revives the same ` +
        `record in the same place. Re-run with --rebuild.`,
      );
    }
    // Rebuild every movable row from the first mismatch onwards, in order.
    for (const name of expected.slice(at)) {
      const row = list.find((f) => rowName(f) === name);
      if (row) {
        const r = await asUser(me.token, `/friends/${row.id}`, { method: 'DELETE' });
        note('DELETE', `/friends/${row.id}`, r.status, `"${name}" removed to put the order right`);
      }
    }
    for (const name of expected.slice(at)) {
      const spec = FRIENDS.find((f) => f.name === name);
      const r = await asUser(me.token, '/friends', {
        method: 'POST', body: { name: spec.name, ...(spec.email ? { email: spec.email } : {}) },
      });
      if (!r.ok) throw new Error(`POST /friends ${name}: ${j(r.body)}`);
      note('POST', '/friends', r.status, `"${name}" created in turn - ${r.body.data.id}`);
    }
  }

  list = (await asUser(me.token, '/friends')).body?.data ?? [];
  const order = list.map(rowName);
  if (order.join('|') !== expected.join('|')) {
    throw new Error(
      `${me.email}'s friends list is still [${order.join(', ')}], not ` +
      `[${expected.join(', ')}]. Re-run with --rebuild.`,
    );
  }
  note('GET', '/friends', 200, `${list.length} friends, in order: ${order.join(', ')}`);
  return new Map(list.map((f) => [rowName(f), f]));
}

/**
 * The team memberships the articles need, and no others.
 *
 * Only one friend is meant to be on a team: the one 05.1 spends on the Free
 * gate. Everybody else must be on none, or the Add To Team dropdown in 05.1
 * offers fewer teams than the capture shows - the dialog hides a team the
 * player is already on.
 *
 * Rows left by an earlier copy of a rebuilt friend are pruned here. The refusal
 * that deletes a friend record leaves their player ON the team, so without this
 * the team grows a dead member every time 05.1's spec crashes.
 */
async function ensureTeamMembers(me, teams, friends) {
  const wanted = new Map();
  for (const spec of FRIENDS) {
    if (!spec.team) continue;
    const row = friends.get(spec.name);
    if (!row) throw new Error(`${spec.name} is missing from the friends list`);
    wanted.set(String(row.friendPlayerId), { team: teams[spec.team], name: spec.name });
  }

  for (const [key, teamId] of Object.entries(teams)) {
    const players = (await asUser(me.token, `/teams/${teamId}/players`)).body?.data ?? [];
    for (const p of players) {
      if (p.isDeleted) continue;
      if (p.role === 'Owner') continue;
      const want = wanted.get(String(p.playerId));
      if (want && want.team === teamId) continue;
      const r = await asUser(me.token, `/team-players/${p.id}`, { method: 'DELETE' });
      note('DELETE', `/team-players/${p.id}`, r.status, `pruned a stray member of ${TEAMS[key]}`);
    }
  }

  for (const [playerId, want] of wanted) {
    const players = (await asUser(me.token, `/teams/${want.team}/players`)).body?.data ?? [];
    if (players.some((p) => !p.isDeleted && String(p.playerId) === playerId)) {
      note('-', 'team-players', '-', `${want.name} is already on the team`);
      continue;
    }
    const r = await asUser(me.token, '/team-players', {
      method: 'POST', body: { teamId: want.team, playerId, role: 'Player' },
    });
    if (!r.ok) throw new Error(`POST /team-players ${want.name}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${want.name} added to the team`);
  }
}

/**
 * 05.2 creates NEW_FRIEND and removes it again inside its own run. If it died
 * halfway the row is still there, and it would sit in every other article's
 * capture of the list. ensureFriends() already deletes it as a stray - this
 * only says so out loud.
 */
async function assertNoLeftovers(me) {
  const list = (await asUser(me.token, '/friends')).body?.data ?? [];
  if (list.some((f) => f.name === NEW_FRIEND.name)) {
    throw new Error(`${NEW_FRIEND.name} is still in the list; 05.2 did not clean up`);
  }
  note('-', 'leftovers', '-', `no ${NEW_FRIEND.name} row`);
}

// --- run --------------------------------------------------------------------

const free = await ensureAccount('free');
const mate = await ensureAccount('mate');
const player = await ensureAccount('player');
const claimer = await ensureAccount('claimer');

console.log('\n--- memberships ---');
for (const me of [free, mate, player, claimer]) await ensureMembership(me, 'Free');

// change-user-membership does not update the copy already held.
const freeNow = await lookup(ACCOUNTS.free);

console.log('\n--- teams ---');
const teams = await ensureTeams(freeNow);

console.log('\n--- friends ---');
const friends = await ensureFriends(freeNow, { mate, player, claimer });

console.log('\n--- team members ---');
await ensureTeamMembers(freeNow, teams, friends);
await assertNoLeftovers(freeNow);

console.log('\n--- what a spec will find ---');
console.log(j({
  free: { email: freeNow.email, id: freeNow.id, playerId: freeNow.playerId, membership: freeNow.membership },
  mate: { email: mate.email, id: mate.id, playerId: mate.playerId },
  player: { email: player.email, id: player.id, playerId: player.playerId },
  claimer: { email: claimer.email, id: claimer.id, playerId: claimer.playerId },
  teams,
  friends: [...friends.values()].map((f) => ({
    row: `${f.name ?? ''} ${f.lastName ?? ''}`.trim(),
    id: f.id,
    friendPlayerId: f.friendPlayerId,
    email: f.email ?? null,
    isRegistered: !!f.isRegistered,
  })),
}));

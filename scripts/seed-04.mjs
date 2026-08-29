// Idempotent seed for collection 04 - "Plans & membership".
//
//   node scripts/seed-04.mjs
//   node scripts/seed-04.mjs --rebuild     # delete the three accounts first
//
// Safe to re-run. Every account, friend, team and membership is read before it
// is written, so a second run makes almost no writes. Nothing here reads a
// clock, a random value or a mailbox.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the three addresses in lib/fixtures-04.mjs.
//
// --- what this collection needs, and why -----------------------------------
//
// 04.3 photographs six Free-plan gates. Five of them need the account to be
// sitting exactly ON a limit, not near it:
//
//   * the friends list holds exactly 14 - the Free limit - so the fifteenth is
//     refused. Anything less and the Add Friend dialog simply succeeds;
//   * the account owns exactly one leaderboard, which every account is born
//     with, so Create New Leaderboard is refused;
//   * somebody has viewed the profile, so the Views counter is a control rather
//     than a dead number. On a profile with zero views nothing happens when you
//     select it, on Free or on Pro.
//
// Two behaviours make the friend count subtler than it looks, both observed on
// staging 2026-08-29 and both recorded in briefs/04.md:
//
//   * GET /friends EXCLUDES a friend who has joined one of your teams, and the
//     14 is measured against that filtered list. A friend on a team therefore
//     frees a slot. So this seed keeps every one of the fourteen off the teams;
//   * POST /team-players with a `name` creates a friend record as a side
//     effect, so on a full list it answers FRIEND_LIMIT_EXCEEDED rather than
//     anything about teams.

import 'dotenv/config';
import { admin, asUser, mintSession, j } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, TEAM, FRIENDS, FRIEND_LIMIT, TOURNAMENT, TOURNAMENT_DATES, FREE_PRO_SLOTS,
} from '../lib/fixtures-04.mjs';

const REBUILD = process.argv.includes('--rebuild');

const note = (method, path, status, detail) =>
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(46)} -> ${status}  ${detail ?? ''}`);

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

  const existing = await lookup(email);
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

/**
 * Bring an account to a membership. Idempotent: a no-op when it is already
 * there, which matters because this is also the reset 04.2's spec calls.
 */
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
 * Put the friends list at exactly the fourteen names in the fixture file.
 *
 * Extras are deleted rather than left: the whole point of this account is that
 * the list sits ON the limit, and one stray record puts it over (so the seed's
 * own last add is the one that fails) or a deletion elsewhere puts it under (so
 * 04.3's capture succeeds instead of being refused).
 */
async function ensureFriends(me) {
  let list = (await asUser(me.token, '/friends')).body?.data ?? [];
  const wanted = new Set(FRIENDS);

  for (const row of list) {
    if (wanted.has(row.name)) continue;
    const r = await asUser(me.token, `/friends/${row.id}`, { method: 'DELETE' });
    note('DELETE', `/friends/${row.id}`, r.status, `removed stray friend "${row.name}"`);
  }

  list = (await asUser(me.token, '/friends')).body?.data ?? [];
  const have = new Set(list.map((f) => f.name));
  for (const name of FRIENDS) {
    if (have.has(name)) continue;
    const r = await asUser(me.token, '/friends', { method: 'POST', body: { name } });
    if (!r.ok) throw new Error(`POST /friends ${name}: ${j(r.body)}`);
    note('POST', '/friends', r.status, name);
  }

  list = (await asUser(me.token, '/friends')).body?.data ?? [];
  if (list.length !== FRIEND_LIMIT) {
    throw new Error(
      `${me.email} has ${list.length} friends, not ${FRIEND_LIMIT}. 04.3's friend-limit ` +
      `capture needs the list to sit exactly on the limit. Names: ${list.map((f) => f.name).join(', ')}`,
    );
  }
  note('GET', '/friends', 200, `${list.length} friends - on the limit`);
}

/**
 * The one team the specs name.
 *
 * Every account is born with two ("<First> K FC" and "<First> K FC Away"), but
 * those names come from the account name and gain a date suffix when they
 * clash. A fixed name is what keeps 04.3's Select Team dropdown readable.
 * There is no team-count limit on Free - a third team is accepted - so this
 * costs nothing.
 */
async function ensureTeam(me) {
  const owned = (await asUser(me.token, '/teams')).body?.data ?? [];
  const found = owned.find((t) => t.name === TEAM);
  if (found) {
    note('GET', '/teams', 200, `${TEAM} exists - ${found.teamId ?? found.id}`);
    return String(found.teamId ?? found.id);
  }
  const r = await asUser(me.token, '/teams', {
    method: 'POST',
    body: { name: TEAM, teamSize: '5 VS 5', defaultFormation: { formation: '2-1-1' } },
  });
  if (!r.ok) throw new Error(`POST /teams ${TEAM}: ${j(r.body)}`);
  note('POST', '/teams', r.status, `${TEAM} created - ${r.body.data.id}`);
  return String(r.body.data.id);
}

/**
 * Take every one of the fourteen back off the teams they may have joined.
 *
 * A friend on one of your teams drops out of GET /friends, and the Free limit
 * is measured against that filtered list - so a friend left on a team silently
 * takes the list under 14 and 04.3's capture stops being a refusal.
 */
async function clearTeamMembers(me) {
  const owned = (await asUser(me.token, '/teams')).body?.data ?? [];
  for (const team of owned) {
    const teamId = String(team.teamId ?? team.id);
    const players = (await asUser(me.token, `/teams/${teamId}/players`)).body?.data ?? [];
    for (const p of players) {
      if (p.isDeleted) continue;
      if (p.role === 'Owner') continue;
      const r = await asUser(me.token, `/team-players/${p.id}`, { method: 'DELETE' });
      note('DELETE', `/team-players/${p.id}`, r.status, `removed "${p.name ?? p.id}" from ${team.name}`);
    }
  }
}

/** The single leaderboard every account is born with. Free allows exactly one. */
async function readLeaderboard(me) {
  const list = (await asUser(me.token, '/leaderboards')).body?.data ?? [];
  if (list.length !== 1) {
    throw new Error(
      `${me.email} owns ${list.length} leaderboards, not 1. 04.3's leaderboard-limit ` +
      `capture needs exactly one, which is what a Free account is born with.`,
    );
  }
  const lb = list[0];
  note('GET', '/leaderboards', 200, `${lb.name} - ${lb._id ?? lb.id}`);
  return { id: String(lb._id ?? lb.id), name: lb.name };
}

/**
 * Make sure each of the two profiles has been viewed at least once.
 *
 * The Views counter is only a control when the count is above zero: the bundle
 * gates the click on `isSelfProfile && (isPro || viewCount)`. Without this,
 * 04.3's Free gate and its Pro counterpart both go unreachable.
 *
 * GET /players/:playerId as somebody else is what records a view - confirmed on
 * staging, count 0 -> 1. It dedupes by viewer, so re-running does not inflate it.
 */
async function ensureProfileView(viewer, subject) {
  const before = (await asUser(subject.token, `/profile-view/player/${subject.playerId}/count`))
    .body?.data?.viewCount ?? 0;
  if (before > 0) {
    note('GET', '/profile-view/.../count', 200, `${subject.email} already has ${before} view(s)`);
    return before;
  }
  await asUser(viewer.token, `/players/${subject.playerId}`);
  const after = (await asUser(subject.token, `/profile-view/player/${subject.playerId}/count`))
    .body?.data?.viewCount ?? 0;
  note('GET', `/players/${subject.playerId}`, 200, `viewed by ${viewer.email} - count ${before} -> ${after}`);
  if (after < 1) throw new Error(`${subject.email} still has no profile views`);
  return after;
}


/**
 * One Basic tournament, for 04.5's "Choose a Tournament for PRO" dialog.
 *
 * It must stay on the Basic plan - the dialog lists only Basic tournaments.
 * Nothing here upgrades it: the upgrade is the Stripe checkout that 04.5
 * deliberately stops short of.
 */
async function ensureTournament(me) {
  const list = (await asUser(me.token, '/tournaments')).body?.data ?? [];
  const found = list.find((t) => t.title === TOURNAMENT);
  if (found) {
    const id = String(found._id ?? found.id);
    note('GET', '/tournaments', 200, TOURNAMENT + ' exists - ' + id + ' plan=' + found.pricingPlan);
    if (found.pricingPlan !== 'Basic') {
      throw new Error(
        TOURNAMENT + ' is on the ' + found.pricingPlan + ' plan, not Basic. 04.5 lists only '
        + 'Basic tournaments. Delete it and re-run.',
      );
    }
    return { id, name: TOURNAMENT };
  }
  const r = await asUser(me.token, '/tournaments', {
    method: 'POST',
    body: { title: TOURNAMENT, ...TOURNAMENT_DATES, isOnline: false },
  });
  if (!r.ok) throw new Error('POST /tournaments ' + TOURNAMENT + ': ' + j(r.body));
  note('POST', '/tournaments', r.status, TOURNAMENT + ' created - ' + r.body.data.id);
  return { id: String(r.body.data.id), name: TOURNAMENT };
}

/**
 * Top the free Tournament Pro allowance up to FREE_PRO_SLOTS.
 *
 * The grant is ADDITIVE and there is no revoke (config/api.md), so this reads
 * what is left and asks only for the shortfall. Granting a flat quantity every
 * run would walk the number up, and 04.6 photographs that number.
 */
async function ensureFreeProSlots(me) {
  const remaining = me.freeTournamentProAllowanceRemaining ?? 0;
  if (remaining >= FREE_PRO_SLOTS) {
    note('-', 'tournament-free-pro', '-', me.email + ' already has ' + remaining + ' slot(s)');
    return remaining;
  }
  const r = await admin('/admins/users/tournament-free-pro/grant', {
    method: 'POST',
    body: { email: me.email, plan: 'Pro', quantity: FREE_PRO_SLOTS - remaining },
  });
  if (!r.ok) throw new Error('tournament-free-pro/grant ' + me.email + ': ' + j(r.body));
  note('POST', '/admins/users/tournament-free-pro/grant', r.status,
    me.email + ' ' + remaining + ' -> ' + r.body.data.remainingQuantity);
  return r.body.data.remainingQuantity;
}

/**
 * The paywall accounts must have NO free slots, or the Tournament Pro tab shows
 * the allowance panel instead and 04.4 and 04.5 photograph the wrong screen.
 * There is no revoke, so this can only check and fail loudly.
 */
function assertNoFreeSlots(me) {
  const remaining = me.freeTournamentProAllowanceRemaining ?? 0;
  if (remaining > 0) {
    throw new Error(
      me.email + ' has ' + remaining + ' free Tournament Pro slot(s). 04.4 and 04.5 need the '
      + 'paywall, and the grant has no revoke. Use a fresh address.',
    );
  }
  note('-', 'tournament-free-pro', '-', me.email + ' has no free slots - the paywall is reachable');
}

// --- run --------------------------------------------------------------------

const free = await ensureAccount('free');
const pro = await ensureAccount('pro');
const upgrade = await ensureAccount('upgrade');
const organiser = await ensureAccount('organiser');
const grant = await ensureAccount('grant');

console.log('\n--- memberships ---');
await ensureMembership(free, 'Free');
await ensureMembership(pro, 'Pro');
await ensureMembership(upgrade, 'Free');

// re-read: change-user-membership does not update the copy we already hold
const freeNow = await lookup(ACCOUNTS.free);
const proNow = await lookup(ACCOUNTS.pro);

console.log('\n--- the Free account sits on its limits ---');
await clearTeamMembers(freeNow);
await ensureFriends(freeNow);
const freeTeam = await ensureTeam(freeNow);
const freeBoard = await readLeaderboard(freeNow);

console.log('\n--- the Pro account ---');
const proBoard = await readLeaderboard(proNow);

console.log('\n--- profile views ---');
await ensureProfileView(proNow, freeNow);    // Nia views Marc  -> 04.3's Free gate
await ensureProfileView(freeNow, proNow);    // Marc views Nia  -> 04.3's Pro panel

console.log('\n--- what a spec will find ---');
console.log('--- Tournament Pro ---');
const organiserNow = await lookup(ACCOUNTS.organiser);
assertNoFreeSlots(organiserNow);
const cup = await ensureTournament(organiserNow);
const grantNow = await lookup(ACCOUNTS.grant);
const slots = await ensureFreeProSlots(grantNow);

console.log(j({
  free: { email: freeNow.email, id: freeNow.id, playerId: freeNow.playerId, membership: freeNow.membership, team: freeTeam, leaderboard: freeBoard },
  pro: { email: proNow.email, id: proNow.id, playerId: proNow.playerId, membership: proNow.membership, leaderboard: proBoard },
  upgrade: { email: upgrade.email, id: upgrade.id, membership: 'Free' },
  organiser: { email: organiserNow.email, id: organiserNow.id, tournament: cup, freeProSlots: 0 },
  grant: { email: grantNow.email, id: grantNow.id, freeProSlots: slots },
}));

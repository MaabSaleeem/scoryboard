// Idempotent seed for collection 09 - "Creating & scheduling matches".
//
//   node scripts/seed-09.mjs
//   node scripts/seed-09.mjs --rebuild     # delete all four accounts first
//
// Safe to re-run. Every account, team, member, venue and match is looked up
// before it is written, so a second run makes zero writes.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the four addresses in lib/fixtures-09.mjs.
//
// --- Read this before you re-run it after a failure ----------------------
//
// Two things here cannot be rebuilt in place.
//
// 1. A venue or a leaderboard, once on a match, cannot be taken off:
//    PUT {clubLocationId: null} and {leaderboardId: null} are both refused. So a
//    Scheduled match can never go back to Incomplete.
// 2. DELETE /matches/:id does not delete. It sets status Cancelled and the row
//    stays for ever, invisible in every list. That is how this script and the
//    specs dispose of a match they no longer want, and it means a wrong match
//    cannot be repaired - only replaced.
//
// --- The dates ----------------------------------------------------------
//
// MATCHES in lib/fixtures-09.mjs carries two FIXED future dates. That is
// deliberate - a screenshot of a calendar has to say the same thing on every run.
// It also means the fixture goes stale: **a match created with a date in the past
// starts itself a second or two after POST /matches answers** (config/api.md), so
// once those dates have passed this seed would build a Live match instead of a
// Scheduled one. The script refuses to run in that case and says which date to
// move. Move them forward in lib/fixtures-09.mjs, --rebuild, and re-capture.
//
// --- What a born account already has ------------------------------------
//
// A new account arrives with ONE leaderboard and TWO teams (config/api.md), so
// this script RENAMES rather than creates wherever it can: Mo's leaderboard
// becomes KB 09 Sunday League and his two born teams become KB 09 United and
// KB 09 Rovers.

import 'dotenv/config';
import { admin, asUser, mintSession, j } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, LEADERBOARD, TEAMS, BORN_TEAMS, VENUES,
  MATCH_DEFAULTS, POSITIONS, SQUADS, MATCHES,
} from '../lib/fixtures-09.mjs';

const REBUILD = process.argv.includes('--rebuild');

const ids = {};
let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(48)} -> ${status}  ${detail ?? ''}`);
};

/**
 * Refuse to build a fixture whose dates have gone by.
 *
 * Reading the clock is fine here - this is a guard, not a capture. A spec may
 * never do it (docs/style-guide.md); a seed that would otherwise silently produce
 * a Live match must.
 */
const now = Date.now();
const stale = MATCHES.filter((m) => Date.parse(m.date) - now < 2 * 60 * 60 * 1000);
if (stale.length) {
  console.error('FIXTURE DATES HAVE PASSED (or are less than two hours away):');
  for (const m of stale) console.error(`  ${m.key}  ${m.date}`);
  console.error('\nA match created with a past date starts itself, so this seed would build a');
  console.error('Live match instead of a Scheduled one. Move the dates forward in');
  console.error('lib/fixtures-09.mjs, then run: node scripts/seed-09.mjs --rebuild');
  process.exit(1);
}

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
  const existing = await lookup(email);
  if (existing) {
    note('GET', '/users/me', 200, `${email} exists - id=${existing.id}`);
    return existing;
  }
  const p = PROFILES[key];
  const made = await admin('/admins/users', {
    method: 'POST', body: { name: p.name, lastName: p.lastName, email },
  });
  if (!made.ok) throw new Error(`POST /admins/users ${email}: ${j(made.body)}`);
  note('POST', '/admins/users', made.status, `${email} uid=${made.body.data.uid}`);
  const me = await lookup(email);
  if (!me) throw new Error(`${email} was created but has no Scoryboard user`);
  return me;
}

/**
 * Fill in the fields a real signup collects, plus the bio and the tour flag.
 *
 * PUT /users/:userId is a full replace: leaving `gender` out answers 400
 * "gender is required". Every write therefore sends the whole profile.
 */
async function ensureProfile(me, key) {
  const p = PROFILES[key];
  const same = me.gender === p.gender
    && me.position === p.position
    && me.bio === p.bio
    && me.isMarketingOpted === false
    && me.isTourCompleted === true
    && (me.sports ?? []).join() === p.sports.join()
    && String(me.dateOfBirth ?? '').startsWith(p.dateOfBirth);
  if (same) {
    note('GET', '/users/me', 200, `${me.email}: profile already set`);
    return me;
  }
  const put = await asUser(me.token, `/users/${me.id}`, { method: 'PUT', body: p });
  if (!put.ok) throw new Error(`PUT /users/${me.id}: ${j(put.body)}`);
  note('PUT', `/users/${me.id}`, put.status, `${p.gender}, ${p.position}, tour skipped`);
  return (await lookup(me.email)) ?? me;
}

async function ensureMembership(me, want) {
  if (me.membership === want) {
    note('GET', '/users/me', 200, `${me.email} already ${want}`);
    return me;
  }
  const r = await admin(`/admins/change-user-membership/${me.id}`, {
    method: 'POST', body: { membership: want },
  });
  if (!r.ok) throw new Error(`change-user-membership ${me.email}: ${j(r.body)}`);
  note('POST', `/admins/change-user-membership/${me.id}`, r.status, `${me.email} -> ${want}`);
  return (await lookup(me.email)) ?? me;
}

const teamsOf = async (me) => (await asUser(me.token, '/teams?all=true')).body?.data ?? [];

/**
 * One of Mo's two born teams, renamed.
 *
 * The born name carries a date suffix only when it clashes, and that suffix
 * changes on --rebuild - so match the pattern first and the final name on every
 * run after.
 */
async function ensureRenamedTeam(owner, key) {
  const want = TEAMS[key];
  const teams = await teamsOf(owner);
  const already = teams.find((t) => t.name === want);
  if (already) {
    note('GET', '/teams?all=true', 200, `"${want}" exists - ${already.teamId}`);
    return already.teamId;
  }
  const born = teams.find((t) => BORN_TEAMS[key].test(t.name));
  if (!born) {
    throw new Error(
      `${owner.email} has no team matching ${BORN_TEAMS[key]} to rename into "${want}". `
      + `Teams: ${teams.map((t) => t.name).join(', ')}`,
    );
  }
  const r = await asUser(owner.token, `/teams/${born.teamId}`, { method: 'PUT', body: { name: want } });
  if (!r.ok) throw new Error(`PUT /teams/${born.teamId}: ${j(r.body)}`);
  note('PUT', `/teams/${born.teamId}`, r.status, `renamed "${born.name}" -> "${want}"`);
  return born.teamId;
}

/** Live members of a team, with the display name the app shows. */
async function members(owner, teamId) {
  const all = (await asUser(owner.token, `/teams/${teamId}/players?includeFans=true`)).body?.data ?? [];
  // Removed members stay in the list flagged isDeleted with their address
  // anonymised (config/api.md). A match on a dead row would put a deleted player
  // in a lineup.
  return all.filter((m) => !m.isDeleted).map((m) => ({
    id: m.id,
    role: m.role,
    email: m.player?.email ?? null,
    name: [m.player?.name, m.player?.lastName].filter(Boolean).join(' '),
  }));
}

/**
 * The team sheet: the two accounts with roles, then the name-only friends.
 *
 * A member added by email is on the team at once but their invitation stays
 * pending until POST /team-invitations/accept, and an account with one
 * outstanding lands on /team/join when it signs in (config/api.md). Every spec
 * that signs Ada or Pip in would hit that interstitial, so the seed accepts for
 * them.
 */
async function ensureSquad(owner, teamId, squad, accountsByKey) {
  const have = await members(owner, teamId);
  for (const a of squad.accounts) {
    const acct = accountsByKey[a.key];
    const row = have.find((m) => m.email === acct.email);
    if (row) {
      if (row.role !== a.role) {
        const r = await asUser(owner.token, `/team-players/${row.id}`, {
          method: 'PUT', body: { teamId, name: PROFILES[a.key].name, email: acct.email, role: a.role },
        });
        if (!r.ok) throw new Error(`PUT /team-players/${row.id} role: ${j(r.body)}`);
        note('PUT', `/team-players/${row.id}`, r.status, `${acct.email} ${row.role} -> ${a.role}`);
      } else {
        note('GET', `/teams/${teamId}/players`, 200, `${acct.email} already ${a.role}`);
      }
      continue;
    }
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST',
      body: { teamId, name: PROFILES[a.key].name, email: acct.email, role: a.role },
    });
    if (!r.ok) throw new Error(`POST /team-players ${acct.email}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${acct.email} added as ${a.role}`);
  }
  for (const name of squad.friends) {
    if (have.some((m) => m.name === name)) {
      note('GET', `/teams/${teamId}/players`, 200, `${name} already on the sheet`);
      continue;
    }
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST', body: { teamId, name, role: 'Player' },
    });
    if (!r.ok) throw new Error(`POST /team-players ${name}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${name} added to ${teamId}`);
  }
}

/** Accept every invitation addressed to this account. */
async function acceptInvites(me) {
  const pending = (await asUser(me.token, '/team-invitations')).body?.data ?? [];
  const rows = Array.isArray(pending) ? pending : (pending.result ?? []);
  // The field is `invitationId`. Not `id`, and not `teamInvitationId` - the name
  // the accept endpoint's own body uses. Read off staging 2026-08-31; guessing it
  // left both accounts sitting on /team/join for a whole run.
  const invitationIds = rows.map((r) => r.invitationId).filter(Boolean);
  if (!invitationIds.length) {
    note('GET', '/team-invitations', 200, `${me.email}: nothing pending`);
    return;
  }
  const r = await asUser(me.token, '/team-invitations/accept', {
    method: 'POST', body: { teamInvitationIds: invitationIds },
  });
  if (!r.ok) throw new Error(`POST /team-invitations/accept ${me.email}: ${j(r.body)}`);
  note('POST', '/team-invitations/accept', r.status, `${me.email} accepted ${invitationIds.length}`);
}

/**
 * Mo's own leaderboard, renamed and holding both teams.
 *
 * Every account is born with one, so this renames what is already there. It also
 * prunes anything else Mo owns, so the "Your Leaderboards (1)" heading stays
 * true if a crashed run left a stray behind.
 *
 * The leaderboard is not decoration here. A match without a `leaderboardId`
 * never leaves Incomplete, so this is a hard precondition for every fixture.
 */
async function ensureLeaderboard(owner, teamIdByKey) {
  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  const mine = boards.filter((b) => b.isOwner);
  if (!mine.length) throw new Error(`${owner.email} owns no leaderboard`);

  let board = mine.find((b) => b.name === LEADERBOARD) ?? mine[0];
  if (board.name !== LEADERBOARD) {
    const r = await asUser(owner.token, `/leaderboards/${board.id}`, {
      method: 'PUT', body: { name: LEADERBOARD },
    });
    if (!r.ok) throw new Error(`PUT /leaderboards/${board.id}: ${j(r.body)}`);
    note('PUT', `/leaderboards/${board.id}`, r.status, `renamed "${board.name}" -> "${LEADERBOARD}"`);
    board = { ...board, name: LEADERBOARD };
  } else {
    note('GET', '/leaderboards', 200, `"${LEADERBOARD}" already named - ${board.id}`);
  }

  for (const stray of mine) {
    if (stray.id === board.id) continue;
    const r = await asUser(owner.token, `/leaderboards/${stray.id}`, { method: 'DELETE' });
    note('DELETE', `/leaderboards/${stray.id}`, r.status, `pruned stray "${stray.name}"`);
  }

  const listed = (await asUser(owner.token, `/leaderboards/${board.id}/teams`)).body?.data ?? [];
  const rows = Array.isArray(listed) ? listed : (listed.result ?? []);
  const inIt = new Set(rows.map((t) => String(t.teamId ?? t.id ?? t.team?.teamId ?? t.team?.id)));
  for (const key of Object.keys(TEAMS)) {
    const teamId = String(teamIdByKey[key]);
    if (inIt.has(teamId)) {
      note('GET', `/leaderboards/${board.id}/teams`, 200, `${TEAMS[key]} already in the league`);
      continue;
    }
    const r = await asUser(owner.token, `/leaderboards/${board.id}/teams`, {
      method: 'POST', body: { teamId },
    });
    if (!r.ok) throw new Error(`POST /leaderboards/${board.id}/teams ${TEAMS[key]}: ${j(r.body)}`);
    note('POST', `/leaderboards/${board.id}/teams`, r.status, TEAMS[key]);
  }
  return board;
}

/**
 * One venue, created once.
 *
 * GET /club-locations?query= searches every venue on the platform, so match on
 * the exact name rather than trusting the first row back.
 */
async function ensureVenue(owner, key) {
  const want = VENUES[key];
  const found = ((await asUser(owner.token, `/club-locations?query=${encodeURIComponent(want.name)}`))
    .body?.data ?? []).find((v) => v.name === want.name && !v.isDeleted);
  if (found) {
    note('GET', '/club-locations', 200, `"${want.name}" exists - ${found.id}`);
    return found.id;
  }
  const r = await asUser(owner.token, '/club-locations', { method: 'POST', body: want });
  if (!r.ok) throw new Error(`POST /club-locations ${want.name}: ${j(r.body)}`);
  note('POST', '/club-locations', r.status, `"${want.name}" ${r.body.data.id}`);
  return r.body.data.id;
}

/**
 * Every match Mo can see, whatever its status.
 *
 * Read off the calendar's own endpoint, which is the only one that carries
 * Incomplete rows: GET /players/:playerId/matches?includeIncomplete=true with a
 * date window. Cancelled rows never appear in it, which is exactly what makes
 * cancelling a safe way to dispose of one.
 */
async function matchesOf(owner) {
  const r = await asUser(
    owner.token,
    `/players/${owner.playerId}/matches?includeIncomplete=true&startDate=2026-01-01&endDate=2027-12-31`,
  );
  const rows = r.body?.data?.result ?? r.body?.data ?? [];
  return (Array.isArray(rows) ? rows : []).map((m) => ({
    id: m.id, date: String(m.date ?? '').slice(0, 10), status: m.status,
  }));
}

/**
 * Create one match, complete, in one POST.
 *
 * All seven fields that decide Incomplete go in the create body, so the match is
 * born Scheduled and no repair PUT is ever needed. `pitchNumber`, `note` and
 * `refereePlayerId` follow in a second PUT because POST /matches does not take
 * them.
 */
async function makeMatch(owner, plan, team, board, venueId, refereePlayerId) {
  const lineup = (t, order) => order.map((name, i) => {
    const m = t.members.find((x) => x.name === name);
    if (!m) throw new Error(`${name} is not on ${t.name}: ${t.members.map((x) => x.name).join(', ')}`);
    return { teamPlayerId: m.id, position: POSITIONS[i] };
  });
  const home = team[plan.home];
  const away = team[plan.away];

  const made = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: {
        teamId: home.id,
        formation: MATCH_DEFAULTS.formation,
        players: lineup(home, SQUADS[plan.home].lineup),
      },
      awayTeam: {
        teamId: away.id,
        formation: MATCH_DEFAULTS.formation,
        players: lineup(away, SQUADS[plan.away].lineup),
      },
      date: plan.date,
      duration: plan.duration,
      teamSize: plan.teamSize,
      clubLocationId: venueId,
      leaderboardId: board.id,
      tag: plan.tag,
    },
  });
  if (!made.ok) throw new Error(`POST /matches ${plan.key}: ${j(made.body)}`);
  const matchId = made.body.data.id;
  note('POST', '/matches', made.status, `${plan.key} ${plan.date.slice(0, 10)} ${matchId}`);

  const extra = {};
  if (plan.pitchNumber) extra.pitchNumber = plan.pitchNumber;
  if (plan.note) extra.note = plan.note;
  if (plan.referee) extra.refereePlayerId = refereePlayerId;
  if (Object.keys(extra).length) {
    const r = await asUser(owner.token, `/matches/${matchId}`, { method: 'PUT', body: extra });
    if (!r.ok) throw new Error(`PUT /matches/${matchId} extras: ${j(r.body)}`);
    note('PUT', `/matches/${matchId}`, r.status, `pitch/note/referee on ${plan.key}`);
  }

  const back = (await asUser(owner.token, `/matches/${matchId}`)).body?.data;
  if (back?.status !== 'Scheduled') {
    throw new Error(
      `${plan.key} came back ${back?.status}, not Scheduled. A match needs homeTeam, `
      + 'awayTeam, leaderboardId, clubLocationId, date, duration and teamSize.',
    );
  }
  return matchId;
}

// --- 0. optional teardown ---------------------------------------------------

if (REBUILD) {
  for (const email of Object.values(ACCOUNTS)) {
    const me = await lookup(email);
    if (!me) { note('DELETE', email, 404, 'was not there'); continue; }
    for (const b of ((await asUser(me.token, '/leaderboards')).body?.data ?? [])) {
      if (!b.isOwner) continue;
      const r = await asUser(me.token, `/leaderboards/${b.id}`, { method: 'DELETE' });
      note('DELETE', `/leaderboards/${b.id}`, r.status, b.name);
    }
    for (const t of await teamsOf(me)) {
      const r = await asUser(me.token, `/teams/${t.teamId}`, { method: 'DELETE' });
      note('DELETE', `/teams/${t.teamId}`, r.status, t.name);
    }
    const r = await admin(`/admins/user-delete/${me.id}`, { method: 'DELETE' });
    note('DELETE', `/admins/user-delete/${me.id}`, r.status, email);
  }
}

// --- 1. the four accounts ---------------------------------------------------

const acct = {};
for (const key of ['pro', 'admin', 'player', 'referee']) {
  let me = await ensureAccount(key);
  me = await ensureProfile(me, key);
  me = await ensureMembership(me, key === 'pro' ? 'Pro' : 'Free');
  acct[key] = me;
  ids[key] = { id: me.id, playerId: me.playerId, membership: me.membership, email: me.email };
}
const pro = acct.pro;

// --- 2. the two teams and their squads --------------------------------------

const teamId = {
  united: await ensureRenamedTeam(pro, 'united'),
  rovers: await ensureRenamedTeam(pro, 'rovers'),
};
for (const key of Object.keys(teamId)) {
  await ensureSquad(pro, teamId[key], SQUADS[key], acct);
}
for (const key of ['admin', 'player']) await acceptInvites(acct[key]);

const team = {};
for (const key of Object.keys(teamId)) {
  team[key] = { id: teamId[key], name: TEAMS[key], members: await members(pro, teamId[key]) };
}
ids.teams = Object.fromEntries(Object.entries(teamId).map(([k, v]) => [TEAMS[k], v]));
ids.squads = Object.fromEntries(Object.entries(team).map(([k, t]) => [
  t.name, t.members.map((m) => `${m.name}${m.role === 'Player' ? '' : ` (${m.role})`}`),
]));

// --- 3. the leaderboard and the two venues ----------------------------------

const board = await ensureLeaderboard(pro, teamId);
ids.leaderboard = { id: board.id, name: board.name };

const venueId = {};
for (const key of Object.keys(VENUES)) venueId[key] = await ensureVenue(pro, key);
ids.venues = Object.fromEntries(Object.entries(venueId).map(([k, v]) => [VENUES[k].name, v]));

// --- 4. the two matches -----------------------------------------------------
//
// Matched on the date, which is fixed per fixture. Counting would be wrong: a
// spec's throwaway is cancelled rather than deleted, and a crashed spec can
// leave one behind that is still Scheduled.

const already = await matchesOf(pro);
ids.matches = {};
for (const plan of MATCHES) {
  const day = plan.date.slice(0, 10);
  const found = already.find((m) => m.date === day && m.status !== 'Cancelled');
  if (found) {
    note('GET', `/players/${pro.playerId}/matches`, 200, `${plan.key} ${day} exists - ${found.id} (${found.status})`);
    ids.matches[plan.key] = found.id;
    continue;
  }
  ids.matches[plan.key] = await makeMatch(pro, plan, team, board, venueId[plan.venue], acct.referee.playerId);
}

// A crashed spec leaves its throwaway behind. Anything Mo can see that is not
// one of the two fixtures is one of those, so cancel it: every capture of the
// calendar, the team's Matches tab and the leaderboard's counts them.
const keep = new Set(Object.values(ids.matches).map(String));
for (const m of await matchesOf(pro)) {
  if (keep.has(String(m.id))) continue;
  const r = await asUser(pro.token, `/matches/${m.id}`, { method: 'DELETE' });
  note('DELETE', `/matches/${m.id}`, r.status, `stray ${m.status} ${m.date} cancelled`);
}

// --- 5. verify --------------------------------------------------------------

const final = await matchesOf(pro);
console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- matches Mo can see ---');
console.log(j(final));
console.log(`\nwrites this run: ${writes}`);

const wrong = [];
for (const plan of MATCHES) {
  const row = final.find((m) => String(m.id) === String(ids.matches[plan.key]));
  if (!row) wrong.push(`${plan.key} is not in the calendar listing`);
  else if (row.status !== 'Scheduled') wrong.push(`${plan.key} is ${row.status}, want Scheduled`);
}
if (final.length !== MATCHES.length) {
  wrong.push(`${final.length} matches visible, want ${MATCHES.length}`);
}
if (wrong.length) {
  console.error(`\nFIXTURE IS WRONG:\n  ${wrong.join('\n  ')}`);
  console.error('A venue and a leaderboard cannot be taken off a match, so a half-built one');
  console.error('cannot be repaired. Re-run with --rebuild.');
  process.exit(1);
}
console.log(`\nSeed complete. Two Scheduled matches, both future, matching lib/fixtures-09.mjs.`);

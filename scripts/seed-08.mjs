// Idempotent seed for collection 08 - "Leaderboards & leagues".
//
//   node scripts/seed-08.mjs
//   node scripts/seed-08.mjs --rebuild     # delete all four accounts first
//
// Safe to re-run. Every account, team, member, match, admin and comment is
// looked up before it is written, so a second run makes zero writes.
// Nothing here reads a clock, a random value or a mailbox.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the four addresses in lib/fixtures-08.mjs.
//
// --- Read this before you re-run it after a failure ----------------------
//
// Two things here cannot be rebuilt in place.
//
// 1. A played match. POST /matches/:id/status refuses anything once the match is
//    Finished, and PUT and DELETE refuse a match whose date has passed. The
//    script never touches a match it did not have to create, and it verifies the
//    league table at the end. If the table is wrong, the fix is --rebuild.
// 2. A comment. Comment edit and delete are not in the API at all
//    (config/api.md, "Not in the collection"), so a comment posted twice can
//    never be taken back. Comments are matched on their exact text before
//    anything is posted.
//
// --- What a born account already has ------------------------------------
//
// A new account arrives with ONE leaderboard and TWO teams (config/api.md). So
// this script RENAMES rather than creates wherever it can: Mo's leaderboard
// becomes KB 08 Premier League and his two born teams become KB 08 United and
// KB 08 Athletic. Fern is left exactly as she was born, because being at the
// Free limit of one leaderboard with no setup at all is the whole point of her.

import 'dotenv/config';
import { admin, asUser, mintSession, j } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, LEADERBOARD, THROWAWAY, TEAMS, TEAMS_IN_LEAGUE, BORN_TEAMS,
  MATCH_DEFAULTS, VENUE, SQUADS, POSITIONS, MATCHES, EXPECTED_TABLE, COMMENTS,
} from '../lib/fixtures-08.mjs';

const REBUILD = process.argv.includes('--rebuild');

const ids = {};
let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(50)} -> ${status}  ${detail ?? ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
 * Fill in the fields a real signup collects, plus the bio.
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
    && (me.sports ?? []).join() === p.sports.join()
    && String(me.dateOfBirth ?? '').startsWith(p.dateOfBirth);
  if (same) {
    note('GET', '/users/me', 200, `${me.email}: profile already set`);
    return me;
  }
  const put = await asUser(me.token, `/users/${me.id}`, { method: 'PUT', body: p });
  if (!put.ok) throw new Error(`PUT /users/${me.id}: ${j(put.body)}`);
  note('PUT', `/users/${me.id}`, put.status, `${p.gender}, ${p.position}`);
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

async function ensureTeam(owner, key) {
  const name = TEAMS[key];
  const existing = (await teamsOf(owner)).find((t) => t.name === name);
  if (existing) {
    note('GET', '/teams?all=true', 200, `"${name}" exists - ${existing.teamId}`);
    return existing.teamId;
  }
  const made = await asUser(owner.token, '/teams', {
    method: 'POST',
    body: {
      name,
      teamSize: MATCH_DEFAULTS.teamSize,
      defaultFormation: { formation: MATCH_DEFAULTS.formation },
    },
  });
  if (!made.ok) throw new Error(`POST /teams ${name}: ${j(made.body)}`);
  // The name comes back suffixed when another account already holds it, so read
  // it back rather than assuming the name asked for is the name stored.
  if (made.body.data.name !== name) {
    throw new Error(`POST /teams: asked for "${name}", got "${made.body.data.name}"`);
  }
  const teamId = (await teamsOf(owner)).find((t) => t.name === name)?.teamId;
  note('POST', '/teams', made.status, `"${name}" ${teamId}`);
  return teamId;
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

async function ensureSquad(owner, teamId, squad) {
  const have = await members(owner, teamId);
  for (const name of squad.friends) {
    if (have.some((m) => m.name === name)) continue;
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST', body: { teamId, name, role: 'Player' },
    });
    if (!r.ok) throw new Error(`POST /team-players ${name}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${name} added to ${teamId}`);
  }
}

/** The leaderboard's team rows, flattened - the shape varies by row. */
async function leagueTeams(owner, boardId) {
  const listed = (await asUser(owner.token, `/leaderboards/${boardId}/teams`)).body?.data ?? [];
  const rows = Array.isArray(listed) ? listed : (listed.result ?? []);
  return rows.map((t) => ({
    id: String(t.teamId ?? t.id ?? t.team?.teamId ?? t.team?.id),
    name: t.name ?? t.team?.name ?? null,
  }));
}

/**
 * Mo's own leaderboard, renamed and holding the three league teams.
 *
 * Every account is born with one, so this renames what is already there. It also
 * prunes anything else Mo owns: a crashed 08.1 run leaves its throwaway behind,
 * and the "Your Leaderboards (1)" heading three specs walk past would then be
 * wrong.
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

  const inIt = new Set((await leagueTeams(owner, board.id)).map((t) => t.id));
  for (const key of TEAMS_IN_LEAGUE) {
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

  // KB 08 Athletic must NOT be in the league at rest - 08.3 adds it itself. A
  // crashed 08.3 run leaves it in, so take it out again.
  const athletic = String(teamIdByKey.athletic);
  if ((await leagueTeams(owner, board.id)).some((t) => t.id === athletic)) {
    const r = await asUser(owner.token, `/leaderboards/${board.id}/teams/${athletic}`, { method: 'DELETE' });
    note('DELETE', `/leaderboards/${board.id}/teams/${athletic}`, r.status, `${TEAMS.athletic} taken back out`);
  }

  return board;
}

/**
 * Ada as an Administrator on the leaderboard.
 *
 * Only a Pro owner may add one - on Free the same call answers 400
 * LEADERBOARD_ADMIN_LIMIT_EXCEEDED (config/api.md). Adding by email links the
 * account that already holds that address: the id that comes back is Ada's own
 * playerId, and she reads the board with `isAdmin: true`.
 */
async function ensureAdmin(owner, boardId, adminEmail) {
  const detail = (await asUser(owner.token, `/leaderboards/${boardId}`)).body?.data ?? {};
  if ((detail.adminPlayers ?? []).some((p) => p.email === adminEmail)) {
    note('GET', `/leaderboards/${boardId}`, 200, `${adminEmail} is already an Administrator`);
    return;
  }
  const r = await asUser(owner.token, `/leaderboards/${boardId}/admin`, {
    method: 'POST', body: { email: adminEmail },
  });
  if (!r.ok) throw new Error(`POST /leaderboards/${boardId}/admin: ${j(r.body)}`);
  note('POST', `/leaderboards/${boardId}/admin`, r.status, `${adminEmail} is an Administrator`);
}

/**
 * The venue, created once.
 *
 * `GET /club-locations?query=` searches every venue on the platform, so match on
 * the exact name rather than trusting the first row back.
 */
async function ensureVenue(owner) {
  const found = ((await asUser(owner.token, `/club-locations?query=${encodeURIComponent(VENUE.name)}`))
    .body?.data ?? []).find((v) => v.name === VENUE.name && !v.isDeleted);
  if (found) {
    note('GET', '/club-locations', 200, `"${VENUE.name}" exists - ${found.id}`);
    return found.id;
  }
  const r = await asUser(owner.token, '/club-locations', { method: 'POST', body: VENUE });
  if (!r.ok) throw new Error(`POST /club-locations: ${j(r.body)}`);
  note('POST', '/club-locations', r.status, `"${VENUE.name}" ${r.body.data.id}`);
  return r.body.data.id;
}

/** Every match in the leaderboard, whatever its status. */
async function leagueMatches(owner, boardId) {
  const res = await asUser(
    owner.token,
    `/leaderboards/${boardId}/matches?limit=50&skip=0&includeIncomplete=true`,
  );
  const rows = res.body?.data?.result ?? res.body?.data ?? [];
  return rows.map((m) => ({ id: m.id, date: String(m.date).slice(0, 10), status: m.status }));
}

/**
 * Create one match, and play it unless the fixture says to leave it scheduled.
 *
 * Order matters and cannot be retried: create, wait for Live, write the events,
 * finish. A match created with a past date starts itself a second or two after
 * POST /matches answers, so the wait is a poll on its own status - a sleep that
 * is a moment short loses every event that follows it.
 */
async function playMatch(owner, team, board, plan, venueId) {
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
      duration: MATCH_DEFAULTS.duration,
      teamSize: MATCH_DEFAULTS.teamSize,
      leaderboardId: board.id,
      tag: MATCH_DEFAULTS.tag,
      // A match with no venue comes back Incomplete, not Scheduled, and the
      // Matches tab then offers Finish Setup instead of a fixture card. Only the
      // fixture that stays unplayed needs one: the four that were played reached
      // Finished without it, and a played match can no longer be edited.
      ...(plan.scheduled ? { clubLocationId: venueId } : {}),
    },
  });
  if (!made.ok) throw new Error(`POST /matches ${plan.key}: ${j(made.body)}`);
  const matchId = made.body.data.id;
  note('POST', '/matches', made.status, `${plan.key} ${plan.date.slice(0, 10)} ${matchId}`);
  if (plan.scheduled) return matchId;

  const statusOf = async () => (await asUser(owner.token, `/matches/${matchId}`)).body?.data?.status;
  let status = await statusOf();
  for (let i = 0; i < 30 && status !== 'Live' && status !== 'Paused'; i += 1) {
    if (status === 'Scheduled') {
      await asUser(owner.token, `/matches/${matchId}/status`, { method: 'POST', body: { status: 'Live' } });
    }
    await sleep(2000);
    status = await statusOf();
  }
  if (status !== 'Live' && status !== 'Paused') {
    throw new Error(`${matchId} never went Live (stuck on ${status}); events cannot be written`);
  }
  note('GET', `/matches/${matchId}`, 200, `status=${status}`);

  const teamType = { home: 'HomeTeam', away: 'AwayTeam' };
  for (const e of plan.events) {
    const t = e.side === 'home' ? home : away;
    const tp = (n) => {
      const row = t.members.find((x) => x.name === n);
      if (!row) throw new Error(`${n} is not on ${t.name}`);
      return row.id;
    };
    const body = {
      type: e.type,
      teamId: t.id,
      teamPlayerId: tp(e.player),
      teamType: teamType[e.side],
      ...(e.assist ? { assistedTeamPlayerId: tp(e.assist) } : {}),
    };
    const r = await asUser(owner.token, `/matches/${matchId}/events`, { method: 'POST', body });
    if (!r.ok) throw new Error(`POST /matches/${matchId}/events ${e.type} ${e.player}: ${j(r.body)}`);
    note('POST', `/matches/${matchId}/events`, r.status, `${e.type} ${e.player}`);
  }

  const fin = await asUser(owner.token, `/matches/${matchId}/status`, {
    method: 'POST', body: { status: 'Finished' },
  });
  if (!fin.ok) throw new Error(`POST /matches/${matchId}/status Finished: ${j(fin.body)}`);
  note('POST', `/matches/${matchId}/status`, fin.status, `${plan.key} Finished`);
  return matchId;
}

/**
 * The comment thread on the leaderboard.
 *
 * A comment cannot be taken back. `DELETE /comments/:commentId` does exist -
 * it is not in the Postman collection, and it answers 401 "Unauthorized to
 * delete this comment" even to the account that wrote it (staging, 2026-08-31).
 * So a duplicate is permanent, and the only repair is --rebuild, which drops the
 * leaderboard the comments hang off.
 *
 * That is not hypothetical: the first run of this seed posted the reply twice,
 * because `GET /comments` returns TOP-LEVEL comments only. A reply lives behind
 * `GET /comments/:id/replies` and is invisible to the parent listing - the
 * parent carries nothing but a `replyCount`. Read both lists before posting
 * anything.
 */
async function ensureComments(boardId, tokenFor) {
  const q = `entityId=${boardId}&commentType=leaderboard&limit=50&skip=0`;
  const readTop = async () => {
    const res = await asUser(tokenFor.pro, `/comments?${q}`);
    return res.body?.data?.comments ?? [];
  };
  const readReplies = async (parentId) => {
    const res = await asUser(tokenFor.pro, `/comments/${parentId}/replies?${q}`);
    return res.body?.data?.comments ?? [];
  };
  /** Every comment on the board, parents and replies alike. */
  const readAll = async () => {
    const top = await readTop();
    const nested = [];
    for (const c of top) if (c.replyCount) nested.push(...await readReplies(c.id));
    return [...top, ...nested];
  };

  let have = await readAll();
  const posted = [];
  for (const [i, c] of COMMENTS.entries()) {
    const found = have.find((x) => x.comment === c.text);
    if (found) {
      note('GET', '/comments', 200, `already posted: "${c.text.slice(0, 40)}..."`);
      posted[i] = String(found.id);
      continue;
    }
    const body = {
      entityId: boardId,
      commentType: 'leaderboard',
      comment: c.text,
      ...(c.replyTo !== undefined ? { parentCommentId: posted[c.replyTo] } : {}),
    };
    if (c.replyTo !== undefined && !body.parentCommentId) {
      throw new Error(`comment ${i} is a reply to ${c.replyTo}, which has no id yet`);
    }
    const r = await asUser(tokenFor[c.as], '/comments', { method: 'POST', body });
    if (!r.ok) throw new Error(`POST /comments as ${c.as}: ${j(r.body)}`);
    posted[i] = String(r.body.data?.id ?? r.body.data?._id);
    note('POST', '/comments', r.status, `as ${c.as}: "${c.text.slice(0, 40)}..."`);
    have = await readAll();
  }
  return posted;
}

// --- 0. optional teardown ---------------------------------------------------

// The leaderboard goes first and on purpose. A comment cannot be deleted, and a
// comment belongs to its `entityId` - so dropping the leaderboard is the only way
// to clear a comment thread that came out wrong. That is what --rebuild is for,
// and it costs replaying the four matches, because a played match cannot be moved
// into a different leaderboard afterwards.
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

let pro = await ensureAccount('pro');
pro = await ensureProfile(pro, 'pro');
pro = await ensureMembership(pro, 'Pro');
ids.pro = { id: pro.id, playerId: pro.playerId, membership: pro.membership };

let adminAcct = await ensureAccount('admin');
adminAcct = await ensureProfile(adminAcct, 'admin');
adminAcct = await ensureMembership(adminAcct, 'Free');
ids.admin = { id: adminAcct.id, playerId: adminAcct.playerId };

// Fern is left exactly as she was born: one leaderboard, two teams, nothing
// added. Being at the Free limit with no setup is what 08.1's Free half needs.
let free = await ensureAccount('free');
free = await ensureProfile(free, 'free');
free = await ensureMembership(free, 'Free');
const fernBoards = (await asUser(free.token, '/leaderboards')).body?.data ?? [];
note('GET', '/leaderboards', 200, `${free.email} owns ${fernBoards.filter((b) => b.isOwner).length} (Free limit is 1)`);
ids.free = {
  id: free.id,
  playerId: free.playerId,
  bornLeaderboard: fernBoards.find((b) => b.isOwner)?.name ?? null,
};

let outsider = await ensureAccount('outsider');
outsider = await ensureProfile(outsider, 'outsider');
outsider = await ensureMembership(outsider, 'Free');
ids.outsider = { id: outsider.id, playerId: outsider.playerId };

// --- 2. the four teams and their squads -------------------------------------

const teamId = {
  united: await ensureRenamedTeam(pro, 'united'),
  athletic: await ensureRenamedTeam(pro, 'athletic'),
  rovers: await ensureTeam(pro, 'rovers'),
  city: await ensureTeam(pro, 'city'),
};
for (const key of Object.keys(teamId)) {
  await ensureSquad(pro, teamId[key], SQUADS[key]);
}

const team = {};
for (const key of Object.keys(teamId)) {
  team[key] = { id: teamId[key], name: TEAMS[key], members: await members(pro, teamId[key]) };
}
ids.teams = Object.fromEntries(Object.entries(teamId).map(([k, v]) => [TEAMS[k], v]));

// --- 3. the leaderboard, its Administrator and its matches ------------------

const board = await ensureLeaderboard(pro, teamId);
ids.leaderboard = { id: board.id, name: board.name };
await ensureAdmin(pro, board.id, ACCOUNTS.admin);

const venueId = await ensureVenue(pro);
ids.venue = { id: venueId, name: VENUE.name };

// Matched on the date, not counted: the three teams have played different
// numbers of games, so no count can tell a half-seeded league from a whole one.
const already = new Set((await leagueMatches(pro, board.id)).map((m) => m.date));
for (const plan of MATCHES) {
  const day = plan.date.slice(0, 10);
  if (already.has(day)) {
    note('GET', `/leaderboards/${board.id}/matches`, 200, `${plan.key} ${day} exists - left alone`);
    continue;
  }
  await playMatch(pro, team, board, plan, venueId);
}
// An earlier run may have created the fixture before the venue existed, which
// leaves it Incomplete. A FUTURE match can still be edited, so repair it rather
// than rebuilding the league.
for (const m of await leagueMatches(pro, board.id)) {
  const plan = MATCHES.find((x) => x.date.slice(0, 10) === m.date);
  if (!plan?.scheduled || m.status === 'Scheduled') continue;
  const r = await asUser(pro.token, `/matches/${m.id}`, {
    method: 'PUT', body: { clubLocationId: venueId },
  });
  if (!r.ok) throw new Error(`PUT /matches/${m.id} clubLocationId: ${j(r.body)}`);
  note('PUT', `/matches/${m.id}`, r.status, `${m.status} -> Scheduled, venue attached`);
}
ids.matches = await leagueMatches(pro, board.id);

// --- 4. the comment thread --------------------------------------------------

ids.comments = await ensureComments(board.id, {
  pro: pro.token, admin: adminAcct.token, outsider: outsider.token,
});

// --- 5. verify --------------------------------------------------------------
//
// Statistics are written asynchronously after a match finishes: reading them a
// second after Finished returns zeroes and the same call a minute later returns
// the right numbers. Poll.

const readTable = async () => {
  const rows = (await asUser(pro.token, `/leaderboards/${board.id}/stats/teams`)).body?.data ?? [];
  const list = Array.isArray(rows) ? rows : (rows.result ?? []);
  return Object.fromEntries(list.map((r) => [r.teamName, {
    rank: r.rank,
    totalMatches: r.totalMatches,
    totalWins: r.totalWins,
    totalLosses: r.totalLosses,
    goalScored: r.goalScored,
    cleanSheets: r.cleanSheets,
  }]));
};
const agrees = (got) => Object.entries(EXPECTED_TABLE).every(([name, want]) => {
  const row = got[name];
  return row && Object.entries(want).every(([k, v]) => row[k] === v);
});

let table = await readTable();
for (let i = 0; i < 25 && !agrees(table); i += 1) {
  await sleep(3000);
  table = await readTable();
}

console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- league table ---');
console.log(j(table));
console.log(`\nwrites this run: ${writes}`);

if (!agrees(table)) {
  const wrong = [];
  for (const [name, want] of Object.entries(EXPECTED_TABLE)) {
    const row = table[name] ?? {};
    for (const [k, v] of Object.entries(want)) if (row[k] !== v) wrong.push(`${name}.${k}=${row[k]} want ${v}`);
  }
  console.error(`\nLEAGUE TABLE IS WRONG:\n  ${wrong.join('\n  ')}`);
  console.error('A finished match cannot be edited or deleted. Re-run with --rebuild.');
  process.exit(1);
}
console.log(`\nSeed complete. League table matches lib/fixtures-08.mjs. Throwaway name: ${THROWAWAY}`);

// Idempotent seed for collection 11 - "Match insights & statistics".
//
//   node scripts/seed-11.mjs
//   node scripts/seed-11.mjs --rebuild     # delete both accounts first
//
// Safe to re-run. Every account, team, member and match is looked up before it
// is written, so a second run makes zero writes. Nothing here reads a clock, a
// random value, or a mailbox.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the two addresses in lib/fixtures-11.mjs.
//
// --- Read this before you re-run it after a failure ----------------------
//
// The three matches are the one thing here that cannot be rebuilt in place. A
// finished match cannot be reopened, edited or deleted, and the statistics it
// wrote stay on the player even if the team is deleted. See lib/fixtures-11.mjs.
//
// So this script never touches a match it did not have to create, and it
// verifies both scorelines and statistics at the end. If the verification fails,
// the fix is `--rebuild`. There is no smaller repair.
//
// --- Two things about a Free account that shape this seed ----------------
//
// 1. A new account is born with ONE leaderboard and TWO teams, and Free may own
//    exactly one leaderboard (config/api.md). So the seed RENAMES the owner's
//    born leaderboard rather than creating one, and a match without a
//    leaderboardId writes no statistics at all.
// 2. On Free a friend may belong to exactly one of your teams. Every friend
//    below is on one team only.

import 'dotenv/config';
import { admin, asUser, mintSession, j } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, TEAMS, ATHLETIC_BORN, LEADERBOARD, SQUADS, POSITIONS,
  MATCH_DEFAULTS, MATCHES, EXPECTED_PLAYER_STATS, EXPECTED_TEAM_STATS,
} from '../lib/fixtures-11.mjs';

const REBUILD = process.argv.includes('--rebuild');

const ids = {};
let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(46)} -> ${status}  ${detail ?? ''}`);
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
  const profile = PROFILES[key];
  const existing = await lookup(email);
  if (existing) {
    note('GET', '/users/me', 200, `${email} exists - id=${existing.id}`);
    return existing;
  }
  const made = await admin('/admins/users', {
    method: 'POST', body: { name: profile.name, lastName: profile.lastName, email },
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
 * PUT /users/:userId is a full replace, not a patch: leaving `gender` out
 * answers 400 "gender is required". So every write sends the whole profile.
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
  note('PUT', `/users/${me.id}`, put.status, `${p.gender}, ${p.position}, bio ${p.bio.length} chars`);
  return (await lookup(me.email)) ?? me;
}

const teamsOf = async (me) => (await asUser(me.token, '/teams?all=true')).body?.data ?? [];

async function ensureTeam(owner, name) {
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
  const stored = made.body.data.name;
  if (stored !== name) throw new Error(`POST /teams: asked for "${name}", got "${stored}"`);
  const teamId = (await teamsOf(owner)).find((t) => t.name === name)?.teamId;
  note('POST', '/teams', made.status, `"${name}" ${teamId}`);
  return teamId;
}

/**
 * KB 11 Athletic: the owner's born team, renamed.
 *
 * Every new account is born with two teams. Renaming the first is cheaper than
 * creating a third and it keeps the team list the size the app made it. The born
 * name carries a date suffix only when it clashes, and that suffix changes on
 * --rebuild, so match the pattern first and the final name after.
 */
async function ensureThirdTeam(owner) {
  const teams = await teamsOf(owner);
  const already = teams.find((t) => t.name === TEAMS.third);
  if (already) {
    note('GET', '/teams?all=true', 200, `"${TEAMS.third}" exists - ${already.teamId}`);
    return already.teamId;
  }
  const born = teams.find((t) => ATHLETIC_BORN.test(t.name));
  if (!born) {
    throw new Error(
      `${owner.email} has no team matching ${ATHLETIC_BORN} to rename into "${TEAMS.third}". `
      + `Teams: ${teams.map((t) => t.name).join(', ')}`,
    );
  }
  const r = await asUser(owner.token, `/teams/${born.teamId}`, {
    method: 'PUT', body: { name: TEAMS.third },
  });
  if (!r.ok) throw new Error(`PUT /teams/${born.teamId}: ${j(r.body)}`);
  note('PUT', `/teams/${born.teamId}`, r.status, `renamed "${born.name}" -> "${TEAMS.third}"`);
  return born.teamId;
}

/** Live members of a team, with the display name the app shows. */
async function members(owner, teamId) {
  const all = (await asUser(owner.token, `/teams/${teamId}/players?includeFans=true`)).body?.data ?? [];
  // Removed members stay in the list flagged isDeleted, with their address
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
  if (squad.member) {
    const email = ACCOUNTS[squad.member];
    if (!have.some((m) => m.email === email)) {
      const person = PROFILES[squad.member];
      const r = await asUser(owner.token, '/team-players', {
        method: 'POST',
        body: { teamId, name: `${person.name} ${person.lastName}`, email, role: 'Player' },
      });
      if (!r.ok) throw new Error(`POST /team-players ${email}: ${j(r.body)}`);
      note('POST', '/team-players', r.status, `${email} invited to ${teamId}`);
    }
  }
  for (const name of squad.friends) {
    if (have.some((m) => m.name === name)) continue;
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST', body: { teamId, name, role: 'Player' },
    });
    if (!r.ok) throw new Error(`POST /team-players ${name}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${name} added to ${teamId}`);
  }
}

/**
 * Accept whatever team invitations are outstanding.
 *
 * The membership exists the moment the owner adds the address, but the
 * invitation stays pending until it is accepted, and a pending invitation puts a
 * card on the home page that no capture wants. The id is on `invitationId`.
 */
async function acceptInvitations(me) {
  const list = (await asUser(me.token, '/team-invitations')).body?.data ?? [];
  if (!list.length) {
    note('GET', '/team-invitations', 200, `${me.email}: nothing pending`);
    return;
  }
  const teamInvitationIds = list.map((x) => x.invitationId);
  const r = await asUser(me.token, '/team-invitations/accept', {
    method: 'POST', body: { teamInvitationIds },
  });
  if (!r.ok) throw new Error(`POST /team-invitations/accept: ${j(r.body)}`);
  note('POST', '/team-invitations/accept', r.status, `${me.email}: ${list.map((x) => x.teamName).join(', ')}`);
}

/**
 * The owner's own leaderboard, renamed and holding both teams.
 *
 * Free owns exactly one leaderboard and every account is born with one, so this
 * renames what is already there instead of creating a second.
 */
async function ensureLeaderboard(owner, teamIds) {
  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  if (!boards.length) throw new Error(`${owner.email} has no leaderboard - Free cannot create a second one`);
  let board = boards[0];
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

  // The teams list comes back nested differently from the add - a team's id is
  // on `teamId` on some rows and `id` on others, and it can arrive wrapped in
  // `result` - so flatten it rather than trusting a shape.
  const listed = (await asUser(owner.token, `/leaderboards/${board.id}/teams`)).body?.data ?? [];
  const rows = Array.isArray(listed) ? listed : (listed.result ?? []);
  const inIt = new Set(rows.flatMap(
    (t) => [t.teamId, t.id, t.team?.teamId, t.team?.id].filter(Boolean).map(String),
  ));
  for (const teamId of teamIds) {
    if (inIt.has(String(teamId))) {
      note('GET', `/leaderboards/${board.id}/teams`, 200, `${teamId} already in "${board.name}"`);
      continue;
    }
    const r = await asUser(owner.token, `/leaderboards/${board.id}/teams`, {
      method: 'POST', body: { teamId },
    });
    if (!r.ok) throw new Error(`POST /leaderboards/${board.id}/teams: ${j(r.body)}`);
    note('POST', `/leaderboards/${board.id}/teams`, r.status, teamId);
  }
  return board;
}

/**
 * Every finished match a team has played, oldest first.
 *
 * Keyed on the match date by the caller: the four fixture dates are distinct, so
 * a date that is already there is a match that already exists. Counting instead
 * would be wrong - the fourth match does not involve City, so City's count never
 * reaches four however many times this runs.
 */
async function playedMatches(owner, teamId) {
  const res = await asUser(
    owner.token,
    `/teams/${teamId}/matches?scheduleType=Past&includeIncomplete=true&limit=50&skip=0`,
  );
  const rows = res.body?.data?.result ?? res.body?.data ?? [];
  return rows
    .filter((m) => m.status === 'Finished')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

/**
 * Create and play one match, once.
 *
 * Order matters and cannot be retried: create, wait for the match to be Live,
 * write the events, finish. A match created with a date in the past starts
 * itself a second or two later, so the wait is a poll on its own status rather
 * than a sleep - posting an event a moment too early answers 400 "Match must be
 * live or paused to add events" and that goal is simply lost.
 */
async function playMatch(owner, home, away, board, plan) {
  const lineup = (team, order) => order.map((name, i) => {
    const m = team.members.find((x) => x.name === name);
    if (!m) throw new Error(`${name} is not on ${team.name}: ${team.members.map((x) => x.name).join(', ')}`);
    return { teamPlayerId: m.id, position: POSITIONS[i] };
  });
  const sheet = (which, team) => plan.lineups?.[which] ?? SQUADS[which === 'home' ? plan.home : plan.away].lineup;

  const made = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: { teamId: home.id, formation: MATCH_DEFAULTS.formation, players: lineup(home, sheet('home', home)) },
      awayTeam: { teamId: away.id, formation: MATCH_DEFAULTS.formation, players: lineup(away, sheet('away', away)) },
      date: plan.date,
      duration: MATCH_DEFAULTS.duration,
      teamSize: MATCH_DEFAULTS.teamSize,
      leaderboardId: board.id,
      tag: MATCH_DEFAULTS.tag,
    },
  });
  if (!made.ok) throw new Error(`POST /matches ${plan.key}: ${j(made.body)}`);
  const matchId = made.body.data.id;
  note('POST', '/matches', made.status, `${plan.key} ${plan.date.slice(0, 10)} ${matchId}`);

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

  const side = { home, away };
  const teamType = { home: 'HomeTeam', away: 'AwayTeam' };
  for (const e of plan.events) {
    const team = side[e.side];
    const tp = (n) => {
      const row = team.members.find((x) => x.name === n);
      if (!row) throw new Error(`${n} is not on ${team.name}`);
      return row.id;
    };
    const body = {
      type: e.type,
      teamId: team.id,
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

// --- 0. optional teardown ---------------------------------------------------

if (REBUILD) {
  for (const email of Object.values(ACCOUNTS)) {
    const me = await lookup(email);
    if (!me) { note('DELETE', email, 404, 'was not there'); continue; }
    for (const t of await teamsOf(me)) {
      if (!Object.values(TEAMS).includes(t.name)) continue;
      const r = await asUser(me.token, `/teams/${t.teamId}`, { method: 'DELETE' });
      note('DELETE', `/teams/${t.teamId}`, r.status, t.name);
    }
    const r = await admin(`/admins/user-delete/${me.id}`, { method: 'DELETE' });
    note('DELETE', `/admins/user-delete/${me.id}`, r.status, email);
  }
}

// --- 1. the two accounts ----------------------------------------------------

let player = await ensureAccount('player');
player = await ensureProfile(player, 'player');
ids.player = { id: player.id, playerId: player.playerId, uid: player.uid };

let owner = await ensureAccount('owner');
owner = await ensureProfile(owner, 'owner');
ids.owner = { id: owner.id, playerId: owner.playerId };

// Both accounts stay Free. Nothing this collection photographs is gated, and a
// membership that drifts changes what the sidebar and the profile show.
for (const who of [player, owner]) {
  if (who.membership === 'Free') continue;
  const r = await admin(`/admins/change-user-membership/${who.id}`, {
    method: 'POST', body: { membership: 'Free' },
  });
  note('POST', `/admins/change-user-membership/${who.id}`, r.status, `${who.email} back to Free`);
}

// --- 2. the two teams and their squads --------------------------------------

const teamId = {
  home: await ensureTeam(owner, TEAMS.home),
  away: await ensureTeam(owner, TEAMS.away),
  third: await ensureThirdTeam(owner),
};
for (const which of ['home', 'away', 'third']) {
  await ensureSquad(owner, teamId[which], SQUADS[which]);
}
await acceptInvitations(player);

const team = {};
for (const which of ['home', 'away', 'third']) {
  team[which] = {
    id: teamId[which],
    name: TEAMS[which],
    members: await members(owner, teamId[which]),
  };
}
ids.teams = Object.fromEntries(Object.entries(teamId).map(([k, v]) => [TEAMS[k], v]));

// --- 3. the leaderboard and the four matches --------------------------------
//
// All three teams go in. A match that is not in a leaderboard writes no
// statistics at all (config/api.md), which is the whole subject of this
// collection.

const board = await ensureLeaderboard(owner, Object.values(teamId));
ids.leaderboard = { id: board.id, name: board.name };

// Matched on the date, not counted. The fourth match does not involve City, so a
// count taken from one team can never reach four - and a count that is short by
// one would replay the wrong match. Nothing here edits or deletes: it cannot.
const existing = new Set([
  ...(await playedMatches(owner, teamId.home)),
  ...(await playedMatches(owner, teamId.away)),
].map((m) => String(m.date).slice(0, 10)));

for (const plan of MATCHES) {
  const day = plan.date.slice(0, 10);
  if (existing.has(day)) {
    note('GET', `/teams/${teamId[plan.home]}/matches`, 200, `${plan.key} ${day} already played - left alone`);
    continue;
  }
  await playMatch(owner, team[plan.home], team[plan.away], board, plan);
}
ids.matches = (await playedMatches(owner, teamId.home)).map((m) => ({
  id: m.id, date: String(m.date).slice(0, 10), status: m.status,
}));

// --- 4. verify --------------------------------------------------------------
//
// Statistics are written asynchronously after a match finishes - reading them a
// second after posting Finished returns zeroes, and the same call a minute later
// returns the right numbers. That lag is what article 11.3 is about. Poll.

const fresh = await lookup(ACCOUNTS.player);
const readPlayerStats = async () => {
  const s = (await asUser(fresh.token, `/players/${fresh.playerId}/stats`)).body?.data ?? {};
  return {
    totalMatches: s.winLossDraws?.totalMatches,
    wins: s.winLossDraws?.wins,
    losses: s.winLossDraws?.losses,
    draws: s.winLossDraws?.draws,
    goalsScored: s.goalsScored,
    assists: s.assists,
    playerOfMatch: s.playerOfMatch,
    yellowCards: s.yellowCards,
    redCards: s.redCards,
  };
};
const readTeamStats = async () => {
  const s = (await asUser(owner.token, `/teams/${teamId.home}/stats`)).body?.data?.stats ?? {};
  return {
    matches: s.matches, wins: s.wins, draws: s.draws, losses: s.losses,
    goals: s.goals, conceded: s.conceded, cleanSheets: s.cleanSheets,
    winStreak: s.winStreak, yellowCards: s.yellowCards, playerOfMatch: s.playerOfMatch,
  };
};

const agrees = (got, want) => Object.entries(want).every(([k, v]) => got[k] === v);
let gotPlayer = await readPlayerStats();
let gotTeam = await readTeamStats();
for (let i = 0; i < 25 && !(agrees(gotPlayer, EXPECTED_PLAYER_STATS) && agrees(gotTeam, EXPECTED_TEAM_STATS)); i += 1) {
  await sleep(3000);
  gotPlayer = await readPlayerStats();
  gotTeam = await readTeamStats();
}

console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- statistics ---');
console.log(j({ player: gotPlayer, team: gotTeam }));
console.log(`\nwrites this run: ${writes}`);

const wrong = [
  ...Object.entries(EXPECTED_PLAYER_STATS).filter(([k, v]) => gotPlayer[k] !== v).map(([k]) => `player.${k}`),
  ...Object.entries(EXPECTED_TEAM_STATS).filter(([k, v]) => gotTeam[k] !== v).map(([k]) => `team.${k}`),
];
if (wrong.length) {
  console.error(`\nSTATISTICS ARE WRONG: ${wrong.join(', ')}`);
  console.error(`Expected player ${j(EXPECTED_PLAYER_STATS)}`);
  console.error(`Expected team   ${j(EXPECTED_TEAM_STATS)}`);
  console.error('A finished match cannot be edited or deleted. Re-run with --rebuild.');
  process.exit(1);
}
console.log('\nSeed complete. Statistics match lib/fixtures-11.mjs.');

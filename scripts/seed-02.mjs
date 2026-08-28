// Idempotent seed for collection 02 - "Finding your way around & your profile".
//
//   node scripts/seed-02.mjs
//   node scripts/seed-02.mjs --rebuild     # delete the three accounts first
//
// Safe to re-run. Every account, team, member, follow and the one match is
// looked up before it is written, so a second run makes almost no writes.
// Nothing here reads a clock, a random value, or a mailbox.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the three addresses in lib/fixtures-02.mjs. It never
// touches another collection's.
//
// --- Read this before you re-run it after a failure ----------------------
//
// The match is the one thing here that cannot be rebuilt in place. A finished
// match cannot be reopened, edited or deleted, and the statistics it wrote stay
// on the player even if the team is deleted. See lib/fixtures-02.mjs for the
// three staging behaviours that add up to that.
//
// So this script never touches a match it did not have to create, and it
// verifies the scoreline at the end. If the verification fails, the fix is
// `--rebuild`: it deletes the three accounts outright and starts from nothing.
// There is no smaller repair.

import 'dotenv/config';
import {
  admin, asUser, mintSession, upload, j,
} from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, IMAGES, TEAMS, SQUADS, POSITIONS, MATCH,
  EXPECTED_PLAYER_STATS, FOLLOWS,
} from '../lib/fixtures-02.mjs';

const REBUILD = process.argv.includes('--rebuild');

const ids = {};
const note = (method, path, status, detail) =>
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(48)} -> ${status}  ${detail ?? ''}`);

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
 * PUT /users/:userId is a full replace, not a patch: leaving `gender` out of the
 * body answers 400 "gender is required". So every write here sends the whole
 * profile, and an image token is added to the same body rather than sent alone.
 */
async function ensureProfile(me, key, extra = {}) {
  const p = PROFILES[key];
  const sameProfile = me.gender === p.gender
    && me.position === p.position
    && me.bio === p.bio
    && me.isMarketingOpted === false
    && (me.sports ?? []).join() === p.sports.join()
    && String(me.dateOfBirth ?? '').startsWith(p.dateOfBirth);
  if (sameProfile && !Object.keys(extra).length) {
    note('GET', '/users/me', 200, `${me.email}: profile already set`);
    return me;
  }
  const put = await asUser(me.token, `/users/${me.id}`, { method: 'PUT', body: { ...p, ...extra } });
  if (!put.ok) throw new Error(`PUT /users/${me.id}: ${j(put.body)}`);
  note('PUT', `/users/${me.id}`, put.status,
    `${p.gender}, ${p.position}, bio ${p.bio.length} chars${Object.keys(extra).join(' ') && ` + ${Object.keys(extra).join(' ')}`}`);
  return (await lookup(me.email)) ?? me;
}

/**
 * Give the persona her profile photo and banner.
 *
 * Both endpoints answer with a token and the token is stored by PUT
 * /users/:userId, and both refuse anything that is not WebP - which is why
 * assets/02/ holds two encodings of each image. lib/api.mjs, upload().
 *
 * Skipped when the player already carries a version for that image, so a
 * re-run does not churn the file and change what the screenshots show.
 */
async function ensureImages(me) {
  const player = (await asUser(me.token, `/players/${me.playerId}?all=true`)).body?.data ?? {};
  const extra = {};
  if (!player.playerAvatarVersion) {
    const up = await upload(me.token, '/players/avatar', 'avatar', IMAGES.avatarWebp);
    if (!up.ok) throw new Error(`POST /players/avatar: ${j(up.body)}`);
    note('POST', '/players/avatar', up.status, IMAGES.avatarWebp);
    extra.avatarToken = up.body.data;
  }
  if (!player.playerBannerVersion) {
    const up = await upload(me.token, `/players/${me.playerId}/banner`, 'banner', IMAGES.bannerWebp);
    if (!up.ok) throw new Error(`POST /players/:id/banner: ${j(up.body)}`);
    note('POST', `/players/${me.playerId}/banner`, up.status, IMAGES.bannerWebp);
    extra.bannerToken = up.body.data;
  }
  if (!Object.keys(extra).length) {
    note('GET', `/players/${me.playerId}`, 200, 'photo and banner already set');
    return me;
  }
  return ensureProfile(me, 'player', extra);
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
    body: { name, teamSize: MATCH.teamSize, defaultFormation: { formation: MATCH.formation } },
  });
  if (!made.ok) throw new Error(`POST /teams ${name}: ${j(made.body)}`);
  // The name comes back suffixed when another account already holds it - staging
  // answered "Otto K FC 2808" for a plain "Otto K FC" - so read it back rather
  // than assuming the name asked for is the name stored.
  const stored = made.body.data.name;
  if (stored !== name) throw new Error(`POST /teams: asked for "${name}", got "${stored}"`);
  const teamId = (await teamsOf(owner)).find((t) => t.name === name)?.teamId;
  note('POST', '/teams', made.status, `"${name}" ${teamId}`);
  return teamId;
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
  const email = ACCOUNTS[squad.member];
  if (!have.some((m) => m.email === email)) {
    const person = PROFILES[squad.member];
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST',
      body: { teamId, name: `${person.name} ${person.lastName}`, email, role: 'Player' },
    });
    // On the Free plan a friend may belong to exactly one of your teams -
    // "ONE_FRIEND_PER_TEAM". Each account is on one team here, so this should
    // never fire; it is worth failing loudly if the plan rules move.
    if (!r.ok) throw new Error(`POST /team-players ${email}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${email} invited to ${teamId}`);
  }
  for (const name of squad.friends) {
    if (have.some((m) => m.name === name)) continue;
    const r = await asUser(owner.token, '/team-players', { method: 'POST', body: { teamId, name, role: 'Player' } });
    if (!r.ok) throw new Error(`POST /team-players ${name}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${name} added to ${teamId}`);
  }
}

/**
 * Accept whatever team invitations are outstanding.
 *
 * The membership exists the moment the owner adds the address - the account
 * already shows the team under /teams?all=true - but the invitation stays
 * pending until it is accepted, and a pending invitation is a card on the home
 * page that no capture wants. The id is on `invitationId`, not `id`.
 */
async function acceptInvitations(me) {
  const list = (await asUser(me.token, '/team-invitations')).body?.data ?? [];
  if (!list.length) {
    note('GET', '/team-invitations', 200, `${me.email}: nothing pending`);
    return;
  }
  const teamInvitationIds = list.map((x) => x.invitationId);
  const r = await asUser(me.token, '/team-invitations/accept', { method: 'POST', body: { teamInvitationIds } });
  if (!r.ok) throw new Error(`POST /team-invitations/accept: ${j(r.body)}`);
  note('POST', '/team-invitations/accept', r.status, `${me.email}: ${list.map((x) => x.teamName).join(', ')}`);
}

async function ensureLeaderboardTeams(owner, teamIds) {
  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  if (!boards.length) throw new Error(`${owner.email} has no leaderboard to put the match in`);
  const board = boards[0];
  // The list comes back nested differently from the add - a team's id is on
  // `teamId` on some rows and `id` on others, and it can arrive wrapped in
  // `result` - so flatten it to a set of strings rather than trusting a shape.
  const listed = (await asUser(owner.token, `/leaderboards/${board.id}/teams`)).body?.data ?? [];
  const rows = Array.isArray(listed) ? listed : (listed.result ?? []);
  const inIt = new Set(rows.flatMap((t) => [t.teamId, t.id, t.team?.teamId, t.team?.id].filter(Boolean).map(String)));
  for (const teamId of teamIds) {
    if (inIt.has(String(teamId))) {
      note('GET', `/leaderboards/${board.id}/teams`, 200, `${teamId} already in "${board.name}"`);
      continue;
    }
    const r = await asUser(owner.token, `/leaderboards/${board.id}/teams`, { method: 'POST', body: { teamId } });
    if (!r.ok) throw new Error(`POST /leaderboards/${board.id}/teams: ${j(r.body)}`);
    note('POST', `/leaderboards/${board.id}/teams`, r.status, teamId);
  }
  return board;
}

/**
 * Create and play the one match, once.
 *
 * Order matters and cannot be retried: create, wait for the match to be Live,
 * write the events, finish. A match created with a date in the past starts
 * itself a second or two later, so the wait is a poll on its own status rather
 * than a sleep - posting an event a moment too early answers 400 "Match must be
 * live or paused to add events" and that goal is simply lost.
 */
async function ensureMatch(owner, home, away, board) {
  const played = ((await asUser(owner.token, `/teams/${home.id}/matches?scheduleType=Past&includeIncomplete=true&limit=50&skip=0`))
    .body?.data?.result ?? []).filter((m) => m.status === 'Finished');
  if (played.length) {
    note('GET', `/teams/${home.id}/matches`, 200, `${played.length} finished match(es) already - left alone`);
    return played[0].id;
  }

  const lineup = (team, order) => order.map((name, i) => {
    const m = team.members.find((x) => x.name === name);
    if (!m) throw new Error(`${name} is not on ${team.name}: ${team.members.map((x) => x.name).join(', ')}`);
    return { teamPlayerId: m.id, position: POSITIONS[i] };
  });

  const made = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: { teamId: home.id, formation: MATCH.formation, players: lineup(home, SQUADS.home.lineup) },
      awayTeam: { teamId: away.id, formation: MATCH.formation, players: lineup(away, SQUADS.away.lineup) },
      date: MATCH.date,
      duration: MATCH.duration,
      teamSize: MATCH.teamSize,
      leaderboardId: board.id,
      tag: MATCH.tag,
    },
  });
  if (!made.ok) throw new Error(`POST /matches: ${j(made.body)}`);
  const matchId = made.body.data.id;
  note('POST', '/matches', made.status, `${home.name} v ${away.name} ${matchId}`);

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
  for (const e of MATCH.events) {
    const team = side[e.side];
    const tp = (n) => team.members.find((x) => x.name === n)?.id;
    const assistTeam = side[e.side];
    const body = {
      type: e.type,
      teamId: team.id,
      teamPlayerId: tp(e.player),
      teamType: teamType[e.side],
      ...(e.assist ? { assistedTeamPlayerId: assistTeam.members.find((x) => x.name === e.assist)?.id } : {}),
    };
    const r = await asUser(owner.token, `/matches/${matchId}/events`, { method: 'POST', body });
    if (!r.ok) throw new Error(`POST /matches/${matchId}/events ${e.type} ${e.player}: ${j(r.body)}`);
    note('POST', `/matches/${matchId}/events`, r.status, `${e.type} ${e.player}`);
  }

  const fin = await asUser(owner.token, `/matches/${matchId}/status`, { method: 'POST', body: { status: 'Finished' } });
  if (!fin.ok) throw new Error(`POST /matches/${matchId}/status Finished: ${j(fin.body)}`);
  note('POST', `/matches/${matchId}/status`, fin.status, 'Finished');
  return matchId;
}

async function ensureFollow(me, path, what) {
  const already = (await asUser(me.token, path)).body?.data;
  if (already === true || already?.isFollowing === true) {
    note('GET', path, 200, `${me.email} already follows ${what}`);
    return;
  }
  const r = await asUser(me.token, path, { method: 'POST' });
  if (!r.ok) throw new Error(`POST ${path}: ${j(r.body)}`);
  note('POST', path, r.status, `${me.email} follows ${what}`);
}

// --- 0. optional teardown ---------------------------------------------------

if (REBUILD) {
  for (const email of Object.values(ACCOUNTS)) {
    const me = await lookup(email);
    if (!me) { note('DELETE', email, 404, 'was not there'); continue; }
    // Delete the teams first: a team whose owner has gone is not something this
    // seed can reach again, and staging keeps it.
    for (const t of await teamsOf(me)) {
      if (!Object.values(TEAMS).includes(t.name)) continue;
      note('DELETE', `/teams/${t.teamId}`, (await asUser(me.token, `/teams/${t.teamId}`, { method: 'DELETE' })).status, t.name);
    }
    const r = await admin(`/admins/user-delete/${me.id}`, { method: 'DELETE' });
    note('DELETE', `/admins/user-delete/${me.id}`, r.status, email);
  }
}

// --- 1. the three accounts --------------------------------------------------

let player = await ensureAccount('player');
player = await ensureProfile(player, 'player');
player = await ensureImages(player);
ids.player = { id: player.id, playerId: player.playerId, uid: player.uid };

let owner = await ensureAccount('owner');
owner = await ensureProfile(owner, 'owner');
ids.owner = { id: owner.id, playerId: owner.playerId };

let pro = await ensureAccount('pro');
pro = await ensureProfile(pro, 'pro');
if (pro.membership !== 'Pro') {
  const r = await admin(`/admins/change-user-membership/${pro.id}`, { method: 'POST', body: { membership: 'Pro' } });
  if (!r.ok) throw new Error(`change-user-membership ${pro.email}: ${j(r.body)}`);
  note('POST', `/admins/change-user-membership/${pro.id}`, r.status, 'Pro');
  pro = await lookup(ACCOUNTS.pro);
}
ids.pro = { id: pro.id, playerId: pro.playerId, membership: pro.membership };

// The persona must stay Free: 02.8's Free half is her own screen, and every
// other article in this collection is captured as a Free member.
if (player.membership !== 'Free') {
  const r = await admin(`/admins/change-user-membership/${player.id}`, { method: 'POST', body: { membership: 'Free' } });
  note('POST', `/admins/change-user-membership/${player.id}`, r.status, 'back to Free');
  player = await lookup(ACCOUNTS.player);
}

// --- 2. the two teams and their squads --------------------------------------

const homeId = await ensureTeam(owner, TEAMS.home);
const awayId = await ensureTeam(owner, TEAMS.away);
await ensureSquad(owner, homeId, SQUADS.home);
await ensureSquad(owner, awayId, SQUADS.away);
await acceptInvitations(player);
await acceptInvitations(pro);

const home = { id: homeId, name: TEAMS.home, members: await members(owner, homeId) };
const away = { id: awayId, name: TEAMS.away, members: await members(owner, awayId) };
ids.teams = { [TEAMS.home]: homeId, [TEAMS.away]: awayId };

// --- 3. the leaderboard and the match ---------------------------------------

const board = await ensureLeaderboardTeams(owner, [homeId, awayId]);
ids.leaderboard = { id: board.id, name: board.name };
ids.match = await ensureMatch(owner, home, away, board);

// --- 4. follows -------------------------------------------------------------

const account = { player, owner, pro };
const teamId = { home: homeId, away: awayId };

await ensureFollow(
  player,
  `/players/${account[FOLLOWS.playerFollowsPlayer].playerId}/follow`,
  `${PROFILES[FOLLOWS.playerFollowsPlayer].name} (player)`,
);
await ensureFollow(player, `/teams/${teamId[FOLLOWS.playerFollowsTeam]}/follow`, TEAMS[FOLLOWS.playerFollowsTeam]);
await ensureFollow(
  pro,
  `/players/${account[FOLLOWS.proFollowsPlayer].playerId}/follow`,
  `${PROFILES[FOLLOWS.proFollowsPlayer].name} (player)`,
);

// --- 5. verify --------------------------------------------------------------
//
// The match cannot be repaired, so the run says plainly whether it came out
// right. A mismatch here means `--rebuild`, not a retry.

// Statistics are written asynchronously after a match finishes - the seed's
// first run read all zeroes a second after posting Finished, and the same call
// read the right numbers a minute later. config/personas.yaml says the same
// thing about the player persona. So poll rather than assert once.
const fresh = await lookup(ACCOUNTS.player);
const readStats = async () => {
  const s = (await asUser(fresh.token, `/players/${fresh.playerId}/stats`)).body?.data ?? {};
  return {
    totalMatches: s.winLossDraws?.totalMatches,
    wins: s.winLossDraws?.wins,
    losses: s.winLossDraws?.losses,
    draws: s.winLossDraws?.draws,
    goalsScored: s.goalsScored,
    playerOfMatch: s.playerOfMatch,
  };
};
const matches = (g) => Object.entries(EXPECTED_PLAYER_STATS).every(([k, v]) => g[k] === v);
let got = await readStats();
for (let i = 0; i < 20 && !matches(got); i += 1) {
  await sleep(3000);
  got = await readStats();
}
const wrong = Object.entries(EXPECTED_PLAYER_STATS).filter(([k, v]) => got[k] !== v);

console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- kb-player-02 state ---');
console.log(j({
  membership: fresh.membership,
  gender: fresh.gender,
  dateOfBirth: fresh.dateOfBirth,
  position: fresh.position,
  sports: fresh.sports,
  bio: fresh.bio,
  teams: (await teamsOf(fresh)).map((t) => `${t.name} (${t.role})`),
  leaderboards: ((await asUser(fresh.token, '/leaderboards')).body?.data ?? []).map((l) => l.name),
  stats: got,
}));

if (wrong.length) {
  console.error('\nSTATISTICS ARE WRONG. A finished match cannot be edited or deleted.');
  console.error(`Expected ${j(EXPECTED_PLAYER_STATS)}`);
  console.error(`Got      ${j(got)}`);
  console.error('Re-run with --rebuild: nothing smaller can repair this.');
  process.exit(1);
}
console.log('\nSeed complete. Statistics match lib/fixtures-02.mjs.');

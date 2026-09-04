// Idempotent seed for collection 24 - "Troubleshooting & policies".
//
//   node scripts/seed-24.mjs
//   node scripts/seed-24.mjs --rebuild     # delete both accounts first
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the two addresses in lib/fixtures-24.mjs and the
// entities those accounts own.
//
// --- Two halves, and they behave differently ------------------------------
//
// **Reconciled.** Both accounts, their memberships and profiles, Owen's four
// teams and their squads, Marc's Administrator row on KB 24 United, the venue
// and the match are all looked up before they are written. A second run makes
// no writes to any of them.
//
// **Rebuilt.** Marc's KB 24 Comments FC is deleted and made again every run.
// 24.4 posts a comment on it through the UI to photograph the profanity mask,
// and a comment cannot be deleted - `DELETE /comments/:id` answers 401 to its
// own author (config/api.md, "Comments and likes"). Deleting the team is the
// only way to clear the thread. Its id therefore changes on every run and no
// spec may hardcode it.
//
// --- Why Owen is Pro ------------------------------------------------------
//
// 24.1 photographs the one control an Administrator cannot use on Edit Team,
// which needs Marc to be an Administrator on somebody's team. On Free,
// `POST /team-players` with `role: "Administrator"` is refused outright
// (TEAM_ADMIN_LIMIT_EXCEEDED). So the team's Owner has to be Pro, and Marc,
// the Free reader, is the one who gets added.
//
// --- The match --------------------------------------------------------------
//
// One Scheduled match, KB 24 Rovers v KB 24 Town, on a FIXED future date. Marc
// is on neither side, so he opens it as a spectator - 24.1's fourth capture.
// The seed refuses to run once MATCH_DATE has passed: a match whose date has
// arrived starts itself (config/api.md, "The match lifecycle").
//
// Matches cannot be deleted once close to their date and cannot be un-started,
// so the match is reconciled by date rather than rebuilt: the seed looks for a
// Scheduled match between the two teams on MATCH_DATE and creates one only when
// there is none.

import 'dotenv/config';
import { admin, asUser, mintSession } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, PROFILE_FIELDS, TEAMS, COMMENTS_TEAM, VENUE, SQUAD,
  LEADERBOARD, MATCH_DATE, MATCH,
} from '../lib/fixtures-24.mjs';

const REBUILD = process.argv.includes('--rebuild');

let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(56)} -> ${status}  ${detail ?? ''}`);
};
const fail = (what, r) => {
  throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
};

if (Date.parse(MATCH_DATE) <= Date.now()) {
  throw new Error(
    `MATCH_DATE ${MATCH_DATE} has passed. 24.1 photographs a match that has not been played:\n` +
    'a passed date starts the match by itself. Move MATCH_DATE forward in lib/fixtures-24.mjs\n' +
    '(and MATCH_DATE_SHOWN with it), then re-run specs/24/24.1.spec.ts.',
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
 * The whole profile, in one PUT.
 *
 * `PUT /users/:userId` is a full REPLACE that clears every optional field it
 * leaves out (config/api.md, "Users"), so the bio and `isTourCompleted` ride
 * together. Both matter here:
 *
 * - **`isTourCompleted: true`.** Every match page opens Shepherd.js's guided
 *   tour over an opaque overlay on an account that has never dismissed it, and
 *   that overlay swallows every click and sits in every capture. 24.1 and 24.2
 *   both open the match page.
 * - **`bio: ''`.** Step 1's probe of the profanity mask wrote a masked bio to
 *   Marc's account. 24.4 does not photograph a bio, but nothing else should
 *   either, so it is cleared here on every run.
 *
 * Only written when the account is not already in that state.
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
  note('PUT', `/users/${user.id}`, r.status, `${user.email} tour dismissed, bio cleared, profile fields set`);
}

// --- teams ------------------------------------------------------------------

async function myTeams(user) {
  return (await asUser(user.token, '/teams?all=true')).body?.data ?? [];
}

async function ensureTeam(owner, name, extra = {}) {
  const hit = (await myTeams(owner)).find((t) => t.name === name);
  if (hit) {
    note('GET', '/teams?all=true', 200, `${name} exists ${hit.teamId}`);
    return hit.teamId;
  }
  const r = await asUser(owner.token, '/teams', {
    method: 'POST',
    body: { name, teamSize: MATCH.teamSize, defaultFormation: { formation: MATCH.formation }, ...extra },
  });
  if (!r.ok) fail(`create team ${name}`, r);
  note('POST', '/teams', r.status, `${name} ${r.body.data.id}${extra.isPrivate ? ' (dummy)' : ''}`);
  return r.body.data.id;
}

/** Every live member row on a team, keyed by the name the fixture uses. */
async function squadRows(owner, teamId) {
  const rows = ((await asUser(owner.token, `/teams/${teamId}/players`)).body?.data ?? [])
    .filter((p) => !p.isDeleted);
  const byName = new Map();
  for (const r of rows) byName.set(r.player?.name ?? r.name, r);
  return byName;
}

async function ensureSquad(owner, teamId, side) {
  const rows = await squadRows(owner, teamId);
  for (const m of SQUAD[side]) {
    if (rows.has(m.name)) continue;
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST', body: { teamId, name: m.name, role: 'Player' },
    });
    if (!r.ok) fail(`add ${m.name} to ${side}`, r);
    note('POST', '/team-players', r.status, `${m.name} -> ${TEAMS[side]}`);
  }
  const after = await squadRows(owner, teamId);
  for (const m of SQUAD[side]) if (!after.has(m.name)) throw new Error(`${m.name} is not on ${TEAMS[side]}`);
  return after;
}

/**
 * Marc as Administrator of KB 24 United.
 *
 * Adding him by email puts him on the team at once and leaves an invitation
 * pending, which lands him on /team/join at sign-in until it is accepted
 * (config/api.md, "Team players"). So the seed accepts it for him, as him.
 */
async function ensureAdministrator(owner, teamId, reader) {
  const rows = ((await asUser(owner.token, `/teams/${teamId}/players`)).body?.data ?? [])
    .filter((p) => !p.isDeleted);
  const mine = rows.find((p) => p.email === reader.email || p.player?.id === reader.playerId);
  if (mine && mine.role === 'Administrator') {
    note('GET', `/teams/${teamId}/players`, 200, `${reader.email} already Administrator`);
  } else if (mine) {
    throw new Error(`${reader.email} is on ${TEAMS.united} as ${mine.role}, not Administrator - fix by hand`);
  } else {
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST',
      body: { teamId, name: reader.name + ' KB', email: reader.email, role: 'Administrator' },
    });
    if (!r.ok) fail('add Marc as Administrator', r);
    note('POST', '/team-players', r.status, `${reader.email} -> ${TEAMS.united} as Administrator`);
  }
  const inv = (await asUser(reader.token, '/team-invitations')).body?.data ?? [];
  const ids = inv.filter((i) => i.teamId === teamId).map((i) => i.invitationId);
  if (ids.length) {
    const r = await asUser(reader.token, '/team-invitations/accept', {
      method: 'POST', body: { teamInvitationIds: ids },
    });
    if (!r.ok) fail('accept invitation', r);
    note('POST', '/team-invitations/accept', r.status, `${ids.length} invitation(s)`);
  }
  const role = (await myTeams(reader)).find((t) => t.teamId === teamId)?.role;
  if (role !== 'Administrator') throw new Error(`${reader.email} reads ${TEAMS.united} as ${role}`);
}

async function ensureVenue(owner) {
  const found = (await asUser(owner.token, `/club-locations?query=${encodeURIComponent(VENUE.name)}`)).body?.data;
  const list = Array.isArray(found) ? found : found?.result ?? found?.clubLocations ?? [];
  const hit = list.find((v) => v.name === VENUE.name);
  if (hit) { note('GET', '/club-locations', 200, `${VENUE.name} exists ${hit.id}`); return hit.id; }
  const r = await asUser(owner.token, '/club-locations', { method: 'POST', body: VENUE });
  if (!r.ok) fail('create venue', r);
  note('POST', '/club-locations', r.status, `${VENUE.name} ${r.body.data.id}`);
  return r.body.data.id;
}

/**
 * Owen's league, holding both sides of the match.
 *
 * It exists because a match with no `leaderboardId` never leaves `Incomplete`
 * (config/api.md, "A match with no venue is Incomplete, not Scheduled" - the
 * leaderboard is the surprising one of the seven required fields). The first
 * run of this seed found that out: the match came back `Incomplete`.
 */
async function ensureLeaderboard(owner, teamIds) {
  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  let id = boards.find((b) => b.name === LEADERBOARD)?.id;
  if (id) {
    note('GET', '/leaderboards', 200, `${LEADERBOARD} exists ${id}`);
  } else {
    const r = await asUser(owner.token, '/leaderboards', { method: 'POST', body: { name: LEADERBOARD } });
    if (!r.ok) fail('create leaderboard', r);
    id = r.body.data.id;
    note('POST', '/leaderboards', r.status, `${LEADERBOARD} ${id}`);
  }
  const inBoard = ((await asUser(owner.token, `/leaderboards/${id}/teams`)).body?.data ?? [])
    .map((t) => t.teamId ?? t.id ?? t.team?.id);
  for (const teamId of teamIds) {
    if (inBoard.includes(teamId)) continue;
    const a = await asUser(owner.token, `/leaderboards/${id}/teams`, { method: 'POST', body: { teamId } });
    if (!a.ok) fail('add team to leaderboard', a);
    note('POST', `/leaderboards/${id}/teams`, a.status, teamId);
  }
  return id;
}

/**
 * The Scheduled match, reconciled by date.
 *
 * Seven fields have to be present or the match never leaves `Incomplete`
 * (config/api.md): both sides, date, duration, team size, venue and
 * leaderboard. Both line-ups are filled from the squads.
 *
 * An `Incomplete` match on the fixture date is completed rather than replaced -
 * `PUT /matches/:id` accepts a missing field on a future match - because the
 * first run of this seed left one behind.
 */
async function ensureMatch(owner, ids, squads) {
  const list = (await asUser(owner.token,
    `/teams/${ids.home}/matches?scheduleType=Upcoming&includeIncomplete=true&limit=50&skip=0`)).body?.data?.result ?? [];
  const onDate = (m) => Date.parse(m.date) === Date.parse(MATCH_DATE)
    && (m.awayTeam?.teamId ?? m.awayTeam?.id) === ids.away;
  const scheduled = list.find((m) => onDate(m) && m.status === 'Scheduled');
  if (scheduled) {
    note('GET', `/teams/${ids.home}/matches`, 200, `match exists ${scheduled.id} Scheduled`);
    return scheduled.id;
  }
  const incomplete = list.find((m) => onDate(m) && m.status === 'Incomplete');
  if (incomplete) {
    const p = await asUser(owner.token, `/matches/${incomplete.id}`, {
      method: 'PUT', body: { leaderboardId: ids.leaderboard, clubLocationId: ids.venue },
    });
    if (!p.ok) fail('complete match', p);
    const now = (await asUser(owner.token, `/matches/${incomplete.id}`)).body?.data;
    note('PUT', `/matches/${incomplete.id}`, p.status, `was Incomplete, now ${now?.status}`);
    if (now?.status !== 'Scheduled') throw new Error(`match ${incomplete.id} is ${now?.status} after completion`);
    return incomplete.id;
  }
  const lineup = (teamId, side, rows) => ({
    teamId,
    formation: MATCH.formation,
    players: SQUAD[side].map((m) => ({ teamPlayerId: rows.get(m.name).id, position: m.position })),
  });
  const r = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: lineup(ids.home, 'home', squads.home),
      awayTeam: lineup(ids.away, 'away', squads.away),
      date: MATCH_DATE,
      duration: MATCH.duration,
      teamSize: MATCH.teamSize,
      clubLocationId: ids.venue,
      leaderboardId: ids.leaderboard,
      tag: MATCH.tag,
    },
  });
  if (!r.ok) fail('create match', r);
  note('POST', '/matches', r.status, `${TEAMS.home} v ${TEAMS.away} ${r.body.data.id} status=${r.body.data.status}`);
  if (r.body.data.status !== 'Scheduled') throw new Error(`match is ${r.body.data.status}, not Scheduled`);
  return r.body.data.id;
}

/** Marc's comments team: deleted and remade, every run. */
async function rebuildCommentsTeam(reader) {
  for (const t of (await myTeams(reader)).filter((x) => x.name === COMMENTS_TEAM)) {
    const r = await asUser(reader.token, `/teams/${t.teamId}`, { method: 'DELETE' });
    note('DELETE', `/teams/${t.teamId}`, r.status, `${COMMENTS_TEAM} - last run's comments go with it`);
  }
  const r = await asUser(reader.token, '/teams', {
    method: 'POST',
    body: { name: COMMENTS_TEAM, teamSize: MATCH.teamSize, defaultFormation: { formation: MATCH.formation } },
  });
  if (!r.ok) fail(`create ${COMMENTS_TEAM}`, r);
  note('POST', '/teams', r.status, `${COMMENTS_TEAM} ${r.body.data.id}`);
  return r.body.data.id;
}

// --- run --------------------------------------------------------------------

const reader = await ensureAccount('reader');
const owner = await ensureAccount('owner');
await ensureProfile(reader);
await ensureProfile(owner);

const unitedId = await ensureTeam(owner, TEAMS.united);
const dummyId = await ensureTeam(owner, TEAMS.dummy, { isPrivate: true });
const homeId = await ensureTeam(owner, TEAMS.home);
const awayId = await ensureTeam(owner, TEAMS.away);
const squads = {
  home: await ensureSquad(owner, homeId, 'home'),
  away: await ensureSquad(owner, awayId, 'away'),
};
await ensureAdministrator(owner, unitedId, reader);
const venueId = await ensureVenue(owner);
const leaderboardId = await ensureLeaderboard(owner, [homeId, awayId]);
const matchId = await ensureMatch(owner, { home: homeId, away: awayId, venue: venueId, leaderboard: leaderboardId }, squads);
const commentsId = await rebuildCommentsTeam(reader);

// --- verify -----------------------------------------------------------------

const dummy = (await asUser(reader.token, `/teams/${dummyId}`)).body?.data;
if (!dummy?.isPrivate || dummy.isTeamManager) throw new Error(`${TEAMS.dummy} is not a dummy team Marc cannot manage`);
const homeAsMarc = (await asUser(reader.token, `/teams/${homeId}`)).body?.data;
if (homeAsMarc?.isTeamManager) throw new Error(`Marc manages ${TEAMS.home} - Access Denied cannot be photographed`);
const match = (await asUser(reader.token, `/matches/${matchId}`)).body?.data;
if (match?.status !== 'Scheduled') throw new Error(`match ${matchId} is ${match?.status}`);
const del = await asUser(reader.token, `/teams/${unitedId}`, { method: 'DELETE' });
if (del.status !== 403) throw new Error(`Marc's DELETE on ${TEAMS.united} answered ${del.status}, expected 403`);
note('DELETE', `/teams/${unitedId}`, del.status, `as Administrator - "${del.body?.permission}" (the check, not a write)`);
writes -= 1;
// The settings page of a leaderboard Marc has no role on fails to the app's
// error boundary (24.3's third capture). The 403 underneath it is the check.
const boardTeams = await asUser(reader.token, `/leaderboards/${leaderboardId}/teams`);
if (boardTeams.status !== 403) throw new Error(`Marc reads ${LEADERBOARD}'s teams with ${boardTeams.status}, expected 403`);
const board = { id: leaderboardId, name: LEADERBOARD };

console.log('\n--- collection 24 fixture ---');
console.log(`reader   ${ACCOUNTS.reader.padEnd(32)} user ${reader.id}  player ${reader.playerId}  Free`);
console.log(`owner    ${ACCOUNTS.owner.padEnd(32)} user ${owner.id}  player ${owner.playerId}  Pro`);
console.log(`team     ${TEAMS.united.padEnd(32)} ${unitedId}  Marc = Administrator`);
console.log(`team     ${TEAMS.dummy.padEnd(32)} ${dummyId}  dummy, Owen's`);
console.log(`team     ${TEAMS.home.padEnd(32)} ${homeId}  Owen's, Marc not on it`);
console.log(`team     ${TEAMS.away.padEnd(32)} ${awayId}  Owen's, Marc not on it`);
console.log(`team     ${COMMENTS_TEAM.padEnd(32)} ${commentsId}  Marc's, REBUILT this run`);
console.log(`venue    ${VENUE.name.padEnd(32)} ${venueId}`);
console.log(`match    ${(TEAMS.home + ' v ' + TEAMS.away).padEnd(32)} ${matchId}  Scheduled ${MATCH_DATE}`);
console.log(`board    ${board.name.padEnd(32)} ${board.id}  Owen's - Marc gets the error boundary on its settings`);
console.log(`\n${writes} write(s).`);

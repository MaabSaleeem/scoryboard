// Idempotent seed for collection 21 - "Referees".
//
//   node scripts/seed-21.mjs
//   node scripts/seed-21.mjs --rebuild     # delete all three accounts first
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the three addresses in lib/fixtures-21.mjs and the
// entities those accounts own.
//
// --- Two halves, and they behave differently ------------------------------
//
// **Reconciled.** The three accounts, their memberships, the venue, the
// tournament and each referee row on it are looked up before they are written,
// so a second run makes no writes to any of them.
//
// **Rebuilt.** Both teams, the leaderboard and all three matches are disposed
// of and made again, every run.
//
// The reason is the match lifecycle and nothing else. A match cannot be
// un-started and cannot be un-finished, and this collection needs one Scheduled
// match, one Live match and one Finished match on screen at the same time. So
// the only way to have all three is to make three new ones each run.
//
// That makes this half NOT idempotent in ids: team ids, the leaderboard id and
// all three match ids change on every run. **No spec may hardcode any of them.**
// Specs look entities up by name and by status.
//
// --- Disposing of last run's matches --------------------------------------
//
// `DELETE /matches/:id` refuses anything whose date has passed - "Date must be
// at least one hour ahead of the current time" - so a Live or Finished match
// cannot be deleted. `PUT /matches/:id {"status":"Cancelled"}` answers 200 on a
// match that is Live, Paused or Finished, and the row then stops appearing in
// every listing (config/api.md, "The match lifecycle"). That is what the
// teardown uses, and it matters for more than tidiness: 21.2 photographs Rae's
// Past list, and without this every run would add another row to it.
//
// --- The one call that makes a referee ------------------------------------
//
// `POST /tournaments/:id/referee` is the only call in the product that sets
// `isReferee`. It needs a tournament, so Oona holds one for that reason alone.
//
// **`createMode` is required and config/api.md did not know it.** Sent without
// it the call answers `400 "Referee not found"` - and it has ALREADY flipped
// `isReferee: true` and `defaultProfile: "Referee"` on the target user by then.
// A malformed add therefore leaves an account marked as a referee with no
// referee row anywhere. Measured on staging 2026-09-03; see briefs/21.md,
// "Open questions".

import 'dotenv/config';
import { admin, asUser, mintSession } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, FULL_NAMES, TEAMS, LEADERBOARD, VENUE, TOURNAMENT,
  REFEREES, SQUAD, MATCH_DATE, LIVE_DATE, MATCHES, PLAYED_SCORE, REFEREE_BIO,
} from '../lib/fixtures-21.mjs';

const REBUILD = process.argv.includes('--rebuild');

let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(56)} -> ${status}  ${detail ?? ''}`);
};
const fail = (what, r) => {
  throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
};
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// The Scheduled match is the only absolute date here, and a passed one starts
// itself. Refuse rather than seed a fixture the specs cannot use.
for (const [name, when] of [['MATCH_DATE', MATCH_DATE], ['LIVE_DATE', LIVE_DATE]]) {
  if (Date.parse(when) <= Date.now()) {
    throw new Error(
      `${name} ${when} has passed. 21.2 and 21.3 both need matches whose dates are FIXED and ahead:\n` +
      'a passed date starts the match by itself, and the Scheduled fixture stops being Scheduled.\n' +
      'Move both forward in lib/fixtures-21.mjs (keep LIVE_DATE after MATCH_DATE, and move\n' +
      'CALENDAR_MONTH with them), then re-run every spec in specs/21.',
    );
  }
}
if (Date.parse(LIVE_DATE) <= Date.parse(MATCH_DATE)) {
  throw new Error('LIVE_DATE must be AFTER MATCH_DATE - see its note in lib/fixtures-21.mjs');
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

/**
 * The referee account is torn down and remade on EVERY run, `--rebuild` or not.
 *
 * `GET /referees/:playerId/stats` is a **lifetime** count and it counts
 * cancelled matches. Article 21.1 photographs its MATCHES tile, and without
 * this the figure grows by one on every seed run - measured at 1, then 2, then
 * 3 - so the same spec would publish a different number each time it ran. The
 * account is remade instead, which puts the tile back to exactly 1.
 *
 * Worth a ticket on its own account: a cancelled match still counts towards a
 * referee's total, and the REFEREED LEAGUES table underneath disagrees with the
 * tile because it hangs off the leaderboard, which this seed recreates. One run
 * read MATCHES 3 over a leagues row saying 1.
 *
 * `config/personas.yaml` has the precedent - the `fresh` persona "must be torn
 * down and recreated rather than reused, because its value is having no state".
 * Nothing references Rae's ids: every spec looks her up through fixtures21().
 */
const ALWAYS_REBUILD = new Set(['referee']);

async function ensureAccount(key) {
  const email = ACCOUNTS[key];
  const { name, membership } = PROFILES[key];

  if (REBUILD || ALWAYS_REBUILD.has(key)) {
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
    note('GET', '/users/me', 200, `${key} exists ${me.id} isReferee=${me.isReferee}`);
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

// --- the tournament, and the referees on it ---------------------------------

/**
 * The tournament exists for one reason: it is the only thing that can turn an
 * account into a referee. Nothing in this collection photographs it as a
 * tournament, so its format is never saved and it stays at teamCount 0.
 */
async function ensureTournament(owner) {
  const rows = (await asUser(owner.token, '/tournaments')).body?.data ?? [];
  const hit = rows.find((t) => t.title === TOURNAMENT);
  if (hit) {
    note('GET', '/tournaments', 200, `${TOURNAMENT} exists ${hit._id}`);
    return hit._id;
  }
  // Tournament Pro is granted, never paid for. Collections 16 and 17 are the
  // only ones that touch money.
  const g = await admin('/admins/users/tournament-free-pro/grant', {
    method: 'POST', body: { email: ACCOUNTS.organiser, plan: 'Pro', quantity: 1 },
  });
  note('POST', '/admins/users/tournament-free-pro/grant', g.status, 'Tournament Pro x1');
  const r = await asUser(owner.token, '/tournaments', {
    method: 'POST',
    body: {
      title: TOURNAMENT,
      gameType: 'Football',
      startDate: '2026-12-05',
      duration: '60 min',
      startTime: '19:00',
      timeZone: 'Europe/London',
      isAutoStartEnable: false,
    },
  });
  if (!r.ok) fail('create tournament', r);
  note('POST', '/tournaments', r.status, `${TOURNAMENT} ${r.body.data.id}`);
  return r.body.data.id;
}

/**
 * Bring the tournament's referee list to exactly what REFEREES says.
 *
 * Reconciled in both directions. A row the fixture does not name is removed -
 * this is what clears the probe referees an exploration leaves behind - and a
 * row it names is added only when it is missing.
 *
 * **A keyed referee is matched by playerId, not by name.** The referee account
 * is remade on every run (see ALWAYS_REBUILD), so last run's row carries the
 * deleted account's playerId while still reading "Rae KB". Matching on the name
 * would leave that dead row in place and never add the live account - which is
 * a stale row on the tournament and a referee with no assignments.
 *
 * `createMode: 'single'` is the tab that takes a name and an email. It is the
 * only mode that can flip a real account into a referee: 'global' needs a
 * playerId that is already in the caller's saved list, and 'multiple' is
 * refused by the server (see briefs/21.md, "Open questions").
 */
async function ensureReferees(owner, tournamentId, accounts) {
  const shown = (row) => [row.name, row.lastName].filter(Boolean).join(' ');
  const wantedIds = new Map(
    REFEREES.filter((r) => r.key).map((r) => [String(accounts[r.key].playerId), r]),
  );
  const wantedNames = new Map(REFEREES.filter((r) => !r.key).map((r) => [r.name, r]));

  const read = async () => {
    const td = (await asUser(owner.token, `/tournaments/${tournamentId}`)).body?.data;
    return td?.refereePlayers ?? [];
  };

  let rows = await read();
  for (const row of rows) {
    if (wantedIds.has(String(row.id)) || wantedNames.has(shown(row))) continue;
    const r = await asUser(owner.token, `/tournaments/${tournamentId}/referee/${row.id}`, { method: 'DELETE' });
    note('DELETE', `/tournaments/:id/referee/${row.id}`, r.status, `${shown(row)} removed - not in the fixture`);
  }

  rows = await read();
  const wanted = new Map([
    ...[...wantedIds].map(([id, r]) => [FULL_NAMES[r.key], { want: r, id }]),
    ...[...wantedNames].map(([name, r]) => [name, { want: r, id: null }]),
  ]);
  for (const [name, { want, id }] of wanted) {
    const already = rows.find((row) => (id ? String(row.id) === id : shown(row) === name));
    if (already) {
      note('GET', `/tournaments/${tournamentId}`, 200, `referee ${name} already on the tournament`);
      continue;
    }
    const body = {
      createMode: 'single',
      name: want.name,
      ...(want.lastName ? { lastName: want.lastName } : {}),
      ...(want.key ? { email: ACCOUNTS[want.key] } : {}),
      saveForFutureTournaments: want.saveForFutureTournaments,
      canStartEndMatches: want.canStartEndMatches,
    };
    const r = await asUser(owner.token, `/tournaments/${tournamentId}/referee`, { method: 'POST', body });
    if (!r.ok) fail(`add referee ${name}`, r);
    note('POST', `/tournaments/${tournamentId}/referee`, r.status, `${name} added`);
  }

  const final = await read();
  if (final.length !== REFEREES.length) {
    throw new Error(
      `the tournament holds ${final.length} referee(s), the fixture names ${REFEREES.length}: `
      + final.map((row) => `${shown(row)} (${row.id})`).join(', '),
    );
  }
  for (const [name, { id }] of wanted) {
    const hit = final.find((row) => (id ? String(row.id) === id : shown(row) === name));
    if (!hit) throw new Error(`referee ${name} is not on the tournament`);
  }

  // The organiser's SAVED referee list is a separate thing from the tournament's
  // referee list, and removing somebody from the tournament does not take them
  // out of it. It is `saveForFutureTournaments` on the player record, it is what
  // the dialog's "Saved referees" tab and `savedOnly=true` read, and the dialog
  // clears it with `PATCH /players/:playerId/referee-settings`.
  //
  // **That PATCH answers 200 to the tournament owner**, on somebody else's
  // player record. config/api.md recorded 403 for anybody but the player
  // themselves, which is wrong - corrected there with today's date.
  const savedWanted = new Set(
    REFEREES.filter((r) => r.saveForFutureTournaments).map((r) => (r.key ? FULL_NAMES[r.key] : r.name)),
  );
  const saved = (await asUser(owner.token, '/team-players/search?query=&searchType=referee&savedOnly=true&limit=50&skip=0'))
    .body?.data?.result ?? [];
  for (const row of saved) {
    if (savedWanted.has(row.name)) continue;
    const r = await asUser(owner.token, `/players/${row.id}/referee-settings`, {
      method: 'PATCH', body: { saveForFutureTournaments: false },
    });
    note('PATCH', `/players/${row.id}/referee-settings`, r.status, `${row.name} un-saved - not in the fixture`);
  }
  return final;
}

// --- teardown ---------------------------------------------------------------

/**
 * Cancel every match either referee is on, then delete the fixture teams and
 * the fixture leaderboard.
 *
 * Order matters. Matches first: a match holds a leaderboardId and a line-up on
 * each team, and cancelling it is what takes it out of the listings 21.2
 * photographs. Then teams, then the leaderboard - a leaderboard row points at a
 * team, so a team still in one leaves a dangling row behind.
 */
async function teardown(owner, referees) {
  // Two sweeps, and both are needed. The referee listing catches anything either
  // referee is named on; the owner's own listing catches a match on the fixture
  // teams that somebody else referees - which an exploration leaves behind.
  const seen = new Set();
  const sweep = async (who, path, label) => {
    const r = await asUser(who.token, path);
    for (const m of r.body?.data?.result ?? []) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      const c = await asUser(owner.token, `/matches/${m.id}`, { method: 'PUT', body: { status: 'Cancelled' } });
      note('PUT', `/matches/${m.id}`, c.status, `Cancelled - was ${m.status}, ${label}`);
    }
  };
  for (const scheduleType of ['Upcoming', 'Past']) {
    for (const ref of referees) {
      await sweep(ref, `/referees/${ref.playerId}/matches?scheduleType=${scheduleType}&limit=50&skip=0`, `refereed by ${ref.email}`);
    }
    await sweep(owner, `/players/${owner.playerId}/matches?scheduleType=${scheduleType}&limit=50&skip=0`, "on the owner's own list");
  }

  const teams = (await asUser(owner.token, '/teams?all=true')).body?.data ?? [];
  for (const wanted of Object.values(TEAMS)) {
    for (const t of teams.filter((x) => x.name === wanted)) {
      const r = await asUser(owner.token, `/teams/${t.teamId}`, { method: 'DELETE' });
      note('DELETE', `/teams/${t.teamId}`, r.status, wanted);
    }
  }

  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  for (const b of boards.filter((x) => x.name === LEADERBOARD)) {
    const r = await asUser(owner.token, `/leaderboards/${b.id}`, { method: 'DELETE' });
    note('DELETE', `/leaderboards/${b.id}`, r.status, LEADERBOARD);
  }
}

// --- build ------------------------------------------------------------------

async function createTeam(owner, name) {
  const r = await asUser(owner.token, '/teams', {
    method: 'POST',
    body: { name, teamSize: '5 VS 5', defaultFormation: { formation: '2-1-1' } },
  });
  if (!r.ok) fail(`create team ${name}`, r);
  note('POST', '/teams', r.status, `${name} ${r.body.data.id}`);
  return r.body.data.id;
}

async function fillSquad(owner, teamId, side) {
  for (const m of SQUAD[side]) {
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST', body: { teamId, name: m.name, role: 'Player' },
    });
    if (!r.ok) fail(`add ${m.name} to ${side}`, r);
    note('POST', '/team-players', r.status, `${m.name} -> ${side}`);
  }
}

async function createLeaderboard(owner, teamIds) {
  const r = await asUser(owner.token, '/leaderboards', { method: 'POST', body: { name: LEADERBOARD } });
  if (!r.ok) fail('create leaderboard', r);
  const id = r.body.data.id;
  note('POST', '/leaderboards', r.status, `${LEADERBOARD} ${id}`);
  for (const teamId of teamIds) {
    const a = await asUser(owner.token, `/leaderboards/${id}/teams`, { method: 'POST', body: { teamId } });
    if (!a.ok) fail('add team to leaderboard', a);
    note('POST', `/leaderboards/${id}/teams`, a.status, teamId);
  }
  return id;
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

/** Every live member row on a team, keyed by the name the fixture uses. */
async function squadRows(owner, teamId) {
  const rows = ((await asUser(owner.token, `/teams/${teamId}/players`)).body?.data ?? [])
    .filter((p) => !p.isDeleted);
  const byName = new Map();
  for (const r of rows) byName.set(r.player?.name ?? r.name, r);
  return byName;
}

/**
 * Create one match with both line-ups filled and Rae as its referee.
 *
 * Seven fields have to be present or the match never leaves `Incomplete`
 * (config/api.md). The referee goes on with a separate `PUT`, because
 * `POST /matches` does not take `refereePlayerId` - and it has to happen before
 * the match kicks off, since a Live match refuses every configuration field.
 */
async function createMatch(owner, ids, label, date, spec, refereePlayerId) {
  const home = await squadRows(owner, ids.home);
  const away = await squadRows(owner, ids.away);
  const lineup = (teamId, side, rows) => ({
    teamId,
    formation: '2-1-1',
    players: SQUAD[side].map((m) => ({ teamPlayerId: rows.get(m.name).id, position: m.position })),
  });

  const r = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: lineup(ids.home, 'home', home),
      awayTeam: lineup(ids.away, 'away', away),
      date,
      duration: spec.duration,
      teamSize: spec.teamSize,
      clubLocationId: ids.venue,
      leaderboardId: ids.leaderboard,
      tag: spec.tag,
    },
  });
  if (!r.ok) fail(`create match ${label}`, r);
  const matchId = r.body.data.id;
  note('POST', '/matches', r.status, `${label} ${matchId} status=${r.body.data.status}`);

  const ref = await asUser(owner.token, `/matches/${matchId}`, {
    method: 'PUT', body: { refereePlayerId },
  });
  if (!ref.ok) fail(`set referee on ${label}`, ref);
  note('PUT', `/matches/${matchId}`, ref.status, `referee ${FULL_NAMES.referee}`);
  return { id: matchId, home, away };
}

/** Poll a match until it reports `status`. Never sleep blind. */
async function waitForStatus(owner, matchId, status, reads = 40) {
  for (let i = 0; i < reads; i += 1) {
    const m = (await asUser(owner.token, `/matches/${matchId}`)).body?.data;
    if (m?.status === status) {
      note('GET', `/matches/${matchId}`, 200, `${status} after ${i + 1} read(s)`);
      return m;
    }
    if (status === 'Live' && (m?.status === 'Finished' || m?.status === 'Cancelled')) {
      throw new Error(`${matchId} went ${m.status} before it could be used`);
    }
    await wait(1500);
  }
  throw new Error(`${matchId} never reached ${status}`);
}

// --- run --------------------------------------------------------------------

const owner = await ensureAccount('organiser');
const referee = await ensureAccount('referee');
const newref = await ensureAccount('newref');

const tournamentId = await ensureTournament(owner);
const refereeRows = await ensureReferees(owner, tournamentId, { organiser: owner, referee, newref });

// ensureReferees flips isReferee and defaultProfile on both accounts, so re-read
// them: every 21.1 capture depends on those two fields.
const refereeNow = await lookup(ACCOUNTS.referee);
const newrefNow = await lookup(ACCOUNTS.newref);
for (const [key, u] of [['referee', refereeNow], ['newref', newrefNow]]) {
  if (!u.isReferee) throw new Error(`${key} is not a referee after the add`);
  note('GET', '/users/me', 200, `${key} isReferee=${u.isReferee} defaultProfile=${u.defaultProfile}`);
}

await teardown(owner, [refereeNow, newrefNow]);

const venueId = await ensureVenue(owner);
const homeId = await createTeam(owner, TEAMS.home);
await fillSquad(owner, homeId, 'home');
const awayId = await createTeam(owner, TEAMS.away);
await fillSquad(owner, awayId, 'away');
const leaderboardId = await createLeaderboard(owner, [homeId, awayId]);
const ids = { home: homeId, away: awayId, venue: venueId, leaderboard: leaderboardId };

// 1. The Scheduled match. Fixed date, in the future, never started.
const upcoming = await createMatch(owner, ids, 'upcoming', MATCH_DATE, MATCHES.upcoming, refereeNow.playerId);

// 2. The Live match. A fixed future date so nothing about it drifts, then
//    forced Live - which is exactly what START MATCH does (config/api.md).
const live = await createMatch(owner, ids, 'live', LIVE_DATE, MATCHES.live, refereeNow.playerId);
const start = await asUser(owner.token, `/matches/${live.id}/status`, { method: 'POST', body: { status: 'Live' } });
if (!start.ok) fail('force live', start);
note('POST', `/matches/${live.id}/status`, start.status, 'Live');
const liveMatch = await waitForStatus(owner, live.id, 'Live');

// 3. The Finished match. Dated 90 seconds back so it goes Live on its own, then
//    walked through its events and finished. Events are accepted only while a
//    match is Live, so this one is polled rather than slept on.
const played = await createMatch(
  owner, ids, 'played', new Date(Date.now() - 90_000).toISOString(), MATCHES.played, refereeNow.playerId,
);
await waitForStatus(owner, played.id, 'Live');
for (const e of MATCHES.played.events) {
  const rows = e.side === 'home' ? played.home : played.away;
  const body = {
    type: e.type,
    teamId: e.side === 'home' ? homeId : awayId,
    teamPlayerId: rows.get(e.scorer).id,
    teamType: e.side === 'home' ? 'HomeTeam' : 'AwayTeam',
  };
  if (e.assist) body.assistedTeamPlayerId = played.home.get(e.assist).id;
  const ev = await asUser(owner.token, `/matches/${played.id}/events`, { method: 'POST', body });
  if (!ev.ok) fail(`event ${e.type} ${e.scorer}`, ev);
  note('POST', `/matches/${played.id}/events`, ev.status, `${e.type} ${e.scorer}`);
}
const fin = await asUser(owner.token, `/matches/${played.id}/status`, { method: 'POST', body: { status: 'Finished' } });
if (!fin.ok) fail('finish match', fin);
note('POST', `/matches/${played.id}/status`, fin.status, 'Finished');

const playedMatch = await waitForStatus(owner, played.id, 'Finished');
if (playedMatch.homeTeamTotalGoals !== PLAYED_SCORE.home || playedMatch.awayTeamTotalGoals !== PLAYED_SCORE.away) {
  throw new Error(
    `played match is ${playedMatch.homeTeamTotalGoals}-${playedMatch.awayTeamTotalGoals}, ` +
    `fixture says ${PLAYED_SCORE.home}-${PLAYED_SCORE.away}`,
  );
}

// The whole profile, in one PUT per account.
//
// Two things ride together here because they have to. `PUT /users/:userId` is a
// full REPLACE that clears every optional field it leaves out (config/api.md,
// "Users"), so `isTourCompleted` and `refereeBio` cannot be set in separate
// calls - the second would wipe the first.
//
// **`isTourCompleted` is not cosmetic.** Every match page opens Shepherd.js's
// three-step guided tour over an opaque full-screen overlay on an account that
// has never dismissed it, and that overlay swallows every click and sits in
// every capture. It cost this collection's first probe of the score steppers a
// 20-second timeout. `lib/kb.ts` has `closeTour()` for the article that
// documents the tour (10.7); every other spec wants it never to appear.
async function setProfile(user, { refereeBio } = {}) {
  const details = (await asUser(user.token, `/players/${user.playerId}?all=true`)).body?.data ?? {};
  const body = {
    name: user.name,
    lastName: user.lastName,
    gender: details.playerGender ?? 'Female',
    dateOfBirth: (details.playerDateOfBirth ?? '1992-04-17T00:00:00.000Z').slice(0, 10),
    sports: details.sports?.length ? details.sports : ['Football'],
    isMarketingOpted: user.isMarketingOpted ?? true,
    isTourCompleted: true,
    ...(refereeBio === undefined ? {} : { refereeBio: refereeBio || undefined }),
    ...(user.isReferee ? { defaultProfile: 'Referee' } : {}),
  };
  const r = await asUser(user.token, `/users/${user.id}`, { method: 'PUT', body });
  if (!r.ok) fail(`set profile ${user.email}`, r);
  note('PUT', `/users/${user.id}`, r.status,
    `tour dismissed${refereeBio === undefined ? '' : refereeBio ? `, refereeBio set (${refereeBio.length} chars)` : ', refereeBio cleared'}`);
}

// 21.1 photographs the Referee Bio field empty and then filled, so its spec
// clears this and writes it back itself. The seed leaves it SET, which is the
// state every other spec expects.
await setProfile(refereeNow, { refereeBio: REFEREE_BIO });
await setProfile(owner);
await setProfile(newrefNow);

// --- verify -----------------------------------------------------------------

const seen = {};
for (const scheduleType of ['Upcoming', 'Past']) {
  const r = await asUser(refereeNow.token, `/referees/${refereeNow.playerId}/matches?scheduleType=${scheduleType}&limit=50&skip=0`);
  const list = r.body?.data?.result ?? [];
  seen[scheduleType] = list;
  note('GET', `/referees/:playerId/matches?scheduleType=${scheduleType}`, r.status,
    `${list.length} row(s): ${list.map((m) => m.status).join(', ')}`);
}
// Referee statistics are calculated asynchronously after a match finishes, the
// way player statistics are (config/api.md, "statsCalculatedAt"). Poll for the
// match to be counted rather than photographing a zero.
let stats;
for (let i = 0; i < 20; i += 1) {
  stats = (await asUser(refereeNow.token, `/referees/${refereeNow.playerId}/stats`)).body?.data;
  if (stats?.totalMatches >= 1) break;
  await wait(3000);
}
note('GET', `/referees/:playerId/stats`, 200, JSON.stringify(stats));
// Exactly one, not "at least one". The referee account is remade every run for
// this reason - see ALWAYS_REBUILD. A figure above 1 means the teardown left a
// match behind or the account was not rebuilt, and 21.1 would publish it.
if (stats?.totalMatches !== 1) {
  throw new Error(
    `referee statistics read totalMatches ${stats?.totalMatches}, expected exactly 1. `
    + '21.1 photographs that tile. See ALWAYS_REBUILD in this file.',
  );
}
const emptyRef = (await asUser(newrefNow.token, `/referees/${newrefNow.playerId}/matches?scheduleType=Upcoming&limit=10&skip=0`)).body?.data;
note('GET', `/referees/:playerId/matches (Nils)`, 200, `${emptyRef?.total ?? '?'} row(s) - the empty state 21.2 photographs`);

const bio = (await asUser(refereeNow.token, `/players/${refereeNow.playerId}?all=true`)).body?.data?.refereeBio;
if (bio !== REFEREE_BIO) throw new Error(`refereeBio reads back as ${JSON.stringify(bio)}`);

console.log('\n--- collection 21 fixture ---');
console.log(`organiser  ${ACCOUNTS.organiser.padEnd(30)} user ${owner.id}  player ${owner.playerId}  Pro`);
console.log(`referee    ${ACCOUNTS.referee.padEnd(30)} user ${refereeNow.id}  player ${refereeNow.playerId}  isReferee=true`);
console.log(`newref     ${ACCOUNTS.newref.padEnd(30)} user ${newrefNow.id}  player ${newrefNow.playerId}  isReferee=true, no matches`);
console.log(`tournament ${TOURNAMENT.padEnd(30)} ${tournamentId}`);
console.log(`referees on it: ${refereeRows.map((r) => `${[r.name, r.lastName].filter(Boolean).join(' ')} (registered=${r.isRegistered}, canStartEnd=${r.canStartEndMatches}, saved=${r.saveForFutureTournaments})`).join(' | ')}`);
console.log(`venue      ${VENUE.name.padEnd(30)} ${venueId}`);
console.log(`teams      ${TEAMS.home} ${homeId}  /  ${TEAMS.away} ${awayId}`);
console.log(`leaderboard ${LEADERBOARD.padEnd(29)} ${leaderboardId}`);
console.log(`match upcoming  ${upcoming.id}  Scheduled  ${MATCH_DATE}`);
console.log(`match live      ${live.id}  Live  startedAt ${liveMatch.startedAt}`);
console.log(`match played    ${played.id}  Finished  ${PLAYED_SCORE.home}-${PLAYED_SCORE.away}`);
console.log(`referee stats   ${JSON.stringify(stats)}`);
console.log(`\n${writes} write(s).`);

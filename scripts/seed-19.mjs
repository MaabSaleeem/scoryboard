// Idempotent seed for collection 19 - "Comments, likes & ratings".
//
//   node scripts/seed-19.mjs
//   node scripts/seed-19.mjs --rebuild     # delete all five accounts first
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the five addresses in lib/fixtures-19.mjs.
//
// --- Two halves, and they behave differently ------------------------------
//
// **Reconciled.** The five accounts, their memberships, the venue, Rae's
// referee flag and every rating are looked up before they are written, so a
// second run makes no writes to any of them.
//
// **Rebuilt.** Both teams, the leaderboard, the played match and every comment
// are deleted and made again, every run.
//
// The reason is the comment API and nothing else. **A comment cannot be
// deleted.** `DELETE /comments/:commentId` answers
// `401 "Unauthorized to delete this comment"` even to the account that wrote
// it, and nothing in the app calls it. So the only way to make a thread say
// exactly what the brief planned is to throw away the entity it hangs off and
// make a new one. Reconciling would leave every failed run's half-written
// comments in place for ever.
//
// That makes this half NOT idempotent in ids: team ids, the leaderboard id, the
// match id and every comment id change on every run. **No spec may hardcode
// any of them.** Specs look entities up by name and comments up by their text.
//
// --- Order matters ---------------------------------------------------------
//
// Teams are deleted before the leaderboard, because a leaderboard row points at
// a team. The match is created after both, because it needs `leaderboardId` and
// a line-up on each side - config/api.md, "A match with no venue is Incomplete":
// seven fields have to be present or the match never leaves `Incomplete`.
//
// The match is dated 90 seconds in the past and polled for `Live` before any
// event is written. Events are accepted only while a match is Live, and a match
// with a date months back is Live for about a second. scripts/seed-10.mjs hit
// this first; its note is the long version.
//
// --- What --rebuild costs -------------------------------------------------
//
// `DELETE /admins/user-delete/:id` anonymises the address, and the account is
// born again with new ids. It also throws away every rating these accounts have
// LEFT and every rating left ON them, because a rating is keyed by player id.
// Nothing here is unrecoverable - there is no Stripe account and no human step
// - but the born teams take a date suffix from the day they are created, so a
// rebuilt account's two born teams are named differently from the last run's.
// Prefer a plain run.

import 'dotenv/config';
import { admin, asUser, mintSession, upload } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, TEAMS, LEADERBOARD, VENUE, SQUAD, MATCH,
  COMMENTS, RATINGS, EXPECTED_AVERAGES,
} from '../lib/fixtures-19.mjs';

const REBUILD = process.argv.includes('--rebuild');

let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(54)} -> ${status}  ${detail ?? ''}`);
};

const fail = (what, r) => {
  throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
};

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
    note('GET', '/users/me', 200, `${key} exists ${me.id}`);
  }

  if (me.membership !== membership) {
    const r = await admin(`/admins/change-user-membership/${me.id}`, {
      method: 'POST', body: { membership },
    });
    if (!r.ok) fail(`membership ${email}`, r);
    note('POST', `/admins/change-user-membership/${me.id}`, r.status, `${me.membership} -> ${membership}`);
    me.membership = membership;
  }
  return me;
}

// --- teardown ---------------------------------------------------------------

/**
 * Delete the two fixture teams and the fixture leaderboard, if they are there.
 *
 * Teams first: a leaderboard holds team rows, and a team that is still in one
 * leaves a dangling row behind. Both are the owner's alone - an Administrator
 * gets 403 on either.
 */
async function teardown(owner) {
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

/**
 * Put the squad on a team.
 *
 * A member with a `key` is one of this collection's accounts and is added by
 * `email`, which links the existing player straight onto the team with no
 * invitation to accept. A member with no key is a name only, which creates a
 * friend record as a side effect (config/api.md) - fine here, because the owner
 * is Pro and has no friend limit to reach.
 */
async function fillSquad(owner, teamId, side) {
  for (const m of SQUAD[side]) {
    if (m.key === 'owner') continue;      // the owner is already on their own team
    const body = m.key
      ? { teamId, name: m.name, email: ACCOUNTS[m.key], role: 'Player' }
      : { teamId, name: m.name, role: 'Player' };
    const r = await asUser(owner.token, '/team-players', { method: 'POST', body });
    if (!r.ok) fail(`add ${m.name} to ${side}`, r);
    note('POST', '/team-players', r.status, `${m.name} -> ${side}`);
  }
}

async function createLeaderboard(owner, teamIds, admins) {
  const r = await asUser(owner.token, '/leaderboards', { method: 'POST', body: { name: LEADERBOARD } });
  if (!r.ok) fail('create leaderboard', r);
  const id = r.body.data.id;
  note('POST', '/leaderboards', r.status, `${LEADERBOARD} ${id}`);
  for (const teamId of teamIds) {
    const a = await asUser(owner.token, `/leaderboards/${id}/teams`, { method: 'POST', body: { teamId } });
    if (!a.ok) fail('add team to leaderboard', a);
    note('POST', `/leaderboards/${id}/teams`, a.status, teamId);
  }
  // Adding an Administrator is Pro-gated - 400 LEADERBOARD_ADMIN_LIMIT_EXCEEDED
  // on Free - which is the only reason the owner account is Pro.
  for (const key of admins) {
    const a = await asUser(owner.token, `/leaderboards/${id}/admin`, {
      method: 'POST', body: { email: ACCOUNTS[key] },
    });
    if (!a.ok) fail(`leaderboard admin ${key}`, a);
    note('POST', `/leaderboards/${id}/admin`, a.status, ACCOUNTS[key]);
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

/**
 * Make Rae a referee, the only way the app itself can.
 *
 * `isReferee` lives on the player record and nothing a user can reach sets it -
 * config/api.md walked through `PUT /users/:id {isReferee}`, `defaultProfile`
 * and `PATCH /players/:id/referee-settings`, and none of them work. The one call
 * that does is `POST /tournaments/:id/referee`. It needs a tournament, so the
 * owner holds one; `saveForFutureTournaments: true` is what puts her in the
 * match Referee field's own search afterwards.
 *
 * Reconciled: if she is already a referee this makes no call.
 */
async function ensureReferee(owner, refereeUser, tournamentId) {
  if (refereeUser.isReferee) { note('GET', '/users/me', 200, 'Rae is already a referee'); return; }
  const r = await asUser(owner.token, `/tournaments/${tournamentId}/referee`, {
    method: 'POST',
    body: { name: 'Rae KB', email: ACCOUNTS.referee, canStartEndMatches: true, saveForFutureTournaments: true },
  });
  if (!r.ok) fail('add referee', r);
  note('POST', `/tournaments/${tournamentId}/referee`, r.status, 'Rae is now a referee');
}

async function ensureTournament(owner) {
  const list = (await asUser(owner.token, '/tournaments')).body?.data;
  const rows = Array.isArray(list) ? list : list?.result ?? [];
  const hit = rows.find((t) => t.title === 'KB Comment Cup');
  if (hit) { note('GET', '/tournaments', 200, `KB Comment Cup exists ${hit.id}`); return hit.id; }
  // Tournament Pro is granted rather than paid for. The tournament exists for
  // one reason - it is the only thing that can turn an account into a referee.
  const g = await admin('/admins/users/tournament-free-pro/grant', {
    method: 'POST', body: { email: ACCOUNTS.owner, plan: 'Pro', quantity: 1 },
  });
  note('POST', '/admins/users/tournament-free-pro/grant', g.status, 'Tournament Pro x1');
  const r = await asUser(owner.token, '/tournaments', {
    method: 'POST',
    body: {
      title: 'KB Comment Cup',
      startDate: '2026-09-10T09:00:00.000Z',
      endDate: '2026-09-12T18:00:00.000Z',
      isOnline: false,
    },
  });
  if (!r.ok) fail('create tournament', r);
  note('POST', '/tournaments', r.status, `KB Comment Cup ${r.body.data.id}`);
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

async function playMatch(owner, ids, refereePlayerId) {
  const home = await squadRows(owner, ids.home);
  const away = await squadRows(owner, ids.away);
  const lineup = (teamId, side, rows) => ({
    teamId,
    formation: '2-1-1',
    players: SQUAD[side].filter((m) => m.position).map((m) => ({
      teamPlayerId: rows.get(m.name).id,
      position: m.position,
    })),
  });

  const r = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: lineup(ids.home, 'home', home),
      awayTeam: lineup(ids.away, 'away', away),
      date: new Date(Date.now() - 90_000).toISOString(),
      duration: MATCH.duration,
      teamSize: MATCH.teamSize,
      clubLocationId: ids.venue,
      leaderboardId: ids.leaderboard,
      tag: MATCH.tag,
    },
  });
  if (!r.ok) fail('create match', r);
  const matchId = r.body.data.id;
  note('POST', '/matches', r.status, `match ${matchId}`);

  // The referee goes on with a PUT. `refereePlayerId` takes any playerId, but
  // Rae is a saved referee anyway, so this is a path a reader could walk.
  const ref = await asUser(owner.token, `/matches/${matchId}`, {
    method: 'PUT', body: { refereePlayerId },
  });
  if (!ref.ok) fail('set referee', ref);
  note('PUT', `/matches/${matchId}`, ref.status, 'referee Rae');

  // Events are accepted only while the match is Live. Poll, never sleep blind.
  let live = false;
  for (let i = 0; i < 40 && !live; i += 1) {
    const m = (await asUser(owner.token, `/matches/${matchId}`)).body?.data;
    if (m?.status === 'Live') { live = true; note('GET', `/matches/${matchId}`, 200, `Live after ${i + 1} read(s)`); break; }
    if (m?.status === 'Finished' || m?.status === 'Cancelled') {
      throw new Error(`${matchId} went ${m.status} before any event could be written`);
    }
    await new Promise((res) => setTimeout(res, 1500));
  }
  if (!live) throw new Error(`${matchId} never went Live. A past date is what starts a match.`);

  for (const e of MATCH.events) {
    const rows = e.side === 'home' ? home : away;
    const teamId = e.side === 'home' ? ids.home : ids.away;
    const body = {
      type: e.type,
      teamId,
      teamPlayerId: rows.get(e.scorer).id,
      teamType: e.side === 'home' ? 'HomeTeam' : 'AwayTeam',
    };
    if (e.assist) body.assistedTeamPlayerId = home.get(e.assist).id;
    const ev = await asUser(owner.token, `/matches/${matchId}/events`, { method: 'POST', body });
    if (!ev.ok) fail(`event ${e.type} ${e.scorer}`, ev);
    note('POST', `/matches/${matchId}/events`, ev.status, `${e.type} ${e.scorer}`);
  }

  const fin = await asUser(owner.token, `/matches/${matchId}/status`, {
    method: 'POST', body: { status: 'Finished' },
  });
  if (!fin.ok) fail('finish match', fin);
  note('POST', `/matches/${matchId}/status`, fin.status, 'Finished');
  return matchId;
}

// --- comments ---------------------------------------------------------------

async function seedComments(sessions, entity) {
  const posted = [];
  for (const c of COMMENTS) {
    const author = sessions[c.by];
    const body = {
      entityId: entity[c.on].id,
      commentType: entity[c.on].type,
      comment: c.text,
    };
    if (c.media) {
      const up = await upload(author.token, '/comments/media', 'media', c.media);
      if (!up.ok) fail(`upload ${c.media}`, up);
      note('POST', '/comments/media', up.status, c.media);
      body.mediaTokens = [up.body.data];
    }
    const r = await asUser(author.token, '/comments', { method: 'POST', body });
    if (!r.ok) fail(`comment by ${c.by}`, r);
    const id = r.body.data.id;
    note('POST', '/comments', r.status, `${c.by} on ${c.on}: "${c.text.slice(0, 34)}..."`);

    for (const reply of c.replies) {
      const rr = await asUser(sessions[reply.by].token, '/comments', {
        method: 'POST',
        body: { ...body, mediaTokens: undefined, comment: reply.text, parentCommentId: id },
      });
      if (!rr.ok) fail(`reply by ${reply.by}`, rr);
      note('POST', '/comments', rr.status, `  reply ${reply.by}: "${reply.text.slice(0, 30)}..."`);
    }
    for (const liker of c.likes) {
      const lk = await asUser(sessions[liker].token, `/comments/${id}/like`, { method: 'POST' });
      if (!lk.ok) fail(`like by ${liker}`, lk);
      note('POST', `/comments/${id}/like`, lk.status, `liked by ${liker}`);
    }
    posted.push({ ...c, id });
  }
  return posted;
}

// --- ratings ----------------------------------------------------------------

/**
 * Bring every seeded rating to the value the fixture names.
 *
 * Reconciled, and it has to be: a rating survives everything this script
 * rebuilds when its subject is a PLAYER or a REFEREE, because those hang off a
 * player id that never changes. Match and team ratings die with their entity
 * and are written fresh.
 *
 * `GET /ratings/:type/:id/my-rating` is the lookup. `POST /ratings` from an
 * account that has already rated REPLACES its rating rather than adding one -
 * measured on staging, the count does not move - so a correction needs no
 * delete. `DELETE /ratings/:id` does work, and is used only to clear a rating
 * the fixture no longer wants.
 */
async function seedRatings(sessions, subject) {
  const wanted = new Map();               // `${type}:${by}` -> row
  for (const r of RATINGS) wanted.set(`${r.on}:${r.by}`, r);

  for (const [key, r] of wanted) {
    const s = sessions[r.by];
    const { type, id } = subject[r.on];
    const mine = (await asUser(s.token, `/ratings/${type}/${id}/my-rating`)).body?.data ?? null;
    const same = mine && mine.rating === r.rating && (mine.comment ?? '') === (r.comment ?? '');
    if (same) { note('GET', `/ratings/${type}/${id}/my-rating`, 200, `${key} already ${r.rating}`); continue; }
    const post = await asUser(s.token, '/ratings', {
      method: 'POST',
      body: { entityType: type, entityId: id, rating: r.rating, ...(r.comment ? { comment: r.comment } : {}) },
    });
    if (!post.ok) fail(`rating ${key}`, post);
    note('POST', '/ratings', post.status, `${key} = ${r.rating}`);
  }

  // Anything this collection's accounts rated that the fixture no longer lists.
  for (const [name, { type, id }] of Object.entries(subject)) {
    for (const by of Object.keys(sessions)) {
      if (wanted.has(`${name}:${by}`)) continue;
      const mine = (await asUser(sessions[by].token, `/ratings/${type}/${id}/my-rating`)).body?.data ?? null;
      if (!mine?.id) continue;
      const d = await asUser(sessions[by].token, `/ratings/${mine.id}`, { method: 'DELETE' });
      note('DELETE', `/ratings/${mine.id}`, d.status, `stale ${name}:${by} removed`);
    }
  }
}

async function checkAverages(session, subject) {
  let bad = 0;
  for (const [name, { type, id }] of Object.entries(subject)) {
    const want = EXPECTED_AVERAGES[name];
    if (!want) continue;
    const got = (await asUser(session.token, `/ratings/${type}/${id}/summary`)).body?.data ?? {};
    const ok = got.averageRating === want.averageRating && got.totalCount === want.totalCount;
    if (!ok) bad += 1;
    note('GET', `/ratings/${type}/${id}/summary`, ok ? 200 : 'MISMATCH',
      `${name}: ${got.averageRating} over ${got.totalCount} (want ${want.averageRating} over ${want.totalCount})`);
  }
  if (bad) throw new Error(`${bad} rating average(s) are not what lib/fixtures-19.mjs expects`);
}

// --- main -------------------------------------------------------------------

const sessions = {};
for (const key of Object.keys(ACCOUNTS)) sessions[key] = await ensureAccount(key);

const owner = sessions.owner;
const tournamentId = await ensureTournament(owner);
await ensureReferee(owner, sessions.referee, tournamentId);
// Re-read: ensureReferee flips isReferee, and the Rate chooser depends on it.
sessions.referee = { ...sessions.referee, ...(await lookup(ACCOUNTS.referee)) };

await teardown(owner);

const venueId = await ensureVenue(owner);
const homeId = await createTeam(owner, TEAMS.home);
const awayId = await createTeam(owner, TEAMS.away);
await fillSquad(owner, homeId, 'home');
await fillSquad(owner, awayId, 'away');
const leaderboardId = await createLeaderboard(owner, [homeId, awayId], ['player', 'pro']);

const matchId = await playMatch(owner, {
  home: homeId, away: awayId, venue: venueId, leaderboard: leaderboardId,
}, sessions.referee.playerId);

const commentEntities = {
  home: { id: homeId, type: 'team' },
  away: { id: awayId, type: 'team' },
  leaderboard: { id: leaderboardId, type: 'leaderboard' },
};
await seedComments(sessions, commentEntities);

const ratingSubjects = {
  match: { type: 'match', id: matchId },
  team: { type: 'team', id: homeId },
  player: { type: 'player', id: sessions.player.playerId },
  referee: { type: 'referee', id: sessions.referee.playerId },
};
await seedRatings(sessions, ratingSubjects);
await checkAverages(sessions.player, ratingSubjects);

console.log('\n--- collection 19 fixtures ---');
console.log(JSON.stringify({
  accounts: Object.fromEntries(Object.entries(sessions).map(([k, v]) => [k, { email: v.email, userId: v.id, playerId: v.playerId, membership: v.membership }])),
  teams: { [TEAMS.home]: homeId, [TEAMS.away]: awayId },
  leaderboard: { [LEADERBOARD]: leaderboardId },
  venue: { [VENUE.name]: venueId },
  tournament: tournamentId,
  match: matchId,
}, null, 2));
console.log(`\n${writes} write(s).`);
console.log('Ids change on every run. Specs look fixtures up by name - see lib/kb.ts, fixtures19().');

// Idempotent seed for collection 10 - "Match day".
//
//   node scripts/seed-10.mjs
//   node scripts/seed-10.mjs --rebuild     # delete all four accounts first
//
// Safe to re-run. Every account, team, member, venue, leaderboard and match is
// looked up before it is written, so a second run makes zero writes.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the four addresses in lib/fixtures-10.mjs.
//
// --- Read this before you re-run it after a failure ----------------------
//
// Three things here cannot be rebuilt in place.
//
// 1. **A Finished match cannot be reopened or rewritten - but it CAN be
//    cancelled.** POST /status answers "Cannot update status of a Finished match"
//    and a PUT of any configuration field answers "Cannot update match of a
//    Finished match". `PUT {"status":"Cancelled"}` is neither of those and
//    answers 200, so a wrong `played` fixture is discarded and rebuilt rather
//    than left in the league table. Collection 10 believed otherwise for half a
//    run; see config/api.md.
// 2. **Events are accepted only while the match is Live or Paused.** A match
//    with a past date starts itself a second or two after POST /matches answers,
//    so this script polls for `status === "Live"` before it writes a single
//    event. Writing them too early loses them for ever.
// 3. **DELETE /matches/:id does not delete, and refuses a past date.** It sets
//    status Cancelled on a future match and answers "Date must be at least one
//    hour ahead of the current time" on anything that has kicked off. So every
//    disposal here is DELETE first, PUT {"status":"Cancelled"} as the fallback.
//
// If the `played` fixture comes out wrong this script cancels it and builds a new
// one. Repairing it in place is not possible; discarding it is.
//
// --- The dates ----------------------------------------------------------
//
// `scheduled` sits on a FIXED future date so a countdown and a calendar say the
// same thing on every run - and it therefore goes stale. Once that date has
// passed the match would start itself and the seed would build a Live match
// instead of a Scheduled one. The script refuses to run in that case and says
// which date to move.
//
// `played` has NO fixed date. Events are only accepted while a match is Live, and
// a match is Live only between its date and its date plus its duration - so a
// fixed date months back is Live for about a second and then finishes itself with
// the events half written. The seed dates it five minutes before it runs.

import 'dotenv/config';
import { admin, asUser, mintSession, j } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, LEADERBOARD, SCRATCH_LEADERBOARD, TEAMS, BORN_TEAMS, VENUE,
  MATCH_DEFAULTS, POSITIONS, SQUADS, MATCHES, PLAYED_EVENTS, PLAYED_SCORE,
  PLAYED_COMMENTARY, PLAYED_MINUTES_AGO,
} from '../lib/fixtures-10.mjs';

const REBUILD = process.argv.includes('--rebuild');

const ids = {};
let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(46)} -> ${status}  ${detail ?? ''}`);
};

/**
 * Refuse to build a fixture whose future date has gone by.
 *
 * Reading the clock is fine here - this is a guard, not a capture. A spec may
 * never do it (docs/style-guide.md); a seed that would otherwise silently produce
 * a Live match instead of a Scheduled one must.
 */
const now = Date.now();
if (Date.parse(MATCHES.scheduled.date) - now < 2 * 60 * 60 * 1000) {
  console.error(`FIXTURE DATE HAS PASSED: scheduled ${MATCHES.scheduled.date}`);
  console.error('\nA match created with a past date starts itself, so this seed would build a');
  console.error('Live match instead of a Scheduled one. Move the date forward in');
  console.error('lib/fixtures-10.mjs, then run: node scripts/seed-10.mjs --rebuild');
  process.exit(1);
}
// `played` has no date in the fixture file. It is dated PLAYED_MINUTES_AGO before
// this run, because a match is only Live between its date and its date plus its
// duration - and events are only accepted while it is Live. See lib/fixtures-10.mjs.
const PLAYED_DATE = new Date(now - PLAYED_MINUTES_AGO * 60_000).toISOString();

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

/** One of Mo's two born teams, renamed. */
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
  return all.filter((m) => !m.isDeleted).map((m) => ({
    id: m.id,
    role: m.role,
    email: m.player?.email ?? null,
    playerId: m.player?.id ?? null,
    name: [m.player?.name, m.player?.lastName].filter(Boolean).join(' '),
  }));
}

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
  // the accept endpoint's own body uses (found by collection 09).
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
 * Mo's two leaderboards: the league every capture shows, and the scratch one
 * every throwaway match goes into.
 *
 * Every account is born with one leaderboard, so the league is a rename. The
 * scratch one is created. Both hold both teams - a match cannot be added to a
 * leaderboard its teams are not in.
 */
async function ensureLeaderboards(owner, teamIdByKey) {
  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  const mine = boards.filter((b) => b.isOwner);
  if (!mine.length) throw new Error(`${owner.email} owns no leaderboard`);

  let league = mine.find((b) => b.name === LEADERBOARD);
  if (!league) {
    // Rename whichever born board is not already the scratch one.
    const born = mine.find((b) => b.name !== SCRATCH_LEADERBOARD);
    if (!born) throw new Error(`${owner.email} has no board to rename into "${LEADERBOARD}"`);
    const r = await asUser(owner.token, `/leaderboards/${born.id}`, {
      method: 'PUT', body: { name: LEADERBOARD },
    });
    if (!r.ok) throw new Error(`PUT /leaderboards/${born.id}: ${j(r.body)}`);
    note('PUT', `/leaderboards/${born.id}`, r.status, `renamed "${born.name}" -> "${LEADERBOARD}"`);
    league = { ...born, name: LEADERBOARD };
  } else {
    note('GET', '/leaderboards', 200, `"${LEADERBOARD}" already named - ${league.id}`);
  }

  let scratch = mine.find((b) => b.name === SCRATCH_LEADERBOARD);
  if (!scratch) {
    const r = await asUser(owner.token, '/leaderboards', {
      method: 'POST', body: { name: SCRATCH_LEADERBOARD },
    });
    if (!r.ok) throw new Error(`POST /leaderboards ${SCRATCH_LEADERBOARD}: ${j(r.body)}`);
    scratch = r.body.data;
    note('POST', '/leaderboards', r.status, `"${SCRATCH_LEADERBOARD}" ${scratch.id}`);
  } else {
    note('GET', '/leaderboards', 200, `"${SCRATCH_LEADERBOARD}" exists - ${scratch.id}`);
  }

  // Prune anything else Mo owns, so a crashed run cannot leave a third board
  // behind and change what the Leaderboard dropdown offers.
  for (const stray of mine) {
    if (String(stray.id) === String(league.id) || String(stray.id) === String(scratch.id)) continue;
    const r = await asUser(owner.token, `/leaderboards/${stray.id}`, { method: 'DELETE' });
    note('DELETE', `/leaderboards/${stray.id}`, r.status, `pruned stray "${stray.name}"`);
  }

  for (const board of [league, scratch]) {
    const listed = (await asUser(owner.token, `/leaderboards/${board.id}/teams`)).body?.data ?? [];
    const rows = Array.isArray(listed) ? listed : (listed.result ?? []);
    const inIt = new Set(rows.map((t) => String(t.teamId ?? t.id ?? t.team?.teamId ?? t.team?.id)));
    for (const key of Object.keys(TEAMS)) {
      const teamId = String(teamIdByKey[key]);
      if (inIt.has(teamId)) {
        note('GET', `/leaderboards/${board.id}/teams`, 200, `${TEAMS[key]} already in "${board.name}"`);
        continue;
      }
      const r = await asUser(owner.token, `/leaderboards/${board.id}/teams`, {
        method: 'POST', body: { teamId },
      });
      if (!r.ok) throw new Error(`POST /leaderboards/${board.id}/teams ${TEAMS[key]}: ${j(r.body)}`);
      note('POST', `/leaderboards/${board.id}/teams`, r.status, `${TEAMS[key]} -> ${board.name}`);
    }
  }

  return { league, scratch };
}

/** The one venue, created once. */
async function ensureVenue(owner) {
  const found = ((await asUser(owner.token, `/club-locations?query=${encodeURIComponent(VENUE.name)}`))
    .body?.data ?? []).find((v) => v.name === VENUE.name && !v.isDeleted);
  if (found) {
    note('GET', '/club-locations', 200, `"${VENUE.name}" exists - ${found.id}`);
    return found.id;
  }
  const r = await asUser(owner.token, '/club-locations', { method: 'POST', body: VENUE });
  if (!r.ok) throw new Error(`POST /club-locations ${VENUE.name}: ${j(r.body)}`);
  note('POST', '/club-locations', r.status, `"${VENUE.name}" ${r.body.data.id}`);
  return r.body.data.id;
}

/**
 * Every match Mo can see, whatever its status.
 *
 * The calendar's own endpoint is the only listing that carries Incomplete rows,
 * and Cancelled rows never appear in it - which is what makes cancelling a safe
 * way to dispose of one.
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

const lineupFor = (t, order) => order.map((name, i) => {
  const m = t.members.find((x) => x.name === name);
  if (!m) throw new Error(`${name} is not on ${t.name}: ${t.members.map((x) => x.name).join(', ')}`);
  return { teamPlayerId: m.id, position: POSITIONS[i] };
});

/** Create one match, complete, in one POST. All seven fields go in the body. */
async function makeMatch(owner, plan, team, boardId, venueId, refereePlayerId, date) {
  const home = team[plan.home];
  const away = team[plan.away];
  const made = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: {
        teamId: home.id,
        formation: MATCH_DEFAULTS.formation,
        players: lineupFor(home, SQUADS[plan.home].lineup),
      },
      awayTeam: {
        teamId: away.id,
        formation: MATCH_DEFAULTS.formation,
        players: lineupFor(away, SQUADS[plan.away].lineup),
      },
      date: date ?? plan.date,
      duration: plan.duration,
      teamSize: plan.teamSize,
      clubLocationId: venueId,
      leaderboardId: boardId,
      tag: plan.tag,
    },
  });
  if (!made.ok) throw new Error(`POST /matches ${plan.key}: ${j(made.body)}`);
  const matchId = made.body.data.id;
  note('POST', '/matches', made.status, `${plan.key} ${(date ?? plan.date).slice(0, 16)} ${matchId}`);

  const extra = {};
  if (plan.pitchNumber) extra.pitchNumber = plan.pitchNumber;
  if (plan.note) extra.note = plan.note;
  if (plan.referee && refereePlayerId) extra.refereePlayerId = refereePlayerId;
  if (Object.keys(extra).length) {
    const r = await asUser(owner.token, `/matches/${matchId}`, { method: 'PUT', body: extra });
    if (!r.ok) throw new Error(`PUT /matches/${matchId} extras: ${j(r.body)}`);
    note('PUT', `/matches/${matchId}`, r.status, `pitch/note/referee on ${plan.key}`);
  }
  return matchId;
}

/**
 * Wait for a past-dated match to start itself.
 *
 * A match with a date in the past goes Live on its own a second or two after
 * POST /matches answers (config/api.md). Events are refused before that with
 * "Match must be live or paused to add events", and a match cannot be reopened
 * once it is Finished - so an event written too early is lost for ever.
 *
 * Polled on a CONDITION, not a duration: it reads the status back and gives up
 * after a bounded number of reads. A seed may wait; a spec may not.
 */
async function waitForLive(owner, matchId, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    const m = (await asUser(owner.token, `/matches/${matchId}`)).body?.data;
    if (m?.status === 'Live') {
      note('GET', `/matches/${matchId}`, 200, `Live after ${i + 1} read(s)`);
      return m;
    }
    if (m?.status === 'Finished' || m?.status === 'Cancelled') {
      throw new Error(`${matchId} went ${m.status} before any event could be written`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`${matchId} never went Live. A past date is what starts a match.`);
}

/**
 * Play the `played` fixture out: goals, cards, Player of the Match, commentary,
 * then Finished.
 *
 * Order matters and cannot be repeated - once this match is Finished nothing can
 * add to it, edit it or reopen it.
 */
async function playOut(owner, matchId, team) {
  await waitForLive(owner, matchId);

  const teamPlayer = (side, name) => {
    const t = team[MATCHES.played[side === 'home' ? 'home' : 'away']];
    const m = t.members.find((x) => x.name === name);
    if (!m) throw new Error(`${name} is not on ${t.name}`);
    return { teamId: t.id, teamPlayerId: m.id, teamType: side === 'home' ? 'HomeTeam' : 'AwayTeam' };
  };

  for (const e of PLAYED_EVENTS) {
    const who = teamPlayer(e.side, e.player);
    const body = { type: e.type, ...who };
    if (e.assist) {
      const a = teamPlayer(e.side, e.assist);
      body.assistedTeamPlayerId = a.teamPlayerId;
    }
    const r = await asUser(owner.token, `/matches/${matchId}/events`, { method: 'POST', body });
    if (!r.ok) throw new Error(`POST /matches/${matchId}/events ${e.type} ${e.player}: ${j(r.body)}`);
    note('POST', `/matches/${matchId}/events`, r.status, `${e.type} ${e.player}`);
  }

  // Commentary is `type: "Comment"`. The Postman collection names the request
  // "comment" but does not show its type value, and posting without one answers
  // 400 SCHEMA_VALIDATION_ERROR, `field: "type", message: "Required"`. Confirmed
  // on staging 2026-09-01; config/api.md's TODO on this is now answered.
  for (const c of PLAYED_COMMENTARY) {
    const r = await asUser(owner.token, `/matches/${matchId}/events`, {
      method: 'POST', body: { type: 'Comment', ...c },
    });
    if (!r.ok) throw new Error(`POST /matches/${matchId}/events commentary: ${j(r.body)}`);
    note('POST', `/matches/${matchId}/events`, r.status, `commentary at ${c.minute}'`);
  }

  const fin = await asUser(owner.token, `/matches/${matchId}/status`, {
    method: 'POST', body: { status: 'Finished' },
  });
  if (!fin.ok) throw new Error(`POST /matches/${matchId}/status Finished: ${j(fin.body)}`);
  note('POST', `/matches/${matchId}/status`, fin.status, 'Finished - permanent from here');
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
ids.squads = Object.fromEntries(Object.entries(team).map(([, t]) => [
  t.name, t.members.map((m) => `${m.name}${m.role === 'Player' ? '' : ` (${m.role})`}`),
]));

// --- 3. the leaderboards and the venue --------------------------------------

const { league, scratch } = await ensureLeaderboards(pro, teamId);
ids.leaderboards = { [league.name]: league.id, [scratch.name]: scratch.id };

const venueId = await ensureVenue(pro);
ids.venue = { [VENUE.name]: venueId };

// --- 4. the two fixtures ----------------------------------------------------
//
// The two are found in different ways, because only one of them has a date the
// fixture file can name.
//
//   scheduled  matched on its FIXED future date
//   played     matched on being the one FINISHED match in KB 10 Sunday League.
//              Its date is whatever moment the seed ran (see lib/fixtures-10.mjs),
//              so a date match is impossible - and a count is wrong too, because
//              every throwaway a spec finishes lands in KB 10 Scratch and is
//              Finished as well.
//
// A wreck is cleared rather than stepped over. PUT {"status":"Cancelled"} answers
// 200 whatever the status, Finished included, so a half-played fixture with the
// wrong score is discarded and rebuilt - and the discarded row leaves the league
// table too, because a Cancelled match is in no listing.

const already = await matchesOf(pro);
ids.matches = {};

/** The leaderboard a match belongs to, read one match at a time. */
const boardOf = async (id) => String((await asUser(pro.token, `/matches/${id}`)).body?.data?.leaderboardId ?? '');

// -- scheduled ---------------------------------------------------------------

{
  const plan = MATCHES.scheduled;
  const day = plan.date.slice(0, 10);
  let found = already.find((m) => m.date === day && m.status !== 'Cancelled');
  if (found && found.status !== 'Scheduled') {
    let r = await asUser(pro.token, `/matches/${found.id}`, { method: 'DELETE' });
    if (!r.ok) r = await asUser(pro.token, `/matches/${found.id}`, { method: 'PUT', body: { status: 'Cancelled' } });
    note('DELETE', `/matches/${found.id}`, r.status, `scheduled was ${found.status} - discarded`);
    if (!r.ok) throw new Error(`scheduled is ${found.status} and cannot be cancelled: ${j(r.body)}`);
    found = null;
  }
  if (found) {
    note('GET', `/players/${pro.playerId}/matches`, 200, `scheduled ${day} exists - ${found.id}`);
    ids.matches.scheduled = found.id;
  } else {
    ids.matches.scheduled = await makeMatch(
      pro, plan, team, league.id, venueId, acct.referee.playerId,
    );
  }
}

// -- played ------------------------------------------------------------------

{
  const plan = MATCHES.played;
  const finished = [];
  for (const m of already) {
    if (m.status !== 'Finished') continue;
    if ((await boardOf(m.id)) === String(league.id)) finished.push(m);
  }
  // More than one means an earlier run built a second played fixture. Keep the
  // one whose score is right and cancel the rest, so the league table holds
  // exactly the match the articles describe.
  if (finished.length > 1) {
    const keepRow = [];
    for (const m of finished) {
      const b = (await asUser(pro.token, `/matches/${m.id}`)).body?.data;
      if (!keepRow.length
        && b?.homeTeamTotalGoals === PLAYED_SCORE.home
        && b?.awayTeamTotalGoals === PLAYED_SCORE.away) { keepRow.push(m); continue; }
      const r = await asUser(pro.token, `/matches/${m.id}`, { method: 'PUT', body: { status: 'Cancelled' } });
      note('PUT', `/matches/${m.id}`, r.status,
        `duplicate played fixture cancelled (${b?.homeTeamTotalGoals}-${b?.awayTeamTotalGoals})`);
    }
    finished.length = 0;
    finished.push(...keepRow);
  }
  // One Finished match with the wrong score is a half-played wreck. It cannot be
  // repaired, so cancel it and build a new one.
  if (finished.length === 1) {
    const d = (await asUser(pro.token, `/matches/${finished[0].id}`)).body?.data;
    if (d?.homeTeamTotalGoals !== PLAYED_SCORE.home || d?.awayTeamTotalGoals !== PLAYED_SCORE.away) {
      const r = await asUser(pro.token, `/matches/${finished[0].id}`, { method: 'PUT', body: { status: 'Cancelled' } });
      note('PUT', `/matches/${finished[0].id}`, r.status,
        `played was ${d?.homeTeamTotalGoals}-${d?.awayTeamTotalGoals}, want ${PLAYED_SCORE.home}-${PLAYED_SCORE.away} - discarded`);
      if (!r.ok) throw new Error(`could not cancel the wrong played fixture: ${j(r.body)}`);
      finished.length = 0;
    }
  }
  if (finished.length === 1) {
    note('GET', `/players/${pro.playerId}/matches`, 200, `played exists - ${finished[0].id} (Finished)`);
    ids.matches.played = finished[0].id;
  } else {
    const id = await makeMatch(
      pro, plan, team, league.id, venueId, acct.referee.playerId, PLAYED_DATE,
    );
    await playOut(pro, id, team);
    ids.matches.played = id;
  }
}

// A crashed spec leaves its throwaway behind. Anything Mo can see that is not one
// of the two fixtures is one of those. Cancel it - a Live or Paused throwaway
// would otherwise sit in the calendar and in both teams' match lists for ever.
// Every state can be cancelled - Live, Paused and Finished - so nothing this
// collection creates accumulates: a full run leaves the two fixtures it started
// with and no more.
const keep = new Set(Object.values(ids.matches).map(String));
const stuck = [];
for (const m of await matchesOf(pro)) {
  if (keep.has(String(m.id))) continue;
  let r = await asUser(pro.token, `/matches/${m.id}`, { method: 'DELETE' });
  if (!r.ok) r = await asUser(pro.token, `/matches/${m.id}`, { method: 'PUT', body: { status: 'Cancelled' } });
  note('DELETE', `/matches/${m.id}`, r.status, `stray ${m.status} ${m.date} -> ${r.ok ? 'cancelled' : 'LEFT AS IS'}`);
  if (!r.ok) stuck.push(`${m.id} (${m.status}, ${m.date})`);
}
if (stuck.length) {
  console.log(`
Strays that could NOT be cancelled. This should not happen - every status can be:`);
  for (const x of stuck) console.log(`  ${x}`);
}

// --- 5. verify --------------------------------------------------------------

const final = await matchesOf(pro);
const played = (await asUser(pro.token, `/matches/${ids.matches.played}`)).body?.data;
const scheduled = (await asUser(pro.token, `/matches/${ids.matches.scheduled}`)).body?.data;

console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- matches Mo can see ---');
console.log(j(final));
console.log(`\nwrites this run: ${writes}`);

const wrong = [];
if (scheduled?.status !== 'Scheduled') wrong.push(`scheduled is ${scheduled?.status}, want Scheduled`);
if (played?.status !== 'Finished') wrong.push(`played is ${played?.status}, want Finished`);
// The score lives on the match itself as `homeTeamTotalGoals` /
// `awayTeamTotalGoals`. Not on the team objects, which carry only the formation
// and the line-up. Read off staging 2026-09-01.
const score = { home: played?.homeTeamTotalGoals, away: played?.awayTeamTotalGoals };
console.log('\n--- played fixture ---');
console.log(j({
  id: played?.id, status: played?.status, date: played?.date, score,
  startedAt: played?.startedAt, finishedAt: played?.finishedAt,
  autoStarted: played?.autoStarted, autoFinished: played?.autoFinished,
  pauseDurationSeconds: played?.pauseDurationSeconds, hasScoreEntry: played?.hasScoreEntry,
  isPenalty: played?.isPenalty,
}));
if (score.home !== PLAYED_SCORE.home || score.away !== PLAYED_SCORE.away) {
  wrong.push(`played score is ${score.home}-${score.away}, want ${PLAYED_SCORE.home}-${PLAYED_SCORE.away}`);
}
if (final.length !== 2) wrong.push(`${final.length} matches visible, want 2`);

if (wrong.length) {
  console.error(`\nFIXTURE IS WRONG:\n  ${wrong.join('\n  ')}`);
  console.error('Re-run this script: it cancels a wrong fixture and builds a new one.');
  console.error('If it reports the same thing twice, run with --rebuild.');
  process.exit(1);
}
console.log('\nSeed complete. One Scheduled fixture, one Finished fixture at '
  + `${PLAYED_SCORE.home}-${PLAYED_SCORE.away}, matching lib/fixtures-10.mjs.`);

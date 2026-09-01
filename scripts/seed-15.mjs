// Idempotent seed for collection 15 - "Tournaments - publishing & running".
//
//   node scripts/make-assets-15.mjs   # once, to draw the sponsor banners
//   node scripts/seed-15.mjs
//
// Safe to re-run. Every entity is looked up by its fixed name and only created
// when missing; drifted state is reconciled back. Nothing here reads a clock or
// a random value, so the fixtures a spec sees on Tuesday are the ones it saw on
// Monday.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script seeds ONLY kb-organiser-15@ and its three second actors, and
// fixtures named "KB 15 ...". It never touches collection 12's kb-organiser@,
// collection 13's kb-organiser-13@ or collection 14's kb-organiser-14@.
//
// Modelled on scripts/seed-14.mjs and scripts/seed-13.mjs.
//
// Four accounts, and why each one exists:
//
//   kb-organiser-15@   Oona KB, Pro, holds the Tournament Pro grant. The owner.
//   kb-15-admin@       Ada KB, Pro. A tournament admin on KB 15 Cup and KB 15
//                      League - the "role" half of most of the collection, and
//                      the account that proves a tournament admin still cannot
//                      post in an announcement-only chat (15.7).
//   kb-15-free@        Fred KB, FREE and never flipped. Follows KB 15 Cup and is
//                      in its chat. 15.7 and 15.9.
//   kb-15-outsider@    Otto KB, Free. On no tournament team. The signed-in
//                      stranger who is bounced off the board to the public page.
//
// Six tournaments, and why each one exists:
//
//   KB 15 Cup            Football, Group and Knockout, 8 teams. GROUP A SCORED,
//                        Group B and the knockout untouched, so the public page
//                        has both finished and upcoming fixtures on it. The main
//                        fixture: 15.1,
//                        15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.9. Carries the
//                        two sponsors, the saved slideshow, the chat and the
//                        two followers.
//   KB 15 League         Football, Round Robin, 4 teams, every match scored.
//                        Chat set to ANNOUNCEMENT ONLY - the locked composer in
//                        15.7. Football standings and team statistics for 15.8.
//   KB 15 Padel Cup      Padel, Swiss, 8 players in 4 pairs, every match scored.
//                        The padel section of 15.8 - SCORE where football has
//                        Goals, and a Rules and Regulations panel football has
//                        no equivalent of.
//   KB 15 Sunday League  Football, Round Robin, 4 teams, NOTHING scored, every
//                        fixture Scheduled. 15.8's entry sequence - START, the
//                        two score boxes, END - and 15.3's public-tab demo. The
//                        one fixture a spec is allowed to change, because no
//                        other article photographs it.
//   KB 15 New Cup        Created and never configured. No teams, no format, no
//                        fixtures. The empty board and the empty public page.
//   KB 15 Done Cup       Round Robin, 4 teams, scored, and its one phase ENDED.
//                        The "after it is over" state for 15.9: no score boxes,
//                        no START, no phase banner.
//
// Why KB 15 Done Cup is seeded rather than made by a spec: ending a phase cannot
// be undone, and eight other articles photograph KB 15 Cup.
// docs/style-guide.md, "Actions you can only do once": photograph the dialog,
// take the after state from a second fixture.

import fs from 'node:fs';
import { admin, asUser, mintSession, upload, j } from '../lib/api.mjs';

const ORGANISER = 'kb-organiser-15@yopmail.com';
const ADMIN = 'kb-15-admin@yopmail.com';
const FREE = 'kb-15-free@yopmail.com';
const OUTSIDER = 'kb-15-outsider@yopmail.com';

const ids = {};
const note = (method, path, status, detail) =>
  console.log(`${method.padEnd(6)} ${path} -> ${status}  ${detail ?? ''}`);

// --- 1. accounts ------------------------------------------------------------
const PEOPLE = [
  { email: ORGANISER, name: 'Oona', membership: 'Pro' },
  { email: ADMIN, name: 'Ada', membership: 'Pro' },
  // Fred stays Free for ever. 15.7 carries the free_pro flag and the Free
  // capture has to come from an account that is Free at rest: flipping one
  // account between two captures only works if the specs run in one order
  // (config/personas.yaml, manager_free.notes).
  { email: FREE, name: 'Fred', membership: 'Free' },
  { email: OUTSIDER, name: 'Otto', membership: 'Free' },
];

ids.accounts = {};
const tokens = {};
for (const p of PEOPLE) {
  const res = await admin('/admins/users', {
    method: 'POST',
    body: { name: p.name, lastName: 'KB', email: p.email },
  });
  note('POST', '/admins/users', res.status,
    res.ok ? `${p.email} uid=${res.body.data.uid}` : `${p.email} already exists - reused`);

  const session = await mintSession(p.email);
  tokens[p.email] = session.idToken;
  const me = (await asUser(session.idToken, '/users/me')).body.data;
  ids.accounts[p.email] = { userId: me.id, playerId: me.playerId, uid: me.uid };

  if (me.membership !== p.membership) {
    const r = await admin(`/admins/change-user-membership/${me.id}`, {
      method: 'POST', body: { membership: p.membership },
    });
    note('POST', `/admins/change-user-membership/${me.id}`, r.status,
      `${p.email} membership ${me.membership} -> ${p.membership}`);
  } else {
    note('GET', '/users/me', 200, `${p.email} already ${p.membership}, id=${me.id}`);
  }
}

const T = tokens[ORGANISER];
const organiser = (await asUser(T, '/users/me')).body.data;

// --- 2. venues --------------------------------------------------------------
// The create modal's club picker calls
// GET /club-locations?tournamentSelectionOnly=true and only lists venues created
// with BOTH isTournament and saveForFutureTournaments true.
const VENUES = [
  { name: 'KB 15 Astro Park', location: 'Hackney, London' },
  { name: 'KB 15 Riverside', location: 'Fulham, London' },
];

ids.venues = {};
const selectable = (await asUser(T, '/club-locations?tournamentSelectionOnly=true')).body.data ?? [];
for (const venue of VENUES) {
  const mine = selectable.filter((v) => v.name === venue.name);
  if (mine.length) {
    ids.venues[venue.name] = mine[0].id;
    note('GET', '/club-locations', 200, `${venue.name} exists ${mine[0].id}`);
    for (const dup of mine.slice(1)) {
      const del = await asUser(T, `/club-locations/${dup.id}`, { method: 'DELETE' });
      note('DELETE', `/club-locations/${dup.id}`, del.status, `duplicate venue "${dup.name}"`);
    }
  } else {
    const res = await asUser(T, '/club-locations', {
      method: 'POST',
      body: { ...venue, saveForFutureTournaments: true, isTournament: true },
    });
    ids.venues[venue.name] = res.body.data.id;
    note('POST', '/club-locations', res.status, `${venue.name} = ${res.body.data.id}`);
  }
}

// --- 3. the Tournament Pro allowance ----------------------------------------
const PADEL_CREATE = {
  gameType: 'Padel',
  playMode: 'Score',
  padelEnrollmentType: 'Doubles',
  isFriendlyTournament: false,
};

// Dates are fixed and in the future so no fixture starts itself. A tournament
// match auto-starts when its kick-off arrives (collection 10), and a match that
// arrives Finished at 0-0 can never be scored - so the seed refuses to run once
// these dates have passed rather than building an unscoreable board.
const WANTED = [
  { title: 'KB 15 Cup', startDate: '2026-10-24' },
  { title: 'KB 15 League', startDate: '2026-10-17' },
  { title: 'KB 15 Padel Cup', startDate: '2026-10-31', extra: PADEL_CREATE },
  { title: 'KB 15 Sunday League', startDate: '2026-11-21' },
  { title: 'KB 15 New Cup', startDate: '2026-11-07' },
  { title: 'KB 15 Done Cup', startDate: '2026-11-14' },
];

const TODAY = '2026-09-01';   // the day this seed was written; see the guard below
{
  const earliest = WANTED.map((w) => w.startDate).sort()[0];
  if (earliest < TODAY) {
    // Not a clock read: TODAY is a literal. This only fires if somebody edits
    // the dates above to something already gone.
    throw new Error(`seed-15: the earliest fixture date ${earliest} is before ${TODAY}. `
      + 'Move every startDate forward before running this, or the matches arrive '
      + 'Finished at 0-0 and can never be scored.');
  }
}

const existing = (await asUser(T, '/tournaments')).body.data ?? [];
const missing = WANTED.filter((w) => !existing.some((t) => t.title === w.title));

// The grant is ADDITIVE, not a set, and there is no revoke. Creating a
// tournament spends a slot; deleting it does not give the slot back. So grant
// only when a tournament actually has to be created and the balance is short.
const remaining = organiser.freeTournamentProAllowanceRemaining ?? 0;
if (missing.length > remaining) {
  const r = await admin('/admins/users/tournament-free-pro/grant', {
    method: 'POST', body: { email: ORGANISER, plan: 'Pro', quantity: missing.length - remaining },
  });
  note('POST', '/admins/users/tournament-free-pro/grant', r.status,
    r.ok ? `total=${r.body.data.totalQuantity} remaining=${r.body.data.remainingQuantity}` : j(r.body));
} else {
  note('GET', '/users/me', 200,
    `${remaining} Tournament Pro slot(s) remaining, ${missing.length} to create - no grant needed`);
}

// --- 4. tournaments ---------------------------------------------------------
async function ensureTournament(title, startDate, extra = {}) {
  const found = existing.find((t) => t.title === title);
  if (found) {
    const id = String(found._id ?? found.id);
    note('GET', '/tournaments', 200, `${title} exists ${id}`);
    return id;
  }
  const created = await asUser(T, '/tournaments', {
    method: 'POST',
    body: {
      title,
      gameType: 'Football',
      startDate,
      duration: '10 min',
      clubLocationIds: [ids.venues['KB 15 Astro Park']],
      isAutoStartEnable: false,
      startTime: '10:00',
      // Pinned. The app sends the browser's own zone, which would otherwise
      // differ per machine and shift every rendered kick-off time.
      timeZone: 'Europe/London',
      ...extra,
    },
  });
  note('POST', '/tournaments', created.status, `${title} = ${created.body.data?.id}`);
  return String(created.body.data.id);
}

ids.tournaments = {};
for (const w of WANTED) {
  ids.tournaments[w.title] = await ensureTournament(w.title, w.startDate, w.extra);
}

// --- 5. helpers -------------------------------------------------------------
const detailOf = async (id) => (await asUser(T, `/tournaments/${id}`)).body.data;

const groupMatches = async (id, groupId) =>
  (await asUser(T, `/tournaments/${id}/schedule/groups/${groupId}/matches`)).body.data ?? [];

async function ensureTeams(tournamentId, names, label) {
  let state = await detailOf(tournamentId);
  const missingTeams = names.filter((n) => !state.teams.some((t) => t.name === n));
  if (missingTeams.length) {
    const bulk = await asUser(T, `/tournaments/${tournamentId}/teams/bulk`, {
      method: 'POST', body: { teamNames: missingTeams },
    });
    note('POST', `/tournaments/${tournamentId}/teams/bulk`, bulk.status, missingTeams.join(', '));
    state = await detailOf(tournamentId);
  } else {
    note('GET', `/tournaments/${tournamentId}`, 200, `${label}: all ${names.length} teams present`);
  }
  return state;
}

/** Saving the format is what generates the groups, the bracket and the phases. */
async function ensureFootballFormat(id, label, body) {
  const state = await detailOf(id);
  if (state.format) {
    note('GET', `/tournaments/${id}`, 200, `${label} format already ${state.format}`);
    return state;
  }
  const put = await asUser(T, `/tournaments/${id}`, { method: 'PUT', body });
  note('PUT', `/tournaments/${id}`, put.status,
    `${label}: ${body.format}, ${body.groupCount} group(s) of ${body.teamsPerGroup}`);
  return detailOf(id);
}

const PADEL_CONFIG = {
  padelFormat: 'Swiss',
  padelStandingType: 'Team',
  padelScoringPoints: 24,
  padelRestingPoints: 0,
  padelWinPoints: 3,
  padelLossPoints: 0,
  padelDrawPoints: 2,
  padelMinPlayers: 8,
  padelMaxPlayers: 8,
  padelRoundCount: 4,
  padelCourtCount: 4,
  padelRoundGapMinutes: 10,
};

async function ensurePadelFormat(id, label) {
  const state = await detailOf(id);
  const drifted = Object.entries(PADEL_CONFIG).filter(([k, v]) => state[k] !== v);
  if (state.padelFormat && !drifted.length) {
    note('GET', `/tournaments/${id}`, 200,
      `${label} padel format already ${state.padelFormat}, ${state.teams.length} pairs`);
    return state;
  }
  const put = await asUser(T, `/tournaments/${id}`, {
    method: 'PUT',
    body: { teamIds: state.teams.map((t) => t.id), teamCount: 4, isComplete: true, ...PADEL_CONFIG },
  });
  note('PUT', `/tournaments/${id}`, put.status,
    state.padelFormat
      ? `${label}: configuration reset (${drifted.map(([k]) => k).join(', ')})`
      : `${label}: Swiss, 8 players in 4 pairs, 4 rounds, 4 courts`);
  return detailOf(id);
}

/** Anything not in `keep` is a phase an interrupted run left behind. */
async function reconcilePhases(id, label, keep) {
  const detail = await detailOf(id);
  for (const p of detail.phases ?? []) {
    if (keep.includes(p.name)) continue;
    const del = await asUser(T, `/tournament-phases/${p.id}`, { method: 'DELETE' });
    note('DELETE', `/tournament-phases/${p.id}`, del.status, `${label}: stray phase "${p.name}"`);
  }
}

/**
 * A repeatable result for one pairing. Copied from scripts/seed-13.mjs.
 *
 * The two names are sorted, then hashed into a small scoreline. No clock and no
 * randomness: the same two teams always draw the same result, so the standings
 * table photographs identically on every run and on a rebuilt fixture.
 */
function fixedResult(home, away) {
  const [a, b] = [home, away].slice().sort();
  let h = 0;
  for (const ch of `${a}|${b}`) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  const table = [[3, 1], [2, 0], [1, 1], [0, 2], [2, 1], [1, 0], [2, 2], [4, 0]];
  const [x, y] = table[h % table.length];
  return home === a ? { homeGoals: x, awayGoals: y } : { homeGoals: y, awayGoals: x };
}

/**
 * Put a fixed score on every match of every group.
 *
 * A match will not take a score until it is Live or Finished, so each one goes
 * Live -> score -> Finished. The Results tab does exactly this through the UI:
 * START moves the card to Live and reveals two score boxes, typing in one fires
 * PUT /matches/:id/score, and END moves it on. Observed on the wire 2026-09-01.
 */
async function scoreGroupPhase(id, label, onlyGroups) {
  const detail = await detailOf(id);
  let scored = 0;
  let already = 0;
  for (const g of detail.groups ?? []) {
    if (onlyGroups && !onlyGroups.includes(g.name)) {
      note('GET', `/tournaments/${id}`, 200, `${label}: ${g.name} left unplayed on purpose`);
      continue;
    }
    for (const m of await groupMatches(id, g.id)) {
      const home = m.homeTeam?.teamName;
      const away = m.awayTeam?.teamName;
      if (!home || !away) continue;
      const { homeGoals, awayGoals } = fixedResult(home, away);
      if (m.status === 'Finished'
        && m.homeTeamTotalGoals === homeGoals && m.awayTeamTotalGoals === awayGoals) {
        already += 1;
        continue;
      }
      await asUser(T, `/matches/${m.id}/status`, { method: 'POST', body: { status: 'Live' } });
      const put = await asUser(T, `/matches/${m.id}/score`, {
        method: 'PUT',
        body: { homeTeamTotalGoals: homeGoals, awayTeamTotalGoals: awayGoals },
      });
      await asUser(T, `/matches/${m.id}/status`, { method: 'POST', body: { status: 'Finished' } });
      note('PUT', `/matches/${m.id}/score`, put.status, `${home} ${homeGoals}-${awayGoals} ${away}`);
      scored += 1;
    }
  }
  note('GET', `/tournaments/${id}`, 200,
    `${label}: ${scored} match(es) scored, ${already} already correct`);
}

/**
 * Put every fixture in a group back to Scheduled with no score.
 *
 * 15.8's spec starts a fixture, types a score into it and ends it, which is the
 * only way to photograph the three states a fixture card has. Nothing undoes
 * that directly: `POST /matches/:id/status {"status":"Scheduled"}` answers
 * `400 "Cannot update status of a Finished match"` (observed 2026-09-01), and
 * there is no reset endpoint in the collection or on the wire.
 *
 * What does work is making the generator rebuild the group. Nudging a group's
 * `teamCount` and putting it straight back regenerates its matches - the same
 * trick collection 14 used, and verified here to come back with the same four
 * teams, the same six pairings in the same order, the same kick-off times, and
 * every card Scheduled with no score. Deterministic, so a spec can call it too.
 */
async function regenerateGroupMatches(id, label, onlyGroups) {
  const detail = await detailOf(id);
  let dirty = 0;
  for (const g of detail.groups ?? []) {
    if (onlyGroups && !onlyGroups.includes(g.name)) continue;
    const matches = await groupMatches(id, g.id);
    const played = matches.filter((m) => m.status !== 'Scheduled'
      || (m.homeTeamTotalGoals ?? null) !== null || (m.awayTeamTotalGoals ?? null) !== null);
    if (!played.length) {
      note('GET', `/tournaments/${id}`, 200, `${label} ${g.name}: all ${matches.length} fixtures already unplayed`);
      continue;
    }
    const want = g.teamCount;
    await asUser(T, `/tournament-groups/${g.id}`, { method: 'PUT', body: { teamCount: want + 1 } });
    const back = await asUser(T, `/tournament-groups/${g.id}`, { method: 'PUT', body: { teamCount: want } });
    note('PUT', `/tournament-groups/${g.id}`, back.status,
      `${label} ${g.name}: ${played.length} played fixture(s) regenerated back to Scheduled`);
    dirty += played.length;
  }
  if (dirty) {
    const after = [];
    const d2 = await detailOf(id);
    for (const g of d2.groups ?? []) {
      for (const m of await groupMatches(id, g.id)) after.push(`${m.name} ${m.status}`);
    }
    note('GET', `/tournaments/${id}`, 200, `${label}: now ${after.join(', ')}`);
  }
}

const groupAndKnockout = (teamIds) => ({
  teamCount: 8,
  teamSize: '5 VS 5',
  teamIds,
  isComplete: true,
  format: 'GroupAndKnockout',
  groupCount: 2,
  teamsPerGroup: 4,
  matchesPerTeam: 1,
  autoScheduleMatchesNextDay: true,
  status: 'Published',
});

const roundRobin = (teamIds) => ({
  teamCount: 4,
  teamSize: '5 VS 5',
  teamIds,
  isComplete: true,
  format: 'RoundRobin',
  groupCount: 1,
  teamsPerGroup: 4,
  matchesPerTeam: 1,
  autoScheduleMatchesNextDay: true,
  status: 'Published',
});

/** Add a tournament admin, but read the role list first so a re-run is silent. */
async function ensureAdmin(id, label, email) {
  const d = await detailOf(id);
  if ((d.adminPlayers ?? []).some((p) => p.email === email)) {
    note('GET', `/tournaments/${id}`, 200, `${label}: ${email} is already an admin`);
    return;
  }
  const r = await asUser(T, `/tournaments/${id}/admin`, { method: 'POST', body: { email } });
  note('POST', `/tournaments/${id}/admin`, r.status, `${label} admin = ${email}`);
}

/**
 * Announcement-only chat.
 *
 * `PATCH /tournaments/:id/chat/settings {"announcementOnly": bool}` - observed on
 * the wire 2026-09-01, from the CHAT card on the tournament settings page. The
 * Postman export has only the GET.
 */
async function ensureChatSetting(id, label, announcementOnly) {
  const cur = (await asUser(T, `/tournaments/${id}/chat/settings`)).body.data ?? {};
  if (cur.announcementOnly === announcementOnly) {
    note('GET', `/tournaments/${id}/chat/settings`, 200,
      `${label}: announcementOnly already ${announcementOnly}`);
    return cur;
  }
  const r = await asUser(T, `/tournaments/${id}/chat/settings`, {
    method: 'PATCH', body: { announcementOnly },
  });
  note('PATCH', `/tournaments/${id}/chat/settings`, r.status,
    `${label}: announcementOnly ${cur.announcementOnly} -> ${announcementOnly}`);
  return (await asUser(T, `/tournaments/${id}/chat/settings`)).body.data ?? {};
}

// --- 6. KB 15 Cup - the main fixture ----------------------------------------
const CUP_TEAMS = ['KB 15 Reds', 'KB 15 Blues', 'KB 15 Greens', 'KB 15 Yellows',
                   'KB 15 Whites', 'KB 15 Blacks', 'KB 15 Purples', 'KB 15 Oranges'];

const cup = ids.tournaments['KB 15 Cup'];
const cupState = await ensureTeams(cup, CUP_TEAMS, 'KB 15 Cup');
ids.cupTeams = Object.fromEntries(cupState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(cup, 'KB 15 Cup', groupAndKnockout(CUP_TEAMS.map((n) => ids.cupTeams[n])));
await reconcilePhases(cup, 'KB 15 Cup', ['Group Phase', 'Knockout Phase']);
// GROUP A ONLY is scored. That is deliberate and it is what makes the public
// page worth photographing: Group A's standings carry real numbers, Past Matches
// holds six finished fixtures, and Upcoming Matches still holds six. Scoring the
// whole phase emptied Upcoming Matches - the first pass did exactly that and
// 15.1's matches capture came back reading "No upcoming matches found".
//
// It also keeps `canEndPhase` false, so the Results tab shows no phase banner.
// Starting and ending phases is 13.11's article, not this collection's.
// Group B is regenerated FIRST, because an earlier pass of this seed scored the
// whole phase and nothing un-scores a fixture in place.
//
// Regenerating restarts the group at the tournament's own kick-off time, which
// puts Group B on top of Group A - a clash, and collection 14.6's subject rather
// than this collection's. So it is re-timed to 11:00 straight afterwards, the
// same bulk call the Schedule tab's dialog sends.
await regenerateGroupMatches(cup, 'KB 15 Cup', ['Group B']);
{
  const groups = Object.fromEntries(((await detailOf(cup)).groups ?? []).map((g) => [g.name, g.id]));
  const want = ['10:00', '10:10', '10:20', '10:30', '10:40', '10:50']
    .map((hm) => `2026-10-24T${hm}:00.000Z`);
  const have = (await groupMatches(cup, groups['Group B'])).map((m) => m.date).sort();
  if (have.length === want.length && have.every((v, i) => v === want[i])) {
    note('GET', `/tournaments/${cup}`, 200, 'KB 15 Cup Group B: kick-offs already 11:00 to 11:50');
  } else {
    // 24 Oct 2026 is BST, so 11:00 local is 10:00Z.
    const r = await asUser(T, `/tournament-groups/${groups['Group B']}`, {
      method: 'PUT',
      body: {
        date: '2026-10-23T23:00:00.000Z',
        startTime: '11:00',
        timeZone: 'Europe/London',
        duration: '10 min',
        timeBetweenMatches: '0 min',
        sameStartTimePerRound: false,
      },
    });
    note('PUT', `/tournament-groups/${groups['Group B']}`, r.status,
      'KB 15 Cup Group B: re-timed to 11:00 to 11:50, clear of Group A');
  }
}
await scoreGroupPhase(cup, 'KB 15 Cup', ['Group A']);
await ensureAdmin(cup, 'KB 15 Cup', ADMIN);
await ensureChatSetting(cup, 'KB 15 Cup', false);

// Two named players on two teams, so the Participants > Players sub-tab is not
// empty for 15.9. Six teams stay empty, which is what a real tournament looks
// like the week before it runs.
const CUP_PLAYERS = [
  { team: 'KB 15 Reds', name: 'Rory KB' },
  { team: 'KB 15 Reds', name: 'Rhys KB' },
  { team: 'KB 15 Blues', name: 'Bea KB' },
];

// A team's live members are `GET /teams/:teamId/players` filtered on
// `isDeleted` - there is no ?teamId listing on /team-players. Getting that wrong
// once is what put three duplicate rows on KB 15 Reds, so the loop below also
// removes any surplus copy of a name it is responsible for. A removed row stays
// in the API flagged isDeleted and renders nowhere (config/api.md), so this is
// safe to re-run.
for (const p of CUP_PLAYERS) {
  const teamId = ids.cupTeams[p.team];
  const live = ((await asUser(T, `/teams/${teamId}/players`)).body.data ?? [])
    .filter((m) => !m.isDeleted);
  const mine = live.filter((m) => (m.player?.name ?? '') === p.name);
  if (mine.length === 1) {
    note('GET', `/teams/${teamId}/players`, 200, `KB 15 Cup: ${p.name} already on ${p.team}`);
    continue;
  }
  for (const dup of mine.slice(1)) {
    const del = await asUser(T, `/team-players/${dup.id}`, { method: 'DELETE' });
    note('DELETE', `/team-players/${dup.id}`, del.status, `KB 15 Cup: duplicate ${p.name} on ${p.team}`);
  }
  if (!mine.length) {
    const r = await asUser(T, '/team-players', {
      method: 'POST', body: { teamId, name: p.name, role: 'Player' },
    });
    note('POST', '/team-players', r.status, `KB 15 Cup: ${p.name} -> ${p.team}`);
  }
}

// --- 7. sponsors on KB 15 Cup -----------------------------------------------
// 15.6 is the sponsors article and a Sponsors slide needs something to show. Two,
// so the tab is a list rather than a single row. The first carries a banner, the
// second does not - a sponsor with no banner falls back to its initials, and the
// article says so.
const SPONSORS = [
  {
    name: 'KB Astro Sports',
    link: 'https://example.com/kb-astro',
    description: 'Kit and equipment for every KB 15 Cup team.',
    banner: 'assets/15/astro-sports.webp',
  },
  {
    name: 'KB Riverside Cafe',
    link: 'https://example.com/kb-riverside',
    description: 'Food and drink beside pitch one all day.',
  },
];

ids.sponsors = {};
{
  const listed = (await asUser(T, `/tournaments/${cup}/sponsors`)).body.data?.sponsors ?? [];
  for (const s of SPONSORS) {
    const found = listed.find((x) => x.name === s.name);
    if (found) {
      ids.sponsors[s.name] = String(found._id ?? found.id);
      note('GET', `/tournaments/${cup}/sponsors`, 200, `${s.name} exists ${ids.sponsors[s.name]}`);
      continue;
    }
    let bannerToken;
    if (s.banner) {
      if (!fs.existsSync(s.banner)) {
        throw new Error(`seed-15: ${s.banner} is missing. Run: node scripts/make-assets-15.mjs`);
      }
      const up = await upload(T, `/tournaments/${cup}/sponsors/banner`, 'banner', s.banner);
      if (!up.ok) throw new Error(`sponsor banner upload: ${up.status} ${j(up.body)}`);
      bannerToken = up.body.data;
      note('POST', `/tournaments/${cup}/sponsors/banner`, up.status, `${s.banner} -> token`);
    }
    const r = await asUser(T, `/tournaments/${cup}/sponsors`, {
      method: 'POST',
      body: {
        name: s.name, link: s.link, description: s.description,
        ...(bannerToken ? { bannerToken } : {}),
      },
    });
    ids.sponsors[s.name] = String(r.body.data?.id);
    note('POST', `/tournaments/${cup}/sponsors`, r.status, `${s.name} = ${ids.sponsors[s.name]}`);
  }
}

// --- 8. the presentation on KB 15 Cup ---------------------------------------
// Written straight over the API rather than through the editor.
//
// The editor is 15.4's subject, not its fixture: a spec that had to build a
// slideshow before it could photograph one would fail its own validation half
// the time, and the ids the editor generates carry a timestamp and a random
// suffix, which is exactly what docs/style-guide.md forbids in a fixture. The
// shape below was read off the wire on 2026-09-01 from a slideshow built by
// hand in the editor, component by component, and every id here is a fixed
// string.
//
// The component `type` enum, quoted back by the server's own validator:
// `'text' | 'group' | 'bracket' | 'sponsor' | 'ranking' | 'qrCode' |
// 'upcomingMatches'`. Note the SINGULAR `sponsor` - the editor's button says
// Sponsors and the plural is rejected with a schema error. Each type carries its
// own required field: text needs `text`, group needs `groupId` plus
// `displayMode`, bracket needs `bracketId`, sponsor needs a non-empty
// `sponsorIds`. The editor refuses to save the whole slideshow while any one
// component is missing its own field.
const PUBLIC_TABS = ['info', 'participants', 'standings', 'leaderboard', 'matches', 'chat'];

function cupSlideshow(cupDetail, sponsorIds) {
  const groupA = (cupDetail.groups ?? []).find((g) => g.name === 'Group A');
  const bracket = (cupDetail.brackets ?? [])[0];
  if (!groupA || !bracket) {
    throw new Error('seed-15: KB 15 Cup has no Group A or no bracket - the format save did not run');
  }
  return [{
    id: 'kb15-slideshow-1',
    name: 'KB 15 Cup screen',
    active: true,
    showTournamentName: true,
    showCurrentTime: true,
    backgroundColor: '#0f172a',
    componentBackgroundColor: '#ffffff',
    slides: [
      {
        id: 'kb15-slide-welcome',
        title: 'Welcome',
        active: true,
        durationSeconds: 10,
        components: [
          { id: 'kb15-c-text', type: 'text', text: 'Welcome to KB 15 Cup. Kick-off 10:00.', sponsorIds: [] },
          { id: 'kb15-c-qr', type: 'qrCode', sponsorIds: [] },
        ],
      },
      {
        id: 'kb15-slide-group',
        title: 'Group A',
        active: true,
        durationSeconds: 15,
        components: [
          { id: 'kb15-c-group', type: 'group', groupId: String(groupA.id), displayMode: 'both', sponsorIds: [] },
        ],
      },
      {
        id: 'kb15-slide-next',
        title: 'Coming up',
        active: true,
        durationSeconds: 12,
        components: [
          { id: 'kb15-c-upcoming', type: 'upcomingMatches', sponsorIds: [] },
          { id: 'kb15-c-ranking', type: 'ranking', sponsorIds: [] },
        ],
      },
      {
        id: 'kb15-slide-sponsors',
        title: 'Our sponsors',
        active: true,
        durationSeconds: 8,
        components: [
          { id: 'kb15-c-sponsors', type: 'sponsor', sponsorIds },
        ],
      },
      {
        id: 'kb15-slide-bracket',
        title: 'Knockout',
        active: true,
        durationSeconds: 15,
        components: [
          { id: 'kb15-c-bracket', type: 'bracket', bracketId: String(bracket.id), sponsorIds: [] },
        ],
      },
    ],
  }];
}

/**
 * Upload the info-page files a tournament should carry, and only when it is not
 * already carrying them.
 *
 * `POST .../presentation/gallery` and `POST .../presentation/attachments` each
 * answer one entry, and the server puts a random hex prefix on `filename` and
 * generates the `id` - so a seed cannot write these deterministically. What it
 * CAN do is match on `originalFilename`, which is the name the app shows, and
 * upload only what is missing. That is what makes this idempotent.
 */
async function ensureInfoFiles(id, label, kind, files, current) {
  const have = current ?? [];
  const wantNames = files.map((f) => f.split('/').pop());
  const settled = have.length === files.length
    && wantNames.every((n) => have.some((e) => e.originalFilename === n));
  if (settled) {
    note('GET', `/tournaments/${id}`, 200,
      `${label}: ${kind} already holds ${wantNames.join(', ') || 'nothing'}`);
    return have;
  }
  const out = [];
  for (const file of files) {
    if (!fs.existsSync(file)) {
      throw new Error(`seed-15: ${file} is missing. Run: node scripts/make-assets-15.mjs`);
    }
    // Field names found by trying them, 2026-09-01: `picture` for the gallery,
    // `attachment` for the attachments. Neither was visible on the wire, because
    // the browser's own multipart boundary hides the field name from the request
    // log this project reads.
    const field = kind === 'gallery' ? 'picture' : 'attachment';
    const up = await upload(T, `/tournaments/${id}/presentation/${kind}`, field, file);
    if (!up.ok) throw new Error(`${kind} upload ${file} as "${field}": ${up.status} ${j(up.body)}`);
    const entry = up.body.data;
    out.push(entry);
    note('POST', `/tournaments/${id}/presentation/${kind}`, up.status,
      `${label}: ${file} -> ${entry.filename ?? j(entry).slice(0, 120)}`);
  }
  return out;
}

/**
 * Bring one tournament's `presentation` object to a known state.
 *
 * `PUT /tournaments/:id {presentation}` is what all three halves of the
 * Presentation tab send - the Website sub-tab's Save, the info page's Save and
 * the Slideshow sub-tab's Save each carry the SAME whole object, so none of them
 * can wipe another's half by omission. This writes the lot.
 */
async function reconcilePresentation(id, label, { slideshows = [], infoBody = '', gallery = [], attachments = [] } = {}) {
  const d = await detailOf(id);
  const cur = d.presentation ?? {};
  const web = cur.website ?? {};
  const curTabs = web.visiblePublicTabs ?? [];

  const tabsOk = curTabs.length === PUBLIC_TABS.length
    && PUBLIC_TABS.every((t) => curTabs.includes(t));
  const bodyOk = (web.infoBody ?? '') === infoBody;
  const showsOk = JSON.stringify(cur.slideshows ?? []) === JSON.stringify(slideshows);

  const galleryEntries = await ensureInfoFiles(id, label, 'gallery', gallery, web.gallery);
  const attachmentEntries = await ensureInfoFiles(id, label, 'attachments', attachments, web.attachments);
  const filesOk = galleryEntries === web.gallery && attachmentEntries === web.attachments;

  if (tabsOk && bodyOk && showsOk && filesOk) {
    note('GET', `/tournaments/${id}`, 200,
      `${label}: presentation already correct (${curTabs.length} public tabs, `
      + `${(cur.slideshows ?? []).length} slideshow(s), ${galleryEntries.length} picture(s), `
      + `${attachmentEntries.length} attachment(s))`);
    return;
  }
  const r = await asUser(T, `/tournaments/${id}`, {
    method: 'PUT',
    body: {
      presentation: {
        website: {
          visiblePublicTabs: PUBLIC_TABS,
          infoBody,
          attachments: attachmentEntries,
          gallery: galleryEntries,
        },
        slideshows,
      },
    },
  });
  note('PUT', `/tournaments/${id}`, r.status,
    `${label}: presentation written - ${PUBLIC_TABS.length} public tabs, `
    + `${slideshows.length} slideshow(s), ${galleryEntries.length} picture(s), `
    + `${attachmentEntries.length} attachment(s)`
    + `${tabsOk ? '' : `  (tabs were ${JSON.stringify(curTabs)})`}`);
}

await reconcilePresentation(cup, 'KB 15 Cup', {
  slideshows: cupSlideshow(await detailOf(cup), SPONSORS.map((s) => ids.sponsors[s.name])),
  infoBody: 'Everything you need for the day, in one place. Notes for teams are below.',
  gallery: ['assets/15/astro-park.webp'],
  attachments: ['assets/15/kb-15-cup-team-notes.pdf'],
});

// --- 9. followers on KB 15 Cup ----------------------------------------------
// POST /tournaments/:id/follow answers 409 "Already following this tournament"
// on a second call, so read GET .../follow first. Observed 2026-09-01.
for (const who of [FREE, OUTSIDER]) {
  const t2 = tokens[who];
  const cur = (await asUser(t2, `/tournaments/${cup}/follow`)).body.data ?? {};
  if (cur.isFollowing) {
    note('GET', `/tournaments/${cup}/follow`, 200, `${who} already follows KB 15 Cup`);
    continue;
  }
  const r = await asUser(t2, `/tournaments/${cup}/follow`, { method: 'POST' });
  note('POST', `/tournaments/${cup}/follow`, r.status, `${who} now follows KB 15 Cup`);
}

// --- 10. KB 15 League - scored, and announcement-only chat -------------------
const LEAGUE_TEAMS = ['KB 15 Kestrels', 'KB 15 Falcons', 'KB 15 Ravens', 'KB 15 Swifts'];

const league = ids.tournaments['KB 15 League'];
const leagueState = await ensureTeams(league, LEAGUE_TEAMS, 'KB 15 League');
ids.leagueTeams = Object.fromEntries(leagueState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(league, 'KB 15 League', roundRobin(LEAGUE_TEAMS.map((n) => ids.leagueTeams[n])));
await reconcilePhases(league, 'KB 15 League', ['Group Phase']);
await scoreGroupPhase(league, 'KB 15 League');
// Ada is a tournament admin here as well as on the Cup, which is the point: an
// announcement-only chat still refuses her. 15.7 says so.
await ensureAdmin(league, 'KB 15 League', ADMIN);
await ensureChatSetting(league, 'KB 15 League', true);

// --- 11. KB 15 Padel Cup - the scored padel board ---------------------------
const padelCup = ids.tournaments['KB 15 Padel Cup'];
await ensurePadelFormat(padelCup, 'KB 15 Padel Cup');
await reconcilePhases(padelCup, 'KB 15 Padel Cup', ['Group Phase', 'Knockout Phase']);
await scoreGroupPhase(padelCup, 'KB 15 Padel Cup');

// --- 12. KB 15 Sunday League - the fixture 15.8 is allowed to score ---------
const SUNDAY_TEAMS = ['KB 15 Terns', 'KB 15 Gulls', 'KB 15 Petrels', 'KB 15 Skuas'];

const sunday = ids.tournaments['KB 15 Sunday League'];
const sundayState = await ensureTeams(sunday, SUNDAY_TEAMS, 'KB 15 Sunday League');
ids.sundayTeams = Object.fromEntries(sundayState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(sunday, 'KB 15 Sunday League', roundRobin(SUNDAY_TEAMS.map((n) => ids.sundayTeams[n])));
await reconcilePhases(sunday, 'KB 15 Sunday League', ['Group Phase']);
await regenerateGroupMatches(sunday, 'KB 15 Sunday League');
// 15.3 works on this fixture: it unticks a public tab, types a description, adds
// a picture and adds an attachment, then puts each one back. Everything here is
// therefore reset to EMPTY, so the article's captures start from the state a
// reader who has never opened the info page would see - and a run interrupted
// half way is repaired by the next seed.
await reconcilePresentation(sunday, 'KB 15 Sunday League', {
  slideshows: [], infoBody: '', gallery: [], attachments: [],
});

// --- 13. KB 15 New Cup - created, never configured --------------------------
{
  const id = ids.tournaments['KB 15 New Cup'];
  const d = await detailOf(id);
  note('GET', `/tournaments/${id}`, 200,
    `KB 15 New Cup: format=${d.format ?? 'none'}, ${(d.teams ?? []).length} teams`
    + `${d.format ? '  <- WARNING: expected an unconfigured board' : ''}`);
}

// --- 14. KB 15 Done Cup - scored and its phase ended ------------------------
const DONE_TEAMS = ['KB 15 Larks', 'KB 15 Robins', 'KB 15 Wrens', 'KB 15 Finches'];

const done = ids.tournaments['KB 15 Done Cup'];
const doneState = await ensureTeams(done, DONE_TEAMS, 'KB 15 Done Cup');
ids.doneTeams = Object.fromEntries(doneState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(done, 'KB 15 Done Cup', roundRobin(DONE_TEAMS.map((n) => ids.doneTeams[n])));
await reconcilePhases(done, 'KB 15 Done Cup', ['Group Phase']);
await scoreGroupPhase(done, 'KB 15 Done Cup');

// End the phase. `canEndPhase` is true once every match in the phase carries a
// score, and ending is one-way - which is why this fixture exists and why no
// spec ends a phase on KB 15 Cup.
{
  const phases = (await asUser(T, `/tournament-phases?tournamentId=${done}&includeCompletion=true`)).body.data ?? [];
  const last = phases[phases.length - 1];
  // The phase list keys its id as `_id`, not `id`, and an ended phase is marked
  // by `endedAt` plus `canEditScores: false` - there is no `ended` boolean.
  // Observed on the wire, 2026-09-01.
  if (!last) {
    note('GET', '/tournament-phases', 200, 'KB 15 Done Cup: no phase to end');
  } else if (last.endedAt) {
    note('GET', '/tournament-phases', 200,
      `KB 15 Done Cup: "${last.name}" already ended at ${last.endedAt}`);
  } else if (last.canEndPhase) {
    const r = await asUser(T, `/tournament-phases/${last._id}/end-phase`, { method: 'POST' });
    note('POST', `/tournament-phases/${last._id}/end-phase`, r.status,
      `KB 15 Done Cup: "${last.name}" ended, ${r.body?.data?.endedMatchesCount} match(es) marked finished`);
  } else {
    note('GET', '/tournament-phases', 200,
      `KB 15 Done Cup: "${last.name}" cannot be ended yet - canEndPhase=false`);
  }
}

// --- 15. report -------------------------------------------------------------
const summary = {};
for (const [title, id] of Object.entries(ids.tournaments)) {
  const t = await detailOf(id);
  const phases = (await asUser(T, `/tournament-phases?tournamentId=${id}&includeCompletion=true`)).body.data ?? [];
  const chat = (await asUser(T, `/tournaments/${id}/chat/settings`)).body.data ?? {};
  const follow = (await asUser(T, `/tournaments/${id}/follow`)).body.data ?? {};
  const fixtures = [];
  for (const g of t.groups ?? []) {
    for (const m of await groupMatches(id, g.id)) {
      fixtures.push(`${g.name}/${m.name} ${m.status} `
        + `${m.homeTeam?.teamName ?? '?'} ${m.homeTeamTotalGoals ?? '-'}-${m.awayTeamTotalGoals ?? '-'} `
        + `${m.awayTeam?.teamName ?? '?'} ${m.date}`);
    }
  }
  summary[title] = {
    id,
    status: t.status,
    isPublic: t.isPublic,
    pricingPlan: t.pricingPlan,
    gameType: t.gameType,
    format: t.format ?? t.padelFormat ?? null,
    teams: (t.teams ?? []).length,
    groups: (t.groups ?? []).map((g) => `${g.name} (${g.teamCount} slots, ${(g.teams ?? []).length} teams)`),
    brackets: (t.brackets ?? []).map((b) => `${b.name} (${b.teamCount})`),
    phases: phases.map((p) =>
      `${p.name} started=${p.started} active=${p.active} endedAt=${p.endedAt ?? 'no'} `
      + `canEditScores=${p.canEditScores} canEnd=${p.canEndPhase}`),
    admins: (t.adminPlayers ?? []).map((p) => p.email ?? p.name),
    chat: `announcementOnly=${chat.announcementOnly} enabled=${chat.chatEnabled} conversation=${chat.conversationId}`,
    followers: follow.followerCount,
    publicTabs: t.presentation?.website?.visiblePublicTabs ?? [],
    slideshows: (t.presentation?.slideshows ?? []).map(
      (s) => `${s.name}: ${s.slides.length} slide(s), `
        + `${s.slides.flatMap((sl) => sl.components).map((c) => c.type).join('+')}`),
    fixtures,
  };
}

console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- Fixture state ---');
console.log(j(summary));

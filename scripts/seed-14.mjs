// Idempotent seed for collection 14 - "Tournaments - the fixture schedule".
//
//   node scripts/seed-14.mjs
//
// Safe to re-run. Every entity is looked up by its fixed name and only created
// when missing; drifted state is reconciled back. Nothing here reads a clock or
// a random value, so the fixtures a spec sees on Tuesday are the ones it saw on
// Monday.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script seeds ONLY kb-organiser-14@ and fixtures named "KB 14 ...". It
// never touches collection 12's kb-organiser@ or collection 13's
// kb-organiser-13@.
//
// Modelled on scripts/seed-13.mjs. The padel format save is a plain
// PUT /tournaments/:id carrying the padel fields, so both padel fixtures are
// built entirely over the API with no hand work.
//
// Six tournaments, and why each one exists:
//
//   KB 14 Cup          Football, Group and Knockout, 8 teams. The generated
//                      schedule, untouched: Group A 10:00-10:50, Group B
//                      11:00-11:50, Bracket C 12:00-13:00. 14.1 and 14.8.
//   KB 14 League       Football, Round Robin, 4 teams, one group, 10:00-10:50.
//                      The MUTABLE football fixture: 14.3 bulk-schedules it and
//                      14.5 reschedules single matches in it.
//   KB 14 Padel Cup    Padel, Swiss, 8 players, 4 rounds, 4 courts. Rounds at
//                      10:00 / 10:20 / 10:40 / 11:00, two courts per round.
//                      14.2 and the "intended" half of 14.7.
//   KB 14 Padel Open   The same, MUTABLE: 14.4 bulk-schedules it.
//   KB 14 Clash Cup    Football, Group and Knockout. Deliberately broken two
//                      ways, one per half of 14.6: Group A has every fixture on
//                      one kick-off time, Group B has an empty spot so four of
//                      its fixtures carry one team. Nothing else photographs it.
//   KB 14 Padel Clash  Padel, Swiss, every match forced onto court 1 at one
//                      time. The "and when that is a clash" half of 14.7.
//
// Why the two clash fixtures are seeded rather than made by a spec: three other
// articles photograph a correct schedule, and a spec that breaks a shared
// fixture changes their captures. Collection 13 learned this the hard way -
// see state/progress.md, "A spec that mutates its fixture must put it back".

import { admin, asUser, mintSession, j } from '../lib/api.mjs';

const ORGANISER = 'kb-organiser-14@yopmail.com';

const ids = {};
const note = (method, path, status, detail) =>
  console.log(`${method.padEnd(6)} ${path} -> ${status}  ${detail ?? ''}`);

// --- 1. account -------------------------------------------------------------
let res = await admin('/admins/users', {
  method: 'POST',
  body: { name: 'Oona', lastName: 'KB', email: ORGANISER },
});
note('POST', '/admins/users', res.status,
  res.ok ? `${ORGANISER} uid=${res.body.data.uid}` : `${ORGANISER} already exists - reused`);

const session = await mintSession(ORGANISER);
const T = session.idToken;
const me = (await asUser(T, '/users/me')).body.data;
ids.organiser = { userId: me.id, playerId: me.playerId, uid: me.uid };
note('GET', '/users/me', 200, `organiser id=${me.id} playerId=${me.playerId}`);

// --- 2. Pro membership ------------------------------------------------------
let r = await admin(`/admins/change-user-membership/${me.id}`, {
  method: 'POST', body: { membership: 'Pro' },
});
note('POST', `/admins/change-user-membership/${me.id}`, r.status, 'membership=Pro');

// --- 3. venues --------------------------------------------------------------
// Two, because a fixture clash is about a pitch as well as a time: two fixtures
// in the same slot at one venue clash, the same two at different venues do not.
//
// The create modal's club picker calls
// GET /club-locations?tournamentSelectionOnly=true and only lists venues created
// with BOTH isTournament and saveForFutureTournaments true. The plain ?query=
// listing is disjoint from it.
const VENUES = [
  { name: 'KB 14 Astro Park', location: 'Hackney, London' },
  { name: 'KB 14 Riverside', location: 'Fulham, London' },
];

ids.venues = {};
const selectableAll = (await asUser(T, '/club-locations?tournamentSelectionOnly=true')).body.data ?? [];
for (const venue of VENUES) {
  const mine = selectableAll.filter((v) => v.name === venue.name);
  if (mine.length) {
    ids.venues[venue.name] = mine[0].id;
    note('GET', '/club-locations', 200, `${venue.name} exists ${mine[0].id}`);
    // A second copy would make the picker ambiguous in a capture.
    for (const dup of mine.slice(1)) {
      const del = await asUser(T, `/club-locations/${dup.id}`, { method: 'DELETE' });
      note('DELETE', `/club-locations/${dup.id}`, del.status, `duplicate venue "${dup.name}"`);
    }
  } else {
    res = await asUser(T, '/club-locations', {
      method: 'POST',
      body: { ...venue, saveForFutureTournaments: true, isTournament: true },
    });
    ids.venues[venue.name] = res.body.data.id;
    note('POST', '/club-locations', res.status, `${venue.name} = ${res.body.data.id}`);
  }
}

// --- 4. the Tournament Pro allowance ----------------------------------------
// Padel needs three fields Football does not. Observed on the wire 2026-08-28.
const PADEL_CREATE = {
  gameType: 'Padel',
  playMode: 'Score',
  padelEnrollmentType: 'Doubles',
  isFriendlyTournament: false,
};

const WANTED = [
  { title: 'KB 14 Cup', startDate: '2026-09-19' },
  { title: 'KB 14 League', startDate: '2026-09-26' },
  { title: 'KB 14 Padel Cup', startDate: '2026-10-03', extra: PADEL_CREATE },
  { title: 'KB 14 Padel Open', startDate: '2026-10-10', extra: PADEL_CREATE },
  { title: 'KB 14 Clash Cup', startDate: '2026-09-12' },
  { title: 'KB 14 Padel Clash', startDate: '2026-10-17', extra: PADEL_CREATE },
];

const existing = (await asUser(T, '/tournaments')).body.data ?? [];
const missing = WANTED.filter((w) => !existing.some((t) => t.title === w.title));

// The grant is ADDITIVE, not a set, and there is no revoke. Creating a
// tournament spends a slot and deleting it does not give the slot back, so
// granting whenever the balance reads zero would grant again on every re-run
// once all six exist. Grant only when a tournament actually has to be created
// and there are not enough slots for it.
const remaining = me.freeTournamentProAllowanceRemaining ?? 0;
if (missing.length > remaining) {
  r = await admin('/admins/users/tournament-free-pro/grant', {
    method: 'POST', body: { email: ORGANISER, plan: 'Pro', quantity: missing.length - remaining },
  });
  note('POST', '/admins/users/tournament-free-pro/grant', r.status,
    r.ok ? `total=${r.body.data.totalQuantity} remaining=${r.body.data.remainingQuantity}` : j(r.body));
} else {
  note('GET', '/users/me', 200,
    `${remaining} Tournament Pro slot(s) remaining, ${missing.length} tournament(s) to create - no grant needed`);
}

// --- 5. tournaments ---------------------------------------------------------
async function ensureTournament(title, startDate, extra = {}) {
  const found = existing.find((t) => t.title === title);
  if (found) {
    const id = found._id ?? found.id;
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
      clubLocationIds: [ids.venues['KB 14 Astro Park']],
      isAutoStartEnable: false,
      startTime: '10:00',
      // Pinned. The app sends the browser's own zone, which would otherwise
      // differ per machine and shift every rendered kick-off time.
      timeZone: 'Europe/London',
      ...extra,
    },
  });
  note('POST', '/tournaments', created.status, `${title} = ${created.body.data?.id}`);
  return created.body.data.id;
}

ids.tournaments = {};
for (const w of WANTED) {
  ids.tournaments[w.title] = await ensureTournament(w.title, w.startDate, w.extra);
}

// --- 6. helpers -------------------------------------------------------------
async function ensureTeams(tournamentId, names, label) {
  let state = (await asUser(T, `/tournaments/${tournamentId}`)).body.data;
  const missingTeams = names.filter((n) => !state.teams.some((t) => t.name === n));
  if (missingTeams.length) {
    const bulk = await asUser(T, `/tournaments/${tournamentId}/teams/bulk`, {
      method: 'POST', body: { teamNames: missingTeams },
    });
    note('POST', `/tournaments/${tournamentId}/teams/bulk`, bulk.status, missingTeams.join(', '));
    state = (await asUser(T, `/tournaments/${tournamentId}`)).body.data;
  } else {
    note('GET', `/tournaments/${tournamentId}`, 200, `${label}: all ${names.length} teams present`);
  }
  return state;
}

/** Saving the format is what generates the groups, the bracket and the phases. */
async function ensureFootballFormat(id, label, body) {
  const state = (await asUser(T, `/tournaments/${id}`)).body.data;
  if (state.format) {
    note('GET', `/tournaments/${id}`, 200, `${label} format already ${state.format}`);
    return state;
  }
  const put = await asUser(T, `/tournaments/${id}`, { method: 'PUT', body });
  note('PUT', `/tournaments/${id}`, put.status,
    `${label}: ${body.format}, ${body.groupCount} group(s) of ${body.teamsPerGroup}`);
  return (await asUser(T, `/tournaments/${id}`)).body.data;
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

async function savePadelFormat(id, config) {
  const state = (await asUser(T, `/tournaments/${id}`)).body.data;
  return asUser(T, `/tournaments/${id}`, {
    method: 'PUT',
    body: { teamIds: state.teams.map((t) => t.id), teamCount: 4, isComplete: true, ...config },
  });
}

async function ensurePadelFormat(id, label) {
  const state = (await asUser(T, `/tournaments/${id}`)).body.data;
  const drifted = Object.entries(PADEL_CONFIG).filter(([k, v]) => state[k] !== v);
  if (state.padelFormat && !drifted.length) {
    note('GET', `/tournaments/${id}`, 200,
      `${label} padel format already ${state.padelFormat}, ${state.teams.length} pairs`);
    return state;
  }
  // 14.4's spec changes a configuration value, so the values are put back here
  // rather than only being created once.
  const put = await savePadelFormat(id, PADEL_CONFIG);
  note('PUT', `/tournaments/${id}`, put.status,
    state.padelFormat
      ? `${label}: configuration reset (${drifted.map(([k]) => k).join(', ')})`
      : `${label}: Swiss, 8 players, 4 rounds, 4 courts, 10 min between rounds`);
  return (await asUser(T, `/tournaments/${id}`)).body.data;
}

/**
 * Rebuild a padel group's fixtures from the format.
 *
 * The court number on each match is assigned by the generator, and nothing else
 * can set it back: the bulk update writes ONE court number across every match
 * it touches, so a run that forced the group onto court 1 cannot be undone by
 * another bulk update. Only regenerating restores "Round 1 - Court 1" on court
 * 1 and "Round 1 - Court 2" on court 2.
 *
 * Re-sending an identical configuration does NOT regenerate - verified on the
 * wire, 2026-08-28. The value has to actually change, so the gap is nudged and
 * put straight back. The gap is used rather than the court count because it
 * cannot affect which court a match is given.
 */
async function regeneratePadelSchedule(id, label) {
  await savePadelFormat(id, { ...PADEL_CONFIG, padelRoundGapMinutes: PADEL_CONFIG.padelRoundGapMinutes + 1 });
  const put = await savePadelFormat(id, PADEL_CONFIG);
  note('PUT', `/tournaments/${id}`, put.status, `${label}: fixtures regenerated from the format`);
}

/**
 * Bring a tournament's phase structure back to what the format generated.
 *
 * Exploration adds phases with one click and there is no undo, so a run that
 * was interrupted can leave a "Phase 3" behind. Anything not in `keep` goes.
 */
async function reconcilePhases(id, label, keep) {
  const detail = (await asUser(T, `/tournaments/${id}`)).body.data;
  for (const p of detail.phases ?? []) {
    if (keep.includes(p.name)) continue;
    const del = await asUser(T, `/tournament-phases/${p.id}`, { method: 'DELETE' });
    note('DELETE', `/tournament-phases/${p.id}`, del.status, `${label}: stray phase "${p.name}"`);
  }
}

/**
 * The kick-off times a reconciled group or bracket should be showing.
 *
 * `firstUtc` is the first one, `stepMinutes` the gap between consecutive
 * fixtures. When `sameStartTimePerRound` is set every fixture shares `firstUtc`,
 * which is what the bulk dialog does to a group that has no rounds.
 */
function expectedStamps(target, count) {
  if (target.sameStartTimePerRound) return Array(count).fill(target.firstUtc);
  const first = Date.parse(target.firstUtc);
  return Array.from({ length: count }, (_, i) =>
    new Date(first + i * target.stepMinutes * 60_000).toISOString()).sort();
}

const groupMatches = async (id, groupId) =>
  (await asUser(T, `/tournaments/${id}/schedule/groups/${groupId}/matches`)).body.data ?? [];

const bracketMatches = async (id, bracketId) => {
  const body = (await asUser(T, `/tournaments/${id}/schedule/brackets/${bracketId}/matches`)).body.data;
  return body?.matches ?? body ?? [];
};

/**
 * Rewrite one group's or bracket's fixture times, and only when they have moved.
 *
 * This is the same call the Bulk Match Updates dialog sends - observed on the
 * wire 2026-08-28. It is used here rather than trusting the generator's own
 * defaults, because three specs re-time their fixture on purpose and the seed
 * has to be able to put every one of them back exactly.
 *
 * `sameStartTimePerRound: true` with no `timeBetweenMatches` is what collapses
 * every fixture onto one kick-off time. That is not a mistake here - it is
 * precisely the state 14.6 and 14.7 document, and it is what the dialog does
 * through the UI, where the gap field is disabled whenever the box is ticked.
 */
async function reconcileSchedule(id, label, target) {
  const { kind, entityId, date, startTime, duration, gap, sameStartTimePerRound, pitchNumber } = target;
  const matches = kind === 'group'
    ? await groupMatches(id, entityId)
    : await bracketMatches(id, entityId);

  const stamps = matches.map((m) => m.date).sort();
  const pitches = matches.map((m) => String(m.pitchNumber ?? ''));
  // Compare against the FULL expected sequence, not just its first entry.
  // Checking only the first is what let an exploration that had rolled this
  // group across three days read as "already correct".
  const want = expectedStamps(target, matches.length);
  const settled = matches.length > 0
    && stamps.length === want.length
    && stamps.every((s, i) => s === want[i])
    && (pitchNumber === undefined || pitches.every((p) => p === String(pitchNumber)));

  if (settled) {
    note('GET', `/tournaments/${id}`, 200, `${label}: fixture times already correct`);
    return;
  }
  const wantOneTime = !!sameStartTimePerRound;
  const path = kind === 'group' ? `/tournament-groups/${entityId}` : `/tournament-brackets/${entityId}`;
  const put = await asUser(T, path, {
    method: 'PUT',
    body: {
      date, startTime, timeZone: 'Europe/London',
      ...(duration ? { duration } : {}),
      ...(gap ? { timeBetweenMatches: gap } : {}),
      ...(pitchNumber === undefined ? {} : { pitchNumber: String(pitchNumber) }),
      sameStartTimePerRound: wantOneTime,
    },
  });
  note('PUT', path, put.status,
    `${label}: re-timed from ${startTime}${wantOneTime ? ', all on one kick-off' : ` every ${duration} + ${gap}`}`);
}

/** A football group's slot count. Raising it past the teams in it is what
 *  leaves an empty spot, and an empty spot is what makes a fixture with one
 *  team. Changing it regenerates the group's matches, so it runs before the
 *  schedule is re-timed. */
async function reconcileGroupTeamCount(id, label, groupId, teamCount) {
  const detail = (await asUser(T, `/tournaments/${id}`)).body.data;
  const group = (detail.groups ?? []).find((g) => g.id === groupId);
  if (group?.teamCount === teamCount) {
    note('GET', `/tournaments/${id}`, 200, `${label} ${group.name}: team count already ${teamCount}`);
    return false;
  }
  const put = await asUser(T, `/tournament-groups/${groupId}`, { method: 'PUT', body: { teamCount } });
  note('PUT', `/tournament-groups/${groupId}`, put.status,
    `${label}: team count ${group?.teamCount} -> ${teamCount}, matches regenerated`);
  return true;
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

// --- 7. KB 14 Cup - the clean football board --------------------------------
const CUP_TEAMS = ['KB 14 Reds', 'KB 14 Blues', 'KB 14 Greens', 'KB 14 Yellows',
                   'KB 14 Whites', 'KB 14 Blacks', 'KB 14 Purples', 'KB 14 Oranges'];

const cup = ids.tournaments['KB 14 Cup'];
const cupState = await ensureTeams(cup, CUP_TEAMS, 'KB 14 Cup');
ids.cupTeams = Object.fromEntries(cupState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(cup, 'KB 14 Cup', groupAndKnockout(CUP_TEAMS.map((n) => ids.cupTeams[n])));
await reconcilePhases(cup, 'KB 14 Cup', ['Group Phase', 'Knockout Phase']);

{
  const d = (await asUser(T, `/tournaments/${cup}`)).body.data;
  // 19 Sep 2026 is BST, so 10:00 local is 09:00Z.
  await reconcileSchedule(cup, 'KB 14 Cup Group A', {
    kind: 'group', entityId: d.groups[0].id,
    date: '2026-09-18T23:00:00.000Z', startTime: '10:00', duration: '10 min', gap: '0 min',
    firstUtc: '2026-09-19T09:00:00.000Z', stepMinutes: 10,
  });
  await reconcileSchedule(cup, 'KB 14 Cup Group B', {
    kind: 'group', entityId: d.groups[1].id,
    date: '2026-09-18T23:00:00.000Z', startTime: '11:00', duration: '10 min', gap: '0 min',
    firstUtc: '2026-09-19T10:00:00.000Z', stepMinutes: 10,
  });
  await reconcileSchedule(cup, 'KB 14 Cup Bracket C', {
    kind: 'bracket', entityId: d.brackets[0].id,
    date: '2026-09-18T23:00:00.000Z', startTime: '12:00', duration: '10 min', gap: '0 min',
    firstUtc: '2026-09-19T11:00:00.000Z', stepMinutes: 10,
  });
}

// --- 8. KB 14 League - the mutable football fixture -------------------------
const LEAGUE_TEAMS = ['KB 14 Kestrels', 'KB 14 Falcons', 'KB 14 Ravens', 'KB 14 Swifts'];

const league = ids.tournaments['KB 14 League'];
const leagueState = await ensureTeams(league, LEAGUE_TEAMS, 'KB 14 League');
ids.leagueTeams = Object.fromEntries(leagueState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(league, 'KB 14 League', {
  teamCount: 4,
  teamSize: '5 VS 5',
  teamIds: LEAGUE_TEAMS.map((n) => ids.leagueTeams[n]),
  isComplete: true,
  format: 'RoundRobin',
  groupCount: 1,
  teamsPerGroup: 4,
  matchesPerTeam: 1,
  autoScheduleMatchesNextDay: true,
  status: 'Published',
});
await reconcilePhases(league, 'KB 14 League', ['Group Phase']);

{
  const d = (await asUser(T, `/tournaments/${league}`)).body.data;
  // 14.3 and 14.5 both re-time this group, and 14.5 rolls it across three days.
  // Putting the slot count back first matters: 14.3 does not change it, but an
  // interrupted exploration can.
  await reconcileGroupTeamCount(league, 'KB 14 League', d.groups[0].id, 4);
  await reconcileSchedule(league, 'KB 14 League', {
    kind: 'group', entityId: d.groups[0].id,
    date: '2026-09-25T23:00:00.000Z', startTime: '10:00', duration: '10 min', gap: '0 min',
    firstUtc: '2026-09-26T09:00:00.000Z', stepMinutes: 10, pitchNumber: '',
  });
}

// --- 9. the padel fixtures --------------------------------------------------
// Padel pairs are generated by the format save, not added by name, so there is
// no teams/bulk step here. The names are the server's own.
const padelCup = ids.tournaments['KB 14 Padel Cup'];
await ensurePadelFormat(padelCup, 'KB 14 Padel Cup');
await reconcilePhases(padelCup, 'KB 14 Padel Cup', ['Group Phase', 'Knockout Phase']);

const padelOpen = ids.tournaments['KB 14 Padel Open'];
await ensurePadelFormat(padelOpen, 'KB 14 Padel Open');
await reconcilePhases(padelOpen, 'KB 14 Padel Open', ['Group Phase', 'Knockout Phase']);

for (const [id, label] of [[padelCup, 'KB 14 Padel Cup'], [padelOpen, 'KB 14 Padel Open']]) {
  const d = (await asUser(T, `/tournaments/${id}`)).body.data;
  // The generated padel schedule: four rounds at 10:00 / 10:20 / 10:40 / 11:00,
  // stepping by duration + padelRoundGapMinutes, with the two matches of each
  // round on courts 1 and 2.
  //
  // Reached by REGENERATING, not by a bulk update. A bulk update writes one
  // court number across every match it touches, so once a run has forced this
  // group onto court 1 no further update can put courts 1 and 2 back.
  const first = id === padelCup ? '2026-10-03T09:00:00.000Z' : '2026-10-10T09:00:00.000Z';
  const step = 20 * 60_000;
  const wantStamps = Array.from({ length: 4 }, (_, i) => new Date(Date.parse(first) + i * step).toISOString());
  const matches = await groupMatches(id, d.groups[0].id);
  const stamps = [...new Set(matches.map((m) => m.date))].sort();
  const courts = matches.map((m) => String(m.pitchNumber ?? ''));
  const ok = matches.length === 8
    && stamps.length === 4 && stamps.every((v, i) => v === wantStamps[i])
    && courts.filter((c) => c === '1').length === 4
    && courts.filter((c) => c === '2').length === 4;
  if (ok) {
    note('GET', `/tournaments/${id}`, 200,
      `${label}: four rounds already at 10:00 / 10:20 / 10:40 / 11:00 on two courts`);
  } else {
    await regeneratePadelSchedule(id, label);
  }
}

// --- 10. KB 14 Clash Cup - the football fixture 14.6 explains ---------------
const CLASH_TEAMS = ['KB 14 Hawks', 'KB 14 Owls', 'KB 14 Wolves', 'KB 14 Bears',
                     'KB 14 Foxes', 'KB 14 Otters', 'KB 14 Storks', 'KB 14 Herons'];

const clash = ids.tournaments['KB 14 Clash Cup'];
const clashState = await ensureTeams(clash, CLASH_TEAMS, 'KB 14 Clash Cup');
ids.clashTeams = Object.fromEntries(clashState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(clash, 'KB 14 Clash Cup',
  groupAndKnockout(CLASH_TEAMS.map((n) => ids.clashTeams[n])));
await reconcilePhases(clash, 'KB 14 Clash Cup', ['Group Phase', 'Knockout Phase']);

{
  const d = (await asUser(T, `/tournaments/${clash}`)).body.data;
  // Group A: every fixture on one kick-off time. This is what the Bulk Match
  // Updates dialog does to a football group when "Same start time per round" is
  // left ticked, which is its default - a football group has no rounds, so the
  // whole group counts as one round.
  await reconcileSchedule(clash, 'KB 14 Clash Cup Group A', {
    kind: 'group', entityId: d.groups[0].id,
    date: '2026-09-11T23:00:00.000Z', startTime: '10:00',
    sameStartTimePerRound: true, firstUtc: '2026-09-12T09:00:00.000Z', pitchNumber: '1',
  });
  // Group B: five slots, four teams. The empty spot pairs a real team against
  // nothing, and those fixtures render as Incomplete with one side reading
  // "Away Team". Regenerates the matches, so re-time afterwards.
  await reconcileGroupTeamCount(clash, 'KB 14 Clash Cup', d.groups[1].id, 5);
  await reconcileSchedule(clash, 'KB 14 Clash Cup Group B', {
    kind: 'group', entityId: d.groups[1].id,
    date: '2026-09-11T23:00:00.000Z', startTime: '12:00', duration: '10 min', gap: '0 min',
    firstUtc: '2026-09-12T11:00:00.000Z', stepMinutes: 10,
  });
}

// --- 11. KB 14 Padel Clash - the padel fixture 14.7 explains ----------------
const padelClash = ids.tournaments['KB 14 Padel Clash'];
await ensurePadelFormat(padelClash, 'KB 14 Padel Clash');
await reconcilePhases(padelClash, 'KB 14 Padel Clash', ['Group Phase', 'Knockout Phase']);

{
  const d = (await asUser(T, `/tournaments/${padelClash}`)).body.data;
  // Every match at one time AND on court 1. Two pairs cannot share a court, so
  // this is the padel clash - unlike KB 14 Padel Cup, where the matches that
  // share a time are on different courts and nothing is wrong.
  await reconcileSchedule(padelClash, 'KB 14 Padel Clash', {
    kind: 'group', entityId: d.groups[0].id,
    date: '2026-10-16T23:00:00.000Z', startTime: '10:00',
    sameStartTimePerRound: true, firstUtc: '2026-10-17T09:00:00.000Z', pitchNumber: '1',
  });
}

// --- 12. report -------------------------------------------------------------
const summary = {};
for (const [title, id] of Object.entries(ids.tournaments)) {
  const t = (await asUser(T, `/tournaments/${id}`)).body.data;
  const fixtures = [];
  for (const g of t.groups ?? []) {
    for (const m of await groupMatches(id, g.id)) {
      fixtures.push(`${g.name}/${m.name} ${m.date}${m.pitchNumber ? ` court/pitch ${m.pitchNumber}` : ''}`
        + `${m.homeTeam?.teamName && m.awayTeam?.teamName ? '' : '  <- one team only'}`);
    }
  }
  summary[title] = {
    id,
    gameType: t.gameType,
    format: t.format ?? t.padelFormat ?? null,
    teams: (t.teams ?? []).length,
    groups: (t.groups ?? []).map((g) => `${g.name} (${g.teamCount} slots, ${(g.teams ?? []).length} teams)`),
    phases: (t.phases ?? []).map((p) => p.name),
    fixtures,
  };
}

console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- Fixture state ---');
console.log(j(summary));

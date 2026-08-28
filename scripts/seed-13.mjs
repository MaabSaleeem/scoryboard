// Idempotent seed for collection 13 - "Tournaments - groups, brackets & phases".
//
//   node scripts/seed-13.mjs
//
// Safe to re-run. Every entity is looked up by its fixed name and only created
// when missing; strays are reconciled away. Nothing here uses a clock or a
// random value, so the fixtures a spec sees on Tuesday are the ones it saw on
// Monday.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script seeds ONLY kb-organiser-13@ and fixtures named "KB 13 ...".
// It never touches collection 12's kb-organiser@.
//
// Six tournaments, and why each one exists:
//
//   KB 13 Cup         Football, Group and Knockout, 8 teams, 2 groups of 4.
//                     Nothing played. The board every football article
//                     photographs, and 13.11's "not yet" phase banner.
//   KB 13 Summer Cup  The same shape, but every group match carries a score and
//                     the knockout has NOT been started. 13.5 needs a standings
//                     table with real numbers; 13.11 needs the phase controls in
//                     their enabled state. Kept apart from KB 13 Cup because a
//                     score changes the standings seven other articles show.
//   KB 13 League      Football, Round Robin, 4 teams. One phase, nothing
//                     played. 13.11's contrast: no phase tabs, no phase banner.
//   KB 13 Sunday      The same shape, played out. One phase with every match
//     League          scored is the cheapest way to reach "End Phase".
//   KB 13 Padel Cup   Padel, Swiss, 8 players. Nothing played.
//   KB 13 Padel Open  Padel, Swiss, 8 players, group matches scored. 13.6.
//
// The padel format save is a plain PUT /tournaments/:id carrying the padel
// fields - captured on the wire 2026-08-28, which collection 12 could not do.
// This seed therefore builds the padel fixtures without any hand work.

import { admin, asUser, mintSession, j } from '../lib/api.mjs';

const ORGANISER = 'kb-organiser-13@yopmail.com';

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

// --- 2. Pro membership and the Tournament Pro allowance ---------------------
let r = await admin(`/admins/change-user-membership/${me.id}`, {
  method: 'POST', body: { membership: 'Pro' },
});
note('POST', `/admins/change-user-membership/${me.id}`, r.status, 'membership=Pro');

// The grant is ADDITIVE, not a set, and there is no revoke. Creating a
// tournament spends a slot and deleting it does not give the slot back, so a
// "top up to N" rule would grant again on every run. Grant only when the
// allowance is exhausted.
const PRO_SLOTS = 6;
if ((me.freeTournamentProAllowanceRemaining ?? 0) === 0) {
  r = await admin('/admins/users/tournament-free-pro/grant', {
    method: 'POST', body: { email: ORGANISER, plan: 'Pro', quantity: PRO_SLOTS },
  });
  note('POST', '/admins/users/tournament-free-pro/grant', r.status,
    r.ok ? `total=${r.body.data.totalQuantity} remaining=${r.body.data.remainingQuantity}` : j(r.body));
} else {
  note('GET', '/users/me', 200,
    `Tournament Pro slots remaining ${me.freeTournamentProAllowanceRemaining} - no grant needed`);
}

// --- 3. venue ---------------------------------------------------------------
// The create modal's club picker calls GET /club-locations?tournamentSelectionOnly=true
// and only lists venues created with BOTH isTournament and
// saveForFutureTournaments true. The plain ?query= listing is disjoint from it.
const VENUE = { name: 'KB 13 Astro Park', location: 'Hackney, London' };

const selectable = ((await asUser(T, '/club-locations?tournamentSelectionOnly=true')).body.data ?? [])
  .filter((v) => v.name === VENUE.name);

if (selectable.length) {
  ids.venue = selectable[0].id;
  note('GET', '/club-locations', 200, `${VENUE.name} exists ${ids.venue}`);
  // A second copy would make the picker ambiguous in a capture.
  for (const dup of selectable.slice(1)) {
    const del = await asUser(T, `/club-locations/${dup.id}`, { method: 'DELETE' });
    note('DELETE', `/club-locations/${dup.id}`, del.status, `duplicate venue "${dup.name}"`);
  }
} else {
  res = await asUser(T, '/club-locations', {
    method: 'POST',
    body: { ...VENUE, saveForFutureTournaments: true, isTournament: true },
  });
  ids.venue = res.body.data.id;
  note('POST', '/club-locations', res.status, `${VENUE.name} = ${ids.venue}`);
}

// --- 4. tournaments ---------------------------------------------------------
const existing = (await asUser(T, '/tournaments')).body.data ?? [];

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
      clubLocationIds: [ids.venue],
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

// Padel needs three fields Football does not. Observed on the wire 2026-08-28.
const PADEL_CREATE = {
  gameType: 'Padel',
  playMode: 'Score',
  padelEnrollmentType: 'Doubles',
  isFriendlyTournament: false,
};

ids.tournaments = {};
ids.tournaments['KB 13 Cup'] = await ensureTournament('KB 13 Cup', '2026-09-19');
ids.tournaments['KB 13 Summer Cup'] = await ensureTournament('KB 13 Summer Cup', '2026-09-12');
ids.tournaments['KB 13 League'] = await ensureTournament('KB 13 League', '2026-09-26');
ids.tournaments['KB 13 Sunday League'] = await ensureTournament('KB 13 Sunday League', '2026-09-05');
ids.tournaments['KB 13 Padel Cup'] = await ensureTournament('KB 13 Padel Cup', '2026-10-03', PADEL_CREATE);
ids.tournaments['KB 13 Padel Open'] = await ensureTournament('KB 13 Padel Open', '2026-10-10', PADEL_CREATE);

// --- 5. helpers -------------------------------------------------------------
async function ensureTeams(tournamentId, names, label) {
  let state = (await asUser(T, `/tournaments/${tournamentId}`)).body.data;
  const missing = names.filter((n) => !state.teams.some((t) => t.name === n));
  if (missing.length) {
    const bulk = await asUser(T, `/tournaments/${tournamentId}/teams/bulk`, {
      method: 'POST', body: { teamNames: missing },
    });
    note('POST', `/tournaments/${tournamentId}/teams/bulk`, bulk.status, missing.join(', '));
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

/**
 * Save a padel format.
 *
 * Collection 12 could not do this: it drove the two-step Format screen by hand
 * and its seed could only check the result. The screen's save was captured on
 * the wire on 2026-08-28 and it is a plain PUT /tournaments/:id with the padel
 * fields - the same endpoint football uses. `teamIds` is empty on a first save;
 * the server generates the pairs from padelMinPlayers.
 */
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
  const state = (await asUser(T, `/tournaments/${id}`)).body.data;
  const drifted = Object.entries(PADEL_CONFIG).filter(([k, v]) => state[k] !== v);
  if (state.padelFormat && !drifted.length) {
    note('GET', `/tournaments/${id}`, 200,
      `${label} padel format already ${state.padelFormat}, ${state.teams.length} pairs`);
    return state;
  }
  // 13.10's spec changes a configuration value and confirms the reset, so the
  // values are put back here rather than only being created once.
  const put = await asUser(T, `/tournaments/${id}`, {
    method: 'PUT',
    body: { teamIds: state.teams.map((t) => t.id), teamCount: 4, isComplete: true, ...PADEL_CONFIG },
  });
  note('PUT', `/tournaments/${id}`, put.status,
    state.padelFormat
      ? `${label}: configuration reset (${drifted.map(([k]) => k).join(', ')})`
      : `${label}: Swiss, 8 players, 4 rounds, 4 courts`);
  return (await asUser(T, `/tournaments/${id}`)).body.data;
}

/**
 * Put a fixed score on every match of the group phase.
 *
 * A match will not take a score until it is Live or Finished, so each one goes
 * Live -> score -> Finished. Scores are keyed by the two team names and sorted
 * by name, never by array order, so the same pairing always gets the same
 * result however the fixture generator ordered it.
 */
async function scoreGroupPhase(id, label, resultFor) {
  const detail = (await asUser(T, `/tournaments/${id}`)).body.data;
  let scored = 0;
  let already = 0;
  for (const g of detail.groups ?? []) {
    const matches = (await asUser(T, `/tournaments/${id}/schedule/groups/${g.id}/matches`)).body.data ?? [];
    for (const m of matches) {
      const home = m.homeTeam?.teamName;
      const away = m.awayTeam?.teamName;
      if (!home || !away) continue;
      const { homeGoals, awayGoals } = resultFor(home, away);
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
 * A repeatable result for one pairing.
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
  // The hash is over the sorted names, so map the result back onto the real
  // home and away sides rather than assuming home is the alphabetical first.
  return home === a ? { homeGoals: x, awayGoals: y } : { homeGoals: y, awayGoals: x };
}

/**
 * Put each group's teams back in a known order.
 *
 * Teams on the format board carry a drag handle and dragging one persists, so a
 * spec that demonstrates reordering - or an interrupted exploration - changes
 * what every other article's capture of that board shows.
 *
 * `plan` is one list of team names per group, in board order.
 */
async function reconcileGroupTeams(id, label, plan) {
  const detail = (await asUser(T, `/tournaments/${id}`)).body.data;
  const byName = Object.fromEntries((detail.teams ?? []).map((t) => [t.name, t.id]));
  let changed = 0;
  for (const [i, group] of (detail.groups ?? []).entries()) {
    const want = plan[i];
    if (!want) continue;
    const current = (group.teams ?? []).map((t) => t.teamName ?? '');
    if (current.join('|') === want.join('|')) continue;
    const put = await asUser(T, `/tournament-groups/${group.id}`, {
      method: 'PUT',
      body: { teamIds: want.map((n) => byName[n]), applyToPhase: false },
    });
    note('PUT', `/tournament-groups/${group.id}`, put.status,
      `${label} ${group.name} order reset to ${want.join(', ')}`);
    changed += 1;
  }
  if (!changed) note('GET', `/tournaments/${id}`, 200, `${label}: group draws already correct`);
}

/**
 * The `source` object the slot menu sends when you pick "1st Group A".
 *
 * Captured on the wire 2026-08-28 from the football format board. `groupOrder`
 * is 1-based and follows the group's own order on the board.
 */
function groupRank(group, rank, index) {
  const ordinal = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' }[rank];
  return {
    type: 'GroupRank',
    label: `${ordinal} ${group.name}`,
    groupId: group.id,
    groupName: group.name,
    groupLabel: group.name,
    rank,
    phaseOrder: 0,
    groupOrder: index + 1,
    swapKey: `rank-${rank}`,
    swapCategory: 'group',
  };
}

/**
 * Put the first round of the bracket into a known state.
 *
 * `plan` is a list of [homeRankSpec, awayRankSpec] per first-round match, each
 * either null (leave the slot empty) or [groupIndex, rank]. A slot is cleared
 * by PATCHing an empty team id, which is how a re-run undoes whatever a spec
 * or an exploration left behind.
 *
 * PATCH /tournament-brackets/:bracketId/matches/:tournamentMatchId/participants
 * - observed on the wire 2026-08-28.
 */
async function reconcileBracketSlots(id, label, plan) {
  const detail = (await asUser(T, `/tournaments/${id}`)).body.data;
  const bracket = (detail.brackets ?? [])[0];
  if (!bracket) return;
  const groups = detail.groups ?? [];
  const firstRound = bracket.rounds?.[0]?.matchIds ?? [];

  let changed = 0;
  for (let i = 0; i < firstRound.length; i += 1) {
    const spec = plan[i] ?? [null, null];
    const match = bracket.matches.find((m) => m.tournamentMatchId === firstRound[i]);
    if (!match) continue;
    for (const [side, want] of [['home', spec[0]], ['away', spec[1]]]) {
      const current = match[`${side}Team`] ?? {};
      const wantLabel = want ? groupRank(groups[want[0]], want[1], want[0]).label : '';
      // Once the feeding group has been played the slot also carries the team
      // it resolved to, so a filled slot is compared on its source label only.
      // An empty slot must have neither.
      const settled = want
        ? current.sourceLabel === wantLabel
        : !current.sourceLabel && !current.teamId;
      if (settled) continue;
      const body = want
        ? { [`${side}Source`]: groupRank(groups[want[0]], want[1], want[0]) }
        : { [`${side}TeamId`]: '' };
      const patch = await asUser(
        T, `/tournament-brackets/${bracket.id}/matches/${match.tournamentMatchId}/participants`,
        { method: 'PATCH', body },
      );
      note('PATCH', `/tournament-brackets/${bracket.id}/matches/${match.tournamentMatchId}/participants`,
        patch.status, `${label} ${match.name} ${side} = ${wantLabel || '(empty)'}`);
      changed += 1;
    }
  }
  if (!changed) note('GET', `/tournaments/${id}`, 200, `${label}: bracket slots already correct`);
}

/**
 * Undo a next-phase start, so a tournament goes back to "the next phase has not
 * been started".
 *
 * 13.11's spec starts KB 13 Summer Cup's knockout phase and undoes it again. A
 * run that dies in between leaves the phase started, and the next run has
 * nothing to start. The undo is addressed to the phase the start was made FROM,
 * not to the phase that was started.
 */
async function reconcilePhaseStart(id, label, phaseName) {
  const phases = (await asUser(T, `/tournament-phases?tournamentId=${id}&includeCompletion=true`)).body.data ?? [];
  const target = phases.find((p) => p.name === phaseName);
  const previous = phases.find((p) => p.order === (target?.order ?? 0) - 1);
  if (!target?.started || !previous) {
    note('GET', '/tournament-phases', 200, `${label}: ${phaseName} not started - correct`);
    return;
  }
  const undo = await asUser(T, `/tournament-phases/${previous._id}/undo-next-phase-start`, {
    method: 'POST', body: {},
  });
  note('POST', `/tournament-phases/${previous._id}/undo-next-phase-start`, undo.status,
    `${label}: ${phaseName} was left started - undone`);
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

// --- 6. the football fixtures ----------------------------------------------
const CUP_TEAMS = ['KB 13 Reds', 'KB 13 Blues', 'KB 13 Greens', 'KB 13 Yellows',
                   'KB 13 Whites', 'KB 13 Blacks', 'KB 13 Purples', 'KB 13 Oranges'];
const SUMMER_TEAMS = ['KB 13 Hawks', 'KB 13 Owls', 'KB 13 Wolves', 'KB 13 Bears',
                      'KB 13 Foxes', 'KB 13 Otters', 'KB 13 Storks', 'KB 13 Herons'];
const LEAGUE_TEAMS = ['KB 13 Kestrels', 'KB 13 Falcons', 'KB 13 Ravens', 'KB 13 Swifts'];
const SUNDAY_TEAMS = ['KB 13 Robins', 'KB 13 Wrens', 'KB 13 Martins', 'KB 13 Finches'];

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

const cup = ids.tournaments['KB 13 Cup'];
let cupState = await ensureTeams(cup, CUP_TEAMS, 'KB 13 Cup');
ids.cupTeams = Object.fromEntries(cupState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(cup, 'KB 13 Cup',
  groupAndKnockout(CUP_TEAMS.map((n) => ids.cupTeams[n])));
await reconcilePhases(cup, 'KB 13 Cup', ['Group Phase', 'Knockout Phase']);
await reconcileGroupTeams(cup, 'KB 13 Cup', [CUP_TEAMS.slice(0, 4), CUP_TEAMS.slice(4)]);
// Every quarter-final slot empty. 13.7 and 13.9 photograph the "Add Team"
// state, and 13.9's spec fills one slot itself - a re-run must undo that.
await reconcileBracketSlots(cup, 'KB 13 Cup', [[null, null], [null, null], [null, null], [null, null]]);

const summer = ids.tournaments['KB 13 Summer Cup'];
let summerState = await ensureTeams(summer, SUMMER_TEAMS, 'KB 13 Summer Cup');
ids.summerTeams = Object.fromEntries(summerState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(summer, 'KB 13 Summer Cup',
  groupAndKnockout(SUMMER_TEAMS.map((n) => ids.summerTeams[n])));
await reconcilePhases(summer, 'KB 13 Summer Cup', ['Group Phase', 'Knockout Phase']);
// The quarter-finals are drawn from group positions, so the "Start Knockout
// Phase" preview in 13.11 has real assignments to show rather than an empty
// panel. Group index 0 is Group A, 1 is Group B.
await reconcileBracketSlots(summer, 'KB 13 Summer Cup', [
  [[0, 1], [1, 2]],
  [[1, 1], [0, 2]],
  [[0, 3], [1, 4]],
  [[1, 3], [0, 4]],
]);
await scoreGroupPhase(summer, 'KB 13 Summer Cup', fixedResult);
await reconcilePhaseStart(summer, 'KB 13 Summer Cup', 'Knockout Phase');

const league = ids.tournaments['KB 13 League'];
let leagueState = await ensureTeams(league, LEAGUE_TEAMS, 'KB 13 League');
ids.leagueTeams = Object.fromEntries(leagueState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(league, 'KB 13 League', {
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
await reconcilePhases(league, 'KB 13 League', ['Group Phase']);

// The same shape, but played out. "End Phase" only appears on a phase that has
// no phase after it and whose every match carries a score - `canEndPhase` on
// GET /tournament-phases. A one-phase tournament is the cheapest place to reach
// that state, and 13.11 needs it.
const sunday = ids.tournaments['KB 13 Sunday League'];
let sundayState = await ensureTeams(sunday, SUNDAY_TEAMS, 'KB 13 Sunday League');
ids.sundayTeams = Object.fromEntries(sundayState.teams.map((t) => [t.name, t.id]));
await ensureFootballFormat(sunday, 'KB 13 Sunday League', {
  teamCount: 4,
  teamSize: '5 VS 5',
  teamIds: SUNDAY_TEAMS.map((n) => ids.sundayTeams[n]),
  isComplete: true,
  format: 'RoundRobin',
  groupCount: 1,
  teamsPerGroup: 4,
  matchesPerTeam: 1,
  autoScheduleMatchesNextDay: true,
  status: 'Published',
});
await reconcilePhases(sunday, 'KB 13 Sunday League', ['Group Phase']);
await scoreGroupPhase(sunday, 'KB 13 Sunday League', fixedResult);

// --- 7. the padel fixtures --------------------------------------------------
// Padel pairs are generated by the format save, not added by name, so there is
// no teams/bulk step here. The names are the server's own.
const PADEL_PAIRS = ['Player 1 & Player 2', 'Player 3 & Player 4',
                     'Player 5 & Player 6', 'Player 7 & Player 8'];
const padelCup = ids.tournaments['KB 13 Padel Cup'];
await ensurePadelFormat(padelCup, 'KB 13 Padel Cup');
await reconcilePhases(padelCup, 'KB 13 Padel Cup', ['Group Phase', 'Knockout Phase']);
await reconcileGroupTeams(padelCup, 'KB 13 Padel Cup', [PADEL_PAIRS]);

const padelOpen = ids.tournaments['KB 13 Padel Open'];
await ensurePadelFormat(padelOpen, 'KB 13 Padel Open');
await reconcilePhases(padelOpen, 'KB 13 Padel Open', ['Group Phase', 'Knockout Phase']);
await scoreGroupPhase(padelOpen, 'KB 13 Padel Open', fixedResult);

// --- 8. report --------------------------------------------------------------
const summary = {};
for (const [title, id] of Object.entries(ids.tournaments)) {
  const t = (await asUser(T, `/tournaments/${id}`)).body.data;
  summary[title] = {
    id,
    gameType: t.gameType,
    format: t.format ?? t.padelFormat ?? null,
    teams: (t.teams ?? []).length,
    groups: (t.groups ?? []).map((g) => g.name),
    brackets: (t.brackets ?? []).map((b) => b.name),
    phases: (t.phases ?? []).map((p) => p.name),
  };
}

console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- Fixture state ---');
console.log(j(summary));

// The fixture states collection 14 depends on, in one place.
//
// Two readers, which is the whole point of the file existing:
//   - `scripts/seed-14.mjs` builds and reconciles them.
//   - the specs that CHANGE a schedule put it back with the same values.
//
// Collection 13's determinism note says it plainly: "A spec that mutates its
// fixture must put it back itself." 14.3, 14.4 and 14.5 all re-time a schedule
// that another article photographs, so each one restores it here rather than
// leaving the next seed run to notice.
//
// Plain .mjs so both the seed (bare node) and the specs (bundled by Playwright)
// can import it.

/**
 * KB 14 League's one group: six fixtures on 26 September 2026, 10:00 to 10:50,
 * ten minutes apart. 14.3 bulk-schedules it and 14.5 rolls it across three days.
 */
export const LEAGUE_SCHEDULE = {
  date: '2026-09-25T23:00:00.000Z',   // 26 Sep 2026, 00:00 in Europe/London (BST)
  startTime: '10:00',
  duration: '10 min',
  timeBetweenMatches: '0 min',
  timeZone: 'Europe/London',
  sameStartTimePerRound: false,
  pitchNumber: '',
  firstUtc: '2026-09-26T09:00:00.000Z',
  stepMinutes: 10,
  count: 6,
};

/**
 * KB 14 Cup's Group A, as the seed generates it: six fixtures on 19 Sep 2026,
 * 10:00 to 10:50 local, ten minutes apart.
 *
 * Added 2026-09-08. 14.5's "rolling onto the next day" moved here from KB 14
 * League, because the cutoff field that section is about only exists on a
 * Group & Knockout tournament - see briefs/14.md, 14.5. KB 14 Cup is ALSO 14.1's
 * and 14.8's fixture, so any spec that re-times it must put it back with
 * restoreGroupSchedule(..., CUP_GROUP_A_SCHEDULE) or those captures change.
 */
export const CUP_GROUP_A_SCHEDULE = {
  date: '2026-09-18T23:00:00.000Z',   // 19 Sep 2026, 00:00 in Europe/London (BST)
  startTime: '10:00',
  duration: '10 min',
  timeBetweenMatches: '0 min',
  timeZone: 'Europe/London',
  sameStartTimePerRound: false,
  pitchNumber: '',
  firstUtc: '2026-09-19T09:00:00.000Z',
  stepMinutes: 10,
  count: 6,
};

/**
 * The padel configuration both padel fixtures carry: Swiss, eight players in
 * four pairs, four rounds, four courts, ten minutes between rounds.
 */
export const PADEL_CONFIG = {
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

/** Restore one group's fixture times. The same call the bulk dialog sends. */
export async function restoreGroupSchedule(asUser, token, groupId, target = LEAGUE_SCHEDULE) {
  const { date, startTime, duration, timeBetweenMatches, timeZone, sameStartTimePerRound, pitchNumber } = target;
  return asUser(token, `/tournament-groups/${groupId}`, {
    method: 'PUT',
    body: {
      date, startTime, timeZone, duration, timeBetweenMatches, sameStartTimePerRound,
      ...(pitchNumber === undefined ? {} : { pitchNumber }),
    },
  });
}

/**
 * Rebuild a padel group's fixtures from the format.
 *
 * The court number on each match is assigned by the generator, and a bulk update
 * cannot put it back: a bulk update writes ONE court number across every match
 * it touches, so once a group has been forced onto court 1 nothing but a
 * regeneration restores "Round 1 - Court 1" on court 1 and "Round 1 - Court 2"
 * on court 2.
 *
 * Re-sending an identical configuration does NOT regenerate - verified on the
 * wire, 2026-08-28 - so the gap is nudged and put straight back. The gap is
 * used rather than the court count because it cannot affect court assignment.
 */
export async function regeneratePadelSchedule(asUser, token, tournamentId) {
  const save = async (config) => {
    const state = (await asUser(token, `/tournaments/${tournamentId}`)).body.data;
    return asUser(token, `/tournaments/${tournamentId}`, {
      method: 'PUT',
      body: { teamIds: state.teams.map((t) => t.id), teamCount: 4, isComplete: true, ...config },
    });
  };
  await save({ ...PADEL_CONFIG, padelRoundGapMinutes: PADEL_CONFIG.padelRoundGapMinutes + 1 });
  return save(PADEL_CONFIG);
}

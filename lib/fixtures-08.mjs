// The accounts and fixtures collection 08 runs on, in one place.
//
// `scripts/seed-08.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Collection 08 is "Leaderboards & leagues". A leaderboard is the container: it
// holds teams, it collects the matches tagged into it, and everything it shows -
// the league table, the player stats grid, the fixture list - is derived from
// matches that have been played inside it. An empty leaderboard photographs as
// five empty panels, so this collection's fixture is a small league that has
// actually run.
//
// Four accounts, all addressed to this collection (config/personas.yaml,
// account_isolation). Collection 08 never signs in to another collection's.
//
//   kb-manager-pro-08   Mo KB. PRO. The persona. Owns the four teams, the
//                       leaderboard and every match.
//   kb-08-admin         Ada KB. Free. Administrator on Mo's leaderboard. Only a
//                       Pro owner may add one, which is half of 08.2's roles
//                       section.
//   kb-08-free          Fern KB. FREE, and holding nothing but the leaderboard
//                       she was born with - so she is already at the Free limit
//                       of one. That is the Free half of 08.1.
//   kb-08-outsider      Ola KB. Free. Neither owner nor administrator. Shows
//                       what a visitor sees, and leaves the comment 08.5 needs.
//
// --- Why a second account rather than flipping Mo -----------------------
//
// 08.1 is flagged free_pro and docs/style-guide.md is explicit: a free_pro
// article gets TWO seeded accounts, one Free and one Pro, never one flipped
// between captures. Mo is Pro at rest and Fern is Free at rest. Neither spec
// changes a membership.
//
// --- Why the Free account can never create a leaderboard ------------------
//
// A new account is born with ONE leaderboard and TWO teams (config/api.md), and
// Free may own exactly one. So the limit is already reached the moment the
// account exists, and Fern needs no setup at all beyond being born - which is
// why her seed is three lines and why it must not add anything to her.
//
// --- Why Mo's leaderboard is renamed, not created -------------------------
//
// Mo is Pro, so he could create a second. He does not: 08.1 is the article that
// photographs creating one, and it creates and then deletes its own throwaway
// (THROWAWAY below). Keeping Mo at exactly one leaderboard at rest means the
// "Your Leaderboards (1)" heading every other spec walks past is stable, and it
// means 08.1's before-and-after is a real before and after.
//
// --- Why four played matches and one scheduled ---------------------------
//
// The league table is the subject of 08.4 and it is unreadable when every row
// agrees. Four matches between three teams give three rows with three different
// points totals, three different goal differences and no tie to break:
//
//     KB 08 United    P2  W2 D0 L0   5-1   +4   6 pts
//     KB 08 Rovers    P3  W1 D1 L1   4-5   -1   4 pts
//     KB 08 City      P3  W0 D1 L2   2-5   -3   1 pt
//
// The fifth match is in the future and stays Scheduled, so the Matches tab has
// something under Upcoming as well as under Past. It writes no statistics.
//
// A match that is not in a leaderboard writes no statistics at all (config/api.md,
// found by collection 11), so all five carry `leaderboardId`.
//
// --- Why a finished match is the most fragile thing here -----------------
//
// A played match cannot be undone: POST /matches/:id/status refuses anything
// once the match is Finished, and PUT and DELETE refuse a match whose date has
// passed. The seed never touches a match it did not have to create, and it
// verifies the table at the end. If a scoreline comes out wrong the only way
// back is `node scripts/seed-08.mjs --rebuild`, which deletes the accounts and
// starts from nothing. There is no smaller repair.

export const ACCOUNTS = {
  pro: 'kb-manager-pro-08@yopmail.com',
  admin: 'kb-08-admin@yopmail.com',
  free: 'kb-08-free@yopmail.com',
  outsider: 'kb-08-outsider@yopmail.com',
};

/**
 * What each account's own details are set to.
 *
 * PUT /users/:id is a full REPLACE, not a patch (config/api.md), so the seed
 * sends every field every time. `position` is the API's own enum, not the label
 * the settings page shows.
 */
export const PROFILES = {
  pro: {
    name: 'Mo',
    lastName: 'KB',
    gender: 'Male',
    dateOfBirth: '1988-02-19',
    sports: ['Football'],
    position: 'CentralMidfielder',
    isMarketingOpted: false,
    bio: 'I run the KB 08 Premier League and the four teams in it.',
  },
  admin: {
    name: 'Ada',
    lastName: 'KB',
    gender: 'Female',
    dateOfBirth: '1992-11-05',
    sports: ['Football'],
    position: 'CenterBack',
    isMarketingOpted: false,
    bio: 'I help Mo run the league.',
  },
  free: {
    name: 'Fern',
    lastName: 'KB',
    gender: 'Female',
    dateOfBirth: '1995-06-30',
    sports: ['Football'],
    position: 'Striker',
    isMarketingOpted: false,
    bio: 'Five-a-side on Wednesdays.',
  },
  outsider: {
    name: 'Ola',
    lastName: 'KB',
    gender: 'Prefer not to say',
    dateOfBirth: '1994-03-14',
    sports: ['Football'],
    position: 'Goalkeeper',
    isMarketingOpted: false,
    bio: 'I follow the Thursday league.',
  },
};

export const LEADERBOARD = 'KB 08 Premier League';

/**
 * The leaderboard 08.1 creates and then deletes again.
 *
 * Creating one is repeatable on Pro but it accumulates, and every other spec
 * walks past a heading that counts them. docs/style-guide.md: "a spec that
 * consumes or mutates a fixture puts it back itself". 08.1 deletes this in its
 * own teardown, and the seed prunes it if a crashed run left it behind.
 */
export const THROWAWAY = 'KB 08 Friday League';

export const TEAMS = {
  united: 'KB 08 United',
  rovers: 'KB 08 Rovers',
  city: 'KB 08 City',
  // Deliberately NOT in the leaderboard. 08.3 adds it, photographs the result,
  // removes it again and photographs that.
  athletic: 'KB 08 Athletic',
};

/** The three teams that are in the leaderboard at rest. */
export const TEAMS_IN_LEAGUE = ['united', 'rovers', 'city'];

/**
 * The two teams Mo is born with, renamed rather than a third and fourth being
 * created.
 *
 * Every new account gets `<First> K FC` and `<First> K FC Away`, and the names
 * gain a date suffix when they clash with a name already taken - hence the
 * optional group. The suffix changes on --rebuild, so the seed matches the
 * pattern first and the final name on every run after.
 */
export const BORN_TEAMS = {
  united: /^Mo K FC( \d+)?$/,
  athletic: /^Mo K FC Away( \d+)?$/,
};

export const MATCH_DEFAULTS = {
  duration: '60 min',
  teamSize: '5 VS 5',
  formation: '2-1-1',
  tag: 'league',
};

/**
 * The venue the upcoming fixture is played at.
 *
 * It exists for one reason: a match created with no `clubLocationId` comes back
 * **Incomplete**, not Scheduled, and the Matches tab then shows it with a
 * `Finish Setup` button instead of a fixture card. Attaching a venue turns it
 * Scheduled (proved on staging 2026-08-31 with PUT /matches/:id). 08.4
 * photographs that tab, and "why a match is stuck on Incomplete" is collection
 * 09's article, not this one.
 *
 * The four played matches were created without one and finished anyway, so they
 * are left as they are - a played match cannot be edited.
 */
export const VENUE = { name: 'KB 08 Astro', location: 'Salford, Manchester' };

/**
 * The team sheets. Everybody who is not one of the four accounts is a friend
 * record - POST /team-players with a `name` and no email.
 *
 * Five a side, formation 2-1-1, so each team fields exactly five. Mo is on
 * United's sheet because every team puts its owner on the roster, and he plays
 * for United.
 *
 * Mo is Pro, so neither the 14-friend limit nor the one-team-per-friend rule
 * applies - but each friend is still on one team only, because a name that
 * appears in two league rows makes the player stats grid harder to read, not
 * easier.
 *
 * Athletic gets three rather than five. Nothing photographs its sheet: it exists
 * to be added to the league and removed again.
 */
export const POSITIONS = ['Goalkeeper', 'CenterBack', 'CenterBack', 'CentralMidfielder', 'Striker'];

export const SQUADS = {
  united: {
    friends: ['Nia KB', 'Sol KB', 'Raj KB', 'Eve KB'],
    lineup: ['Eve KB', 'Raj KB', 'Mo KB', 'Sol KB', 'Nia KB'],
  },
  rovers: {
    friends: ['Bo KB', 'Cleo KB', 'Dara KB', 'Eli KB', 'Fay KB'],
    lineup: ['Eli KB', 'Fay KB', 'Dara KB', 'Cleo KB', 'Bo KB'],
  },
  city: {
    friends: ['Gus KB', 'Hana KB', 'Ike KB', 'Jo KB', 'Kit KB'],
    lineup: ['Jo KB', 'Kit KB', 'Ike KB', 'Gus KB', 'Hana KB'],
  },
  athletic: {
    friends: ['Lev KB', 'Mia KB', 'Noor KB'],
    lineup: ['Lev KB', 'Mia KB', 'Noor KB'],
  },
};

/**
 * The five matches, oldest first. The four past dates are fixed and distinct,
 * which is what the seed keys on to decide whether a match already exists -
 * counting would be wrong, because the three teams have played different numbers
 * of games.
 *
 * A match created with a date in the past starts itself a second or two after
 * POST /matches answers, so the seed polls for Live rather than sleeping. Posting
 * an event a moment early answers 400 "Match must be live or paused to add
 * events" and that goal is simply lost.
 *
 * `scheduled: true` means leave it alone: a future match stays Scheduled, writes
 * no statistics, and gives the Matches tab an Upcoming row.
 */
export const MATCHES = [
  {
    key: 'united-rovers',
    home: 'united',
    away: 'rovers',
    date: '2026-08-06T18:00:00.000Z',
    score: '3 - 1',
    events: [
      { type: 'GoalAwarded', side: 'home', player: 'Nia KB', assist: 'Mo KB' },
      { type: 'GoalAwarded', side: 'away', player: 'Bo KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Sol KB' },
      { type: 'YellowCard', side: 'away', player: 'Dara KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Nia KB' },
      { type: 'PlayerOfMatch', side: 'home', player: 'Nia KB' },
    ],
  },
  {
    key: 'united-city',
    home: 'united',
    away: 'city',
    date: '2026-08-13T18:00:00.000Z',
    score: '2 - 0',
    events: [
      { type: 'GoalAwarded', side: 'home', player: 'Nia KB', assist: 'Sol KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Sol KB', assist: 'Mo KB' },
      { type: 'YellowCard', side: 'away', player: 'Gus KB' },
      { type: 'PlayerOfMatch', side: 'home', player: 'Nia KB' },
    ],
  },
  {
    key: 'rovers-city',
    home: 'rovers',
    away: 'city',
    date: '2026-08-20T18:00:00.000Z',
    score: '2 - 2',
    events: [
      { type: 'GoalAwarded', side: 'home', player: 'Cleo KB' },
      { type: 'GoalAwarded', side: 'away', player: 'Hana KB', assist: 'Gus KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Bo KB', assist: 'Cleo KB' },
      { type: 'GoalAwarded', side: 'away', player: 'Ike KB' },
      { type: 'RedCard', side: 'away', player: 'Jo KB' },
      { type: 'PlayerOfMatch', side: 'away', player: 'Hana KB' },
    ],
  },
  {
    key: 'rovers-city-2',
    home: 'rovers',
    away: 'city',
    date: '2026-08-27T18:00:00.000Z',
    score: '1 - 0',
    events: [
      { type: 'GoalAwarded', side: 'home', player: 'Fay KB', assist: 'Eli KB' },
      { type: 'YellowCard', side: 'away', player: 'Kit KB' },
      { type: 'PlayerOfMatch', side: 'home', player: 'Fay KB' },
    ],
  },
  // Never played. Gives the Matches tab an Upcoming row.
  {
    key: 'upcoming',
    home: 'united',
    away: 'city',
    date: '2026-09-17T18:00:00.000Z',
    scheduled: true,
    events: [],
  },
];

/**
 * What the league table must read once the four past matches have finished.
 *
 * Field names are the API's own, read off GET /leaderboards/:id/stats/teams on
 * 2026-08-31. Two things it does NOT carry, which is why the fixture cannot
 * assert them: there is no draws column and no goals-conceded column. A drawn
 * match shows up only as the gap between totalMatches and wins + losses.
 *
 * The specs assert this, so a seed that half-ran fails in the spec rather than
 * in a screenshot.
 */
export const EXPECTED_TABLE = {
  'KB 08 United': {
    rank: 1, totalMatches: 2, totalWins: 2, totalLosses: 0, goalScored: 5, cleanSheets: 1,
  },
  'KB 08 Rovers': {
    rank: 2, totalMatches: 3, totalWins: 1, totalLosses: 1, goalScored: 4, cleanSheets: 1,
  },
  'KB 08 City': {
    rank: 3, totalMatches: 3, totalWins: 0, totalLosses: 2, goalScored: 2, cleanSheets: 0,
  },
};

/**
 * The player stats grid's top three rows, by rank. Shape from
 * GET /leaderboards/:id/stats/players.
 */
export const EXPECTED_TOP_SCORER = { playerName: 'Nia KB', goals: 3, rank: 1 };

/**
 * The comment thread 08.5 photographs, oldest first.
 *
 * The Administrator asks and the Owner answers, so the section shows a
 * conversation rather than a single line. `as` is the ACCOUNTS key that posts it.
 *
 * NOT the outsider, though a visitor asking a question would read better.
 * **Only leaderboard members can comment on or like leaderboard content** -
 * POST /comments as Ola answers 403 with exactly that message (found on staging
 * 2026-08-31). That gate is itself part of what 08.5 documents.
 *
 * Comment edit and delete do not exist in the API at all, so a comment posted by
 * mistake is permanent. The seed matches on the exact text before it posts
 * anything, and no spec ever submits the composer.
 */
export const COMMENTS = [
  { as: 'admin', text: 'Two teams have asked about joining in September. Room for them?' },
  { as: 'pro', text: 'Yes - two spaces open after the last Thursday fixture.', replyTo: 0 },
];

// The accounts and fixtures collection 11 runs on, in one place.
//
// `scripts/seed-11.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Collection 11 is "Match insights & statistics". Everything it photographs is
// derived data: match facts, a form guide, a head-to-head record, a team stats
// table, a player stats grid. None of it exists until matches have been played,
// so this collection's fixture is a small league that has actually run.
//
// Two accounts, both addressed to this collection (config/personas.yaml,
// account_isolation). Collection 11 never signs in to another collection's.
//
//   kb-player-11   the persona, Pia KB. Free. Every article is captured as her.
//   kb-11-owner    Otto KB. Free. Owns both teams and the leaderboard and runs
//                  the matches, so the persona has a team she does not own and a
//                  match history she did not create. A second actor inside this
//                  collection, not a shared persona.
//
// --- Why four matches, three teams, and one the persona sat out ----------
//
// Collection 02 seeded one finished match, which is enough for a profile that
// shows a number. It is not enough here:
//
//   * every insight on the Facts tab reads "in its last 5 games", so one game
//     makes every line say the same thing;
//   * "how statistics are calculated" (11.2) is unreadable when every ratio is
//     1/1 - wins, draws and losses have to be distinguishable;
//   * the Statistics so far panel puts the two teams side by side, and the only
//     way to show that each column is that team's WHOLE record rather than their
//     record against each other is for the two columns to disagree.
//
// So: three matches between Rovers and City on consecutive Thursdays - one lost,
// one drawn, one won - and a fourth against a third team, KB 11 Athletic, that
// Rovers won 4-0 and that Pia was not in the lineup for.
//
// That fourth match is doing four jobs at once:
//
//   1. Rovers have played 4 and City 3, so the two columns of Statistics so far
//      cannot be a head-to-head record. 11.1 says so and shows it.
//   2. Rovers' biggest win becomes 4-0 against a team that is not City, and it
//      still appears on the Rovers v City match page. Same proof, plainer.
//   3. Pia's own Matches stays at 3 while her team's reads 4, which is the
//      question 11.2 exists to answer.
//   4. A win to nil, to find out what actually counts as a clean sheet. The 0-0
//      draw above scored none.
//
// KB 11 Athletic is NOT a team this seed creates. Every new account is born with
// two teams, and Otto's first one is renamed rather than a third being made -
// see ATHLETIC_BORN below.
//
// --- Why a finished match is the most fragile thing here -----------------
//
// A match that has been played cannot be undone. Observed on staging and
// recorded in config/api.md:
//
//   * POST /matches/:id/status refuses anything once the match is Finished;
//   * PUT and DELETE refuse a match whose date has passed;
//   * a player's statistics survive the deletion of the team the match was
//     played for.
//
// And a match that is not in a leaderboard writes no statistics at all, so all
// three carry `leaderboardId`. The seed cannot repair a match it got wrong. If a
// scoreline below ever comes out different, the only way back is
// `node scripts/seed-11.mjs --rebuild`, which deletes both accounts and starts
// from nothing.

export const ACCOUNTS = {
  player: 'kb-player-11@yopmail.com',
  owner: 'kb-11-owner@yopmail.com',
};

/** What each account's own details are set to. PUT /users/:id is a full replace. */
export const PROFILES = {
  player: {
    name: 'Pia',
    lastName: 'KB',
    gender: 'Female',
    dateOfBirth: '1997-04-12',
    sports: ['Football'],
    // The API's own enum, not the label the settings page shows.
    position: 'Striker',
    isMarketingOpted: false,
    bio: 'Striker for KB 11 Rovers. Thursday five-a-side, and I read the stats afterwards.',
  },
  owner: {
    name: 'Otto',
    lastName: 'KB',
    gender: 'Male',
    dateOfBirth: '1990-09-03',
    sports: ['Football'],
    position: 'CentralMidfielder',
    isMarketingOpted: false,
    bio: 'I run the Thursday five-a-side and both teams in it.',
  },
};

export const TEAMS = {
  home: 'KB 11 Rovers',
  away: 'KB 11 City',
  third: 'KB 11 Athletic',
};

/**
 * The team KB 11 Athletic is made out of.
 *
 * A new account is born with two teams and one leaderboard, and on Free the
 * leaderboard limit is one - so the seed renames what Otto was given rather than
 * creating anything. The born names carry a date suffix only when they clash
 * with a name already taken, hence the optional group.
 *
 * The suffix changes on --rebuild, so the seed matches the pattern and then
 * matches the new name on every run after.
 */
export const ATHLETIC_BORN = /^Otto K FC( \d+)?$/;

export const LEADERBOARD = 'KB 11 Sunday League';

/**
 * The team sheets. Everybody who is not one of the two accounts is a friend
 * record with a name and no email - POST /team-players with `name` only.
 *
 * Five a side, formation 2-1-1, so each team fields exactly five. The positions
 * are the app's own ids, taken out of the bundle: the labels a reader sees are
 * not what the API takes.
 *
 * Otto is on the Rovers sheet because he owns both teams and every team puts its
 * owner on the roster. He plays for Rovers; City is fielded entirely by friends.
 */
export const POSITIONS = ['Goalkeeper', 'CenterBack', 'CenterBack', 'CentralMidfielder', 'Striker'];

export const SQUADS = {
  home: {
    friends: ['Nadia KB', 'Sam KB', 'Rory KB'],
    member: 'player', // Pia is invited by email and accepts
    lineup: ['Nadia KB', 'Sam KB', 'Otto KB', 'Rory KB', 'Pia KB'],
  },
  away: {
    friends: ['Bo KB', 'Cleo KB', 'Dara KB', 'Eli KB', 'Fay KB'],
    member: null,
    lineup: ['Eli KB', 'Fay KB', 'Dara KB', 'Cleo KB', 'Bo KB'],
  },
  // Athletic is Otto's born team, so Otto is already a member of it - and he is
  // in Rovers' lineup for the match they play, which is why he is not in this
  // one. It gets three friends of its own instead.
  //
  // Three, not five. A short lineup is accepted (POST /matches took a one-player
  // and even an empty lineup on staging), Otto is Free, and every friend on any
  // team counts against the same allowance of 14. Nothing photographs Athletic's
  // sheet - it appears only as a name in Rovers' biggest win.
  third: {
    friends: ['Gus KB', 'Hana KB', 'Ike KB'],
    member: null,
    lineup: ['Gus KB', 'Hana KB', 'Ike KB'],
  },
};

export const MATCH_DEFAULTS = {
  duration: '60 min',
  teamSize: '5 VS 5',
  formation: '2-1-1',
  tag: 'league',
};

/**
 * The four matches, oldest first. Dates are fixed and in the past, which is what
 * puts them under Past Matches and keeps them there. A match created with a past
 * date starts itself a second or two after POST /matches answers, so the seed
 * polls for Live rather than assuming it.
 *
 * `key` is how a spec names a match without carrying its id, and the date is
 * what the seed keys on to decide whether a match already exists - the four
 * dates are distinct.
 */
export const MATCHES = [
  {
    key: 'loss',
    home: 'home',
    away: 'away',
    date: '2026-08-06T18:00:00.000Z',
    score: '1 - 2',
    events: [
      { type: 'GoalAwarded', side: 'away', player: 'Bo KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Pia KB' },
      { type: 'YellowCard', side: 'home', player: 'Pia KB' },
      { type: 'GoalAwarded', side: 'away', player: 'Cleo KB', assist: 'Bo KB' },
      { type: 'PlayerOfMatch', side: 'away', player: 'Bo KB' },
    ],
  },
  {
    key: 'draw',
    home: 'home',
    away: 'away',
    date: '2026-08-13T18:00:00.000Z',
    score: '0 - 0',
    events: [
      { type: 'PlayerOfMatch', side: 'home', player: 'Nadia KB' },
    ],
  },
  {
    key: 'win',
    home: 'home',
    away: 'away',
    date: '2026-08-20T18:00:00.000Z',
    score: '3 - 1',
    events: [
      { type: 'GoalAwarded', side: 'home', player: 'Pia KB', assist: 'Otto KB' },
      { type: 'GoalAwarded', side: 'away', player: 'Dara KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Rory KB', assist: 'Pia KB' },
      { type: 'YellowCard', side: 'away', player: 'Cleo KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Pia KB' },
      { type: 'PlayerOfMatch', side: 'home', player: 'Pia KB' },
    ],
  },
  // The match Pia sat out. Rovers field four rather than five: she is simply not
  // in the lineup, which is the whole point of it.
  {
    key: 'nil',
    home: 'home',
    away: 'third',
    date: '2026-08-27T18:00:00.000Z',
    score: '4 - 0',
    lineups: { home: ['Nadia KB', 'Sam KB', 'Otto KB', 'Rory KB'] },
    events: [
      { type: 'GoalAwarded', side: 'home', player: 'Rory KB', assist: 'Sam KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Otto KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Rory KB' },
      { type: 'GoalAwarded', side: 'home', player: 'Sam KB', assist: 'Rory KB' },
      { type: 'PlayerOfMatch', side: 'home', player: 'Rory KB' },
    ],
  },
];

/**
 * What Pia's statistics must read once all four matches have finished. The specs
 * assert these, so a seed that half-ran fails in the spec rather than in a
 * screenshot.
 *
 * Three matches, not four: she was not in the lineup for the fourth.
 */
export const EXPECTED_PLAYER_STATS = {
  totalMatches: 3,
  wins: 1,
  losses: 1,
  draws: 1,
  goalsScored: 3,
  assists: 1,
  playerOfMatch: 1,
  yellowCards: 1,
  redCards: 0,
};

/**
 * What KB 11 Rovers' team statistics must read. Shape from GET /teams/:id/stats.
 *
 * `cleanSheets: 1` is the 4-0 win. The 0-0 draw scored none - observed on
 * staging on the first seeded run, with both teams reading 0 after it.
 */
export const EXPECTED_TEAM_STATS = {
  matches: 4,
  wins: 2,
  draws: 1,
  losses: 1,
  goals: 8,
  conceded: 3,
  cleanSheets: 1,
  winStreak: 2,
  yellowCards: 1,
  playerOfMatch: 3,
};

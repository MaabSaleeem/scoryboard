// Fixture data for collection 21 - "Referees".
//
// Read this with briefs/21.md. Everything the specs and scripts/seed-21.mjs
// share lives here: no name, id or date is written twice.
//
// --- What this collection is about ----------------------------------------
//
// A referee on Scoryboard is not a person who signs up as one. There is no
// referee sign-up, no referee route, and no way for an account to make itself a
// referee. `isReferee` is set by exactly one call in the whole product -
// `POST /tournaments/:id/referee` - so a tournament organiser is the only thing
// that can turn an account into a referee. config/api.md, "Referees".
//
// Once the flag is on, three surfaces appear and they are what this collection
// documents:
//
//   1. a blue Referee / Player switch on the player profile, plus a **Referee
//      Bio** field in Profile settings and a "Select your default profile"
//      control. `POST /tournaments/:id/referee` also sets
//      `defaultProfile: "Referee"`, so the profile OPENS on the referee side.
//   2. the profile's Upcoming and Past match lists, which in the referee role
//      are fed by `GET /referees/:playerId/matches?scheduleType=` instead of
//      the player endpoint. Those are the assigned matches.
//   3. the match page, where an assigned referee may start, pause and end the
//      match and may not score it.
//
// --- What is reconciled and what is rebuilt -------------------------------
//
// Reconciled: the three accounts, their memberships, the venue, the tournament
// and each referee row on it. A second run makes no writes to any of them.
//
// Rebuilt every run: both teams, the leaderboard and all three matches. A match
// cannot be un-started and cannot be un-finished, so the only way to have a
// Scheduled one, a Live one and a Finished one at the same time is to make
// three new ones. Team ids, leaderboard ids and match ids therefore change on
// every run. **No spec may hardcode any of them** - specs look entities up by
// name, and the seed prints every id.
//
// --- The clock ------------------------------------------------------------
//
// One absolute date, and it is the Scheduled match's: MATCH_DATE below. It is
// printed on screen, so it is a fixture and not a clock reading - and the seed
// REFUSES to run once it has passed, because a passed date makes the match
// start itself (config/api.md, "The match lifecycle").
//
// The Live match's kick-off is NOT fixed. A match is forced Live with
// `POST /matches/:id/status`, and the server stamps `startedAt` at that moment.
// The specs freeze the page clock at `startedAt + n minutes` read off the
// seeded match, the way collection 10 does, so the timer reads the same figure
// on every run without any date being hardcoded.

export const ACCOUNTS = {
  organiser: 'kb-21-organiser@yopmail.com',
  referee: 'kb-referee-21@yopmail.com',
  newref: 'kb-21-newref@yopmail.com',
};

export const PROFILES = {
  organiser: { name: 'Oona', membership: 'Pro' },
  referee: { name: 'Rae', membership: 'Free' },
  newref: { name: 'Nils', membership: 'Free' },
};

/** Display names as the app renders them, for masking and for assertions. */
export const FULL_NAMES = {
  organiser: 'Oona KB',
  referee: 'Rae KB',
  newref: 'Nils KB',
};

export const TEAMS = { home: 'KB 21 United', away: 'KB 21 Rovers' };
export const LEADERBOARD = 'KB 21 Sunday League';
export const VENUE = { name: 'KB 21 Astro', location: 'Hackney, London' };
export const TOURNAMENT = 'KB 21 Cup';

/**
 * The referee rows on the tournament.
 *
 * Two shapes, because the Add referee dialog offers both and they behave
 * differently for ever afterwards:
 *
 *   - a REGISTERED referee, added by email. The account already exists, so the
 *     call finds it and flips `isReferee` and `defaultProfile` on it. This is
 *     the only path that produces a referee a reader can be.
 *   - an UNREGISTERED referee, added by name alone. It creates a bare player
 *     record with `isReferee: true` and nobody can ever sign in to it.
 *
 * `canStartEndMatches` is the dialog's second toggle. See briefs/21.md, 21.3.
 */
export const REFEREES = [
  { key: 'referee', name: 'Rae', lastName: 'KB', saveForFutureTournaments: true, canStartEndMatches: true },
  { key: 'newref', name: 'Nils', lastName: 'KB', saveForFutureTournaments: true, canStartEndMatches: true },
  { name: 'Nadia Whistle', saveForFutureTournaments: false, canStartEndMatches: false },
];

/**
 * The squad on each team, in line-up order. All five on each side start.
 *
 * Every member is a name only, which creates a friend record as a side effect
 * (config/api.md, "Friends"). Oona is Pro, so there is no friend limit to hit.
 *
 * Neither referee is in either line-up. A referee must not be in a squad she
 * officiates, and on Free `ONE_FRIEND_PER_TEAM` refuses a registered player who
 * is on none of the caller's teams anyway - config/api.md.
 */
export const SQUAD = {
  home: [
    { name: 'Hal Dunn', position: 'Goalkeeper' },
    { name: 'Ida Frey', position: 'CenterBack-1' },
    { name: 'Jon Kerr', position: 'CenterBack-2' },
    { name: 'Kit Lowe', position: 'CentralMidfielder' },
    { name: 'Lena Nash', position: 'Striker' },
  ],
  away: [
    { name: 'Ada Cole', position: 'Goalkeeper' },
    { name: 'Bo Frost', position: 'CenterBack-1' },
    { name: 'Cal Mead', position: 'CenterBack-2' },
    { name: 'Dee Vale', position: 'CentralMidfielder' },
    { name: 'Eli Wren', position: 'Striker' },
  ],
};

/**
 * The one absolute date in this collection - the Scheduled match's kick-off.
 *
 * It is printed on the fixture card and in the profile's Upcoming list, so it
 * has to be a fixture rather than an offset. scripts/seed-21.mjs refuses to run
 * once it has passed: a match whose date has arrived starts itself, and 21.3's
 * whole first half needs a match that has NOT started.
 */
export const MATCH_DATE = '2026-12-05T19:00:00.000Z';

/** How the fixture card and the calendar print MATCH_DATE, in Europe/London. */
export const MATCH_DATE_SHOWN = { day: 'Sat, 5 Dec 2026', short: '05 Dec 2026', time: '19:00' };

/**
 * The Live match's kick-off, also fixed, and deliberately AFTER MATCH_DATE.
 *
 * Both matches sit in `scheduleType=Upcoming`, the profile's REFEREED MATCHES
 * panel renders only the nearest one, and the panel sorts by date. So the
 * Scheduled match has to be the earlier of the two or 21.2's first capture
 * photographs the Live one instead.
 *
 * A future date is no obstacle to being Live: `POST /matches/:id/status
 * {"status":"Live"}` on a Scheduled match is what START MATCH does and it works
 * whatever the date says (config/api.md, "A future match can be forced Live").
 * The timer counts from the server's `startedAt`, not from this.
 */
export const LIVE_DATE = '2026-12-06T19:00:00.000Z';

/** The month the calendar captures open on, and how the app writes it. */
export const CALENDAR_MONTH = { frozenAt: '2026-12-01T09:00:00.000Z', heading: 'December 01, 2026' };

export const MATCHES = {
  // Scheduled, in the future, refereed by Rae. 21.2's Upcoming row and every
  // 21.3 capture of a match that has not kicked off.
  upcoming: { duration: '60 min', teamSize: '5 VS 5', tag: 'league', date: MATCH_DATE },
  // Forced Live with POST /matches/:id/status. 21.3's timer pill and END MATCH.
  live: { duration: '60 min', teamSize: '5 VS 5', tag: 'league', date: LIVE_DATE },
  // Finished with events, so Rae's referee statistics and her Past list are not
  // empty. Dated 90 seconds back and polled for Live before any event is
  // written - see scripts/seed-21.mjs.
  played: {
    duration: '60 min', teamSize: '5 VS 5', tag: 'league',
    events: [
      { type: 'GoalAwarded', side: 'home', scorer: 'Lena Nash', assist: 'Kit Lowe' },
      { type: 'GoalAwarded', side: 'away', scorer: 'Dee Vale' },
      { type: 'GoalAwarded', side: 'home', scorer: 'Kit Lowe' },
      { type: 'YellowCard', side: 'away', scorer: 'Bo Frost' },
      { type: 'RedCard', side: 'away', scorer: 'Ada Cole' },
      { type: 'PlayerOfMatch', side: 'home', scorer: 'Lena Nash' },
    ],
  },
};

/** The score the `played` match ends on, asserted by the seed and by 21.2. */
export const PLAYED_SCORE = { home: 2, away: 1 };

/**
 * Rae's referee bio. 21.1 captures the field empty, then filled, so the spec
 * clears it and writes it back itself.
 */
export const REFEREE_BIO =
  'FA Level 1. Ten seasons of Sunday league. I keep the game moving and explain every decision.';

/** The Referee Bio field's own limits, from the app schema. */
export const BIO_LIMIT = { chars: 150, lines: 5 };

/** How many minutes past kick-off the Live captures freeze the clock at. */
export const LIVE_FREEZE_MINUTES = 12;

/** What the timer pill reads at that instant, on a 60-minute match. */
export const LIVE_TIMER_SHOWN = '48:00';

/**
 * The stat tiles the profile draws in the Referee role, in the order it draws
 * them, and what each one is fed.
 *
 * TOTAL FOULS is always 0 for every referee on the platform. The profile reads
 * `totalFouls` off `GET /referees/:playerId/stats` and that endpoint does not
 * answer the field - it returns `totalMatches`, `totalGoals`, `totalAssists`,
 * `totalRedCards`, `totalYellowCards` and `totalPlayerOfTheMatch` and nothing
 * else. Measured on staging 2026-09-03; briefs/21.md, "Open questions".
 *
 * MATCHES is the only tile that ever moves for a referee. The card and goal
 * tiles are the referee's OWN player figures, and a referee is not in the
 * line-up she officiates, so they stay at zero unless she also plays.
 */
export const REFEREE_STAT_TILES = [
  'MATCHES', 'RED CARD', 'YELLOW CARD', 'TOTAL FOULS', 'NO. OF LEAGUES', 'AVERAGE RATING',
];

/** Anything named by this collection, for masking sweeps. */
export const OURS = /KB 21|Oona KB|Rae KB|Nils KB|Nadia Whistle/;

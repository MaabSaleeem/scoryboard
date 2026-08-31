// The accounts and fixtures collection 09 runs on, in one place.
//
// `scripts/seed-09.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Collection 09 is "Creating & scheduling matches" - everything up to the moment
// the whistle goes. Match day itself is collection 10.
//
// --- The one thing to understand before reading further -------------------
//
// **Creating a match is not one action.** "Create Match" fires
// `POST /matches {"status":"Incomplete"}` on the click and lands you on
// `/matches/:id`, a page headed **Match Settings** that is already a real match
// row. You then fill the details in and save. Nothing is asked first, nothing is
// confirmed, and a reader who closes the tab at that point has left a half-built
// match behind. That is why article 09.2 exists.
//
// A match leaves Incomplete only when **seven** things are all present
// (isolated on staging 2026-08-31, one field dropped at a time):
//
//   homeTeam, awayTeam, leaderboardId, clubLocationId, date, duration, teamSize
//
// `tag` is not one of them - it defaults to `friendly`. Nor are the line-ups: a
// match with two empty `players[]` arrays still goes Scheduled.
//
// --- What cannot be undone -----------------------------------------------
//
// - **A venue cannot be removed** once set. `PUT {clubLocationId: null}` and
//   `{clubLocationId: ""}` are both refused, and so is `{leaderboardId: null}`.
//   So a Scheduled match can never be pushed back to Incomplete, which is why
//   every spec that completes a match builds its own throwaway rather than
//   touching a shared one.
// - **`DELETE /matches/:id` does not delete.** It answers "Match cancelled
//   successfully" and sets `status: "Cancelled"`. The row stays, and stays
//   readable by id - it simply stops appearing in the calendar, the team's match
//   lists and the leaderboard's. Cancelled rows therefore accumulate on the
//   account for ever and are invisible in every screen, which is what makes them
//   a safe way for a spec to clean up after itself.
//
// --- Four accounts, all addressed to this collection ---------------------
//
// config/personas.yaml, account_isolation. Collection 09 never signs in to
// another collection's account.
//
//   kb-manager-pro-09   Mo KB. PRO. The persona. Owns both teams, the
//                       leaderboard, both venues and every match.
//   kb-09-admin         Ada KB. Free. **Administrator** on KB 09 United. Only a
//                       Pro owner may add one. Half of the `role` articles.
//   kb-09-player        Pip KB. Free. Plain **Player** on KB 09 United. The
//                       other half: what somebody who is on the team but does
//                       not run it sees.
//   kb-referee-09       Rae KB. Free. The referee on the fixture match.
//
// --- Why the referee is assigned over the API, not through the app -------
//
// Found on staging 2026-08-31, and it decides what 09.6 can say. The match
// **Referee** field is a search box, and it searches
// `GET /team-players/search?searchType=referee&tournamentSelectionOnly=true`.
// That parameter narrows the results to referees YOU have saved, and the only
// call that saves one is `POST /tournaments/:id/referee` with
// `saveForFutureTournaments: true` - a tournament call. A football manager with
// no tournament therefore sees "No results found" whatever they type, for ever.
//
// `PUT /matches/:id {refereePlayerId}` accepts any playerId, so the seed can put
// Rae on the match and 09.6 can photograph the result. What 09.6 must NOT do is
// photograph a reader picking her out of that list, because no reader can.
// See briefs/09.md, open question 1.

export const ACCOUNTS = {
  pro: 'kb-manager-pro-09@yopmail.com',
  admin: 'kb-09-admin@yopmail.com',
  player: 'kb-09-player@yopmail.com',
  referee: 'kb-referee-09@yopmail.com',
};

/**
 * What each account's own details are set to.
 *
 * `PUT /users/:id` is a full REPLACE, not a patch (config/api.md), so the seed
 * sends every field every time. `position` is the API's own enum, not the label
 * the settings page shows.
 *
 * `isTourCompleted` is in here on purpose. A new account meets a guided tour the
 * first time it opens a match page - a tooltip with Skip Tour and Next that
 * floats over the tabs and would sit in the middle of half these captures. The
 * tour is article 10.1's subject, not this collection's. Skipping it in the app
 * fires `PUT /users/:id {"isTourCompleted": true}` and, because that call is a
 * full replace, clears the account's bio as a side effect - so the seed sends
 * the flag together with the whole profile instead.
 */
export const PROFILES = {
  pro: {
    name: 'Mo', lastName: 'KB', gender: 'Male', dateOfBirth: '1988-02-19',
    sports: ['Football'], position: 'CentralMidfielder', isMarketingOpted: false,
    isTourCompleted: true,
    bio: 'I run KB 09 United and the KB 09 Sunday League.',
  },
  admin: {
    name: 'Ada', lastName: 'KB', gender: 'Female', dateOfBirth: '1992-11-05',
    sports: ['Football'], position: 'CenterBack', isMarketingOpted: false,
    isTourCompleted: true,
    bio: 'I help Mo run KB 09 United.',
  },
  player: {
    name: 'Pip', lastName: 'KB', gender: 'Prefer not to say', dateOfBirth: '1996-07-22',
    sports: ['Football'], position: 'Striker', isMarketingOpted: false,
    isTourCompleted: true,
    bio: 'I play for KB 09 United.',
  },
  referee: {
    name: 'Rae', lastName: 'KB', gender: 'Female', dateOfBirth: '1990-04-12',
    sports: ['Football'], position: 'CentralMidfielder', isMarketingOpted: false,
    isTourCompleted: true,
    bio: 'I referee in the KB 09 Sunday League.',
  },
};

export const LEADERBOARD = 'KB 09 Sunday League';

export const TEAMS = {
  united: 'KB 09 United',
  rovers: 'KB 09 Rovers',
};

/**
 * The two teams Mo is born with, renamed rather than created.
 *
 * Every new account gets "<First> K FC" and "<First> K FC Away", and the names
 * gain a date suffix when they clash with a name already taken - hence the
 * optional group. The suffix changes on --rebuild, so the seed matches the
 * pattern first and the final name on every run after.
 */
export const BORN_TEAMS = {
  united: /^Mo K FC( \d+)?$/,
  rovers: /^Mo K FC Away( \d+)?$/,
};

/**
 * Two venues, so the Location Club picker has a list rather than one row, and so
 * 09.3 can move a match from one to the other.
 *
 * Created WITHOUT `isTournament` / `saveForFutureTournaments`, which is what puts
 * them in the `?query=` listing the match form searches. A venue created with
 * those flags is only visible to the tournament wizard, and the two listings are
 * disjoint (config/api.md).
 */
export const VENUES = {
  astro: { name: 'KB 09 Astro', location: 'Salford, Manchester' },
  park: { name: 'KB 09 Park', location: 'Didsbury, Manchester' },
};

export const MATCH_DEFAULTS = {
  duration: '60 min',
  teamSize: '5 VS 5',
  formation: '2-1-1',
};

/**
 * The line-up positions, in the order the squads below list their players.
 *
 * The app's own enum, not the labels the profile form shows: Goalkeeper,
 * CenterBack, LeftBack, RightBack, CentralMidfielder, LeftMidfielder,
 * RightMidfielder, AttackingMidfielder, LeftWinger, RightWinger, Striker, and
 * Substitute-1 to Substitute-5.
 */
export const POSITIONS = ['Goalkeeper', 'CenterBack', 'CenterBack', 'CentralMidfielder', 'Striker'];

/**
 * The team sheets.
 *
 * `accounts` are members added by their email address, so they are real people
 * with a role. `friends` are name-only rows - `POST /team-players` with a `name`
 * and no email, which creates a friend record as a side effect.
 *
 * Ada is an Administrator, which only a Pro owner may add: on Free the same call
 * answers 400 TEAM_ADMIN_LIMIT_EXCEEDED. Mo is Pro, so it lands.
 *
 * Five a side, formation 2-1-1, so each team fields exactly five.
 */
export const SQUADS = {
  united: {
    accounts: [
      { key: 'admin', role: 'Administrator' },
      { key: 'player', role: 'Player' },
    ],
    friends: ['Nia KB', 'Sol KB', 'Raj KB', 'Eve KB'],
    lineup: ['Eve KB', 'Raj KB', 'Sol KB', 'Nia KB', 'Mo KB'],
  },
  rovers: {
    accounts: [],
    friends: ['Bo KB', 'Cleo KB', 'Dara KB', 'Eli KB', 'Fay KB'],
    lineup: ['Eli KB', 'Fay KB', 'Dara KB', 'Cleo KB', 'Bo KB'],
  },
};

/**
 * The clock every collection-09 spec freezes to.
 *
 * 1 September, not today, and for one reason: /schedule opens on whatever month
 * the browser thinks it is, and the fixture below is on 24 September. A clock
 * frozen in August opens the calendar on an empty month and every calendar
 * capture would have to page forward first.
 */
export const FROZEN_NOW = '2026-09-01T09:00:00.000Z';

/**
 * The two matches that exist at rest. Both Scheduled, both in the future.
 *
 * No spec mutates either of them. Every article that changes something -
 * completing an Incomplete match, editing a fixture, cancelling one - builds its
 * own throwaway with `POST /matches` and cancels it in a `finally`. That is not
 * tidiness: a venue cannot be unset and a leaderboard cannot be unset, so a
 * mutation to a shared fixture is permanent, and the next run would photograph a
 * different match from the one the article describes.
 *
 * `pitchNumber`, `note` and `refereePlayerId` are on the first one only, so the
 * second shows what the same card looks like without them.
 */
export const MATCHES = [
  {
    key: 'fixture',
    home: 'united',
    away: 'rovers',
    date: '2026-09-24T18:00:00.000Z',
    venue: 'astro',
    duration: '60 min',
    teamSize: '5 VS 5',
    tag: 'league',
    pitchNumber: '3',
    note: 'Meet at the clubhouse 20 minutes before kick-off. Bring both kits.',
    referee: true,
  },
  {
    key: 'second',
    home: 'united',
    away: 'rovers',
    date: '2026-09-30T18:30:00.000Z',
    venue: 'park',
    duration: '90 min',
    teamSize: '5 VS 5',
    tag: 'friendly',
  },
];

/**
 * The Game type options the form offers, in order, plus the `tag` value each one
 * stores.
 *
 * The API's own enum is wider than the form. Read off its validation error on
 * 2026-08-31:
 *
 *   friendly | league | cup | tournament | pre season | casualBooking | party |
 *   camp | onlineBooking | blockBooking | bubbleFootball | leagueFixture |
 *   function | transferMarket
 *
 * The form offers seven of the fourteen. `tournament` is set by the tournament
 * fixture generator, and the other six have no control anywhere in the web app -
 * they are there for the partner booking integrations (config/api.md, "Partner
 * bookings").
 *
 * All seven the form offers WORK. That was worth checking, because the mapping is
 * not a simple lower-case: "Pre Season" stores `pre season` with a space while
 * "Casual Booking" stores `casualBooking` in camel case. Sending the lower-cased
 * label by hand - `casual booking` - is refused with 400
 * SCHEMA_VALIDATION_ERROR, so an API-only probe reads like an app bug. Driving
 * the dropdown in the browser and reading the stored value back proved it is not:
 * the app has an explicit label-to-value map and gets all seven right.
 */
export const GAME_TYPES = [
  { label: 'Friendly', tag: 'friendly' },
  { label: 'League', tag: 'league' },
  { label: 'Cup', tag: 'cup' },
  { label: 'Pre Season', tag: 'pre season' },
  { label: 'Casual Booking', tag: 'casualBooking' },
  { label: 'Bubble Football', tag: 'bubbleFootball' },
  { label: 'League Fixture', tag: 'leagueFixture' },
];

/** The team-size options the form offers, in order. */
export const TEAM_SIZES = ['5 VS 5', '6 VS 6', '7 VS 7', '8 VS 8', '9 VS 9', '10 VS 10', '11 VS 11'];

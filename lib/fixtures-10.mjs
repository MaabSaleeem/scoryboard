// The accounts and fixtures collection 10 runs on, in one place.
//
// `scripts/seed-10.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Collection 10 is "Match day" - the whistle, the timer, the goals, the cards,
// the final score. Everything up to kick-off is collection 09.
//
// --- The five things that shape this collection --------------------------
//
// All five were isolated on staging on 2026-09-01 and are recorded in
// config/api.md.
//
// **1. A match plays itself forward and never backwards.** A Finished match is
// permanent: `POST /matches/:id/status` answers "Cannot update status of a
// Finished match", `PUT` answers "Cannot update match of a Finished match", and
// there is no undo anywhere in the app. So the finished fixture below is built
// ONCE and photographed for ever, and every spec that starts, pauses, scores or
// ends a match builds its own throwaway first.
//
// **2. A match starts itself when its date passes, and finishes itself when its
// date plus its duration passes.** A match posted with a date five minutes ago
// is `Live` within about two seconds and stays Live. A match posted with a date
// twelve days ago is Live for a moment and then **Finished** - the first seed run
// here wrote one goal into one and lost every event after it. So "a past date"
// is not enough: the date has to be inside the match's own duration.
//
// **3. A future match can be forced Live.** `POST /matches/:id/status
// {"status":"Live"}` on a Scheduled match answers 200 and it stays Live - that
// is what the **START MATCH** button does. It is also how a spec gets a Live
// match whose kick-off time it chose.
//
// **4. A Live match cannot be edited.** `PUT /matches/:id` with any
// configuration field answers 403, "Cannot update match configuration fields
// when match is Live". Date, venue, duration, line-up: all of it locks at
// kick-off. Article 10.3 says so.
//
// **5. Events are only accepted while the match is Live or Paused.** Anything
// else answers "Match must be live or paused to add events". A seed that posts
// events immediately after `POST /matches` loses them, permanently, because the
// match cannot be reopened. Poll for `status === "Live"` first.
//
// --- How a spec disposes of a throwaway ----------------------------------
//
// `DELETE /matches/:id` refuses a match whose date has passed - "Date must be at
// least one hour ahead of the current time" - so it cannot clean up a throwaway
// that was born Live. `PUT /matches/:id {"status":"Cancelled"}` **can**, and it
// works on a match that is Live, Paused **or Finished**: 200, and the row stops
// appearing in every list.
//
// That last part was got wrong first time round here, on the strength of point 1
// above. A Finished match refuses to be reopened or rewritten; it does not refuse
// to be cancelled, because `status` is not one of the configuration fields the
// 403 guards. So **nothing this collection creates accumulates** - every spec
// disposes of its throwaway with DELETE first and that PUT as the fallback, in a
// `finally`, whatever state the match ended up in.
//
// --- Where the throwaways live -------------------------------------------
//
// A match cannot leave `Incomplete` without a `leaderboardId`, so even a
// throwaway has to be in a leaderboard - and a match that finishes inside a
// leaderboard writes statistics into its table. If the throwaways went into
// KB 10 Sunday League, the league table and both teams' Past Matches would read
// differently on every run.
//
// So there are TWO leaderboards. `KB 10 Sunday League` holds the two fixtures and
// nothing else, and is the one every capture shows. `KB 10 Scratch` holds every
// throwaway a spec creates. No article photographs it.
//
// --- Four accounts, all addressed to this collection ---------------------
//
// config/personas.yaml, account_isolation. Collection 10 never signs in to
// another collection's account.
//
//   kb-manager-pro-10   Mo KB. PRO. The persona. Owns both teams, both
//                       leaderboards, the venue and every match.
//   kb-10-admin         Ada KB. FREE. **Administrator** on KB 10 United. Two
//                       jobs: the `role` half of five articles, and the FREE
//                       half of the two `free_pro` ones - the substitute limit
//                       and the match-feed media limit are both keyed off the
//                       SIGNED-IN user's membership, not the team owner's.
//   kb-10-player        Pip KB. FREE. Plain **Player** on KB 10 United. What
//                       somebody who is on the team but does not run it sees.
//   kb-referee-10       Rae KB. FREE. The referee on the finished fixture.
//
// A `free_pro` article gets two seeded accounts, one Free and one Pro, never one
// account flipped between captures (docs/style-guide.md). Mo is Pro at rest and
// Ada is Free at rest. Nothing in this collection calls
// `change-user-membership` outside the seed.

export const ACCOUNTS = {
  pro: 'kb-manager-pro-10@yopmail.com',
  admin: 'kb-10-admin@yopmail.com',
  player: 'kb-10-player@yopmail.com',
  referee: 'kb-referee-10@yopmail.com',
};

/**
 * What each account's own details are set to.
 *
 * `PUT /users/:id` is a full REPLACE, not a patch (config/api.md), so the seed
 * sends every field every time.
 *
 * `isTourCompleted: true` on all four. A new account meets a guided tour the
 * first time it opens a match page, and it floats over the tab strip - it would
 * sit in the middle of most of these captures. Article 10.1 documents the tour
 * and reaches it through the header's **Show Tour** button instead, which is
 * repeatable; the automatic first-run tour is not, because it can only ever
 * happen once per account.
 */
export const PROFILES = {
  pro: {
    name: 'Mo', lastName: 'KB', gender: 'Male', dateOfBirth: '1988-02-19',
    sports: ['Football'], position: 'CentralMidfielder', isMarketingOpted: false,
    isTourCompleted: true,
    bio: 'I run KB 10 United and the KB 10 Sunday League.',
  },
  admin: {
    name: 'Ada', lastName: 'KB', gender: 'Female', dateOfBirth: '1992-11-05',
    sports: ['Football'], position: 'CenterBack', isMarketingOpted: false,
    isTourCompleted: true,
    bio: 'I help Mo run KB 10 United on match day.',
  },
  player: {
    name: 'Pip', lastName: 'KB', gender: 'Prefer not to say', dateOfBirth: '1996-07-22',
    sports: ['Football'], position: 'Striker', isMarketingOpted: false,
    isTourCompleted: true,
    bio: 'I play for KB 10 United.',
  },
  referee: {
    name: 'Rae', lastName: 'KB', gender: 'Female', dateOfBirth: '1990-04-12',
    sports: ['Football'], position: 'CentralMidfielder', isMarketingOpted: false,
    isTourCompleted: true,
    bio: 'I referee in the KB 10 Sunday League.',
  },
};

/** The league every photographed match belongs to. */
export const LEADERBOARD = 'KB 10 Sunday League';

/**
 * Where every throwaway match goes.
 *
 * A match needs a leaderboard before it can leave Incomplete, and a match that
 * finishes inside one writes into its table. Keeping the throwaways here is what
 * stops a re-run from changing KB 10 Sunday League's table, which the FACTS panel
 * on the Scheduled fixture reads out and 10.1 photographs. Mo is Pro, so he may
 * own more than one leaderboard; on Free the second `POST /leaderboards` answers
 * LEADERBOARD_CREATION_LIMIT_EXCEEDED.
 *
 * **Named like a real league on purpose.** It was "KB 10 Scratch" until the first
 * full run, and then it turned up in the detail strip of eight published
 * screenshots - 10.3, 10.5, 10.6, 10.7, 10.8, 10.9 and 10.10 all photograph a
 * throwaway, and every one of them shows its leaderboard's name. A reader should
 * see a second league a manager might plausibly run, not the scaffolding this
 * collection is built on.
 */
export const SCRATCH_LEADERBOARD = 'KB 10 Midweek';

export const TEAMS = {
  united: 'KB 10 United',
  rovers: 'KB 10 Rovers',
};

/**
 * The two teams Mo is born with, renamed rather than created.
 *
 * Every new account gets "<First> K FC" and "<First> K FC Away", and the names
 * gain a date suffix when they clash with a name already taken - hence the
 * optional group.
 */
export const BORN_TEAMS = {
  united: /^Mo K FC( \d+)?$/,
  rovers: /^Mo K FC Away( \d+)?$/,
};

export const VENUE = { name: 'KB 10 Astro', location: 'Salford, Manchester' };

export const MATCH_DEFAULTS = {
  duration: '60 min',
  teamSize: '5 VS 5',
  formation: '2-1-1',
};

/**
 * The line-up positions, in the order the squads below list their starters.
 *
 * Five starters for a 2-1-1 in a 5 VS 5, and the two centre-backs are
 * **suffixed**: `CenterBack-1` and `CenterBack-2`.
 *
 * That suffix is the whole point of this comment. `config/api.md` lists the
 * plain enum and notes in passing that the app also sends a suffixed variant.
 * It is not a variant - it is a slot key. A line-up that puts two players on
 * plain `CenterBack` is accepted by the API and stored intact, and then the
 * pitch draws **one empty + slot for each centre-back and neither player**:
 * the board keys its slots by position, both players hash to the same key, and
 * both are dropped. Seen on staging 2026-09-01 with the first build of this
 * fixture, where three of the five starters appeared and two vanished.
 *
 * So: any position a formation uses more than once has to carry its index.
 */
export const POSITIONS = ['Goalkeeper', 'CenterBack-1', 'CenterBack-2', 'CentralMidfielder', 'Striker'];

/**
 * The team sheets.
 *
 * `accounts` are members added by their email address - real people with a role.
 * `friends` are name-only rows: `POST /team-players` with a `name` and no email,
 * which creates a friend record as a side effect.
 *
 * United carries NINE members against five starting places. That is deliberate:
 * article 10.2 photographs the substitutes' bench, and the Free substitute limit
 * only shows itself on SUB-4, so there must be enough spare players to fill
 * SUB-1 to SUB-3 and still have somebody left to try SUB-4 with.
 *
 * Ada is an Administrator, which only a Pro owner may add: on Free the same call
 * answers 400 TEAM_ADMIN_LIMIT_EXCEEDED. Mo is Pro, so it lands.
 */
export const SQUADS = {
  united: {
    accounts: [
      { key: 'admin', role: 'Administrator' },
      { key: 'player', role: 'Player' },
    ],
    friends: ['Nia KB', 'Sol KB', 'Raj KB', 'Eve KB', 'Ida KB', 'Tam KB', 'Wren KB'],
    lineup: ['Eve KB', 'Raj KB', 'Sol KB', 'Nia KB', 'Mo KB'],
  },
  rovers: {
    accounts: [],
    friends: ['Bo KB', 'Cleo KB', 'Dara KB', 'Eli KB', 'Fay KB'],
    lineup: ['Eli KB', 'Fay KB', 'Dara KB', 'Cleo KB', 'Bo KB'],
  },
};

/**
 * The two matches that exist at rest.
 *
 * `scheduled` is in the FUTURE and stays Scheduled. It is what 10.1, 10.2 and
 * 10.3 photograph before the whistle. Its date is FIXED, and it therefore goes
 * stale: once 15 October 2026 has passed the same POST would build a match that
 * starts itself. `scripts/seed-10.mjs` refuses to run in that case and names the
 * date to move.
 *
 * `played` is Finished, with goals, cards, a Player of the Match and two lines of
 * commentary on its feed. It is the "after" state for 10.5 to 10.8, and it is
 * permanent - nothing can edit or reopen it, which is exactly why it is safe to
 * photograph for ever.
 *
 * **`played` has no fixed date, and cannot have one.** To write events into a
 * match it has to be Live, and a match is Live only between its date and its date
 * plus its duration. A fixed date months in the past is Live for about a second
 * and then finishes itself with the events half written - which is how the first
 * run of this seed lost six of seven. So the seed dates it
 * `PLAYED_MINUTES_AGO` minutes before whatever moment it runs, and every spec
 * reads the date back off the fixture rather than assuming one.
 *
 * No spec mutates either match.
 */
export const PLAYED_MINUTES_AGO = 5;

export const MATCHES = {
  scheduled: {
    key: 'scheduled',
    home: 'united',
    away: 'rovers',
    date: '2026-10-15T18:00:00.000Z',
    duration: '60 min',
    teamSize: '5 VS 5',
    tag: 'league',
    pitchNumber: '3',
    note: 'Meet at the clubhouse 20 minutes before kick-off. Bring both kits.',
  },
  played: {
    key: 'played',
    home: 'united',
    away: 'rovers',
    duration: '60 min',
    teamSize: '5 VS 5',
    tag: 'league',
    referee: true,
    note: 'Great win, everyone. Same time next week.',
  },
};

/**
 * How far after the played fixture's kick-off the specs freeze the browser clock.
 *
 * There is no single fixed `FROZEN_NOW` in this collection, and there cannot be
 * one: the played fixture's date is whatever moment the seed ran, so a hardcoded
 * clock would drift relative to it on every rebuild and the feed would start
 * reading "in 4 hours". `frozenNow` in `fixtures10()` derives it instead -
 * `played.date + 3h` - which is stable for as long as the fixture is, and puts
 * the finished match's feed a readable "3 hours ago" behind the reader.
 *
 * The countdown on the Scheduled fixture is measured from the same instant, so it
 * reads the same on every run too.
 */
export const FROZEN_AFTER_PLAYED_HOURS = 3;

/**
 * Where the clock goes for a capture of a Live match: `startedAt` plus this.
 *
 * Article 10.4 is about the match timer, and a timer is the one thing on these
 * screens that is different every single second. `startedAt` comes back on the
 * match, so a spec that freezes the browser to `startedAt + 12 minutes` gets a
 * timer reading 12:00 every run without waiting for anything.
 */
export const LIVE_TIMER_MINUTES = 12;

/**
 * What the seed writes onto the `played` match while it is Live, in order.
 *
 * Read the final score off this list rather than hardcoding it: three goals to
 * United, one to Rovers, so the card reads 3 - 1 and the feed has something in
 * both columns.
 *
 * `teamType` is `HomeTeam` or `AwayTeam`; `home` and `away` are refused
 * (config/api.md). Every goal names a scorer, and one names an assist as well,
 * so 10.5 can show what an assisted goal looks like on the feed.
 */
export const PLAYED_EVENTS = [
  { type: 'GoalAwarded', side: 'home', player: 'Mo KB', assist: 'Nia KB' },
  { type: 'GoalAwarded', side: 'away', player: 'Bo KB' },
  { type: 'YellowCard', side: 'away', player: 'Dara KB' },
  { type: 'GoalAwarded', side: 'home', player: 'Sol KB' },
  { type: 'RedCard', side: 'away', player: 'Cleo KB' },
  { type: 'GoalAwarded', side: 'home', player: 'Mo KB' },
  { type: 'PlayerOfMatch', side: 'home', player: 'Mo KB' },
];

/** The score PLAYED_EVENTS adds up to, asserted by the seed and by the specs. */
export const PLAYED_SCORE = { home: 3, away: 1 };

/**
 * The two lines of commentary on the finished match's feed.
 *
 * Fixed text and fixed minutes - no clock, no random data. The commentary event
 * takes `minute` and `description` and no `type` (config/api.md); the seed
 * confirms what the API actually stores.
 */
export const PLAYED_COMMENTARY = [
  { minute: 12, description: 'Mo KB opens the scoring from the edge of the area.' },
  { minute: 58, description: 'Full time at KB 10 Astro. A comfortable win for United.' },
];

// The accounts and fixtures collection 02 runs on, in one place.
//
// `scripts/seed-02.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Three accounts, all addressed to this collection (config/personas.yaml,
// account_isolation). Collection 02 never signs in to another collection's.
//
//   kb-player-02   the persona, Pia KB. Free. Every article but the Pro half of
//                  02.8 is captured as her.
//   kb-02-owner    Otto KB. Free. Owns the two teams and runs the match, so the
//                  persona has a team she does not own and a match history. A
//                  second actor inside this collection, not a shared persona.
//   kb-02-pro      Pru KB. Pro. 02.8 needs the same screen in both membership
//                  states, and the Free half is the persona herself.
//   kb-02-padel    Perry KB. Free, and the only account here that plays PADEL.
//                  Added 2026-09-08 for 8sept-updates.md A10 and A12: the padel
//                  profile is a different layout, not a variant of this one, and
//                  02.6, 02.7 and 02.8 all describe it wrongly without it. It
//                  plays no match and joins no team - the layout is the subject,
//                  and an empty padel profile is what a padel reader has on the
//                  day they sign up.
//
// --- Why two accounts for 02.8 rather than one flipped -------------------
//
// config/personas.yaml captures collection 04's and 18's Free/Pro pairs by
// flipping ONE account between the two shots. That works there because the pair
// is the same person seeing two versions of their own screen.
//
// Compare is not that screen. It only appears while you are looking at SOMEBODY
// ELSE's profile - the button is hidden on your own - so the pair is always two
// people, and the second person has to have statistics of their own or the
// comparison table is a column of zeroes. Pru therefore plays in the match too,
// on the other side, and the two halves of 02.8 are the two personas looking at
// each other.
//
// --- Why a finished match is the most fragile thing here -----------------
//
// A match that has been played cannot be undone. Observed on staging,
// 2026-08-28:
//
//   * POST /matches/:id/status refuses anything once the match is Finished
//     ("Cannot update status of a Finished match");
//   * PUT and DELETE refuse a match whose date has passed ("Date must be at
//     least one hour ahead of the current time");
//   * a player's statistics survive the deletion of the team the match was
//     played for - wins, goals and Player of the Match stay on the player.
//
// So the seed cannot repair a match it got wrong, and neither can you. If the
// scoreline below ever comes out different, the only way back is to delete the
// three accounts with DELETE /admins/user-delete/:id and re-run this seed from
// nothing. `node scripts/seed-02.mjs --rebuild` does exactly that.

export const ACCOUNTS = {
  player: 'kb-player-02@yopmail.com',
  owner: 'kb-02-owner@yopmail.com',
  pro: 'kb-02-pro@yopmail.com',
  padel: 'kb-02-padel@yopmail.com',
};

/** What each account's own details are set to. PUT /users/:id is a full replace. */
export const PROFILES = {
  player: {
    name: 'Pia',
    lastName: 'KB',
    gender: 'Female',
    dateOfBirth: '1997-04-12',
    sports: ['Football'],
    position: 'Striker',
    isMarketingOpted: false,
    bio: 'Striker for KB 02 Rovers. Five-a-side on Thursdays, and I keep the score.',
  },
  owner: {
    name: 'Otto',
    lastName: 'KB',
    gender: 'Male',
    dateOfBirth: '1990-09-03',
    sports: ['Football'],
    // The API's enum, not the label the settings page shows. "Central
    // Midfielder" is refused; "CentralMidfielder" is what it stores.
    position: 'CentralMidfielder',
    isMarketingOpted: false,
    bio: 'I run the Thursday five-a-side and both teams in it.',
  },
  pro: {
    name: 'Pru',
    lastName: 'KB',
    gender: 'Female',
    dateOfBirth: '1994-01-25',
    sports: ['Football'],
    position: 'Striker',
    isMarketingOpted: false,
    bio: 'Striker for KB 02 City.',
  },
};

/**
 * The padel account's own details. A different shape from PROFILES above, which
 * is the point: a padel account has no `position` at all.
 *
 * Every field name here was read off the wire or out of the app's own bundle on
 * 2026-09-08, because four of them are not in config/api.md:
 *
 *   bestHand        "Left Handed" | "Right Handed"      (Best hand *)
 *   courtPositions  "Left side" | "Both sides" | "Right side"   (Court position)
 *   matchType       "Competitive" | "Friendly" | "Both"  (Match type)
 *   preferredTime   "Morning" | "Afternoon" | "Evening"  (Preferred time)
 *
 * `courtPositions` is PLURAL and takes a single string. Six singular guesses -
 * courtPosition, padelCourtPosition, courtSide, padelPosition, side,
 * preferredSide - are all accepted with a 200 and silently dropped, so this is
 * the one field here that cannot be found by trying. The ids are the labels.
 *
 * `defaultProfile: 'Padel'` is what makes the profile OPEN on the padel side.
 * Without it the account still gets the Football/Padel switch but lands on
 * Football, and 02.6's point - that a football reader can land on a layout they
 * have never seen - is not reproduced.
 */
export const PADEL_PROFILE = {
  name: 'Perry',
  lastName: 'KB',
  gender: 'Prefer not to say',
  dateOfBirth: '1995-05-05',
  sports: ['Padel'],
  defaultProfile: 'Padel',
  bestHand: 'Right Handed',
  courtPositions: 'Both sides',
  matchType: 'Both',
  preferredTime: 'Evening',
  isMarketingOpted: false,
  bio: 'Padel four times a week. Right-handed, happy either side of the court.',
  padelBio: 'Padel four times a week. Right-handed, happy either side of the court.',
};

/** The images 02.5 documents. See scripts/make-assets-02.mjs for how they are made. */
export const IMAGES = {
  avatarPng: 'assets/02/pia-avatar.png',
  avatarWebp: 'assets/02/pia-avatar.webp',
  bannerPng: 'assets/02/pia-banner.png',
  bannerWebp: 'assets/02/pia-banner.webp',
};

export const TEAMS = {
  home: 'KB 02 Rovers',
  away: 'KB 02 City',
};

/**
 * The team sheets. Everybody who is not one of the three accounts is a friend
 * record with a name and no email - POST /team-players with `name` only.
 *
 * Five a side, formation 2-1-1, so each team fields exactly five: the positions
 * below are in formation order. The position values are the app's own ids, taken
 * out of the bundle - "Goalkeeper", "CenterBack", "CentralMidfielder",
 * "Striker". The labels a reader sees ("Centerback") are not what the API takes.
 *
 * Otto is on the Rovers sheet because he is the account that owns both teams and
 * every team puts its owner on the roster. He plays; the alternative is a
 * substitute nobody sees.
 */
export const POSITIONS = ['Goalkeeper', 'CenterBack', 'CenterBack', 'CentralMidfielder', 'Striker'];

export const SQUADS = {
  home: {
    friends: ['Nadia KB', 'Sam KB', 'Rory KB'],
    member: 'player', // Pia is invited by email and accepts
    lineup: ['Nadia KB', 'Sam KB', 'Rory KB', 'Otto KB', 'Pia KB'],
  },
  away: {
    friends: ['Bo KB', 'Cleo KB', 'Dara KB', 'Eli KB'],
    member: 'pro', // Pru is invited by email and accepts
    lineup: ['Bo KB', 'Cleo KB', 'Dara KB', 'Eli KB', 'Pru KB'],
  },
};

/**
 * The one match. KB 02 Rovers 2 - 1 KB 02 City, in Otto's leaderboard.
 *
 * The date is fixed and in the past, which is what puts it under Past Matches
 * and keeps it there. It also means the match auto-starts a moment after it is
 * created: the seed polls for that rather than assuming it.
 */
export const MATCH = {
  date: '2026-08-20T18:00:00.000Z',
  duration: '60 min',
  teamSize: '5 VS 5',
  formation: '2-1-1',
  tag: 'league',
  events: [
    { type: 'GoalAwarded', side: 'home', player: 'Pia KB', assist: 'Otto KB' },
    { type: 'GoalAwarded', side: 'home', player: 'Pia KB' },
    { type: 'GoalAwarded', side: 'away', player: 'Pru KB' },
    { type: 'YellowCard', side: 'away', player: 'Cleo KB' },
    { type: 'PlayerOfMatch', side: 'home', player: 'Pia KB' },
  ],
};

/**
 * What Pia's statistics must read once the match has finished. The specs assert
 * these, so a seed that half-ran fails in the spec rather than in a screenshot.
 */
export const EXPECTED_PLAYER_STATS = {
  totalMatches: 1,
  wins: 1,
  losses: 0,
  draws: 0,
  goalsScored: 2,
  playerOfMatch: 1,
};

/** Who follows whom, so the counters on the profile header are not all zero. */
export const FOLLOWS = {
  playerFollowsPlayer: 'pro', // Pia follows Pru
  playerFollowsTeam: 'away', // Pia follows KB 02 City
  proFollowsPlayer: 'player', // Pru follows Pia, so Pia has a follower
};

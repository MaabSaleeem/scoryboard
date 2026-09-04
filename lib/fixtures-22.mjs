// Fixture data for collection 22 - "Venues & club locations".
//
// Read this with briefs/22.md. Everything the specs and scripts/seed-22.mjs
// share lives here: no name, id or date is written twice.
//
// --- What this collection is about ----------------------------------------
//
// Two articles about the places matches are played at:
//
//   22.1  the venues you keep on your account - adding one from Profile
//         settings or from a match form, finding one when you set up a match,
//         editing it, giving it a logo, removing it
//   22.2  the venues that belong to a tournament - added while creating the
//         tournament or from its settings, kept for reuse with "Save for
//         future tournaments", and who may add and edit them
//
// --- The venue model, as measured on staging 2026-09-04 -------------------
//
// A venue is `{name, location, isTournament, saveForFutureTournaments,
// avatarVersion?}` and it belongs to the account that created it. Four lists
// read it and they are disjoint by flag:
//
//   GET /club-locations                          mine, isTournament false
//   GET /club-locations?query=<3+ chars>         the same, plus the ownerless
//                                                partner venues (Powerleague)
//   GET /club-locations?tournamentSelectionOnly  mine, isTournament AND saved
//   GET /club-locations?tournamentId=<id>        the venues on that tournament
//
// A venue with isTournament true and saved false is a TOURNAMENT-ONLY venue:
// it appears in the last list and nowhere else. Profile settings shows the
// union of the first and third lists, badging the third "Saved".
//
// Only the creator may PUT or DELETE a venue - anybody else gets
// 403 "Club location can only be modified by its creator" - and that holds
// inside a tournament too: the Owner cannot edit an Admin's venue, nor the
// other way round. That is 22.2's role capture.
//
// --- Two accounts ---------------------------------------------------------
//
// Mo is the reader (persona manager_pro, Pro). Ana is a second actor: the
// Admin of Mo's tournament, who adds one venue to it. Ana holds no venues of
// her own, so her Profile settings shows the empty state.
//
// --- What is reconciled and what is rebuilt -------------------------------
//
// Reconciled: both accounts, their memberships and profiles, Mo's three saved
// venues, the tournament, Ana's admin row, and the two tournament-only venues.
// A second run makes no writes to any of them.
//
// Swept: any venue on either account that is not in this file, and any
// tournament of Mo's that is not KB 22 Cup, is deleted. 22.1 photographs the
// Locations list and the match form's venue list, both of which show every
// venue the account holds, so a stray one changes the capture.
//
// Nothing is rebuilt. 22.1 creates SCRATCH_VENUE itself and removes it again
// in the same spec; 22.2 fills forms it then closes.
//
// --- The clock ------------------------------------------------------------
//
// One absolute date, the tournament's start. It is printed on the tournament
// settings page 22.2 photographs (Start date), so it is a fixture, not a clock
// reading. The seed REFUSES to run once it has passed: a tournament whose
// start date has arrived changes state on its own (collections 13 and 15).

export const ACCOUNTS = {
  owner: 'kb-manager-pro-22@yopmail.com',
  admin: 'kb-22-admin@yopmail.com',
};

export const PROFILES = {
  owner: { name: 'Mo', membership: 'Pro' },
  admin: { name: 'Ana', membership: 'Free' },
};

/** Display names as the app renders them, for masking and for assertions. */
export const FULL_NAMES = {
  owner: 'Mo KB',
  admin: 'Ana KB',
};

/**
 * The profile fields `PUT /users/:userId` insists on. It is a full REPLACE, so
 * every call sends all of them (config/api.md, "Users"). Both accounts are
 * admin-created and were born with these empty; without them Profile settings
 * prints "3 highlighted fields are still missing" above the form.
 */
export const PROFILE_FIELDS = {
  gender: 'Male',
  dateOfBirth: '1988-06-02',
  sports: ['Football'],
  position: 'Goalkeeper',
};

/**
 * Mo's ordinary venues. `isTournament: false`. They appear in Profile settings,
 * in the match form's Location Club list, and in `?query=` searches. Neither
 * has a logo - the logo flow in 22.1 runs on SCRATCH_VENUE so nothing
 * persistent changes.
 */
export const VENUES = {
  astro: { name: 'KB 22 Astro', location: 'Hackney Marshes, London' },
  park: { name: 'KB 22 Park', location: 'Victoria Park, London' },
};

/**
 * Mo's saved tournament venue: isTournament true, saveForFutureTournaments
 * true. It is what the Create Tournament picker lists, it carries the pink
 * "Saved" badge in Profile settings and on the tournament's settings page, and
 * KB 22 Cup was created on it.
 */
export const SAVED_VENUE = {
  name: 'KB 22 Cup Ground',
  location: 'Mile End Stadium, London',
  isTournament: true,
  saveForFutureTournaments: true,
};

/**
 * The tournament-only venues on KB 22 Cup: isTournament true, saved false,
 * created with `tournamentId` so they attach on creation. One is Mo's (the
 * Owner's), one is Ana's (the Admin's). Neither appears in anybody's Profile
 * settings or Create Tournament picker - only on this tournament.
 */
export const ONE_OFF_VENUES = {
  owner: { name: 'KB 22 Overflow Pitch', location: 'Wick Road, London' },
  admin: { name: 'KB 22 Admin Pitch', location: 'Bow Common Lane, London' },
};

/** The venue 22.1 adds, gives a logo, edits and removes. Never left behind. */
export const SCRATCH_VENUE = {
  name: 'KB 22 Scratch Pitch',
  location: 'Deptford Park, London',
  /** What the edit step renames the location to. */
  editedLocation: 'Deptford Park, Evelyn Street, London',
};

/** The logo 22.1 uploads to SCRATCH_VENUE. Drawn by scripts/make-assets-22.mjs. */
export const LOGO_ASSET = 'assets/22/scratch-pitch-logo.png';

/**
 * Mo's tournament. Created on SAVED_VENUE. The start date is fixed and in the
 * future - see "The clock" above. `timeZone` is what the browser would send
 * from Europe/London, pinned here because the app reads it from the browser
 * (config/api.md, "Tournaments").
 */
export const TOURNAMENT = {
  title: 'KB 22 Cup',
  gameType: 'Football',
  startDate: '2026-12-19',
  startTime: '10:00',
  duration: '10 min',
  isAutoStartEnable: false,
  timeZone: 'Europe/London',
};

/** How the tournament settings page prints TOURNAMENT.startDate. */
export const TOURNAMENT_DATE_SHOWN = '19-12-2026';

/** What the app prints when a venue may not be edited by the signed-in account. */
export const CREATOR_ONLY_MESSAGE = 'Club location can only be modified by its creator';

/**
 * The partner venues every account can find by typing three letters or more
 * into a venue search. Ownerless rows imported from Powerleague
 * (`source: "Powerleague"`); nobody can edit them. 22.1 names them in prose
 * and does not photograph them - the list is the partner's and can change.
 */
export const PARTNER_SOURCE = 'Powerleague';

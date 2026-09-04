// Fixture data for collection 24 - "Troubleshooting & policies".
//
// Read this with briefs/24.md. Everything the specs and scripts/seed-24.mjs
// share lives here: no name, id or date is written twice.
//
// --- What this collection is about ----------------------------------------
//
// Four articles about the screens a reader hits when something is refused or
// missing, and about the rules that sit behind them:
//
//   24.1  the permission screens - Access Denied on a team's settings, the
//         DUMMY TEAM page, a disabled Delete Team, and Match Preview (View Only)
//   24.2  the upload limits - what the page promises, what the browser refuses,
//         and what the server refuses
//   24.3  Page not found, the Not Found screens, and the error boundary
//   24.4  the profanity mask, the Terms and Privacy links, and the data held
//
// Nothing here is a flow the reader performs on purpose, so the fixtures are
// about putting Marc, the reader, in the WRONG place: on a team he does not
// run, on a match he does not manage, on a settings page he may not open.
//
// --- Two accounts ---------------------------------------------------------
//
// Marc is the reader (persona manager_free, Free). Owen owns everything Marc
// bumps into. Owen is Pro for one reason: on Free `POST /team-players` refuses
// `role: "Administrator"` outright (TEAM_ADMIN_LIMIT_EXCEEDED, config/api.md),
// and 24.1 needs Marc to BE an Administrator somewhere so the disabled Delete
// Team button can be photographed.
//
// --- What is reconciled and what is rebuilt -------------------------------
//
// Reconciled: both accounts, their memberships and profiles, Owen's four teams
// and their squads, Marc's Administrator row, the venue and the match. A second
// run makes no writes to any of them.
//
// Rebuilt every run: Marc's COMMENTS_TEAM. A comment cannot be deleted - the
// API answers 401 "Unauthorized to delete this comment" to its own author
// (config/api.md, "Comments and likes") - and 24.4 posts one through the UI to
// photograph the mask. The only way to clear it is to delete the team it hangs
// off, so the team is deleted and remade on every run and its id changes.
// **No spec may hardcode it** - the spec looks it up by name.
//
// --- The clock ------------------------------------------------------------
//
// One absolute date, the match's: MATCH_DATE below. It is printed on the match
// page 24.1 photographs, so it is a fixture, not a clock reading. The seed
// REFUSES to run once it has passed: a match whose date has arrived starts
// itself (config/api.md, "The match lifecycle"), and the article says the
// reader is looking at a match that has not been played.

export const ACCOUNTS = {
  reader: 'kb-manager-free-24@yopmail.com',
  owner: 'kb-24-owner@yopmail.com',
};

export const PROFILES = {
  reader: { name: 'Marc', membership: 'Free' },
  owner: { name: 'Owen', membership: 'Pro' },
};

/** Display names as the app renders them, for masking and for assertions. */
export const FULL_NAMES = {
  reader: 'Marc KB',
  owner: 'Owen KB',
};

/**
 * The profile fields `PUT /users/:userId` insists on. It is a full REPLACE, so
 * every call sends all of them (config/api.md, "Users"). Both accounts are
 * admin-created and were born with these empty.
 */
export const PROFILE_FIELDS = {
  gender: 'Male',
  dateOfBirth: '1990-04-17',
  sports: ['Football'],
  position: 'Striker',
};

/**
 * Owen's teams.
 *
 *   united  Marc is its Administrator. 24.1 photographs its Edit Team page with
 *           the Delete Team button disabled - the one thing an Administrator
 *           cannot do there.
 *   dummy   Created with isPrivate: true, which the Add Team dialog labels
 *           "Create a Dummy team". Anybody but its owner gets the DUMMY TEAM
 *           page (config/api.md, "Teams").
 *   home    The two sides of the match. Marc is on neither, so he opens the
 *   away    match as a spectator and its header reads Match Preview (View Only).
 *           His visit to home's settings page is 24.1's Access Denied capture.
 */
export const TEAMS = {
  united: 'KB 24 United',
  dummy: 'KB 24 Dummy',
  home: 'KB 24 Rovers',
  away: 'KB 24 Town',
};

/** Marc's throwaway team for 24.4's masked comment. Rebuilt on every seed run. */
export const COMMENTS_TEAM = 'KB 24 Comments FC';

/**
 * Owen's league, holding home and away. A match with no `leaderboardId` never
 * leaves `Incomplete` (config/api.md), so the match needs one. Marc has no role
 * on it, which is what makes its settings page 24.3's error-boundary capture.
 */
export const LEADERBOARD = 'KB 24 League';

export const VENUE = { name: 'KB 24 Astro', location: 'Hackney, London' };

/**
 * The squad on each side, in line-up order. All five start. Every member is a
 * name only, which creates a friend record on Owen as a side effect
 * (config/api.md, "Friends") - Owen is Pro, so there is no friend limit to hit.
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
 * The match's kick-off. Fixed and in the future - see "The clock" above.
 * scripts/seed-24.mjs refuses to run once it has passed.
 */
export const MATCH_DATE = '2026-12-12T15:00:00.000Z';

/** How the match page prints MATCH_DATE, in Europe/London. */
export const MATCH_DATE_SHOWN = { short: '12 Dec 2026', time: '15:00' };

export const MATCH = { duration: '60 min', teamSize: '5 VS 5', tag: 'league', formation: '2-1-1' };

/**
 * What 24.4 types into the comment box, and what the API stores.
 *
 * The mask is server-side: `POST /comments` answers the comment with the word
 * replaced by asterisks, one per letter, and the same happens to team names,
 * bios, friend names and chat messages (config/api.md, "Language filtering").
 * The word is in a spec so the capture can be regenerated; the published
 * screenshot shows only the asterisks.
 */
export const FILTERED_COMMENT = {
  typed: 'What a shit result, we were much better than that.',
  shown: 'What a **** result, we were much better than that.',
};

/**
 * The files 24.2 hands to the file inputs. Generated at run time into
 * OVERSIZE_DIR by `oversizeFiles24()` in lib/kb.ts - deterministically, from a
 * fixed-seed xorshift, so the bytes are the same every run - and never
 * committed: the smallest is 3.5MB and the video is 201MB of zeros.
 *
 * The names are printed on screen ("File exceeds 3 MB: <name>"), so they are
 * fixtures.
 */
export const OVERSIZE_DIR = 'test-results/24-fixtures';
export const OVERSIZE_FILES = {
  // 1100 x 1100 of incompressible noise, PNG with no deflate: 3.47MB. Over the
  // composer's 3MB check, so it is refused in the browser before any request.
  photo3mb: { name: 'kb-24-team-photo.png', side: 1100 },
  // 930 x 930 the same way: 2.48MB. UNDER the composer's 3MB check and OVER the
  // server's 2MB limit, so it is posted and answered 413 "File too large".
  photo2mb: { name: 'kb-24-celebration.png', side: 930 },
  // 201MB of zeros named .mp4. The composer checks the size against 200MB for
  // anything whose name or type says video, before it uploads anything.
  video: { name: 'kb-24-highlights.mp4', bytes: 201 * 1024 * 1024 },
};

/** The limits the app and the API enforce, as measured on 2026-09-04. See briefs/24.md. */
export const LIMITS = {
  caption: 'JPG, GIF or PNG. 3MB max.',
  composerImageMb: 3,
  composerVideoMb: 200,
  serverCommentMediaMb: 2,
  serverBannerMb: 3,
  serverAvatarKb: 100,
};

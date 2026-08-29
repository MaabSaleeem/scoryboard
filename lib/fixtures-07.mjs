// The accounts and fixtures collection 07 - "Teams" - runs on, in one place.
//
// `scripts/seed-07.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This collection touches ONLY the addresses below - kb-manager-pro-07@,
// kb-fresh-07@ and kb-07-*@. It never signs in to another collection's.
//
// --- Why this collection needs eight teams --------------------------------
//
// Teams is the collection of one-way actions. Accepting an invitation, claiming
// a team, removing a member, blocking them, and deleting a team are all
// irreversible, and several are irreversible from the API's side too.
//
// So every one of them is captured the way collections 12 and 13 captured
// ending a phase and deleting a tournament: **photograph the control, and the
// dialog where there is one, and do not submit.** The state the reader lands in
// afterwards is photographed on a SECOND fixture that is already in it.
//
// Each pair below is one article's before and after:
//
//   remove and block   KB 07 United (Pat present)   -> KB 07 Athletic (Baz gone)
//   claim a team       KB 07 Orient (unclaimed)     -> KB 07 Albion (claimed)
//   accept an invite   Fin's invitation to United   -> Fin already in Wanderers
//   delete a team      KB 07 United's Delete Team   -> no "after" exists; see below
//
// Deleting a team has no "after" fixture: what follows is a team list without
// it, which is the list you already have. 07.11 photographs the control, the
// confirmation dialog, and the same section on a team you do not own - where
// the button is present but disabled.
//
// --- Two things exploration changed, and why the fixtures look like this ---
//
// **There is no ownership transfer.** The map calls 07.9 "Claiming a team and
// transferring ownership". The app has no such feature: the role list is
// `[{Player},{Administrator}]` and there is no transfer mutation anywhere in the
// bundle. A team only changes hands by being created unowned and then claimed.
// So there is no "heir" fixture; KB 07 Albion is a team that was claimed.
//
// **There is no Fan role in the web app.** The API takes `role: "Fan"` and
// `GET /teams/:id/players` hides those rows unless `?includeFans=true` - but the
// app's own TeamRole enum is Owner / Administrator / Player / Admin / Team /
// Referee / Padel, with no Fan, so a Fan row renders with no badge at all and
// nothing in the UI can create one. No fixture here holds a Fan: a screenshot of
// one would show a reader a state they cannot reach and a row that looks broken.

export const ACCOUNTS = {
  // The persona. Pro, owns five of the eight teams.
  pro: 'kb-manager-pro-07@yopmail.com',
  // 07.6's reader: an account with an invitation waiting.
  fresh: 'kb-fresh-07@yopmail.com',
  // The people on KB 07 United.
  admin: 'kb-07-admin@yopmail.com',
  player: 'kb-07-player@yopmail.com',
  player2: 'kb-07-player2@yopmail.com',
  // Owns KB 07 Wanderers, where Mo is only an Administrator, and creates the two
  // unowned teams 07.2 and 07.9 are about.
  heir: 'kb-07-heir@yopmail.com',
  // A Free owner with a team of his own. 07.7 is flagged free_pro and the two
  // halves are two owners, not one account flipped - flipping the persona would
  // change what the other ten articles photograph.
  free: 'kb-07-free@yopmail.com',
  // Already removed AND blocked from KB 07 Athletic. The "after" of 07.8.
  blocked: 'kb-07-blocked@yopmail.com',
};

/**
 * Which plan each account is on.
 *
 * Two accounts are Pro, and the second one is not obvious. Staging refuses
 * `POST /team-players` with `role: "Administrator"` from a Free owner:
 *
 *   400 TEAM_ADMIN_LIMIT_EXCEEDED
 *   "Free plan users cannot add team admins. Upgrade to Pro to add admins."
 *
 * KB 07 Wanderers is the "after" of transferring ownership and has to carry an
 * Administrator - Mo, the old owner - so Nia has to be Pro to hold it. That is
 * also what a real transfer looks like: the team came from a Pro owner.
 *
 * Fred stays Free on purpose. He is the Free half of 07.7, and that refusal is
 * the whole difference the article documents.
 */
export const MEMBERSHIP = {
  pro: 'Pro',
  heir: 'Pro',
  fresh: 'Free',
  admin: 'Free',
  player: 'Free',
  player2: 'Free',
  free: 'Free',
  blocked: 'Free',
};

/**
 * What each account's own details are set to.
 *
 * PUT /users/:userId is a full REPLACE, not a patch (config/api.md) - a body
 * that leaves `gender` out answers 400. Every write sends all of this.
 *
 * `position` is the API's own enum, not the label the profile form shows:
 * "CentralMidfielder", never "Central Midfielder".
 */
export const PROFILES = {
  pro: {
    name: 'Mo', lastName: 'KB', gender: 'Male', dateOfBirth: '1988-06-14',
    sports: ['Football'], position: 'CentralMidfielder', isMarketingOpted: false,
    bio: 'I run KB 07 United and most of the fixtures it plays.',
  },
  fresh: {
    name: 'Fin', lastName: 'KB', gender: 'Male', dateOfBirth: '1999-11-02',
    sports: ['Football'], position: 'Goalkeeper', isMarketingOpted: false,
    bio: '',
  },
  admin: {
    name: 'Ada', lastName: 'KB', gender: 'Female', dateOfBirth: '1991-03-27',
    sports: ['Football'], position: 'CenterBack', isMarketingOpted: false,
    bio: 'Administrator for KB 07 United.',
  },
  player: {
    name: 'Pat', lastName: 'KB', gender: 'Female', dateOfBirth: '1996-07-19',
    sports: ['Football'], position: 'Striker', isMarketingOpted: false,
    bio: 'Striker for KB 07 United.',
  },
  player2: {
    name: 'Fay', lastName: 'KB', gender: 'Female', dateOfBirth: '1993-12-05',
    sports: ['Football'], position: 'LeftWinger', isMarketingOpted: false,
    bio: 'Left wing for KB 07 United.',
  },
  heir: {
    name: 'Nia', lastName: 'KB', gender: 'Female', dateOfBirth: '1990-02-11',
    sports: ['Football'], position: 'RightBack', isMarketingOpted: false,
    bio: 'I look after KB 07 Wanderers.',
  },
  free: {
    name: 'Fred', lastName: 'KB', gender: 'Male', dateOfBirth: '1994-09-30',
    sports: ['Football'], position: 'Striker', isMarketingOpted: false,
    bio: 'Five-a-side on Wednesdays.',
  },
  blocked: {
    name: 'Baz', lastName: 'KB', gender: 'Male', dateOfBirth: '1995-05-22',
    sports: ['Football'], position: 'RightWinger', isMarketingOpted: false,
    bio: '',
  },
};

export const TEAMS = {
  // The flagship. Every role the app can set, a crest, a banner and a bio.
  // Owned by Mo. 07.3, 07.4, 07.5, 07.7, 07.8 (before), 07.10, 07.11.
  united: 'KB 07 United',
  // The opponent in the one finished match, so 07.10 has statistics, a match
  // list and a top-scorer table to photograph. Owned by Mo.
  rovers: 'KB 07 Rovers',
  // Already carries a removed member and a removed-and-blocked one. The "after"
  // of 07.8. Owned by Mo.
  athletic: 'KB 07 Athletic',
  // Owned by NIA, with Mo an Administrator on it. That is where 07.4 and 07.11
  // photograph what somebody who is not the Owner sees - including the Delete
  // Team button, which is present and DISABLED.
  wanderers: 'KB 07 Wanderers',
  // Owned by Fred, who is on the Free plan. The Free half of 07.7.
  casuals: 'KB 07 Casuals',
  // A DUMMY team - created with "Create a Dummy team" ticked, which is
  // `isPrivate: true`. It is in its owner's list and invisible to everybody
  // else, who get a "you don't have permission to view it" screen. 07.2.
  reserves: 'KB 07 Reserves',
  // An UNCLAIMED team - created with "I don't want to own this team" ticked,
  // which is `isSystem: true`. It belongs to nobody, appears in no team list,
  // and is findable by search. 07.2 and 07.9 photograph its Claim Team dialog
  // and never submit it.
  orient: 'KB 07 Orient',
  // The same thing, already claimed - by Mo. The "after" of 07.9.
  albion: 'KB 07 Albion',
};

/**
 * Which teams are made unclaimed, and which of those is then claimed.
 *
 * Both are created by Nia rather than Mo, because an unowned team is not in
 * anybody's list and the seed has to be able to find it again - it does that by
 * global search, which is the same way a reader finds one (07.9).
 */
export const UNCLAIMED = ['orient', 'albion'];
export const CLAIMED_BY_PRO = 'albion';

export const TEAM_SIZE = '5 VS 5';
export const FORMATION = '2-1-1';

/** The images 07.3 documents. See scripts/make-assets-07.mjs for how they are made. */
export const IMAGES = {
  crestWebp: 'assets/07/united-crest.webp',
  crestPng: 'assets/07/united-crest.png',
  bannerWebp: 'assets/07/united-banner.webp',
  bannerPng: 'assets/07/united-banner.png',
};

export const UNITED_BIO =
  'Five-a-side since 2019. We play Thursday nights at the KB 07 Astro and we are always short a goalkeeper.';

/**
 * KB 07 United's team sheet: one member per role, plus friend rows with no
 * account at all.
 *
 * A friend row is POST /team-players with a `name` and no `email` - that is the
 * "added by name" case 07.5 documents, and it is what the invite-link flow in
 * 07.5 acts on. An account member is POST /team-players with an `email`, which
 * creates an invitation the account then accepts.
 */
export const UNITED_SQUAD = {
  members: [
    { account: 'admin', role: 'Administrator' },
    { account: 'player', role: 'Player' },
    { account: 'player2', role: 'Player' },
    { account: 'heir', role: 'Administrator' },
  ],
  // No email: these are the rows 07.5's invite-link half is about, and the only
  // rows that carry an "Invite" button of their own.
  friends: [
    { name: 'Sam KB', role: 'Player' },
    { name: 'Rory KB', role: 'Player' },
    { name: 'Nadia KB', role: 'Player' },
  ],
};

/** KB 07 Rovers only has to be able to field five. Nobody photographs its sheet. */
export const ROVERS_SQUAD = {
  members: [],
  friends: [
    { name: 'Bo KB', role: 'Player' },
    { name: 'Cleo KB', role: 'Player' },
    { name: 'Dara KB', role: 'Player' },
    { name: 'Eli KB', role: 'Player' },
  ],
};

/**
 * KB 07 Athletic - the "after" of removing and blocking.
 *
 * Only the people who are still on the team. The two who are not are in
 * ATHLETIC_REMOVED below and are deliberately NOT here, because a removal is
 * not reversible: `DELETE /team-players/:id` leaves the row in
 * GET /teams/:id/players flagged `isDeleted`, and adding the same person again
 * creates a SECOND row rather than reviving the first. A seed that added them
 * back on every run would grow a new removed row each time.
 */
export const ATHLETIC_SQUAD = {
  members: [],
  friends: [{ name: 'Jonah KB', role: 'Player' }],
};

/**
 * The two rows KB 07 Athletic carries already removed, so 07.8 can photograph
 * the outcome of an action its spec never performs.
 *
 * Two outcomes side by side in one list, which is the whole point of the
 * article: Baz was removed WITH the block, Ivy without it. Baz is an account so
 * the block has somebody to apply to; Ivy is a name-only row.
 *
 * A removed row keeps its name, its role and - checked on staging 2026-08-29 -
 * its email. Anonymising the address is what DELETING THE ACCOUNT does, not
 * what removing a member does.
 */
export const ATHLETIC_REMOVED = [
  { account: 'blocked', name: 'Baz KB', role: 'Player', blocked: true },
  { name: 'Ivy KB', role: 'Player', blocked: false },
];

/**
 * KB 07 Wanderers - the team Mo does NOT own.
 *
 * Nia owns it and Mo is an Administrator on it, which is what 07.4 and 07.11
 * need: the same Edit Team page seen by somebody who is not the Owner. The
 * Delete Team button is rendered there and is disabled - `DELETE /teams/:id`
 * answers 403 "Only team Owner can delete team" for an Administrator.
 *
 * Fin is on it, accepted, so 07.6 has a real "you are in the team now" screen to
 * photograph while the invitation it photographs stays pending.
 *
 * Nia has to be Pro to hold this fixture at all: a Free owner cannot add an
 * Administrator. See MEMBERSHIP above.
 */
export const WANDERERS_SQUAD = {
  members: [
    { account: 'pro', role: 'Administrator' },
    { account: 'fresh', role: 'Player' },
  ],
  friends: [{ name: 'Kit KB', role: 'Player' }],
};

/** KB 07 Casuals - Fred's Free team. The Free half of 07.7. */
export const CASUALS_SQUAD = {
  members: [],
  friends: [
    { name: 'Lena KB', role: 'Player' },
    { name: 'Milo KB', role: 'Player' },
  ],
};

/**
 * The invitation 07.6 photographs and never accepts.
 *
 * Mo invites Fin to KB 07 United by email. Fin's account exists, so the
 * invitation lands in GET /team-invitations and renders as a card he can accept.
 * The spec photographs the card and the accept dialog and stops there; the
 * "you are in" half is Wanderers, which Fin already belongs to.
 *
 * The seed asserts it is still PENDING. If a run ever accepts it, the seed
 * rebuilds it: remove the row and invite again.
 */
export const PENDING_INVITE = { team: 'united', account: 'fresh', name: 'Fin KB' };

/**
 * The leaderboard both teams sit in, and why the match has to be in it.
 *
 * `POST /admins/users` creates "<Name>'s leaderboard" for every account, so Mo
 * already owns one and the seed only has to add the two teams to it.
 *
 * **A match that is not in a leaderboard writes no statistics at all.** Observed
 * on staging 2026-08-29 and isolated: two finished matches between the same two
 * teams with the same line-ups, one with `leaderboardId` and one without. The
 * one without left `GET /teams/:id/stats` returning no `data` key at all and
 * every player on zero; the one with it read `matches: 1, wins: 1, goals: 1`
 * within seconds. 07.10 is the article about team statistics, so this is not a
 * detail - without it that whole page is empty.
 */
export const LEADERBOARD_TEAMS = ['united', 'rovers'];

/**
 * The one finished match, so 07.10 has something to show.
 *
 * KB 07 United 3 - 1 KB 07 Rovers, in Mo's leaderboard. The date is fixed and in
 * the past, which is what puts it under Past Matches and keeps it there - and
 * which also means the match auto-starts a moment after POST /matches answers,
 * so the seed polls for Live rather than sleeping (config/api.md, Match events).
 *
 * A finished match cannot be reopened, edited or deleted. If this comes out
 * wrong the only repair is `node scripts/seed-07.mjs --rebuild`.
 */
export const MATCH = {
  date: '2026-08-20T18:00:00.000Z',
  duration: '60 min',
  teamSize: TEAM_SIZE,
  formation: FORMATION,
  tag: 'league',
  // Formation order for 2-1-1, five a side.
  positions: ['Goalkeeper', 'CenterBack', 'CenterBack', 'CentralMidfielder', 'Striker'],
  home: ['Sam KB', 'Rory KB', 'Nadia KB', 'Mo KB', 'Pat KB'],
  away: ['Bo KB', 'Cleo KB', 'Dara KB', 'Eli KB'],
  events: [
    { type: 'GoalAwarded', side: 'home', player: 'Pat KB', assist: 'Mo KB' },
    { type: 'GoalAwarded', side: 'home', player: 'Pat KB' },
    { type: 'GoalAwarded', side: 'home', player: 'Mo KB' },
    { type: 'GoalAwarded', side: 'away', player: 'Bo KB' },
    { type: 'YellowCard', side: 'away', player: 'Cleo KB' },
    { type: 'PlayerOfMatch', side: 'home', player: 'Pat KB' },
  ],
};

/**
 * One scheduled match, so the team page's Matches panel is not an empty box on
 * the tab it opens on.
 *
 * Collection 02 hit this: the panel opens on Upcoming, and with nothing there it
 * reads "No matches yet, stay tuned!" - a tall empty frame that shows the
 * article's subject only by absence.
 *
 * **Dated December on purpose.** A match whose date has passed starts itself.
 * This one has to stay Scheduled for as long as the specs are re-run, so it is
 * put far enough out that a re-run months from now still finds it upcoming. If
 * this collection is ever re-captured after 5 December 2026, move the date.
 */
export const UPCOMING = {
  date: '2026-12-05T19:00:00.000Z',
  duration: '60 min',
  teamSize: TEAM_SIZE,
  formation: FORMATION,
  tag: 'league',
  positions: ['Goalkeeper', 'CenterBack', 'CenterBack', 'CentralMidfielder', 'Striker'],
  home: ['Sam KB', 'Rory KB', 'Nadia KB', 'Mo KB', 'Pat KB'],
  away: ['Bo KB', 'Cleo KB', 'Dara KB', 'Eli KB'],
};

/**
 * What KB 07 United's team statistics must read once the match has finished.
 *
 * The shape is `GET /teams/:id/stats` -> `data.stats`, observed 2026-08-29:
 * `{goals, conceded, matches, wins, draws, losses, cleanSheets, winStreak,
 * redCards, yellowCards, playerOfMatch}`. There is no `winLossDraws` wrapper
 * here - that is the shape of the PLAYER stats endpoint.
 */
export const EXPECTED_TEAM_STATS = { matches: 1, wins: 1, losses: 0, draws: 0, goals: 3, conceded: 1 };

/** Who follows KB 07 United, so 07.10's Followers panel is not empty. */
export const FOLLOWERS = ['player2', 'free', 'heir'];

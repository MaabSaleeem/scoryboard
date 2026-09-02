// The accounts and fixtures collection 19 runs on, in one place.
//
// `scripts/seed-19.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Collection 19 is "Comments, likes & ratings".
//
// --- Read this before the article list ------------------------------------
//
// The map in config/articles.yaml promises more than the app has. Measured on
// staging 2026-09-02, endpoint by endpoint and screen by screen:
//
// **Comments exist on two screens, not five.** `POST /comments` takes
// `commentType` from the enum `leaderboard | team | match | player |
// tournament` - the API says so in its own validation error - and all five are
// accepted and stored. Only **leaderboard** and **team** render a comment panel.
// A match page fires no `/comments` call at all (its FEED is match events), a
// player profile fires none, and no tournament tab fires one either. So a
// comment posted with `commentType: "match"`, `"player"` or `"tournament"` is
// invisible to every screen in the web app.
//
// **A comment cannot be edited and cannot be deleted.** The app's whole comment
// surface is four calls - `POST /comments`, `GET /comments`,
// `GET /comments/:id/replies` and `POST|DELETE /comments/:id/like` - plus the
// media pair. There is no `editComment` and no `deleteComment` anywhere in the
// bundle, and a comment row carries exactly three controls: **Reply**, a
// thumbs-up with its count, and a speech bubble with its reply count.
// `PUT /comments/:id` does work over the API and nothing calls it;
// `DELETE /comments/:id` answers `401 "Unauthorized to delete this comment"`
// even to the author. Collection 08 found the delete half first.
//
// That is why the comment fixtures below are REBUILT, not reconciled: the only
// way to clear a thread is to delete the entity it hangs off, so the seed
// deletes the two teams and the leaderboard and makes them again.
//
// **Add Media is not Pro-gated here.** There are two Add Media buttons in the
// bundle. The match feed's checks `membership === Pro` and otherwise opens the
// upgrade modal; the comment composer's does not check anything, its file input
// is `accept="image/*"`, and `POST /comments/media` answers 200 to a Free
// account. So 19.1's `free_pro` flag has no basis and there is no dual capture.
//
// **Commenting is members-only, and the composer is disabled rather than
// hidden.** A non-member sees the panel with the textarea, Comment, Add Media
// and every Reply button `disabled`. The API agrees:
// `403 "Only team members can comment on or like team content"` and the
// leaderboard's equivalent. Leaderboard membership is wider than
// config/api.md's owner-or-Administrator: a player on a team that is IN the
// leaderboard may comment too. Measured with Rae, who is neither owner nor
// admin.
//
// **Ratings are left in one place: the Rate button on a Finished match.**
// `entityType` is `match | player | team | referee`. The button opens a chooser
// with those four, and the Referee row is `hidden` unless the match carries a
// referee. Team and player pages show the average and open a read-only reviews
// list; neither has a Rate control of its own.
//
// **A rating can be changed and it can be removed.** Re-opening Rate on
// something you have already rated fills your stars, pre-fills your review and
// changes the button to **Update**. Posting again from the same account
// replaces the previous rating - the count does not move.
//
// **CORRECTED mid-run, 2026-09-02.** This note first said a rating could never
// be removed, because the Rate panel offers only Post, Update and Close and the
// bundle's `useDeleteRatingMutation` looked unwired. It is wired, somewhere
// easy to miss: the read-only reviews list puts a kebab on **your own** review
// row - and only on yours - carrying **Edit** and **Delete**. The button has no
// accessible name and its icon is a plain ellipsis, so it reads as noise in an
// accessibility snapshot. Found when an assertion in 19.4 failed for an
// unrelated reason and printed the dialog's tree.
//
// **You cannot rate yourself.** The bundle disables the form when the subject
// is your own player record, on the player and referee targets.
//
// --- Five accounts, all addressed to this collection ----------------------
//
// config/personas.yaml, account_isolation. Collection 19 never signs in to
// another collection's account.
//
//   kb-player-19        Pia KB. FREE. The map's persona_default and the capture
//                       persona for all four articles. A player on KB Comets
//                       and an Administrator of KB Comment League, so she may
//                       comment in both places. Scores, is Player of the Match,
//                       and is the player 19.4 photographs an average on.
//   kb-19-owner         Ollie KB. PRO. Owns both teams, the leaderboard, the
//                       venue, the match and the tournament. Pro only because
//                       adding a leaderboard Administrator is Pro-gated. Writes
//                       the first comment in each thread.
//   kb-19-pro           Pat KB. PRO. A second commenter and rater. His Pro
//                       membership turned out to matter nowhere - see the
//                       Add Media note above - and he is kept Pro so a later
//                       session can re-check that cheaply.
//   kb-referee-19       Rae KB. Free. Referees the played match, which is what
//                       puts the Referee row in the Rate chooser. Also a team
//                       player, which is how the seed proves that leaderboard
//                       commenting is not admin-only.
//   kb-19-outsider      Otto KB. Free. On neither team and in no leaderboard.
//                       He is the disabled composer in 19.1's last shot, and he
//                       rates from outside so the averages have three voices.
//
// --- What is reconciled and what is rebuilt --------------------------------
//
// Reconciled: the five accounts, their memberships, the venue, Rae's referee
// flag, and every rating (each one is looked up with `my-rating` and only
// written when it is missing or wrong).
//
// Rebuilt every run: both teams, the leaderboard, the played match, and every
// comment. Comments cannot be deleted, so an exact thread needs a new entity.
// Team ids, leaderboard ids, match ids and comment ids therefore change on
// every run. **No spec may hardcode any of them.** Specs look entities up by
// name and comments up by their text, and `scripts/seed-19.mjs` prints both.

export const ACCOUNTS = {
  player: 'kb-player-19@yopmail.com',
  owner: 'kb-19-owner@yopmail.com',
  pro: 'kb-19-pro@yopmail.com',
  referee: 'kb-referee-19@yopmail.com',
  outsider: 'kb-19-outsider@yopmail.com',
};

export const PROFILES = {
  player: { name: 'Pia', membership: 'Free' },
  owner: { name: 'Ollie', membership: 'Pro' },
  pro: { name: 'Pat', membership: 'Pro' },
  referee: { name: 'Rae', membership: 'Free' },
  outsider: { name: 'Otto', membership: 'Free' },
};

/** Display names as the app renders them, for masking and for assertions. */
export const FULL_NAMES = {
  player: 'Pia KB',
  owner: 'Ollie KB',
  pro: 'Pat KB',
  referee: 'Rae KB',
  outsider: 'Otto KB',
};

export const TEAMS = {
  home: 'KB Comets',
  away: 'KB Rovers 19',
};

export const LEADERBOARD = 'KB Comment League';
export const VENUE = { name: 'KB Astro 19', location: 'Hackney, London' };
export const TOURNAMENT = 'KB Comment Cup';

/**
 * The squad on each team, in lineup order.
 *
 * The first five on each side start; the rest are members who do not play.
 * Rae is deliberately LAST on the home team, because she referees the match and
 * a referee must not be in the line-up she officiates.
 */
export const SQUAD = {
  home: [
    { key: 'owner', name: 'Ollie', position: 'Goalkeeper' },
    { key: 'player', name: 'Pia', position: 'CenterBack-1' },
    { key: 'pro', name: 'Pat', position: 'CenterBack-2' },
    { name: 'Nia Bell', position: 'CentralMidfielder' },
    { name: 'Sam Reid', position: 'Striker' },
    { key: 'referee', name: 'Rae' },
  ],
  away: [
    { key: 'owner', name: 'Ollie', position: 'Goalkeeper' },
    { name: 'Ada Cole', position: 'CenterBack-1' },
    { name: 'Bo Frost', position: 'CenterBack-2' },
    { name: 'Cal Mead', position: 'CentralMidfielder' },
    { name: 'Dee Vale', position: 'Striker' },
    { name: 'Eli Wren' },
  ],
};

/**
 * The match the whole rating half of this collection hangs off.
 *
 * KB Comets 2 - 1 KB Rovers 19, Finished, refereed by Rae, with Pia scoring and
 * taking Player of the Match. Pia matters twice: 19.3 rates from her account and
 * 19.4 photographs the average on her player page.
 *
 * The date is NOT fixed. A match is Live only between its date and its date plus
 * its duration, and events are accepted only while it is Live, so a fixed date
 * in the past is Live for a moment and finishes itself before the first event
 * lands. The seed dates it 90 seconds ago and polls for Live, the way
 * scripts/seed-10.mjs does.
 */
export const MATCH = {
  duration: '60 min',
  teamSize: '5 VS 5',
  tag: 'league',
  events: [
    { type: 'GoalAwarded', side: 'home', scorer: 'Nia Bell', assist: 'Pia' },
    { type: 'GoalAwarded', side: 'home', scorer: 'Pia' },
    { type: 'GoalAwarded', side: 'away', scorer: 'Dee Vale' },
    { type: 'YellowCard', side: 'away', scorer: 'Bo Frost' },
    { type: 'PlayerOfMatch', side: 'home', scorer: 'Pia' },
  ],
};

/**
 * The seeded threads.
 *
 * `on` names the entity: `leaderboard`, or a team key. `by` is an account key.
 * `likes` lists the accounts that have liked it. `replies` are children, posted
 * with `parentCommentId`, and a reply is invisible to `GET /comments` - it comes
 * back only from `GET /comments/:id/replies`, which is what makes a
 * dedupe-against-the-top-level seed post every reply again on every run
 * (config/api.md, "Comments on a leaderboard"). This seed rebuilds instead, so
 * the trap does not apply, but the note is here because it is easy to reach for.
 *
 * `media` attaches one image, uploaded through `POST /comments/media`. One
 * comment carries one, because 19.1 photographs what an attachment looks like.
 *
 * Every string is fixed. No clock, no counter, no faker.
 */
export const COMMENTS = [
  {
    on: 'home',
    by: 'owner',
    // ONE like, from Pat, and deliberately not Pia's. 19.2 photographs the
    // like control before and after, and it does it on THIS comment - the same
    // one its reply shots use, so all four of its captures concern one thread.
    // Pia liking it live takes the count 1 -> 2 and the icon grey -> blue.
    //
    // The first cut gave it two likes and put 19.2's like pair on the comment
    // carrying the kit photo instead. That capture was correct and unreadable:
    // the thumbs-up is a 20-pixel detail in the corner of a frame five sixths
    // filled by a shirt, and it repeated 19.1's shot 04 for no gain.
    text: 'Training moves to the astro from Tuesday. Bring a dark top.',
    likes: ['pro'],
    replies: [{ by: 'player', text: 'I will bring the bibs.' }],
  },
  {
    on: 'home',
    by: 'pro',
    text: 'New kit arrived this morning.',
    media: 'assets/19/kb-comets-kit.webp',
    likes: ['owner'],
    replies: [],
  },
  {
    on: 'home',
    by: 'player',
    text: 'Who is driving to the Rovers game?',
    likes: [],
    replies: [],
  },
  {
    on: 'leaderboard',
    by: 'owner',
    text: 'Next month’s fixtures are up. Check your availability.',
    likes: ['player', 'pro', 'referee'],
    replies: [{ by: 'pro', text: 'Can we move the Comets game to Sunday?' }],
  },
  {
    on: 'leaderboard',
    by: 'referee',
    text: 'Good game last night. Both sides played it in the right spirit.',
    likes: ['owner'],
    replies: [],
  },
];

/**
 * The seeded ratings.
 *
 * `on` is the entity: `match`, the home team, Pia as a player, Rae as a referee.
 * Chosen so every average is a different shape and none of them is a round
 * number by accident:
 *
 *   match     3, 4, 5   -> 4.0   the mean of a spread
 *   home team 4, 5      -> 4.5   an average that is not a whole star
 *   Pia       4, 5, 5   -> 4.67, and the app renders 4.7 - the rounding 19.4
 *                          has to explain
 *   Rae       3, 4, 5   -> 4.0
 *
 * **Pia rates the home team and nothing else, on purpose.** 19.3 photographs the
 * Rate dialog in both of its states from one account: Match, Player and Referee
 * open in add mode with an empty form and a **Post** button, and Team opens on
 * her existing four stars with her review filled in and an **Update** button.
 *
 * Nobody rates themselves - the app disables that - so Ollie is absent from the
 * player row and Rae from the referee row.
 */
export const RATINGS = [
  { on: 'match', by: 'pro', rating: 5, comment: 'Great game, well organised.' },
  { on: 'match', by: 'owner', rating: 4 },
  { on: 'match', by: 'outsider', rating: 3, comment: 'Pitch was waterlogged.' },

  { on: 'team', by: 'pro', rating: 5, comment: 'Well drilled side.' },
  { on: 'team', by: 'player', rating: 4, comment: 'Best we have played all season.' },

  { on: 'player', by: 'pro', rating: 5, comment: 'Two goals and never stopped running.' },
  { on: 'player', by: 'owner', rating: 4 },
  { on: 'player', by: 'outsider', rating: 5 },

  { on: 'referee', by: 'pro', rating: 4, comment: 'Consistent all game.' },
  { on: 'referee', by: 'owner', rating: 5 },
  { on: 'referee', by: 'outsider', rating: 3 },
];

/** What the seeded ratings must add up to. The seed asserts these. */
export const EXPECTED_AVERAGES = {
  match: { averageRating: 4, totalCount: 3, shown: '4.0' },
  team: { averageRating: 4.5, totalCount: 2, shown: '4.5' },
  player: { averageRating: 4.67, totalCount: 3, shown: '4.7' },
  referee: { averageRating: 4, totalCount: 3, shown: '4.0' },
};

/**
 * The clock every collection 19 spec freezes to.
 *
 * The comment footer is an absolute `h:mm A • MMM DD, YYYY`, taken from the
 * server's `createdAt` at seed time, so freezing the page clock does not pin it
 * - those are masked instead, see chat-style note in lib/kb.ts. What the frozen
 * clock does pin is the match page's own relative wording and the calendar.
 */
export const FROZEN_NOW = '2026-09-02T09:00:00.000Z';

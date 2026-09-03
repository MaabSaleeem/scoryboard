// The accounts and fixtures collection 20 runs on, in one place.
//
// `scripts/seed-20.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Collection 20 is "Notifications, emails & the activity feed".
//
// --- Read this before the article list ------------------------------------
//
// Measured on staging 2026-09-03, endpoint by endpoint and screen by screen.
// Three of the four mapped titles promise a control this build does not have.
//
// **There is no notification filter.** Notifications live in a modal opened
// from the bell, not on a route: `/notifications` answers 404 from the server.
// The modal's own hook only ever sends `{limit: 10, skip: n}` - read out of the
// bundle and confirmed on the wire - and the modal carries exactly three
// controls: **Mark all as read** in its header, and per row a **Mark as read**
// tick and a trash button. No chips, no dropdown, no tabs, nothing keyed to a
// type or to the read state. `GET /notifications` does accept `type` and
// `isRead`, and nothing in the app sends either. `isRead` does not even work:
// `?isRead=false`, `true`, `0`, `1` and `False` all answer an empty list on an
// account holding sixteen unread rows. So 20.1's "filtering" is dropped.
//
// **There is no activity-feed filter either, and the feed is called Trending.**
// `GET /activities` takes `referenceType`, `teamId`, `leaderboardId` and
// `tournamentId`. The component that renders the feed takes a `query` prop that
// becomes those parameters - and **no caller passes one.** Swept across 65
// chunks pulled from every route in the app's own `Routes` enum, the component
// is used twice, both times as
// `<Trending containerClassName="rounded-lg border bg-white p-3" />`: once in
// the football profile layout, once in the padel one. Same panel, no title
// override, no query. So 20.4's "how to filter it" is dropped, and the article
// is named after what the panel is actually called.
//
// **The feed is global.** Every team created and every match finished on
// staging is in it, other collections' fixtures and other people's accounts
// included, and `/activities` has no "mine only" parameter. Collection 02 hit
// this first on article 02.1 and solved it by routing `GET /activities` in the
// spec and keeping only the rows that name its own fixtures. Collection 20 does
// the same - see `KB20_OURS` below.
//
// **The Trending strip advances itself every 2.5 seconds.** A `setTimeout` in
// the carousel hook scrolls the list to the next card, advances its own
// `activeIndex` and reschedules, and it does that under a frozen clock too,
// because `page.clock.setFixedTime` pins `Date.now()` and leaves timers
// running. lib/kb.ts's `stopTrendingAutoAdvance()` drops timers asked for at
// exactly that delay - 2500 appears once in the whole bundle - and
// `parkTrending20()` then asserts that the stub is in the page and that the
// strip is on its first card. Stubbing the list's `scrollTo` after the fact was
// tried first and was not enough: the pixels held still and `activeIndex`
// climbed anyway, so the Previous arrow lit up on a strip sitting on card one.
//
// **The bell badge is Firestore, not REST.** `GET /notifications` answers a
// bare array with no counters. The badge and the modal title read
// `{totalCount, unreadCount, notificationIds}` off an `onSnapshot` listener on
// the Firestore document `notifications/<firebase uid>`.
//
// **And that number is a running tally, not a count, and it is not clamped.**
//
//   - `mark-all-read` SETS `unreadCount` to 0;
//   - `mark-read {ids, isRead: false}` puts every row back to unread and leaves
//     the tally alone - measured at list-unread 16 with the badge and the modal
//     title both gone;
//   - `DELETE /notifications/:id` on an UNREAD row subtracts one, so clearing a
//     list whose tally is already 0 drives it negative. One account read
//     `{totalCount: 11, unreadCount: -21}`.
//
// So 20.1's captures are ordered badge-first, the notification set is REBUILT
// on every seed rather than reconciled - a new notification is the only thing
// that raises the tally - and `scripts/seed-20.mjs` marks everything read
// BEFORE deleting it, which is what heals a negative tally, then reads the
// document back and refuses to finish unless it says eleven.
//
// **Every notification is emailed too.** Fifteen distinct subjects were
// collected out of the four accounts' inboxes; they are in EMAILS below, and
// they are what 20.2 documents. Emails are read from yopmail's **Source** view
// and re-rendered from their own MIME, because yopmail strips every `src`
// attribute out of the HTML view and its "Show pictures" control cannot put
// them back - a screenshot taken there is an email with a broken logo in it.
//
// **A follow notifies once per pair, for ever.** `DELETE
// /players/:id/follow` then `POST` again answers 200 with the SAME `followId`
// and sends nothing: the follow record is soft-deleted and revived, the way a
// friend record is (config/api.md, Friends). A first-ever follow from an
// account that has never followed that player does notify - measured with a
// fourth account, which got a new `followId` and did produce the row. So
// `PlayerFollow` cannot be part of a set the seed rebuilds, and it is dropped
// from NOTIFICATIONS below. The follow mechanism is still in the set:
// `TeamFollow` survives, because the team it is against is rebuilt every run
// and the follow record is therefore new.
//
// **Four notification types could not be produced.** `MatchReviewRequest` and
// `ChatMessageSummary` are in the API's own enum and did not arrive twenty
// minutes after the events that should cause them, so both look like scheduled
// digests. `TournamentUpdate` needs a tournament phase to be ended with the
// "notify followers" option, which is collections 13 and 15. `PaymentRequested`,
// `PaymentReceived` and `PaymentFailed` need a connected Stripe payout account,
// which briefs/17.md records as un-rebuildable from here. Nothing in this
// collection documents any of them. `PaymentFailed` is worth a note anyway: it
// is in the API enum and the app's renderer has **no case for it**, so it falls
// through to "You have a new notification."
//
// --- Four accounts, all addressed to this collection ----------------------
//
// config/personas.yaml, account_isolation. Collection 20 never signs in to
// another collection's account and seeds into none.
//
//   kb-player-20        Pia KB. FREE. The map's persona_default and the capture
//                       persona for 20.1, 20.3 and 20.4. Holds the eleven
//                       notifications and the inbox 20.2 photographs twice.
//   kb-20-owner         Ollie KB. PRO. Owns the two match teams, the
//                       leaderboard, the venue and the match, and causes seven
//                       of Pia's eleven notifications. Pro for two reasons:
//                       adding a leaderboard Administrator is Pro-gated, and a
//                       Free account may own only one leaderboard.
//   kb-20-mate          Milo KB. Free. Follows Pia's team, joins her team, and
//                       replies to and likes her comment. He is the recipient
//                       of the team-invitation email 20.2 shot 02 photographs.
//   kb-20-empty         Emmy KB. Free. Holds NO notifications, ever. She is
//                       20.1's last shot and nothing else. Do not act on her.
//
// --- What is reconciled and what is rebuilt --------------------------------
//
// Reconciled: the four accounts, their memberships and the venue.
//
// Rebuilt every run: the three teams, the leaderboard, the match, the comments
// and **every one of Pia's notifications**. Three reasons, all of them API
// facts:
//
//   - a comment cannot be deleted (briefs/19.md), so an exact thread needs a
//     new entity to hang off;
//   - a team follow answers `409 Already following` the second time, and an
//     invitation cannot be re-accepted, so those generators fire once per
//     entity and never again;
//   - the badge tally only goes up when a notification is made.
//
// So team ids, the leaderboard id, the match id, the comment ids and every
// notification id change on every run. **No spec may hardcode any of them.**
// Specs look entities up by name and notifications up by their type.

export const ACCOUNTS = {
  player: 'kb-player-20@yopmail.com',
  owner: 'kb-20-owner@yopmail.com',
  mate: 'kb-20-mate@yopmail.com',
  empty: 'kb-20-empty@yopmail.com',
};

export const PROFILES = {
  player: { name: 'Pia', membership: 'Free' },
  owner: { name: 'Ollie', membership: 'Pro' },
  mate: { name: 'Milo', membership: 'Free' },
  empty: { name: 'Emmy', membership: 'Free' },
};

export const FULL_NAMES = {
  player: 'Pia KB',
  owner: 'Ollie KB',
  mate: 'Milo KB',
  empty: 'Emmy KB',
};

/**
 * The named fixtures.
 *
 * Named, and not the two teams and one leaderboard an account is born with.
 * Those are called `<First> K FC`, `<First> K FC Away` and `<First>'s
 * leaderboard`, and the team names **gain a date suffix when they clash** -
 * `Ollie K FC 0309`. That suffix would be printed into every notification
 * message and every email subject this collection photographs, and it would
 * change the day the accounts were ever rebuilt. So the fixtures carry their
 * own names and the born ones are left alone, unused.
 */
export const TEAMS = {
  home: 'KB Notify FC',
  away: 'KB Notify Rovers',
  pia: 'KB Pia United',
};

export const LEADERBOARD = 'KB Notify League';

export const VENUE = { name: 'KB Notify Astro', location: '12 Astro Way, Manchester' };

/**
 * The match, on a FIXED date, and the date is the whole reason for the shape.
 *
 * Three of Pia's twelve notifications are match notifications and all three
 * print this date and this venue into their message - "Match scheduled KB
 * Notify FC X KB Notify Rovers on 01 Dec 2026, 07:00 PM at KB Notify Astro".
 * A relative date would move that sentence on every run, inside the text of a
 * row whose text is not what the article is about, and masking a phrase in the
 * middle of three rows reads as damage. A fixed date makes the sentence
 * constant instead.
 *
 * It has to be in the FUTURE, and that is not a preference either.
 * `MatchLive` fires only from an explicit `POST /matches/:id/status
 * {"status":"Live"}`. A match whose date has passed starts itself - collection
 * 10's finding - and the automatic start sends nothing, so a past-dated match
 * yields MatchInvitation and MatchSummary and never MatchLive. A Scheduled
 * match can be driven Scheduled -> Live -> Finished by hand, and all three
 * notifications arrive.
 *
 * **The seed refuses to run once this date has passed**, the way
 * scripts/seed-09.mjs and scripts/seed-10.mjs do with theirs. Move it and
 * re-capture 20.1.
 */
export const MATCH = {
  date: '2026-12-01T19:00:00.000Z',
  duration: '60 min',
  teamSize: '5 VS 5',
  tag: 'league',
  // What the notification and the email print for that instant, in
  // Europe/London. December is GMT, so 19:00 UTC is 07:00 PM.
  shownDate: '01 Dec 2026',
  shownTime: '07:00 PM',
  homeGoals: 1,
  awayGoals: 0,
};

/** The starting eleven, such as it is. Two a side is all a 5 VS 5 match needs. */
export const SQUAD = {
  home: [
    { key: 'owner', name: 'Ollie', position: 'Goalkeeper' },
    { key: 'player', name: 'Pia', position: 'Striker' },
  ],
  away: [
    { key: 'owner', name: 'Ollie', position: 'Goalkeeper' },
    { name: 'Ada Cole', position: 'Striker' },
  ],
};

/**
 * The comment thread on KB Notify League.
 *
 * Pia writes the first comment so that Milo has something to reply to and to
 * like; Ollie writes a second top-level comment, which is what reaches Pia as
 * `LeaderboardComment`. A `LeaderboardComment` goes to the leaderboard's owner
 * and to its Administrators, and never to the commenter - measured both ways.
 */
export const COMMENTS = [
  { by: 'player', text: 'Who is free for a friendly on Saturday?' },
  { by: 'owner', text: 'Next month\'s fixtures are up. Check your availability.' },
  { by: 'mate', text: 'I can play. I will bring the bibs.', replyTo: 'Who is free' },
];

/** Milo likes this one of Pia's, which is what reaches her as `CommentLike`. */
export const LIKE_ON = 'Who is free';

/**
 * Pia's eleven notifications, oldest first - the order the seed makes them in.
 *
 * The modal shows them newest first and ten to a page, so `FriendAdded` sits
 * behind the scroll on a second page. That is deliberate: 20.1 tells the reader
 * that more load as they scroll, and an article should not say so on an account
 * where it cannot happen.
 *
 * `shows` is what the row reads on screen, with the fixture names substituted.
 * It is asserted, not decorative: three of these sentences carry a defect in
 * the app's own wording and the specs pin the text so that a later session
 * finds out when it is fixed. See `WORDING_DEFECTS`.
 *
 * `PlayerFollow` is NOT here. It fires once per pair of accounts and can never
 * be made again - see the header.
 */
export const NOTIFICATIONS = [
  { type: 'FriendAdded', from: 'owner', shows: 'Ollie KB added you to their friend list.' },
  // The space before the full stop is the app's, not a typo here: the team
  // name is its own button and the "." is a separate span after it. See
  // WORDING_DEFECTS.
  { type: 'TeamFollow', from: 'mate', shows: 'Milo KB started following KB Pia United .' },
  { type: 'PlayerTeamInvitation', from: 'owner', shows: 'Ollie KB invited you to join KB Notify FC' },
  // "Milo", not "Milo KB", and the team is Ollie's rather than Pia's. A
  // PlayerJoinedTeam reaches the team's Owner AND its Administrators, and Pia
  // cannot own the team somebody joins - on Free, POST /team-players refuses a
  // registered player outright. See scripts/seed-20.mjs.
  { type: 'PlayerJoinedTeam', from: 'mate', shows: 'Milo joined KB Notify FC team' },
  { type: 'LeaderboardAdminAdded', from: 'owner', shows: 'You are now admin of KB Notify League' },
  { type: 'LeaderboardComment', from: 'owner', shows: 'Ollie commented KB Notify League' },
  { type: 'CommentReply', from: 'mate', shows: 'Milo KB replied to your comment on KB Notify League' },
  { type: 'CommentLike', from: 'mate', shows: 'Milo KB Liked your comment comment on KB Notify League' },
  { type: 'MatchInvitation', from: 'owner', shows: 'Match scheduled KB Notify FC X KB Notify Rovers on 01 Dec 2026, 07:00 PM at KB Notify Astro' },
  { type: 'MatchLive', from: 'owner', shows: 'KB Notify FC X KB Notify Rovers match started!' },
  { type: 'MatchSummary', from: 'owner', shows: 'KB Notify FC won their latest match!' },
];

export const NOTIFICATION_COUNT = NOTIFICATIONS.length;

/** How many rows the modal fetches at a time. Read off the bundle: `tk = 10`. */
export const PAGE_SIZE = 10;

/**
 * Wording the app gets wrong, pinned so a later session notices a fix.
 *
 * None of it is documented in an article. briefs/19.md settled that rule after
 * the repo owner had a line about a mislabelled picker cut from 19.3: a defect
 * belongs in the brief, the report and a ticket, not in an article that teaches
 * a reader to work around it. All three are visible in 20.1's captures and the
 * prose passes over them.
 */
export const WORDING_DEFECTS = [
  { where: 'CommentLike row', reads: 'Liked your comment comment on', should: 'liked your comment on' },
  { where: 'LeaderboardComment row', reads: 'Ollie commented KB Notify League', should: 'commented on' },
  { where: 'TeamFollow row', reads: 'following KB Pia United .', should: 'no space before the full stop' },
  { where: 'TeamFollow email subject', reads: 'started following your team onScoryBoard!', should: 'on ScoryBoard' },
];

/**
 * Every email observed, and what causes it. This table IS article 20.2.
 *
 * Collected 2026-09-03 out of the four accounts' yopmail inboxes after driving
 * every flow this collection can reach. `subject` is the subject line with the
 * fixture names left in as `<Home>`, `<Away>` and `<Board>`; the app puts the
 * real names there, and `*` where a number would go on a match subject.
 *
 * `to` says who receives it. `shot` names the capture in 20.2 that shows the
 * body, where there is one.
 */
export const EMAILS = [
  {
    key: 'welcome',
    subject: 'Welcome to Scoryboard, set your password',
    cause: 'An administrator created your account for you',
    to: 'the new account',
    note: 'Not sent by an ordinary sign-up. Every account in this project is made with POST /admins/users, which is why all four inboxes hold one.',
  },
  {
    key: 'verification',
    subject: 'Your ScoryBoard verification code',
    cause: 'Signing up, and every Resend on the verification screen',
    to: 'the new account',
    shot: '03',
  },
  {
    key: 'reset',
    subject: 'We received a password reset request',
    cause: 'Asking for a password reset',
    to: 'the account named',
  },
  {
    key: 'team-invitation',
    subject: "You're Invited",
    cause: 'Somebody adds you to their team by email address',
    to: 'the person invited',
    shot: '02',
  },
  {
    key: 'player-joined',
    subject: 'New Player Joined Your Team',
    cause: 'Somebody accepts your invitation to your team',
    to: 'the team owner',
  },
  {
    key: 'friend',
    subject: 'Friend list invitation',
    cause: 'Somebody adds you to their friend list',
    to: 'the person added',
  },
  {
    key: 'player-follow',
    subject: '🎉 <Name> started following you on ScoryBoard!',
    cause: 'Somebody follows you',
    to: 'the person followed',
  },
  {
    key: 'team-follow',
    subject: '🎉 <Name> started following your team onScoryBoard!',
    cause: 'Somebody follows a team you own',
    to: 'the team owner',
  },
  {
    key: 'leaderboard-admin',
    subject: "You've been added as an admin to <Board>",
    cause: 'A leaderboard owner makes you an Administrator',
    to: 'the new Administrator',
  },
  {
    key: 'leaderboard-comment',
    subject: 'New comment on <Board>',
    cause: 'Somebody comments on a leaderboard you own or administer',
    to: 'the owner and every Administrator, never the commenter',
  },
  {
    key: 'comment-reply',
    subject: '<Name> replied to your comment on <Board>',
    cause: 'Somebody replies to your comment',
    to: 'the comment author',
    shot: '04',
  },
  {
    key: 'comment-like',
    subject: '<Name> liked your comment on <Board>',
    cause: 'Somebody likes your comment',
    to: 'the comment author',
  },
  {
    key: 'match-invitation',
    subject: 'Match Invitation -  <Home>  vs  <Away>',
    cause: 'A match is created with you in the line-up',
    to: 'every player in either line-up',
    shot: '01',
  },
  {
    key: 'match-live',
    subject: '⚽ It’s Match Time – <Home> vs<Away> is Live!',
    cause: 'The match is started',
    to: 'every player in either line-up',
  },
  {
    key: 'match-summary',
    subject: 'Match Summary: <Home> * - * <Away>',
    cause: 'The match is finished',
    to: 'every player in either line-up, and people who follow one of them',
    note: 'Milo received one for a match he was not in. He follows Pia, who played in it.',
  },
];

/**
 * The sender, on staging.
 *
 * `Staging Scoryboard <noreply@scoryboard.com>` - the address is the production
 * one and the display name is not. 20.2 and 20.3 name the ADDRESS and never the
 * display name, because the display name is a staging artefact and telling a
 * reader to look for "Staging Scoryboard" would be wrong.
 */
export const SENDER_ADDRESS = 'noreply@scoryboard.com';

/**
 * The footer line every one of these carries, quoted in 20.2 and 20.3.
 *
 * It is the answer to "how do I unsubscribe from these" and it is the app's own
 * words, so it is quoted rather than paraphrased.
 */
export const TRANSACTIONAL_FOOTER =
  'This e-mail is a transactional e-mail relating to your Scoryboard account. '
  + 'It is not a marketing or promotional e-mail, so therefore doesn’t contain an unsubscribe link.';

/** The marketing opt-in on Profile settings, in the app's own words. */
export const MARKETING_OPT_IN =
  'Yes! I want early access to new tools, features and limited-time deals!';

/**
 * Which of Pia's four emails 20.2 photographs, and how each one is narrowed.
 *
 * `match` is a regular expression against the subject line, because the
 * subjects carry fixture names and the match ones carry a score.
 * `mask` names what the capture paints over.
 */
export const EMAIL_SHOTS = [
  {
    n: '01', box: 'player', match: /^Match Invitation/,
    name: '01-email-match-invitation',
    mask: 'the kick-off line, which carries an absolute date and time',
  },
  {
    n: '02', box: 'mate', match: /^You're Invited$/,
    name: '02-email-team-invitation',
    mask: 'none',
  },
  {
    n: '03', box: 'empty', match: /verification code/,
    name: '03-email-verification-code',
    mask: 'the six-digit code',
  },
  {
    n: '04', box: 'player', match: /replied to your comment/,
    name: '04-email-comment-reply',
    mask: 'none',
  },
];

/**
 * Activity types the Trending strip knows, and the emoji it prints for each.
 *
 * Read out of the bundle and confirmed against `GET /activities` on staging.
 * `TournamentCreated` has an emoji and is not in any of the three grouping
 * arrays, which is why its card falls through to the tournament branch.
 */
export const ACTIVITY_EMOJI = {
  MatchLive: '⚽',
  MatchInvitation: '📣',
  MatchSummary: '📊',
  MatchFinished: '🏁',
  MatchTeamWon: '🏆',
  PlayerJoinedTeam: '🤝',
  TeamCreated: '🆕',
  TournamentCreated: '🏟️',
  UserJoinedPlatform: '🚀',
  PlayerOfMatch: '⭐',
  PlayerFollow: '👤',
  TeamFollow: '⭐',
};

/** `referenceType` on an activity, and the blue label the card prints for it. */
export const ACTIVITY_LABELS = {
  match: 'Match',
  team: 'Team',
  player: 'Player',
  user: 'Player',
  friend: 'Player',
  leaderboard: 'Leaderboard',
  comment: 'Leaderboard',
  tournament: 'Tournament',
};

/**
 * The tournament that exists so the Trending strip has a Tournament card.
 *
 * Nothing else in this collection touches it. `TournamentCreated` is the only
 * activity type this collection can cause that carries the Tournament label,
 * and 20.4's second shot is about what that label means.
 */
export const TOURNAMENT = 'KB Notify Cup';

/**
 * Which rows of the global feed belong to this collection.
 *
 * `GET /activities` is a platform-wide feed with no "mine only" parameter, so
 * the raw panel shows other collections' fixtures and other people's accounts.
 * docs/style-guide.md forbids a capture that carries another persona's data.
 * Collection 02 solved this on article 02.1 by routing the request in the spec
 * and keeping only its own rows; this is the same narrowing, against this
 * collection's own names. Nothing is fabricated - it is the real payload,
 * filtered - and it lives in the spec, so a re-run reproduces it.
 */
export const OURS = /KB Notify|KB Pia United|Pia KB|Ollie KB|Milo KB|Emmy KB/;

/** The Trending panel's own strings, for the gates and the empty-state note. */
export const TRENDING = {
  title: 'Trending',
  empty: 'No trending activity yet.',
  prev: 'Previous trending activities',
  next: 'Next trending activities',
  /** The carousel re-scrolls itself on this interval. See parkTrending(). */
  autoAdvanceMs: 2500,
};

/**
 * **Not used.** Collection 20 does not freeze the clock, and that is a
 * decision rather than an omission - see NO_CLOCK_FREEZE_20 in lib/kb.ts.
 *
 * Every screen this collection photographs shows a RELATIVE stamp - "2 minutes
 * ago" on a notification row, "7 minutes ago" on a Trending card - computed
 * against `Date.now()`. Freezing it does not stabilise those, it corrupts
 * them: measured with this instant against a 06:05 UTC seed, every row read
 * "3 hours ago", and a seed that ran later would render them as "in 3 hours".
 *
 * Kept so a later session that finds a reason to freeze has a value to freeze
 * to.
 */
export const FROZEN_NOW = '2026-09-03T09:00:00.000Z';

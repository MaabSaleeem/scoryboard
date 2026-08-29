// Collection 04 - "Plans & membership". The names, the accounts and the numbers
// that `scripts/seed-04.mjs` writes and the specs read, so a spec cannot drift
// from what the seed produced.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// Nothing outside the three addresses below is ever written to.

export const ACCOUNTS = {
  // The reader. Free, and it STAYS Free: every gate capture in 04.3 comes from
  // it, and every one of them disappears the moment the account turns Pro.
  free: 'kb-manager-free-04@yopmail.com',
  // At rest Pro. Produces the "seen by a Pro member" half of 04.1 and 04.3
  // without any spec having to flip a membership first, so the specs run in any
  // order. docs/style-guide.md, "Actions you can only do once": a free_pro
  // article gets two seeded accounts, never one flipped between captures.
  pro: 'kb-04-pro@yopmail.com',
  // The one account 04.2 actually upgrades, through the app, the way a reader
  // does. There is no confirm step to photograph instead - selecting
  // "Upgrade to PRO" upgrades you on the spot - so the spec performs the
  // upgrade and then puts the account back to Free with the admin API.
  upgrade: 'kb-04-upgrade@yopmail.com',
};

export const PROFILES = {
  free: { name: 'Marc', lastName: 'KB' },
  pro: { name: 'Nia', lastName: 'KB' },
  upgrade: { name: 'Ubi', lastName: 'KB' },
};

// The one team the specs name. Created by the seed rather than reused from the
// two teams every account is born with ("<First> K FC" and "<First> K FC Away"),
// because those names are derived from the account name and gain a date suffix
// when they clash - Nia's are "Nia K FC 2908". A fixed name keeps the Select
// Team dropdown in 04.3's team-admin capture readable and stable.
export const TEAM = 'KB 04 FC';

// The Free friend limit is 14. Read out of the app bundle
// (`memberShip.friendLimitMessage`: "You can add up to 14 friends with a Free
// account") and confirmed on staging: at 14 the next POST /friends answers
// 400 USER_FREE_LIMIT_EXCEEDED.
export const FRIEND_LIMIT = 14;

// Exactly fourteen fixed names, so the list sits ON the limit and the next add
// is the one that is refused. No faker, no counters, no timestamps.
export const FRIENDS = [
  'Bea Booth', 'Caleb Cross', 'Dana Dunne', 'Ewan Ellis',
  'Fay Farrow', 'Gus Grant', 'Hana Hale', 'Ivo Innes',
  'Jodie Jarrett', 'Kai Keller', 'Lena Lomax', 'Milo Mercer',
  'Nadia Nowak', 'Otto Oakley',
];

// The friend 04.3 tries to add as the fifteenth. The seed never creates it -
// its whole job is to be refused.
export const FRIEND_OVER_LIMIT = 'Zara Zenn';

// The friend 04.3 tries to make a team Administrator. Any of the fourteen would
// do; naming one keeps the capture the same every run.
export const FRIEND_FOR_ADMIN = 'Bea Booth';

// Every Free-plan limit the app enforces, with the error code the API returns,
// the modal title and the modal message the reader actually sees.
//
// Titles and messages are the app's own i18n strings (`memberShip.*` in the
// bundle), NOT the API's `reason` text - the modal is keyed off the error code
// and renders its own wording. The two differ: the API says "upgrade to Pro",
// the modal says "upgrade to Pro Membership". The reader sees the modal.
//
// `shot` names the capture in 04.3 that shows it. null means 04.3 states the
// limit in its table with no screenshot, and `why` says what reaching it costs.
export const LIMITS = [
  {
    key: 'friends',
    what: 'Friends in your friends list',
    free: '14',
    pro: 'Unlimited',
    errorCode: 'USER_FREE_LIMIT_EXCEEDED',
    apiReason: 'Free plan users can only add up to 14 friends. Upgrade to Pro for unlimited friends.',
    title: 'Friend Limit Reached',
    message: 'You can add up to 14 friends with a Free account. Upgrade to Pro Membership to add unlimited friends and grow your network.',
    shot: '01',
  },
  {
    key: 'team-admins',
    what: 'Administrators on a team',
    free: 'none - Owner only',
    pro: 'More than one',
    errorCode: 'TEAM_ADMIN_LIMIT_EXCEEDED',
    apiReason: 'Free plan users cannot add team admins. Upgrade to Pro to add admins.',
    title: 'Team Limit Reached',
    message: 'Free plan users can not add team admins. Upgrade to Pro Membership to add admins.',
    shot: '02',
  },
  {
    key: 'leaderboard-count',
    what: 'Leaderboards you own',
    free: '1',
    pro: 'Unlimited',
    errorCode: 'LEADERBOARD_CREATION_LIMIT_EXCEEDED',
    apiReason: 'Free plan users can create only 1 leaderboard. Delete your current leaderboard or upgrade to Pro to create another.',
    title: 'Leaderboard Limit Reached',
    message: 'Free plan users can create only 1 leaderboard. Delete your current leaderboard or upgrade to Pro Membership to create another.',
    shot: '03',
  },
  {
    key: 'leaderboard-admins',
    what: 'Administrators on a leaderboard',
    free: 'none - Owner only',
    pro: 'More than one',
    errorCode: 'LEADERBOARD_ADMIN_LIMIT_EXCEEDED',
    apiReason: 'Free plan users cannot add leaderboard admins. Upgrade to Pro to add admins.',
    title: 'Leaderboard Admin Limit Reached',
    message: 'Free plan users can not add leaderboard admins. Upgrade to Pro Membership to add admins.',
    shot: '04',
  },
  {
    key: 'compare',
    what: 'Compare your stats with another player',
    free: 'blocked',
    pro: 'yes',
    errorCode: null,
    title: 'Unlock Compare with Pro',
    message: 'Compare is available for Pro members only. Upgrade to compare player stats side by side and get deeper insights.',
    shot: '05',
  },
  {
    key: 'profile-views',
    what: 'See who has viewed your profile',
    free: 'blocked - the count only',
    pro: 'the list of viewers',
    errorCode: null,
    title: 'Unlock Profile Views',
    message: 'Profile views are available for Pro members only.',
    shot: '06',
  },
  {
    key: 'chat',
    what: 'Read incoming messages in full, and open attachments',
    free: 'blocked - you can still start a chat and send',
    pro: 'yes',
    errorCode: 'CHAT_PRO_REQUIRED',
    title: 'Unlock full chat with Pro',
    message: 'You can start conversations and send messages on Free, but reading full incoming messages and opening attachments is a Pro feature.',
    shot: null,
    why: 'reaching it needs an unread incoming message from a second account. A chat history is not idempotent - it grows every run - so this collection states the limit and leaves the capture to collection 18, which owns chat.',
  },
  {
    key: 'one-friend-per-team',
    what: 'The same friend on more than one of your teams',
    free: 'one team each',
    pro: 'any number',
    errorCode: 'ONE_FRIEND_PER_TEAM',
    apiReason: 'On free plan, each friend can only be added to one team.',
    title: 'Team Limit Reached',
    message: 'This player is part of another team. Remove them from that team before adding them to this team.\n\nWith a Free account, a friend can be added to only one team. Upgrade to Pro Membership to add the same friend to multiple teams.',
    shot: null,
    why: 'not reachable through the app. A friend who joins one of your teams leaves your Friends list, and the two controls that could offer them again - the friends list and "Select player from friend list" - both read that same list. The API returns the code; no screen produces it. See briefs/04.md, open question 1.',
  },
  {
    key: 'substitutes',
    what: 'Substitutes in a team lineup',
    free: '3',
    pro: 'Unlimited',
    errorCode: null,
    title: null,
    message: 'Upgrade to Pro Membership to add more substitutes to your lineup.',
    shot: null,
    why: 'reaching it needs a match with a full lineup and a fourth substitute - collection 10 territory.',
  },
  {
    key: 'match-media',
    what: 'Photos and video on a match feed',
    free: 'blocked',
    pro: 'Unlimited',
    errorCode: null,
    title: null,
    message: 'You need a Pro membership to add videos and images to your match feed.',
    shot: null,
    why: 'needs a finished match with a comment feed - collection 19 territory.',
  },
  {
    key: 'ads',
    what: 'Adverts',
    free: 'shown',
    pro: 'none',
    errorCode: null,
    title: null,
    message: null,
    shot: null,
    why: 'the plans screen lists "Ads enabled" on Basic and "Ads Free" on Pro. Nothing in the staging app renders an advert, so there is nothing to photograph.',
  },
];

// Every line of the two platform plan cards, as the app serves them from
// /api/prismic/subscription-plans. The specs assert against these, so a change
// to the plan content fails the run rather than quietly changing what 04.1
// shows a reader.
export const PLAN_CARDS = {
  basic: {
    title: 'BASIC',
    price: 'FREE',
    features: [
      'Limited friends in the friends list',
      'Limited lineup features',
      'Limited team features',
      'Limited leaderboard features',
      'Limited match features',
      'Basic customizations',
      'Request payments from players',
      'Ads enabled',
    ],
  },
  pro: {
    title: 'PRO',
    price: 'FREE',
    priceSuffix: '(with Beta)',
    badge: 'Most Popular',
    button: 'Upgrade to PRO',
    features: [
      'Everything in Basic',
      'Unlimited friends in your friends list',
      'Unlimited substitutes in the team lineup',
      'Compare your stats with other players',
      'Add unlimited media to your matches',
      'More than one admin for teams and leaderboards',
      'Request payments from players',
      'Ads Free',
      'Chat with other players',
      'Profile views for your teams and leaderboards',
      'Many more cool features',   // carries a "Coming soon" marker
    ],
  },
};

// Strings the specs wait on. All read off the live app on 2026-08-29.
export const UPGRADE_BUTTON = 'Upgrade to PRO';
export const GATE_UPGRADE_BUTTON = 'FREE Upgrade (Beta)';
export const PRO_ACTIVE_BUTTON = 'You are now a Pro member';
export const CANCEL_SUBSCRIPTION = 'Cancel subscription';
export const CONGRATULATIONS = 'Congratulations, you are now a Pro member!';
export const ACTIVE_PLAN_HEADING = 'Your active subscriptions plan';
export const PLANS_HEADING = 'Choose A Package That Fits Your Team';

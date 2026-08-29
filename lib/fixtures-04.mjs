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
  // --- Tournament Pro, 04.4 to 04.6 -----------------------------------------
  // Tournament Pro is a different product from the membership above: it is per
  // tournament, it is real money, and it is bought through Stripe. Nothing here
  // buys anything. The captures stop at the last Scoryboard screen.
  //
  // Owns one Basic tournament and has NO free Tournament Pro slots, so the
  // paywall is reachable. Kept off the manager_free persona so that account
  // stays what it is: an account sitting exactly on the Free membership limits.
  organiser: 'kb-04-organiser@yopmail.com',
  // Has a free Tournament Pro grant, which is the whole subject of 04.6. It has
  // to be a separate account: the grant has no revoke, so an account that has
  // one can never show the paywall again.
  grant: 'kb-04-grant@yopmail.com',
};

export const PROFILES = {
  free: { name: 'Marc', lastName: 'KB' },
  pro: { name: 'Nia', lastName: 'KB' },
  upgrade: { name: 'Ubi', lastName: 'KB' },
  organiser: { name: 'Ola', lastName: 'KB' },
  grant: { name: 'Gia', lastName: 'KB' },
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


// --- Tournament Pro ---------------------------------------------------------

/** The one Basic tournament 04.5's Choose a Tournament dialog lists. */
export const TOURNAMENT = 'KB 04 Cup';
export const TOURNAMENT_DATES = {
  startDate: '2026-10-03T09:00:00.000Z',
  endDate: '2026-10-04T18:00:00.000Z',
};

/** How many free Tournament Pro slots 04.6's account holds. */
export const FREE_PRO_SLOTS = 2;

/**
 * The three tournament plans, as the app serves them from
 * /api/prismic/subscription-plans for GBP. Prices are real money.
 *
 * `advertisedTeams` on Basic is what the CARD says. `enforcedTeams` is what the
 * app actually stops you at - "Tournament Pro is required to add more than 8
 * teams to a group", read out of the bundle. They disagree, and 04.4 says both
 * rather than picking one.
 */
export const TOURNAMENT_PLANS = {
  basic: {
    title: 'BASIC',
    price: 'FREE',
    button: 'Start with BASIC',
    advertisedTeams: 5,
    enforcedTeams: 8,
    features: [
      'Up to 5 teams',
      'Manage participants',
      'Schedule and format tool',
      'Public website',
      'Slideshow',
    ],
  },
  pro: {
    title: 'PRO',
    price: { GBP: '£19.99', EUR: '€22.99', USD: '$24.99' },
    button: 'Start with PRO',
    features: [
      'Everything in Basic',
      'Unlimited teams',
      'List all your sponsors',
      'Advanced slideshow',
      'Tournament Chat',
      'Export to PDF/CSV',
      'Request joining fee',   // Coming soon
      'Registration',          // Coming soon
    ],
  },
  annual: {
    title: 'ANNUAL',
    price: { GBP: '£215', EUR: '€248' },
    priceSuffix: '(10% discount)',
    button: 'Start with ANNUAL',
    features: [
      'Everything from Pro',
      '10% discount',
      'Unlimited tournaments',
    ],
  },
};

/** Everything Basic is stopped at, in the app's own words. */
export const TOURNAMENT_PRO_GATES = [
  'Tournament Pro is required to add more than 8 teams to a group.',
  'Tournament Pro is required to add more than 8 teams to a bracket.',
  'Tournament Pro is required to manage sponsors.',
  'Tournament Pro is required to export fixtures.',
];

// Strings on the Tournament Pro tab and the selector dialog.
export const TOURNAMENT_TAB = 'Tournament Pro';
export const TOURNAMENT_HEADING = 'Tournament Pro plans';
export const PRO_SELECTOR_TITLE = 'Choose a Tournament for PRO';
export const PRO_SELECTOR_EMPTY = 'No Basic tournaments available';
export const PRO_SELECTOR_CONTINUE = 'Continue with PRO';
export const FREE_SLOTS_TITLE = 'Free Tournament Pro slots remaining';

/**
 * Where the captures stop.
 *
 * "Continue with PRO" posts to /tournaments/:id/billing/checkout-session and
 * "Start with ANNUAL" opens a Stripe `embedded-checkout` iframe in place. Both
 * are the payment gateway. No spec in this collection selects either.
 */
export const STRIPE_BOUNDARY = {
  pro: 'Continue with PRO',
  annual: 'Start with ANNUAL',
};

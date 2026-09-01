// The accounts and fixtures collection 17 runs on, in one place.
//
// `scripts/seed-17.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced.
//
// Collection 17 is "Collecting & making payments" - the organiser asking for
// money and the player paying it. REAL MONEY in production; Stripe TEST MODE
// only here.
//
// --- The one thing to understand before reading further -------------------
//
// **Nothing in this collection works without a connected payout account.**
// Found on staging 2026-09-01, at both layers:
//
//   - In the app, **Request Payment** does not open a form while the signed-in
//     account has no connected account. It fires `POST /payments/stripe/account`,
//     then `POST /payments/stripe/account-session`, and renders Stripe's
//     `stripe-connect-account-onboarding` component in a dialog. Pressing
//     **Add information** inside it opens a **new browser window** at
//     `connect.stripe.com`. That window is where Scoryboard ends.
//   - At the API, `POST /payments` answers `500 {"message":"internal error"}`
//     for every account whose payout account is not live. The body validates
//     first - a bad `feeAllocation` is refused with a schema error - so the 500
//     is the Stripe side, not the request.
//
// Verified against three accounts: Mo with a `Pending` Stripe account, Nils with
// none, and Pia (Free) with none. All three 500. There is no admin endpoint that
// enables a payout account; `config/api.md`'s admin list has nothing for it.
//
// **Stripe's signup is CAPTCHA-gated.** Automating the onboarding is therefore
// not possible from here: the submit step raises an hCaptcha challenge
// ("Identify the TWO characters that are partially hidden behind a line"). The
// payout account on `kb-manager-pro-17@` was connected by a human, once, in
// Stripe test mode. If it is ever reset, a human has to do it again - see
// `briefs/17.md`, "The payout account".
//
// --- What that means for the specs ---------------------------------------
//
// Two groups of articles, and they have different preconditions:
//
//   17.1, 17.2   run on **kb-17-nopayout@**, which has NO connected account and
//                must keep it that way. They photograph the empty Payment page
//                and the way in to Stripe, and they stop at the handoff.
//   17.3 - 17.9  run on **kb-manager-pro-17@**, whose payout account is live.
//
// Never sign 17.1 or 17.2 in as Mo. His account is connected, so the "Get
// started with payments" state those two articles are about no longer exists on
// it, and it cannot be put back.
//
// --- Four accounts, all addressed to this collection ---------------------
//
// config/personas.yaml, account_isolation. Collection 17 never signs in to
// another collection's account.
//
//   kb-manager-pro-17   Mo KB. PRO. The persona. Owns the team, the leaderboard,
//                       the venue and the match. **Payout account connected**
//                       (Stripe test mode). Every request in this collection is
//                       sent by him.
//   kb-player-17        Pia KB. Free. Plain **Player** on KB 17 United, and the
//                       one who receives and pays a request. 17.8's persona.
//   kb-17-admin         Ada KB. Free. **Administrator** on KB 17 United. The role
//                       contrast: an Administrator sees the team's PAYMENT tab
//                       but gets only the **Pay** sub-tab and no **Request
//                       Payment** button.
//   kb-17-nopayout      Nils KB. PRO, and deliberately never onboarded. The only
//                       account that can still show the "Get started with
//                       payments" state and the Stripe handoff. 17.1 and 17.2.
//
// --- What pressing Request Payment does to kb-17-nopayout ----------------
//
// It creates a Stripe account row (`onboardingStatus: "Pending"`,
// `chargesEnabled: false`) as a side effect, and there is no way to remove it.
// That is harmless and the specs may re-run: the Payment page renders the same
// "Get started with payments" state whether the status is `null` or `Pending`.
// Checked both ways on 2026-09-01. What must never happen is somebody finishing
// Stripe's onboarding on this account - that would consume the fixture for good.

export const ACCOUNTS = {
  pro: 'kb-manager-pro-17@yopmail.com',
  player: 'kb-player-17@yopmail.com',
  admin: 'kb-17-admin@yopmail.com',
  nopayout: 'kb-17-nopayout@yopmail.com',
};

// PUT /users/:id is a full replace: every write sends the whole profile, or the
// API answers 400 "gender is required" (config/api.md).
export const PROFILES = {
  pro: {
    name: 'Mo', lastName: 'KB', gender: 'Male', position: 'CentralMidfielder',
    dateOfBirth: '1990-04-12', sports: ['Football'], bio: 'Runs KB 17 United.',
    isMarketingOpted: false, isTourCompleted: true,
  },
  player: {
    name: 'Pia', lastName: 'KB', gender: 'Female', position: 'Striker',
    dateOfBirth: '1994-08-03', sports: ['Football'], bio: 'Plays for KB 17 United.',
    isMarketingOpted: false, isTourCompleted: true,
  },
  admin: {
    name: 'Ada', lastName: 'KB', gender: 'Female', position: 'CenterBack',
    dateOfBirth: '1992-01-21', sports: ['Football'], bio: 'Helps run KB 17 United.',
    isMarketingOpted: false, isTourCompleted: true,
  },
  nopayout: {
    name: 'Nils', lastName: 'KB', gender: 'Prefer not to say', position: 'Goalkeeper',
    dateOfBirth: '1988-11-30', sports: ['Football'], bio: 'Has not set up payouts.',
    isMarketingOpted: false, isTourCompleted: true,
  },
};

export const LEADERBOARD = 'KB 17 Sunday League';

export const TEAMS = {
  united: 'KB 17 United',
  rovers: 'KB 17 Rovers',
};

// Every account is born with two teams whose names carry a date suffix. The seed
// renames rather than creates, so match the born pattern first.
export const BORN_TEAMS = {
  united: /^Mo K FC(?! Away)/,
  rovers: /^Mo K FC Away/,
};

export const VENUE = { name: 'KB 17 Astro', location: 'Hackney, London' };

export const MATCH_DEFAULTS = {
  duration: '60 min',
  teamSize: '5 VS 5',
  formation: '2-1-1',
};

export const POSITIONS = ['Goalkeeper', 'CenterBack', 'CentralMidfielder', 'Striker', 'Striker'];

// The team sheet. Three accounts with roles, plus three name-only members so the
// Select Players list has more rows than the article's subject.
//
// Name-only members are NOT registered players. The Select Players list says
// "No registered players found." when a team has none, and it offers only the
// registered ones - so a request can be addressed to Pia and Ada but not to the
// three below. That is why there are exactly two payable members.
export const SQUADS = {
  united: {
    accounts: [
      { key: 'pro', role: 'Owner' },
      { key: 'admin', role: 'Administrator' },
      { key: 'player', role: 'Player' },
    ],
    friends: ['Femi KB', 'Gus KB', 'Hana KB'],
  },
  rovers: {
    accounts: [{ key: 'pro', role: 'Owner' }],
    friends: ['Ivo KB', 'Jae KB', 'Kit KB', 'Lars KB'],
  },
};

// Mo's friends list, for the third request source. Name-only friends, so the
// Select Friends list is populated without pulling another account in.
export const FRIENDS = ['Femi KB', 'Gus KB', 'Hana KB'];

// A fixed future date. A match created with a date in the past starts itself a
// second or two after POST /matches answers (config/api.md), so this has to stay
// ahead of the clock. Move it and re-seed when it goes by; the seed refuses to
// run once it has.
export const MATCH = {
  key: 'league',
  home: 'united',
  away: 'rovers',
  date: '2027-03-14T15:00:00.000Z',
  duration: MATCH_DEFAULTS.duration,
  teamSize: MATCH_DEFAULTS.teamSize,
  tag: 'league',
};

// The clock the specs freeze to. Before MATCH.date, so the fixture reads as
// upcoming, and a stable "today" for the due-date picker in the request form.
export const FROZEN_NOW = '2026-09-05T09:00:00.000Z';

// The due date every request fixture carries. Fixed, so a screenshot of the
// table says the same thing on every run.
export const DUE_DATE = '2026-09-30T12:00:00.000Z';

/**
 * The transaction fee, exactly as the app computes it.
 *
 * Read off the bundle on 2026-09-01 - there is no endpoint that quotes it, the
 * arithmetic is done in the browser:
 *
 *   base    = pounds
 *   b       = round(base * 100)          // pence
 *   v       = round(b * 2 / 100)         // Scoryboard's 2%
 *   total   = ceil((b + v + 20) / 0.985) / 100
 *   fee     = total - base
 *
 * The +20 is 20p and the /0.985 grosses up Stripe's 1.5%. Article 17.5 quotes
 * the numbers this returns rather than inventing any.
 */
export function feeBreakdown(basePrice) {
  const b = Math.round(basePrice * 100);
  const v = Math.round((b * 2) / 100);
  const total = Math.ceil((b + v + 20) / 0.985) / 100;
  return { basePrice, total, fee: Number((total - basePrice).toFixed(2)) };
}

// The request fixtures. Titles are fixed and short - the form caps the title at
// 40 characters and the description at 100 (zod schema, read off the bundle).
export const REQUESTS = {
  // The one 17.7 and 17.9 photograph. Left alone by every other spec.
  tracked: {
    title: 'KB 17 Pitch hire',
    description: 'Sunday league pitch hire, March.',
    basePrice: 10,
    feeAllocation: 'PassThrough',
    entity: 'Team',
  },
  // The one 17.6 edits, reminds on and cancels. A spec that mutates a fixture
  // puts it back itself - 17.6 recreates this one at the end.
  scratch: {
    title: 'KB 17 Kit levy',
    description: 'One-off kit contribution.',
    basePrice: 15,
    feeAllocation: 'Absorb',
    entity: 'Team',
  },
  // The one Pia pays in 17.8.
  payable: {
    title: 'KB 17 Match fee',
    description: 'Match fee for the league fixture.',
    basePrice: 5,
    feeAllocation: 'PassThrough',
    entity: 'Match',
  },
  // 17.9's Cancelled status, seeded rather than made by a spec.
  //
  // A cancelled request cannot be deleted - DELETE /payments/:id sets the status
  // and the row stays for ever. So a spec that cancelled one of the others would
  // add a dead row on every run and change what 17.7 photographs. This one is
  // cancelled once, by the seed, and every later run finds it and leaves it.
  cancelled: {
    title: 'KB 17 Away travel',
    description: 'Coach to the away fixture.',
    basePrice: 8,
    feeAllocation: 'PassThrough',
    entity: 'Team',
    cancelAfterCreate: true,
  },
};

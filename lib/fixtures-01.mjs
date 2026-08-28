// The accounts collection 01 runs on, in one place.
//
// `scripts/seed-01.mjs` builds them and the specs read them, so a spec cannot
// drift from what the seed produced. Collection 14 learned this: three of its
// specs re-time a fixture and the target values had to live somewhere both
// sides could see.
//
// Seven accounts, and why each one exists. Collection 01 needs more than one
// because the flows it documents CONSUME the state they document - a signup can
// only be photographed on an address that has never signed up, and an account
// can only be deleted once.
//
//   kb-fresh-01     the persona. Built the way a real reader is built - Firebase
//                   signup, POST /users, email verified - never through
//                   POST /admins/users, which is not the same account (see
//                   ADMIN_CREATE_IS_NOT_FRESH below). 01.2, 01.5, 01.6.
//   kb-01-signup    01.1's address. Deleted so the signup can run again, and
//                   left UNVERIFIED on purpose: 01.1 stops at the code screen.
//   kb-01-wizard    01.4's address. The wizard runs once per account, so the
//                   spec deletes this one and signs it up again every run.
//   kb-01-reset     01.3's address. Recreated with no password each run, so the
//                   spec can always set one (Firebase refuses a reset that does
//                   not change the password).
//   kb-01-owner     the team owner who sends the invitation 01.3 shows.
//   kb-01-invited   the invited address. Deleted every run, so the invitation
//                   really is addressed to someone with no account.
//   kb-01-delete    01.7's address. Deleted through the UI by the spec, which
//                   then recreates it.

export const PASSWORD = process.env.KB01_PASSWORD;

export const ACCOUNTS = {
  fresh: 'kb-fresh-01@yopmail.com',
  signup: 'kb-01-signup@yopmail.com',
  wizard: 'kb-01-wizard@yopmail.com',
  reset: 'kb-01-reset@yopmail.com',
  owner: 'kb-01-owner@yopmail.com',
  invited: 'kb-01-invited@yopmail.com',
  doomed: 'kb-01-delete@yopmail.com',
};

/**
 * What Step 1 of the wizard is filled in with, for every account the seed
 * builds through the real signup path.
 *
 * These are the fields `POST /users` takes, and they are the fields the wizard's
 * Personal information form collects. Date of birth is NOT among them - the
 * form has no such field - which is why a brand-new account always shows one
 * missing field on Profile settings. 01.6 is about that.
 */
export const PERSONAL_INFO = {
  fresh: { name: 'Fresh', lastName: 'KB', gender: 'Prefer not to say', sports: ['Football'], position: 'Striker' },
  wizard: { name: 'Wes', lastName: 'KB', gender: 'Prefer not to say', sports: ['Football'], position: 'Striker' },
};

/** The team kb-01-owner invites from, and the name the invitation carries. */
export const INVITE = {
  teamName: 'Ola K FC',        // created for the owner by POST /admins/users
  inviteeName: 'Ivy KB',
};

/**
 * POST /admins/users is NOT how a reader's account is made.
 *
 * Observed on staging, 2026-08-28. Both paths create two default teams named
 * after the account - "Fresh K FC" and "Fresh K FC Away". Only the admin path
 * also creates "<Name>'s leaderboard", and a Free account may hold exactly one
 * leaderboard. So an admin-created account cannot reach the empty-leaderboard
 * screens at all: Create New Leaderboard opens "Leaderboard Limit Reached"
 * instead of the create form.
 *
 * The admin path also leaves gender, sports and position unset, which a real
 * signup always fills in, so the Profile settings checklist reads four missing
 * fields rather than the one a reader sees.
 *
 * Kept here as a note rather than in the brief alone, because it is the reason
 * scripts/seed-01.mjs is longer than every other seed in this repo.
 */
export const ADMIN_CREATE_IS_NOT_FRESH = true;

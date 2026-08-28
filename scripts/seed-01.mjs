// Idempotent seed for collection 01 - "Getting started & onboarding".
//
//   node scripts/seed-01.mjs
//
// Safe to re-run. Every account is looked up first and only rebuilt when its
// state has drifted, so a second run makes almost no writes. Nothing here reads
// a clock, a random value, or a mailbox.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the seven addresses in lib/fixtures-01.mjs, all of
// them kb-fresh-01@ or kb-01-*@. It never touches another collection's.
//
// Why this seed is longer than the others: collection 01 documents the flows
// that CREATE an account, and every one of them consumes the state it shows.
// A signup can only be photographed on an address that has never signed up. The
// setup wizard runs once. An account can only be deleted once. So most of the
// work here is tearing accounts back down rather than building them up.
//
// --- Why the persona is not simply POST /admins/users --------------------
//
// That endpoint is how every other collection builds its persona, and on its own
// it produces an account no reader has:
//
//   * it creates "<Name>'s leaderboard", and a Free account may hold exactly one
//     leaderboard - so Create New Leaderboard opens "Leaderboard Limit Reached"
//     instead of the form 01.5 documents;
//   * it leaves gender, sports and position empty, which no real signup does, so
//     Profile settings reads "4 highlighted fields are still missing" instead of
//     the 1 a reader sees - and that count is 01.6's subject;
//   * it sets no password, and 01.2 signs in with one.
//
// So the account is created that way and then brought to a reader's state:
//
//   1. POST /admins/users                     - verified account, two teams
//   2. identitytoolkit accounts:update        - give it a password
//   3. PUT /users/:id                         - the fields Step 1 collects
//   4. DELETE /leaderboards/:id               - drop the leaderboard step 1 makes
//
// --- Why not sign it up for real -----------------------------------------
//
// An earlier version of this script did exactly that: accounts:signUp,
// POST /users, then the six-digit code read out of the yopmail inbox. It worked,
// and it is the closest possible reproduction of a reader's account. It was
// replaced because yopmail began demanding a CAPTCHA partway through this
// collection's exploration, and every mail-reading path stopped at once. A seed
// that cannot run without a third-party mailbox is not a seed.
//
// The one difference left is `signupMethod`, which a real signup sets to "email"
// and this leaves unset. Nothing in the web app reads it: the Profile settings
// panel that says "You signed in with ..." reads Firebase's providerData, and
// step 2 above puts `password` in there.

import 'dotenv/config';
import {
  admin, asUser, mintSession, firebaseSignIn, firebaseSetPassword, deleteAccount, j,
} from '../lib/api.mjs';
import { ACCOUNTS, PASSWORD, PERSONAL_INFO, INVITE } from '../lib/fixtures-01.mjs';

if (!PASSWORD) throw new Error('KB01_PASSWORD missing from .env - see .env.example');

const ids = {};
const note = (method, path, status, detail) =>
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(46)} -> ${status}  ${detail ?? ''}`);

/** The account's Scoryboard user plus a session token, or null if there is none. */
async function lookup(email) {
  try {
    const session = await mintSession(email);
    const me = (await asUser(session.idToken, '/users/me')).body?.data ?? null;
    return me ? { ...me, token: session.idToken } : null;
  } catch {
    return null;
  }
}

/** Create the account, if it is not there already. Verified, no password yet. */
async function ensureAccount(email, name) {
  const existing = await lookup(email);
  if (existing) {
    note('GET', '/users/me', 200, `${email} exists - id=${existing.id}`);
    return existing;
  }
  const made = await admin('/admins/users', {
    method: 'POST', body: { name, lastName: 'KB', email },
  });
  if (!made.ok) throw new Error(`POST /admins/users ${email}: ${j(made.body)}`);
  note('POST', '/admins/users', made.status, `${email} uid=${made.body.data.uid}`);
  const me = await lookup(email);
  if (!me) throw new Error(`${email} was created but has no Scoryboard user`);
  return me;
}

/**
 * Give the account the collection's password, so 01.2 can sign in with it.
 *
 * Returns a usable session for the account. Changing a password revokes every
 * token Firebase has issued for it, so the token this was called with is dead
 * afterwards and the caller needs the fresh one this hands back.
 */
async function ensurePassword(email, me) {
  const already = await firebaseSignIn(email, PASSWORD);
  if (already.ok) {
    note('POST', 'identitytoolkit signInWithPassword', 200, `${email} already has the password`);
    return me;
  }
  const set = await firebaseSetPassword(me.token, PASSWORD);
  if (!set.ok) throw new Error(`accounts:update ${email}: ${j(set.body)}`);
  note('POST', 'identitytoolkit accounts:update', set.status, `${email} password set`);
  const refreshed = await lookup(email);
  if (!refreshed) throw new Error(`${email} lost its session after the password change`);
  return refreshed;
}

/** Fill in what the wizard's Personal information step collects. */
async function ensurePersonalInfo(me, info) {
  const same = me.gender === info.gender
    && me.position === info.position
    && me.isMarketingOpted === false
    && (me.sports ?? []).join() === info.sports.join();
  if (same) {
    note('GET', '/users/me', 200, `${me.email}: Step 1 fields already set`);
    return;
  }
  const put = await asUser(me.token, `/users/${me.id}`, {
    method: 'PUT',
    // isMarketingOpted false: the signup form leaves that box unticked, and
    // POST /admins/users defaults it to true. It shows on Profile settings,
    // which 01.6 photographs.
    body: {
      name: info.name,
      lastName: info.lastName,
      gender: info.gender,
      sports: info.sports,
      position: info.position,
      isMarketingOpted: false,
    },
  });
  if (!put.ok) throw new Error(`PUT /users/${me.id}: ${j(put.body)}`);
  note('PUT', `/users/${me.id}`, put.status,
    `${info.gender}, ${info.sports.join('/')}, ${info.position}`);
}

/**
 * Drop every leaderboard the account owns.
 *
 * POST /admins/users makes one, and a Free account may hold exactly one - so
 * leaving it there is what stops 01.5's create form from ever opening.
 */
async function ensureNoLeaderboard(me) {
  const boards = (await asUser(me.token, '/leaderboards')).body?.data ?? [];
  if (!boards.length) {
    note('GET', '/leaderboards', 200, `${me.email}: no leaderboard, as 01.5 needs`);
    return;
  }
  for (const board of boards) {
    const del = await asUser(me.token, `/leaderboards/${board.id}`, { method: 'DELETE' });
    note('DELETE', `/leaderboards/${board.id}`, del.status, `"${board.name}" removed`);
  }
}

/** Drop anything a spec created and did not clean up. */
async function ensureNoExtraTeams(me, ownName) {
  const teams = (await asUser(me.token, '/teams?all=true')).body?.data ?? [];
  for (const t of teams.filter((x) => !x.name.startsWith(`${ownName} `))) {
    const del = await asUser(me.token, `/teams/${t.teamId}`, { method: 'DELETE' });
    note('DELETE', `/teams/${t.teamId}`, del.status, `"${t.name}" left over from a spec`);
  }
}

// --- 1. kb-fresh-01 - the persona ------------------------------------------
{
  let me = await ensureAccount(ACCOUNTS.fresh, PERSONAL_INFO.fresh.name);
  me = await ensurePassword(ACCOUNTS.fresh, me);
  await ensurePersonalInfo(me, PERSONAL_INFO.fresh);
  await ensureNoLeaderboard(me);
  await ensureNoExtraTeams(me, PERSONAL_INFO.fresh.name);
  ids.fresh = { id: me.id, playerId: me.playerId, uid: me.uid };
}

// --- 2. kb-01-signup and kb-01-wizard - cleared, not created ----------------
// Their specs create them. Both stop being reusable the moment they are used:
// 01.1 leaves an unverified Firebase user with no Scoryboard row, and 01.4 walks
// a wizard that only runs once. Clearing them here means a run that died halfway
// does not block the next one.
for (const key of ['signup', 'wizard']) {
  const gone = await deleteAccount(ACCOUNTS[key], PASSWORD);
  note('DELETE', ACCOUNTS[key], gone.status,
    gone.layer === 'none' ? 'was not there - nothing to do' : `removed from ${gone.layer}`);
}

// --- 3. kb-01-reset - recreated with no password ----------------------------
// Firebase refuses a password reset that does not change the password, so this
// account is torn down and remade every run. It then has no password at all, and
// 01.3 can always set the same one.
{
  const gone = await deleteAccount(ACCOUNTS.reset, PASSWORD);
  note('DELETE', ACCOUNTS.reset, gone.status, `layer=${gone.layer}`);
  const made = await admin('/admins/users', {
    method: 'POST', body: { name: 'Remi', lastName: 'KB', email: ACCOUNTS.reset },
  });
  note('POST', '/admins/users', made.status, `${ACCOUNTS.reset} uid=${made.body?.data?.uid}`);
  const me = await lookup(ACCOUNTS.reset);
  ids.reset = { id: me?.id, playerId: me?.playerId };
}

// --- 4. kb-01-delete - the account 01.7 deletes -----------------------------
// Kept plain: 01.7 photographs the delete panel, its confirm dialog and the
// signed-out screen that follows, and none of those show the profile fields that
// make an admin-created account differ from a reader's. Its spec signs in with a
// minted token, so it needs no password, and it recreates the account the same
// way after deleting it.
{
  const me = await ensureAccount(ACCOUNTS.doomed, 'Dee');
  ids.doomed = { id: me.id, playerId: me.playerId };
}

// --- 5. kb-01-owner, and the invitation 01.3 shows --------------------------
// The invitee is deleted first, so the invitation really is addressed to somebody
// with no account - which is the whole point of that half of 01.3.
{
  const gone = await deleteAccount(ACCOUNTS.invited, PASSWORD);
  note('DELETE', ACCOUNTS.invited, gone.status, `layer=${gone.layer}`);

  const owner = await ensureAccount(ACCOUNTS.owner, 'Ola');
  ids.owner = { id: owner.id, playerId: owner.playerId };

  const teams = (await asUser(owner.token, '/teams?all=true')).body?.data ?? [];
  const team = teams.find((t) => t.name === INVITE.teamName);
  if (!team) {
    throw new Error(`${ACCOUNTS.owner} has no team called "${INVITE.teamName}". Teams: ${teams.map((t) => t.name).join(', ')}`);
  }
  ids.ownerTeam = { id: team.teamId, name: team.name };

  // Invite only when there is no live invitation already. Re-inviting an address
  // that is already on the team answers 400.
  //
  // Two things about GET /teams/:id/players worth knowing, both observed on
  // staging 2026-08-28. The address is on `player.email`, not on the member. And
  // the list keeps members that have been removed, flagged isDeleted, with their
  // address anonymised to <id>@scoryboard.com - which is also what deleting the
  // invited account does to the row it left behind. So a match has to be on a
  // live row, and a run that deleted the account correctly finds none and invites
  // again.
  const members = (await asUser(owner.token, `/teams/${team.teamId}/players?includeFans=true`)).body?.data ?? [];
  const live = members.find((m) => !m.isDeleted && m.player?.email === ACCOUNTS.invited);

  if (live) {
    note('GET', `/teams/${team.teamId}/players`, 200,
      `${ACCOUNTS.invited} is already invited to ${team.name} - left alone`);
    ids.invitation = { teamPlayerId: live.id, playerId: live.playerId };
  } else {
    const invited = await asUser(owner.token, '/team-players', {
      method: 'POST',
      body: { teamId: team.teamId, name: INVITE.inviteeName, email: ACCOUNTS.invited, role: 'Player' },
    });
    if (!invited.ok) throw new Error(`POST /team-players: ${j(invited.body)}`);
    note('POST', '/team-players', invited.status,
      `${INVITE.inviteeName} <${ACCOUNTS.invited}> invited to ${team.name}`);
    ids.invitation = { teamPlayerId: invited.body?.data?.id, playerId: invited.body?.data?.playerId };
  }
}

// --- 6. report --------------------------------------------------------------
console.log('\n--- IDs ---');
console.log(j(ids));

const fresh = await lookup(ACCOUNTS.fresh);
console.log('\n--- kb-fresh-01 state ---');
console.log(j({
  verified: fresh.isEmailVerified,
  gender: fresh.gender,
  sports: fresh.sports,
  position: fresh.position,
  dateOfBirth: fresh.dateOfBirth ?? null,
  bio: fresh.bio ?? '',
  teams: ((await asUser(fresh.token, '/teams?all=true')).body?.data ?? []).map((t) => t.name),
  leaderboards: ((await asUser(fresh.token, '/leaderboards')).body?.data ?? []).map((l) => l.name),
  passwordWorks: (await firebaseSignIn(ACCOUNTS.fresh, PASSWORD)).ok,
}));

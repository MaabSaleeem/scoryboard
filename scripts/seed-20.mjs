// Idempotent seed for collection 20 - "Notifications, emails & the activity feed".
//
//   node scripts/seed-20.mjs
//   node scripts/seed-20.mjs --rebuild     # delete all four accounts first
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the four addresses in lib/fixtures-20.mjs.
//
// --- Run this before every capture. Not once - every time. ----------------
//
// Every other collection's seed can be skipped on a re-run because its
// fixtures survive. This one cannot, and the reason is a defect in the app.
//
// The bell badge and the modal title read `unreadCount` off a Firestore
// document, `notifications/<firebase uid>`, and not off `GET /notifications`,
// which answers a bare array with no counters at all. That number is a running
// tally rather than a count of anything, and it is not clamped:
//
//   - `PATCH /notifications/mark-all-read` SETS it to 0;
//   - `PATCH /notifications/mark-read {ids, isRead: false}` puts every row back
//     to unread and leaves the tally where it was, so the list and the badge
//     disagree - measured at list unread 16, badge absent;
//   - `DELETE /notifications/:id` on an unread row SUBTRACTS one, so clearing a
//     list whose tally is already 0 drives it negative. Pia's read
//     `{totalCount: 11, unreadCount: -21}` after one exploratory pass.
//
// Article 20.1 photographs the badge and it photographs Mark all as read, so
// nothing but a new notification can put back the state its first shot needs.
// Hence: **Pia's notifications are deleted and remade on every run**, and so is
// every entity whose creation is what makes them. clearNotifications() marks
// them read BEFORE deleting them, which heals the tally from any value, and the
// run ends by reading the document back and refusing to finish unless it says
// eleven.
//
// --- Two halves, and they behave differently ------------------------------
//
// **Reconciled.** The four accounts, their memberships, the venue and the
// tournament are looked up before they are written, so a second run makes no
// writes to any of them.
//
// **Rebuilt.** The three teams, the leaderboard, the match, the comments and
// all eleven of Pia's notifications, every run. Beyond the counter, two API
// facts force it:
//
//   - a comment cannot be deleted at all (briefs/19.md), so the only way to get
//     an exact thread is a new entity to hang it off;
//   - a follow answers `409 Already following` the second time and an
//     invitation cannot be accepted twice, so those generators fire once per
//     entity and never again.
//
// Eleven, not twelve. `PlayerFollow` is not in the set: a player follow
// notifies once per pair of accounts and can never be made again, because
// unfollowing and following again revives the same soft-deleted record and
// sends nothing. `TeamFollow` stands in for it and works, because the team it
// is against is rebuilt. See lib/fixtures-20.mjs.
//
// So team ids, the leaderboard id, the match id, the comment ids and every
// notification id change on every run. **No spec may hardcode any of them.**
//
// --- Order matters, and here it is the whole point ------------------------
//
// A notification's position in the modal is its `createdAt`, so the order the
// generators run in IS the order the article's second shot shows. The list in
// lib/fixtures-20.mjs is oldest first and this script walks it in that order.
//
// Two orderings inside that are not cosmetic:
//
//   - Pia has to be an Administrator of the leaderboard BEFORE Ollie comments
//     on it. `LeaderboardComment` goes to the owner and the Administrators and
//     never to the commenter, so a comment written a moment too early reaches
//     nobody this collection photographs.
//   - Pia has to have written her own comment before Milo can reply to it or
//     like it, and Milo has to be a leaderboard member to do either - which is
//     what joining KB Notify FC at step 4 gives him, and why the comments come
//     after that step rather than before it.
//
// --- The match, and why its date is fixed and in the future ---------------
//
// `MatchLive` fires only from an explicit `POST /matches/:id/status
// {"status":"Live"}`. A match whose date has passed starts itself (collection
// 10) and the automatic start notifies nobody, so a past-dated match yields
// MatchInvitation and MatchSummary and never MatchLive. A Scheduled match can
// be walked Scheduled -> Live -> Finished by hand and all three arrive.
//
// The date is also fixed, at MATCH.date, because all three of those
// notifications print it into their own sentence. **This script refuses to run
// once that date has passed**, the way scripts/seed-09.mjs and
// scripts/seed-10.mjs do with theirs.

import 'dotenv/config';
import { admin, asUser, mintSession } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, TEAMS, LEADERBOARD, VENUE, SQUAD, MATCH,
  COMMENTS, LIKE_ON, NOTIFICATIONS, TOURNAMENT,
} from '../lib/fixtures-20.mjs';

const REBUILD = process.argv.includes('--rebuild');

let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(52)} -> ${status}  ${detail ?? ''}`);
};
const fail = (what, r) => {
  throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
};

if (new Date(MATCH.date).getTime() < Date.now()) {
  throw new Error(
    `MATCH.date (${MATCH.date}) has passed. The match must be Scheduled so that it can be `
    + 'driven Scheduled -> Live -> Finished by hand; an automatic start sends no MatchLive. '
    + 'Move MATCH.date in lib/fixtures-20.mjs to a future instant and re-capture 20.1, '
    + 'whose three match rows print the date.',
  );
}

// --- accounts ---------------------------------------------------------------

async function lookup(email) {
  try {
    const session = await mintSession(email);
    const me = (await asUser(session.idToken, '/users/me')).body?.data ?? null;
    return me ? { ...me, token: session.idToken, email } : null;
  } catch {
    return null;
  }
}

async function ensureAccount(key) {
  const email = ACCOUNTS[key];
  const { name, membership } = PROFILES[key];

  if (REBUILD) {
    const existing = await lookup(email);
    if (existing) {
      const r = await admin(`/admins/user-delete/${existing.id}`, { method: 'DELETE' });
      note('DELETE', `/admins/user-delete/${existing.id}`, r.status, `${key} torn down`);
    }
  }

  let me = await lookup(email);
  if (!me) {
    const r = await admin('/admins/users', { method: 'POST', body: { name, lastName: 'KB', email } });
    if (!r.ok) fail(`create ${email}`, r);
    note('POST', '/admins/users', r.status, `${key} ${email}`);
    me = await lookup(email);
    if (!me) fail(`lookup after create ${email}`, { status: 0, body: null });
  } else {
    note('GET', '/users/me', 200, `${key} exists ${me.id}`);
  }

  if (me.membership !== membership) {
    const r = await admin(`/admins/change-user-membership/${me.id}`, {
      method: 'POST', body: { membership },
    });
    if (!r.ok) fail(`membership ${email}`, r);
    note('POST', `/admins/change-user-membership/${me.id}`, r.status, `-> ${membership}`);
    me.membership = membership;
  }
  return me;
}

// --- teardown ---------------------------------------------------------------

/**
 * Mark every notification read, then delete them all.
 *
 * **Read first, and that order is the whole reason this function exists.**
 *
 * The badge is a running tally in Firestore, not a count of anything, and it
 * is not clamped. `DELETE /notifications/:id` on an UNREAD row decrements
 * `unreadCount`, so clearing a list whose counter had already been zeroed
 * drives it negative: Pia's read `{totalCount: 11, unreadCount: -21}` after one
 * exploratory pass, and a negative count renders no badge at all and no
 * "Mark all as read" link, because both are gated on `unreadCount > 0`.
 *
 * `PATCH /notifications/mark-all-read` **sets** the counter to 0 rather than
 * subtracting from it. Deleting rows that are already read then leaves it at 0
 * while `totalCount` falls to 0. So mark-all-read, then delete, heals the
 * counter from any value - measured from -21 - and the eleven made afterwards
 * take it to exactly 11.
 *
 * `notificationIds`, a third field on that document, is left holding stale ids
 * by all of this. Nothing in the app reads it.
 *
 * `DELETE /notifications/:id` is a hard delete with no confirmation - which is
 * also true of the trash button in the app, and is why 20.1's spec photographs
 * that button and never presses it.
 */
async function clearNotifications(who) {
  const readAll = await asUser(who.token, '/notifications/mark-all-read', { method: 'PATCH', body: {} });
  if (!readAll.ok) fail(`mark-all-read for ${who.email}`, readAll);
  note('PATCH', '/notifications/mark-all-read', readAll.status, `unreadCount reset for ${who.email}`);

  let removed = 0;
  for (let page = 0; page < 30; page += 1) {
    const list = (await asUser(who.token, '/notifications?limit=50&skip=0')).body?.data ?? [];
    if (!list.length) break;
    for (const n of list) {
      const r = await asUser(who.token, `/notifications/${n.id}`, { method: 'DELETE' });
      if (!r.ok) fail(`delete notification ${n.id}`, r);
      removed += 1;
    }
  }
  note('DELETE', '/notifications/:id', 200, `${removed} cleared for ${who.email}`);
  const left = (await asUser(who.token, '/notifications?limit=50&skip=0')).body?.data ?? [];
  if (left.length) throw new Error(`${who.email} still holds ${left.length} notification(s)`);
}

/** Cancel any fixture match still standing, then drop the fixture entities. */
async function teardown(sessions) {
  const { owner, player } = sessions;

  // Nothing unfollows Pia's PLAYER record here, and that is deliberate. A
  // follow notifies once per pair for ever: DELETE then POST again answers 200
  // with the same `followId` and sends nothing, because the record is
  // soft-deleted and revived. `TeamFollow` is the follow this collection
  // photographs, and it works because the team is rebuilt.
  //
  // Ollie drops his friend row for Pia. FriendAdded fires
  // on the POST, and a second POST makes a SECOND row and a second
  // notification rather than refusing.
  const friends = (await asUser(owner.token, '/friends')).body?.data ?? [];
  for (const f of friends.filter((x) => x.friendPlayerId === player.playerId)) {
    const r = await asUser(owner.token, `/friends/${f.id}`, { method: 'DELETE' });
    note('DELETE', `/friends/${f.id}`, r.status, 'Ollie drops Pia');
  }

  // Teams before the leaderboard: a leaderboard holds team rows and a team
  // still in one leaves a dangling row behind. Each team is deleted by its own
  // owner - anybody else gets 403.
  for (const [who, wanted] of [
    [owner, TEAMS.home], [owner, TEAMS.away], [player, TEAMS.pia],
  ]) {
    const teams = (await asUser(who.token, '/teams?all=true')).body?.data ?? [];
    for (const t of teams.filter((x) => x.name === wanted)) {
      const r = await asUser(who.token, `/teams/${t.teamId}`, { method: 'DELETE' });
      note('DELETE', `/teams/${t.teamId}`, r.status, wanted);
    }
  }

  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  for (const b of boards.filter((x) => x.name === LEADERBOARD)) {
    const r = await asUser(owner.token, `/leaderboards/${b.id}`, { method: 'DELETE' });
    note('DELETE', `/leaderboards/${b.id}`, r.status, LEADERBOARD);
  }
}

/**
 * The badge, read from where the app reads it.
 *
 * The bell badge and the modal title do not come from `GET /notifications` -
 * that answers a bare array with no counters. They come from an `onSnapshot`
 * listener on the Firestore document `notifications/<firebase uid>`, whose
 * fields are `{totalCount, unreadCount, notificationIds}`. This reads the same
 * document over Firestore's REST API with the persona's own ID token, so the
 * assertion at the end of the run checks the number the reader will see rather
 * than a number this script believes.
 */
async function notificationCounter(who) {
  const url = 'https://firestore.googleapis.com/v1/projects/scoryboard-staging'
    + `/databases/(default)/documents/notifications/${who.uid}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${who.token}` } });
  if (!res.ok) throw new Error(`Firestore notifications/${who.uid}: ${res.status}`);
  const f = (await res.json()).fields ?? {};
  return {
    totalCount: Number(f.totalCount?.integerValue ?? 0),
    unreadCount: Number(f.unreadCount?.integerValue ?? 0),
  };
}

/**
 * Wait until Pia's newest notification is `type` and she holds `n` of them.
 *
 * **Called after every generator, and it is what makes the order
 * deterministic.** A notification's place in the modal is its `createdAt`, and
 * the first three generators here are one API call each with nothing between
 * them - so all three land inside the same second and the server's sort is
 * free to return them in any order. One run came back with the three oldest
 * shuffled: `FriendAdded, TeamFollow, PlayerTeamInvitation` where the plan says
 * the reverse. Article 20.1 photographs the list, so the order is not an
 * internal detail.
 *
 * This waits on a CONDITION - the row existing and being on top - never on a
 * duration, so it costs nothing on a fast server and still holds on a slow one.
 */
async function landed(player, n, type) {
  for (let i = 0; i < 40; i += 1) {
    const list = (await asUser(player.token, '/notifications?limit=50&skip=0')).body?.data ?? [];
    if (list.length === n && list[0]?.type === type) return;
    await new Promise((res) => setTimeout(res, 500));
  }
  const got = (await asUser(player.token, '/notifications?limit=50&skip=0')).body?.data ?? [];
  throw new Error(
    `${type} did not land as Pia's newest notification. Wanted ${n} rows with ${type} on top; `
    + `got ${got.length}: ${got.map((x) => x.type).join(', ') || '(none)'}`,
  );
}

// --- build ------------------------------------------------------------------

async function ensureVenue(owner) {
  const list = (await asUser(owner.token, '/club-locations')).body?.data ?? [];
  const hit = list.find((v) => v.name === VENUE.name);
  if (hit) {
    note('GET', '/club-locations', 200, `${VENUE.name} exists ${hit.id}`);
    return hit.id;
  }
  const r = await asUser(owner.token, '/club-locations', { method: 'POST', body: VENUE });
  if (!r.ok) fail('create venue', r);
  note('POST', '/club-locations', r.status, VENUE.name);
  return r.body.data.id ?? r.body.data._id;
}

/**
 * The tournament exists for one reason: `TournamentCreated` is the only
 * activity type this collection can cause that carries the **Tournament**
 * label, and 20.4's second shot is about what that label means. Reconciled,
 * never rebuilt - a second tournament would put a second card in the strip.
 */
async function ensureTournament(owner) {
  const list = (await asUser(owner.token, '/tournaments')).body?.data ?? [];
  const hit = list.find((t) => t.title === TOURNAMENT);
  if (hit) {
    note('GET', '/tournaments', 200, `${TOURNAMENT} exists ${hit._id ?? hit.id}`);
    return hit._id ?? hit.id;
  }
  const me = (await asUser(owner.token, '/users/me')).body?.data;
  if (!me?.freeTournamentProAllowanceRemaining) {
    const g = await admin('/admins/users/tournament-free-pro/grant', {
      method: 'POST', body: { email: owner.email, plan: 'Pro', quantity: 1 },
    });
    if (!g.ok) fail('grant tournament pro', g);
    note('POST', '/admins/users/tournament-free-pro/grant', g.status, 'quantity 1');
  }
  const start = new Date(Date.parse(MATCH.date) + 7 * 86_400_000).toISOString();
  const end = new Date(Date.parse(MATCH.date) + 9 * 86_400_000).toISOString();
  const r = await asUser(owner.token, '/tournaments', {
    method: 'POST', body: { title: TOURNAMENT, startDate: start, endDate: end, isOnline: false },
  });
  if (!r.ok) fail('create tournament', r);
  note('POST', '/tournaments', r.status, TOURNAMENT);
  return r.body.data._id ?? r.body.data.id;
}

async function createTeam(who, name) {
  const r = await asUser(who.token, '/teams', {
    method: 'POST',
    body: { name, teamSize: MATCH.teamSize, defaultFormation: { formation: '2-1-1' } },
  });
  if (!r.ok) fail(`create team ${name}`, r);
  const id = r.body.data.teamId ?? r.body.data.id;
  note('POST', '/teams', r.status, `${name} ${id}`);
  return id;
}

/**
 * Team-player rows, keyed by every name they answer to.
 *
 * A row carries two names - `player.name` for a registered account and `name`
 * for the row itself - and they can differ. `PUT /team-players/:id` requires a
 * `name` in its body even when all it is changing is the role, so a role change
 * rewrites the row's own name while the account's stays as it was. Keying on
 * one of the two loses the row: the first version of this looked at
 * `player.name ?? name` and stopped finding Pia the moment she was promoted.
 * Both keys, plus the first word of each, and the fixture asks for "Pia".
 */
async function squadRows(who, teamId) {
  const rows = ((await asUser(who.token, `/teams/${teamId}/players`)).body?.data ?? [])
    .filter((p) => !p.isDeleted);
  const byName = new Map();
  for (const r of rows) {
    for (const n of [r.player?.name, r.name].filter(Boolean)) {
      byName.set(n, r);
      byName.set(n.split(' ')[0], r);
    }
  }
  return byName;
}

async function main() {
  const sessions = {};
  for (const key of Object.keys(ACCOUNTS)) sessions[key] = await ensureAccount(key);
  for (const [k, v] of Object.entries(sessions)) {
    console.log(`  ${k.padEnd(7)} ${v.email.padEnd(26)} user ${v.id}  player ${v.playerId}  uid ${v.uid}`);
  }
  const { owner, player, mate, empty } = sessions;

  // Emmy is 20.1's empty state and nothing else. Assert it rather than assume
  // it: an account that has quietly picked up a notification would publish a
  // screenshot of a populated list under the heading "No notifications".
  const emmy = (await asUser(empty.token, '/notifications?limit=5')).body?.data ?? [];
  if (emmy.length) {
    throw new Error(
      `${empty.email} holds ${emmy.length} notification(s) and it must hold none - it is `
      + '20.1 shot 06, the empty state. Clear them, and find out what wrote to her.',
    );
  }
  note('GET', '/notifications', 200, `${empty.email} holds none, as it must`);

  await clearNotifications(player);
  await teardown(sessions);

  const venueId = await ensureVenue(owner);
  await ensureTournament(owner);

  // --- entities -------------------------------------------------------------
  const homeId = await createTeam(owner, TEAMS.home);
  const awayId = await createTeam(owner, TEAMS.away);
  const piaTeamId = await createTeam(player, TEAMS.pia);

  // The away side needs a second body so the line-up has a striker in it.
  // A name with no email makes a placeholder player, and a friend record as a
  // side effect (config/api.md, Friends).
  const addAway = await asUser(owner.token, '/team-players', {
    method: 'POST', body: { teamId: awayId, name: SQUAD.away[1].name, role: 'Player' },
  });
  if (!addAway.ok) fail(`add ${SQUAD.away[1].name}`, addAway);
  note('POST', '/team-players', addAway.status, `${SQUAD.away[1].name} -> ${TEAMS.away}`);

  const boardR = await asUser(owner.token, '/leaderboards', {
    method: 'POST', body: { name: LEADERBOARD },
  });
  if (!boardR.ok) fail('create leaderboard', boardR);
  const boardId = boardR.body.data.id ?? boardR.body.data._id;
  note('POST', '/leaderboards', boardR.status, `${LEADERBOARD} ${boardId}`);

  // The two teams that play. Leaderboard commenting is open to the owner, to
  // Administrators, and to any player on a member team (config/api.md,
  // corrected by collection 19). Milo has to be able to reply and to like, and
  // joining KB Notify FC at step 4 is how he gets in - which is why the
  // comments come after it.
  //
  // KB Pia United deliberately does NOT join. It exists for one thing, the
  // TeamFollow at step 2, and a third team in the league table would put a
  // row with no matches into a screen collection 08 owns.
  for (const teamId of [homeId, awayId]) {
    const r = await asUser(owner.token, `/leaderboards/${boardId}/teams`, {
      method: 'POST', body: { teamId },
    });
    if (!r.ok) fail(`add team ${teamId} to leaderboard`, r);
    note('POST', `/leaderboards/${boardId}/teams`, r.status, teamId);
  }

  // --- the twelve, in order ------------------------------------------------

  // 1. FriendAdded
  let r = await asUser(owner.token, '/friends', {
    method: 'POST', body: { name: 'Pia KB', email: ACCOUNTS.player },
  });
  if (!r.ok) fail('Ollie adds Pia as a friend', r);
  note('POST', '/friends', r.status, '1/11 FriendAdded');
  await landed(player, 1, 'FriendAdded');

  // 2. TeamFollow - on Pia's own team, so the notification reaches HER. A team
  //    follow notifies the team's owner, not its members. This is the only
  //    follow in the set: a PLAYER follow notifies once per pair for ever.
  r = await asUser(mate.token, `/teams/${piaTeamId}/follow`, { method: 'POST', body: {} });
  if (!r.ok) fail('Milo follows KB Pia United', r);
  note('POST', `/teams/${piaTeamId}/follow`, r.status, '2/11 TeamFollow');
  await landed(player, 2, 'TeamFollow');

  // 3. PlayerTeamInvitation - and Pia accepts, because 20.1 photographs the
  //    row, not the invitation, and she has to be in the line-up for the three
  //    match notifications further down.
  //
  //    She is invited straight in as an **Administrator**, rather than promoted
  //    afterwards. `PUT /team-players/:id` needs `name` and `email` in its body
  //    even when all it changes is the role, and sending them **re-issues the
  //    invitation**: the first version of this seed promoted her after she
  //    accepted and gave her a SECOND `PlayerTeamInvitation` row. The API
  //    reference lists `resendInvite` as an option on that PUT; it evidently
  //    does not need to be asked for.
  r = await asUser(owner.token, '/team-players', {
    method: 'POST',
    body: { teamId: homeId, name: 'Pia KB', email: ACCOUNTS.player, role: 'Administrator' },
  });
  if (!r.ok) fail('Ollie invites Pia', r);
  note('POST', '/team-players', r.status, '3/11 PlayerTeamInvitation, as Administrator');
  await landed(player, 3, 'PlayerTeamInvitation');

  const invites = (await asUser(player.token, '/team-invitations')).body?.data ?? [];
  const mine = invites.filter((i) => i.teamName === TEAMS.home);
  if (!mine.length) throw new Error(`Pia has no pending invitation to ${TEAMS.home}`);
  r = await asUser(player.token, '/team-invitations/accept', {
    method: 'POST', body: { teamInvitationIds: mine.map((i) => i.invitationId) },
  });
  if (!r.ok) fail('Pia accepts', r);
  note('POST', '/team-invitations/accept', r.status, `${TEAMS.home}`);

  // Why she has to be an Administrator at all:
  //
  // `PlayerJoinedTeam` goes to the team's Owner AND to its Administrators.
  // That matters because **Pia cannot own the team somebody joins.** She is
  // Free, and on Free `POST /team-players` for a registered player answers
  // `400 ONE_FRIEND_PER_TEAM` when that player already has a team-player row
  // anywhere - and every account is born owning two teams, so on Free the
  // refusal is unconditional for a real account. Measured three ways: by
  // email, by `playerId` after adding him as a friend first, and again after
  // removing him from the only other team he had been added to. Each refusal
  // also soft-deleted Pia's friend record for him, which is collection 05's
  // finding holding again.
  //
  // So the join happens on Ollie's team, where Ollie is Pro and unrestricted,
  // and it reaches Pia because she administers it.
  const homeRowsNow = await squadRows(owner, homeId);
  const piaRow = homeRowsNow.get('Pia');
  if (!piaRow) throw new Error(`Pia is not on ${TEAMS.home} after accepting`);
  if (piaRow.role !== 'Administrator') {
    throw new Error(`Pia is ${piaRow.role} on ${TEAMS.home} and has to be Administrator - `
      + 'that is what makes step 4 reach her.');
  }
  note('GET', `/teams/${homeId}/players`, 200, `Pia is Administrator of ${TEAMS.home}`);

  // 4. PlayerJoinedTeam - Ollie invites Milo to the same team and he accepts.
  r = await asUser(owner.token, '/team-players', {
    method: 'POST', body: { teamId: homeId, name: 'Milo KB', email: ACCOUNTS.mate, role: 'Player' },
  });
  if (!r.ok) fail('Ollie invites Milo', r);
  note('POST', '/team-players', r.status, `Milo -> ${TEAMS.home}`);

  const milosInvites = (await asUser(mate.token, '/team-invitations')).body?.data ?? [];
  const his = milosInvites.filter((i) => i.teamName === TEAMS.home);
  if (!his.length) throw new Error(`Milo has no pending invitation to ${TEAMS.home}`);
  r = await asUser(mate.token, '/team-invitations/accept', {
    method: 'POST', body: { teamInvitationIds: his.map((i) => i.invitationId) },
  });
  if (!r.ok) fail('Milo accepts', r);
  note('POST', '/team-invitations/accept', r.status, '4/11 PlayerJoinedTeam');
  await landed(player, 4, 'PlayerJoinedTeam');

  // 5. LeaderboardAdminAdded - before any comment, see the header.
  r = await asUser(owner.token, `/leaderboards/${boardId}/admin`, {
    method: 'POST', body: { email: ACCOUNTS.player },
  });
  if (!r.ok) fail('make Pia an Administrator', r);
  note('POST', `/leaderboards/${boardId}/admin`, r.status, '5/11 LeaderboardAdminAdded');
  await landed(player, 5, 'LeaderboardAdminAdded');

  // Pia's own comment first. It notifies OLLIE, not her, and it is what Milo
  // replies to and likes.
  const posted = new Map();
  for (const c of COMMENTS) {
    const body = { entityId: boardId, commentType: 'leaderboard', comment: c.text };
    if (c.replyTo) {
      const parent = [...posted.entries()].find(([text]) => text.startsWith(c.replyTo));
      if (!parent) throw new Error(`No parent comment starting "${c.replyTo}"`);
      body.parentCommentId = parent[1];
    }
    const cr = await asUser(sessions[c.by].token, '/comments', { method: 'POST', body });
    if (!cr.ok) fail(`comment by ${c.by}`, cr);
    posted.set(c.text, cr.body.data.id ?? cr.body.data._id);
    // 6/11 is Ollie's top-level comment; 7/11 is Milo's reply.
    const which = c.by === 'owner' ? '6/11 LeaderboardComment'
      : c.replyTo ? '7/11 CommentReply' : "Pia's own comment";
    note('POST', '/comments', cr.status, `${which} - "${c.text.slice(0, 34)}"`);
    // Pia's own comment notifies Ollie, not her, so only the other two land.
    if (c.by === 'owner') await landed(player, 6, 'LeaderboardComment');
    if (c.replyTo) await landed(player, 7, 'CommentReply');
  }

  // 8. CommentLike
  const liked = [...posted.entries()].find(([text]) => text.startsWith(LIKE_ON));
  if (!liked) throw new Error(`No comment starting "${LIKE_ON}" to like`);
  r = await asUser(mate.token, `/comments/${liked[1]}/like`, { method: 'POST', body: {} });
  if (!r.ok) fail('Milo likes', r);
  note('POST', `/comments/${liked[1]}/like`, r.status, '8/11 CommentLike');
  await landed(player, 8, 'CommentLike');

  // 9-11. The match: MatchInvitation on the create, MatchLive on the explicit
  //        Live, MatchSummary on the Finish.
  const home = await squadRows(owner, homeId);
  const away = await squadRows(owner, awayId);
  const lineup = (teamId, side, rows) => ({
    teamId,
    formation: '2-1-1',
    players: SQUAD[side].map((m) => {
      const row = rows.get(m.name);
      if (!row) throw new Error(`No team-player row for ${m.name} on ${teamId}`);
      return { teamPlayerId: row.id, position: m.position };
    }),
  });

  r = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: lineup(homeId, 'home', home),
      awayTeam: lineup(awayId, 'away', away),
      date: MATCH.date,
      duration: MATCH.duration,
      teamSize: MATCH.teamSize,
      clubLocationId: venueId,
      leaderboardId: boardId,
      tag: MATCH.tag,
    },
  });
  if (!r.ok) fail('create match', r);
  const matchId = r.body.data.id;
  if (r.body.data.status !== 'Scheduled') {
    throw new Error(
      `match ${matchId} came back "${r.body.data.status}" and it has to be Scheduled. `
      + 'Seven fields decide Scheduled against Incomplete (config/api.md) and a past date '
      + 'starts it on its own - either way MatchLive can no longer be sent by hand.',
    );
  }
  note('POST', '/matches', r.status, `9/11 MatchInvitation - ${matchId} Scheduled`);
  await landed(player, 9, 'MatchInvitation');

  r = await asUser(owner.token, `/matches/${matchId}/status`, {
    method: 'POST', body: { status: 'Live' },
  });
  if (!r.ok) fail('start match', r);
  note('POST', `/matches/${matchId}/status`, r.status, '10/11 MatchLive');
  await landed(player, 10, 'MatchLive');

  // One goal, so MatchSummary reads "won their latest match!" rather than
  // "resulted in a draw!". The fixture's `shows` line asserts which.
  const goal = await asUser(owner.token, `/matches/${matchId}/events`, {
    method: 'POST',
    body: {
      type: 'GoalAwarded',
      teamId: homeId,
      teamPlayerId: home.get(SQUAD.home[1].name).id,
      teamType: 'HomeTeam',
    },
  });
  if (!goal.ok) fail('goal', goal);
  note('POST', `/matches/${matchId}/events`, goal.status, `GoalAwarded ${SQUAD.home[1].name}`);

  r = await asUser(owner.token, `/matches/${matchId}/status`, {
    method: 'POST', body: { status: 'Finished' },
  });
  if (!r.ok) fail('finish match', r);
  note('POST', `/matches/${matchId}/status`, r.status, '11/11 MatchSummary');
  await landed(player, 11, 'MatchSummary');

  // --- assert ---------------------------------------------------------------
  //
  // The three match notifications are written by whatever handles the status
  // change, so they can trail the response by a second or two. Poll for the
  // count - a condition, never a sleep.
  const want = [...NOTIFICATIONS].reverse().map((n) => n.type);
  const same = (a) => a.length === want.length && a.every((t, i) => t === want[i]);

  // Poll until the list IS the plan, not until it is long enough. Counting was
  // the first version and it stopped early on a run that had picked up a
  // duplicate invitation: eleven rows, the wrong eleven, and MatchSummary
  // still in flight.
  let list = [];
  for (let i = 0; i < 30; i += 1) {
    list = (await asUser(player.token, '/notifications?limit=50&skip=0')).body?.data ?? [];
    if (same(list.map((n) => n.type))) break;
    await new Promise((res) => setTimeout(res, 1500));
  }

  const got = list.map((n) => n.type);
  console.log(`\nPia holds ${got.length} notification(s), newest first:`);
  got.forEach((t, i) => console.log(`  ${String(i + 1).padStart(2)}. ${t}${i === 9 ? '   <- page 1 ends here' : ''}`));

  if (got.length !== want.length || got.some((t, i) => t !== want[i])) {
    throw new Error(
      `Pia's notifications are not what lib/fixtures-20.mjs plans.\n  want: ${want.join(', ')}\n  got:  ${got.join(', ')}`,
    );
  }
  if (list.some((n) => n.isRead)) {
    throw new Error('Some of Pia\'s notifications are already read. All eleven must be unread: '
      + '20.1 shot 02 is the unread state and the badge counts them.');
  }

  const counter = await notificationCounter(player);
  console.log(`\nbadge  totalCount ${counter.totalCount}  unreadCount ${counter.unreadCount}`);
  if (counter.unreadCount !== NOTIFICATIONS.length) {
    throw new Error(
      `The Firestore badge counter reads unreadCount ${counter.unreadCount} and the list holds `
      + `${NOTIFICATIONS.length} unread. 20.1 shot 01 IS the badge, so a wrong counter is a wrong `
      + 'screenshot rather than a missing one. The counter is a running tally and is not clamped: '
      + 'mark every notification read BEFORE deleting it, which sets the tally to 0 rather than '
      + 'driving it negative. See clearNotifications().',
    );
  }

  console.log('\nfixtures');
  console.log(`  ${TEAMS.home.padEnd(18)} ${homeId}`);
  console.log(`  ${TEAMS.away.padEnd(18)} ${awayId}`);
  console.log(`  ${TEAMS.pia.padEnd(18)} ${piaTeamId}`);
  console.log(`  ${LEADERBOARD.padEnd(18)} ${boardId}`);
  console.log(`  ${VENUE.name.padEnd(18)} ${venueId}`);
  console.log(`  match              ${matchId}  ${MATCH.shownDate} ${MATCH.shownTime}`);
  console.log(`\n${writes} write(s). Capture now: the badge this restored is spent by 20.1.`);
}

await main();

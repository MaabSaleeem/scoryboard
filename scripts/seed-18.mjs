// Idempotent seed for collection 18 - "Chat & messaging".
//
//   node scripts/seed-18.mjs
//   node scripts/seed-18.mjs --rebuild     # delete all five accounts first
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the five addresses in lib/fixtures-18.mjs.
//
// --- Two halves, and they behave differently ------------------------------
//
// **Reconciled.** Accounts, memberships, the two renamed teams, the leaderboard,
// the squad and the friends lists are looked up before they are written, so a
// second run makes no writes to any of them.
//
// **Rebuilt.** Every conversation these five accounts hold is deleted and the
// three fixture conversations are built from nothing, every run. A transcript is
// append-only - nothing reorders it and nothing replaces a message - so
// reconciling it would mean a half-failed run leaving rows the next run appends
// to. See the note at the top of lib/fixtures-18.mjs.
//
// That makes the chat half NOT idempotent in ids: conversation ids and message
// ids change on every run. No spec may hardcode either. They look conversations
// up by title and messages up by text, and this script prints both.
//
// --- What --rebuild costs -------------------------------------------------
//
// `DELETE /admins/user-delete/:id` anonymises the address, and the account is
// then born again with new teams, a new leaderboard and new ids. Nothing in this
// collection is unrecoverable - there is no Stripe account and no human step -
// so --rebuild is safe here, unlike in collection 17. It is still slow: the born
// teams take their date suffix from the day they are created.

import 'dotenv/config';
import { admin, asUser, mintSession, j } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, BORN_TEAMS, TEAMS, LEADERBOARD, SQUAD, FRIENDS,
  GROUP, DIRECT_PRO, DIRECT_FREE,
  GROUP_TRANSCRIPT, DIRECT_PRO_TRANSCRIPT, DIRECT_FREE_TRANSCRIPT, REACTION,
} from '../lib/fixtures-18.mjs';

const REBUILD = process.argv.includes('--rebuild');

let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(52)} -> ${status}  ${detail ?? ''}`);
};

/** The account's Scoryboard user plus a session token, or null if there is none. */
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
  const p = PROFILES[key];

  if (REBUILD) {
    const gone = await lookup(email);
    if (gone?.id) {
      const r = await admin(`/admins/user-delete/${gone.id}`, { method: 'DELETE' });
      note('DELETE', `/admins/user-delete/${gone.id}`, r.status, email);
    }
  }

  let me = await lookup(email);
  if (!me) {
    const made = await admin('/admins/users', {
      method: 'POST', body: { name: p.name, lastName: p.lastName, email },
    });
    if (!made.ok) throw new Error(`POST /admins/users ${email}: ${j(made.body)}`);
    note('POST', '/admins/users', made.status, `${email} uid=${made.body.data.uid}`);
    me = await lookup(email);
    if (!me) throw new Error(`${email} was created but has no Scoryboard user`);
  } else {
    note('GET', '/users/me', 200, `${email} exists - id=${me.id}`);
  }

  if (me.membership !== p.membership) {
    const r = await admin(`/admins/change-user-membership/${me.id}`, {
      method: 'POST', body: { membership: p.membership },
    });
    if (!r.ok) throw new Error(`change-user-membership ${email}: ${j(r.body)}`);
    note('POST', `/admins/change-user-membership/${me.id}`, r.status, `${email} -> ${p.membership}`);
    me.membership = p.membership;
  }
  return me;
}

/**
 * Bring one of the account's BORN teams to the name we want.
 *
 * Renaming rather than creating keeps the team count at the two every account is
 * born with, so the "Choose Team" screen's `Your Teams (n)` heading does not move
 * when this collection is re-seeded. Collection 17 does the same thing.
 */
async function ensureTeamNamed(owner, bornKey, want) {
  const teams = (await asUser(owner.token, '/teams?all=true')).body?.data ?? [];
  const already = teams.find((t) => t.name === want);
  if (already) {
    note('GET', '/teams?all=true', 200, `"${want}" exists - ${already.teamId}`);
    return already.teamId;
  }
  const born = teams.find((t) => BORN_TEAMS[bornKey].test(t.name));
  if (!born) {
    throw new Error(
      `${owner.email} has no team matching ${BORN_TEAMS[bornKey]} to rename into "${want}". `
      + `Teams: ${teams.map((t) => t.name).join(', ')}`,
    );
  }
  const r = await asUser(owner.token, `/teams/${born.teamId}`, { method: 'PUT', body: { name: want } });
  if (!r.ok) throw new Error(`PUT /teams/${born.teamId}: ${j(r.body)}`);
  note('PUT', `/teams/${born.teamId}`, r.status, `renamed "${born.name}" -> "${want}"`);
  return born.teamId;
}

async function ensureLeaderboardNamed(owner, want) {
  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  const list = Array.isArray(boards) ? boards : boards.leaderboards ?? [];
  const already = list.find((b) => b.name === want);
  if (already) {
    note('GET', '/leaderboards', 200, `"${want}" exists - ${already.id ?? already.leaderboardId}`);
    return already.id ?? already.leaderboardId;
  }
  const born = list[0];
  if (!born) throw new Error(`${owner.email} has no leaderboard to rename into "${want}"`);
  const id = born.id ?? born.leaderboardId;
  const r = await asUser(owner.token, `/leaderboards/${id}`, { method: 'PUT', body: { name: want } });
  if (!r.ok) throw new Error(`PUT /leaderboards/${id}: ${j(r.body)}`);
  note('PUT', `/leaderboards/${id}`, r.status, `renamed "${born.name}" -> "${want}"`);
  return id;
}

async function ensureBoardTeam(owner, boardId, teamId, teamName) {
  const current = (await asUser(owner.token, `/leaderboards/${boardId}/teams`)).body?.data ?? [];
  const list = Array.isArray(current) ? current : current.teams ?? [];
  if (list.some((t) => (t.teamId ?? t.id) === teamId)) {
    note('GET', `/leaderboards/${boardId}/teams`, 200, `"${teamName}" already joined`);
    return;
  }
  const r = await asUser(owner.token, `/leaderboards/${boardId}/teams`, { method: 'POST', body: { teamId } });
  if (!r.ok) throw new Error(`POST /leaderboards/${boardId}/teams: ${j(r.body)}`);
  note('POST', `/leaderboards/${boardId}/teams`, r.status, `joined "${teamName}"`);
}

/**
 * Put the squad on the team.
 *
 * Added by `name` + `email`, never by `playerId`: the email is what links the row
 * to the real account, and config/api.md records that sending both is refused.
 * The side effect is a friend record, which is what fills the wizard's "Friends"
 * source - so the friends half below usually finds nothing left to do.
 */
async function ensureSquad(owner, teamId, people) {
  const current = (await asUser(owner.token, `/teams/${teamId}/players`)).body?.data ?? [];
  const live = (Array.isArray(current) ? current : current.players ?? []).filter((p) => !p.isDeleted);
  for (const { key, role } of people) {
    const email = ACCOUNTS[key];
    const p = PROFILES[key];
    if (live.some((row) => row.email === email)) {
      note('GET', `/teams/${teamId}/players`, 200, `${email} already on the team`);
      continue;
    }
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST', body: { teamId, name: `${p.name} ${p.lastName}`, email, role },
    });
    if (!r.ok) throw new Error(`POST /team-players ${email}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${email} as ${role}`);
  }
}

async function ensureFriends(owner, keys) {
  const current = (await asUser(owner.token, '/friends')).body?.data ?? [];
  const list = Array.isArray(current) ? current : current.friends ?? [];
  for (const key of keys) {
    const email = ACCOUNTS[key];
    const p = PROFILES[key];
    if (list.some((f) => f.email === email)) {
      note('GET', '/friends', 200, `${email} already a friend`);
      continue;
    }
    const r = await asUser(owner.token, '/friends', {
      method: 'POST', body: { name: `${p.name} ${p.lastName}`, email },
    });
    if (!r.ok) throw new Error(`POST /friends ${email}: ${j(r.body)}`);
    note('POST', '/friends', r.status, `${email}`);
  }
}

// --- the chat half --------------------------------------------------------

/**
 * Delete every conversation the account can see.
 *
 * A group is deleted through `/group` where we are an admin, because
 * `DELETE /chats/conversations/:id` only removes it from the caller's own list -
 * the other members keep it. Doing both, and doing it as every account, is what
 * makes the next build start from an empty list for all five.
 */
async function wipeConversations(who) {
  const r = await asUser(who.token, '/chats?limit=50');
  const list = r.body?.data?.conversations ?? [];
  for (const c of list) {
    const id = c.id ?? c.conversationId;
    if (c.type === 'group' && (c.groupAdminUidList ?? []).includes(who.uid)) {
      const g = await asUser(who.token, `/chats/conversations/${id}/group`, { method: 'DELETE' });
      note('DELETE', `/chats/conversations/${id}/group`, g.status, `${who.email} "${c.title ?? ''}"`);
      continue;
    }
    const d = await asUser(who.token, `/chats/conversations/${id}`, { method: 'DELETE' });
    note('DELETE', `/chats/conversations/${id}`, d.status, `${who.email} ${c.type}`);
  }
  return list.length;
}

async function send(who, conversationId, text, replyToMessageId) {
  const body = replyToMessageId ? { text, replyToMessageId } : { text };
  const r = await asUser(who.token, `/chats/conversations/${conversationId}/messages`, {
    method: 'POST', body,
  });
  if (!r.ok) throw new Error(`POST message as ${who.email}: ${j(r.body)}`);
  return r.body.data.id;
}

async function buildGroup(people) {
  const admin18 = people[GROUP.admin];
  const memberUids = GROUP.members.map((k) => people[k].uid);
  const r = await asUser(admin18.token, '/chats/conversations', {
    method: 'POST', body: { type: 'group', title: GROUP.title, memberUids },
  });
  if (!r.ok) throw new Error(`POST group: ${j(r.body)}`);
  const id = r.body.data.id;
  note('POST', '/chats/conversations', r.status, `group "${GROUP.title}" ${id}`);

  const ids = {};
  for (const row of GROUP_TRANSCRIPT) {
    // An edited row is sent as the text it was BEFORE the edit, so the edit is a
    // real one and the message carries the app's own "Edited" tag afterwards.
    const first = row.editedFrom ?? row.text;
    ids[row.key] = await send(people[row.from], id, first, row.replyTo ? ids[row.replyTo] : undefined);
    note('POST', `/chats/conversations/${id}/messages`, 200, `${row.from}: "${first.slice(0, 40)}"`);
  }

  for (const row of GROUP_TRANSCRIPT) {
    if (row.editedFrom) {
      const e = await asUser(people[row.from].token, `/chats/conversations/${id}/messages/${ids[row.key]}`, {
        method: 'PATCH', body: { text: row.text },
      });
      if (!e.ok) throw new Error(`PATCH edit ${row.key}: ${j(e.body)}`);
      note('PATCH', `/chats/conversations/${id}/messages/${ids[row.key]}`, e.status, `edited "${row.key}"`);
    }
    if (row.deleteForEveryone) {
      const d = await asUser(people[row.from].token, `/chats/conversations/${id}/messages/${ids[row.key]}/delete`, {
        method: 'PATCH', body: { scope: 'everyone' },
      });
      if (!d.ok) throw new Error(`PATCH delete ${row.key}: ${j(d.body)}`);
      note('PATCH', `/chats/conversations/${id}/messages/${ids[row.key]}/delete`, d.status, `deleted "${row.key}" for everyone`);
    }
  }

  const react = await asUser(people[REACTION.by].token,
    `/chats/conversations/${id}/messages/${ids[REACTION.on]}/reactions`,
    { method: 'PATCH', body: { emoji: REACTION.emoji } });
  if (!react.ok) throw new Error(`PATCH reaction: ${j(react.body)}`);
  note('PATCH', `/chats/conversations/${id}/messages/${ids[REACTION.on]}/reactions`, react.status,
    `${REACTION.by} reacted ${REACTION.emoji}`);

  return { id, messageIds: ids };
}

async function buildDirect(people, pair, transcript) {
  const a = people[pair.a];
  const b = people[pair.b];
  const r = await asUser(a.token, '/chats/conversations', {
    method: 'POST', body: { type: 'direct', targetUid: b.uid },
  });
  if (!r.ok) throw new Error(`POST direct ${a.email}<->${b.email}: ${j(r.body)}`);
  const id = r.body.data.id;
  note('POST', '/chats/conversations', r.status, `direct ${pair.a}<->${pair.b} ${id}`);
  for (const row of transcript) {
    await send(people[row.from], id, row.text);
    note('POST', `/chats/conversations/${id}/messages`, 200, `${row.from}: "${row.text.slice(0, 40)}"`);
  }
  return id;
}

// --- run ------------------------------------------------------------------

const people = {};
for (const key of Object.keys(ACCOUNTS)) people[key] = await ensureAccount(key);

const chatTeam = await ensureTeamNamed(people.pro, 'chat', TEAMS.chat);
await ensureTeamNamed(people.pro, 'chatAway', TEAMS.chatAway);
await ensureTeamNamed(people.free, 'free', TEAMS.free);

const board = await ensureLeaderboardNamed(people.pro, LEADERBOARD);
await ensureBoardTeam(people.pro, board, chatTeam, TEAMS.chat);

await ensureSquad(people.pro, chatTeam, SQUAD);
await ensureFriends(people.pro, FRIENDS);

console.log('\n--- conversations: wiping, then rebuilding ---');
let wiped = 0;
for (const key of Object.keys(ACCOUNTS)) wiped += await wipeConversations(people[key]);
console.log(`wiped ${wiped} conversation row(s)\n`);

const group = await buildGroup(people);
const directPro = await buildDirect(people, DIRECT_PRO, DIRECT_PRO_TRANSCRIPT);
const directFree = await buildDirect(people, DIRECT_FREE, DIRECT_FREE_TRANSCRIPT);

// Ellie must never hold a conversation - she is the empty state.
const ellie = (await asUser(people.empty.token, '/chats?limit=50')).body?.data?.conversations ?? [];
if (ellie.length) throw new Error(`${ACCOUNTS.empty} has ${ellie.length} conversation(s); she must have none.`);

console.log('\n--- ids ---');
console.log(j({
  users: Object.fromEntries(Object.entries(people).map(([k, v]) => [k, { id: v.id, uid: v.uid, playerId: v.playerId, membership: v.membership }])),
  team: chatTeam,
  leaderboard: board,
  group: group.id,
  groupMessages: group.messageIds,
  directPro,
  directFree,
}));
console.log(`\nwrites: ${writes}`);

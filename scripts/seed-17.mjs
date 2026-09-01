// Idempotent seed for collection 17 - "Collecting & making payments".
//
//   node scripts/seed-17.mjs
//   node scripts/seed-17.mjs --rebuild     # delete all four accounts first
//
// Safe to re-run. Every account, team, member, venue, friend and match is looked
// up before it is written, so a second run makes no writes.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the four addresses in lib/fixtures-17.mjs.
//
// --- Read this before you re-run it after a failure ----------------------
//
// **--rebuild destroys the payout account, and you cannot rebuild that.**
// `DELETE /admins/user-delete/:id` takes the Scoryboard user with it, and the
// connected Stripe account goes with the user. Reconnecting one means a human
// working through Stripe's signup by hand, because it is CAPTCHA-gated. So
// --rebuild is a last resort, and never on `kb-manager-pro-17@` alone.
//
// Two other things here cannot be undone, both inherited from collection 09:
//
//   1. A venue or a leaderboard, once on a match, cannot be taken off:
//      PUT {clubLocationId: null} and {leaderboardId: null} are both refused.
//   2. DELETE /matches/:id does not delete. It sets status Cancelled and the row
//      stays for ever, invisible in every list.
//
// --- What this script will not do ----------------------------------------
//
// It does not create the payment requests unless the payout account is live.
// `POST /payments` answers 500 while `chargesEnabled` is false, so it checks
// first and says so rather than failing in the middle. Run it again once a human
// has finished Stripe's onboarding on kb-manager-pro-17@.

import 'dotenv/config';
import { admin, asUser, mintSession, j } from '../lib/api.mjs';
import {
  ACCOUNTS, PROFILES, LEADERBOARD, TEAMS, BORN_TEAMS, VENUE,
  MATCH_DEFAULTS, POSITIONS, SQUADS, FRIENDS, MATCH, DUE_DATE, REQUESTS,
} from '../lib/fixtures-17.mjs';

const REBUILD = process.argv.includes('--rebuild');

const ids = {};
let writes = 0;
const note = (method, path, status, detail) => {
  if (method !== 'GET') writes += 1;
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(46)} -> ${status}  ${detail ?? ''}`);
};

/**
 * Refuse to build a fixture whose date has gone by.
 *
 * Reading the clock is fine here - this is a guard, not a capture.
 */
if (new Date(MATCH.date) <= new Date()) {
  throw new Error(
    `MATCH.date (${MATCH.date}) is in the past. A match created with a past date starts `
    + 'itself moments after POST /matches answers, so this seed would build a Live match '
    + 'instead of a Scheduled one. Move the date forward in lib/fixtures-17.mjs and re-run.',
  );
}

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

async function ensureAccount(key) {
  const email = ACCOUNTS[key];
  const existing = await lookup(email);
  if (existing) {
    note('GET', '/users/me', 200, `${email} exists - id=${existing.id}`);
    return existing;
  }
  const p = PROFILES[key];
  const made = await admin('/admins/users', {
    method: 'POST', body: { name: p.name, lastName: p.lastName, email },
  });
  if (!made.ok) throw new Error(`POST /admins/users ${email}: ${j(made.body)}`);
  note('POST', '/admins/users', made.status, `${email} uid=${made.body.data.uid}`);
  const me = await lookup(email);
  if (!me) throw new Error(`${email} was created but has no Scoryboard user`);
  return me;
}

async function ensureProfile(me, key) {
  const p = PROFILES[key];
  const same = me.gender === p.gender
    && me.position === p.position
    && me.bio === p.bio
    && me.isMarketingOpted === false
    && me.isTourCompleted === true
    && (me.sports ?? []).join() === p.sports.join()
    && String(me.dateOfBirth ?? '').startsWith(p.dateOfBirth);
  if (same) {
    note('GET', '/users/me', 200, `${me.email}: profile already set`);
    return me;
  }
  const put = await asUser(me.token, `/users/${me.id}`, { method: 'PUT', body: p });
  if (!put.ok) throw new Error(`PUT /users/${me.id}: ${j(put.body)}`);
  note('PUT', `/users/${me.id}`, put.status, `${p.name}, tour skipped`);
  return (await lookup(me.email)) ?? me;
}

async function ensureMembership(me, want) {
  if (me.membership === want) {
    note('GET', '/users/me', 200, `${me.email} already ${want}`);
    return me;
  }
  const r = await admin(`/admins/change-user-membership/${me.id}`, {
    method: 'POST', body: { membership: want },
  });
  if (!r.ok) throw new Error(`change-user-membership ${me.email}: ${j(r.body)}`);
  note('POST', `/admins/change-user-membership/${me.id}`, r.status, `${me.email} -> ${want}`);
  return (await lookup(me.email)) ?? me;
}

const teamsOf = async (me) => (await asUser(me.token, '/teams?all=true')).body?.data ?? [];

/** One of Mo's two born teams, renamed. */
async function ensureRenamedTeam(owner, key) {
  const want = TEAMS[key];
  const teams = await teamsOf(owner);
  const already = teams.find((t) => t.name === want);
  if (already) {
    note('GET', '/teams?all=true', 200, `"${want}" exists - ${already.teamId}`);
    return already.teamId;
  }
  const born = teams.find((t) => BORN_TEAMS[key].test(t.name));
  if (!born) {
    throw new Error(
      `${owner.email} has no team matching ${BORN_TEAMS[key]} to rename into "${want}". `
      + `Teams: ${teams.map((t) => t.name).join(', ')}`,
    );
  }
  const r = await asUser(owner.token, `/teams/${born.teamId}`, { method: 'PUT', body: { name: want } });
  if (!r.ok) throw new Error(`PUT /teams/${born.teamId}: ${j(r.body)}`);
  note('PUT', `/teams/${born.teamId}`, r.status, `renamed "${born.name}" -> "${want}"`);
  return born.teamId;
}

/** Live members of a team, with the display name the app shows. */
async function members(owner, teamId) {
  const all = (await asUser(owner.token, `/teams/${teamId}/players?includeFans=true`)).body?.data ?? [];
  // Removed members stay in the list flagged isDeleted with their address
  // anonymised (config/api.md). Filter them or the seed re-deletes dead rows.
  return all.filter((m) => !m.isDeleted).map((m) => ({
    id: m.id,
    playerId: m.playerId,
    role: m.role,
    email: m.player?.email ?? null,
    name: [m.player?.name, m.player?.lastName].filter(Boolean).join(' ').trim() || m.name || '',
  }));
}

async function ensureSquad(owner, teamId, squad, acct) {
  const have = await members(owner, teamId);
  for (const a of squad.accounts) {
    if (a.key === 'pro') continue;           // the owner is already on the sheet
    const email = ACCOUNTS[a.key];
    const row = have.find((m) => m.email === email);
    if (row) {
      if (row.role !== a.role) {
        const r = await asUser(owner.token, `/team-players/${row.id}`, {
          method: 'PUT', body: { teamId, name: `${PROFILES[a.key].name} KB`, email, role: a.role },
        });
        if (!r.ok) throw new Error(`PUT /team-players/${row.id}: ${j(r.body)}`);
        note('PUT', `/team-players/${row.id}`, r.status, `${email} ${row.role} -> ${a.role}`);
      } else {
        note('GET', `/teams/${teamId}/players`, 200, `${email} already ${a.role}`);
      }
      continue;
    }
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST', body: { teamId, name: `${PROFILES[a.key].name} KB`, email, role: a.role },
    });
    if (!r.ok) throw new Error(`POST /team-players ${email}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${email} added as ${a.role}`);
  }
  for (const name of squad.friends) {
    if (have.some((m) => m.name === name)) {
      note('GET', `/teams/${teamId}/players`, 200, `${name} already on the sheet`);
      continue;
    }
    const r = await asUser(owner.token, '/team-players', {
      method: 'POST', body: { teamId, name, role: 'Player' },
    });
    if (!r.ok) throw new Error(`POST /team-players ${name}: ${j(r.body)}`);
    note('POST', '/team-players', r.status, `${name} added to ${teamId}`);
  }
}

/**
 * Accept every invitation addressed to this account.
 *
 * The field is `invitationId`. Not `id`, and not `teamInvitationId` - the name
 * the accept endpoint's own body uses. Collection 09 recorded this after a whole
 * run left two accounts sitting on /team/join.
 */
async function acceptInvites(me) {
  const pending = (await asUser(me.token, '/team-invitations')).body?.data ?? [];
  const rows = Array.isArray(pending) ? pending : (pending.result ?? []);
  const teamInvitationIds = rows.map((r) => r.invitationId).filter(Boolean);
  if (!teamInvitationIds.length) {
    note('GET', '/team-invitations', 200, `${me.email}: nothing pending`);
    return;
  }
  const r = await asUser(me.token, '/team-invitations/accept', {
    method: 'POST', body: { teamInvitationIds },
  });
  if (!r.ok) throw new Error(`POST /team-invitations/accept ${me.email}: ${j(r.body)}`);
  note('POST', '/team-invitations/accept', r.status, `${me.email} accepted ${teamInvitationIds.length}`);
}

async function ensureLeaderboard(owner, teamIdByKey) {
  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  const mine = boards.filter((b) => b.isOwner);
  if (!mine.length) throw new Error(`${owner.email} owns no leaderboard`);

  let board = mine.find((b) => b.name === LEADERBOARD) ?? mine[0];
  if (board.name !== LEADERBOARD) {
    const r = await asUser(owner.token, `/leaderboards/${board.id}`, {
      method: 'PUT', body: { name: LEADERBOARD },
    });
    if (!r.ok) throw new Error(`PUT /leaderboards/${board.id}: ${j(r.body)}`);
    note('PUT', `/leaderboards/${board.id}`, r.status, `renamed "${board.name}" -> "${LEADERBOARD}"`);
    board = { ...board, name: LEADERBOARD };
  } else {
    note('GET', '/leaderboards', 200, `"${LEADERBOARD}" already named - ${board.id}`);
  }
  for (const stray of mine) {
    if (stray.id === board.id) continue;
    const r = await asUser(owner.token, `/leaderboards/${stray.id}`, { method: 'DELETE' });
    note('DELETE', `/leaderboards/${stray.id}`, r.status, `pruned stray "${stray.name}"`);
  }

  const listed = (await asUser(owner.token, `/leaderboards/${board.id}/teams`)).body?.data ?? [];
  const rows = Array.isArray(listed) ? listed : (listed.result ?? []);
  const inIt = new Set(rows.map((t) => String(t.teamId ?? t.id ?? t.team?.teamId ?? t.team?.id)));
  for (const key of Object.keys(TEAMS)) {
    const teamId = String(teamIdByKey[key]);
    if (inIt.has(teamId)) {
      note('GET', `/leaderboards/${board.id}/teams`, 200, `${TEAMS[key]} already in the league`);
      continue;
    }
    const r = await asUser(owner.token, `/leaderboards/${board.id}/teams`, {
      method: 'POST', body: { teamId },
    });
    if (!r.ok) throw new Error(`POST /leaderboards/${board.id}/teams ${TEAMS[key]}: ${j(r.body)}`);
    note('POST', `/leaderboards/${board.id}/teams`, r.status, TEAMS[key]);
  }
  return board;
}

/**
 * One venue, created once.
 *
 * GET /club-locations?query= searches every venue on the platform, so match on
 * the exact name rather than trusting the first row back.
 */
async function ensureVenue(owner) {
  const found = ((await asUser(owner.token, `/club-locations?query=${encodeURIComponent(VENUE.name)}`))
    .body?.data ?? []).find((v) => v.name === VENUE.name && !v.isDeleted);
  if (found) {
    note('GET', '/club-locations', 200, `"${VENUE.name}" exists - ${found.id}`);
    return found.id;
  }
  const r = await asUser(owner.token, '/club-locations', { method: 'POST', body: VENUE });
  if (!r.ok) throw new Error(`POST /club-locations: ${j(r.body)}`);
  note('POST', '/club-locations', r.status, `"${VENUE.name}" ${r.body.data.id}`);
  return r.body.data.id;
}

/** Mo's friends list - the third source a request can be addressed from. */
async function ensureFriends(owner) {
  const have = (await asUser(owner.token, '/friends')).body?.data ?? [];
  const rows = Array.isArray(have) ? have : (have.result ?? []);
  for (const name of FRIENDS) {
    if (rows.some((f) => f.name === name && !f.isDeleted)) {
      note('GET', '/friends', 200, `${name} already a friend`);
      continue;
    }
    const r = await asUser(owner.token, '/friends', { method: 'POST', body: { name } });
    if (!r.ok) throw new Error(`POST /friends ${name}: ${j(r.body)}`);
    note('POST', '/friends', r.status, name);
  }
}

async function matchesOf(owner) {
  const r = await asUser(
    owner.token,
    `/players/${owner.playerId}/matches?includeIncomplete=true&startDate=2026-01-01&endDate=2028-12-31`,
  );
  const rows = r.body?.data?.result ?? r.body?.data ?? [];
  return (Array.isArray(rows) ? rows : []).map((m) => ({
    id: m.id, date: String(m.date ?? ''), status: m.status,
  }));
}

/**
 * One Scheduled match, complete in a single POST.
 *
 * All seven fields that decide Incomplete go in the create body, so the match is
 * born Scheduled and no repair PUT is needed (config/api.md).
 */
async function ensureMatch(owner, team, board, venueId) {
  const existing = (await matchesOf(owner)).find(
    (m) => m.date.startsWith(MATCH.date.slice(0, 10)) && m.status === 'Scheduled',
  );
  if (existing) {
    note('GET', `/players/${owner.playerId}/matches`, 200, `match exists - ${existing.id}`);
    return existing.id;
  }
  const lineup = (key) => {
    const sheet = team[key].members.filter((m) => m.role !== 'Fan').slice(0, POSITIONS.length);
    return sheet.map((m, i) => ({ teamPlayerId: m.id, position: POSITIONS[i] }));
  };
  const made = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: { teamId: team[MATCH.home].id, formation: MATCH_DEFAULTS.formation, players: lineup(MATCH.home) },
      awayTeam: { teamId: team[MATCH.away].id, formation: MATCH_DEFAULTS.formation, players: lineup(MATCH.away) },
      date: MATCH.date,
      duration: MATCH.duration,
      teamSize: MATCH.teamSize,
      clubLocationId: venueId,
      leaderboardId: board.id,
      tag: MATCH.tag,
    },
  });
  if (!made.ok) throw new Error(`POST /matches: ${j(made.body)}`);
  const matchId = made.body.data.id;
  note('POST', '/matches', made.status, `${MATCH.key} ${MATCH.date.slice(0, 10)} ${matchId}`);
  const back = (await asUser(owner.token, `/matches/${matchId}`)).body?.data;
  if (back?.status !== 'Scheduled') {
    throw new Error(`match came back ${back?.status}, not Scheduled.`);
  }
  return matchId;
}

// --- the payout account -----------------------------------------------------

/**
 * Is Mo's payout account live?
 *
 * `GET /payments/stripe/account/status` - GET, not the POST the Postman export
 * lists. A 404 is normalised to `{status:"OK",data:null}` by the app's own
 * RTK layer, and the API answers the same shape, so `data === null` means "no
 * account at all".
 */
async function payoutStatus(me) {
  const r = await asUser(me.token, '/payments/stripe/account/status');
  const d = r.body?.data ?? null;
  note('GET', '/payments/stripe/account/status', r.status,
    d ? `${d.onboardingStatus} charges=${d.chargesEnabled} payouts=${d.payoutsEnabled}` : 'no account');
  return d;
}

/**
 * The three request fixtures, created only when the payout account can charge.
 *
 * `POST /payments` answers 500 while `chargesEnabled` is false. Rather than fail
 * in the middle, the seed says what is missing and leaves the rest in place.
 */
async function ensureRequests(owner, teamId, matchId) {
  const listed = (await asUser(owner.token, '/payments/my/requests?limit=50&skip=0')).body?.data?.result ?? [];
  // Cancelled rows count. `KB 17 Away travel` is *meant* to be cancelled, and a
  // lookup that skipped cancelled rows would recreate it on every run.
  const byTitle = new Map(listed.map((r) => [r.title, r]));
  const payable = (await members(owner, teamId)).filter(
    (m) => m.email && m.email !== owner.email,
  );
  if (!payable.length) throw new Error('no registered members to address a request to');

  const out = {};
  for (const [key, want] of Object.entries(REQUESTS)) {
    const already = byTitle.get(want.title);
    if (already) {
      note('GET', '/payments/my/requests', 200, `"${want.title}" exists - ${already.id}`);
      out[key] = already.id;
      continue;
    }
    const body = {
      title: want.title,
      description: want.description,
      baseAmount: Math.round(want.basePrice * 100),
      participantPlayerIds: payable.map((m) => m.playerId),
      feeAllocation: want.feeAllocation,
      dueDate: DUE_DATE,
      entity: want.entity,
    };
    if (want.entity === 'Team') body.teamId = teamId;
    if (want.entity === 'Match') { body.matchId = matchId; body.teamId = teamId; }
    const r = await asUser(owner.token, '/payments', { method: 'POST', body });
    if (!r.ok) throw new Error(`POST /payments "${want.title}": ${r.status} ${j(r.body)}`);
    note('POST', '/payments', r.status, `"${want.title}" ${r.body.data?.id}`);
    out[key] = r.body.data?.id;
    if (want.cancelAfterCreate) {
      const c = await asUser(owner.token, `/payments/${out[key]}`, { method: 'DELETE' });
      if (!c.ok) throw new Error(`DELETE /payments/${out[key]}: ${j(c.body)}`);
      note('DELETE', `/payments/${out[key]}`, c.status, `"${want.title}" cancelled on purpose`);
    }
  }
  return out;
}

// --- 0. optional teardown ---------------------------------------------------

if (REBUILD) {
  console.log('\n!! --rebuild deletes the accounts, and the payout account goes with them.');
  console.log('!! Reconnecting one needs a human: Stripe\'s signup is CAPTCHA-gated.\n');
  for (const email of Object.values(ACCOUNTS)) {
    const me = await lookup(email);
    if (!me) { note('DELETE', email, 404, 'was not there'); continue; }
    for (const b of ((await asUser(me.token, '/leaderboards')).body?.data ?? [])) {
      if (!b.isOwner) continue;
      const r = await asUser(me.token, `/leaderboards/${b.id}`, { method: 'DELETE' });
      note('DELETE', `/leaderboards/${b.id}`, r.status, b.name);
    }
    for (const t of await teamsOf(me)) {
      const r = await asUser(me.token, `/teams/${t.teamId}`, { method: 'DELETE' });
      note('DELETE', `/teams/${t.teamId}`, r.status, t.name);
    }
    const r = await admin(`/admins/user-delete/${me.id}`, { method: 'DELETE' });
    note('DELETE', `/admins/user-delete/${me.id}`, r.status, email);
  }
}

// --- 1. the four accounts ---------------------------------------------------

const acct = {};
for (const key of ['pro', 'player', 'admin', 'nopayout']) {
  let me = await ensureAccount(key);
  me = await ensureProfile(me, key);
  me = await ensureMembership(me, key === 'pro' || key === 'nopayout' ? 'Pro' : 'Free');
  acct[key] = me;
  ids[key] = { userId: me.id, playerId: me.playerId };
}

// --- 2. two teams, renamed from the born pair -------------------------------

const teamId = {};
for (const key of Object.keys(TEAMS)) teamId[key] = await ensureRenamedTeam(acct.pro, key);

// --- 3. the squads, and the invitations they raise --------------------------

for (const key of Object.keys(TEAMS)) await ensureSquad(acct.pro, teamId[key], SQUADS[key], acct);
for (const key of ['player', 'admin']) await acceptInvites(acct[key]);

const team = {};
for (const key of Object.keys(TEAMS)) {
  team[key] = { id: teamId[key], name: TEAMS[key], members: await members(acct.pro, teamId[key]) };
}

// --- 4. leaderboard, venue, friends, match ----------------------------------

const board = await ensureLeaderboard(acct.pro, teamId);
const venueId = await ensureVenue(acct.pro);
await ensureFriends(acct.pro);
const matchId = await ensureMatch(acct.pro, team, board, venueId);

// --- 5. the payout account, and the requests that depend on it --------------

const status = await payoutStatus(acct.pro);
const nopayout = await payoutStatus(acct.nopayout);
if (nopayout?.chargesEnabled) {
  console.log(
    '\n!! kb-17-nopayout@ has a LIVE payout account. That fixture exists to show the\n'
    + '!! "Get started with payments" state, and it is now unusable for 17.1 and 17.2.\n'
    + '!! See lib/fixtures-17.mjs.',
  );
}

let requestIds = null;
if (status?.chargesEnabled) {
  requestIds = await ensureRequests(acct.pro, teamId.united, matchId);
} else {
  console.log(
    '\n== The payout account on kb-manager-pro-17@ is not live, so no payment request\n'
    + '== fixtures were created. POST /payments answers 500 until it is.\n'
    + `== Current status: ${status ? status.onboardingStatus : 'no account'}.\n`
    + '== A human has to finish Stripe onboarding (test mode) - the signup is\n'
    + '== CAPTCHA-gated. Then run this script again; it is idempotent.',
  );
}

// --- what it built ----------------------------------------------------------

console.log('\n' + j({
  accounts: ids,
  teams: teamId,
  leaderboard: board.id,
  venue: venueId,
  match: matchId,
  payout: status ? { status: status.onboardingStatus, chargesEnabled: status.chargesEnabled } : null,
  requests: requestIds,
  writes,
}));

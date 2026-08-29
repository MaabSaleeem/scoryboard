// Idempotent seed for collection 07 - "Teams".
//
//   node scripts/seed-07.mjs
//   node scripts/seed-07.mjs --rebuild     # delete every account first
//
// Safe to re-run. Every account, team, member, removal, follow and the one match
// is looked up before it is written, so a second run makes almost no writes.
// Nothing here reads a clock, a random value, or a mailbox.
//
// Accounts are isolated per collection (config/personas.yaml, account_isolation).
// This script touches ONLY the eight addresses in lib/fixtures-07.mjs. It never
// touches another collection's.
//
// --- What this seed is really for ----------------------------------------
//
// Collection 07 documents six actions a reader cannot undo: accepting an
// invitation, claiming a team, transferring ownership, removing a member,
// blocking them, and deleting a team. None of the specs performs any of them.
// They photograph the control and the confirmation dialog and stop.
//
// So the state a reader lands in AFTERWARDS has to exist already, and building
// it is most of this file. KB 07 Athletic is seeded with a member already
// removed and another already blocked. KB 07 Wanderers is seeded owned by Nia
// with Mo demoted to Administrator, which is what a transferred team looks like
// from the old owner's side. Fin is seeded into Wanderers so 07.6 has a joined
// team to show while the invitation it photographs stays pending.
//
// --- Read this before re-running after a failure -------------------------
//
// Two things here cannot be rebuilt in place.
//
//   * The finished match. It cannot be reopened, edited or deleted, and the
//     statistics it wrote survive deleting the team it was played for
//     (config/api.md). The seed verifies the scoreline at the end and tells you
//     to use --rebuild if it is wrong. There is no smaller repair.
//   * A removed team-player row. DELETE /team-players/:id leaves the row in
//     GET /teams/:id/players flagged isDeleted, and there is no un-remove. The
//     seed therefore only creates the removed rows when they are missing.

import 'dotenv/config';
import { admin, asUser, mintSession, upload, j } from '../lib/api.mjs';
import {
  ACCOUNTS, MEMBERSHIP, PROFILES, TEAMS, UNCLAIMED, CLAIMED_BY_PRO,
  TEAM_SIZE, FORMATION, IMAGES, UNITED_BIO,
  UNITED_SQUAD, ROVERS_SQUAD, ATHLETIC_SQUAD, ATHLETIC_REMOVED, WANDERERS_SQUAD, CASUALS_SQUAD,
  PENDING_INVITE, LEADERBOARD_TEAMS, MATCH, UPCOMING, EXPECTED_TEAM_STATS, FOLLOWERS,
} from '../lib/fixtures-07.mjs';

const REBUILD = process.argv.includes('--rebuild');

const ids = {};
const note = (method, path, status, detail) =>
  console.log(`${String(method).padEnd(6)} ${String(path).padEnd(48)} -> ${status}  ${detail ?? ''}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fullName = (key) => `${PROFILES[key].name} ${PROFILES[key].lastName}`;

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
  const p = PROFILES[key];
  const existing = await lookup(email);
  if (existing) {
    note('GET', '/users/me', 200, `${email} exists - id=${existing.id}`);
    return existing;
  }
  const made = await admin('/admins/users', {
    method: 'POST', body: { name: p.name, lastName: p.lastName, email },
  });
  if (!made.ok) throw new Error(`POST /admins/users ${email}: ${j(made.body)}`);
  note('POST', '/admins/users', made.status, `${email} uid=${made.body.data.uid}`);
  const me = await lookup(email);
  if (!me) throw new Error(`${email} was created but has no Scoryboard user`);
  return me;
}

/** Fill in the fields a real signup collects, plus the bio. Full replace. */
async function ensureProfile(me, key) {
  const p = PROFILES[key];
  const same = me.gender === p.gender
    && me.position === p.position
    && (me.bio ?? '') === p.bio
    && me.isMarketingOpted === false
    && (me.sports ?? []).join() === p.sports.join()
    && String(me.dateOfBirth ?? '').startsWith(p.dateOfBirth);
  if (same) {
    note('GET', '/users/me', 200, `${me.email}: profile already set`);
    return me;
  }
  const put = await asUser(me.token, `/users/${me.id}`, { method: 'PUT', body: p });
  if (!put.ok) throw new Error(`PUT /users/${me.id}: ${j(put.body)}`);
  note('PUT', `/users/${me.id}`, put.status, `${p.gender}, ${p.position}`);
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
  note('POST', `/admins/change-user-membership/${me.id}`, r.status, want);
  return (await lookup(me.email)) ?? me;
}

const teamsOf = async (me) => (await asUser(me.token, '/teams?all=true')).body?.data ?? [];

/**
 * The two checkboxes on the Add Team dialog, and what they really set.
 *
 * Observed on staging 2026-08-29, read off the form's own element ids:
 *
 *   "Create a Dummy team"            -> isPrivate: true
 *   "I don't want to own this team"  -> isSystem:  true
 *
 * The names are the wrong way round from what the fields suggest, so do not
 * infer them - the dummy checkbox carries id="isPrivate" and the unowned one
 * carries id="isSystem".
 */
async function ensureTeam(owner, name, flags = {}) {
  const existing = (await teamsOf(owner)).find((t) => t.name === name);
  if (existing) {
    note('GET', '/teams?all=true', 200, `"${name}" exists - ${existing.teamId}`);
    return existing.teamId;
  }
  const made = await asUser(owner.token, '/teams', {
    method: 'POST',
    body: { name, teamSize: TEAM_SIZE, defaultFormation: { formation: FORMATION }, ...flags },
  });
  if (!made.ok) throw new Error(`POST /teams ${name}: ${j(made.body)}`);
  // The name comes back suffixed when another account already holds it -
  // collection 02 saw "Otto K FC 2808" for a plain "Otto K FC" - so read it back
  // rather than trusting the name that was asked for.
  const stored = made.body.data.name;
  if (stored !== name) throw new Error(`POST /teams: asked for "${name}", got "${stored}"`);
  // An unowned team (isSystem) is in NOBODY's team list - not even its
  // creator's - so it cannot be read back from /teams?all=true. Global search is
  // the only way to find it again, and it is also how a reader finds one (07.9).
  const teamId = flags.isSystem
    ? (await findByName(owner, name))?.id
    : (await teamsOf(owner)).find((t) => t.name === name)?.teamId;
  note('POST', '/teams', made.status, `"${name}" ${teamId}${flags.isSystem ? ' (unowned)' : ''}${flags.isPrivate ? ' (dummy)' : ''}`);
  return teamId;
}

/** Global team search - `GET /teams?name=`. The only handle on an unowned team. */
async function findByName(actor, name) {
  const hits = (await asUser(actor.token, `/teams?name=${encodeURIComponent(name)}`)).body?.data ?? [];
  return hits.find((t) => t.name === name) ?? null;
}

/**
 * A team that is created unowned and stays that way, so 07.2 and 07.9 have one
 * to photograph.
 *
 * Idempotent by search: if the name already resolves to a team, nothing is
 * written. If it resolves to a team that somebody has since CLAIMED, that is a
 * hard failure rather than a silent re-create - claiming cannot be undone, and a
 * second team of the same name would make the search ambiguous for ever.
 */
async function ensureUnclaimed(creator, name) {
  const found = await findByName(creator, name);
  if (found) {
    const detail = (await asUser(creator.token, `/teams/${found.id}`)).body?.data ?? {};
    if (!detail.isSystem) {
      throw new Error(`"${name}" exists but is no longer unclaimed (isSystem=false). `
        + 'A claim cannot be undone. Rename the fixture or use --rebuild.');
    }
    note('GET', `/teams?name=${name}`, 200, `"${name}" still unclaimed - ${found.id}`);
    return found.id;
  }
  return ensureTeam(creator, name, { isSystem: true });
}

/**
 * The "after" of 07.9: a team that WAS unclaimed and now belongs to the persona.
 *
 * Built the honest way - Nia creates it unowned, Mo claims it - so the fixture
 * is a genuinely claimed team rather than an ordinary one dressed up as one.
 */
async function ensureClaimed(creator, claimer, name) {
  const owned = (await teamsOf(claimer)).find((t) => t.name === name);
  if (owned) {
    note('GET', '/teams?all=true', 200, `"${name}" already claimed by ${claimer.email}`);
    return owned.teamId;
  }
  const id = await ensureUnclaimed(creator, name);
  const r = await asUser(claimer.token, `/teams/${id}/claim`, { method: 'POST' });
  if (!r.ok) throw new Error(`POST /teams/${id}/claim: ${j(r.body)}`);
  note('POST', `/teams/${id}/claim`, r.status, `${claimer.email} now owns "${name}"`);
  return id;
}

/**
 * Every row on a team, live and removed.
 *
 * Removed members stay in the list flagged isDeleted, with their address
 * anonymised to <id>@scoryboard.com (config/api.md). The seed needs both: the
 * live rows to know what to add, and the dead ones to know that KB 07 Athletic
 * already carries the removal 07.8 photographs.
 */
async function allRows(actor, teamId) {
  const all = (await asUser(actor.token, `/teams/${teamId}/players?includeFans=true`)).body?.data ?? [];
  return all.map((m) => ({
    id: m.id,
    role: m.role,
    isDeleted: !!m.isDeleted,
    isBlocked: !!(m.isBlocked ?? m.isBlock),
    email: m.player?.email ?? null,
    name: [m.player?.name, m.player?.lastName].filter(Boolean).join(' ').trim() || (m.name ?? ''),
    raw: m,
  }));
}

const liveRows = async (actor, teamId) => (await allRows(actor, teamId)).filter((m) => !m.isDeleted);

/** Add one account to a team by email, at a role, if it is not there already. */
async function ensureMember(owner, teamId, key, role) {
  const email = ACCOUNTS[key];
  const rows = await liveRows(owner, teamId);
  const row = rows.find((m) => m.email === email);
  if (row) {
    if (row.role !== role) {
      const put = await asUser(owner.token, `/team-players/${row.id}`, {
        method: 'PUT', body: { teamId, name: fullName(key), email, role },
      });
      if (!put.ok) throw new Error(`PUT /team-players/${row.id}: ${j(put.body)}`);
      note('PUT', `/team-players/${row.id}`, put.status, `${email} -> ${role}`);
    } else {
      note('GET', `/teams/${teamId}/players`, 200, `${email} already ${role}`);
    }
    return row.id;
  }
  const r = await asUser(owner.token, '/team-players', {
    method: 'POST', body: { teamId, name: fullName(key), email, role },
  });
  if (!r.ok) throw new Error(`POST /team-players ${email} -> ${teamId}: ${j(r.body)}`);
  note('POST', '/team-players', r.status, `${email} invited as ${role}`);
  return r.body?.data?.id;
}

/** Add a name-only row - a friend with no account. */
async function ensureFriendRow(owner, teamId, name, role = 'Player') {
  const rows = await liveRows(owner, teamId);
  const row = rows.find((m) => m.name === name);
  if (row) {
    note('GET', `/teams/${teamId}/players`, 200, `"${name}" already on the sheet`);
    return row.id;
  }
  const r = await asUser(owner.token, '/team-players', { method: 'POST', body: { teamId, name, role } });
  if (!r.ok) throw new Error(`POST /team-players "${name}" -> ${teamId}: ${j(r.body)}`);
  note('POST', '/team-players', r.status, `"${name}" added as ${role}`);
  return r.body?.data?.id;
}

async function ensureSquad(owner, teamId, squad) {
  for (const m of squad.members) await ensureMember(owner, teamId, m.account, m.role);
  for (const f of squad.friends) await ensureFriendRow(owner, teamId, f.name, f.role);
}

/**
 * Accept whatever team invitations are outstanding for an account.
 *
 * The id is on `invitationId`, not `id`. A pending invitation renders as a card
 * on the home page, which is exactly what 07.6 photographs - so this is called
 * for everybody EXCEPT Fin, whose pending invitation is the fixture.
 */
async function acceptInvitations(me, skipTeamIds = []) {
  const list = (await asUser(me.token, '/team-invitations')).body?.data ?? [];
  const take = list.filter((x) => !skipTeamIds.includes(String(x.teamId)));
  if (!take.length) {
    note('GET', '/team-invitations', 200, `${me.email}: nothing to accept`);
    return;
  }
  const teamInvitationIds = take.map((x) => x.invitationId);
  const r = await asUser(me.token, '/team-invitations/accept', { method: 'POST', body: { teamInvitationIds } });
  if (!r.ok) throw new Error(`POST /team-invitations/accept ${me.email}: ${j(r.body)}`);
  note('POST', '/team-invitations/accept', r.status, `${me.email}: ${take.map((x) => x.teamName).join(', ')}`);
}

/**
 * Make sure a team carries one row that has ALREADY been removed.
 *
 * This is the "after" half of 07.8, and it is the one thing in this seed that
 * has to be got right first time. `DELETE /team-players/:id` is not reversible:
 * the row stays in GET /teams/:id/players flagged `isDeleted`, there is no
 * un-remove, and adding the person again creates a SECOND row. So a seed that
 * simply removed somebody on every run would leave KB 07 Athletic showing one
 * more removed member each time, and 07.8's screenshots would drift.
 *
 * Hence: look for the dead row FIRST, and do nothing at all when it is there.
 * Only when it is missing does this add the person and remove them.
 */
async function ensureRemovedRow(owner, teamId, spec) {
  const email = spec.account ? ACCOUNTS[spec.account] : null;
  const matches = (m) => (email ? m.email === email : m.name === spec.name);
  const rows = await allRows(owner, teamId);

  const dead = rows.find((m) => m.isDeleted && matches(m));
  if (dead) {
    if (dead.isBlocked !== !!spec.blocked) {
      throw new Error(
        `"${spec.name}" is removed from ${teamId} but isBlocked=${dead.isBlocked}, and the fixture wants `
        + `${!!spec.blocked}. A removal cannot be undone - use --rebuild.`,
      );
    }
    note('GET', `/teams/${teamId}/players`, 200,
      `"${spec.name}" already removed${spec.blocked ? ' and blocked' : ''}`);
    return dead.id;
  }

  let live = rows.find((m) => !m.isDeleted && matches(m));
  if (!live) {
    const body = email
      ? { teamId, name: spec.name, email, role: spec.role }
      : { teamId, name: spec.name, role: spec.role };
    const add = await asUser(owner.token, '/team-players', { method: 'POST', body });
    if (!add.ok) throw new Error(`POST /team-players "${spec.name}" -> ${teamId}: ${j(add.body)}`);
    note('POST', '/team-players', add.status, `"${spec.name}" added so it can be removed`);
    live = { id: add.body?.data?.id };
  }

  const q = spec.blocked ? '?isBlocked=true' : '';
  const r = await asUser(owner.token, `/team-players/${live.id}${q}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`DELETE /team-players/${live.id}${q}: ${j(r.body)}`);
  note('DELETE', `/team-players/${live.id}${q}`, r.status,
    `"${spec.name}" removed${spec.blocked ? ' and blocked' : ''}`);
  return live.id;
}

/**
 * Give KB 07 United its crest, banner and bio - the three things 07.3 is about.
 *
 * Both images are two calls, not one. Observed on staging 2026-08-29:
 * `POST /teams/:teamId/banner` answers with a **token**, exactly like
 * `POST /teams/avatar` does, and stores nothing by itself. Until the token is
 * saved with `PUT /teams/:teamId {"bannerToken": ...}` the team object carries no
 * `bannerVersion` and `GET /teams/:teamId/banner?v=` answers 404. config/api.md
 * described this endpoint as uploading "onto the team"; it does not.
 *
 * `avatarVersion` and `bannerVersion` only appear on the team once each image
 * exists, so their absence is what this checks - a re-run must not churn the
 * files and change what the screenshots show.
 *
 * The `v` query parameter is required on both GET endpoints. Omitting it is a
 * 400 SCHEMA_VALIDATION_ERROR, not a cache miss.
 */
async function ensureAppearance(owner, teamId) {
  const read = async () => (await asUser(owner.token, `/teams/${teamId}`)).body?.data ?? {};
  let team = await read();
  const store = async (patch, what) => {
    const put = await asUser(owner.token, `/teams/${teamId}`, {
      method: 'PUT', body: { name: TEAMS.united, bio: UNITED_BIO, ...patch },
    });
    if (!put.ok) throw new Error(`PUT /teams/${teamId} ${what}: ${j(put.body)}`);
    note('PUT', `/teams/${teamId}`, put.status, what);
    team = await read();
  };

  if (!team.avatarVersion) {
    const up = await upload(owner.token, '/teams/avatar', 'avatar', IMAGES.crestWebp);
    if (!up.ok) throw new Error(`POST /teams/avatar: ${j(up.body)}`);
    note('POST', '/teams/avatar', up.status, IMAGES.crestWebp);
    await store({ avatarToken: up.body.data }, 'crest stored');
  } else {
    note('GET', `/teams/${teamId}`, 200, `crest already set (v=${team.avatarVersion})`);
  }

  if (!team.bannerVersion) {
    const up = await upload(owner.token, `/teams/${teamId}/banner`, 'banner', IMAGES.bannerWebp);
    if (!up.ok) throw new Error(`POST /teams/${teamId}/banner: ${j(up.body)}`);
    note('POST', `/teams/${teamId}/banner`, up.status, IMAGES.bannerWebp);
    await store({ bannerToken: up.body.data }, 'banner stored');
  } else {
    note('GET', `/teams/${teamId}`, 200, `banner already set (v=${team.bannerVersion})`);
  }

  if ((team.bio ?? '') !== UNITED_BIO) await store({}, `bio ${UNITED_BIO.length} chars`);
  else note('GET', `/teams/${teamId}`, 200, 'bio already set');
}

async function ensureFollow(me, path, what) {
  const already = (await asUser(me.token, path)).body?.data;
  if (already === true || already?.isFollowing === true) {
    note('GET', path, 200, `${me.email} already follows ${what}`);
    return;
  }
  const r = await asUser(me.token, path, { method: 'POST' });
  if (!r.ok) throw new Error(`POST ${path}: ${j(r.body)}`);
  note('POST', path, r.status, `${me.email} follows ${what}`);
}

/**
 * Create and play the one match, once.
 *
 * Order matters and cannot be retried: create, wait for the match to be Live,
 * write the events, finish. A match dated in the past starts itself a second or
 * two after POST /matches answers, so this polls its status rather than
 * sleeping - an event posted a moment too early is refused and lost for good.
 */
async function ensureMatch(owner, home, away, boardId) {
  const played = ((await asUser(owner.token, `/teams/${home.id}/matches?scheduleType=Past&includeIncomplete=true&limit=50&skip=0`))
    .body?.data?.result ?? []).filter((m) => m.status === 'Finished');
  if (played.length) {
    note('GET', `/teams/${home.id}/matches`, 200, `${played.length} finished match(es) already - left alone`);
    return played[0].id;
  }

  const lineup = (team, order) => order.map((name, i) => {
    const m = team.members.find((x) => x.name === name);
    if (!m) throw new Error(`${name} is not on ${team.name}: ${team.members.map((x) => x.name).join(', ')}`);
    return { teamPlayerId: m.id, position: MATCH.positions[i] };
  });

  const made = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: { teamId: home.id, formation: FORMATION, players: lineup(home, MATCH.home) },
      awayTeam: { teamId: away.id, formation: FORMATION, players: lineup(away, MATCH.away) },
      date: MATCH.date,
      duration: MATCH.duration,
      teamSize: MATCH.teamSize,
      leaderboardId: boardId,
      tag: MATCH.tag,
    },
  });
  if (!made.ok) throw new Error(`POST /matches: ${j(made.body)}`);
  const matchId = made.body.data.id;
  note('POST', '/matches', made.status, `${home.name} v ${away.name} ${matchId}`);

  const statusOf = async () => (await asUser(owner.token, `/matches/${matchId}`)).body?.data?.status;
  let status = await statusOf();
  for (let i = 0; i < 30 && status !== 'Live' && status !== 'Paused'; i += 1) {
    if (status === 'Scheduled') {
      await asUser(owner.token, `/matches/${matchId}/status`, { method: 'POST', body: { status: 'Live' } });
    }
    await sleep(2000);
    status = await statusOf();
  }
  if (status !== 'Live' && status !== 'Paused') {
    throw new Error(`${matchId} never went Live (stuck on ${status}); events cannot be written`);
  }
  note('GET', `/matches/${matchId}`, 200, `status=${status}`);

  const side = { home, away };
  const teamType = { home: 'HomeTeam', away: 'AwayTeam' };
  for (const e of MATCH.events) {
    const team = side[e.side];
    const tp = (n) => team.members.find((x) => x.name === n)?.id;
    const body = {
      type: e.type,
      teamId: team.id,
      teamPlayerId: tp(e.player),
      teamType: teamType[e.side],
      ...(e.assist ? { assistedTeamPlayerId: tp(e.assist) } : {}),
    };
    const r = await asUser(owner.token, `/matches/${matchId}/events`, { method: 'POST', body });
    if (!r.ok) throw new Error(`POST /matches/${matchId}/events ${e.type} ${e.player}: ${j(r.body)}`);
    note('POST', `/matches/${matchId}/events`, r.status, `${e.type} ${e.player}`);
  }

  const fin = await asUser(owner.token, `/matches/${matchId}/status`, { method: 'POST', body: { status: 'Finished' } });
  if (!fin.ok) throw new Error(`POST /matches/${matchId}/status Finished: ${j(fin.body)}`);
  note('POST', `/matches/${matchId}/status`, fin.status, 'Finished');
  return matchId;
}

/**
 * Mo's own leaderboard, with both match teams in it.
 *
 * Not decoration. A match with no `leaderboardId` writes NO statistics - see
 * lib/fixtures-07.mjs, LEADERBOARD_TEAMS. 07.10 photographs team statistics, so
 * without this the article's whole subject is a row of zeroes.
 */
async function ensureLeaderboard(owner, teamIds) {
  const boards = (await asUser(owner.token, '/leaderboards')).body?.data ?? [];
  if (!boards.length) throw new Error(`${owner.email} has no leaderboard to put the match in`);
  const board = boards[0];
  // The listing nests a team's id differently from row to row and can arrive
  // wrapped in `result`, so flatten to a set of strings rather than trust a shape.
  const listed = (await asUser(owner.token, `/leaderboards/${board.id}/teams`)).body?.data ?? [];
  const rows = Array.isArray(listed) ? listed : (listed.result ?? []);
  const inIt = new Set(rows.flatMap((t) => [t.teamId, t.id, t.team?.teamId, t.team?.id].filter(Boolean).map(String)));
  for (const id of teamIds) {
    if (inIt.has(String(id))) {
      note('GET', `/leaderboards/${board.id}/teams`, 200, `${id} already in "${board.name}"`);
      continue;
    }
    const r = await asUser(owner.token, `/leaderboards/${board.id}/teams`, { method: 'POST', body: { teamId: id } });
    if (!r.ok) throw new Error(`POST /leaderboards/${board.id}/teams: ${j(r.body)}`);
    note('POST', `/leaderboards/${board.id}/teams`, r.status, id);
  }
  return board;
}

/**
 * One match still to be played, so the Matches panel opens on something.
 *
 * Safe to re-run: it is only created when the team has no Upcoming fixture. A
 * scheduled match CAN be deleted, unlike a finished one, so a wrong one here is
 * repairable without --rebuild.
 */
async function ensureUpcoming(owner, home, away, boardId) {
  const list = (await asUser(owner.token, `/teams/${home.id}/matches?scheduleType=Upcoming&includeIncomplete=true&limit=50&skip=0`))
    .body?.data?.result ?? [];
  if (list.length) {
    note('GET', `/teams/${home.id}/matches`, 200, `${list.length} upcoming already - left alone`);
    return list[0].id;
  }
  const lineup = (team, order) => order.map((name, i) => {
    const m = team.members.find((x) => x.name === name);
    if (!m) throw new Error(`${name} is not on ${team.name}`);
    return { teamPlayerId: m.id, position: UPCOMING.positions[i] };
  });
  const made = await asUser(owner.token, '/matches', {
    method: 'POST',
    body: {
      homeTeam: { teamId: home.id, formation: FORMATION, players: lineup(home, UPCOMING.home) },
      awayTeam: { teamId: away.id, formation: FORMATION, players: lineup(away, UPCOMING.away) },
      date: UPCOMING.date,
      duration: UPCOMING.duration,
      teamSize: UPCOMING.teamSize,
      leaderboardId: boardId,
      tag: UPCOMING.tag,
    },
  });
  if (!made.ok) throw new Error(`POST /matches (upcoming): ${j(made.body)}`);
  note('POST', '/matches', made.status, `upcoming ${UPCOMING.date} ${made.body.data.id}`);
  return made.body.data.id;
}

/**
 * The invitation 07.6 photographs and never accepts.
 *
 * It has to be PENDING, so this checks GET /team-invitations on Fin's own
 * account rather than the owner's member list - a row exists the moment the
 * owner adds the address, and only the invitation says whether it was taken up.
 * A run that somehow accepted it is repaired by removing the row and inviting
 * again, which is the one removal in this seed that is meant to happen twice.
 */
async function ensurePendingInvite(owner, invitee, teamId, teamName) {
  const pending = (await asUser(invitee.token, '/team-invitations')).body?.data ?? [];
  if (pending.some((x) => String(x.teamId) === String(teamId))) {
    note('GET', '/team-invitations', 200, `${invitee.email}: ${teamName} still pending`);
    return;
  }
  const rows = await allRows(owner, teamId);
  const live = rows.find((m) => !m.isDeleted && m.email === invitee.email);
  if (live) {
    const r = await asUser(owner.token, `/team-players/${live.id}`, { method: 'DELETE' });
    note('DELETE', `/team-players/${live.id}`, r.status,
      `${invitee.email} taken off ${teamName} - the invitation had been accepted`);
  }
  const r = await asUser(owner.token, '/team-players', {
    method: 'POST', body: { teamId, name: PENDING_INVITE.name, email: invitee.email, role: 'Player' },
  });
  if (!r.ok) throw new Error(`POST /team-players ${invitee.email} -> ${teamName}: ${j(r.body)}`);
  note('POST', '/team-players', r.status, `${invitee.email} invited to ${teamName} - left PENDING`);
}

// --- 0. optional teardown ---------------------------------------------------

if (REBUILD) {
  for (const email of Object.values(ACCOUNTS)) {
    const me = await lookup(email);
    if (!me) { note('DELETE', email, 404, 'was not there'); continue; }
    for (const t of await teamsOf(me)) {
      if (!Object.values(TEAMS).includes(t.name)) continue;
      const r = await asUser(me.token, `/teams/${t.teamId}`, { method: 'DELETE' });
      note('DELETE', `/teams/${t.teamId}`, r.status, t.name);
    }
    // An unowned team is in nobody's list, so the loop above cannot reach it.
    // Find it the only way there is and delete it as its creator, or it survives
    // its account's deletion and the next run's search finds an orphan.
    for (const key of UNCLAIMED) {
      const stray = await findByName(me, TEAMS[key]);
      if (!stray) continue;
      const r = await asUser(me.token, `/teams/${stray.id}`, { method: 'DELETE' });
      note('DELETE', `/teams/${stray.id}`, r.status, `${TEAMS[key]} (unowned)`);
    }
    const r = await admin(`/admins/user-delete/${me.id}`, { method: 'DELETE' });
    note('DELETE', `/admins/user-delete/${me.id}`, r.status, email);
  }
}

// --- 1. the eight accounts --------------------------------------------------

const account = {};
for (const key of Object.keys(ACCOUNTS)) {
  let me = await ensureAccount(key);
  me = await ensureProfile(me, key);
  me = await ensureMembership(me, MEMBERSHIP[key]);
  account[key] = me;
  ids[key] = { id: me.id, playerId: me.playerId, membership: me.membership };
}

// --- 2. the five teams ------------------------------------------------------

const teamId = {
  united: await ensureTeam(account.pro, TEAMS.united),
  rovers: await ensureTeam(account.pro, TEAMS.rovers),
  athletic: await ensureTeam(account.pro, TEAMS.athletic),
  wanderers: await ensureTeam(account.heir, TEAMS.wanderers),
  casuals: await ensureTeam(account.free, TEAMS.casuals),
  // "Create a Dummy team" - in Mo's list, invisible to everybody else.
  reserves: await ensureTeam(account.pro, TEAMS.reserves, { isPrivate: true }),
  // "I don't want to own this team" - in nobody's list, findable by search.
  orient: await ensureUnclaimed(account.heir, TEAMS.orient),
  // The same, then claimed. 07.9's "after".
  [CLAIMED_BY_PRO]: await ensureClaimed(account.heir, account.pro, TEAMS[CLAIMED_BY_PRO]),
};
ids.teams = Object.fromEntries(Object.entries(teamId).map(([k, v]) => [TEAMS[k], v]));

await ensureSquad(account.pro, teamId.united, UNITED_SQUAD);
await ensureSquad(account.pro, teamId.rovers, ROVERS_SQUAD);
await ensureSquad(account.pro, teamId.athletic, ATHLETIC_SQUAD);
await ensureSquad(account.heir, teamId.wanderers, WANDERERS_SQUAD);
await ensureSquad(account.free, teamId.casuals, CASUALS_SQUAD);

// KB 07 Athletic's two removed rows, BEFORE the accept loop.
//
// Order matters here. Removing somebody does not withdraw the invitation the
// row created, so a removal done after the accepts leaves one pending until the
// next run picks it up - a write on a run that should make none. Doing it first
// lets the same accept loop clear it.
for (const spec of ATHLETIC_REMOVED) await ensureRemovedRow(account.pro, teamId.athletic, spec);

// Everybody accepts, except Fin's invitation to KB 07 United - that pending
// invitation is 07.6's fixture and must stay pending.
for (const key of ['admin', 'player', 'player2', 'heir', 'blocked']) {
  await acceptInvitations(account[key]);
}
await acceptInvitations(account.pro);
await acceptInvitations(account.fresh, [String(teamId.united)]);

// Fin's invitation to KB 07 United is the fixture 07.6 photographs. It is
// created LAST, after every accept has run, so nothing in this seed can take it.
await ensurePendingInvite(account.pro, account.fresh, teamId[PENDING_INVITE.team], TEAMS[PENDING_INVITE.team]);

// --- 3. KB 07 United's crest, banner and bio --------------------------------

await ensureAppearance(account.pro, teamId.united);

// --- 4. the matches -------------------------------------------------------

const rowsFor = async (owner, id, name) => ({ id, name, members: await liveRows(owner, id) });
const united = await rowsFor(account.pro, teamId.united, TEAMS.united);
const rovers = await rowsFor(account.pro, teamId.rovers, TEAMS.rovers);
const board = await ensureLeaderboard(account.pro, LEADERBOARD_TEAMS.map((k) => teamId[k]));
ids.leaderboard = { id: board.id, name: board.name };
ids.match = await ensureMatch(account.pro, united, rovers, board.id);
ids.upcoming = await ensureUpcoming(account.pro, united, rovers, board.id);

// --- 5. followers -----------------------------------------------------------

for (const key of FOLLOWERS) {
  await ensureFollow(account[key], `/teams/${teamId.united}/follow`, TEAMS.united);
}

// --- 6. verify --------------------------------------------------------------

const pending = ((await asUser(account.fresh.token, '/team-invitations')).body?.data ?? [])
  .map((x) => x.teamName);

const stats = await (async () => {
  // GET /teams/:id/stats -> data.stats. Statistics are written asynchronously
  // after a match finishes, so poll rather than assert once.
  const read = async () => (await asUser(account.pro.token, `/teams/${teamId.united}/stats`)).body?.data?.stats ?? {};
  let got = await read();
  const ok = () => Object.entries(EXPECTED_TEAM_STATS).every(([k, v]) => got[k] === v);
  for (let i = 0; i < 20 && !ok(); i += 1) { await sleep(3000); got = await read(); }
  return got;
})();

console.log('\n--- IDs ---');
console.log(j(ids));
console.log('\n--- state ---');
console.log(j({
  proMembership: account.pro.membership,
  teams: (await teamsOf(await lookup(ACCOUNTS.pro))).map((t) => `${t.name} (${t.role ?? '?'})`),
  unitedRoles: (await liveRows(account.pro, teamId.united)).map((m) => `${m.name}: ${m.role}`),
  athleticRows: (await allRows(account.pro, teamId.athletic))
    .map((m) => `${m.name || m.email}: ${m.role}${m.isDeleted ? ' REMOVED' : ''}${m.isBlocked ? ' BLOCKED' : ''}`),
  wanderersRoles: (await liveRows(account.heir, teamId.wanderers)).map((m) => `${m.name}: ${m.role}`),
  finPendingInvitations: pending,
  unitedStats: stats,
  // The three teams whose whole point is a flag: prove the flags are still set.
  dummy: await (async () => {
    const d = (await asUser(account.pro.token, `/teams/${teamId.reserves}`)).body?.data ?? {};
    return `${TEAMS.reserves}: isPrivate=${d.isPrivate} isSystem=${d.isSystem}`;
  })(),
  unclaimed: await (async () => {
    const found = await findByName(account.heir, TEAMS.orient);
    if (!found) return `${TEAMS.orient}: NOT FOUND`;
    const d = (await asUser(account.heir.token, `/teams/${found.id}`)).body?.data ?? {};
    return `${TEAMS.orient}: isSystem=${d.isSystem} (must be true - nobody has claimed it)`;
  })(),
  claimed: (await teamsOf(account.pro)).some((t) => t.name === TEAMS[CLAIMED_BY_PRO])
    ? `${TEAMS[CLAIMED_BY_PRO]}: owned by ${ACCOUNTS.pro}`
    : `${TEAMS[CLAIMED_BY_PRO]}: NOT owned by the persona`,
  athleticBlocked: (await allRows(account.pro, teamId.athletic))
    .filter((m) => m.isDeleted)
    .map((m) => `${m.name}${m.isBlocked ? ' BLOCKED' : ' removed'}`),
}));

const wrong = Object.entries(EXPECTED_TEAM_STATS).filter(([k, v]) => stats[k] !== v);
if (wrong.length) {
  console.error('\nTEAM STATISTICS ARE WRONG. A finished match cannot be edited or deleted.');
  console.error(`Expected ${j(EXPECTED_TEAM_STATS)}`);
  console.error(`Got      ${j(stats)}`);
  console.error('Re-run with --rebuild: nothing smaller can repair this.');
  process.exit(1);
}
if (!pending.includes(TEAMS.united)) {
  console.error(`\n${ACCOUNTS.fresh} has no pending invitation to ${TEAMS.united}. 07.6 needs one.`);
  console.error('Remove the row from KB 07 United and re-run, or use --rebuild.');
  process.exit(1);
}
console.log('\nSeed complete.');

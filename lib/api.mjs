// Minimal Scoryboard staging API client.
//
// Two auth schemes, as described in config/api.md:
//   admin(...)  -> X-API-KEY, for /admins/*
//   asUser(...) -> Authorization: Bearer <firebase-id-token>
//
// Sessions are always minted, never pasted. Nothing here uses a clock or a random
// value, so a caller can stay deterministic.

import 'dotenv/config';

export const API = process.env.SCORYBOARD_API_BASE;
export const APP = process.env.SCORYBOARD_APP_BASE;
const ADMIN_KEY = process.env.SCORYBOARD_ADMIN_API_KEY;
const FIREBASE_KEY = process.env.FIREBASE_WEB_API_KEY;

if (!API || !ADMIN_KEY || !FIREBASE_KEY) {
  throw new Error('Missing SCORYBOARD_API_BASE, SCORYBOARD_ADMIN_API_KEY or FIREBASE_WEB_API_KEY in .env');
}

async function call(path, { method = 'GET', headers = {}, body, raw = false } = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(raw ? body : { data: body });
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { ok: res.ok, status: res.status, body: json, url, method };
}

export function admin(path, opts = {}) {
  return call(path, { ...opts, headers: { ...opts.headers, 'X-API-KEY': ADMIN_KEY } });
}

export function asUser(token, path, opts = {}) {
  return call(path, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` } });
}

// Mint a Firebase ID token for a persona email. See config/api.md, "Session minting".
//
// Observed on staging, 2026-08-28: POST /admins/generate-signin-token returns
//   {"status":"OK","data":"<APP_BASE>/signin?token=<outer JWT>"}
// not a bare custom token. The outer JWT is HS256 and its payload carries
//   {"customLoginToken":"<the Firebase custom token>"}
// which is what identitytoolkit accepts. The URL itself is also a working
// browser sign-in, which is how the specs authenticate.
export function decodeJwtPayload(jwt) {
  return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
}

export async function signinUrl(email) {
  const r = await admin('/admins/generate-signin-token', { method: 'POST', body: { email } });
  if (!r.ok || typeof r.body?.data !== 'string') {
    throw new Error(`generate-signin-token ${email}: ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`);
  }
  return r.body.data;
}

export async function mintSession(email) {
  const url = await signinUrl(email);
  const outer = new URL(url).searchParams.get('token');
  const customToken = decodeJwtPayload(outer).customLoginToken;
  if (!customToken) throw new Error(`No customLoginToken in signin token for ${email}`);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`signInWithCustomToken: ${res.status} ${JSON.stringify(json)}`);
  return { idToken: json.idToken, refreshToken: json.refreshToken, localId: json.localId, signinUrl: url };
}

export const j = (v) => JSON.stringify(v, null, 2);

// --- Firebase Identity Toolkit, for the accounts collection 01 documents -----
//
// Collection 01 is the only one that photographs signing up, signing in and
// deleting an account, so it is the only one that needs Firebase directly.
// Every other collection gets its sessions from mintSession() above.
//
// The key is public by design - it ships in the web app bundle - but it is read
// from .env, never hardcoded (config/api.md).

const IDENTITY = 'https://identitytoolkit.googleapis.com/v1/accounts';

async function identity(op, body) {
  const res = await fetch(`${IDENTITY}:${op}?key=${FIREBASE_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

/** Create the Firebase user, which is all that /signup does. No DB user yet. */
export function firebaseSignUp(email, password) {
  return identity('signUp', { email, password, returnSecureToken: true });
}

/** Sign in with a password, the way the /signin form does. */
export function firebaseSignIn(email, password) {
  return identity('signInWithPassword', { email, password, returnSecureToken: true });
}

export function firebaseDelete(idToken) {
  return identity('delete', { idToken });
}

/**
 * Remove an account in whichever layer it exists in, and report what it found.
 *
 * Two layers, and a signup can leave the account in either:
 *   - Firebase only, when the reader stopped at the verification screen. That is
 *     exactly where 01.1 stops, so this is the normal state to clean up.
 *   - Firebase plus the Scoryboard user, once Step 1 has been submitted.
 *
 * `DELETE /admins/user-delete/:id` removes both (it answers "User account
 * deleted successfully and email anonymized" and the Firebase password stops
 * working - verified on staging, 2026-08-28). The Firebase path is only needed
 * for the first case, and it needs the password because there is no admin
 * endpoint that reaches a user with no DB row.
 */
export async function deleteAccount(email, password) {
  let dbUser = null;
  try {
    const session = await mintSession(email);
    dbUser = (await asUser(session.idToken, '/users/me')).body?.data ?? null;
  } catch {
    dbUser = null; // no Scoryboard user - generate-signin-token answers 404
  }
  if (dbUser?.id) {
    const r = await admin(`/admins/user-delete/${dbUser.id}`, { method: 'DELETE' });
    return { layer: 'scoryboard', status: r.status, id: dbUser.id };
  }
  if (password) {
    const signIn = await firebaseSignIn(email, password);
    if (signIn.ok) {
      const r = await firebaseDelete(signIn.body.idToken);
      return { layer: 'firebase', status: r.status, id: signIn.body.localId };
    }
  }
  return { layer: 'none', status: 404, id: null };
}

/**
 * Set a password on an existing Firebase user, using that user's own ID token.
 *
 * This is what makes collection 01 seedable without an inbox. `POST /admins/users`
 * creates a verified account with no password, and the documented way to give one
 * a password is to send a reset email and open the link (config/personas.yaml).
 * That needs a readable mailbox, and a mailbox is not something a seed should
 * depend on - yopmail started asking for a CAPTCHA partway through this
 * collection's step 1 and every mail-reading path stopped working at once.
 *
 * Identity Toolkit's accounts:update is the same call the app's own Change
 * Password control makes. Mint the user a session first (mintSession), pass its
 * idToken, and the account can sign in with a password afterwards.
 */
export async function firebaseSetPassword(idToken, password) {
  return identity('update', { idToken, password, returnSecureToken: true });
}

// --- multipart upload -------------------------------------------------------
//
// Every image on Scoryboard is uploaded the same way: POST the file as multipart
// to an upload endpoint, then PUT the parent entity with the token it returned
// (config/api.md, "Conventions"). A player's photo and banner both work that way -
// POST /players/avatar and POST /players/:playerId/banner each answer with a
// token, and PUT /users/:userId stores it as avatarToken or bannerToken.
//
// The upload endpoints accept WebP and nothing else. Observed on staging,
// 2026-08-28: a PNG is refused with 415 {"error":"Unsupported file type"} even
// though the settings page says "JPG, GIF or PNG. 3MB max." - the app's own
// cropper re-encodes to WebP in the browser before it uploads, so the caption
// describes what you may CHOOSE, not what the API takes.
//
// Written here rather than in a seed script because collection 02 uploads a
// profile photo and a banner, and every later collection that documents a crest,
// a team banner or a match banner needs the same two lines.

import fs from 'node:fs';
import path from 'node:path';

/**
 * POST one file to `endpoint` as multipart/form-data under `field`.
 *
 * Reads the bytes off disk, so the same file always sends the same bytes - a
 * caller stays deterministic. Do not set Content-Type: fetch has to write its
 * own multipart boundary.
 */
export async function upload(token, endpoint, field, filePath) {
  // The type on the Blob matters: without it fetch sends
  // application/octet-stream and the API answers 415 "Unsupported file type".
  const type = {
    '.webp': 'image/webp', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  }[path.extname(filePath).toLowerCase()];
  if (!type) throw new Error(`upload(): no MIME type known for ${filePath}`);
  const form = new FormData();
  form.append(field, new Blob([fs.readFileSync(filePath)], { type }), path.basename(filePath));
  const res = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { ok: res.ok, status: res.status, body: json };
}

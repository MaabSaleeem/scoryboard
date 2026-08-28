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

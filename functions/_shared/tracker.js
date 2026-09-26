const encoder = new TextEncoder();
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const hex = (bytes) => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const unhex = (value) => new Uint8Array((value.match(/.{1,2}/g) || []).map(pair => parseInt(pair, 16)));
const constantEqual = (left, right) => {
  const a = encoder.encode(String(left));
  const b = encoder.encode(String(right));
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) mismatch |= (a[i] || 0) ^ (b[i] || 0);
  return mismatch === 0;
};
const hmac = async (message, secret) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
};
const passcodeHash = async (passcode, saltBytes) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(passcode), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 180000 }, key, 256);
  return hex(bits);
};
export const error = (message, status = 400) => json({ error: message }, status);
export const response = json;
export const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && Math.floor(date.getTime() / 86400000) <= Math.floor(Date.now() / 86400000) + 1;
};
export const readBody = async (request) => {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('Send JSON data.');
  const text = await request.text();
  if (text.length > 10000) throw new Error('That entry is too long.');
  try { return JSON.parse(text); } catch { throw new Error('The request could not be read.'); }
};
export const sameOrigin = (request) => {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
};
const cookieToken = (request) => {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/(?:^|;\s*)cycle_session=([^;]+)/);
  if (!match) return '';
  try { return decodeURIComponent(match[1]); } catch { return ''; }
};
export async function isAuthenticated(request, env) {
  const token = cookieToken(request).split('.');
  if (token.length !== 2 || !env.TRACKER_SESSION_SECRET || env.TRACKER_SESSION_SECRET.length < 32) return false;
  const expiry = Number(token[0]);
  if (!Number.isInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  const expected = b64url(await hmac(token[0], env.TRACKER_SESSION_SECRET));
  return constantEqual(expected, token[1]);
}
export function sessionCookie(env) {
  const expiry = String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7);
  return hmac(expiry, env.TRACKER_SESSION_SECRET).then(sig =>
    'cycle_session=' + expiry + '.' + b64url(sig) + '; Path=/api/tracker; HttpOnly; Secure; SameSite=Strict; Max-Age=604800'
  );
}
export const clearSessionCookie = 'cycle_session=; Path=/api/tracker; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
export async function rateFingerprint(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  return b64url(await hmac(ip, env.TRACKER_SESSION_SECRET));
}
export async function verifyPasscode(passcode, salt, expectedHash) {
  const actual = await passcodeHash(passcode, unhex(salt));
  const a = unhex(actual), b = unhex(expectedHash);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) mismatch |= (a[i] || 0) ^ (b[i] || 0);
  return mismatch === 0;
}
export async function makePasscode(passcode) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: hex(salt), hash: await passcodeHash(passcode, salt) };
}
export function secretPhraseMatches(entered, expected) {
  return typeof expected === 'string' && expected.length >= 20 && constantEqual(entered, expected);
}
export const validPassphrase = (value) => typeof value === 'string' && value.trim() === value && value.length >= 14 && value.length <= 160;
export const safeError = (e) => json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, 400);

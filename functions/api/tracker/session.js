import {
  error, readBody, sameOrigin, validPassphrase, verifyPasscode,
  rateFingerprint, sessionCookie, clearSessionCookie, response, isAuthenticated
} from '../../_shared/tracker.js';

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return error('This request was blocked.', 403);
  if (!env.DB || !env.TRACKER_SESSION_SECRET || env.TRACKER_SESSION_SECRET.length < 32) return error('Tracker backend is not configured yet.', 503);
  let body;
  try { body = await readBody(request); } catch (e) { return error(e.message); }
  if (typeof body.passcode !== 'string' || body.passcode.length > 160) return error('Enter the shared passphrase.');
  try {
    const fingerprint = await rateFingerprint(request, env);
    const now = Math.floor(Date.now() / 1000);
    const attempt = await env.DB.prepare('SELECT attempts, window_started FROM auth_attempts WHERE ip_fingerprint = ?').bind(fingerprint).first();
    if (attempt && now - attempt.window_started < 900 && attempt.attempts >= 8) return error('Too many tries. Wait 15 minutes, then try again.', 429);
    const auth = await env.DB.prepare('SELECT passcode_salt, passcode_hash FROM tracker_auth WHERE id = 1').first();
    if (!auth || !(await verifyPasscode(body.passcode, auth.passcode_salt, auth.passcode_hash))) {
      if (attempt && now - attempt.window_started < 900) {
        await env.DB.prepare('UPDATE auth_attempts SET attempts = attempts + 1 WHERE ip_fingerprint = ?').bind(fingerprint).run();
      } else {
        await env.DB.prepare('INSERT INTO auth_attempts (ip_fingerprint, attempts, window_started) VALUES (?, 1, ?) ON CONFLICT(ip_fingerprint) DO UPDATE SET attempts = 1, window_started = excluded.window_started').bind(fingerprint, now).run();
      }
      return error('That passphrase did not match.', 401);
    }
    await env.DB.prepare('DELETE FROM auth_attempts WHERE ip_fingerprint = ?').bind(fingerprint).run();
    return response({ ok: true }, 200, { 'set-cookie': await sessionCookie(env) });
  } catch {
    return error('Could not sign in. Check the database setup and try again.', 503);
  }
}

export async function onRequestDelete({ request, env }) {
  if (!sameOrigin(request)) return error('This request was blocked.', 403);
  if (await isAuthenticated(request, env)) {
    return response({ ok: true }, 200, { 'set-cookie': clearSessionCookie });
  }
  return response({ ok: true }, 200, { 'set-cookie': clearSessionCookie });
}

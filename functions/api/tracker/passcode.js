import {
  error, readBody, sameOrigin, isAuthenticated, validPassphrase,
  verifyPasscode, makePasscode, response
} from '../../_shared/tracker.js';

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return error('This request was blocked.', 403);
  if (!env.DB || !(await isAuthenticated(request, env))) return error('Unlock the tracker to change its passphrase.', 401);
  let body;
  try { body = await readBody(request); } catch (e) { return error(e.message); }
  if (!validPassphrase(body.newPasscode)) return error('Choose a passphrase of at least 14 characters, with no leading or trailing spaces.');
  try {
    const current = await env.DB.prepare('SELECT passcode_salt, passcode_hash FROM tracker_auth WHERE id = 1').first();
    if (!current || !(await verifyPasscode(body.currentPasscode, current.passcode_salt, current.passcode_hash))) return error('The current passphrase did not match.', 401);
    const next = await makePasscode(body.newPasscode);
    await env.DB.prepare('UPDATE tracker_auth SET passcode_salt = ?, passcode_hash = ? WHERE id = 1').bind(next.salt, next.hash).run();
    return response({ ok: true });
  } catch {
    return error('Could not change the passphrase.', 503);
  }
}

import {
  error, readBody, sameOrigin, makePasscode, secretPhraseMatches, validPassphrase,
  sessionCookie, response
} from '../../_shared/tracker.js';

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return error('This request was blocked.', 403);
  if (!env.DB || !env.TRACKER_SETUP_PHRASE || !env.TRACKER_SESSION_SECRET || env.TRACKER_SESSION_SECRET.length < 32) {
    return error('Tracker setup is not configured yet.', 503);
  }
  let body;
  try { body = await readBody(request); } catch (e) { return error(e.message); }
  if (!secretPhraseMatches(body.setupPhrase, env.TRACKER_SETUP_PHRASE)) return error('The secret phrase did not match.', 403);
  if (!validPassphrase(body.setupPhrase) || body.setupPhrase.length < 20) return error('Use the secret phrase you configured in Cloudflare (at least 20 characters).');
  try {
    const exists = await env.DB.prepare('SELECT id FROM tracker_auth WHERE id = 1').first();
    if (exists) return error('The shared passphrase has already been set. Unlock the tracker instead.', 409);
    const hashed = await makePasscode(body.setupPhrase);
    await env.DB.prepare('INSERT INTO tracker_auth (id, passcode_salt, passcode_hash) VALUES (1, ?, ?)').bind(hashed.salt, hashed.hash).run();
    await env.DB.prepare('INSERT OR IGNORE INTO tracker_settings (id, cycle_length, period_length) VALUES (1, 28, 5)').run();
    return response({ ok: true }, 200, { 'set-cookie': await sessionCookie(env) });
  } catch {
    return error('Could not finish setup. Check that the database tables have been created.', 503);
  }
}

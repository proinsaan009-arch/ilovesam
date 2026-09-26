import { response, isAuthenticated } from '../../_shared/tracker.js';

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB || !env.TRACKER_SESSION_SECRET || env.TRACKER_SESSION_SECRET.length < 32) {
      return response({ ready: false, configured: false, authenticated: false });
    }
    const auth = await env.DB.prepare('SELECT id FROM tracker_auth WHERE id = 1').first();
    return response({
      ready: true,
      configured: Boolean(auth),
      authenticated: auth ? await isAuthenticated(request, env) : false,
      setupAvailable: Boolean(env.TRACKER_SETUP_PHRASE && env.TRACKER_SETUP_PHRASE.length >= 20)
    });
  } catch {
    return response({ ready: false, configured: false, authenticated: false });
  }
}

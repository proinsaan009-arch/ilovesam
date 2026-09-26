import { error, readBody, sameOrigin, validDate, response, isAuthenticated } from '../../_shared/tracker.js';

const moods = new Set(['Lovely', 'Okay', 'Low', 'Tender', 'Frustrated']);
const flows = new Set(['Spotting', 'Light', 'Medium', 'Heavy', 'No bleeding']);
const authRequired = async (request, env) => await isAuthenticated(request, env);

export async function onRequestGet({ request, env }) {
  if (!(await authRequired(request, env))) return error('Unlock the tracker to continue.', 401);
  if (!env.DB) return error('Tracker database is not connected.', 503);
  try {
    const [periodRows, flowRows, moodRows, settings] = await Promise.all([
      env.DB.prepare('SELECT start_date AS startDate, end_date AS endDate FROM periods ORDER BY start_date DESC LIMIT 100').all(),
      env.DB.prepare('SELECT log_date AS date, flow FROM flow_logs ORDER BY log_date DESC LIMIT 120').all(),
      env.DB.prepare('SELECT log_date AS date, mood, note FROM mood_logs ORDER BY log_date DESC LIMIT 120').all(),
      env.DB.prepare('SELECT cycle_length AS cycleLength, period_length AS periodLength FROM tracker_settings WHERE id = 1').first()
    ]);
    return response({
      periods: periodRows.results || [],
      flows: flowRows.results || [],
      moods: moodRows.results || [],
      settings: settings || { cycleLength: 28, periodLength: 5 }
    });
  } catch {
    return error('Could not read tracker entries. Check the database tables.', 503);
  }
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return error('This request was blocked.', 403);
  if (!(await authRequired(request, env))) return error('Unlock the tracker to continue.', 401);
  if (!env.DB) return error('Tracker database is not connected.', 503);
  let body;
  try { body = await readBody(request); } catch (e) { return error(e.message); }
  try {
    if (body.type === 'period') {
      const { startDate, endDate } = body;
      if (!validDate(startDate) || (endDate && (!validDate(endDate) || endDate < startDate))) return error('Check the period dates.');
      await env.DB.prepare('INSERT INTO periods (start_date, end_date) VALUES (?, ?) ON CONFLICT(start_date) DO UPDATE SET end_date = excluded.end_date').bind(startDate, endDate || null).run();
    } else if (body.type === 'flow') {
      if (!validDate(body.date) || !flows.has(body.flow)) return error('Choose a valid date and flow level.');
      await env.DB.prepare('INSERT INTO flow_logs (log_date, flow) VALUES (?, ?) ON CONFLICT(log_date) DO UPDATE SET flow = excluded.flow').bind(body.date, body.flow).run();
    } else if (body.type === 'mood') {
      if (!validDate(body.date) || !moods.has(body.mood) || typeof body.note !== 'string' || body.note.length > 500) return error('Check the date, mood, and note length.');
      await env.DB.prepare('INSERT INTO mood_logs (log_date, mood, note) VALUES (?, ?, ?) ON CONFLICT(log_date) DO UPDATE SET mood = excluded.mood, note = excluded.note').bind(body.date, body.mood, body.note).run();
    } else if (body.type === 'settings') {
      const cycleLength = Number(body.cycleLength), periodLength = Number(body.periodLength);
      if (!Number.isInteger(cycleLength) || cycleLength < 18 || cycleLength > 45 || !Number.isInteger(periodLength) || periodLength < 1 || periodLength > 12) return error('Cycle length must be 18–45 days and period length 1–12 days.');
      await env.DB.prepare('INSERT INTO tracker_settings (id, cycle_length, period_length) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET cycle_length = excluded.cycle_length, period_length = excluded.period_length').bind(cycleLength, periodLength).run();
    } else {
      return error('Unknown tracker entry type.');
    }
    return response({ ok: true });
  } catch {
    return error('Could not save that entry. Check the database tables.', 503);
  }
}

export async function onRequestDelete({ request, env }) {
  if (!sameOrigin(request)) return error('This request was blocked.', 403);
  if (!(await authRequired(request, env))) return error('Unlock the tracker to continue.', 401);
  const type = new URL(request.url).searchParams.get('type');
  const table = { periods: 'periods', flows: 'flow_logs', moods: 'mood_logs' }[type];
  if (!table) return error('Unknown history type.');
  try {
    await env.DB.prepare('DELETE FROM ' + table).run();
    return response({ ok: true });
  } catch {
    return error('Could not clear that history.', 503);
  }
}

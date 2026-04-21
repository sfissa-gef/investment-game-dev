import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getDb } from './db.js';
import { requireEnumerator, requireAdmin } from './auth.js';
import { SessionSchema, AudioChunkSchema } from './schemas.js';
import { runQa } from './qa.js';

const app = new Hono();

// Tablets hit this Worker from a different origin (the Pages domain).
// Allow all origins but restrict methods + headers we actually use.
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/health', async (c) => {
  try {
    const sql = getDb(c.env);
    await sql`SELECT 1`;
    return c.json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

app.post('/api/sessions', requireEnumerator(), async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const parsed = SessionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'validation_error', details: parsed.error.issues }, 400);
  }
  const s = parsed.data;
  const sql = getDb(c.env);

  try {
    const existing = await sql`
      SELECT id FROM sessions WHERE session_id = ${s.sessionId}
    `;
    if (existing.length > 0) {
      return c.json({ error: 'duplicate', existing_receipt_id: String(existing[0].id) }, 409);
    }

    // D4: per-session QA — recompute payouts + verify weather seeds, etc.
    // Pure function; never throws on untrusted input (returns structured flags).
    let qa;
    try {
      qa = runQa(s);
    } catch (qaErr) {
      console.error('qa_run_failed', qaErr);
      qa = { passed: null, flags: [{ check: 'qa_run_threw', error: String(qaErr) }], checkedAt: new Date().toISOString() };
    }

    const inserted = await sql`
      INSERT INTO sessions
        (session_id, participant_id, enumerator_id, country, partner, round2_version,
         language, currency_rate, app_version, session_start_time, session_end_time,
         payload, qa_passed, qa_flags, qa_checked_at)
      VALUES
        (${s.sessionId}, ${s.participantId}, ${s.enumeratorId}, ${s.country},
         ${s.partner ?? null}, ${s.round2Version}, ${s.language}, ${s.currencyRate},
         ${s.appVersion ?? null}, ${s.sessionStartTime}, ${s.sessionEndTime ?? null},
         ${JSON.stringify(s)},
         ${qa.passed}, ${JSON.stringify(qa.flags)}, ${qa.checkedAt})
      RETURNING id
    `;
    return c.json({
      status: 'accepted',
      receipt_id: String(inserted[0].id),
      qa_passed: qa.passed,
      qa_flag_count: qa.flags.length,
    });
  } catch (err) {
    console.error('session_insert_failed', err);
    return c.json({ error: 'server_error' }, 500);
  }
});

app.post('/api/audio-chunks', requireEnumerator(), async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const parsed = AudioChunkSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'validation_error', details: parsed.error.issues }, 400);
  }

  // base64 → bytea for Postgres
  const bytes = body.blob
    ? Uint8Array.from(atob(body.blob), (ch) => ch.charCodeAt(0))
    : null;

  const sql = getDb(c.env);
  try {
    await sql`
      INSERT INTO audio_chunks
        (session_id, chunk_index, timestamp, duration_ms, encrypted, blob)
      VALUES
        (${parsed.data.sessionId}, ${parsed.data.chunkIndex}, ${parsed.data.timestamp},
         ${parsed.data.durationMs ?? null}, ${!!parsed.data.encrypted}, ${bytes})
      ON CONFLICT (session_id, chunk_index) DO NOTHING
    `;
    return c.json({ ok: true });
  } catch (err) {
    console.error('audio_insert_failed', err);
    return c.json({ error: 'server_error' }, 500);
  }
});

app.get('/api/sessions/:id', requireAdmin(), async (c) => {
  const sql = getDb(c.env);
  const rows = await sql`
    SELECT payload FROM sessions WHERE session_id = ${c.req.param('id')}
  `;
  if (rows.length === 0) return c.json({ error: 'not_found' }, 404);
  return c.json(rows[0].payload);
});

app.get('/api/sessions', requireAdmin(), async (c) => {
  const sql = getDb(c.env);
  // ?qa=failed → only sessions with qa_passed = false. ?qa=passed → only true.
  const qa = c.req.query('qa');
  let rows;
  if (qa === 'failed') {
    rows = await sql`
      SELECT session_id, participant_id, country, round2_version,
             session_start_time, session_end_time, received_at,
             qa_passed, qa_flags
      FROM sessions WHERE qa_passed = false
      ORDER BY received_at DESC LIMIT 500
    `;
  } else if (qa === 'passed') {
    rows = await sql`
      SELECT session_id, participant_id, country, round2_version,
             session_start_time, session_end_time, received_at,
             qa_passed, qa_flags
      FROM sessions WHERE qa_passed = true
      ORDER BY received_at DESC LIMIT 500
    `;
  } else {
    rows = await sql`
      SELECT session_id, participant_id, country, round2_version,
             session_start_time, session_end_time, received_at,
             qa_passed, qa_flags
      FROM sessions
      ORDER BY received_at DESC LIMIT 500
    `;
  }
  return c.json(rows);
});

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error('unhandled_error', err);
  return c.json({ error: 'server_error' }, 500);
});

export default app;

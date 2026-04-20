import express from 'express';
import { query, withTx } from './db.js';
import { requireEnumerator, requireAdmin } from './auth.js';
import { SessionSchema, AudioChunkSchema } from './schemas.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
app.use(express.json({ limit: '10mb' }));

app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/api/sessions', requireEnumerator, async (req, res) => {
  const parsed = SessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.issues });
  }
  const s = parsed.data;
  try {
    const result = await withTx(async (c) => {
      const existing = await c.query('SELECT id FROM sessions WHERE session_id = $1', [s.sessionId]);
      if (existing.rowCount > 0) {
        return { duplicate: true, id: existing.rows[0].id };
      }
      const insert = await c.query(
        `INSERT INTO sessions
         (session_id, participant_id, enumerator_id, country, partner, round2_version,
          language, currency_rate, app_version, session_start_time, session_end_time, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id`,
        [
          s.sessionId, s.participantId, s.enumeratorId, s.country, s.partner ?? null,
          s.round2Version, s.language, s.currencyRate, s.appVersion ?? null,
          s.sessionStartTime, s.sessionEndTime ?? null, s,
        ]
      );
      return { duplicate: false, id: insert.rows[0].id };
    });
    if (result.duplicate) {
      return res.status(409).json({ error: 'duplicate', existing_receipt_id: String(result.id) });
    }
    return res.json({ status: 'accepted', receipt_id: String(result.id) });
  } catch (err) {
    console.error('session_insert_failed', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

app.post('/api/audio-chunks', requireEnumerator, async (req, res) => {
  const parsed = AudioChunkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'validation_error' });
  // For brevity: chunk bytes arrive base64-encoded under `blob` key in body.
  const bytes = req.body.blob ? Buffer.from(req.body.blob, 'base64') : null;
  try {
    await query(
      `INSERT INTO audio_chunks (session_id, chunk_index, timestamp, duration_ms, encrypted, blob)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (session_id, chunk_index) DO NOTHING`,
      [
        parsed.data.sessionId, parsed.data.chunkIndex, parsed.data.timestamp,
        parsed.data.durationMs ?? null, !!parsed.data.encrypted, bytes,
      ]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('audio_insert_failed', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

app.get('/api/sessions/:id', requireAdmin, async (req, res) => {
  const r = await query('SELECT payload FROM sessions WHERE session_id = $1', [req.params.id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'not_found' });
  res.json(r.rows[0].payload);
});

app.get('/api/sessions', requireAdmin, async (_req, res) => {
  const r = await query(
    `SELECT session_id, participant_id, country, round2_version,
            session_start_time, session_end_time, received_at
     FROM sessions ORDER BY received_at DESC LIMIT 500`
  );
  res.json(r.rows);
});

app.listen(PORT, () => {
  console.log(`investment-game-server listening on :${PORT}`);
});

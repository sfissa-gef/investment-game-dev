import { db, getConfig } from './db.js';

const DEFAULT_URL = '';

export async function syncUrl() {
  return (await getConfig('sync_url', DEFAULT_URL)) || DEFAULT_URL;
}
export async function syncToken() {
  return await getConfig('sync_token', '');
}

async function postOne(session) {
  const url = await syncUrl();
  if (!url) throw new Error('sync_url_not_configured');
  const token = await syncToken();
  const res = await fetch(`${url.replace(/\/$/, '')}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(session),
  });
  if (res.status === 409) return { ok: true, duplicate: true };
  if (!res.ok) throw new Error(`server_${res.status}`);
  const body = await res.json().catch(() => ({}));
  return { ok: true, receipt: body.receipt_id || null };
}

async function postAudioChunk(chunk) {
  const url = await syncUrl();
  const token = await syncToken();
  const buf = await chunk.blob.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const res = await fetch(`${url.replace(/\/$/, '')}/api/audio-chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      sessionId: chunk.sessionId,
      chunkIndex: chunk.chunkIndex,
      timestamp: chunk.timestamp,
      durationMs: chunk.durationMs,
      encrypted: true,
      blob: b64,
    }),
  });
  return res.ok;
}

export async function syncPendingSessions({ onProgress } = {}) {
  const pending = await db.sessions
    .where('syncStatus').anyOf(['pending', 'failed'])
    .toArray();
  const finishedPending = pending.filter((s) => s.currentScreen === 'COMPLETION');
  const results = [];
  for (const session of finishedPending) {
    await db.sessions.update(session.id, { syncStatus: 'syncing' });
    onProgress?.({ sessionId: session.sessionId, status: 'syncing' });
    try {
      const { receipt } = await postOne(session);
      // Upload any associated audio chunks
      const chunks = await db.audioChunks.where('sessionId').equals(session.sessionId).toArray();
      for (const chunk of chunks) {
        try {
          const ok = await postAudioChunk(chunk);
          if (ok) await db.audioChunks.delete(chunk.id);
        } catch (chunkErr) {
          console.error('audio_chunk_upload_failed', chunkErr);
        }
      }
      await db.sessions.update(session.id, {
        syncStatus: 'synced',
        serverConfirmation: receipt,
        lastSyncAttempt: new Date().toISOString(),
      });
      results.push({ sessionId: session.sessionId, ok: true });
      onProgress?.({ sessionId: session.sessionId, status: 'synced' });
    } catch (err) {
      await db.sessions.update(session.id, {
        syncStatus: 'failed',
        syncAttempts: (session.syncAttempts || 0) + 1,
        lastSyncAttempt: new Date().toISOString(),
      });
      results.push({ sessionId: session.sessionId, ok: false, error: String(err) });
      onProgress?.({ sessionId: session.sessionId, status: 'failed', error: String(err) });
    }
  }
  return results;
}

export async function testConnection() {
  const url = await syncUrl();
  if (!url) return { ok: false, error: 'sync_url_not_configured' };
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/health`, { method: 'GET' });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

import Dexie from 'dexie';

export const db = new Dexie('InvestmentGameDB');

db.version(1).stores({
  sessions: '++id, participantId, sessionId, syncStatus, createdAt',
  events: '++id, sessionId, screenName, eventType, timestamp',
  participants: 'participantId, treatmentGroup, country, partner',
  audioChunks: '++id, sessionId, chunkIndex, timestamp',
  config: 'key',
});

export async function getConfig(key, fallback = null) {
  const row = await db.config.get(key);
  return row ? row.value : fallback;
}

export async function setConfig(key, value) {
  await db.config.put({ key, value });
}

export async function upsertSession(session) {
  const existing = await db.sessions.where('sessionId').equals(session.sessionId).first();
  if (existing) {
    await db.sessions.update(existing.id, session);
    return existing.id;
  }
  return db.sessions.add({ ...session, createdAt: new Date().toISOString() });
}

export async function latestUnfinishedSession() {
  const rows = await db.sessions
    .where('syncStatus').equals('pending')
    .reverse()
    .sortBy('createdAt');
  return rows.find((r) => r.currentScreen && r.currentScreen !== 'COMPLETION') || null;
}

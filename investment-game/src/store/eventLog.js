import { db } from '../lib/db.js';

let currentSessionId = null;

export function setEventSession(sessionId) {
  currentSessionId = sessionId;
}

export async function logEvent(screenName, eventType, payload = {}) {
  if (!currentSessionId) return;
  const event = {
    sessionId: currentSessionId,
    timestamp: new Date().toISOString(),
    performanceNow: performance.now(),
    screenName,
    eventType,
    payload,
  };
  try {
    await db.events.add(event);
  } catch (err) {
    console.error('eventLog failed', err);
  }
}

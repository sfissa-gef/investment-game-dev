import { db } from './db.js';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    devicePixelRatio: window.devicePixelRatio,
    language: navigator.language,
    serviceWorkerActive: !!navigator.serviceWorker?.controller,
  };
}

export async function exportAllJson() {
  const [sessions, events, participants] = await Promise.all([
    db.sessions.toArray(),
    db.events.toArray(),
    db.participants.toArray(),
  ]);
  const exportData = {
    exportedAt: new Date().toISOString(),
    deviceInfo: getDeviceInfo(),
    sessionCount: sessions.length,
    eventCount: events.length,
    participants,
    sessions,
    events,
  };
  downloadBlob(
    new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }),
    `investment-game-export-${Date.now()}.json`
  );
  return { sessions: sessions.length, events: events.length };
}

function csvEscape(v) {
  if (v == null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(',')).join('\n');
  return header + '\n' + body;
}

const SESSION_COLS = [
  'session_id', 'participant_id', 'enumerator_id', 'country', 'partner',
  'treatment_group', 'round2_version', 'language', 'currency_rate',
  'session_start_time', 'session_end_time', 'session_duration_minutes',
  'r1_fertilizer', 'r1_savings', 'r1_weather', 'r1_fertilizer_harvest', 'r1_total_tokens',
  'r2_effective_budget', 'r2_video_chosen', 'r2_fertilizer',
  'r2_seeds_purchased', 'r2_insurance_purchased', 'r2_bundle_purchased',
  'r2_savings', 'r2_weather', 'r2_fertilizer_harvest',
  'r2_seed_harvest', 'r2_insurance_payout', 'r2_bundle_harvest', 'r2_total_tokens',
  'total_incentivized_tokens', 'total_payout_currency',
  'practice_fertilizer', 'practice_weather', 'practice_total_tokens',
  'survey_comprehension1_correct', 'survey_comprehension2_correct', 'survey_comprehension3_correct',
  'sync_status',
];

function flattenSession(s) {
  const r1 = s.round1 || {};
  const r2 = s.round2 || {};
  const pr = s.practiceRound || {};
  const sv = s.survey || {};
  const duration = s.sessionStartTime && s.sessionEndTime
    ? (new Date(s.sessionEndTime) - new Date(s.sessionStartTime)) / 60000
    : null;
  return {
    session_id: s.sessionId,
    participant_id: s.participantId,
    enumerator_id: s.enumeratorId,
    country: s.country,
    partner: s.partner,
    treatment_group: s.treatmentGroup,
    round2_version: s.round2Version,
    language: s.language,
    currency_rate: s.currencyRate,
    session_start_time: s.sessionStartTime,
    session_end_time: s.sessionEndTime,
    session_duration_minutes: duration,
    r1_fertilizer: r1.fertilizerPurchased,
    r1_savings: r1.tokensSaved,
    r1_weather: r1.weatherOutcome,
    r1_fertilizer_harvest: r1.fertilizerHarvest,
    r1_total_tokens: r1.totalTokens,
    r2_effective_budget: r2.effectiveBudget,
    r2_video_chosen: r2.videoChosen,
    r2_fertilizer: r2.fertilizerPurchased,
    r2_seeds_purchased: r2.seedsPurchased,
    r2_insurance_purchased: r2.insurancePurchased,
    r2_bundle_purchased: r2.bundlePurchased,
    r2_savings: r2.tokensSaved,
    r2_weather: r2.weatherOutcome,
    r2_fertilizer_harvest: r2.fertilizerHarvest,
    r2_seed_harvest: r2.seedHarvest,
    r2_insurance_payout: r2.insurancePayout,
    r2_bundle_harvest: r2.bundleHarvest,
    r2_total_tokens: r2.totalTokens,
    total_incentivized_tokens: s.totalIncentivizedTokens,
    total_payout_currency: s.totalPayoutCurrency,
    practice_fertilizer: pr.fertilizerPurchased,
    practice_weather: pr.weatherOutcome,
    practice_total_tokens: pr.totalTokens,
    survey_comprehension1_correct: sv.comprehension1Correct,
    survey_comprehension2_correct: sv.comprehension2Correct,
    survey_comprehension3_correct: sv.comprehension3Correct,
    sync_status: s.syncStatus,
  };
}

export async function exportSessionsCsv() {
  const sessions = await db.sessions.toArray();
  const rows = sessions.map(flattenSession);
  const csv = toCsv(rows, SESSION_COLS);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `sessions-${Date.now()}.csv`);
  return rows.length;
}

const EVENT_COLS = [
  'session_id', 'timestamp', 'performance_now', 'screen_name', 'event_type', 'payload_json',
];

export async function exportEventsCsv() {
  const events = await db.events.toArray();
  const rows = events.map((e) => ({
    session_id: e.sessionId,
    timestamp: e.timestamp,
    performance_now: e.performanceNow,
    screen_name: e.screenName,
    event_type: e.eventType,
    payload_json: e.payload,
  }));
  const csv = toCsv(rows, EVENT_COLS);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `events-${Date.now()}.csv`);
  return rows.length;
}

const STEPPER_COLS = [
  'session_id', 'participant_id', 'round', 'input', 'action', 'value', 'lockbox_after', 'timestamp',
];

export async function exportStepperTrajectoryCsv() {
  const sessions = await db.sessions.toArray();
  const rows = [];
  for (const s of sessions) {
    for (const key of ['practiceRound', 'round1', 'round2']) {
      const round = s[key];
      if (!round?.stepperTrajectory) continue;
      for (const entry of round.stepperTrajectory) {
        rows.push({
          session_id: s.sessionId,
          participant_id: s.participantId,
          round: key,
          input: entry.input,
          action: entry.action,
          value: entry.value,
          lockbox_after: entry.lockbox,
          timestamp: entry.timestamp,
        });
      }
    }
  }
  const csv = toCsv(rows, STEPPER_COLS);
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `stepper-trajectory-${Date.now()}.csv`);
  return rows.length;
}

export async function importParticipantsCsv(text) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(',').map((h) => h.trim());
  const req = ['participantId'];
  for (const k of req) {
    if (!headers.includes(k)) throw new Error(`Missing required column: ${k}`);
  }
  const rows = lines.map((line) => {
    const cells = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? '').trim(); });
    return obj;
  });
  await db.participants.bulkPut(rows);
  return rows.length;
}

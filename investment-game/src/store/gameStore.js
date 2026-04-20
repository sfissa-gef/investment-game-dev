import { create } from 'zustand';
import { SCREENS, APP_VERSION } from '../lib/constants.js';
import { db, upsertSession } from '../lib/db.js';
import { logEvent, setEventSession } from './eventLog.js';

function newSessionId() {
  return (crypto.randomUUID && crypto.randomUUID()) || `s-${Date.now()}-${Math.random()}`;
}

const blankRound = (id) => ({
  roundId: id,
  fertilizerPurchased: 0,
  seedsPurchased: null,
  insurancePurchased: null,
  bundlePurchased: null,
  tokensSaved: null,
  weatherOutcome: null,
  weatherSeed: null,
  weatherRawDraw: null,
  fertilizerHarvest: null,
  seedHarvest: null,
  insurancePayout: null,
  bundleHarvest: null,
  totalTokens: null,
  decisionStartTime: null,
  decisionEndTime: null,
  decisionDurationMs: null,
  stepperTrajectory: [],
  plantButtonTaps: 0,
  confirmCancellations: 0,
});

export const useGameStore = create((set, get) => ({
  currentScreen: SCREENS.WELCOME,
  session: null,
  adminOpen: false,

  hydrate: async () => {
    const pending = await db.sessions
      .where('syncStatus').equals('pending')
      .toArray();
    const unfinished = pending.find((r) => r.currentScreen && r.currentScreen !== SCREENS.COMPLETION);
    if (unfinished) {
      setEventSession(unfinished.sessionId);
      set({ session: unfinished, currentScreen: unfinished.currentScreen });
    }
  },

  newSession: async (setup) => {
    const session = {
      sessionId: newSessionId(),
      appVersion: APP_VERSION,
      participantId: setup.participantId,
      enumeratorId: setup.enumeratorId,
      country: setup.country,
      partner: setup.partner,
      treatmentGroup: setup.treatmentGroup,
      language: setup.language || 'en',
      currencyRate: setup.currencyRate,
      audioRecordingEnabled: !!setup.audioRecordingEnabled,
      round2Version: setup.round2Version,
      sessionStartTime: new Date().toISOString(),
      sessionEndTime: null,
      practiceRound: blankRound('practice'),
      round1: blankRound('round1'),
      round2: { ...blankRound('round2'), version: setup.round2Version, videoChosen: null, effectiveBudget: 25 },
      survey: {},
      totalIncentivizedTokens: null,
      totalPayoutCurrency: null,
      currentScreen: SCREENS.WELCOME,
      syncStatus: 'pending',
      syncAttempts: 0,
      lastSyncAttempt: null,
      serverConfirmation: null,
    };
    await upsertSession(session);
    setEventSession(session.sessionId);
    set({ session, currentScreen: SCREENS.WELCOME });
    await logEvent(SCREENS.WELCOME, 'session_start', { participantId: session.participantId });
    return session;
  },

  updateSession: async (patch) => {
    const current = get().session;
    if (!current) return;
    const next = { ...current, ...patch };
    await upsertSession(next);
    set({ session: next });
  },

  updateRound: async (roundKey, patch) => {
    const current = get().session;
    if (!current) return;
    const next = { ...current, [roundKey]: { ...current[roundKey], ...patch } };
    await upsertSession(next);
    set({ session: next });
  },

  transition: async (to) => {
    const { currentScreen, session } = get();
    if (!session) {
      set({ currentScreen: to });
      return;
    }
    await logEvent(currentScreen, 'screen_transition', { from: currentScreen, to });
    const next = { ...session, currentScreen: to };
    await upsertSession(next);
    set({ currentScreen: to, session: next });
  },

  openAdmin: () => set({ adminOpen: true }),
  closeAdmin: () => set({ adminOpen: false }),
}));

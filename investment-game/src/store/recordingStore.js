import { create } from 'zustand';
import { SessionRecorder, createSessionKey } from '../lib/recording.js';
import { upsertSession } from '../lib/db.js';
import { logEvent } from './eventLog.js';

export const useRecordingStore = create((set, get) => ({
  recorder: null,
  active: false,
  error: null,

  start: async (session) => {
    if (get().active || !session?.audioRecordingEnabled) return;
    try {
      const { key, exported } = await createSessionKey();
      const recorder = new SessionRecorder({ sessionId: session.sessionId, key });
      await recorder.start();
      await upsertSession({ ...session, recordingKey: exported, recordingStarted: new Date().toISOString() });
      set({ recorder, active: true, error: null });
      logEvent('session', 'recording_start', { sessionId: session.sessionId });
    } catch (err) {
      console.error('Recording start failed', err);
      set({ error: String(err), active: false });
      logEvent('session', 'recording_start_failed', { message: String(err) });
    }
  },

  stop: async () => {
    const { recorder } = get();
    if (!recorder) return;
    try {
      await recorder.stop();
      logEvent('session', 'recording_stop', {});
    } finally {
      set({ recorder: null, active: false });
    }
  },
}));

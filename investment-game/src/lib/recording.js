import { db } from './db.js';

// AES-GCM encrypted audio chunks, stored in IndexedDB.
// Session key is generated once per session, exported + stored on the session
// record so the server (and only the server) can decrypt later.

async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function createSessionKey() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return { key, exported: await exportKey(key) };
}

async function encryptChunk(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  const out = new Uint8Array(iv.length + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  return out;
}

export class SessionRecorder {
  constructor({ sessionId, key, chunkMs = 60_000 }) {
    this.sessionId = sessionId;
    this.key = key;
    this.chunkMs = chunkMs;
    this.chunkIndex = 0;
    this.mediaRecorder = null;
    this.stream = null;
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true },
    });
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : '';
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: mime || undefined,
      audioBitsPerSecond: 16_000,
    });
    this.mediaRecorder.addEventListener('dataavailable', async (e) => {
      if (!e.data || e.data.size === 0) return;
      const buf = await e.data.arrayBuffer();
      const encrypted = await encryptChunk(this.key, new Uint8Array(buf));
      await db.audioChunks.add({
        sessionId: this.sessionId,
        chunkIndex: this.chunkIndex++,
        timestamp: new Date().toISOString(),
        durationMs: this.chunkMs,
        blob: new Blob([encrypted], { type: 'application/octet-stream' }),
      });
    });
    this.mediaRecorder.start(this.chunkMs);
  }

  async stop() {
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder?.stop();
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.mediaRecorder = null;
    this.stream = null;
  }
}

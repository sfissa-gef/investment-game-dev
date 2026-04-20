import { useEffect, useMemo, useRef, useState } from 'react';
import { logEvent } from '../store/eventLog.js';
import { t, currentLanguage } from '../i18n/index.js';

// Generic video container.
// Scene components receive `currentMs` in DESIGNED-storyboard time.
// When narration audio is present and its real duration differs from the
// designed duration, we proportionally scale so scenes and captions stay
// in sync with the voice. When there is no audio, designed time == real time.

export default function VideoPlayer({
  videoId,
  screenName,
  Scene,
  durationMs,       // designed/storyboard duration
  narrationSrc,     // can be a string or a (lang) => string resolver
  captions = [],    // array of { startMs, endMs, text | key } — designed time
  onDone,
  continueLabel = 'Continue',
  autoContinue = false,
}) {
  const lang = currentLanguage();
  const preferredSrc = typeof narrationSrc === 'function' ? narrationSrc(lang) : narrationSrc;
  const fallbackSrc = typeof narrationSrc === 'function' && lang !== 'en' ? narrationSrc('en') : null;
  const [resolvedSrc, setResolvedSrc] = useState(preferredSrc);
  const [realMs, setRealMs] = useState(0);
  const [realDurationMs, setRealDurationMs] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [replays, setReplays] = useState(0);
  const [audioOk, setAudioOk] = useState(Boolean(preferredSrc));
  const [sceneIdx, setSceneIdx] = useState(0);
  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const offsetRef = useRef(0);
  const enterAtRef = useRef(performance.now());
  const playingRef = useRef(true);
  playingRef.current = playing;
  const sceneIdxRef = useRef(0);
  sceneIdxRef.current = sceneIdx;

  const scale = realDurationMs ? realDurationMs / durationMs : 1;
  const effectiveDurationMs = realDurationMs ?? durationMs;
  const designedMs = scale > 0 ? realMs / scale : realMs;

  const resolveText = (cap) => cap.text ?? (cap.key ? t(cap.key) : '');
  const activeCaptionIdx = captions.findIndex(
    (c) => designedMs >= c.startMs && designedMs < c.endMs
  );
  const activeCaption = activeCaptionIdx >= 0 ? captions[activeCaptionIdx] : null;

  // Emit per-scene enter/exit events when the caption index changes.
  useEffect(() => {
    if (activeCaptionIdx < 0 || activeCaptionIdx === sceneIdxRef.current) return;
    logEvent(screenName, 'video_scene_enter', {
      video_id: videoId,
      scene_index: activeCaptionIdx,
    });
    setSceneIdx(activeCaptionIdx);
  }, [activeCaptionIdx, screenName, videoId]);

  const tick = () => {
    const audio = audioRef.current;
    if (audioOk && audio && !audio.paused) {
      setRealMs(audio.currentTime * 1000);
    } else if (playingRef.current) {
      setRealMs(performance.now() - startRef.current + offsetRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    startRef.current = performance.now();
    logEvent(screenName, 'video_play', { video_id: videoId });
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      logEvent(screenName, 'video_end', {
        video_id: videoId,
        completed,
        scene_index: sceneIdxRef.current,
        watch_ms: performance.now() - enterAtRef.current,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    if (realMs >= effectiveDurationMs && !completed) {
      setCompleted(true);
      setPlaying(false);
      if (autoContinue) onDone?.();
    }
  }, [realMs, effectiveDurationMs, completed, autoContinue, onDone]);

  const onAudioEnd = () => setCompleted(true);
  const onAudioMeta = (e) => {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d) && d > 0) setRealDurationMs(d * 1000);
  };

  const replay = () => {
    setReplays((r) => r + 1);
    setCompleted(false);
    setRealMs(0);
    setSceneIdx(0);
    offsetRef.current = 0;
    startRef.current = performance.now();
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    setPlaying(true);
    logEvent(screenName, 'video_replay_tap', { video_id: videoId, replay_count: replays + 1 });
  };

  const togglePause = () => {
    const next = !playing;
    setPlaying(next);
    const audio = audioRef.current;
    if (audio) {
      if (next) audio.play().catch(() => {});
      else {
        audio.pause();
        offsetRef.current = audio.currentTime * 1000;
      }
    } else {
      if (next) startRef.current = performance.now();
      else offsetRef.current = realMs;
    }
    logEvent(screenName, next ? 'video_play' : 'video_pause', {
      video_id: videoId, position_ms: realMs, scene_index: sceneIdxRef.current,
    });
  };

  const progress = Math.min(1, realMs / effectiveDurationMs);

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div className="h-full w-full max-w-[1280px]">
          <Scene currentMs={designedMs} />
        </div>
        {activeCaption && (
          <div className="absolute bottom-6 left-1/2 max-w-[920px] -translate-x-1/2 transform rounded-full bg-ink/85 px-6 py-3 text-center text-body text-white">
            {resolveText(activeCaption)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-10 pb-6 pt-2">
        <button
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={togglePause}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-body"
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
          <div
            className="absolute inset-y-0 left-0 bg-action-green transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="min-w-[80px] text-right font-mono text-badge text-ink/60">
          {Math.floor(realMs / 1000)}s / {Math.floor(effectiveDurationMs / 1000)}s
        </span>
        <button className="btn-outline" onClick={replay}>Replay</button>
        <button
          className="btn-primary"
          onClick={() => onDone?.()}
          disabled={!completed}
        >
          {continueLabel}
        </button>
      </div>

      {resolvedSrc && audioOk && (
        <audio
          ref={audioRef}
          src={resolvedSrc}
          autoPlay
          onLoadedMetadata={onAudioMeta}
          onEnded={onAudioEnd}
          onError={() => {
            // If the preferred-language file 404s, fall back to English once.
            if (fallbackSrc && resolvedSrc !== fallbackSrc) {
              setResolvedSrc(fallbackSrc);
              logEvent(screenName, 'video_narration_fallback', { video_id: videoId, from: lang, to: 'en' });
            } else {
              setAudioOk(false);
            }
          }}
        />
      )}
    </div>
  );
}

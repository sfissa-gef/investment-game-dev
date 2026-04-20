import { useEffect, useState } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { useRecordingStore } from '../store/recordingStore.js';
import { t } from '../i18n/index.js';
import VideoPlayer from '../video/VideoPlayer.jsx';
import { VIDEOS, INSTRUCTIONS_SEQUENCE } from '../video/index.js';

export default function Instructions() {
  const transition = useGameStore((s) => s.transition);
  const session = useGameStore((s) => s.session);
  const startRecording = useRecordingStore((s) => s.start);
  const recordingActive = useRecordingStore((s) => s.active);
  const recordingError = useRecordingStore((s) => s.error);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (session?.audioRecordingEnabled) {
      startRecording(session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId]);
  const videoKey = INSTRUCTIONS_SEQUENCE[idx];
  const video = VIDEOS[videoKey];

  const onDone = () => {
    if (idx < INSTRUCTIONS_SEQUENCE.length - 1) {
      setIdx(idx + 1);
    } else {
      transition(SCREENS.PRACTICE_DECISION);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-10 pt-6">
        <div>
          <p className="text-badge uppercase tracking-[0.2em] text-ink/50">Part {idx + 1} of {INSTRUCTIONS_SEQUENCE.length}</p>
          <h1 className="mt-1 text-heading">{t(video.titleKey)}</h1>
        </div>
        <div className="flex items-center gap-3">
          {session?.audioRecordingEnabled && (
            <span className={recordingActive ? 'chip chip-warn' : 'chip'}>
              {recordingActive ? '● Recording' : recordingError ? 'Recording failed' : 'Recording…'}
            </span>
          )}
          <div className="flex gap-1">
            {INSTRUCTIONS_SEQUENCE.map((_, i) => (
              <span key={i} className={`h-2 w-10 rounded-full transition ${i < idx ? 'bg-action-green' : i === idx ? 'bg-action-green/60' : 'bg-ink/15'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <VideoPlayer
          key={videoKey}
          videoId={videoKey}
          screenName={SCREENS.INSTRUCTIONS}
          Scene={video.Scene}
          durationMs={video.durationMs}
          captions={video.captions}
          narrationSrc={video.narrationSrc}
          onDone={onDone}
          continueLabel={idx < INSTRUCTIONS_SEQUENCE.length - 1 ? 'Next →' : 'Start practice →'}
        />
      </div>
    </div>
  );
}

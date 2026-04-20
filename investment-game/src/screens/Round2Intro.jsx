import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { t } from '../i18n/index.js';
import VideoPlayer from '../video/VideoPlayer.jsx';
import { VIDEOS } from '../video/index.js';

export default function Round2Intro() {
  const transition = useGameStore((s) => s.transition);
  const version = useGameStore((s) => s.session?.round2Version);
  const video = version === 'B' ? VIDEOS.A7B : VIDEOS.A7A;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-10 pt-6">
        <div>
          <p className="text-badge uppercase tracking-[0.2em] text-ink/50">Before Round 2</p>
          <h1 className="mt-1 text-heading">{t(video.titleKey)}</h1>
        </div>
      </div>
      <div className="flex-1">
        <VideoPlayer
          videoId={video.id}
          screenName={SCREENS.ROUND2_INTRO}
          Scene={video.Scene}
          durationMs={video.durationMs}
          captions={video.captions}
          narrationSrc={video.narrationSrc}
          onDone={() => transition(SCREENS.VIDEO_OFFER)}
          continueLabel="Continue →"
        />
      </div>
    </div>
  );
}

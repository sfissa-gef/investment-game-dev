import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { t } from '../i18n/index.js';
import VideoPlayer from '../video/VideoPlayer.jsx';
import { VIDEOS } from '../video/index.js';

export default function InsuranceVideo() {
  const transition = useGameStore((s) => s.transition);
  const version = useGameStore((s) => s.session?.round2Version);
  const video = version === 'B' ? VIDEOS.B2 : VIDEOS.B1;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-10 pt-6">
        <div>
          <p className="text-badge uppercase tracking-[0.2em] text-ink/50">Round 2 explainer</p>
          <h1 className="mt-1 text-heading">{t(video.titleKey)}</h1>
        </div>
      </div>
      <div className="flex-1">
        <VideoPlayer
          videoId={video.id}
          screenName={SCREENS.INSURANCE_VIDEO}
          Scene={video.Scene}
          durationMs={video.durationMs}
          captions={video.captions}
          narrationSrc={video.narrationSrc}
          onDone={() => transition(SCREENS.ROUND2_DECISION)}
          continueLabel="Continue to Round 2 →"
        />
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { InsuranceIcon, BundleIcon, CoinIcon } from '../components/Icons.jsx';

export default function VideoOffer() {
  const transition = useGameStore((s) => s.transition);
  const updateRound = useGameStore((s) => s.updateRound);
  const version = useGameStore((s) => s.session?.round2Version);

  useEffect(() => {
    logEvent(SCREENS.VIDEO_OFFER, 'screen_enter', {});
  }, []);

  const choose = async (learn) => {
    await updateRound('round2', { videoChosen: learn, effectiveBudget: 25 - (learn ? 1 : 0) });
    await logEvent(SCREENS.VIDEO_OFFER, 'video_offer_tap', { choice: learn ? 'learn' : 'proceed' });
    transition(learn ? SCREENS.INSURANCE_VIDEO : SCREENS.ROUND2_DECISION);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-canvas px-10">
      <div className="flex items-center gap-4">
        {version === 'B' ? <BundleIcon size={120} /> : <InsuranceIcon size={120} />}
      </div>

      <h1 className="max-w-3xl text-center text-heading">
        Would you like to watch a short video about {version === 'B' ? 'the seed-and-insurance bundle' : 'insurance'}?
      </h1>
      <p className="flex items-center gap-2 text-body text-ink/70">
        Watching costs <CoinIcon size={24} /> 1 token from your Round 2 budget.
      </p>

      <div className="flex gap-8">
        <button
          className="flex min-h-touch items-center gap-3 rounded-2xl bg-info-blue px-10 py-6 text-body text-white shadow"
          onClick={() => choose(true)}
        >
          Yes, show me (−1 token)
        </button>
        <button
          className="min-h-touch rounded-2xl bg-earth-brown px-10 py-6 text-body text-white shadow"
          onClick={() => choose(false)}
        >
          No, go to Round 2
        </button>
      </div>
    </div>
  );
}

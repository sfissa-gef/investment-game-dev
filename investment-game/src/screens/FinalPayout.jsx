import { useEffect } from 'react';
import { SCREENS } from '../lib/constants.js';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { CoinIcon } from '../components/Icons.jsx';

export default function FinalPayout() {
  const transition = useGameStore((s) => s.transition);
  const updateSession = useGameStore((s) => s.updateSession);
  const session = useGameStore((s) => s.session);

  const r1 = session?.round1?.totalTokens ?? 0;
  const r2 = session?.round2?.totalTokens ?? 0;
  const total = r1 + r2;
  const rate = session?.currencyRate ?? 1;
  const currency = Math.round(total * rate);

  useEffect(() => {
    logEvent(SCREENS.FINAL_PAYOUT, 'screen_enter', {});
    updateSession({ totalIncentivizedTokens: total, totalPayoutCurrency: currency });
  }, [total, currency, updateSession]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-canvas">
      <h1 className="text-heading">Your final earnings</h1>

      <div className="flex items-end gap-8">
        <Stat label="Round 1" value={r1} />
        <span className="pb-4 text-token-lg text-ink/50">+</span>
        <Stat label="Round 2" value={r2} />
        <span className="pb-4 text-token-lg text-ink/50">=</span>
        <Stat label="Total tokens" value={total} big />
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-token-lg shadow">
        <CoinIcon size={40} />
        <span>{currency.toLocaleString()} local currency</span>
      </div>

      <button
        className="min-h-touch rounded-xl bg-action-green px-10 py-4 text-body text-white"
        onClick={() => transition(SCREENS.SURVEY)}
      >
        Continue
      </button>
    </div>
  );
}

function Stat({ label, value, big }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`${big ? 'text-token-xl text-action-green' : 'text-token-lg text-token-gold'}`}>
        {value}
      </span>
      <span className="text-body text-ink/60">{label}</span>
    </div>
  );
}

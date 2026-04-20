import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import { CloudGoodIcon, CloudBadIcon, CoinIcon } from '../components/Icons.jsx';
import { LockboxIcon } from '../components/Icons.jsx';

function Line({ label, value, color = 'text-ink' }) {
  return (
    <div className="flex w-full items-center justify-between border-b border-ink/10 py-2 text-body">
      <span className="text-ink/80">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

export default function RoundSummary({ screenName, roundKey, nextScreen, title }) {
  const transition = useGameStore((s) => s.transition);
  const round = useGameStore((s) => s.session?.[roundKey]) || {};

  useEffect(() => {
    logEvent(screenName, 'screen_enter', {});
  }, [screenName]);

  const good = round.weatherOutcome === 'good';
  const extras = [];
  if (round.seedsPurchased != null) extras.push(['Seed harvest', round.seedHarvest ?? 0]);
  if (round.insurancePurchased != null && round.insurancePurchased)
    extras.push(['Insurance payout', round.insurancePayout ?? 0]);
  if (round.bundlePurchased != null && round.bundlePurchased)
    extras.push(['Bundle harvest', round.bundleHarvest ?? 0]);

  return (
    <div className="flex h-full w-full flex-col items-center gap-6 bg-canvas px-10 py-8">
      <h1 className="text-heading">{title}</h1>

      <div className="flex flex-1 items-center justify-center gap-10">
        <div className="flex flex-col items-center gap-2">
          <LockboxIcon size={120} />
          <span className="text-token-lg text-token-gold">{round.tokensSaved ?? 0}</span>
          <span className="text-body text-ink/60">Savings</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          {good ? <CloudGoodIcon size={200} /> : <CloudBadIcon size={200} />}
          <span className={`text-body font-bold ${good ? 'text-lush-green' : 'text-drought-deep'}`}>
            {good ? 'Good rain' : 'Bad rain'}
          </span>
        </div>

        <div className="w-[320px] rounded-2xl bg-white p-4 shadow">
          <Line label="Tokens kept" value={round.tokensSaved ?? 0} />
          <Line label="Fertilizer harvest" value={round.fertilizerHarvest ?? 0} />
          {extras.map(([k, v]) => <Line key={k} label={k} value={v} />)}
          <Line label="Round total" value={round.totalTokens ?? 0} color="text-action-green" />
        </div>
      </div>

      <button
        className="min-h-touch rounded-xl bg-action-green px-10 py-4 text-body text-white shadow"
        onClick={() => transition(nextScreen)}
      >
        Continue
      </button>
    </div>
  );
}

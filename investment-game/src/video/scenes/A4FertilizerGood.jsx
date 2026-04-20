import { activeIn, FertilizerIcon, CloudGoodIcon, CoinStack, ArrowLabel, LushField } from '../Primitives.jsx';

export const A4_DURATION_MS = 23_000;

export const A4_CAPTIONS = [
  { startMs: 0,     endMs: 5000,  key: 'video.A4.caption.0' },
  { startMs: 5000,  endMs: 12000, key: 'video.A4.caption.1' },
  { startMs: 12000, endMs: 17000, key: 'video.A4.caption.2' },
  { startMs: 17000, endMs: 23000, key: 'video.A4.caption.3' },
];

export default function A4FertilizerGood({ currentMs }) {
  const big = activeIn(currentMs, 17000, 23000);
  const count = big ? 10 : 1;
  const out = big ? 20 : 2;

  return (
    <div className="flex h-full items-center justify-center gap-8 bg-rain-blue/10 p-10 animate-fade-up">
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: 220 }}>
          {Array.from({ length: count }).map((_, i) => (
            <FertilizerIcon key={i} size={big ? 56 : 120} />
          ))}
        </div>
        <CoinStack count={count} />
      </div>

      <div className="flex flex-col items-center gap-3">
        <CloudGoodIcon size={180} />
        <ArrowLabel label="2×" color="#1565C0" width={180} />
        <LushField />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-lush-green/20">
          <span className="text-token-xl text-lush-green">{out}</span>
        </div>
        <span className="text-badge uppercase tracking-wide text-ink/60">Harvest</span>
      </div>
    </div>
  );
}

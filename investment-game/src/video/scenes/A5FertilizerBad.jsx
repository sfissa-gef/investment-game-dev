import { activeIn, FertilizerIcon, CloudBadIcon, CoinStack, ArrowLabel,
  DroughtField, LockboxIcon, CoinIcon } from '../Primitives.jsx';

export const A5_DURATION_MS = 23_000;

export const A5_CAPTIONS = [
  { startMs: 0,     endMs: 5000,  key: 'video.A5.caption.0' },
  { startMs: 5000,  endMs: 12000, key: 'video.A5.caption.1' },
  { startMs: 12000, endMs: 17000, key: 'video.A5.caption.2' },
  { startMs: 17000, endMs: 23000, key: 'video.A5.caption.3' },
];

export default function A5FertilizerBad({ currentMs }) {
  const lockboxMoment = activeIn(currentMs, 17000, 23000);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-drought-tan/30 p-10 animate-fade-up">
      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <FertilizerIcon size={120} />
          <CoinStack count={1} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <CloudBadIcon size={180} />
          <ArrowLabel label="0×" color="#8D6E63" width={180} />
          <DroughtField />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-drought-deep/15">
            <span className="text-token-xl text-drought-deep">0</span>
          </div>
          <span className="text-badge uppercase tracking-wide text-ink/60">Harvest</span>
        </div>
      </div>

      {lockboxMoment && (
        <div
          className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card animate-fade-up"
          style={{ boxShadow: '0 0 0 4px rgba(245,166,35,0.2), 0 8px 24px rgba(0,0,0,0.1)' }}
        >
          <LockboxIcon size={80} />
          <div>
            <span className="text-token-lg text-token-gold">15</span>
            <p className="text-badge uppercase tracking-wide text-ink/60">Lockbox is safe</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <CoinIcon key={i} size={18} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

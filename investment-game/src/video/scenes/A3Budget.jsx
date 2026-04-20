import { activeIn, LockboxIcon, CoinIcon, FertilizerIcon } from '../Primitives.jsx';

export const A3_DURATION_MS = 25_000;

export const A3_CAPTIONS = [
  { startMs: 0,     endMs: 5000,  key: 'video.A3.caption.0' },
  { startMs: 5000,  endMs: 10000, key: 'video.A3.caption.1' },
  { startMs: 10000, endMs: 16000, key: 'video.A3.caption.2' },
  { startMs: 16000, endMs: 25000, key: 'video.A3.caption.3' },
];

export default function A3Budget({ currentMs }) {
  const s1 = activeIn(currentMs, 0, 5000);
  const s2 = activeIn(currentMs, 5000, 10000);
  const s3 = activeIn(currentMs, 10000, 16000);
  const s4 = activeIn(currentMs, 16000, 25000);

  let display = 25;
  if (s2) display = Math.max(18, Math.round(25 - ((currentMs - 5000) / 5000) * 7));
  if (s3) display = 0;
  if (s4) {
    const t = Math.min(1, (currentMs - 16000) / 3000);
    display = Math.round(t * 25);
  }

  const fallingCoins = s1 ? Math.min(25, Math.floor((currentMs / 5000) * 25)) : null;

  return (
    <div className="flex h-full items-center justify-center gap-16 p-10">
      <div className="flex flex-col items-center gap-4">
        {s1 && (
          <div className="relative h-32 w-full">
            {Array.from({ length: fallingCoins || 0 }).map((_, i) => (
              <span
                key={i}
                className="absolute top-0 animate-fade-up"
                style={{
                  left: `${15 + (i % 8) * 22}px`,
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <CoinIcon size={28} />
              </span>
            ))}
          </div>
        )}
        <LockboxIcon size={200} />
        <span className="text-[96px] font-extrabold leading-none text-token-gold">{display}</span>
        <span className="text-body text-ink/60">tokens</span>
      </div>

      {s2 && (
        <div className="flex flex-col items-center gap-3 animate-fade-up">
          <FertilizerIcon size={120} />
          <span className="text-body text-ink/70">bought with 7 tokens</span>
        </div>
      )}
      {s3 && (
        <div className="rounded-full bg-action-green/15 px-8 py-4 text-heading text-action-green animate-fade-up">
          NEW SEASON
        </div>
      )}
      {s4 && (
        <div className="rounded-2xl bg-drought-tan/40 px-8 py-4 text-body text-ink animate-fade-up">
          Fresh 25 each season — nothing carries over.
        </div>
      )}
    </div>
  );
}

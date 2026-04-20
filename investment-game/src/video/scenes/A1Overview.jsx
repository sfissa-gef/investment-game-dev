import { activeIn, FarmerField, CoinIcon, PlantSeedlingIcon } from '../Primitives.jsx';

export const A1_DURATION_MS = 28_000;

export const A1_CAPTIONS = [
  { startMs: 0,     endMs: 6000,  key: 'video.A1.caption.0' },
  { startMs: 6000,  endMs: 14000, key: 'video.A1.caption.1' },
  { startMs: 14000, endMs: 22000, key: 'video.A1.caption.2' },
  { startMs: 22000, endMs: 28000, key: 'video.A1.caption.3' },
];

function SeasonBadge({ kind, dim }) {
  const bg = kind === 'practice' ? '#E8F5E9' : '#FFF3C4';
  const border = kind === 'practice' ? '#7CB342' : '#F5A623';
  return (
    <div className={`flex flex-col items-center gap-2 transition-opacity ${dim ? 'opacity-40' : 'opacity-100'}`}>
      <div className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: bg, border: `4px solid ${border}` }}>
        {kind === 'practice'
          ? <PlantSeedlingIcon size={48} color="#33691E" />
          : <CoinIcon size={48} />}
      </div>
      <span className="text-badge uppercase tracking-wide text-ink/70">
        {kind === 'practice' ? 'Practice' : 'Real'}
      </span>
    </div>
  );
}

export default function A1Overview({ currentMs }) {
  const s2 = activeIn(currentMs, 6000, 14000);
  const s3 = activeIn(currentMs, 14000, 22000);
  const s4 = activeIn(currentMs, 22000, 28000);

  const showPractice = currentMs > 1000;
  const showReal1 = currentMs > 2500;
  const showReal2 = currentMs > 4000;
  const dimPractice = s2 || s3 || s4;
  const glowReal = s3 || s4;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 p-10 animate-fade-up">
      <FarmerField scale={0.9} />
      <div className="flex items-center gap-10">
        {showPractice && <SeasonBadge kind="practice" dim={dimPractice} />}
        {showReal1 && <SeasonBadge kind="real" dim={false} />}
        {showReal2 && <SeasonBadge kind="real" dim={false} />}
      </div>
      {glowReal && (
        <div className="flex items-center gap-3 rounded-full bg-token-gold/20 px-6 py-3 text-body text-ink animate-fade-up">
          <CoinIcon size={28} />
          <span>→ real money today</span>
        </div>
      )}
    </div>
  );
}

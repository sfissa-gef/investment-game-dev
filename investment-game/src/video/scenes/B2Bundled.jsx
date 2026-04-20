import { activeIn, BundleIcon, SeedIcon, InsuranceIcon,
  CloudGoodIcon, CloudBadIcon, CoinStack, BigNumber } from '../Primitives.jsx';

export const B2_DURATION_MS = 30_000;

export const B2_CAPTIONS = [
  { startMs: 0,     endMs: 8000,  key: 'video.B2.caption.0' },
  { startMs: 8000,  endMs: 16000, key: 'video.B2.caption.1' },
  { startMs: 16000, endMs: 25000, key: 'video.B2.caption.2' },
  { startMs: 25000, endMs: 30000, key: 'video.B2.caption.3' },
];

export default function B2Bundled({ currentMs }) {
  const scene1 = activeIn(currentMs, 0, 8000);
  const scene2 = activeIn(currentMs, 8000, 16000);
  const scene3 = activeIn(currentMs, 16000, 25000);
  const scene4 = activeIn(currentMs, 25000, 30000);

  if (scene1) {
    const showBreakdown = currentMs > 4000;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-10 p-10 animate-fade-up">
        <h2 className="text-heading">The bundle — seeds with insurance included</h2>
        <div className="flex flex-col items-center gap-2">
          <BundleIcon size={160} />
          <span className="text-badge uppercase tracking-wide text-ink/60">Total price</span>
          <CoinStack count={12} color="#2e7d32" />
        </div>
        {showBreakdown && (
          <div className="flex items-end gap-6 animate-fade-up">
            <div className="flex flex-col items-center gap-2">
              <span className="text-badge uppercase tracking-wide text-ink/60">of which seeds</span>
              <CoinStack count={10} />
            </div>
            <span className="pb-8 text-token-lg text-ink/50">+</span>
            <div className="flex flex-col items-center gap-2">
              <span className="text-badge uppercase tracking-wide text-ink/60">of which insurance</span>
              <CoinStack count={2} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (scene2) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-rain-blue/20 p-10 animate-fade-up">
        <div className="flex items-center gap-6">
          <CloudGoodIcon size={160} />
          <h2 className="text-heading">Good rain</h2>
        </div>
        <div className="grid w-full max-w-[900px] grid-cols-2 gap-10">
          <div className="card flex flex-col items-center gap-3 p-6">
            <span className="text-badge uppercase tracking-wide text-ink/60">You invested</span>
            <div className="flex items-center gap-4">
              <BundleIcon size={80} />
              <CoinStack count={12} />
            </div>
          </div>
          <div className="card flex flex-col items-center gap-3 p-6">
            <span className="text-badge uppercase tracking-wide text-ink/60">You earn</span>
            <BigNumber value={30} color="#2e7d32" />
            <span className="text-badge text-ink/60">Insurance not needed</span>
          </div>
        </div>
      </div>
    );
  }

  if (scene3) {
    const insuranceGlow = currentMs > 19000;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-drought-tan/30 p-10 animate-fade-up">
        <div className="flex items-center gap-6">
          <CloudBadIcon size={160} />
          <h2 className="text-heading">Bad rain</h2>
        </div>
        <div className="grid w-full max-w-[900px] grid-cols-2 gap-10">
          <div className="card flex flex-col items-center gap-3 p-6">
            <span className="text-badge uppercase tracking-wide text-ink/60">You invested</span>
            <div className="flex items-center gap-4">
              <BundleIcon size={80} />
              <CoinStack count={12} />
            </div>
          </div>
          <div className="card flex flex-col items-center gap-4 p-6">
            <span className="text-badge uppercase tracking-wide text-ink/60">You earn</span>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1 opacity-40">
                <SeedIcon size={56} />
                <span className="text-token-lg font-bold">0</span>
              </div>
              <div className={`flex flex-col items-center gap-1 ${insuranceGlow ? 'scale-110' : ''} transition-transform`}>
                <div style={{ filter: insuranceGlow ? 'drop-shadow(0 0 14px #F5A623)' : 'none' }}>
                  <InsuranceIcon size={56} />
                </div>
                <span className="text-token-lg font-bold text-token-gold">10</span>
              </div>
            </div>
            <span className="text-badge text-ink/60">Insurance inside the bundle paid out</span>
          </div>
        </div>
      </div>
    );
  }

  if (scene4) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 p-10 animate-fade-up">
        <h2 className="text-heading">Either way, you get something back</h2>
        <div className="grid grid-cols-2 gap-10">
          <div className="card flex flex-col items-center gap-4 bg-rain-blue/20 p-8">
            <CloudGoodIcon size={140} />
            <BigNumber value={30} color="#2e7d32" label="Good rain" />
          </div>
          <div className="card flex flex-col items-center gap-4 bg-drought-tan/30 p-8">
            <CloudBadIcon size={140} />
            <BigNumber value={10} color="#8a5500" label="Bad rain" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

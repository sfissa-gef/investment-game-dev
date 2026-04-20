import { activeIn,
  SeedIcon, InsuranceIcon, CloudGoodIcon, CloudBadIcon,
  CoinStack, Equation, BigNumber } from '../Primitives.jsx';

export const B1_DURATION_MS = 30_000;

export const B1_CAPTIONS = [
  { startMs: 0,     endMs: 7000,  key: 'video.B1.caption.0' },
  { startMs: 7000,  endMs: 16000, key: 'video.B1.caption.1' },
  { startMs: 16000, endMs: 25000, key: 'video.B1.caption.2' },
  { startMs: 25000, endMs: 30000, key: 'video.B1.caption.3' },
];

export default function B1Unbundled({ currentMs }) {
  const scene1 = activeIn(currentMs, 0, 7000);
  const scene2 = activeIn(currentMs, 7000, 16000);
  const scene3 = activeIn(currentMs, 16000, 25000);
  const scene4 = activeIn(currentMs, 25000, 30000);

  if (scene1) {
    const showSeeds = currentMs > 500;
    const showInsurance = currentMs > 2500;
    const showEq = currentMs > 4500;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-10 p-10 animate-fade-up">
        <h2 className="text-heading">How much you pay</h2>
        <div className="flex items-center gap-12">
          {showSeeds && (
            <div className="flex flex-col items-center gap-3 animate-fade-up">
              <SeedIcon size={120} />
              <CoinStack count={10} />
            </div>
          )}
          {showInsurance && (
            <span className="pt-10 text-token-xl text-ink/70 animate-fade-up">+</span>
          )}
          {showInsurance && (
            <div className="flex flex-col items-center gap-3 animate-fade-up">
              <InsuranceIcon size={120} />
              <CoinStack count={2} />
            </div>
          )}
          {showEq && (
            <div className="ml-6 animate-fade-up">
              <span className="text-token-xl text-ink/70">=</span>
              <div className="mt-3"><CoinStack count={12} color="#2e7d32" label="total" /></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (scene2) {
    const rightVisible = currentMs > 9000;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-rain-blue/20 p-10 animate-fade-up">
        <div className="flex items-center gap-6">
          <CloudGoodIcon size={160} />
          <h2 className="text-heading">Good rain</h2>
        </div>
        <div className="grid w-full max-w-[900px] grid-cols-2 gap-10">
          <div className="card flex flex-col items-center gap-3 p-6">
            <span className="text-badge uppercase tracking-wide text-ink/60">You invested</span>
            <CoinStack count={12} />
          </div>
          {rightVisible && (
            <div className="card flex flex-col items-center gap-3 p-6 animate-fade-up">
              <span className="text-badge uppercase tracking-wide text-ink/60">You earn</span>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-1">
                  <SeedIcon size={56} />
                  <span className="text-token-lg font-bold text-lush-green">30</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <InsuranceIcon size={56} />
                  <span className="text-token-lg font-bold">0</span>
                </div>
              </div>
            </div>
          )}
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
            <CoinStack count={12} />
          </div>
          <div className="card flex flex-col items-center gap-3 p-6">
            <span className="text-badge uppercase tracking-wide text-ink/60">You earn</span>
            <div className="flex items-center gap-8">
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

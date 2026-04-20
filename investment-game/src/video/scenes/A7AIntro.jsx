import { activeIn, SeedIcon, InsuranceIcon, CoinStack, FertilizerIcon } from '../Primitives.jsx';

export const A7A_DURATION_MS = 32_000;

export const A7A_CAPTIONS = [
  { startMs: 0,     endMs: 7000,  key: 'video.A7A.caption.0' },
  { startMs: 7000,  endMs: 14000, key: 'video.A7A.caption.1' },
  { startMs: 14000, endMs: 24000, key: 'video.A7A.caption.2' },
  { startMs: 24000, endMs: 32000, key: 'video.A7A.caption.3' },
];

export default function A7AIntro({ currentMs }) {
  const s1 = activeIn(currentMs, 0, 7000);
  const s2 = activeIn(currentMs, 7000, 14000);
  const s3 = activeIn(currentMs, 14000, 24000);
  const s4 = activeIn(currentMs, 24000, 32000);

  if (s1) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 p-10 animate-fade-up">
        <span className="chip chip-info">Round 2 — one more season</span>
        <h2 className="max-w-3xl text-center text-heading">This round counts for your payment, just like Round 1.</h2>
      </div>
    );
  }

  if (s2) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 p-10 animate-fade-up">
        <h2 className="text-heading">Your decision is a little more complicated</h2>
        <div className="flex items-end gap-8">
          <div className="flex flex-col items-center gap-2">
            <FertilizerIcon size={100} />
            <span className="text-body text-ink/70">Fertilizer (as before)</span>
          </div>
          <span className="pb-10 text-token-lg text-ink/40">+ new options:</span>
          <div className="flex flex-col items-center gap-2">
            <SeedIcon size={100} />
            <span className="text-body text-ink/70">Improved seeds</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <InsuranceIcon size={100} />
            <span className="text-body text-ink/70">Insurance</span>
          </div>
        </div>
      </div>
    );
  }

  if (s3) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-10 animate-fade-up">
        <h2 className="text-heading">Improved seeds — 10 tokens</h2>
        <div className="grid w-full max-w-[900px] grid-cols-2 gap-10">
          <div className="card flex flex-col items-center gap-3 bg-rain-blue/20 p-6">
            <span className="text-badge uppercase tracking-wide text-ink/60">Good rain</span>
            <SeedIcon size={96} />
            <span className="text-token-lg font-bold text-lush-green">+30 tokens</span>
          </div>
          <div className="card flex flex-col items-center gap-3 bg-drought-tan/30 p-6">
            <span className="text-badge uppercase tracking-wide text-ink/60">Bad rain</span>
            <SeedIcon size={96} />
            <span className="text-token-lg font-bold text-drought-deep">0 tokens</span>
          </div>
        </div>
      </div>
    );
  }

  if (s4) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-10 animate-fade-up">
        <h2 className="text-heading">Insurance — 2 tokens more</h2>
        <p className="max-w-2xl text-center text-body text-ink/70">
          Optional add-on if you buy seeds. It helps you recoup the seed cost if the rain is bad.
        </p>
        <div className="flex items-center gap-6">
          <SeedIcon size={80} />
          <span className="text-token-lg text-ink/50">+</span>
          <InsuranceIcon size={80} />
          <span className="text-token-lg text-ink/50">=</span>
          <CoinStack count={12} color="#2e7d32" label="total" />
        </div>
      </div>
    );
  }

  return null;
}

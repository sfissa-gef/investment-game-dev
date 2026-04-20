import { activeIn, LockboxIcon, FertilizerIcon, PlantSeedlingIcon } from '../Primitives.jsx';

export const A6_DURATION_MS = 30_000;

export const A6_CAPTIONS = [
  { startMs: 0,     endMs: 5000,  key: 'video.A6.caption.0' },
  { startMs: 5000,  endMs: 10000, key: 'video.A6.caption.1' },
  { startMs: 10000, endMs: 18000, key: 'video.A6.caption.2' },
  { startMs: 18000, endMs: 23000, key: 'video.A6.caption.3' },
  { startMs: 23000, endMs: 30000, key: 'video.A6.caption.4' },
];

export default function A6UiTutorial({ currentMs }) {
  // Simulate +3 taps during 10–18s
  const tapProgress = Math.max(0, Math.min(3, Math.floor((currentMs - 10000) / 2500)));
  const fert = tapProgress;
  const lockbox = 25 - fert;

  const highlightLockbox = activeIn(currentMs, 5000, 10000);
  const highlightStepper = activeIn(currentMs, 10000, 18000);
  const highlightPlant = activeIn(currentMs, 18000, 23000);
  const showDialog = activeIn(currentMs, 23000, 30000);

  const ring = (flag) => flag
    ? { boxShadow: '0 0 0 6px rgba(245,166,35,0.45)', borderRadius: '16px' }
    : {};

  return (
    <div className="relative flex h-full w-full items-center justify-between gap-6 bg-canvas px-10">
      <div className="flex flex-col items-center gap-2" style={ring(highlightLockbox)}>
        <LockboxIcon size={180} />
        <span className="text-token-xl text-token-gold">{lockbox}</span>
        <span className="text-body text-ink/60">tokens</span>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl p-5" style={ring(highlightStepper)}>
        <div className="relative">
          <FertilizerIcon size={120} />
          <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-token-gold text-badge text-ink">1</span>
        </div>
        <span className="text-body font-semibold">Fertilizer</span>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-ink/30 text-center text-token-lg font-bold leading-[64px] text-white">−</div>
          <span className="text-token-lg font-bold">{fert}</span>
          <div className="h-16 w-16 rounded-xl bg-ink text-center text-token-lg font-bold leading-[64px] text-white">+</div>
        </div>
      </div>

      <div className="flex h-[128px] w-[128px] flex-col items-center justify-center gap-1 rounded-full bg-action-green text-white shadow-xl" style={ring(highlightPlant)}>
        <PlantSeedlingIcon size={56} />
        <span className="text-body font-bold">Plant</span>
      </div>

      {showDialog && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-fade-up">
          <div className="w-[560px] rounded-2xl bg-white p-8 text-center shadow-card">
            <h2 className="text-heading">Are you sure?</h2>
            <p className="mt-3 text-body">You cannot change your decision after planting.</p>
            <div className="mt-6 flex justify-between gap-6">
              <div className="flex-1 rounded-xl bg-earth-brown px-6 py-4 text-body text-white">Go back</div>
              <div className="flex-1 rounded-xl bg-action-green px-6 py-4 text-body text-white">Yes, plant now</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

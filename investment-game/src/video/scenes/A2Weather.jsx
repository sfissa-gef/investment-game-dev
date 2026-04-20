import { activeIn, LushField, DroughtField, CloudGoodIcon, CloudBadIcon, FiveMarbles } from '../Primitives.jsx';

export const A2_DURATION_MS = 30_000;

export const A2_CAPTIONS = [
  { startMs: 0,     endMs: 4000,  key: 'video.A2.caption.0' },
  { startMs: 4000,  endMs: 14000, key: 'video.A2.caption.1' },
  { startMs: 14000, endMs: 22000, key: 'video.A2.caption.2' },
  { startMs: 22000, endMs: 30000, key: 'video.A2.caption.3' },
];

function FiveDots({ good, bad }) {
  return (
    <div className="flex gap-3">
      {[0, 1, 2, 3, 4].map((i) => {
        const isBad = i === 4;
        const lit = isBad ? i < bad + 4 : i < good;
        return (
          <span key={i} className="h-6 w-6 rounded-full transition-all"
            style={{ background: lit ? (isBad ? '#A1887F' : '#90CAF9') : 'rgba(0,0,0,0.08)' }} />
        );
      })}
    </div>
  );
}

export default function A2Weather({ currentMs }) {
  const s3 = activeIn(currentMs, 14000, 22000);
  const s4 = activeIn(currentMs, 22000, 30000);

  // dots lighting up one-by-one during s2 (4..14s window, one dot per ~2s)
  const goodDots = Math.min(4, Math.max(0, Math.floor((currentMs - 4000) / 2000) + 1));
  const badDot = currentMs > 16000 ? 1 : 0;

  if (s4) {
    const outcome = Math.floor(currentMs / 1500) % 2 === 0 ? 'good' : 'bad';
    return (
      <div className="flex h-full items-center justify-center gap-16 p-10 animate-fade-up">
        <div className="flex flex-col items-center gap-3">
          <FiveMarbles rolled={outcome} />
          <span className="text-badge uppercase tracking-wide text-ink/60">Random each season</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          {outcome === 'good' ? <CloudGoodIcon size={220} /> : <CloudBadIcon size={220} />}
          <span className={`text-heading ${outcome === 'good' ? 'text-lush-green' : 'text-drought-deep'}`}>
            {outcome === 'good' ? 'Good rain' : 'Bad rain'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-[1fr_1fr] gap-6 p-10">
      <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all ${s3 ? 'opacity-40' : 'opacity-100 bg-rain-blue/20'}`}>
        <CloudGoodIcon size={180} />
        <LushField />
        <FiveDots good={goodDots} bad={0} />
        <span className="text-body font-bold text-lush-green">4 out of 5 — good rain</span>
      </div>
      <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all ${s3 ? 'opacity-100 bg-drought-tan/30' : 'opacity-50'}`}>
        <CloudBadIcon size={180} />
        <DroughtField />
        <FiveDots good={0} bad={badDot} />
        <span className="text-body font-bold text-drought-deep">1 out of 5 — bad rain</span>
      </div>
    </div>
  );
}

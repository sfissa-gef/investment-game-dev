import { CoinIcon, LockboxIcon, FertilizerIcon, SeedIcon, InsuranceIcon,
  BundleIcon, CloudGoodIcon, CloudBadIcon, PlantSeedlingIcon,
  FarmerIcon, CornIcon, WiltedIcon, DropletIcon } from '../components/Icons.jsx';

// Small timing helpers
export const tween = (t, from, to) => from + (to - from) * Math.min(1, Math.max(0, t));
export const sceneWindow = (currentMs, startMs, endMs) => {
  if (currentMs < startMs) return 0;
  if (currentMs >= endMs) return 1;
  return (currentMs - startMs) / (endMs - startMs);
};
export const activeIn = (currentMs, startMs, endMs) => currentMs >= startMs && currentMs < endMs;

export function CoinStack({ count, visible = true, label, color = '#1B1B1B' }) {
  if (!visible) return null;
  const coins = [];
  for (let i = 0; i < Math.min(count, 12); i++) {
    coins.push(
      <div key={i} style={{ marginLeft: i > 0 ? -14 : 0 }}>
        <CoinIcon size={34} />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center">{coins}</div>
      <span className="text-token-lg font-bold" style={{ color }}>{count}</span>
      {label && <span className="text-badge uppercase tracking-wide text-ink/60">{label}</span>}
    </div>
  );
}

export function Equation({ left, op = '+', right, result, opColor = '#1B1B1B' }) {
  return (
    <div className="flex items-end gap-6">
      <CoinStack count={left} />
      <span className="pb-10 text-token-xl" style={{ color: opColor }}>{op}</span>
      <CoinStack count={right} />
      <span className="pb-10 text-token-xl text-ink/70">=</span>
      <CoinStack count={result} color="#2e7d32" />
    </div>
  );
}

export function BigNumber({ value, color = '#1B1B1B', label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[96px] font-extrabold leading-none" style={{ color }}>{value}</span>
      {label && <span className="mt-2 text-badge uppercase tracking-wide text-ink/60">{label}</span>}
    </div>
  );
}

// Composes the professional farmer + corn icons over a soft gradient landscape.
export function FarmerField({ scale = 1 }) {
  const width = 520 * scale, height = 280 * scale;
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ width, height }}>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #BBDEFB 0%, #E3F2FD 60%, #7CB342 60%, #689F38 100%)',
      }} />
      <div className="absolute left-0 right-0 top-[55%] flex items-end justify-around px-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <CornIcon key={i} size={Math.round(60 * scale)} />
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 transform">
        <FarmerIcon size={Math.round(110 * scale)} />
      </div>
    </div>
  );
}

export function LushField() {
  return (
    <div className="relative h-[240px] w-[460px] overflow-hidden rounded-2xl" style={{
      background: 'linear-gradient(to bottom, #BBDEFB 0%, #E3F2FD 50%, #7CB342 50%, #558B2F 100%)',
    }}>
      <div className="absolute left-0 right-0 top-[58%] flex items-end justify-around px-4">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <CornIcon key={i} size={54} />
        ))}
      </div>
    </div>
  );
}

export function DroughtField() {
  return (
    <div className="relative h-[240px] w-[460px] overflow-hidden rounded-2xl" style={{
      background: 'linear-gradient(to bottom, #FFF8E1 0%, #FFECB3 50%, #D7CCC8 50%, #A1887F 100%)',
    }}>
      <div className="absolute left-0 right-0 top-[62%] flex items-end justify-around px-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <WiltedIcon key={i} size={48} />
        ))}
      </div>
      {/* subtle crack lines */}
      <svg className="absolute inset-0" width="460" height="240" viewBox="0 0 460 240" preserveAspectRatio="none">
        <path d="M50 205 L120 215 L190 205" stroke="#8D6E63" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M260 220 L320 210 L400 222" stroke="#8D6E63" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    </div>
  );
}

export function RainDrops({ count = 8 }) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animation: `rain-fall 900ms ease-in ${i * 90}ms infinite` }}>
          <DropletIcon size={22} />
        </div>
      ))}
    </div>
  );
}

export function ArrowLabel({ label, color = '#1565C0', width = 160 }) {
  return (
    <div className="flex items-center">
      <div className="relative h-2 rounded-full" style={{ width, background: color }} />
      <div style={{ borderLeft: `14px solid ${color}`, borderTop: '10px solid transparent', borderBottom: '10px solid transparent' }} />
      <span className="ml-3 text-token-lg font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

export function FiveMarbles({ rolled = null }) {
  // 4 blue + 1 tan; if rolled === 'good' highlight one of the blues; 'bad' highlight the tan
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="210" height="160" viewBox="0 0 210 160">
        <defs>
          <linearGradient id="bag-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5E9D4" />
            <stop offset="100%" stopColor="#D7CCC8" />
          </linearGradient>
        </defs>
        <path d="M10 40 Q105 0 200 40 L195 140 Q105 170 15 140 Z"
          fill="url(#bag-gradient)" stroke="#8D6E63" strokeWidth="3" />
        {[30, 70, 110, 150, 180].map((x, i) => {
          const bad = i === 4;
          const fill = bad ? '#A1887F' : '#64B5F6';
          const highlight = (rolled === 'good' && i === 1) || (rolled === 'bad' && bad);
          return (
            <circle key={x} cx={x} cy={80} r={highlight ? 19 : 14}
              fill={fill}
              stroke={highlight ? '#F5A623' : '#263238'} strokeWidth={highlight ? 4 : 1.5} />
          );
        })}
      </svg>
    </div>
  );
}

export { CoinIcon, LockboxIcon, FertilizerIcon, SeedIcon, InsuranceIcon,
  BundleIcon, CloudGoodIcon, CloudBadIcon, PlantSeedlingIcon,
  FarmerIcon, CornIcon, WiltedIcon, DropletIcon };

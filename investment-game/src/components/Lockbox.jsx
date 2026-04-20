import { useEffect, useState } from 'react';
import { LockboxIcon } from './Icons.jsx';

export default function Lockbox({ tokens, label = 'My savings' }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 250);
    return () => clearTimeout(t);
  }, [tokens]);

  return (
    <div className="flex flex-col items-center gap-3">
      <LockboxIcon size={180} />
      <div
        className={`flex items-baseline gap-2 transition-transform ${pulse ? 'scale-110' : 'scale-100'}`}
        aria-live="polite"
      >
        <span className="text-token-xl text-token-gold">{tokens}</span>
        <span className="text-body text-ink/70">tokens</span>
      </div>
      <span className="text-body text-ink/60">{label}</span>
    </div>
  );
}

import { CloudGoodIcon, CloudBadIcon } from './Icons.jsx';

function Row({ label, good, bad }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 text-body">
      <span className="text-ink/80">{label}</span>
      <span className="text-center text-lush-green font-bold">{good}</span>
      <span className="text-center text-drought-deep font-bold">{bad}</span>
    </div>
  );
}

export default function PayoutReminder({ variant }) {
  return (
    <div className="w-[300px] rounded-2xl border-2 border-ink/10 bg-white/90 p-4 shadow-md">
      <h3 className="mb-2 text-center text-badge font-bold tracking-wide text-ink/70">
        PAYOUT REMINDER
      </h3>
      <div className="grid grid-cols-3 items-center gap-2 border-b border-ink/10 pb-2">
        <span />
        <div className="flex flex-col items-center">
          <CloudGoodIcon size={48} />
          <span className="text-badge">Good rain</span>
        </div>
        <div className="flex flex-col items-center">
          <CloudBadIcon size={48} />
          <span className="text-badge">Bad rain</span>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <Row label="Fertilizer (1 token)" good="+2 / unit" bad="0" />
        {variant === 'A' && (
          <>
            <Row label="Seeds (10 tokens)" good="+30" bad="0" />
            <Row label="Insurance (2 tokens)" good="0" bad="+10" />
          </>
        )}
        {variant === 'B' && <Row label="Bundle (12 tokens)" good="+30" bad="+10" />}
      </div>
    </div>
  );
}

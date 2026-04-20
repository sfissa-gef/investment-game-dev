import { logEvent } from '../store/eventLog.js';

export default function TokenStepper({
  screenName,
  inputKey,
  label,
  price,
  icon,
  value,
  min = 0,
  max,
  onChange,
  disabled = false,
  disabledReason,
  lockboxAfter,
}) {
  const canDec = !disabled && value > min;
  const canInc = !disabled && value < max;

  const handle = (action) => {
    const next = action === 'increment' ? value + 1 : value - 1;
    onChange(next, { action, old_value: value, new_value: next, lockbox_after: lockboxAfter });
    logEvent(screenName, 'stepper_change', {
      input: inputKey, action, old_value: value, new_value: next, lockbox_after: lockboxAfter,
    });
  };

  const handleDisabledTap = (action) => {
    logEvent(screenName, 'stepper_disabled_tap', {
      input: inputKey, action, reason: disabledReason || 'budget_or_range',
    });
  };

  return (
    <div className={`flex flex-col items-center gap-3 rounded-2xl p-4 ${disabled ? 'opacity-40' : ''}`}>
      <div className="relative">
        {icon}
        <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-token-gold text-badge text-ink shadow">
          {price}
        </span>
      </div>
      <span className="text-body font-semibold">{label}</span>
      <div className="flex items-center gap-4">
        <button
          aria-label={`${label} decrement`}
          disabled={disabled}
          onClick={() => (canDec ? handle('decrement') : handleDisabledTap('decrement'))}
          className={`h-[72px] w-[72px] rounded-xl text-token-lg font-bold text-white transition ${
            canDec ? 'bg-ink active:scale-95' : 'bg-ink/30'
          }`}
        >
          −
        </button>
        <span className="min-w-[56px] text-center text-token-lg font-bold">{value}</span>
        <button
          aria-label={`${label} increment`}
          disabled={disabled}
          onClick={() => (canInc ? handle('increment') : handleDisabledTap('increment'))}
          className={`h-[72px] w-[72px] rounded-xl text-token-lg font-bold text-white transition ${
            canInc ? 'bg-ink active:scale-95' : 'bg-ink/30'
          }`}
        >
          +
        </button>
      </div>
      {disabled && disabledReason && (
        <span className="text-badge text-ink/60">{disabledReason}</span>
      )}
    </div>
  );
}

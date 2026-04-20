import { PlantSeedlingIcon } from './Icons.jsx';

export default function PlantButton({ onClick, label = 'Plant' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-[128px] w-[128px] flex-col items-center justify-center gap-1 rounded-full bg-action-green text-white shadow-xl transition active:scale-95"
    >
      <PlantSeedlingIcon size={56} />
      <span className="text-body font-bold">{label}</span>
    </button>
  );
}

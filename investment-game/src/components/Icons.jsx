// Icon components for the game. Professional assets sourced from Fluent Emoji
// Flat (Microsoft, MIT license) via scripts/fetch-icons.sh. One exception —
// FertilizerIcon stays custom because no emoji matches a fertilizer bag.

const AssetIcon = ({ src, size, alt = '' }) => (
  <img
    src={src}
    alt={alt}
    width={size}
    height={size}
    draggable={false}
    style={{ pointerEvents: 'none', userSelect: 'none' }}
  />
);

export const CoinIcon = ({ size = 32 }) => (
  <AssetIcon src="/icons/game/coin.svg" size={size} alt="coin" />
);

export const LockboxIcon = ({ size = 160 }) => (
  <AssetIcon src="/icons/game/lockbox.svg" size={size} alt="savings" />
);

export const SeedIcon = ({ size = 80 }) => (
  <AssetIcon src="/icons/game/seeds.svg" size={size} alt="seeds" />
);

export const InsuranceIcon = ({ size = 80 }) => (
  <AssetIcon src="/icons/game/insurance.svg" size={size} alt="insurance" />
);

export const BundleIcon = ({ size = 80 }) => (
  <AssetIcon src="/icons/game/bundle.svg" size={size} alt="bundle" />
);

export const PlantSeedlingIcon = ({ size = 56 }) => (
  <AssetIcon src="/icons/game/plant.svg" size={size} alt="plant" />
);

export const CloudGoodIcon = ({ size = 200 }) => (
  <AssetIcon src="/icons/game/cloud-good.svg" size={size} alt="good rain" />
);

export const CloudBadIcon = ({ size = 200 }) => (
  <AssetIcon src="/icons/game/cloud-bad.svg" size={size} alt="drought" />
);

export const FarmerIcon = ({ size = 120 }) => (
  <AssetIcon src="/icons/game/farmer.svg" size={size} alt="farmer" />
);

export const CornIcon = ({ size = 48 }) => (
  <AssetIcon src="/icons/game/corn.svg" size={size} alt="corn" />
);

export const WiltedIcon = ({ size = 48 }) => (
  <AssetIcon src="/icons/game/wilted.svg" size={size} alt="wilted crop" />
);

export const DropletIcon = ({ size = 24 }) => (
  <AssetIcon src="/icons/game/droplet.svg" size={size} alt="rain drop" />
);

// Custom — no emoji matches. Restyled to feel coherent with the emoji set:
// bold outlined shapes, saturated colors, a little gradient for weight.
export const FertilizerIcon = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" aria-label="fertilizer">
    <defs>
      <linearGradient id="fert-bag" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8BC34A" />
        <stop offset="100%" stopColor="#558B2F" />
      </linearGradient>
    </defs>
    <path
      d="M18 16 h44 l6 10 v42 a4 4 0 0 1 -4 4 h-48 a4 4 0 0 1 -4 -4 v-42 z"
      fill="url(#fert-bag)" stroke="#33691E" strokeWidth="2.5" strokeLinejoin="round"
    />
    <rect x="26" y="24" width="28" height="14" fill="#FFFBF2" rx="3" stroke="#2E7D32" strokeWidth="1.5" />
    <text x="40" y="35" textAnchor="middle" fontSize="11" fontWeight="800" fill="#33691E"
      fontFamily="Inter, system-ui">NPK</text>
    <circle cx="30" cy="54" r="3.5" fill="#FFFBF2" stroke="#33691E" strokeWidth="1" />
    <circle cx="44" cy="60" r="3.5" fill="#FFFBF2" stroke="#33691E" strokeWidth="1" />
    <circle cx="54" cy="50" r="3.5" fill="#FFFBF2" stroke="#33691E" strokeWidth="1" />
    <circle cx="38" cy="48" r="3" fill="#FFFBF2" stroke="#33691E" strokeWidth="1" />
  </svg>
);

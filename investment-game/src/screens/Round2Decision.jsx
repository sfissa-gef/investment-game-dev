import { useGameStore } from '../store/gameStore.js';
import Round2VersionA from './Round2VersionA.jsx';
import Round2VersionB from './Round2VersionB.jsx';

export default function Round2Decision() {
  const version = useGameStore((s) => s.session?.round2Version);
  return version === 'B' ? <Round2VersionB /> : <Round2VersionA />;
}

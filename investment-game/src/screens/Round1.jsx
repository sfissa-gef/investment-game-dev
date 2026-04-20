import { SCREENS } from '../lib/constants.js';
import FertilizerOnlyDecision from './FertilizerOnlyDecision.jsx';

export default function Round1() {
  return (
    <FertilizerOnlyDecision
      screenName={SCREENS.ROUND1_DECISION}
      roundKey="round1"
      weatherScreen={SCREENS.ROUND1_WEATHER}
      title="Round 1 — this one counts for real"
    />
  );
}

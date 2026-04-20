import { SCREENS } from '../lib/constants.js';
import FertilizerOnlyDecision from './FertilizerOnlyDecision.jsx';

export default function PracticeRound() {
  return (
    <FertilizerOnlyDecision
      screenName={SCREENS.PRACTICE_DECISION}
      roundKey="practiceRound"
      weatherScreen={SCREENS.PRACTICE_WEATHER}
      title="Practice round — how much fertilizer?"
    />
  );
}

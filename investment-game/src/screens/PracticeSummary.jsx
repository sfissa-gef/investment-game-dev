import { SCREENS } from '../lib/constants.js';
import RoundSummary from './RoundSummary.jsx';

export default function PracticeSummary() {
  return (
    <RoundSummary
      screenName={SCREENS.PRACTICE_SUMMARY}
      roundKey="practiceRound"
      nextScreen={SCREENS.ROUND1_DECISION}
      title="Practice result (not counted)"
    />
  );
}

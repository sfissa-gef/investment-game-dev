import { SCREENS } from '../lib/constants.js';
import RoundSummary from './RoundSummary.jsx';

export default function Round2Summary() {
  return (
    <RoundSummary
      screenName={SCREENS.ROUND2_SUMMARY}
      roundKey="round2"
      nextScreen={SCREENS.FINAL_PAYOUT}
      title="Round 2 result"
    />
  );
}

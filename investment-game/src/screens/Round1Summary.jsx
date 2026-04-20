import { SCREENS } from '../lib/constants.js';
import RoundSummary from './RoundSummary.jsx';

export default function Round1Summary() {
  return (
    <RoundSummary
      screenName={SCREENS.ROUND1_SUMMARY}
      roundKey="round1"
      nextScreen={SCREENS.ROUND2_INTRO}
      title="Round 1 result"
    />
  );
}

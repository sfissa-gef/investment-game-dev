import { useEffect } from 'react';
import { useGameStore } from './store/gameStore.js';
import { SCREENS } from './lib/constants.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import StatusBar from './components/StatusBar.jsx';
import AdminPanel from './admin/AdminPanel.jsx';

import Welcome from './screens/Welcome.jsx';
import LanguageSelect from './screens/LanguageSelect.jsx';
import EnumeratorSetup from './screens/EnumeratorSetup.jsx';
import Instructions from './screens/Instructions.jsx';
import PracticeRound from './screens/PracticeRound.jsx';
import PracticeWeather from './screens/PracticeWeather.jsx';
import PracticeSummary from './screens/PracticeSummary.jsx';
import Round1 from './screens/Round1.jsx';
import Round1Weather from './screens/Round1Weather.jsx';
import Round1Summary from './screens/Round1Summary.jsx';
import Round2Intro from './screens/Round2Intro.jsx';
import VideoOffer from './screens/VideoOffer.jsx';
import InsuranceVideo from './screens/InsuranceVideo.jsx';
import Round2Decision from './screens/Round2Decision.jsx';
import Round2Weather from './screens/Round2Weather.jsx';
import Round2Summary from './screens/Round2Summary.jsx';
import FinalPayout from './screens/FinalPayout.jsx';
import Survey from './screens/Survey.jsx';
import Completion from './screens/Completion.jsx';

const MAP = {
  [SCREENS.WELCOME]: Welcome,
  [SCREENS.LANGUAGE_SELECT]: LanguageSelect,
  [SCREENS.ENUMERATOR_SETUP]: EnumeratorSetup,
  [SCREENS.INSTRUCTIONS]: Instructions,
  [SCREENS.PRACTICE_DECISION]: PracticeRound,
  [SCREENS.PRACTICE_WEATHER]: PracticeWeather,
  [SCREENS.PRACTICE_SUMMARY]: PracticeSummary,
  [SCREENS.ROUND1_DECISION]: Round1,
  [SCREENS.ROUND1_WEATHER]: Round1Weather,
  [SCREENS.ROUND1_SUMMARY]: Round1Summary,
  [SCREENS.ROUND2_INTRO]: Round2Intro,
  [SCREENS.VIDEO_OFFER]: VideoOffer,
  [SCREENS.INSURANCE_VIDEO]: InsuranceVideo,
  [SCREENS.ROUND2_DECISION]: Round2Decision,
  [SCREENS.ROUND2_WEATHER]: Round2Weather,
  [SCREENS.ROUND2_SUMMARY]: Round2Summary,
  [SCREENS.FINAL_PAYOUT]: FinalPayout,
  [SCREENS.SURVEY]: Survey,
  [SCREENS.COMPLETION]: Completion,
};

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const hydrate = useGameStore((s) => s.hydrate);

  useEffect(() => { hydrate(); }, [hydrate]);

  const Screen = MAP[currentScreen] || Welcome;
  return (
    <ErrorBoundary>
      <div className="relative h-full w-full">
        <Screen />
        <StatusBar />
        <AdminPanel />
      </div>
    </ErrorBoundary>
  );
}

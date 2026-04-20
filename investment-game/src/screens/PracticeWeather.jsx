import { SCREENS } from '../lib/constants.js';
import WeatherShared from './WeatherShared.jsx';

export default function PracticeWeather() {
  return (
    <WeatherShared
      screenName={SCREENS.PRACTICE_WEATHER}
      roundKey="practiceRound"
      nextScreen={SCREENS.PRACTICE_SUMMARY}
    />
  );
}

import { SCREENS } from '../lib/constants.js';
import WeatherShared from './WeatherShared.jsx';

export default function Round1Weather() {
  return (
    <WeatherShared
      screenName={SCREENS.ROUND1_WEATHER}
      roundKey="round1"
      nextScreen={SCREENS.ROUND1_SUMMARY}
    />
  );
}

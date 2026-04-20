import { SCREENS } from '../lib/constants.js';
import WeatherShared from './WeatherShared.jsx';

export default function Round2Weather() {
  return (
    <WeatherShared
      screenName={SCREENS.ROUND2_WEATHER}
      roundKey="round2"
      nextScreen={SCREENS.ROUND2_SUMMARY}
    />
  );
}

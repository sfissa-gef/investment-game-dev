import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';
import WeatherAnimation from '../components/WeatherAnimation.jsx';

export default function WeatherShared({ screenName, roundKey, nextScreen }) {
  const transition = useGameStore((s) => s.transition);
  const outcome = useGameStore((s) => s.session?.[roundKey]?.weatherOutcome) || 'good';

  useEffect(() => {
    logEvent(screenName, 'screen_enter', { outcome });
  }, [screenName, outcome]);

  return <WeatherAnimation outcome={outcome} onContinue={() => transition(nextScreen)} />;
}

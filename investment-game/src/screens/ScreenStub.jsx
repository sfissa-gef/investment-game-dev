import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { logEvent } from '../store/eventLog.js';

export default function ScreenStub({ screenName, nextScreen, children }) {
  const transition = useGameStore((s) => s.transition);
  useEffect(() => {
    logEvent(screenName, 'screen_enter', {});
    const start = performance.now();
    return () => {
      logEvent(screenName, 'screen_exit', { duration_ms: performance.now() - start });
    };
  }, [screenName]);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-10">
      <h1 className="text-heading">{screenName}</h1>
      {children}
      {nextScreen && (
        <button
          className="min-h-touch rounded-lg bg-action-green px-8 py-4 text-body text-white"
          onClick={() => transition(nextScreen)}
        >
          Next →
        </button>
      )}
    </div>
  );
}

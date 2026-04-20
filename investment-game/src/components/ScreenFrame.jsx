import { useEffect, useRef } from 'react';
import { logEvent } from '../store/eventLog.js';

export default function ScreenFrame({ screenName, title, right, children, footer, bg = 'bg-canvas' }) {
  const enterRef = useRef(performance.now());
  useEffect(() => {
    logEvent(screenName, 'screen_enter', {});
    const start = enterRef.current;
    return () => logEvent(screenName, 'screen_exit', { duration_ms: performance.now() - start });
  }, [screenName]);

  return (
    <div className={`flex h-full w-full animate-fade-up flex-col ${bg}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-6 px-10 pt-10">
          <h1 className="text-heading tracking-tight">{title}</h1>
          {right}
        </header>
      )}
      <div className="flex flex-1 items-center justify-center gap-10 px-10 py-6">{children}</div>
      {footer && <footer className="flex items-center justify-end gap-3 px-10 pb-8">{footer}</footer>}
    </div>
  );
}

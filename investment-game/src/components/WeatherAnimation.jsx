import { useEffect, useState } from 'react';
import { CloudGoodIcon, CloudBadIcon } from './Icons.jsx';
import { t } from '../i18n/index.js';

export default function WeatherAnimation({ outcome, onContinue }) {
  const [showBtn, setShowBtn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowBtn(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const good = outcome === 'good';
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-6 transition-colors ${
        good ? 'bg-rain-blue/30' : 'bg-drought-tan/40'
      }`}
    >
      <div className="animate-[fade-in_600ms_ease-out]">
        {good ? <CloudGoodIcon size={360} /> : <CloudBadIcon size={360} />}
      </div>
      <h1 className={`text-token-xl ${good ? 'text-lush-green' : 'text-drought-deep'}`}>
        {good ? t('weather.good') : t('weather.bad')}
      </h1>
      {showBtn && (
        <button
          className="min-h-touch rounded-xl bg-action-green px-10 py-4 text-body text-white"
          onClick={onContinue}
        >
          {t('summary.next')}
        </button>
      )}
    </div>
  );
}

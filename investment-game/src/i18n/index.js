import en from './en.json';
import lg from './lg.json';
import bem from './bem.json';

const bundles = { en, lg, bem };

let current = 'en';

export function setLanguage(lang) {
  current = bundles[lang] ? lang : 'en';
}

export function currentLanguage() {
  return current;
}

export function t(key, vars = {}) {
  const bundle = bundles[current] || bundles.en;
  // Transparent fallback: current → en → key itself. So any key missing a
  // translation falls back to English rather than breaking the UI.
  let str = bundle[key] ?? bundles.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}

export function availableLanguages() {
  return Object.keys(bundles);
}

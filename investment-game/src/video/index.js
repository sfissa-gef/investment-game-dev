import A1Overview, { A1_DURATION_MS, A1_CAPTIONS } from './scenes/A1Overview.jsx';
import A2Weather, { A2_DURATION_MS, A2_CAPTIONS } from './scenes/A2Weather.jsx';
import A3Budget, { A3_DURATION_MS, A3_CAPTIONS } from './scenes/A3Budget.jsx';
import A4FertilizerGood, { A4_DURATION_MS, A4_CAPTIONS } from './scenes/A4FertilizerGood.jsx';
import A5FertilizerBad, { A5_DURATION_MS, A5_CAPTIONS } from './scenes/A5FertilizerBad.jsx';
import A6UiTutorial, { A6_DURATION_MS, A6_CAPTIONS } from './scenes/A6UiTutorial.jsx';
import A7AIntro, { A7A_DURATION_MS, A7A_CAPTIONS } from './scenes/A7AIntro.jsx';
import A7BIntro, { A7B_DURATION_MS, A7B_CAPTIONS } from './scenes/A7BIntro.jsx';
import B1Unbundled, { B1_DURATION_MS, B1_CAPTIONS } from './scenes/B1Unbundled.jsx';
import B2Bundled, { B2_DURATION_MS, B2_CAPTIONS } from './scenes/B2Bundled.jsx';

// narrationSrc is a function (lang) => url. VideoPlayer resolves it for the
// current language and falls back to /audio/en/... if the localized MP3 404s.
const narration = (id) => (lang) => `/audio/${lang}/videos/${id}.mp3`;

export const VIDEOS = {
  A1: { id: 'A1', titleKey: 'video.A1.title', Scene: A1Overview, durationMs: A1_DURATION_MS, captions: A1_CAPTIONS, narrationSrc: narration('A1') },
  A2: { id: 'A2', titleKey: 'video.A2.title', Scene: A2Weather, durationMs: A2_DURATION_MS, captions: A2_CAPTIONS, narrationSrc: narration('A2') },
  A3: { id: 'A3', titleKey: 'video.A3.title', Scene: A3Budget, durationMs: A3_DURATION_MS, captions: A3_CAPTIONS, narrationSrc: narration('A3') },
  A4: { id: 'A4', titleKey: 'video.A4.title', Scene: A4FertilizerGood, durationMs: A4_DURATION_MS, captions: A4_CAPTIONS, narrationSrc: narration('A4') },
  A5: { id: 'A5', titleKey: 'video.A5.title', Scene: A5FertilizerBad, durationMs: A5_DURATION_MS, captions: A5_CAPTIONS, narrationSrc: narration('A5') },
  A6: { id: 'A6', titleKey: 'video.A6.title', Scene: A6UiTutorial, durationMs: A6_DURATION_MS, captions: A6_CAPTIONS, narrationSrc: narration('A6') },
  A7A: { id: 'A7A', titleKey: 'video.A7A.title', Scene: A7AIntro, durationMs: A7A_DURATION_MS, captions: A7A_CAPTIONS, narrationSrc: narration('A7A') },
  A7B: { id: 'A7B', titleKey: 'video.A7B.title', Scene: A7BIntro, durationMs: A7B_DURATION_MS, captions: A7B_CAPTIONS, narrationSrc: narration('A7B') },
  B1: { id: 'B1', titleKey: 'video.B1.title', Scene: B1Unbundled, durationMs: B1_DURATION_MS, captions: B1_CAPTIONS, narrationSrc: narration('B1') },
  B2: { id: 'B2', titleKey: 'video.B2.title', Scene: B2Bundled, durationMs: B2_DURATION_MS, captions: B2_CAPTIONS, narrationSrc: narration('B2') },
};

export const INSTRUCTIONS_SEQUENCE = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];

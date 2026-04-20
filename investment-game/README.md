# investment-game (PWA)

React 18 + Vite + Tailwind PWA for the GEF Investment Game experiment. Fully offline-capable after first load.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 47 Vitest tests
npm run build        # production bundle → dist/
npm run preview      # serve dist/ locally for a PWA-install test
npm run e2e          # Playwright, needs `npx playwright install` once
```

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 (Vite) | Component model maps to screen-based game flow |
| Styling | Tailwind CSS v3 | Rapid iteration, responsive by default |
| State | Zustand | Lightweight store; the app is a linear state machine |
| Offline storage | Dexie.js (IndexedDB) | Structured, transactional, survives browser crashes |
| PWA / caching | Workbox (vite-plugin-pwa) | Precache all assets for full offline operation |
| Audio | HTML5 `<audio>` with preload | Narration playback |
| Testing | Vitest + Playwright | Unit tests for logic, E2E for flow |

**Do NOT add:** Next.js, Redux, Axios, any CSS-in-JS library, any UI component library. Keep bundle small for offline install.

## Project structure

```
investment-game/
├── src/
│   ├── App.jsx                 Root; renders current screen from state machine
│   ├── main.jsx                Entry + font preload
│   ├── store/
│   │   ├── gameStore.js        Zustand store — state machine, session, checkpointing
│   │   ├── eventLog.js         Interaction event logger → IndexedDB
│   │   └── recordingStore.js   SessionRecorder lifecycle (start/stop)
│   ├── screens/                One component per game screen
│   ├── components/             Reusable UI (Lockbox, TokenStepper, PlantButton, etc.)
│   ├── video/
│   │   ├── VideoPlayer.jsx     Time-scaled scene player with narration sync
│   │   ├── Primitives.jsx      Scene building blocks
│   │   ├── index.js            Video registry (10 scenes)
│   │   └── scenes/             A1..A6, A7A/B, B1, B2 scene components
│   ├── lib/
│   │   ├── constants.js        Game parameters, flow, language maps
│   │   ├── payout.js           Pure payout functions (35 truth-table tests)
│   │   ├── randomize.js        Seeded PRNG for version + weather
│   │   ├── db.js               Dexie schema + helpers
│   │   ├── sync.js             Post sessions + audio chunks to backend
│   │   ├── export.js           JSON/CSV exports
│   │   └── recording.js        MediaRecorder + AES-GCM encryption
│   ├── admin/                  Enumerator admin panel (PIN-gated, 4 tabs)
│   └── i18n/                   en.json, lg.json (Luganda), bem.json (Bemba)
├── public/
│   ├── audio/en/videos/        10 Mapendo-voiced English narration MP3s
│   ├── audio/lg/videos/        Luganda (empty — pending translation)
│   ├── audio/bem/videos/       Bemba (empty — pending translation)
│   └── icons/game/             15 Fluent Emoji / Noto SVGs
├── scripts/
│   ├── generate-narration.sh   macOS say / ElevenLabs TTS generator
│   └── fetch-icons.sh          Iconify API → local SVGs
├── tests/                      Vitest: payout + randomize + gameflow (47 tests)
├── e2e/                        Playwright full-session smoke tests
└── CLAUDE.md                   Spec bundle for Claude Code agents
```

## State machine

Forward-only. Every transition checkpoints to IndexedDB. Crash mid-session → resume at the last screen on next load.

```
WELCOME → ENUMERATOR_SETUP → LANGUAGE_SELECT → INSTRUCTIONS (A1..A6)
  → PRACTICE_DECISION → PRACTICE_WEATHER → PRACTICE_SUMMARY
  → ROUND1_DECISION → ROUND1_WEATHER → ROUND1_SUMMARY
  → ROUND2_INTRO (A7A or A7B) → VIDEO_OFFER → [INSURANCE_VIDEO: B1 or B2]
  → ROUND2_DECISION → ROUND2_WEATHER → ROUND2_SUMMARY
  → FINAL_PAYOUT → SURVEY → COMPLETION
```

## Regenerating assets

### Narration (English, ElevenLabs Mapendo)

```bash
# One-time: put credentials in .env.local (gitignored)
cat > .env.local <<'EOF'
BACKEND=elevenlabs
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=dOqxOZEisn8SiUH1dPCC
EOF
chmod 600 .env.local

./scripts/generate-narration.sh
```

Fallback to macOS `say` (robotic but free + offline): `BACKEND=say ./scripts/generate-narration.sh`.

### Icons

```bash
./scripts/fetch-icons.sh
```

Refetches all 15 SVGs from Iconify. Edit the list in the script to add/remove.

## Admin panel

4-finger long-press on Welcome (or tap the top-right corner). Default PIN: `1234` (configurable via Dexie `config` table).

Tabs: Sessions, Sync (server URL + Test + Sync now), Export / Import (JSON + 3 CSVs + participant CSV import), Diagnostics (battery, storage, SW status).

## Testing before PR

- `npm test` — 47 green
- `npm run build` — clean, no warnings
- If you touched game-logic: `npx vitest run tests/payout.test.js` specifically
- Manual: click through a full V-A session + a V-B session in DevTools 1280×800 landscape

## Known landmines

- **Don't rename** any `SCREENS.*` constant — state machine key, also a database column, also an event-log payload field. Grep-replace breaks the sync server's schema validation.
- **Don't change payout numbers** in `lib/constants.js` without PI sign-off. Research runs on these exact values.
- **Don't add back buttons.** Forward-only state machine is a design invariant.
- **Don't block `.env.local`** — read by scripts and kept out of git.

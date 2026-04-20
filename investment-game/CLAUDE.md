# CLAUDE.md — Investment Game PWA

## Project Overview

This is a **tablet-based lab-in-the-field experiment app** for a GEF-funded research project led by the Alliance of Bioversity and CIAT, with IFPRI. It tests how **bundling agricultural financial services** (seeds + insurance) affects smallholder farmers' demand, information-seeking, and risk-taking behavior.

The app is deployed on Android tablets in **rural Zambia and Uganda** to ~3,200 participants. It must work **fully offline** after initial load.

**Read these docs before writing any code** (at repo root, one level up from this folder):
- `../docs/research/game_logic.md` — Complete game rules, payout formulas, randomization
- `../docs/research/screen_specs.md` — Every screen, every interaction, every edge case
- `../docs/research/data_schema.md` — Data models, event logging, export format
- `../docs/research/design_system.md` — Colors, typography, component patterns, asset list
- `../docs/project/ROADMAP.md` — What's done, what's next, open decisions
- `../docs/project/SPEC_DISCREPANCIES.md` — Open PI sign-off items

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React 18** (via Vite) | Component model maps to screen-based game flow |
| Styling | **Tailwind CSS v3** | Rapid iteration, responsive by default |
| State | **Zustand** | Lightweight store; the app is a linear state machine |
| Offline storage | **Dexie.js** (IndexedDB wrapper) | Structured, transactional, survives browser crashes |
| PWA / caching | **Workbox** (vite-plugin-pwa) | Precache all assets for full offline operation |
| Audio | HTML5 `<audio>` with preload | Narration playback, no streaming |
| Video | HTML5 `<video>` with preload | Insurance explanation video |
| Recording (optional) | `MediaRecorder` API | Background conversation capture |
| Build | **Vite** | Fast builds, good PWA plugin ecosystem |
| Testing | **Vitest** + **Playwright** | Unit tests for game logic, E2E for flow |

**Do NOT use:** Next.js, Redux, Axios, any CSS-in-JS library, any UI component library (no MUI, Chakra, etc.). Keep dependencies minimal for offline bundle size.

---

## Project Structure

```
investment-game/
├── CLAUDE.md                    # This file
├── docs/                        # Specifications (read-only reference)
│   ├── game_logic.md
│   ├── screen_specs.md
│   ├── data_schema.md
│   └── design_system.md
├── public/
│   ├── audio/                   # Narration audio files (per language)
│   │   ├── en/
│   │   ├── lg/                  # Luganda
│   │   └── bem/                 # Bemba
│   ├── video/                   # Insurance explanation videos
│   ├── icons/                   # Game icons (SVG)
│   └── images/                  # Raster images (weather scenes, etc.)
├── src/
│   ├── main.jsx                 # App entry
│   ├── App.jsx                  # Root: renders current screen from state machine
│   ├── store/
│   │   ├── gameStore.js         # Zustand store: game state machine
│   │   ├── sessionStore.js      # Session metadata (participant, enumerator, device)
│   │   └── eventLog.js          # Interaction event logger
│   ├── screens/                 # One component per game screen
│   │   ├── Welcome.jsx
│   │   ├── LanguageSelect.jsx
│   │   ├── EnumeratorSetup.jsx
│   │   ├── Instructions/        # Multi-step instruction screens
│   │   │   ├── InstructionStep.jsx  # Generic audio-narrated instruction slide
│   │   │   └── steps.js         # Instruction content definitions
│   │   ├── PracticeRound.jsx
│   │   ├── Round1.jsx
│   │   ├── VideoOffer.jsx
│   │   ├── InsuranceVideo.jsx
│   │   ├── Round2VersionA.jsx
│   │   ├── Round2VersionB.jsx
│   │   ├── WeatherReveal.jsx
│   │   ├── RoundSummary.jsx
│   │   ├── FinalPayout.jsx
│   │   ├── Survey.jsx
│   │   └── Completion.jsx
│   ├── components/              # Reusable UI components
│   │   ├── Lockbox.jsx          # Token savings display
│   │   ├── TokenStepper.jsx     # +/- stepper for input purchases
│   │   ├── PlantButton.jsx      # "Plant" action button with confirm
│   │   ├── PayoutReminder.jsx   # Corner card showing payout rules
│   │   ├── AudioPlayer.jsx      # Audio narration with progress + replay
│   │   ├── ConfirmDialog.jsx    # "Are you sure?" modal
│   │   ├── WeatherAnimation.jsx # Rain/drought reveal
│   │   └── TokenCoin.jsx        # Animated token icon
│   ├── lib/
│   │   ├── payout.js            # Pure functions: calculate all payouts
│   │   ├── randomize.js         # Seeded PRNG, weather draws, version assignment
│   │   ├── db.js                # Dexie database schema and operations
│   │   ├── sync.js              # Background sync to server
│   │   ├── audio.js             # Audio preload and playback helpers
│   │   └── constants.js         # Game parameters (token budgets, prices, probabilities)
│   ├── admin/                   # Enumerator admin panel
│   │   ├── AdminPanel.jsx
│   │   ├── ParticipantList.jsx
│   │   ├── SyncDashboard.jsx
│   │   └── SessionRecovery.jsx
│   └── i18n/
│       ├── en.json              # English strings
│       ├── lg.json              # Luganda strings
│       └── bem.json             # Bemba strings
├── tests/
│   ├── payout.test.js           # Unit tests for payout calculations
│   ├── randomize.test.js        # Randomization distribution tests
│   └── gameflow.test.js         # State machine transition tests
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Architecture Rules

### State Machine

The app is a **strict linear state machine**. There is no routing library. The Zustand store holds a `currentScreen` string, and `App.jsx` renders the corresponding component.

```
WELCOME → LANGUAGE_SELECT → ENUMERATOR_SETUP → INSTRUCTIONS
  → PRACTICE_DECISION → PRACTICE_WEATHER → PRACTICE_SUMMARY
  → ROUND1_DECISION → ROUND1_WEATHER → ROUND1_SUMMARY
  → VIDEO_OFFER → [INSURANCE_VIDEO] → ROUND2_DECISION → ROUND2_WEATHER → ROUND2_SUMMARY
  → FINAL_PAYOUT → SURVEY → COMPLETION
```

**Rules:**
- Transitions are **forward-only**. No back button in the game flow.
- Every transition calls `eventLog.log('screen_transition', { from, to })` with a timestamp.
- State is **checkpointed to IndexedDB** after every screen transition. If the app crashes and reloads, it resumes from the last checkpoint.
- The practice round is **mandatory** and cannot be skipped.

### Offline-First

- **All assets** (HTML, JS, CSS, images, audio, video) are precached by the Service Worker on first load.
- **No network requests** during gameplay. The app is 100% self-contained after install.
- Game session data is written to IndexedDB immediately, never held only in memory.
- Data sync happens **only** from the admin panel or automatically when connectivity is detected post-session.

### Data Integrity

- Every user action produces an `InteractionEvent` written to an append-only log in IndexedDB.
- Session data is **never deleted** from the device until the server confirms receipt.
- Weather random seeds are logged so outcomes can be independently verified.
- All timestamps use `performance.now()` for sub-millisecond precision within a session, anchored to a `Date.now()` session start time.

---

## Key Implementation Notes

### Token Budget Enforcement

The budget system is the core constraint engine. Rules:
- Each round starts with **25 tokens**.
- Watching the insurance video costs **1 token** (deducted before the decision screen).
- Fertilizer: 0–10 units × 1 token each.
- Seeds (V-A only): 0 or 1 × 10 tokens.
- Insurance (V-A only): 0 or 1 × 2 tokens. **Only available if seeds are purchased.**
- Bundle (V-B only): 0 or 1 × 12 tokens.
- Tokens remaining = 25 (or 24 if video watched) − fertilizer − seeds − insurance (or bundle).
- Tokens remaining must be ≥ 0. The stepper UI must **prevent** overspending, not just warn.
- In the practice round and Round 1, minimum savings is 15 tokens (max fertilizer = 10).

### Insurance Availability Logic (Version A)

The insurance stepper is **disabled/grayed out** until seeds are purchased. If the participant removes seeds after adding insurance, insurance is also automatically removed and the stepper re-disables.

### Confirmation Before Planting

When the participant taps the Plant button, show a confirmation dialog: "Are you sure? You cannot change your decision after planting." The confirm button should require a **deliberate tap** (not placed where the plant button was, to prevent accidental double-tap).

### Weather Determination

Weather is drawn **at the moment the participant confirms planting**, not pre-determined. Use the seeded PRNG with a per-round seed. Log the seed value. 80% probability of good rain, 20% bad rain.

### Audio Narration

- Instruction screens auto-play audio on mount.
- The "Next" button is **disabled until audio finishes** playing (or the enumerator long-presses for 2 seconds to override).
- A replay button is always visible.
- If audio fails to play (e.g., broken speaker), the screen text serves as fallback — all critical information is also displayed visually.

### Payout Calculation

See `docs/game_logic.md` for the complete payout table. The final payout screen shows:
- Round 1 tokens earned
- Round 2 tokens earned
- Total tokens
- Conversion to local currency (rate set in enumerator setup)

### Enumerator Admin Panel

Accessed via **4-finger tap** on the Welcome screen (or a hidden button in the corner). Protected by a simple PIN (default: 1234, configurable). Features:
- Enter/scan participant ID
- Select country, partner, language
- Set currency conversion rate
- Import participant list (CSV)
- View sync status of all sessions
- Export all session data as JSON
- Enable/disable audio recording
- Resume interrupted sessions

---

## Coding Standards

- **Components:** Functional components only. No class components.
- **State:** All game state in Zustand stores. No prop drilling beyond 1 level. Use the store directly.
- **Side effects:** `useEffect` for audio playback and IndexedDB writes. Keep effects minimal.
- **Event logging:** Every user-facing interaction (tap, stepper change, screen view) must call `eventLog.log()`. This is non-negotiable for research data quality.
- **Accessibility:** All interactive elements have `aria-label`. Touch targets ≥ 56px. High contrast text (4.5:1 minimum).
- **No scrolling** in game screens. Everything fits in a single viewport (landscape tablet, ~1280×800 or ~1024×768).
- **Landscape orientation only.** Lock via `manifest.json` and CSS.
- **No external network requests** during gameplay. Ever.
- **Error boundaries:** Wrap each screen in an error boundary that logs the error and offers "Resume" or "Contact enumerator" options.

---

## Testing Requirements

Before any PR is considered complete:

1. **Payout tests:** Every combination of inputs × weather × version must produce the correct payout. See `docs/game_logic.md` for the truth table.
2. **Budget tests:** Verify it's impossible to spend more than 25 (or 24) tokens in any configuration.
3. **Randomization tests:** 10,000 simulated sessions must produce ~50/50 version split and ~80/20 weather split (within statistical tolerance).
4. **State persistence:** Kill the app at every screen transition and verify it resumes correctly.
5. **Offline test:** Disable network after initial load. Complete a full session. Verify all data is in IndexedDB.

---

## Deployment

1. Build: `npm run build` → produces `dist/` folder
2. Host `dist/` on any static file server (S3, Netlify, Cloudflare Pages, even a local HTTP server on a laptop)
3. Field tablets navigate to the URL once (with connectivity), Service Worker caches everything
4. All subsequent use is offline
5. To update: push new build to hosting, tablets update on next connectivity

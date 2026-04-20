# Investment Game — GEF Field Experiment

Tablet-based lab-in-the-field experiment for the GEF-funded project **"Scaling Financial and Information Services for Smallholder Adaptation"** (Alliance of Bioversity International & CIAT, with IFPRI). Tests how bundling seeds + insurance as one product vs. two separate products affects smallholder farmers' demand, information-seeking behavior, and risk-taking.

Deployed on Android tablets to ~3,200 participants across rural Zambia and Uganda. Fully offline-capable after first load.

**Live demo:** [investment-game.pages.dev](https://investment-game.pages.dev)

---

## Repository layout

```
.
├── investment-game/            React + Vite PWA (the tablet app)
├── investment-game-server/     Node + Express + PostgreSQL sync backend
└── docs/
    ├── research/               Research design, game logic, specs
    │   ├── concept_note.md         Motivation + research questions
    │   ├── gameplay_script.md      The narration script / story flow
    │   ├── game_logic.md           Payout formulas, randomization, truth tables
    │   ├── screen_specs.md         Every screen, every interaction
    │   ├── data_schema.md          IndexedDB + export format
    │   ├── design_system.md        Colors, typography, components
    │   ├── claude_design_brief.md  Visual brief used for Claude Design
    │   └── strategy.md             Implementation roadmap + risk analysis
    ├── video_scripts/          Storyboards for the 10 narrated videos (A1–A6, A7A/B, B1/B2)
    ├── mockups/                Original bundle_game_mockup.pdf + .pptx
    └── project/                Running project operations
        ├── ROADMAP.md              Track A/B/C work items, who owns what
        ├── SPEC_DISCREPANCIES.md   Open PI sign-off: truth-table typos
        └── TRANSLATION_TODO.md     Luganda + Bemba review checklist
```

## Quick start

A top-level [Makefile](Makefile) wraps the common tasks:

```bash
make help           # list all targets
make dev            # PWA dev server on :5173
make test           # 47 tests
make build          # production PWA build
make deploy         # build + push to Cloudflare Pages production
make wiki-push      # sync docs/ → GitHub Wiki and push
make server         # local Postgres + backend via docker compose
```

### Run the PWA locally (raw)

```bash
cd investment-game
npm install
npm run dev          # http://localhost:5173
npm test             # 47 tests
npm run build        # production bundle → dist/
```

See [investment-game/README.md](investment-game/README.md) for the full developer guide.

### Run the sync backend locally

```bash
cd investment-game-server
cp .env.example .env
docker compose up -d                       # starts Postgres + app
docker compose exec app npm run migrate    # creates tables
curl http://localhost:4000/health
```

See [investment-game-server/README.md](investment-game-server/README.md).

### Deploy the PWA to Cloudflare Pages

```bash
cd investment-game
npm run build
npx wrangler pages deploy dist --project-name=investment-game
```

---

## Status

- **Game logic** — 3 rounds (practice + R1 + R2), A/B version assignment, insurance-requires-seeds gating, bundle variant, video-cost deduction, seeded 80/20 weather. 35 payout + 8 state-machine + 4 randomization unit tests.
- **Content** — 10 animated video scenes with ElevenLabs Mapendo narration (English). Scene timings auto-scale to whatever narration length you record. Luganda + Bemba scaffolding in place; narration + translations pending native-speaker review.
- **Data** — every stepper change, screen transition, video scene enter, survey answer logged to IndexedDB. CSV + JSON exports from admin panel. Session recorder (opt-in, AES-GCM encrypted, 60s Opus chunks).
- **Infra** — Zustand state machine with IndexedDB checkpointing + resume. Workbox PWA with full offline precache (~2 MB). Dockerized Node + Postgres sync backend (local, not yet hosted).
- **Deployment** — Cloudflare Pages live for the client. Backend not yet deployed to a public host.

Full status + roadmap: [docs/project/ROADMAP.md](docs/project/ROADMAP.md).

---

## Contributing

### Before a pull request

- `npm test` inside `investment-game/` — 47 tests green.
- `npm run build` — clean build, no warnings.
- If you touched anything game-logic related, run `npx vitest run tests/payout.test.js` and confirm the truth tables still pass.

### Key design constraints (don't violate without discussion)

- **No back button in game flow.** Forward-only state machine per [research_design](docs/research/concept_note.md) and [screen_specs](docs/research/screen_specs.md).
- **Checkpoint every screen transition to IndexedDB.** The app must resume cleanly from a crash mid-session.
- **Weather is drawn at plant-confirm, not pre-computed.** Log the seed value.
- **The practice round is mandatory.**
- **No scrolling in game screens.** Everything fits in 1280×800 landscape.
- **Budget stepper must prevent overspend in real-time, not just warn.**

### Open research-integrity items

- [**SPEC_DISCREPANCIES.md**](docs/project/SPEC_DISCREPANCIES.md) — six truth-table rows in `game_logic.md` §4 contradict the explicit payout formulas by −10 or −4 tokens. Implementation follows the formulas; **PI sign-off pending. Blocks field deployment.**

---

## License

MIT — see [LICENSE](LICENSE).

Partner organizations: One Acre Fund, Solidaridad. Funded by the Global Environment Facility.

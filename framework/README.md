# investment-game-framework

**Status:** `v0.1.0-alpha.1` — schema + validator only. The runtime port (turning a spec into a running PWA) is [next](docs/RUNTIME_PORT.md) and not yet done. This package is **not** a drop-in replacement for [investment-game/](../investment-game/) yet; it's the foundation that lets us get there without destabilizing the field version.

## What this is

A declarative spec format for lab-in-the-field experiments in the Investment Game family. A researcher describes a game in YAML — rounds, decisions, resources, payouts, weather — and the future runtime renders it as an installable PWA. The current Zambia/Uganda study is encoded as [examples/zm-ug-investment/game-spec.yml](examples/zm-ug-investment/game-spec.yml) and is the reference against which the runtime is verified.

## What works today

- **Schema + validator.** YAML specs validated structurally (Zod) and semantically (resource cross-refs, formula identifiers, weather probability sums, assignment partitioning).
- **Two reference specs.**
  - [`zm-ug-investment`](examples/zm-ug-investment/game-spec.yml) — the current deployed game, end-to-end
  - [`simple-fertilizer`](examples/simple-fertilizer/game-spec.yml) — a minimal demo that differs from the reference on every major axis (rounds, constants, payouts, weather) to prove the schema isn't overfit
- **CLI.** `npm run validate:all` from this folder, or `npx game-spec-validate <path-to-spec.yml>` once installed.
- **Test suite.** `npm test` runs 10 tests covering both example specs + deliberate corruptions.

## What does NOT work yet

- No runtime — the validated spec does not actually render a PWA. See [docs/RUNTIME_PORT.md](docs/RUNTIME_PORT.md) for the plan.
- No spec-driven narration generator — narration lives in [investment-game/scripts/narration-texts/](../investment-game/scripts/narration-texts/) and is hand-wired to the current game. The spec points at its directory; real integration is a runtime-port task.
- No spec-driven event schema or sync contract. The Worker schema at [investment-game-server/src/schemas.js](../investment-game-server/src/schemas.js) is the fixed wire format across all spec variants. Listed in each spec's `locked` block for documentation; validator does not enforce.

## Quick start

```bash
cd framework
npm install
npm run validate:all        # validates both examples
npm test                    # 10/10 should pass
```

Validating your own spec:

```bash
node schema/validator.mjs path/to/your/game-spec.yml
```

Writing a new spec: start by copying one of the examples. The schema reference is [SCHEMA.md](SCHEMA.md).

## Layout

```
framework/
├── README.md
├── SCHEMA.md                     ← spec reference (normative)
├── package.json
├── schema/
│   └── validator.mjs             ← Zod + semantic checks + CLI entrypoint
├── examples/
│   ├── zm-ug-investment/         ← current study encoded as a spec
│   └── simple-fertilizer/        ← minimal contrasting game
├── test/
│   └── validator.test.js         ← 10 tests
└── docs/
    └── RUNTIME_PORT.md           ← how the future runtime will read specs
```

## Roadmap (D3 in [ROADMAP_DEV.md](../docs/project/ROADMAP_DEV.md))

1. ✅ Schema + validator + two example specs
2. ⬜ Runtime port: read spec → generate state machine + screens
3. ⬜ Narration pipeline integration (spec tells generate-narration.sh what to generate)
4. ⬜ Per-spec branding (logo, colors) rendered at build time
5. ⬜ Template-repo button: fork → edit spec → auto-deploy to preview Pages URL
6. ⬜ Cross-study data-comparability enforcement (locked event schema, locked session payload)

Milestone 1 lands when the simple-fertilizer spec can be built into an actually-playable PWA without copy-pasting any React code. Milestone 2 lands when the zm-ug-investment spec produces byte-identical behavior to the current stable build.

## Privacy + research-integrity

The same rules from [CONTRIBUTING.md](../CONTRIBUTING.md) apply: no participant data ever lives in a spec or in this folder. A spec is pure game configuration — anything that identifies a specific participant is a runtime concern. The `locked` block in every spec pins the event-schema and session-payload contracts so cross-study data remains comparable even as the per-study game configuration varies.

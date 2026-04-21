# Runtime port — how the framework will actually render games

**Status:** design sketch. No runtime code exists yet. This document records the plan so the next PR has a concrete target.

## Goal

Given a validated `game-spec.yml`, produce an installable PWA that is behaviorally identical to the current [investment-game/](../../investment-game/) when the spec is [zm-ug-investment](../examples/zm-ug-investment/game-spec.yml).

"Behaviorally identical" means:
- Same event log schema (screen_transition, stepper_change, ...)
- Same session-payload shape posted to `/api/sessions`
- Same seedrandom-derived randomization (so tests from `investment-game/tests/` still pass byte-for-byte)
- Same Dexie schema (so a tablet with mid-session state from the current app can resume under the framework runtime)

## Non-goals (for milestone 1)

- Spec-driven UI design. Screens will render in the existing visual style; per-spec branding (colors, logo) is the only UI config in v1.
- Spec-driven screen sequence *beyond* what rounds imply. The state machine will derive screens from rounds deterministically: `WELCOME → ENUMERATOR_SETUP → LANGUAGE_SELECT → INSTRUCTIONS → <per-round: DECISION, WEATHER, SUMMARY> → [VIDEO_OFFER → INSURANCE_VIDEO →] → FINAL_PAYOUT → SURVEY → COMPLETION`. Studies with genuinely different screen needs are schema-v2 territory.
- Runtime spec editing. The spec is read at build time and baked into the bundle. Changing a spec requires a new build + deploy.

## Architecture

```
game-spec.yml
     │
     │  (build time)
     ▼
┌──────────────────────────────────────────────────┐
│ packages/framework-runtime/                      │
│                                                  │
│ spec-loader.js      → read + validate YAML       │
│ state-machine.js    → derive FLOW[] from rounds  │
│ payout.js           → compile formulas to JS     │
│ randomize.js        → seedrandom adapters        │
│ screens/*.jsx       → generic DecisionScreen etc │
└──────────────────────────────────────────────────┘
     │
     │  imported by
     ▼
┌──────────────────────────────────────────────────┐
│ studies/<studyId>/                               │
│   vite.config.js  → build against spec           │
│   spec.yml        → symlink or copy              │
│   public/         → per-study assets             │
│   narration/      → per-study audio              │
└──────────────────────────────────────────────────┘
```

The current `investment-game/` becomes one of the `studies/` entries once the port is complete. Until then it stays stand-alone and is the authoritative reference.

## Formula compilation

Each formula string is compiled to a JS function at build time:

```js
// "savings + fertilizerHarvest * (weather == 'good' ? 2 : 0)"
// ↓
function compiled(ctx) {
  return ctx.savings + ctx.fertilizerHarvest * (ctx.weather === 'good' ? 2 : 0);
}
```

Compilation uses a small expression parser (e.g. [jsep](https://github.com/EricSmekens/jsep)) to produce an AST, which is then walked to emit an arrow function. **No `eval` or `new Function`** on untrusted input — a spec in a template repo is attacker-adjacent, and `eval` would let a malicious spec exfiltrate data from the running app.

The compiler is tested by compiling every formula in every example spec against known-good fixtures and comparing to the hand-written output from [investment-game/src/lib/payout.js](../../investment-game/src/lib/payout.js). This is the byte-identical-behavior guarantee for zm-ug-investment.

## Narration integration

The spec's `narrationDir` points at `{narrationDir}/{lang}.json` files. At build time the runtime:

1. Reads the file for each language in `metadata.languages`
2. Verifies every narration ID referenced by `instructions.sequence`, `instructions.perRound.*`, and `videoOffer.narrationByVersion` has a non-empty string value in *every* language file, OR is marked as missing and the runtime falls back to `defaultLanguage`
3. Warns (but doesn't fail) if any language file has `[NEEDS_TRANSLATION]` markers — the existing generate-narration.sh already refuses to build audio for these, so this is just documentation-time visibility

## QA integration

`qa.js` in the Worker (introduced in [D4](../../docs/project/ROADMAP_DEV.md#d4-data-qa--economics-analysis-workflow)) currently has its constants hardcoded. Runtime-port milestone 2 generates `qa.js` from the same spec the client uses, so:
- A study cannot deploy with QA constants drifting from game constants
- Cross-study QA checks (version balance, weather distribution) automatically adapt to each study's probabilities

## Milestones

| # | Deliverable | Acceptance |
|---|---|---|
| 1 | Runtime can build + run `simple-fertilizer` spec | Clicking through produces a valid session payload matching the `locked` schemas |
| 2 | Runtime builds `zm-ug-investment` spec byte-identically to current | `investment-game/tests/payout.test.js` passes when pointed at the framework-built version |
| 3 | Worker `qa.js` generated from spec | Cross-study χ² tests auto-parameterize |
| 4 | Template-repo button | Fork-and-edit flow produces a preview-URL PWA in <10 minutes end-to-end |
| 5 | Promote runtime to `stable`, retire the hand-written `investment-game/` | Stable repo field tablets switch builds with zero-downtime rollout |

Milestones 1–4 happen in the dev repo. Milestone 5 is a PR to stable with heavy review + tablet smoke testing.

## Open questions (to resolve before milestone 1)

- Monorepo tooling: npm workspaces vs Turborepo vs plain sibling folders? Current layout (sibling folders) has worked; workspaces might simplify shared deps.
- Spec compilation output: JS modules emitted at build time (written to disk) or pure in-memory? In-memory is simpler; disk helps debugging.
- Spec registry: central directory of known specs, or each study keeps its own? Each-study feels right — resists the temptation to cross-contaminate.
- How does the de-identification salt flow into per-study deploys? Presumably per-study env var, mirroring `DEID_SALT` in [analysis/scripts/deidentify.mjs](../../analysis/scripts/deidentify.mjs).

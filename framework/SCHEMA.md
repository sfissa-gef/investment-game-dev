# Game Spec Schema — `game-spec/v1`

**Normative.** Anything the validator accepts, the runtime must render. Anything the validator rejects, the runtime must refuse to build. If the runtime behavior and this document disagree, this document wins; file a bug against the runtime.

## Top-level structure

```yaml
apiVersion: game-spec/v1
metadata: { ... }
constants: { <name>: <number>, ... }
resources: { <name>: <Resource>, ... }
weather: { outcomes: [...], probabilities: {...}, seedPerRound: bool }
payoutFormulas: { <name>: <formulaString>, ... }   # reusable named expressions
rounds: [ <Round>, ... ]
instructions: { sequence: [...], perRound: {...} }
videoOffer: { ... }             # optional
survey: { questions: [ ... ] }
branding: { primaryColor: "#...", logo: "..." }
narrationDir: "<path>"
i18nDir: "<path>"
locked: { ... }                 # informational only
```

## `metadata`

| Field | Type | Required | Notes |
|---|---|---|---|
| `studyId` | string | yes | URL-safe, stable identifier. Used for spec registry + cross-study join keys |
| `name` | string | yes | Human-readable name |
| `countries` | string[] | yes | ISO 3166-1 alpha-2 codes |
| `languages` | string[] | yes | ISO 639-1/639-2 codes; narrationDir/i18nDir must have a file for each |
| `defaultLanguage` | string | no | Defaults to first in `languages` |

## `constants`

A flat map of `name → number`. Referenced by name in formulas. Typical fields: `budgetPerRound`, `videoCost`, study-specific prices.

## `resources`

The things participants can allocate. Two kinds:

**`stepper`** — continuous integer within a range:
```yaml
fertilizer:
  kind: stepper
  min: 0
  max: 10
  pricePerUnit: 1
  requires: []          # optional, defaults to []
```

**`toggle`** — binary purchase:
```yaml
insurance:
  kind: toggle
  price: 2
  requires: [seeds]     # only purchasable when listed resources are also purchased
```

Semantic rule: every string in `requires` must name another resource in the same spec.

## `weather`

```yaml
outcomes: [good, bad]
probabilities: { good: 0.80, bad: 0.20 }
seedPerRound: true
```

Semantic rule: probabilities must sum to exactly 1.0 and cover every listed outcome. `seedPerRound: true` means the runtime generates a fresh seed per round and logs it; reproducing the draw from the seed is a QA check (see [investment-game-server/src/qa.js](../investment-game-server/src/qa.js)).

## `payoutFormulas`

Named, reusable expressions. Referenced from round payout blocks by name.

**Expression grammar (v1):**
- literal numbers, strings (`'good'`, `'bad'`), booleans
- identifiers: constant names, resource names, `weather`, `videoChosen`, other payout-formula names, round-local payout names
- operators: `+ - * /` `== != < <= > >=` `&& ||` `? :` `!`
- parentheses
- **no** loops, function definitions, assignments, side effects, or I/O

Validator checks every identifier resolves in scope. A round-local payout can reference any other payout in the same block (`totalTokens: "savings + fertilizerHarvest"`).

## `rounds`

An ordered list. Each round is one of:

**Single-arm round:**
```yaml
- id: practice
  countsTowardPayment: false
  decisions: [fertilizer]
  payouts:
    savings: "budgetPerRound - fertilizer"
    totalTokens: "savings + fertilizerHarvest"
```

**Multi-arm (treatment) round:**
```yaml
- id: round2
  countsTowardPayment: true
  versions:
    - id: A
      assignmentHash: { op: "<",  threshold: 0.5 }
      decisions: [fertilizer, seeds, insurance]
      payouts: { totalTokens: "..." }
    - id: B
      assignmentHash: { op: ">=", threshold: 0.5 }
      decisions: [fertilizer, bundle]
      payouts: { totalTokens: "..." }
```

Rules:
- Exactly one of `decisions` / `versions` per round (not both, not neither)
- In a multi-arm round, the two arms' `assignmentHash` thresholds must match and use `<` / `>=` — this guarantees `[0,1)` is partitioned with no overlap or gap
- v1 supports 1- and 2-arm rounds. 3+ arms is a schema-v2 job
- `countsTowardPayment: false` rounds (like practice) are excluded from the final incentive calculation by the runtime

Assignment is deterministic:
- `hash("version-" + participantId)` maps to a float in `[0, 1)` via seedrandom
- Whichever arm's threshold/op matches is assigned
- Same participantId always produces the same arm — this is required for resume-after-crash integrity

## `instructions`

Narration IDs played before decisions.

```yaml
instructions:
  sequence: [A1, A2, A3, A4, A5, A6]     # played before practice
  perRound:
    round2:
      A: [A7A]                           # additional pre-round-2 narration for V-A
      B: [A7B]                           #                                   V-B
```

The IDs must have matching entries in every `{narrationDir}/{lang}.json`.

## `videoOffer`

Optional pre-round mid-game explainer.

```yaml
videoOffer:
  enabled: true
  cost: 1                            # tokens deducted if participant accepts
  narrationByVersion:
    A: B1
    B: B2
```

When `enabled: false`, the whole offer + video screens are omitted. When enabled, the video screen auto-selects the narration ID matching the participant's round-2 arm.

## `survey`

```yaml
survey:
  questions:
    - id: age
      type: numeric
      required: true
      prompt: "age.prompt"                # i18n key
    - id: gender
      type: single-choice
      required: true
      prompt: "gender.prompt"
      options: [female, male, other, prefer_not_to_say]
```

Supported `type`: `numeric`, `single-choice`, `multi-choice`, `text`, `likert`.

## `branding`

```yaml
branding:
  primaryColor: "#2d7a46"             # CSS-valid hex
  logo: "public/logo.svg"              # optional
```

## Path fields

`narrationDir` and `i18nDir` are string paths relative to the spec file location. The runtime resolves them at build time and fails loud if the expected language files are missing.

## `locked` (informational)

```yaml
locked:
  eventSchema: "docs/research/data_schema.md#event-log"
  sessionPayloadSchema: "investment-game-server/src/schemas.js"
  dbMigrations: "investment-game-server/migrations/"
```

A spec cannot reconfigure these — they are enforced at runtime. Listing them here is a documentation affordance so every study's spec records *what it relied on being fixed.* Spec validator ignores this block.

## Versioning

- `game-spec/v1` is the current schema. Anything here must remain stable for the lifetime of active studies.
- A `game-spec/v2` would break-change the schema; the runtime must support both simultaneously for at least one release cycle so in-progress studies aren't forced to migrate mid-fieldwork.
- Breaking changes to `locked` contracts (event schema, session payload) are a bigger deal and require a separate versioning track — tentatively `wire/vN`. Not yet designed.

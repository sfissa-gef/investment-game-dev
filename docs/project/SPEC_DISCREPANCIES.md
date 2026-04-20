# Specification Discrepancies — Needs PI Sign-Off Before Field Deployment

**Status:** Open. Implementation currently follows the explicit payout formulas in [game_logic.md §3](game_logic.md); the truth-table cells below are annotated with `// trusting formula` in [tests/payout.test.js](../tests/payout.test.js).

**Date raised:** 2026-04-19
**Research impact:** Affects the earnings participants actually receive. Must be resolved before any live session.

---

## The issue

[game_logic.md](game_logic.md) contains **two internally contradictory sources of truth** for the Round 2 payouts:

1. **Explicit formulas (§3).** Stated algebraically:
   - Version A (Unbundled): `savings + fert×(2 if good else 0) + (30 if seeds & good else 0) + (10 if insurance & bad else 0)`
   - Version B (Bundled):   `savings + fert×(2 if good else 0) + (30 if good else 10) × (1 if bundle else 0)`
2. **Truth tables (§4).** Hand-tabulated rows. For most `fertilizer` values, these match the formulas. But **four rows in the tables disagree with the formula output by either −10 (V-A and V-B good-rain at `fert=5`) or −4 (`f=3, s=yes, i=yes` bad rain)**.

## The discrepant rows

### V-A, budget = 25 (no video)

| Fert | Seeds | Ins | Savings | Table good | Formula good | Table bad | Formula bad |
|---|---|---|---|---|---|---|---|
| **5** | Yes | No | 10 | **40** | **50** | 10 | 10 |
| **5** | Yes | Yes | 8 | **38** | **48** | 18 | 18 |
| **3** | Yes | Yes | 10 | 36 | 46 | **16** | **20** |

### V-A, budget = 24 (video watched)

| Fert | Seeds | Ins | Savings | Table good | Formula good | Table bad | Formula bad |
|---|---|---|---|---|---|---|---|
| **5** | Yes | Yes | 7 | **37** | **47** | 17 | 17 |

### V-B, budget = 25 (no video)

| Fert | Bundle | Savings | Table good | Formula good | Table bad | Formula bad |
|---|---|---|---|---|---|---|
| **5** | Yes | 8 | **38** | **48** | 18 | 18 |

### V-B, budget = 24 (video watched)

| Fert | Bundle | Savings | Table good | Formula good | Table bad | Formula bad |
|---|---|---|---|---|---|---|
| **5** | Yes | 7 | **37** | **47** | 17 | 17 |

---

## Worked example (V-A, fert=5, seeds, insurance, good rain, budget=25)

| Step | Value | Source |
|---|---|---|
| Effective budget | 25 | `25 − 0` (no video) |
| Fertilizer cost | 5 | `5 × 1` |
| Seed cost | 10 | |
| Insurance cost | 2 | |
| **Savings** | **8** | `25 − 5 − 10 − 2` |
| Fertilizer harvest | 10 | `5 × 2` good rain |
| Seed harvest | 30 | good rain |
| Insurance payout | 0 | good rain |
| **Total** | **48** | `8 + 10 + 30 + 0` |

The truth table reports **38**. Savings (8) matches the formula; the discrepancy is exactly the fertilizer-harvest term. This looks like a typo in the truth table where `fert × 2` was omitted (or the scale column was misread).

## Worked example (V-A, fert=3, seeds, insurance, bad rain, budget=25)

| Step | Value | Source |
|---|---|---|
| **Savings** | **10** | `25 − 3 − 10 − 2` (matches table) |
| Fertilizer harvest | 0 | bad rain |
| Seed harvest | 0 | bad rain |
| Insurance payout | 10 | bad rain, purchased |
| **Total** | **20** | `10 + 0 + 0 + 10` |

Truth table reports **16**. Off by −4, inconsistent with the other −10 pattern, suggesting a different typo (perhaps a copy-paste of the `fert=5, bad=16` cell from an earlier draft).

---

## Decision the PI needs to make

**Option A — Trust the formulas (implementation default).**
Participant earnings for the affected inputs are higher than the truth table states. Research integrity intact because the formulas are the algebraic primary source. No code change needed.

**Option B — Trust the truth tables.**
Would require a bespoke lookup override of the formulas for the six affected rows. Creates mathematical inconsistency (e.g., fert=5 would pay less than fert=6 under some conditions) and should be rejected on game-theory grounds. Not recommended.

**Option C — Correct the spec document.**
Ask the document author to re-derive §4 so tables match §3. Strongly recommended regardless of A/B; a single source of truth reduces future risk.

## Recommendation

Adopt **Option A + Option C**. Please confirm in writing so we can mark the spec reconciled and proceed to field deployment.

## Contacts

- Implementation: [investment-game repo](../../investment-game)
- Tests showing both behaviors green under formulas: [tests/payout.test.js](../tests/payout.test.js) (search for `trusting formula`)

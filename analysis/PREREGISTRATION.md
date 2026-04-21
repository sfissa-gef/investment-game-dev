# Pre-registration — Investment Game field study

**Status:** DRAFT template — the PI completes this document before fieldwork begins and registers it (e.g. at the [AEA RCT Registry](https://www.socialscienceregistry.org/)). Once registered, record the registration ID below and treat this file as append-only: deviations during fieldwork are declared in an addendum, not edits.

**AEA Registration ID:** *(fill in)*

**Registered on:** *(date)*

---

## 1. Study context

- **Funder:** GEF, via Alliance of Bioversity International & CIAT, with IFPRI
- **Countries & partners:** *(fill in — e.g. Zambia via partner X, Uganda via partner Y)*
- **Expected n:** *(fill in — current plan ~3,200 participants across 2 countries × 2 partners × 800)*
- **Field window:** *(fill in — start + end dates)*
- **Linked evaluation:** *(fill in — does this lab-in-the-field feed into a parent RCT? If so, participant-ID mapping + identifier format)*

## 2. Research questions

The game is designed to test, in the order below (PI to confirm/amend):

1. **Primary — bundled vs. separate offerings of seeds + insurance.**
   - Hypothesis: participants are more likely to purchase insured improved seeds when offered as a bundled product (Version B) than when offered as separately priced items (Version A).
   - Operationalisation: proportion purchasing the seed-protection combination in Round 2, by version.

2. **Information-seeking as a function of bundling.**
   - Hypothesis: take-up of the (costly) insurance explainer video differs between V-A and V-B.
   - Operationalisation: `videoChosen` rate; conditional on video-watched, replay count and scene-level watch times.

3. **Risk-taking (fertilizer investment) changes with protection.**
   - Hypothesis: purchasing insurance / bundle increases fertilizer units demanded.
   - Operationalisation: mean fertilizerPurchased in Round 2 | seeds purchased | insurance / bundle purchased.

4. **Heterogeneity by demographics.**
   - Gender, age, education, prior insurance experience (measured in pre-game survey).

5. *(PI to add any confirmatory / exploratory items)*

## 3. Treatment assignment

- **Version A vs. Version B** assigned by `assignVersion(participantId) = seedrandom("version-" + participantId) < 0.5 ? 'A' : 'B'`.
- Idempotent: same participantId always produces the same version.
- Balance check target: 50/50 ± 2% by end of fieldwork; flagged if weekly χ² p-value < 0.01.

## 4. Primary pre-registered tests

*(PI to fill in — typical form:)*

- **Test A:** Two-proportion z-test on seed+insurance purchase rate between V-A and V-B. Two-sided, α = 0.05.
- **Test B:** *(etc.)*

Specify test, estimand, α-level, multiple-comparison correction strategy.

## 5. Outcome variables (canonical mapping)

| Outcome | Source field | Notes |
|---|---|---|
| `insured_seed_purchase` | `round2.seedsPurchased AND (round2.insurancePurchased OR round2.bundlePurchased)` | Combined measure across V-A and V-B |
| `seeds_purchased` | `round2.seedsPurchased` | V-A only; for V-B this is implied by bundle |
| `insurance_chosen` | `round2.insurancePurchased` | V-A only |
| `bundle_chosen` | `round2.bundlePurchased` | V-B only |
| `video_chosen` | `round2.videoChosen` | 1 = watched insurance explainer (cost 1 token) |
| `fertilizer_r1` | `round1.fertilizerPurchased` | Baseline risk-taking |
| `fertilizer_r2` | `round2.fertilizerPurchased` | Post-treatment risk-taking |
| `total_tokens` | `totalIncentivizedTokens` | Excluded from primary analysis — determined by weather draw |
| `decision_time_r2_s` | `round2.decisionEndTime - round2.decisionStartTime` | Seconds of deliberation |

## 6. Exclusion rules (pre-registered)

A session is excluded from primary analysis if any of:

- `qa_passed = false` (server-side integrity check failed)
- Practice round incomplete
- Enumerator-flagged as test/training session
- Total session duration < 8 min OR > 90 min (likely incomplete or corrupted)

Exclusion count must be reported in results table alongside the primary estimates. Robustness check: re-run with all sessions included.

## 7. Deviations from preregistration

*(empty until fieldwork begins; append-only. Each entry dated, reason stated, IRB-notified when relevant.)*

---

## Research-integrity gates (not part of preregistration but tracked here)

- [ ] PI sign-off on [SPEC_DISCREPANCIES.md](../docs/project/SPEC_DISCREPANCIES.md) before field deployment
- [ ] Power calculation completed and attached
- [ ] Participant-ID format finalized + documented in partner-facing onboarding
- [ ] IRB approval for audio recording (if enabled)
- [ ] De-identification salt generated and securely stored

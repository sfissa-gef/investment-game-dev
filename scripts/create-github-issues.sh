#!/usr/bin/env bash
# Create GitHub Issues from docs/project/ROADMAP.md in one shot.
#
# Prereqs:
#   - `gh auth status` must show you're logged in
#   - Run from the repo root (uses `gh` with the current repo detected from remote)
#
# Idempotent: re-running skips issues whose exact title already exists.

set -euo pipefail

command -v gh >/dev/null || { echo "✗ GitHub CLI (gh) not found. Install: brew install gh"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "✗ Not authenticated. Run: gh auth login"; exit 1; }

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
echo "→ Target repo: $REPO"
echo

# --- 1. Labels ---------------------------------------------------------------

create_label() {
  local name="$1" color="$2" desc="$3"
  if gh label list --limit 200 --json name --jq '.[].name' | grep -qx "$name"; then
    printf "  • label exists: %s\n" "$name"
  else
    gh label create "$name" --color "$color" --description "$desc" >/dev/null
    printf "  ✓ created label: %s\n" "$name"
  fi
}

echo "→ Labels"
create_label "track-a"         "c0d000" "Track A — Luganda/Bemba audio & translation"
create_label "track-b"         "00b0d0" "Track B — Low-connectivity field deployment"
create_label "track-c"         "9c27b0" "Track C — Data + analysis pipeline"
create_label "engineering"     "1f6feb" "Code change required"
create_label "content"         "8250df" "Content / translation / narration work"
create_label "infrastructure"  "0e8a16" "Deploy / infra / ops"
create_label "docs"            "5319e7" "Documentation"
create_label "blocked"         "b60205" "Blocked on external input or decision"
create_label "needs-pi"        "d93f0b" "Needs PI or partner sign-off"
create_label "research-integrity" "e99695" "Affects data/analysis correctness"
echo

# --- 2. Milestones -----------------------------------------------------------

create_milestone() {
  local title="$1" description="$2"
  if gh api "repos/$REPO/milestones?state=all" --jq ".[] | select(.title == \"$title\") | .number" | grep -q .; then
    printf "  • milestone exists: %s\n" "$title"
  else
    gh api "repos/$REPO/milestones" -f title="$title" -f description="$description" -f state=open >/dev/null
    printf "  ✓ created milestone: %s\n" "$title"
  fi
}

echo "→ Milestones"
create_milestone "Track A — Language completion" "Luganda + Bemba translation + recorded narration"
create_milestone "Track B — Field deployment"    "Offline install, pre-session diagnostics, sync backend live"
create_milestone "Track C — Analysis pipeline"   "Codebook, analysis plan, cleaning scripts, monitoring"
create_milestone "Blockers"                       "Items that must clear before any pilot session"
echo

ms_number() {
  gh api "repos/$REPO/milestones?state=all" --jq ".[] | select(.title == \"$1\") | .number"
}

MS_A=$(ms_number "Track A — Language completion")
MS_B=$(ms_number "Track B — Field deployment")
MS_C=$(ms_number "Track C — Analysis pipeline")
MS_BLOCK=$(ms_number "Blockers")

# --- 3. Issues ---------------------------------------------------------------

create_issue() {
  local title="$1" labels="$2" milestone="$3" body="$4"
  if gh issue list --limit 300 --state all --search "in:title \"$title\"" --json title --jq '.[].title' | grep -Fqx "$title"; then
    printf "  • exists:  %s\n" "$title"
    return
  fi
  gh issue create \
    --title "$title" \
    --body "$body" \
    --label "$labels" \
    --milestone "$milestone" \
    >/dev/null
  printf "  ✓ created: %s\n" "$title"
}

echo "→ Issues"

# Blockers first so they show up top in lists.
create_issue \
  "PI sign-off: truth-table typos in game_logic.md" \
  "blocked,needs-pi,research-integrity" \
  "Blockers" \
  "Six rows in \`docs/research/game_logic.md\` §4 truth tables contradict the explicit payout formulas in §3 by −10 or −4 tokens. Implementation currently follows the formulas (documented in \`tests/payout.test.js\` with \"trusting formula\" comments).

**Blocks any live session** — the PI must pick one of three options:

1. Trust the formulas (current implementation — recommended)
2. Trust the truth tables (would require bespoke overrides, creates inconsistency — not recommended)
3. Correct the spec document so tables match formulas (recommended regardless)

Full analysis + worked examples + recommendation: [docs/project/SPEC_DISCREPANCIES.md](../docs/project/SPEC_DISCREPANCIES.md)

**Acceptance:** PI responds in writing which option (or option C + which of A/B). Update \`SPEC_DISCREPANCIES.md\` with the decision + date."

# ─── TRACK A ───────────────────────────────────────────────────────────────

create_issue \
  "[A1] Commission Luganda + Bemba translations of 10 narration scripts" \
  "track-a,content,blocked" \
  "Track A — Language completion" \
  "Native speaker translates all 10 English narration scripts (A1–A6, A7A/B, B1, B2). Deliver as \`scripts/narration-texts/lg.json\` and \`scripts/narration-texts/bem.json\` keyed by video ID.

**Scripts to translate** (~3,400 chars each language): see \`investment-game/scripts/generate-narration.sh\` English source text or convert from \`docs/video_scripts/\`.

**Research integrity:** do not change any numbers (10, 2, 12, 30 tokens etc.). Keep neutral framing — videos are research instruments, not marketing.

**Acceptance:** two JSON files committed; PI confirms translator credentials and review."

create_issue \
  "[A2] Extend generate-narration.sh to read scripts/narration-texts/{lang}.json" \
  "track-a,engineering" \
  "Track A — Language completion" \
  "When \`LANG_CODE != en\`, read narration text from \`scripts/narration-texts/\$LANG_CODE.json\` instead of the hard-coded English strings. Same Mapendo voice via \`eleven_multilingual_v2\` reads all three languages.

**Acceptance:** \`LANG_CODE=lg ./scripts/generate-narration.sh\` produces 10 Luganda MP3s in \`public/audio/lg/videos/\`."

create_issue \
  "[A3] Generate Luganda + Bemba MP3s via ElevenLabs Mapendo" \
  "track-a,content" \
  "Track A — Language completion" \
  "Depends on A1 (translation text) and A2 (script support). Run the generator for both languages. Spot-check pronunciations with native speakers before committing.

**Acceptance:** \`public/audio/{lg,bem}/videos/*.mp3\` exists and plays in-app. Budget check: ~3,400 chars × 2 langs = 6,800 chars of ElevenLabs Starter quota."

create_issue \
  "[A4] Review + finalize Luganda and Bemba UI translations" \
  "track-a,content,docs" \
  "Track A — Language completion" \
  "\`src/i18n/lg.json\` and \`bem.json\` currently contain my non-native-speaker drafts flagged \`_status: DRAFT\`. A native speaker needs to review, correct, and extend them with all video caption keys.

Checklist in \`docs/project/TRANSLATION_TODO.md\`.

**Acceptance:** \`_status\` flag removed, all \`video.*.caption.*\` keys populated."

create_issue \
  "[A5] UI indicator when narration falls back to English" \
  "track-a,engineering" \
  "Track A — Language completion" \
  "When a localized narration MP3 is missing and VideoPlayer falls back to English, show a small badge in the header (enumerator-visible, not participant-visible if possible) so the enumerator knows the language coverage is incomplete.

**Acceptance:** badge visible + a \`video_narration_fallback\` event already logged in \`events\` table. Enumerator can acknowledge and continue."

# ─── TRACK B ───────────────────────────────────────────────────────────────

create_issue \
  "[B1] Tablet provisioning procedure — one-page enumerator doc" \
  "track-b,docs" \
  "Track B — Field deployment" \
  "Step-by-step procedure for enumerators (in each partner office) to provision a tablet:

1. Connect tablet to partner-office Wi-Fi
2. Open the PWA URL in Chrome
3. Wait for offline-ready indicator
4. Install to home screen
5. Disconnect Wi-Fi; confirm app still opens and runs

**Acceptance:** \`docs/project/PROVISIONING.md\` ready to hand to field teams."

create_issue \
  "[B2] PWA install prompt + Add-to-Home-Screen UX" \
  "track-b,engineering" \
  "Track B — Field deployment" \
  "Catch \`beforeinstallprompt\` and surface a prominent \"Install as app\" button on first visit. Track whether it was accepted.

**Acceptance:** first-visit shows install prompt; tapping it installs a standalone app with landscape orientation lock; \`install_prompt_outcome\` event logged."

create_issue \
  "[B3] Pre-session diagnostics launcher" \
  "track-b,engineering" \
  "Track B — Field deployment" \
  "Before the Welcome screen is shown on first app launch (or via admin), run a diagnostics check: Service Worker active, ≥20% battery, ≥100 MB storage free, all 10 narration MP3s cached. Show one green \"Ready\" light or a list of warnings with fix guidance.

**Acceptance:** enumerator sees a clear ready/not-ready state in < 3 seconds; admin panel has a \"Re-check\" button."

create_issue \
  "[B4] Playwright offline test — full V-A + V-B flows in airplane mode" \
  "track-b,engineering" \
  "Track B — Field deployment" \
  "Extend \`e2e/full-session.spec.js\` with a new spec that boots the PWA, waits for Service Worker activation, disables network (\`context.setOffline(true)\`), then runs both version flows to Completion.

**Acceptance:** \`npx playwright test e2e/offline-session.spec.js\` passes on CI."

create_issue \
  "[B5] Background Sync API + visible queue count" \
  "track-b,engineering" \
  "Track B — Field deployment" \
  "Register the PWA's Service Worker for Background Sync so completed sessions automatically post when connectivity returns. Add a \"N sessions pending sync\" badge to the Admin panel.

**Acceptance:** tablet completes a session offline; later when connectivity returns (without opening the app) the Worker syncs the session; admin queue count drops to zero."

create_issue \
  "[B6] Admin backup/recovery: USB export, QR tablet-to-tablet transfer" \
  "track-b,engineering" \
  "Track B — Field deployment" \
  "If a tablet fails mid-day with unsynced sessions, the enumerator needs to recover data without connectivity. Two recovery paths:

1. Export-to-USB: admin panel → Export → writes \`.json\` bundle to the tablet's Downloads, transferable via USB cable
2. Tablet-to-tablet via QR: one tablet displays a QR sequence; another tablet scans and imports

**Acceptance:** data recoverable from a tablet that never reconnects to the network."

create_issue \
  "[B7] Deploy sync backend to Cloudflare Workers + Neon" \
  "track-b,infrastructure" \
  "Track B — Field deployment" \
  "Follow \`investment-game-server/README.md\`:

1. Create Neon project
2. \`npm run migrate\` from laptop
3. \`wrangler secret put DATABASE_URL / ENUMERATOR_TOKENS / ADMIN_TOKEN\`
4. \`npm run deploy\`
5. Point PWA Admin → Sync tab at the Worker URL

**Acceptance:** \`/health\` returns \`{ok:true}\`; a completed session on the deployed PWA shows up in Neon within 5 seconds of admin-panel \"Sync now\"."

create_issue \
  "[B8] Tablet hardware spec + recommended models + purchase path" \
  "track-b,docs,infrastructure" \
  "Track B — Field deployment" \
  "Minimum spec: Android 10+, ≥2 GB RAM, ≥16 GB storage, ≥8h battery, 10-inch screen. Research 2–3 specific models available locally in Uganda + Zambia. Document bulk purchase / rental path through partners.

**Acceptance:** \`docs/project/TABLETS.md\` with models, prices, procurement contacts."

create_issue \
  "[B9] Enumerator training materials (video or printed card)" \
  "track-b,content,docs" \
  "Track B — Field deployment" \
  "Short (2–3 min) video or printed card covering: power on, launch app, setup screen, hand tablet to participant, end-of-day sync, stuck-screen recovery.

**Acceptance:** materials reviewed by a partner's field lead and used in a pilot training session."

create_issue \
  "[B10] Backend hardening: Helmet-equivalent, rate limit, structured logs, backups" \
  "track-b,engineering,infrastructure" \
  "Track B — Field deployment" \
  "On Cloudflare Workers the request surface is already smaller (no Node vulnerabilities), but:

- Rate-limit on \`/api/sessions\` (e.g., 60 req/min per token) via Cloudflare Rate Limiting rules
- Structured JSON logs via \`console.log(JSON.stringify({...}))\` so Logpush works
- Neon auto-backup is enabled by default; add a cron'd \`pg_dump\` to S3 for offline archive
- Runbook in \`docs/project/RUNBOOK.md\` for common incidents

**Acceptance:** rate-limit rule deployed, logs flow to storage, backup cron runs, runbook exists."

# ─── TRACK C ───────────────────────────────────────────────────────────────

create_issue \
  "[C1] Codebook / data dictionary for session + event + trajectory CSVs" \
  "track-c,docs" \
  "Track C — Analysis pipeline" \
  "One-page markdown per CSV column: variable name, type, valid values, definition, missingness rules. Critical for collaborators not close to the code.

**Acceptance:** \`docs/project/CODEBOOK.md\` covers all 37 session CSV columns + event-log + stepper-trajectory formats."

create_issue \
  "[C2] Pre-registered analysis plan (primary + secondary questions)" \
  "track-c,docs,needs-pi,research-integrity" \
  "Track C — Analysis pipeline" \
  "Per the research design summary: primary questions (demand, information seeking, fertilizer investment), secondary (learning spillover, demographic heterogeneity). Specify identification strategies, tests, and multiple-comparison corrections BEFORE field starts.

AEA RCT Registry recommended.

**Acceptance:** analysis plan PDF uploaded + AEA registration URL linked in repo."

create_issue \
  "[C3] Power calculations for n=3,200 sample" \
  "track-c,docs,needs-pi" \
  "Track C — Analysis pipeline" \
  "Given n = 3,200 (800 × 2 partners × 2 countries), what effect sizes are detectable on each primary outcome? Do once before field; needed for IRB and reviewers.

**Acceptance:** power analysis script + writeup in \`docs/project/POWER_ANALYSIS.md\`."

create_issue \
  "[C4] R/Stata cleaning scripts: raw export → analysis-ready panels" \
  "track-c,engineering" \
  "Track C — Analysis pipeline" \
  "Scripts that take the three CSV exports (session, event, stepper-trajectory) and produce:

- Long panel of session × round
- Behavioral-metric derivations (stepper-change count, confirm-cancellations, time-to-first-action, video-scene completion fractions)
- Merged participant-level file ready for regression

**Acceptance:** \`analysis/clean.R\` and \`analysis/clean.do\` produce the same output files; tested on a sample export bundle."

create_issue \
  "[C5] Participant-ID format decision + validator in EnumeratorSetup" \
  "track-c,engineering,needs-pi,research-integrity" \
  "Track C — Analysis pipeline" \
  "Before day one of field, lock the participant-ID format so game sessions join correctly to main-impact-evaluation outcomes. Proposed: \`{COUNTRY}-{PARTNER}-{TREATMENT}-{SEQ}\` e.g. \`UG-OAF-B2-00042\`.

Add client-side regex validator on EnumeratorSetup.

**Acceptance:** format agreed with IE leads; validator blocks invalid IDs; format documented in README."

create_issue \
  "[C6] Fieldwork monitoring dashboard on the sync server" \
  "track-c,engineering,infrastructure" \
  "Track C — Analysis pipeline" \
  "During data collection, PI / field coordinator needs a live dashboard:

- Sessions completed per day per partner
- Comprehension-check pass rates
- Video-replay patterns
- Version A/B balance check (should run ~50/50)

Read-only, admin-token-gated, served from the same Cloudflare Worker.

Depends on B7 (backend live).

**Acceptance:** \`/admin/dashboard\` endpoint renders charts; deployed and gated."

create_issue \
  "[C7] Server-side ingest validation (weather, payouts, state consistency)" \
  "track-c,engineering,research-integrity" \
  "Track C — Analysis pipeline" \
  "On \`POST /api/sessions\`, re-run the payout formulas against the logged inputs and weather seed; flag sessions where the stored totals don't match. Catches tampering, app bugs, network corruption.

Non-fatal: store the session anyway, mark with \`validation_warnings\` JSON column.

**Acceptance:** validation runs in < 50ms; warnings surfaced in admin list view."

create_issue \
  "[C8] End-of-study archival package" \
  "track-c,docs" \
  "Track C — Analysis pipeline" \
  "At study end, assemble a replication package:

- Raw JSON per session (from Neon dump)
- Frozen code version (git tag)
- \`game_logic.md\` + \`SPEC_DISCREPANCIES.md\` resolution
- Codebook
- Cleaning scripts

Enables replication in 5 years.

**Acceptance:** archive uploaded to project-designated long-term store (OSF / Dataverse / CIAT repository)."

create_issue \
  "[C9] Audio recording governance + key separation if recording enabled" \
  "track-c,docs,needs-pi,research-integrity" \
  "Track C — Analysis pipeline" \
  "If audio recording is turned on per IRB:

- Document retention period, transcription, and access policy
- Currently the AES-GCM session key is stored on the session record itself (anyone with the session row can decrypt) — separate the key storage so decryption requires a second credential

**Acceptance:** governance doc + (if recording goes live) key-separation implemented before first recorded session."

echo
echo "✓ Done. Review them at https://github.com/$REPO/issues"

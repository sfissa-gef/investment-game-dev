#!/usr/bin/env bash
# Build GitHub Wiki content from docs/ into a target directory.
#
# Usage:
#   ./scripts/build-wiki.sh [target-dir]     # raw — just generates pages
#   make wiki                                # generates into ../investment-game.wiki
#   make wiki-push                           # generates + commits + pushes
#
# First-time setup (once per fresh clone of the main repo):
#   1) Ensure the wiki exists on GitHub — click "Wiki" tab, create any first page.
#   2) git clone git@github.com:sfissa-gef/investment-game.wiki.git \
#        ../investment-game.wiki
#   3) make wiki-push
#
# Default target: /tmp/wiki-staging (just for previewing).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-/tmp/wiki-staging}"

mkdir -p "$TARGET"
# Wipe prior generated pages but keep the user's .git dir if they cloned the wiki repo.
find "$TARGET" -maxdepth 1 -type f -name '*.md' -delete

DOCS="$REPO_ROOT/docs"

# Rename mapping: repo-path → wiki page name.
# Page names use spaces; GitHub converts them to hyphenated URLs automatically.
declare -a MAPPINGS=(
  "research/concept_note.md|Concept-Note.md|1. Concept Note"
  "research/gameplay_script.md|Gameplay-Script.md|2. Gameplay Script"
  "research/strategy.md|Strategy.md|3. Strategy"
  "research/claude_design_brief.md|Design-Brief.md|4. Design Brief"
  "research/game_logic.md|Spec-Game-Logic.md|5. Spec — Game Logic"
  "research/screen_specs.md|Spec-Screen-Specifications.md|6. Spec — Screens"
  "research/data_schema.md|Spec-Data-Schema.md|7. Spec — Data Schema"
  "research/design_system.md|Spec-Design-System.md|8. Spec — Design System"
  "project/ROADMAP.md|Roadmap.md|9. Roadmap"
  "project/SPEC_DISCREPANCIES.md|Spec-Discrepancies.md|10. Spec Discrepancies (PI sign-off)"
  "project/TRANSLATION_TODO.md|Translation-TODO.md|11. Translation TODO"
)

echo "→ Building wiki into: $TARGET"

# Copy + lightly massage each page. We rewrite relative md links so they resolve
# inside the wiki (e.g. 'game_logic.md' → '[[Spec Game Logic]]').
for m in "${MAPPINGS[@]}"; do
  IFS='|' read -r src dst title <<< "$m"
  in="$DOCS/$src"
  out="$TARGET/$dst"
  if [ ! -f "$in" ]; then
    echo "  ✗ missing source: $src"
    continue
  fi

  # Prepend wiki breadcrumb + strip potentially duplicated top H1.
  {
    echo "_← [Home](Home)_"
    echo
    cat "$in" \
      | sed 's|](\.\./research/\([^)]*\)\.md)|](\1)|g' \
      | sed 's|](\.\./project/\([^)]*\)\.md)|](\1)|g' \
      | sed 's|](\./\([^)]*\)\.md)|](\1)|g'
  } > "$out"

  printf "  ✓ %-38s %s\n" "$dst" "(from docs/$src)"
done

# Consolidated Video Scripts page — one page with anchor links per video.
VS="$TARGET/Video-Scripts.md"
{
  echo "_← [Home](Home)_"
  echo
  echo "# Video scripts"
  echo
  echo "Storyboards for the 10 narrated videos that play inside the app. Each has a timed sequence of visual beats and caption text. Narration recorded in English via ElevenLabs Mapendo voice; Luganda and Bemba recordings pending translation."
  echo
  echo "## Index"
  echo
  for f in A1_game_overview A2_weather_explanation A3_budget A4_fertilizer_good_rain A5_fertilizer_bad_rain A6_ui_tutorial B1_insurance_unbundled B2_insurance_bundled; do
    label=$(echo "$f" | sed 's/_/ /g')
    echo "- [${label}](#${f})"
  done
  echo
  echo "---"
  for f in A1_game_overview A2_weather_explanation A3_budget A4_fertilizer_good_rain A5_fertilizer_bad_rain A6_ui_tutorial B1_insurance_unbundled B2_insurance_bundled; do
    echo
    echo "<a id=\"${f}\"></a>"
    echo
    cat "$DOCS/video_scripts/${f}.md"
    echo
    echo "---"
  done
} > "$VS"
printf "  ✓ %-38s %s\n" "Video-Scripts.md" "(composed from 8 scripts)"

# Mockups page — links to the in-repo PDF and PPTX.
MK="$TARGET/Mockups.md"
cat > "$MK" <<'EOF'
_← [Home](Home)_

# Mockups

Original design mockups that informed the in-app visuals. Kept in the main repo because GitHub Wiki doesn't support binary attachments well.

- **PDF version** — [docs/mockups/bundle_game_mockup.pdf](https://github.com/sfissa-gef/investment-game/blob/main/docs/mockups/bundle_game_mockup.pdf) (9 pages, 215 KB)
- **Editable PPTX** — [docs/mockups/bundle_game_mockup.pptx](https://github.com/sfissa-gef/investment-game/blob/main/docs/mockups/bundle_game_mockup.pptx) (684 KB)

The PDF contains 9 annotated screen mockups. The built app reproduces them in [Spec — Screens](Spec-Screen-Specifications).
EOF
printf "  ✓ %-38s %s\n" "Mockups.md" "(repo-PDF links)"

# Development Guide — distilled from the two READMEs.
DV="$TARGET/Development-Guide.md"
cat > "$DV" <<'EOF'
_← [Home](Home)_

# Development guide

## Run the PWA locally

```bash
cd investment-game
npm install
npm run dev          # http://localhost:5173
npm test             # 47 tests
npm run build        # production bundle → dist/
```

## Run the sync backend locally

```bash
cd investment-game-server
cp .env.example .env
docker compose up -d                       # starts Postgres + app
docker compose exec app npm run migrate    # creates tables
curl http://localhost:4000/health
```

## Regenerate narration (ElevenLabs Mapendo voice)

```bash
# one-time: put credentials in investment-game/.env.local (gitignored)
cat > investment-game/.env.local <<EOF2
BACKEND=elevenlabs
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=dOqxOZEisn8SiUH1dPCC
EOF2
chmod 600 investment-game/.env.local
cd investment-game && ./scripts/generate-narration.sh
```

Fallback (free, robotic): `BACKEND=say ./scripts/generate-narration.sh`.

## Regenerate icons

```bash
cd investment-game && ./scripts/fetch-icons.sh
```

## Deploy to Cloudflare Pages

```bash
cd investment-game
npm run build
npx wrangler pages deploy dist --project-name=investment-game --branch=app-game-gef-production
```

## Testing before PR

- `npm test` — 47 green
- `npm run build` — clean, no warnings
- If game-logic was touched: `npx vitest run tests/payout.test.js`
- Manual: click through a full V-A and a V-B session in DevTools 1280×800 landscape

## Key invariants — don't break without PI discussion

- **Forward-only state machine.** No back button in game flow.
- **Weather drawn at plant-confirm**, not pre-computed. Seed logged.
- **Stepper prevents overspend in real-time**, not just warns.
- **Practice round mandatory.**
- **No scrolling in game screens.**
- **Payout numbers in `lib/constants.js` are research instruments** — don't change without approval.
EOF
printf "  ✓ %-38s %s\n" "Development-Guide.md" "(distilled from READMEs)"

# Home.md — landing page with sectioned cards.
cat > "$TARGET/Home.md" <<'EOF'
# Investment Game — GEF Field Experiment

Tablet-based lab-in-the-field experiment testing how bundling seeds + insurance affects smallholder farmers' demand, information-seeking, and risk-taking. Deployed to ~3,200 participants across rural Zambia and Uganda. Offline-capable PWA.

**Live demo:** [investment-game.pages.dev](https://investment-game.pages.dev) · **Repo:** [github.com/sfissa-gef/investment-game](https://github.com/sfissa-gef/investment-game)

---

## 📚 Research

- **[Concept Note](Concept-Note)** — motivation, research questions, experimental design
- **[Gameplay Script](Gameplay-Script)** — the story flow as participants experience it
- **[Strategy](Strategy)** — implementation roadmap + risk mitigation
- **[Design Brief](Design-Brief)** — visual brief for the illustration style

## 🔧 Specifications

- **[Spec — Game Logic](Spec-Game-Logic)** — rules, payouts, randomization, truth tables
- **[Spec — Screens](Spec-Screen-Specifications)** — every screen, every interaction
- **[Spec — Data Schema](Spec-Data-Schema)** — IndexedDB + export format
- **[Spec — Design System](Spec-Design-System)** — colors, typography, components

## 🎬 Video Content

- **[Video Scripts](Video-Scripts)** — 10 narrated storyboards (instructions + insurance explainers)

## 🚀 Development

- **[Development Guide](Development-Guide)** — run locally, regenerate narration, deploy

## 📋 Project Status

- **[Roadmap](Roadmap)** — three work tracks: language completion, low-connectivity deployment, analysis pipeline
- **[Spec Discrepancies (PI sign-off)](Spec-Discrepancies)** — open decision on truth-table typos. **Blocks field deployment.**
- **[Translation TODO](Translation-TODO)** — what native speakers need to review for Luganda + Bemba

## 🎨 Assets

- **[Mockups](Mockups)** — original design mockups (PDF/PPTX)

---

_Last synced from [`docs/`](https://github.com/sfissa-gef/investment-game/tree/main/docs). Regenerate with `./scripts/build-wiki.sh`._
EOF
printf "  ✓ %-38s %s\n" "Home.md" "(landing page)"

# Sidebar — persistent navigation on every wiki page.
cat > "$TARGET/_Sidebar.md" <<'EOF'
**[🏠 Home](Home)**

**📚 Research**
- [Concept Note](Concept-Note)
- [Gameplay Script](Gameplay-Script)
- [Strategy](Strategy)
- [Design Brief](Design-Brief)

**🔧 Specifications**
- [Game Logic](Spec-Game-Logic)
- [Screens](Spec-Screen-Specifications)
- [Data Schema](Spec-Data-Schema)
- [Design System](Spec-Design-System)

**🎬 Content**
- [Video Scripts](Video-Scripts)
- [Mockups](Mockups)

**🚀 Dev**
- [Development Guide](Development-Guide)

**📋 Project**
- [Roadmap](Roadmap)
- [Spec Discrepancies](Spec-Discrepancies)
- [Translation TODO](Translation-TODO)
EOF
printf "  ✓ %-38s %s\n" "_Sidebar.md" "(persistent nav)"

# Footer — persistent on every page.
cat > "$TARGET/_Footer.md" <<'EOF'
---
Alliance of Bioversity International and CIAT · IFPRI · Funded by GEF · [MIT License](https://github.com/sfissa-gef/investment-game/blob/main/LICENSE)
EOF
printf "  ✓ %-38s %s\n" "_Footer.md" "(persistent footer)"

echo
echo "✓ Done. $(ls "$TARGET"/*.md | wc -l | tr -d ' ') pages written to $TARGET"
ls -la "$TARGET" | head -20

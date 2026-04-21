# Analysis

Reproducible pipeline for turning Investment Game session data into research outputs.

## Layout

```
analysis/
├── README.md            ← you are here
├── PREREGISTRATION.md   ← pre-registered analysis plan (PI to complete before fieldwork)
├── scripts/
│   └── deidentify.mjs   ← Node: strip participant/enumerator IDs → stable pseudonyms
└── R/
    ├── README.md        ← how to run the R pipeline
    ├── 00_load.R        ← read de-identified CSV exports
    ├── 01_qa.R          ← cross-session QA (version balance, weather distribution χ²)
    └── 02_demand.R      ← primary outcome: insurance/seed demand by treatment
```

## Privacy ground rules

1. **Never put raw exports in git.** `data/raw/` is gitignored. Keep raw JSON/CSV on a password-protected researcher laptop or in Neon. Only de-identified outputs go anywhere shared.
2. **Always de-identify before analysis.** The R scripts assume they're reading from `data/deid/`, never `data/raw/`.
3. **Salt management.** The `DEID_SALT` must stay consistent across the study so pseudonyms are stable. Store it in a password manager. If it leaks, rotation breaks longitudinal linkability.
4. **Free-text redaction.** The de-id script redacts survey strings > 200 chars by default — extend the heuristic if your survey collects sensitive fields.

## End-to-end pipeline

```bash
# 1. Export raw sessions from the Worker (admin token required)
# Not checked in; do this on a researcher laptop.
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://investment-game-server.investment-app.workers.dev/api/sessions \
     > data/raw/sessions-index.json

# Per-session detail (loop over the index):
jq -r '.[].session_id' data/raw/sessions-index.json | while read sid; do
  curl -sS -H "Authorization: Bearer $ADMIN_TOKEN" \
       "https://investment-game-server.investment-app.workers.dev/api/sessions/$sid" \
       > "data/raw/sessions/$sid.json"
done

# 2. De-identify
export DEID_SALT="$(cat ~/.investment-game/deid.salt)"   # or however you store it
node analysis/scripts/deidentify.mjs \
     --in data/raw/sessions/ \
     --out data/deid/sessions/

# 3. Convert to CSV (one row per session + long event log)
# TODO: migrate-to-CSV script — currently the PWA admin export produces CSV directly;
# for server-sourced data we'll want a dedicated convert step.

# 4. Run R analysis
Rscript analysis/R/00_load.R
Rscript analysis/R/01_qa.R
Rscript analysis/R/02_demand.R
# → produces analysis/output/*.html and *.csv
```

## QA layers

The system does quality checks at two points:

1. **At ingest (per-session, in the Worker).** [investment-game-server/src/qa.js](../investment-game-server/src/qa.js) recomputes payouts, reproduces weather draws from seeds, checks budget invariants, enforces the V-A insurance gate, and validates stepper trajectories. Results land in `sessions.qa_flags`. **If `qa_passed=false` for any session, investigate before including it in analysis.**
2. **Cross-session (in R).** [R/01_qa.R](R/01_qa.R) checks version-assignment balance (χ² on weekly windows), weather distribution drift (should track 80/20), comprehension-check pass rates, and per-enumerator anomalies (e.g. one enumerator's participants all fail V-A insurance gating — likely protocol deviation).

See [docs/project/ROADMAP_DEV.md](../docs/project/ROADMAP_DEV.md) D4 for the roadmap.

## Expected outputs

From a completed study:

- `analysis/output/primary_outcomes.html` — demand by treatment, WTP for insurance, info-seeking (video replay counts)
- `analysis/output/heterogeneity.html` — by demographics (gender, age, education), by country, by partner
- `analysis/output/qa_report.html` — cross-session integrity checks, flagged-session list
- `analysis/output/aea_tables.tex` — pre-registered tables for the AEA registry submission

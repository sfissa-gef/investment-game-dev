# R analysis pipeline

Reproducible analysis over de-identified Investment Game data.

## Requirements

- R ≥ 4.3
- Packages: `tidyverse`, `jsonlite`, `here`, `rmarkdown`, `fixest`, `broom`
- Install: `install.packages(c("tidyverse", "jsonlite", "here", "rmarkdown", "fixest", "broom"))`

## Running

From the repo root:

```bash
# Data path expected at ../data/deid/ (gitignored). See analysis/README.md for the
# full export + de-id pipeline.
Rscript analysis/R/00_load.R     # loads data, caches tidy data frame
Rscript analysis/R/01_qa.R       # cross-session integrity checks
Rscript analysis/R/02_demand.R   # primary outcome: demand by treatment
```

Each script writes its HTML report + CSV tables to `analysis/output/`.

## Script boundaries (pre-registered)

- `00_load.R` — pure I/O + schema check. Fails loud if any session has a shape the
  tidy loader doesn't recognize. No analysis decisions here.
- `01_qa.R` — integrity only. Version balance χ², weather distribution, enumerator
  anomaly flags. If this script raises any red flags, the primary analysis
  scripts should NOT be run until issues are resolved.
- `02_demand.R` — primary registered test (bundled vs separate demand). One table,
  one figure, explicit estimand, explicit test.
- `03_heterogeneity.R` (future) — pre-registered interaction tests only. No
  p-value fishing.
- `04_exploratory.R` (future) — clearly marked as exploratory. All exploratory
  results must be labeled as such in any report.

## Deferred to first real pilot data

The stubs below are skeletons with the correct structure. Fill in real estimation
code once pilot sessions arrive and the analyst can validate the data shape
matches `docs/research/data_schema.md`.

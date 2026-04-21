# 01_qa.R — cross-session integrity checks.
#
# Per-session QA runs in the Worker (investment-game-server/src/qa.js). This
# script adds the checks that can only be done across many sessions.
#
# A red flag here should block downstream analysis until investigated.

suppressPackageStartupMessages({
  library(tidyverse)
  library(here)
})

sessions <- readRDS(here::here("..", "data", "tidy", "sessions.rds"))
out_dir  <- here::here("..", "analysis", "output")
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

report <- list()

# ─────────────────────────────────────────────────────────────────────
# Per-session QA failures (set by the Worker at ingest)
# ─────────────────────────────────────────────────────────────────────
qa_failed <- sessions |> dplyr::filter(!qa_passed)
report$qa_failed_count <- nrow(qa_failed)
message(sprintf("Per-session QA failures: %d / %d", nrow(qa_failed), nrow(sessions)))
if (nrow(qa_failed) > 0) {
  write_csv(qa_failed, file.path(out_dir, "qa_failed_sessions.csv"))
}

# ─────────────────────────────────────────────────────────────────────
# Version assignment balance (pre-registered χ² test)
# ─────────────────────────────────────────────────────────────────────
version_counts <- sessions |>
  dplyr::filter(!is.na(round2_version)) |>
  dplyr::count(round2_version)
if (nrow(version_counts) == 2) {
  chi <- chisq.test(version_counts$n, p = c(0.5, 0.5))
  report$version_balance_p <- chi$p.value
  message(sprintf("Version A: %d, B: %d, χ² p = %.3f",
                  version_counts$n[version_counts$round2_version == "A"],
                  version_counts$n[version_counts$round2_version == "B"],
                  chi$p.value))
  if (chi$p.value < 0.01) {
    warning("⚠ Version balance p < 0.01 — investigate assignVersion() determinism or enrollment bias.")
  }
}

# ─────────────────────────────────────────────────────────────────────
# Weather distribution (should track 80% good / 20% bad)
# ─────────────────────────────────────────────────────────────────────
weather <- sessions |>
  dplyr::select(session_id, weather_r1, weather_r2) |>
  tidyr::pivot_longer(-session_id, names_to = "round", values_to = "outcome") |>
  dplyr::filter(!is.na(outcome))

weather_table <- table(weather$outcome)
if (length(weather_table) == 2) {
  expected <- c(bad = sum(weather_table) * 0.20, good = sum(weather_table) * 0.80)
  chi_w <- chisq.test(weather_table, p = c(0.20, 0.80))
  report$weather_chi_p <- chi_w$p.value
  message(sprintf("Weather good:bad = %d:%d, χ² p = %.3f",
                  weather_table["good"], weather_table["bad"], chi_w$p.value))
  if (chi_w$p.value < 0.01) {
    warning("⚠ Weather distribution p < 0.01 — check seedrandom seeding.")
  }
}

# ─────────────────────────────────────────────────────────────────────
# Per-enumerator anomaly flag
# ─────────────────────────────────────────────────────────────────────
enumerator_summary <- sessions |>
  dplyr::group_by(enumerator_id) |>
  dplyr::summarise(
    n = dplyr::n(),
    qa_fail_rate = mean(!qa_passed, na.rm = TRUE),
    mean_duration_min = mean(session_duration_min, na.rm = TRUE),
  ) |>
  dplyr::arrange(dplyr::desc(qa_fail_rate))

write_csv(enumerator_summary, file.path(out_dir, "qa_by_enumerator.csv"))

# ─────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────
saveRDS(report, file.path(out_dir, "qa_report.rds"))
cat("\n=== QA summary ===\n")
print(report)
message(sprintf("\n✓ QA outputs written to %s", out_dir))

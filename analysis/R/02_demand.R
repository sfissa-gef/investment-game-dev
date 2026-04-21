# 02_demand.R — primary pre-registered analysis.
#
# Hypothesis H1 (PREREGISTRATION.md §2): participants are more likely to
# purchase insured improved seeds when offered as a bundle (V-B) than when
# offered as separately priced items (V-A).
#
# Test: two-proportion z-test on `insured_seed_purchase` between versions.

suppressPackageStartupMessages({
  library(tidyverse)
  library(here)
})

sessions <- readRDS(here::here("..", "data", "tidy", "sessions.rds"))
out_dir  <- here::here("..", "analysis", "output")
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

# Apply pre-registered exclusions (PREREGISTRATION.md §6)
analysis_set <- sessions |>
  dplyr::filter(
    qa_passed,
    !is.na(round2_version),
    !is.na(insured_seed_purchase),
    session_duration_min >= 8,
    session_duration_min <= 90,
  )

excluded_n <- nrow(sessions) - nrow(analysis_set)
message(sprintf("Analysis sample: %d (excluded %d)", nrow(analysis_set), excluded_n))

# ─────────────────────────────────────────────────────────────────────
# Primary test
# ─────────────────────────────────────────────────────────────────────
tab <- analysis_set |>
  dplyr::group_by(round2_version) |>
  dplyr::summarise(
    n = dplyr::n(),
    n_insured = sum(insured_seed_purchase, na.rm = TRUE),
    prop = mean(insured_seed_purchase, na.rm = TRUE),
    .groups = "drop"
  )

print(tab)

if (nrow(tab) == 2) {
  p_test <- prop.test(
    x = tab$n_insured,
    n = tab$n,
    correct = FALSE,
  )
  primary_result <- tibble::tibble(
    hypothesis = "H1: insured-seed purchase V-B > V-A",
    v_a_prop = tab$prop[tab$round2_version == "A"],
    v_b_prop = tab$prop[tab$round2_version == "B"],
    diff     = tab$prop[tab$round2_version == "B"] - tab$prop[tab$round2_version == "A"],
    chi_sq   = unname(p_test$statistic),
    p_value  = p_test$p.value,
    ci_low   = p_test$conf.int[1],
    ci_high  = p_test$conf.int[2],
  )
  write_csv(primary_result, file.path(out_dir, "primary_h1.csv"))
  message("Primary result:")
  print(primary_result)
} else {
  warning("Only one version present — cannot run H1 test.")
}

# ─────────────────────────────────────────────────────────────────────
# Descriptive plot
# ─────────────────────────────────────────────────────────────────────
if (requireNamespace("ggplot2", quietly = TRUE) && nrow(tab) == 2) {
  p <- ggplot2::ggplot(tab, ggplot2::aes(x = round2_version, y = prop, fill = round2_version)) +
    ggplot2::geom_col(width = 0.6) +
    ggplot2::geom_text(ggplot2::aes(label = sprintf("%.1f%%  (n=%d)", 100*prop, n)), vjust = -0.5) +
    ggplot2::scale_y_continuous(labels = scales::percent, limits = c(0, 1)) +
    ggplot2::labs(
      title = "H1: Insured-seed purchase rate by Round-2 version",
      x = "Round 2 version", y = "Proportion purchasing insured seeds",
    ) +
    ggplot2::theme_minimal() +
    ggplot2::theme(legend.position = "none")
  ggplot2::ggsave(file.path(out_dir, "primary_h1.png"), p, width = 5, height = 4, dpi = 150)
  message(sprintf("✓ Wrote %s", file.path(out_dir, "primary_h1.png")))
}

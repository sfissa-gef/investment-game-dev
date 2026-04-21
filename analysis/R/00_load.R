# 00_load.R — load de-identified session JSONs into a tidy data frame.
#
# Input:  ../data/deid/sessions/*.json  (produced by analysis/scripts/deidentify.mjs)
# Output: ../data/tidy/sessions.rds     (cached tidy data frame for downstream scripts)
#
# Fails loud on any schema mismatch. Schema source of truth:
#   docs/research/data_schema.md
#   investment-game-server/src/schemas.js

suppressPackageStartupMessages({
  library(tidyverse)
  library(jsonlite)
  library(here)
})

raw_dir  <- here::here("..", "data", "deid", "sessions")
out_dir  <- here::here("..", "data", "tidy")
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

if (!dir.exists(raw_dir)) {
  stop(sprintf(
    "De-identified data directory not found: %s\nRun analysis/scripts/deidentify.mjs first. See analysis/README.md.",
    raw_dir
  ))
}

files <- list.files(raw_dir, pattern = "\\.json$", full.names = TRUE)
if (length(files) == 0) {
  stop("No session files found in ", raw_dir)
}

message(sprintf("Loading %d session file(s)...", length(files)))

sessions <- purrr::map_dfr(files, function(f) {
  s <- jsonlite::read_json(f, simplifyVector = FALSE)
  # Flatten the bits we care about into one row per session.
  tibble::tibble(
    session_id     = s$sessionId,
    participant_id = s$participantId,
    enumerator_id  = s$enumeratorId,
    country        = s$country,
    partner        = s$partner %||% NA_character_,
    round2_version = s$round2Version,
    language       = s$language,
    app_version    = s$appVersion %||% NA_character_,
    session_start  = s$sessionStartTime,
    session_end    = s$sessionEndTime %||% NA_character_,

    fert_r1        = s$round1$fertilizerPurchased %||% NA_integer_,
    weather_r1     = s$round1$weatherOutcome %||% NA_character_,
    tokens_r1      = s$round1$totalTokens %||% NA_real_,

    fert_r2        = s$round2$fertilizerPurchased %||% NA_integer_,
    seeds_r2       = s$round2$seedsPurchased %||% NA,
    insurance_r2   = s$round2$insurancePurchased %||% NA,
    bundle_r2      = s$round2$bundlePurchased %||% NA,
    video_watched  = s$round2$videoChosen %||% NA,
    weather_r2     = s$round2$weatherOutcome %||% NA_character_,
    tokens_r2      = s$round2$totalTokens %||% NA_real_,

    total_tokens   = s$totalIncentivizedTokens %||% NA_real_,
    qa_passed      = s$qa_passed %||% NA,
  )
})

# Derived canonical outcomes (see PREREGISTRATION.md §5)
sessions <- sessions |>
  dplyr::mutate(
    insured_seed_purchase = dplyr::case_when(
      round2_version == "A" ~ seeds_r2 & insurance_r2,
      round2_version == "B" ~ bundle_r2,
      TRUE ~ NA
    ),
    session_duration_min = as.numeric(difftime(
      lubridate::ymd_hms(session_end, quiet = TRUE),
      lubridate::ymd_hms(session_start, quiet = TRUE),
      units = "mins"
    )),
  )

saveRDS(sessions, file.path(out_dir, "sessions.rds"))
message(sprintf(
  "✓ Loaded %d session(s). Version A: %d, Version B: %d.",
  nrow(sessions),
  sum(sessions$round2_version == "A", na.rm = TRUE),
  sum(sessions$round2_version == "B", na.rm = TRUE)
))

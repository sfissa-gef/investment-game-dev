#!/usr/bin/env bash
# Generate English narration MP3s for the 10 instruction + insurance videos.
#
# Two backends:
#   BACKEND=say         (default)  macOS `say` + ffmpeg. Free, offline, robotic.
#   BACKEND=elevenlabs             High-quality neural TTS. Needs API key.
#
# Usage examples:
#   ./scripts/generate-narration.sh
#   BACKEND=elevenlabs ELEVENLABS_API_KEY=sk_... ELEVENLABS_VOICE_ID=... ./scripts/generate-narration.sh
#
# Never commit your API key. Pass it as env var only.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Load secrets from .env.local if present (gitignored). Never echo their values.
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a
  # shellcheck disable=SC1090,SC1091
  . "$PROJECT_ROOT/.env.local"
  set +a
fi

LANG_CODE="${LANG_CODE:-en}"
OUT_DIR="$PROJECT_ROOT/public/audio/$LANG_CODE/videos"
mkdir -p "$OUT_DIR"

if [ "$LANG_CODE" != "en" ]; then
  cat <<EOF >&2
⚠️  LANG_CODE=$LANG_CODE

This script currently ships with English narration text only. For a non-English
language to work:
  1. A native speaker must translate every narration string in this script.
  2. Save a copy of this script (e.g. generate-narration-$LANG_CODE.sh) with the
     translated text OR extract texts into scripts/narration-texts/$LANG_CODE.json.
  3. ElevenLabs Mapendo voice supports multilingual TTS (eleven_multilingual_v2)
     so the same voice_id can read translated text.

See docs/TRANSLATION_TODO.md for the full workflow.

Aborting — cannot generate $LANG_CODE audio from English source text.
EOF
  exit 2
fi
TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

BACKEND="${BACKEND:-say}"
VOICE="${VOICE:-Samantha}"
RATE="${RATE:-170}"
BITRATE="${BITRATE:-64k}"
ELEVENLABS_MODEL="${ELEVENLABS_MODEL:-eleven_multilingual_v2}"
ELEVENLABS_STABILITY="${ELEVENLABS_STABILITY:-0.55}"
ELEVENLABS_SIMILARITY="${ELEVENLABS_SIMILARITY:-0.75}"

if [ "$BACKEND" = "elevenlabs" ]; then
  : "${ELEVENLABS_API_KEY:?Set ELEVENLABS_API_KEY=sk_...}"
  : "${ELEVENLABS_VOICE_ID:?Set ELEVENLABS_VOICE_ID=... (20-char voice ID from dashboard)}"
  command -v jq >/dev/null || { echo "jq is required for elevenlabs backend"; exit 1; }

  # Per-language voice override: prefer ELEVENLABS_VOICE_ID_<LANG_UPPER> when set.
  # Falls back to ELEVENLABS_VOICE_ID (the default). See .env.example.
  LANG_UPPER=$(echo "$LANG_CODE" | tr '[:lower:]' '[:upper:]')
  LANG_VOICE_VAR="ELEVENLABS_VOICE_ID_${LANG_UPPER}"
  LANG_VOICE_VAL="${!LANG_VOICE_VAR:-}"
  if [ -n "$LANG_VOICE_VAL" ]; then
    ELEVENLABS_VOICE_ID="$LANG_VOICE_VAL"
    echo "→ Using per-language voice override ($LANG_VOICE_VAR)"
  fi
  echo "→ Backend: ElevenLabs  voice=$ELEVENLABS_VOICE_ID  lang=$LANG_CODE  model=$ELEVENLABS_MODEL"
else
  command -v say >/dev/null || { echo "macOS 'say' not available; try BACKEND=elevenlabs"; exit 1; }
  echo "→ Backend: say  voice=$VOICE  rate=$RATE"
fi

gen_say () {
  local id="$1" text="$2"
  say -v "$VOICE" -r "$RATE" -o "$TMP/$id.aiff" "$text"
  ffmpeg -y -loglevel error -i "$TMP/$id.aiff" \
    -codec:a libmp3lame -b:a "$BITRATE" -ar 22050 -ac 1 \
    "$OUT_DIR/$id.mp3"
}

gen_elevenlabs () {
  local id="$1" text="$2"
  local payload
  payload=$(jq -n \
    --arg text "$text" \
    --arg model "$ELEVENLABS_MODEL" \
    --argjson stability "$ELEVENLABS_STABILITY" \
    --argjson similarity "$ELEVENLABS_SIMILARITY" \
    '{text:$text, model_id:$model, voice_settings:{stability:$stability, similarity_boost:$similarity}}')

  local http_status
  http_status=$(curl -sS -w '%{http_code}' -o "$TMP/$id.raw" \
    -X POST "https://api.elevenlabs.io/v1/text-to-speech/$ELEVENLABS_VOICE_ID?output_format=mp3_22050_32" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [ "$http_status" != "200" ]; then
    echo "✗ $id failed (HTTP $http_status):"
    cat "$TMP/$id.raw" | head -c 400
    echo
    return 1
  fi
  mv "$TMP/$id.raw" "$OUT_DIR/$id.mp3"
}

gen () {
  local id="$1" text="$2"
  echo "→ $id ($(echo -n "$text" | wc -c | tr -d ' ') chars)"
  if [ "$BACKEND" = "elevenlabs" ]; then
    gen_elevenlabs "$id" "$text"
  else
    gen_say "$id" "$text"
  fi
}

# Narration scripts — keep in sync with scene caption text.
gen A1 "Welcome to the farming game. You will play three seasons. \
The first season is just for practice. It does not count. \
The next two seasons are real. \
The tokens you earn in those seasons will be converted to real money that you take home today."

gen A2 "Your harvest depends on the rains. \
Most seasons, four out of five, there will be good rains, and your crops will grow well. \
But sometimes, one out of five, there is bad rain, a drought, and your crops fail. \
You cannot predict which season will have bad rain. It is random, just like real weather."

gen A3 "Each season, you receive twenty five tokens. These are your budget. \
You can use tokens to buy farming inputs. Any tokens you do not spend are saved, they stay in your lockbox. \
Each season you get twenty five fresh tokens. \
They do not carry over from one season to the next."

gen A4 "You can buy fertilizer for your farm. Each bag of fertilizer costs one token. \
If the rains are good, each bag gives you two tokens back. Double your investment. \
If you buy all ten bags, and the rains are good, you will get twenty tokens as your harvest."

gen A5 "But if the rains are bad, your crops fail. \
No matter how much fertilizer you bought, you get zero tokens back from your harvest. \
However, the tokens you did not spend, the tokens in your lockbox, are still yours. \
They are safe."

gen A6 "Here is how to play. \
Your tokens start in the lockbox, on the left. This number shows how many tokens you have. \
Press the plus button to buy fertilizer. Your lockbox will update automatically. \
When you are finished, press the green plant button. \
Be careful. Once you press it, you cannot change your mind."

gen A7A "You have one more season to play. This round counts for your payment, just like Round one. \
But in this round, your decision is a little more complicated. You can still buy fertilizer. \
But now you can also buy improved seeds, and you can also buy insurance for those seeds if you'd like. \
The improved seeds cost ten tokens. If the rain is good, they pay back thirty tokens, in addition to any tokens from fertilizer. If the rain is bad, they pay nothing, the crop fails. \
Insurance costs two tokens more. It helps you recoup the cost of your seeds if the rain is bad."

gen A7B "You have one more season to play. This round counts for your payment, just like Round one. \
But in this round, your decision is a little more complicated. You can still buy fertilizer. \
But now you can also buy improved seeds to plant instead of local seeds. \
The improved seeds cost twelve tokens. If the rain is good, they pay back thirty tokens, in addition to any tokens from fertilizer. If the rain is bad, the seeds themselves pay nothing, the crop fails. \
But the improved seeds already include insurance as part of the price, to help you recoup the seed cost if the rain is bad."

gen B1 "Seeds cost ten tokens. Insurance costs two tokens more, twelve tokens total. \
If there is good rain, seeds earn you thirty tokens. Insurance pays nothing. \
If there is bad rain, seeds earn you nothing, your crop fails. But insurance pays you back ten tokens, covering the cost of your seeds. \
Either way, you are not left with nothing."

gen B2 "The improved seeds cost twelve tokens. This price includes insurance, ten tokens for the seeds and two tokens for the insurance. \
If there is good rain, you earn thirty tokens. The insurance pays nothing. \
If there is bad rain, your crop fails. But the insurance pays you back ten tokens, covering the seed cost. \
Either way, you get something back."

echo "✓ Done. Files in $OUT_DIR"
ls -la "$OUT_DIR"

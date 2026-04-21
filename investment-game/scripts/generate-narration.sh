#!/usr/bin/env bash
# Generate narration MP3s for the 10 instruction + insurance videos, any language.
#
# Narration text is loaded from:
#   scripts/narration-texts/<LANG_CODE>.json
#
# Two backends:
#   BACKEND=say         (default)  macOS `say` + ffmpeg. Free, offline, robotic. EN only.
#   BACKEND=elevenlabs             High-quality neural TTS. Needs API key. Any language.
#
# Usage examples:
#   ./scripts/generate-narration.sh                                      # EN, say
#   BACKEND=elevenlabs ./scripts/generate-narration.sh                   # EN, ElevenLabs
#   LANG_CODE=lg BACKEND=elevenlabs ./scripts/generate-narration.sh      # Luganda, ElevenLabs
#
# Secrets: set ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID in .env.local (gitignored).
# For per-language voice override, set ELEVENLABS_VOICE_ID_<LANG_UPPER>. See .env.example.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEXTS_DIR="$PROJECT_ROOT/scripts/narration-texts"

# Load secrets from .env.local if present (gitignored). Never echo their values.
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a
  # shellcheck disable=SC1090,SC1091
  . "$PROJECT_ROOT/.env.local"
  set +a
fi

LANG_CODE="${LANG_CODE:-en}"
OUT_DIR="$PROJECT_ROOT/public/audio/$LANG_CODE/videos"
TEXTS_FILE="$TEXTS_DIR/$LANG_CODE.json"

command -v jq >/dev/null || { echo "jq is required"; exit 1; }

if [ ! -f "$TEXTS_FILE" ]; then
  cat <<EOF >&2
⚠️  No narration text file found for LANG_CODE=$LANG_CODE

Expected: $TEXTS_FILE

To add a new language:
  1. cp $TEXTS_DIR/en.json $TEXTS_FILE
  2. Commission native-speaker translations (see docs/project/TRANSLATION_TODO.md)
  3. Replace each scene's text with the translation, removing [NEEDS_TRANSLATION] markers
  4. Re-run this script

EOF
  exit 2
fi

# Refuse to generate audio for untranslated content — prevents shipping wrong-language MP3s.
UNTRANSLATED=$(jq -r 'to_entries[] | select(.key != "_meta") | select(.value | contains("[NEEDS_TRANSLATION]")) | .key' "$TEXTS_FILE")
if [ -n "$UNTRANSLATED" ]; then
  echo "✗ $TEXTS_FILE still contains [NEEDS_TRANSLATION] markers in these scenes:" >&2
  echo "$UNTRANSLATED" | sed 's/^/    /' >&2
  echo "" >&2
  echo "Refusing to generate audio — would ship English-in-$LANG_CODE-clothing." >&2
  echo "See docs/project/TRANSLATION_TODO.md for the translation workflow." >&2
  exit 3
fi

mkdir -p "$OUT_DIR"

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
  if [ "$LANG_CODE" != "en" ]; then
    echo "✗ BACKEND=say only supports English. Use BACKEND=elevenlabs for $LANG_CODE." >&2
    exit 1
  fi
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

# Iterate every non-_meta key in the texts file and generate audio.
SCENE_IDS=$(jq -r 'to_entries[] | select(.key != "_meta") | .key' "$TEXTS_FILE")
for id in $SCENE_IDS; do
  text=$(jq -r --arg k "$id" '.[$k]' "$TEXTS_FILE")
  gen "$id" "$text"
done

echo "✓ Done. Files in $OUT_DIR"
ls -la "$OUT_DIR"

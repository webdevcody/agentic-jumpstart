#!/usr/bin/env bash

set -euo pipefail

# ElevenLabs TTS notifier
# Requirements: curl, jq, and an audio player (afplay on macOS, or ffplay/mpg123/mpv)

# Usage:
#   # Option 1: Put credentials in a `.labs` file (KEY=VALUE lines) and just run:
#   #   ./ding.sh "Your message here"
#   # Option 2: Provide env vars explicitly:
#   #   ELEVENLABS_API_KEY=your_key ELEVENLABS_VOICE_ID=your_voice_id ./ding.sh "Your message here"
#
# Notes:
# - Set ELEVENLABS_VOICE_ID to a voice you've configured in ElevenLabs. Choose one whose style matches what you want.
# - The script will save a temporary MP3, play it, and then remove it.

# Attempt to source .labs for credentials (script dir, current dir, or $HOME)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LABS_CANDIDATES=(
  "$SCRIPT_DIR/.labs"
  ".labs"
  "$HOME/.labs"
)

for labs_file in "${LABS_CANDIDATES[@]}"; do
  if [[ -f "$labs_file" ]]; then
    # Temporarily relax nounset to avoid issues in env files using defaults
    set +u
    set -a
    # shellcheck disable=SC1090
    source "$labs_file"
    set +a
    set -u
    break
  fi
done

API_KEY="${ELEVENLABS_API_KEY:-}"
VOICE_ID="${ELEVENLABS_VOICE_ID:-}"
OPENAI_KEY="${OPENAI_API_KEY:-}"
OPENAI_MODEL="${OPENAI_MODEL:-gpt-4o-mini}"
MESSAGE="${1:-All tasks are complete. The work has finished.}"

# If OpenAI key is available, ask it to craft a short line in a warm, authoritative narrator voice
FINAL_MESSAGE="$MESSAGE"
if [[ -n "$OPENAI_KEY" ]]; then
  echo "Generating message via OpenAI..."
  OPENAI_BODY=$(jq -n \
    --arg model "$OPENAI_MODEL" \
    --arg base "$MESSAGE" \
    '{
      model: $model,
      messages: [
        {
          role: "system",
          content: "You are a concise writing assistant. Write in the most extreme brain rot Gen Z internet slang—think Skibidi, goofy ahh, sigma, rizz, NPC, and TikTok meme speak. Make it unhinged, absurd, and full of viral nonsense. Keep it to one or two wild sentences."
        },
        {
          role: "user",
          content: ("Rewrite this completion notice in that voice: " + $base)
        }
      ],
      temperature: 0.7,
      max_tokens: 120
    }')

  OPENAI_RESP=$(curl -sS -f -X POST "https://api.openai.com/v1/chat/completions" \
    -H "Authorization: Bearer ${OPENAI_KEY}" \
    -H "Content-Type: application/json" \
    --data "$OPENAI_BODY") || true

  if [[ -n "${OPENAI_RESP:-}" ]]; then
    CANDIDATE=$(printf '%s' "$OPENAI_RESP" | jq -r '.choices[0].message.content // empty')
    if [[ -n "$CANDIDATE" ]]; then
      FINAL_MESSAGE="$CANDIDATE"
    else
      echo "Warning: OpenAI returned an empty response; falling back to base message." >&2
    fi
  else
    echo "Warning: OpenAI request failed; falling back to base message." >&2
  fi
fi

if [[ -z "$API_KEY" || -z "$VOICE_ID" ]]; then
  echo "Error: ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set." >&2
  echo "Example: ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... ./ding.sh \"Build finished successfully\"" >&2
  exit 1
fi

for cmd in curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not installed." >&2
    exit 1
  fi
done

TMP_MP3="$(mktemp -t ding.XXXXXX).mp3"

# Prepare JSON using jq to safely handle arbitrary message text
JSON_BODY=$(jq -n --arg text "$FINAL_MESSAGE" '{
  text: $text,
  model_id: "eleven_multilingual_v2",
  voice_settings: {
    stability: 0.35,
    similarity_boost: 0.85,
    style: 0.60,
    use_speaker_boost: true
  }
}')

echo "Generating speech via ElevenLabs..."
if ! curl -sS -f -X POST "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128" \
  -H "xi-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$JSON_BODY" \
  -o "$TMP_MP3"; then
  echo "Error: ElevenLabs API request failed. Please check your API key, voice ID, and network connection." >&2
  rm -f "$TMP_MP3"
  exit 1
fi

play_audio() {
  local file="$1"
  if command -v afplay >/dev/null 2>&1; then
    afplay "$file"
  elif command -v ffplay >/dev/null 2>&1; then
    ffplay -autoexit -nodisp -loglevel error "$file" </dev/null >/dev/null 2>&1
  elif command -v mpg123 >/dev/null 2>&1; then
    mpg123 -q "$file"
  elif command -v mpv >/dev/null 2>&1; then
    mpv --really-quiet --no-video "$file" </dev/null >/dev/null 2>&1
  else
    return 1
  fi
}

echo "Playing audio..."
if ! play_audio "$TMP_MP3"; then
  echo "Warning: No suitable audio player found. Falling back to system TTS if available." >&2
  if command -v say >/dev/null 2>&1; then
    say "$MESSAGE"
  else
    echo "Error: Could not play audio. Please install 'ffplay' (ffmpeg), 'mpg123', or 'mpv'." >&2
    rm -f "$TMP_MP3"
    exit 1
  fi
fi

rm -f "$TMP_MP3"
echo "Done."

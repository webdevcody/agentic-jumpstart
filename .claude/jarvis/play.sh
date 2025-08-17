#!/usr/bin/env bash

set -euo pipefail

# Claude Code hook script that extracts original user prompt and outputs completion notification
# Extracts the first user prompt from the conversation and saves it to tmp.txt

# Attempt to source .labs for credentials (script dir, current dir, or $HOME)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LABS_CANDIDATES=(
  "$SCRIPT_DIR/.labs"
  ".labs"
  "$HOME/.labs"
)

for labs_file in "${LABS_CANDIDATES[@]}"; do
  if [[ -f "$labs_file" ]]; then
    set +u
    set -a
    # shellcheck disable=SC1090
    source "$labs_file"
    set +a
    set +u
    break
  fi
done

OPENAI_KEY="${OPENAI_API_KEY:-}"
OPENAI_MODEL="${OPENAI_MODEL:-gpt-4o-mini}"
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-}"
ELEVENLABS_VOICE_ID="${ELEVENLABS_VOICE_ID:-}"

# Read hook data from stdin
HOOK_DATA=""

if [[ ! -t 0 ]]; then
  # Read all stdin
  HOOK_DATA=$(cat)
fi

TRANSCRIPT_PATH=$(echo $HOOK_DATA | jq -r '.transcript_path')
TRANSCRIPT_DATA=$(cat $TRANSCRIPT_PATH)

PROMPT=$(jq -rc 'select(.type == "user" and (.parentUuid == null or .parentUuid == "null")) | .message.content' "$TRANSCRIPT_PATH" | head -n 1)

# Check if required commands are available
for cmd in curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not installed." >&2
    exit 1
  fi
done

# Convert PROMPT to a simple sentence using GPT-4
SIMPLE_MESSAGE="$PROMPT"
if [[ -n "$OPENAI_KEY" && -n "$PROMPT" ]]; then
  echo "Converting prompt to simple sentence via OpenAI..."
  OPENAI_BODY=$(jq -n \
    --arg model "$OPENAI_MODEL" \
    --arg prompt "$PROMPT" \
    '{
      model: $model,
      messages: [
        {
          role: "system",
          content: "Given a users prompt, pretend you need to give it a feature title or short 3-5 words to describe the work. Return only the title, nothing else."
        },
        {
          role: "user",
          content: ("Convert this prompt to a simple sentence: " + $prompt)
        }
      ],
      temperature: 0.3,
      max_tokens: 100
    }')

  OPENAI_RESP=$(curl -sS -f -X POST "https://api.openai.com/v1/chat/completions" \
    -H "Authorization: Bearer ${OPENAI_KEY}" \
    -H "Content-Type: application/json" \
    --data "$OPENAI_BODY") || true

  if [[ -n "${OPENAI_RESP:-}" ]]; then
    CANDIDATE=$(printf '%s' "$OPENAI_RESP" | jq -r '.choices[0].message.content // empty')
    if [[ -n "$CANDIDATE" ]]; then
      SIMPLE_MESSAGE="$CANDIDATE"
      echo "Converted to: $SIMPLE_MESSAGE"
    else
      echo "Warning: OpenAI returned an empty response; using original prompt." >&2
    fi
  else
    echo "Warning: OpenAI request failed; using original prompt." >&2
  fi
fi

# Play the message via ElevenLabs TTS if credentials are available
if [[ -n "$ELEVENLABS_API_KEY" && -n "$ELEVENLABS_VOICE_ID" ]]; then
  echo "Playing message via ElevenLabs TTS..."
  
  TMP_MP3="$(mktemp -t play.XXXXXX).mp3"
  
  # Prepare JSON using jq to safely handle arbitrary message text
  JSON_BODY=$(jq -n --arg text "An agent finished their work on $SIMPLE_MESSAGE" '{
    text: $text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.35,
      similarity_boost: 0.85,
      style: 0.60,
      use_speaker_boost: true
    }
  }')
  
  if curl -sS -f -X POST "https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128" \
    -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$JSON_BODY" \
    -o "$TMP_MP3"; then
    
    # Function to play audio with fallbacks
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
        say "$SIMPLE_MESSAGE"
      else
        echo "Error: Could not play audio. Please install 'ffplay' (ffmpeg), 'mpg123', or 'mpv'." >&2
      fi
    fi
    
    rm -f "$TMP_MP3"
  else
    echo "Error: ElevenLabs API request failed. Please check your API key, voice ID, and network connection." >&2
    rm -f "$TMP_MP3"
  fi
else
  echo "ElevenLabs credentials not found. Message saved to tmp.txt but not played."
  echo "To enable TTS, set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in your .labs file."
fi


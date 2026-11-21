#!/usr/bin/env bash
# Full pipeline: voiceover → cues → sound mix → frames → loudness-normalised MP4.
# Needs: node + playwright (preinstalled), ffmpeg, and a Python venv with kokoro + soundfile
#   (uv venv -p 3.12 .venv && uv pip install kokoro soundfile "misaki[en]")
# usage: ./build.sh [--skip-vo]      (VENV=/path/to/venv to override)
set -euo pipefail
cd "$(dirname "$0")"
VENV=${VENV:-/tmp/claude-0/tts/.venv}
# shellcheck disable=SC1091
. "$VENV/bin/activate"
mkdir -p build out
if [[ "${1:-}" != "--skip-vo" ]]; then
  HF_HUB_DISABLE_XET=1 python tts/make_vo.py script.json build
fi
node render.cjs --comp main --cues build/cues.json
python tts/mix.py build/vo.wav build/cues.json build/mix.wav
node render.cjs --comp main --audio build/mix.wav --out build/raw.mp4
ffmpeg -y -loglevel error -i build/raw.mp4 -c:v copy \
  -af loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000 -c:a aac -b:a 192k -movflags +faststart out/go-first.mp4
echo "done → out/go-first.mp4"

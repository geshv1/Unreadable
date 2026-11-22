#!/usr/bin/env bash
# Full pipeline: voiceover → cues → sound mix → frames → loudness-normalised MP4.
# Needs: node + playwright (preinstalled), ffmpeg, and a Python venv with kokoro + soundfile
#   (uv venv -p 3.12 .venv && uv pip install kokoro soundfile "misaki[en]")
# usage: ./build.sh [comp] [--skip-vo]        comp: main (Go First) | alone (Fifteen Minutes) | grip (Losing Grip) | tomorrow (Chapter One, 4:3) | smart (Four Strange Things, 4:3)
#        VENV=/path/to/venv to override the Python environment
set -euo pipefail
cd "$(dirname "$0")"
COMP=main
SKIP=0
for a in "$@"; do
  case "$a" in
    --skip-vo) SKIP=1 ;;
    *) COMP="$a" ;;
  esac
done
case "$COMP" in
  main)  SCRIPT=script.json;        NAME="";    OUT=out/go-first.mp4 ;;
  alone) SCRIPT=scripts/alone.json; NAME=alone; OUT=out/fifteen-minutes.mp4 ;;
  grip)  SCRIPT=scripts/grip.json;  NAME=grip;  OUT=out/losing-grip.mp4 ;;
  tomorrow) SCRIPT=scripts/tomorrow.json; NAME=tomorrow; OUT=out/chapter-one.mp4 ;;
  smart) SCRIPT=scripts/smart.json; NAME=smart; OUT=out/four-strange-things.mp4 ;;
  *)     SCRIPT=scripts/$COMP.json; NAME=$COMP; OUT=out/$COMP.mp4 ;;
esac
B=build/$COMP
VENV=${VENV:-/tmp/claude-0/tts/.venv}
# shellcheck disable=SC1091
. "$VENV/bin/activate"
mkdir -p "$B" out
if [[ $SKIP == 0 || ! -f $B/vo.wav ]]; then
  HF_HUB_DISABLE_XET=1 python tts/make_vo.py "$SCRIPT" "$B" $NAME
fi
node render.cjs --comp "$COMP" --cues "$B/cues.json"
python tts/mix.py "$B/vo.wav" "$B/cues.json" "$B/mix.wav"
node render.cjs --comp "$COMP" --audio "$B/mix.wav" --out "$B/raw.mp4"
ffmpeg -y -loglevel error -i "$B/raw.mp4" -c:v copy \
  -af loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "done → $OUT"

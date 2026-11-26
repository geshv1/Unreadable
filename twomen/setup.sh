#!/usr/bin/env bash
# One-time setup: Python env + the free Kokoro voice model (~350 MB). Needs python3 and ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
mkdir -p cache/models
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -s cache/models/kokoro-v1.0.onnx ] || curl -fL -o cache/models/kokoro-v1.0.onnx "$base/kokoro-v1.0.onnx"
[ -s cache/models/voices-v1.0.bin ] || curl -fL -o cache/models/voices-v1.0.bin "$base/voices-v1.0.bin"
command -v ffmpeg >/dev/null || { echo "ffmpeg is missing (apt-get install -y ffmpeg)"; exit 1; }
echo "Ready. Run: .venv/bin/python make.py episodes/ep01_insult.json"

# Free MakeHuman/MPFB2 human data (CC0): base body, skeleton, skin weights, body-shape + expression targets
if [ ! -s cache/mh/base.obj ]; then
  tmp=$(mktemp -d)
  git clone -q --depth 1 --filter=blob:none --no-checkout https://github.com/makehumancommunity/mpfb2.git "$tmp/mpfb2"
  (cd "$tmp/mpfb2" && git sparse-checkout init --no-cone && git sparse-checkout set \
    "src/mpfb/data/3dobjs/*" "src/mpfb/data/rigs/standard/*default*" \
    "src/mpfb/data/targets/macrodetails/*male-young*" "src/mpfb/data/targets/macrodetails/*-male-old*" \
    "src/mpfb/data/targets/macrodetails/proportions/male-young-averagemuscle-averageweight-idealproportions*" \
    "src/mpfb/data/targets/torso/*" "src/mpfb/data/targets/expression/units/caucasian/*" && git checkout -q)
  d="$tmp/mpfb2/src/mpfb/data"
  mkdir -p cache/mh/targets
  cp "$d/3dobjs/base.obj" "$d/rigs/standard/rig.default.json" "$d/rigs/standard/weights.default.json" cache/mh/
  cp "$d"/targets/macrodetails/*.target.gz "$d"/targets/macrodetails/proportions/*.target.gz \
     "$d"/targets/torso/*.target.gz "$d"/targets/expression/units/caucasian/*.target.gz cache/mh/targets/
  rm -rf "$tmp"
fi
command -v blender >/dev/null || echo "Blender is missing: apt-get install -y blender libegl1 libegl-mesa0 libgl1-mesa-dri"

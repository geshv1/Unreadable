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

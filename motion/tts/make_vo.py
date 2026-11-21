"""Synthesise the voiceover with Kokoro-82M (open source, Apache-2.0) and export per-word timings.

usage: HF_HUB_DISABLE_XET=1 python tts/make_vo.py [script.json] [out_dir] [name]
writes: out_dir/vo.wav and comps/timing.js (window.M.TIMING = {...}),
        or comps/timing-<name>.js (window.M.TIMINGS[name] = {...}) when a name is given
"""
import json, re, sys, pathlib
import numpy as np
import soundfile as sf
from kokoro import KPipeline

ROOT = pathlib.Path(__file__).resolve().parent.parent
script = json.loads((ROOT / (sys.argv[1] if len(sys.argv) > 1 else "script.json")).read_text())
out_dir = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else ROOT / "build")
out_dir.mkdir(parents=True, exist_ok=True)
SR = 24000
pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())


def trim(audio, thr=0.004):
    """cut leading/trailing silence, keep 40 ms of air"""
    idx = np.where(np.abs(audio) > thr)[0]
    if len(idx) == 0:
        return audio, 0.0
    a, b = max(0, idx[0] - int(0.04 * SR)), min(len(audio), idx[-1] + int(0.06 * SR))
    return audio[a:b], a / SR


chunks, lines, cursor = [np.zeros(int(script["preroll"] * SR), dtype=np.float32)], [], script["preroll"]
for ln in script["lines"]:
    gap = np.zeros(int(ln["gap"] * SR), dtype=np.float32)
    chunks.append(gap)
    cursor += ln["gap"]
    audio, toks, off = [], [], 0.0
    for r in pipe(ln["say"], voice=script["voice"], speed=script["speed"]):
        a = r.audio.numpy()
        for t in r.tokens:
            if t.start_ts is not None and norm(t.text):
                toks.append({"t": t.text, "s": off + t.start_ts, "e": off + (t.end_ts or t.start_ts)})
        audio.append(a)
        off += len(a) / SR
    audio, cut = trim(np.concatenate(audio))
    for t in toks:
        t["s"], t["e"] = round(cursor + max(0, t["s"] - cut), 3), round(cursor + max(0, t["e"] - cut), 3)
    # map display words onto spoken tokens
    shown = ln["show"].split()
    words, ti = [], 0
    for w in shown:
        target, acc, start = norm(w.replace("*", "")), "", None
        while ti < len(toks) and len(acc) < len(target):
            start = toks[ti]["s"] if start is None else start
            acc += norm(toks[ti]["t"])
            end = toks[ti]["e"]
            ti += 1
        if start is None:  # ran out of tokens: reuse last
            start = end = toks[-1]["e"]
        words.append({"w": w, "s": start, "e": end})
    dur = len(audio) / SR
    lines.append({"id": ln["id"], "start": round(cursor, 3), "end": round(cursor + dur, 3), "words": words})
    chunks.append(audio.astype(np.float32))
    cursor += dur
    print(f"{ln['id']:<11} {cursor - dur:6.2f} → {cursor:6.2f}  {[w['w'] + '@' + str(w['s']) for w in words]}")

chunks.append(np.zeros(int(script["tail"] * SR), dtype=np.float32))
vo = np.concatenate(chunks)
sf.write(out_dir / "vo.wav", vo, SR)
timing = {"duration": round(len(vo) / SR, 3), "voice": script["voice"], "lines": lines}
name = sys.argv[3] if len(sys.argv) > 3 else None
if name:
    (ROOT / "comps" / f"timing-{name}.js").write_text(
        "window.M.TIMINGS = window.M.TIMINGS || {};\nwindow.M.TIMINGS[%s] = " % json.dumps(name) + json.dumps(timing, indent=1) + ";\n"
    )
else:
    (ROOT / "comps" / "timing.js").write_text("window.M.TIMING = " + json.dumps(timing, indent=1) + ";\n")
print("duration", timing["duration"])

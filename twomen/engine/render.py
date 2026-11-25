"""Episode renderer: JSON config -> final.mp4 + CapCut kit + cover + post + credits + QC."""
import json
import math
import multiprocessing as mp
import shutil
import subprocess
import time
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

from . import sound, textcards, tts
from .common import FONTS, FPS, H, ROOT, SH, SR, SW, W
from .scenes import SCENES, SceneState

# ------------------------------------------------------------------ grading
GRADES = {
    "neutral": dict(gain=(1.00, 0.97, 0.93), sat=0.80, contrast=1.10, lift=(0.004, 0.004, 0.006), grain=3.5, vig=0.55),
    "man1": dict(gain=(1.20, 0.84, 0.70), sat=1.10, contrast=1.28, lift=(0.010, 0.0, 0.0), grain=5.0, vig=0.65),
    "man2": dict(gain=(0.80, 0.92, 1.10), sat=0.70, contrast=1.06, lift=(0.0, 0.006, 0.016), grain=3.5, vig=0.60),
    "black": None,
}
_VIG = {}


def _vignette(strength):
    if strength not in _VIG:
        yy, xx = np.mgrid[0:SH, 0:SW].astype(np.float32)
        d = (xx / SW - 0.5) ** 2 * 1.4 + (yy / SH - 0.5) ** 2
        _VIG[strength] = np.clip(1 - d * strength * 1.9, 0.15, 1)[..., None]
    return _VIG[strength]


def grade(img, g):
    img = img * np.array(g["gain"], np.float32)
    knee = 0.78
    img = np.where(img < knee, img, knee + (1 - knee) * np.tanh((img - knee) / (1 - knee)))
    lum = (img * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
    img = lum + (img - lum) * g["sat"]
    piv = 0.22
    img = piv + (img - piv) * g["contrast"]
    img = np.clip(img, 0, None) + np.array(g["lift"], np.float32)
    img = img * _vignette(g["vig"])
    return np.clip(img, 0, 1)


# ------------------------------------------------------------------ camera
def camera_affine(cam, t, dur, rng_ph, cut_idx=0):
    z0, z1 = cam.get("zoom", [1.0, 1.0])
    p = t / max(dur, 1e-6)
    p = p * p * (3 - 2 * p) if cam.get("ease", True) else p
    z = z0 + (z1 - z0) * p
    if cam.get("punch"):
        z *= 1.0 + cam["punch"] * (cut_idx % 2)
    dx, dy = cam.get("drift", [0.0, 0.0])
    ox, oy = dx * p * SW, dy * p * SH
    A = cam.get("shake", 0.0) / 2.0  # full-res px -> scene px
    rot = 0.0
    if A:
        f = (1.7, 3.9, 7.3)
        sx = sum(w * math.sin(2 * math.pi * fr * t + rng_ph[i]) for i, (w, fr) in enumerate(zip((0.6, 0.4, 0.3), f)))
        sy = sum(w * math.sin(2 * math.pi * fr * t + rng_ph[i + 3]) for i, (w, fr) in enumerate(zip((0.6, 0.4, 0.3), f)))
        ox += A * sx / 1.3
        oy += A * sy / 1.3
        rot = math.radians(0.35) * math.sin(2 * math.pi * 2.3 * t + rng_ph[6])
        z = max(z, 1.0 + 2.6 * A / SW * 2)
    s = (SW / W) / z
    c, sn = math.cos(rot), math.sin(rot)
    a, b = s * c, -s * sn
    d, e = s * sn, s * c
    cx, cy = SW / 2 + ox, SH / 2 + oy
    return (a, b, cx - a * W / 2 - b * H / 2, d, e, cy - d * W / 2 - e * H / 2)


# ------------------------------------------------------------------ ffmpeg helpers
def _writer(path, crf=20):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv",
           "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-maxrate", "8M", "-bufsize", "16M",
           "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-threads", "2", "-movflags", "+faststart", str(path)]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def _run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


# ------------------------------------------------------------------ timeline
def _layout(cfg, speed, gap_scale):
    v = cfg.get("voice", {})
    pace = cfg.get("pacing", {})
    default_gap = pace.get("default_gap", 0.35)
    t = pace.get("lead_in", 0.10)
    shots = []
    for si, shot in enumerate(cfg["shots"]):
        sh = {"index": si, "cfg": shot, "start": t if si else 0.0, "beats": []}
        if shot.get("scene") == "black" and not shot.get("beats"):
            t += shot.get("duration", 0.5)
        else:
            t += shot.get("silence_before", 0.0)
            for b in shot.get("beats", []):
                t += b.get("pre", 0.0) * gap_scale
                audio = tts.synth(b["vo"], v.get("voice", "am_onyx"), speed, v.get("lang", "en-us"))
                dur = len(audio) / SR
                sh["beats"].append({"cfg": b, "start": t, "end": t + dur, "audio": audio})
                t += dur + b.get("gap", default_gap) * gap_scale
            t += shot.get("tail", 0.0)
        sh["end"] = t
        shots.append(sh)
    return shots, t


def build_timeline(cfg, log=print):
    v = cfg.get("voice", {})
    pace = cfg.get("pacing", {})
    lo, hi = pace.get("target_seconds", [30.0, 35.0])
    lo_ok, hi_ok = lo + 0.4, hi - 0.4
    speed = float(v.get("speed", 0.9))
    gs = 1.0
    for _ in range(14):
        shots, total = _layout(cfg, speed, gs)
        log(f"  timing: speed {speed:.2f}, pauses x{gs:.2f} -> {total:.2f}s")
        if lo_ok <= total <= hi_ok or not pace.get("auto_fit", True):
            break
        if total > hi_ok:
            if gs > 0.6:
                gs = max(0.6, gs * 0.85)
            else:
                speed = min(1.2, speed + 0.04)
        else:
            if gs < 1.6:
                gs = min(1.6, gs * 1.15)
            else:
                speed = max(0.7, speed - 0.04)
    # snap shot boundaries to frames
    for sh in shots:
        sh["f0"] = int(round(sh["start"] * FPS))
        sh["f1"] = int(round(sh["end"] * FPS))
    total_frames = shots[-1]["f1"]
    return {"shots": shots, "total": total_frames / FPS, "frames": total_frames, "speed": speed, "gap_scale": gs}


def card_specs(tl, cfg):
    """Text card spans per shot (relative seconds): [(text, size, y, t_on, t_off, first)]."""
    style = cfg.get("text_style", {})
    out = []
    first_done = False
    for sh in tl["shots"]:
        dur = (sh["f1"] - sh["f0"]) / FPS
        s0 = sh["f0"] / FPS
        beats = [b for b in sh["beats"] if b["cfg"].get("text")]
        specs = []
        for i, b in enumerate(beats):
            on = max(0.0, b["start"] - s0 - 0.04)
            first = False
            if not first_done:
                on, first, first_done = 0.0, True, True
            off = (beats[i + 1]["start"] - s0 - 0.04) if i + 1 < len(beats) else dur
            specs.append({"text": b["cfg"]["text"], "size": b["cfg"].get("text_size", style.get("size", 112)),
                          "y": b["cfg"].get("text_y", sh["cfg"].get("text_y", style.get("y", 0.34))),
                          "font": style.get("font", "Montserrat-ExtraBold.ttf"),
                          "on": on, "off": off, "first": first})
        out.append(specs)
    return out


# ------------------------------------------------------------------ shot worker
def _render_shot(job):
    (idx, shot_cfg, nframes, beat_starts, specs, clean_path, final_path, anim, seed) = job
    grade_cfg = GRADES.get(shot_cfg.get("grade", "neutral"))
    scene_name = shot_cfg.get("scene", "black")
    dur = nframes / FPS
    params = dict(shot_cfg.get("params", {}))
    params["anim_speed"] = anim
    S = SceneState(params, {"dur": dur, "beats": beat_starts, "seed": seed})
    fn = SCENES[scene_name]
    cam = shot_cfg.get("camera", {})
    rng = np.random.default_rng(seed + 100)
    ph = rng.uniform(0, 2 * np.pi, 8)
    cards = [(textcards.Card(s["text"], s["font"], s["size"], s["y"]), s) for s in specs]
    cut_every = float(params.get("cut_every", 0) or 0)
    grain = None
    if grade_cfg:
        g = np.random.default_rng(seed).standard_normal((6, H, W)).astype(np.float32)
        g = (g + np.roll(g, 1, axis=2) + np.roll(g, 1, axis=1)) / 1.7  # slightly softer grain
        grain = (g * grade_cfg["grain"]).astype(np.int16)
    wc, wf = _writer(clean_path), _writer(final_path)
    dither = np.random.default_rng(seed + 7)
    for i in range(nframes):
        t = i / FPS
        if grade_cfg is None:
            frame = np.zeros((H, W, 3), np.uint8)
        else:
            img = fn(S, t)
            img = grade(img, grade_cfg)
            small = np.clip(img * 255 + dither.uniform(-0.5, 0.5, img.shape), 0, 255).astype(np.uint8)
            cut_idx = int(t / cut_every) if cut_every else 0
            aff = camera_affine(cam, t, dur, ph, cut_idx)
            big = Image.fromarray(small).transform((W, H), Image.AFFINE, aff, resample=Image.BICUBIC)
            frame = np.asarray(big, np.int16) + grain[(i // 2) % 6][..., None]
            frame = np.clip(frame, 0, 255).astype(np.uint8)
        wc.stdin.write(frame.tobytes())
        out = frame.copy()
        for card, s in cards:
            if s["on"] <= t < s["off"]:
                textcards.draw(out, card, t - s["on"], s["off"] - t, "pop", s["first"])
        wf.stdin.write(out.tobytes())
    for w_ in (wc, wf):
        w_.stdin.close()
        w_.wait()
    return idx


# ------------------------------------------------------------------ audio
def build_audio(tl, cfg):
    n = int(round(tl["total"] * SR))
    voice = np.zeros(n, np.float32)
    segs, whooshes, hits = [], [], []
    for sh in tl["shots"]:
        sc = sh["cfg"]
        s0, s1 = sh["f0"] / FPS, sh["f1"] / FPS
        section = sc.get("section", "neutral")
        mood = {"principle": "silent", "transition": "man1"}.get(section, section)
        cut_low = None
        for b in sh["beats"]:
            i0 = int(round(b["start"] * SR))
            a = b["audio"][: max(0, n - i0)]
            voice[i0:i0 + len(a)] += a
            if b["cfg"].get("drone") == "low" and cut_low is None:
                cut_low = b["start"] - 0.15
            if b["cfg"].get("bass_hit"):
                hits.append(b["start"] + 0.02)
        if cut_low is not None:
            segs += [(s0, cut_low, mood), (cut_low, s1, "low")]
        else:
            segs.append((s0, s1, mood))
        if sc.get("sfx") == "whoosh":
            whooshes.append((s0 + s1) / 2)
    voice = sound.polish_voice(voice)
    dr = sound.drone(n / SR, segs, seed=cfg.get("seed", 3))
    music = dr * sound.duck_gain(voice, cfg.get("audio", {}).get("duck_db", -9.0)) * \
        cfg.get("audio", {}).get("drone_level", 0.20)
    sfx = np.zeros(n, np.float32)
    wh = sound.whoosh()
    for c in whooshes:
        i0 = int((c - 0.55) * SR)
        seg = wh[max(0, -i0):]
        i0 = max(0, i0)
        sfx[i0:i0 + len(seg)] += seg[: n - i0] * cfg.get("audio", {}).get("whoosh_level", 0.45)
    bh = sound.bass_hit()
    for c in hits:
        i0 = int(c * SR)
        sfx[i0:i0 + len(bh)] += bh[: n - i0] * cfg.get("audio", {}).get("bass_level", 0.95)
    mix = voice + music + sfx
    meter_target = cfg.get("audio", {}).get("lufs", -14.0)
    pre = mix.copy()
    mix, lufs = sound.normalize(mix, meter_target)
    gain = float(np.max(np.abs(mix)) / (np.max(np.abs(pre)) + 1e-9))
    # stems for CapCut at roughly the same gain as the final mix
    gl = 10 ** ((meter_target - sound.pyln.Meter(SR).integrated_loudness(pre.astype(np.float64))) / 20)
    stems = {"voice": sound.limiter(voice * gl), "music": sound.limiter(music * gl),
             "whoosh": wh * 0.45 * gl, "bass_hit": bh * 0.95 * gl}
    return mix, lufs, stems, {"whooshes": whooshes, "hits": hits, "segments": segs}


# ------------------------------------------------------------------ deliverables
def _srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_srts(tl, specs, kit):
    lines, k = [], 1
    for sh, sp in zip(tl["shots"], specs):
        s0 = sh["f0"] / FPS
        for s in sp:
            txt = s["text"].replace("[", "").replace("]", "")
            lines += [str(k), f"{_srt_time(s0 + s['on'])} --> {_srt_time(s0 + s['off'])}", txt, ""]
            k += 1
    (kit / "captions.srt").write_text("\n".join(lines))
    lines, k = [], 1
    for sh in tl["shots"]:
        for b in sh["beats"]:
            lines += [str(k), f"{_srt_time(b['start'])} --> {_srt_time(b['end'])}", b["cfg"]["vo"], ""]
            k += 1
    (kit / "narration.srt").write_text("\n".join(lines))


def write_cover(cfg, tl, out):
    cv = cfg.get("cover", {})
    si = cv.get("shot", 0)
    sh = tl["shots"][si]
    sc = sh["cfg"]
    dur = (sh["f1"] - sh["f0"]) / FPS
    S = SceneState(dict(sc.get("params", {}), anim_speed=1.0),
                   {"dur": dur, "beats": [b["start"] - sh["start"] for b in sh["beats"]], "seed": 11})
    img = grade(SCENES[sc["scene"]](S, cv.get("t", 1.0)), GRADES[sc.get("grade", "neutral")])
    small = Image.fromarray((img * 255).astype(np.uint8))
    aff = camera_affine({"zoom": [cv.get("zoom", 1.06)] * 2}, 0, 1, np.zeros(8))
    frame = np.array(small.transform((W, H), Image.AFFINE, aff, resample=Image.BICUBIC))
    for line in cv.get("text", []):
        card = textcards.Card(line["text"], size=line.get("size", 150), y=line.get("y", 0.30),
                              max_lines=line.get("max_lines", 3))
        textcards.draw(frame, card, 1.0, 1.0, "fade", True)
    Image.fromarray(frame).save(out, quality=93)


def write_post(cfg, out):
    p = cfg.get("post", {})
    tags = " ".join(p.get("hashtags", []))
    out.write_text(
        f"CAPTION\n{p.get('caption', 'Which one are you?')}\n\n{tags}\n\n"
        f"PINNED COMMENT\n{p.get('pinned_comment', 'Man 1 or man 2? Be honest.')}\n")


def write_credits(cfg, out):
    v = cfg.get("voice", {})
    out.write_text(
        f"{cfg.get('title', '')} - credits\n\n"
        "FOOTAGE\nNo stock footage and no movie/TV clips. Every image is generated by this pipeline\n"
        "(procedural silhouettes, light and fog), so there is nothing to credit or license.\n\n"
        f"VOICE\nKokoro-82M text-to-speech (open source, Apache-2.0), voice '{v.get('voice', 'am_onyx')}'.\n"
        "https://huggingface.co/hexgrad/Kokoro-82M  - free for commercial use.\n\n"
        "MUSIC / SOUND EFFECTS\nDrone, whoosh and bass hit are synthesised by this pipeline (no samples).\n\n"
        "FONT\nMontserrat ExtraBold - SIL Open Font License 1.1 (assets/fonts/OFL-Montserrat.txt).\n")


def write_timeline_txt(tl, specs, info, kit, clip_names):
    rows = ["TIMELINE (seconds) - rebuild in CapCut: put clips in order, voice.mp3 and music.mp3",
            "at 0.00, sound effects at the times below, text from captions.srt.", ""]
    for sh, name in zip(tl["shots"], clip_names):
        rows.append(f"{sh['f0'] / FPS:6.2f}-{sh['f1'] / FPS:6.2f}  clip {name}")
    rows.append("")
    for c in info["whooshes"]:
        rows.append(f"{max(0, c - 0.55):6.2f}  sfx/whoosh.mp3")
    for c in info["hits"]:
        rows.append(f"{c:6.2f}  sfx/bass_hit.mp3  (on the last word)")
    rows += ["", "TEXT (red word in [brackets], everything else white, Montserrat ExtraBold, uppercase)"]
    for sh, sp in zip(tl["shots"], specs):
        for s in sp:
            rows.append(f"{sh['f0'] / FPS + s['on']:6.2f}-{sh['f0'] / FPS + s['off']:6.2f}  {s['text']}")
    (kit / "timeline.txt").write_text("\n".join(rows) + "\n")


def _mp3(x, path):
    tmp = path.with_suffix(".wav")
    sf.write(tmp, np.clip(x, -1, 1), SR, subtype="PCM_16")
    _run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-c:a", "libmp3lame", "-b:a", "192k", str(path)])
    tmp.unlink()


# ------------------------------------------------------------------ QC
def qc(final, tl, specs, info, outdir, log=print):
    qd = outdir / "qc"
    qd.mkdir(exist_ok=True)
    rep = []
    pr = json.loads(_run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(final)]).stdout)
    vs = [s for s in pr["streams"] if s["codec_type"] == "video"][0]
    aus = [s for s in pr["streams"] if s["codec_type"] == "audio"][0]
    dur = float(pr["format"]["duration"])
    fr = vs["r_frame_rate"]
    rep.append(f"duration {dur:.2f}s  (target 30-35)  {'OK' if 30 <= dur <= 35 else 'FAIL'}")
    rep.append(f"video {vs['codec_name']} {vs['width']}x{vs['height']} @ {fr}  "
               f"{'OK' if (vs['width'], vs['height'], fr, vs['codec_name']) == (W, H, f'{FPS}/1', 'h264') else 'FAIL'}")
    rep.append(f"audio {aus['codec_name']} {aus['sample_rate']} Hz {aus.get('channels')} ch  "
               f"{'OK' if aus['codec_name'] == 'aac' else 'FAIL'}")
    eb = subprocess.run(["ffmpeg", "-nostats", "-i", str(final), "-af", "ebur128=peak=true", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    summ = eb[eb.rfind("Summary:"):]
    I = float(summ.split("I:")[1].split("LUFS")[0])
    tp = float(summ.split("Peak:")[1].split("dBFS")[0])
    rep.append(f"loudness {I:.1f} LUFS (target -14)  true peak {tp:.1f} dBTP  "
               f"{'OK' if abs(I + 14) <= 1.0 and tp <= -0.5 else 'FAIL'}")
    # audio checks on the decoded final file
    wav = qd / "audio.wav"
    _run(["ffmpeg", "-v", "error", "-y", "-i", str(final), "-ac", "1", "-ar", str(SR), str(wav)])
    a, _ = sf.read(wav, dtype="float32")
    wav.unlink()
    for sh in tl["shots"]:
        if sh["cfg"].get("silence_before"):
            s0 = sh["f0"] / FPS
            s1 = sh["beats"][0]["start"] if sh["beats"] else s0 + sh["cfg"]["silence_before"]
            seg = a[int((s0 + 0.03) * SR):int((s1 - 0.03) * SR)]
            db = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-12) if len(seg) else 0
            rep.append(f"silence before principle {s0:.2f}-{s1:.2f}s: {s1 - s0:.2f}s at {db:.0f} dBFS  "
                       f"{'OK' if db < -60 and s1 - s0 >= 0.45 else 'FAIL'}")
    from scipy.signal import butter, sosfilt
    low = sosfilt(butter(4, 150, "low", fs=SR, output="sos"), a)
    for h in info["hits"]:
        pre = low[int((h - 0.35) * SR):int((h - 0.02) * SR)]
        post = low[int(h * SR):int((h + 0.35) * SR)]
        r = 10 * np.log10(((post ** 2).mean() + 1e-12) / ((pre ** 2).mean() + 1e-12))
        last_beat = [b for sh in tl["shots"] for b in sh["beats"] if b["cfg"].get("bass_hit")][0]
        lvl = 10 * np.log10((post ** 2).mean() + 1e-12)
        rep.append(f"bass hit at {h:.2f}s on '{last_beat['cfg']['vo']}' (word starts {last_beat['start']:.2f}s): "
                   f"sub-150 Hz level {lvl:.0f} dBFS, {min(r, 60):.0f}+ dB above the silence before  "
                   f"{'OK' if r > 10 and lvl > -30 else 'FAIL'}")
    # frames: first frame + middle of every beat / shot
    times = [("first frame", 0.0)]
    for sh in tl["shots"]:
        label = sh["cfg"].get("name", sh["cfg"].get("scene"))
        if sh["beats"]:
            for b in sh["beats"]:
                times.append((f"{label}: {b['cfg']['vo'][:28]}", min((b["start"] + b["end"]) / 2, tl["total"] - 0.05)))
        else:
            times.append((label, (sh["f0"] + sh["f1"]) / 2 / FPS))
    thumbs = []
    for k, (lab, t) in enumerate(times):
        p = qd / f"{k:02d}.png"
        _run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(final), "-frames:v", "1", str(p)])
        thumbs.append((lab, t, p))
    first = np.asarray(Image.open(thumbs[0][2]).convert("L"), np.float32)
    rep.append(f"first frame mean brightness {first.mean():.0f}/255  {'OK (not black)' if first.mean() > 12 else 'FAIL'}")
    bad = [s["text"] for sp in specs for s in sp if not textcards.Card(s["text"], s["font"], s["size"], s["y"]).safe()]
    rep.append(f"text inside safe zone: {'OK' if not bad else 'FAIL ' + str(bad)}")
    # contact sheet with safe-zone guides
    tw, th = 216, 384
    cols = 6
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * (tw + 8), rows * (th + 40)), (30, 30, 30))
    d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype(str(FONTS / "Montserrat-ExtraBold.ttf"), 13)
    for k, (lab, t, p) in enumerate(thumbs):
        im = Image.open(p).convert("RGB").resize((tw, th))
        x, y = (k % cols) * (tw + 8), (k // cols) * (th + 40)
        sheet.paste(im, (x, y))
        d.line([(x, y + int(th * 0.8)), (x + tw, y + int(th * 0.8))], fill=(0, 255, 0))
        d.line([(x + int(tw * 0.85), y), (x + int(tw * 0.85), y + th)], fill=(0, 255, 0))
        d.text((x + 2, y + th + 3), f"{t:5.2f}s {lab}"[:34], font=f, fill=(220, 220, 220))
    sheet.save(qd / "contact_sheet.jpg", quality=88)
    for _, _, p in thumbs:
        p.unlink()
    (qd / "report.txt").write_text("\n".join(rep) + "\n")
    for r in rep:
        log("  " + r)
    return rep


# ------------------------------------------------------------------ main
def make(config_path, out_root=None, workers=4, log=print):
    t_start = time.time()
    config_path = Path(config_path)
    cfg = json.loads(config_path.read_text())
    slug = cfg.get("slug", config_path.stem)
    outdir = Path(out_root or ROOT / "output") / slug
    work = ROOT / "cache" / "work" / slug
    for d in (outdir, work):
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True)
    kit = outdir / "capcut_kit"
    (kit / "clips").mkdir(parents=True)
    (kit / "sfx").mkdir()
    log(f"[1/5] voice + timing for '{cfg.get('title', slug)}'")
    tl = build_timeline(cfg, log)
    specs = card_specs(tl, cfg)
    log(f"      {tl['total']:.2f}s, {tl['frames']} frames, {len(tl['shots'])} shots")

    log("[2/5] audio: drone, whoosh, bass hit, ducking, -14 LUFS")
    mix, lufs, stems, info = build_audio(tl, cfg)
    sf.write(work / "mix.wav", mix, SR, subtype="PCM_24")

    log(f"[3/5] rendering {len(tl['shots'])} shots on {workers} cores")
    jobs, clip_names = [], []
    for sh, sp in zip(tl["shots"], specs):
        sc = sh["cfg"]
        name = f"{sh['index'] + 1:02d}_{sc.get('name', sc.get('scene'))}.mp4"
        clip_names.append(name)
        n = sh["f1"] - sh["f0"]
        beat_starts = [b["start"] - sh["f0"] / FPS for b in sh["beats"]]
        jobs.append((sh["index"], sc, n, beat_starts, sp, kit / "clips" / name, work / f"seg_{sh['index']:02d}.mp4",
                     float(sc.get("slowmo", 1.0)), 1000 + sh["index"] * 17))
    jobs.sort(key=lambda j: -j[2])
    with mp.get_context("fork").Pool(workers) as pool:
        for idx in pool.imap_unordered(_render_shot, jobs):
            log(f"      shot {idx + 1} done")

    log("[4/5] assembling final.mp4")
    lst = work / "segments.txt"
    lst.write_text("".join(f"file '{work / f'seg_{i:02d}.mp4'}'\n" for i in range(len(tl["shots"]))))
    _run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(work / "video.mp4")])
    final = outdir / "final.mp4"
    _run(["ffmpeg", "-v", "error", "-y", "-i", str(work / "video.mp4"), "-i", str(work / "mix.wav"),
          "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
          "-t", f"{tl['frames'] / FPS:.3f}", "-movflags", "+faststart", str(final)])

    log("[5/5] CapCut kit, cover, post, credits, quality check")
    _mp3(stems["voice"], kit / "voice.mp3")
    _mp3(stems["music"], kit / "music.mp3")
    _mp3(stems["whoosh"], kit / "sfx" / "whoosh.mp3")
    _mp3(stems["bass_hit"], kit / "sfx" / "bass_hit.mp3")
    write_srts(tl, specs, kit)
    write_timeline_txt(tl, specs, info, kit, clip_names)
    write_cover(cfg, tl, outdir / "cover.jpg")
    write_post(cfg, outdir / "post.txt")
    write_credits(cfg, outdir / "credits.txt")
    rep = qc(final, tl, specs, info, outdir, log)
    log(f"done in {time.time() - t_start:.0f}s -> {outdir}")
    return outdir, rep

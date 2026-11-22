"""Mix an episode's sound-effect cues onto the rendered (silent) video.

    python3 video/sfx/mix.py video/out/<title>-timeline.json

Reads the timeline written by render.cjs (scene times + resolved sfx cues from episode.js), synthesises each
effect (synth.py), places it at its time with gain (dB) and pan, soft-limits the mix, and writes:
    out/<title>-sfx.wav          (stem, 48 kHz stereo, for CapCut)
    out/<title>-sfx.mp4          (video copied + AAC audio)
    out/<title>-sfx-cues.txt     (cue sheet)
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import synth  # noqa: E402

SR = synth.SR


def main(tl_path):
    tl = json.load(open(tl_path))
    out_dir = os.path.dirname(os.path.abspath(tl_path))
    title = tl['title']
    dur = tl['duration']
    mix = np.zeros((int(round(dur * SR)) + SR, 2))
    cache = {}
    lines = []
    for c in sorted(tl['sfx'], key=lambda c: c['t']):
        kw = dict(c.get('args') or {})
        if 'pan' in c and c['id'] not in ('whoosh', 'notify', 'bell', 'city', 'tick'):
            kw['pan'] = c['pan']
        key = (c['id'], json.dumps(kw, sort_keys=True))
        if key not in cache:
            cache[key] = synth.LIB[c['id']](**kw).astype(np.float64)
        s = cache[key] * (10 ** (c.get('gain', 0) / 20))
        i = int(round(c['t'] * SR))
        if i < 0:
            s, i = s[-i:], 0
        n = min(len(s), len(mix) - i)
        mix[i:i + n] += s[:n]
        lines.append(f"{c['t']:6.2f}s  frame {round(c['t'] * tl['fps']):3d}  {c['id']:<11} {c.get('gain', 0):+5.1f} dB  {c.get('note', '')}")
    mix = mix[: int(round(dur * SR))]
    # soft limiter -> peak about -1 dBFS
    peak = np.abs(mix).max() + 1e-9
    mix = mix / peak * 1.25
    mix = np.tanh(mix) / np.tanh(1.25) * 0.89
    # tail fade on the last 0.25 s so the video ends cleanly
    k = int(0.25 * SR)
    mix[-k:] *= np.linspace(1, 0, k)[:, None]

    wav = os.path.join(out_dir, f'{title}-sfx.wav')
    pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

    src = os.path.join(out_dir, f'{title}.mp4')
    dst = os.path.join(out_dir, f'{title}-sfx.mp4')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', dst], check=True)
    sheet = os.path.join(out_dir, f'{title}-sfx-cues.txt')
    with open(sheet, 'w') as f:
        f.write(f'{title} — sound-effect cues ({len(lines)})\n\n' + '\n'.join(lines) + '\n')
    print('\n'.join(lines))
    print('wrote', wav, dst, sheet, sep='\n')


if __name__ == '__main__':
    main(sys.argv[1])

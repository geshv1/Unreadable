# "Same age. Same city." — video renderer

Canvas renderer for the REACTIVE vs STEADY series. Same rig, palettes and type as `fighters.svg` / the site
(Instrument Serif italic + Archivo, near-black stage, red + white spotlights, reflective grid floor).

```
node video/render.cjs ep02-control                  # -> video/out/<title>.mp4, <title>-frame0.png, <title>-cuts.txt
node video/render.cjs ep02-control --stills 0,4.2   # PNG stills only (seconds), for checking
node video/render.cjs ep02-control --stills 3 --debug   # stills with TikTok safe zones overlaid
node video/render.cjs ep02-control --sections [--debug] # frame 0 + one frame per scene -> out/sections/
```
Preview in a browser: open `video/engine/index.html?ep=ep02-control&play` (or `&t=12.5` for one frame).
Output: 1080x1920, 30 fps, H.264 High, yuv420p, no audio.

## New episode
1. Copy `episodes/ep02-control/` to `episodes/ep03-whatever/`.
2. `episode.js`: episode number, title, and the scene list: `dur`, `set`, `action`, `top`, `headline`, `red`, `sub`.
3. `actions.js`: one function per scene action, `(tl, scene) => ({ figs, back, mid, front, shake })`.
   Build characters with `V.R()` (Reactive, left), `V.St()` (Steady, right), `V.X()` (third figure);
   poses in `engine/rig.js` (`V.POSES`, `V.poseAt`, `V.walkPose`, `V.breathe`); props in `engine/props.js`.
   Generic actions (`idle`, `endCard`) live in `engine/actions-common.js`.
4. Backgrounds: `engine/sets.js` (stage, street, room, office, table, ring). Add new ones there.

The text system, spotlights (they follow each character's x), labels, swipe transitions and the cut list are automatic.

## Next episode
The brief for Pt. 3 ("Same day. Different control.", one continuous day with CONTROL meters) is saved in
`briefs/ep03-same-day.md`, with notes on the engine changes it needs. Not built yet.

## Sound effects
`video/sfx/synth.py` synthesises every effect in code (no samples, no licences): whooshes, punches, shoulder
bumps, the leash igniting and yanking, phone chime + buzz, typing, message sends, scanner, DATA beep,
NO DATA glitch, wall clock, sneaker hops and squeaks, ring bell, street bed. Cues live in the episode
config (`sfx`, `sfxCut`), relative to their scene, so retiming a scene keeps its sounds in sync.
A full render mixes them automatically into `out/<title>-sfx.mp4` (+ `-sfx.wav` stem and `-sfx-cues.txt`).
The silent `out/<title>.mp4` is still written. Remix only: `node video/render.cjs <ep> --timeline && python3 video/sfx/mix.py video/out/<title>-timeline.json`.
Needs `pip install numpy scipy`.

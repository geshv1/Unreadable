# SAVED BRIEF — "Same day. Different control." (part number to be decided)

Status: SAVED, NOT BUILT. Pt. 3 became "Different discipline." (episodes/ep03-discipline) at the owner's request;
this brief is kept for a later part. Its text still says PT. 3 — change the top line to the real part number when building. The owner asked for this to be kept for the next episode
(do not apply it to ep02). When building it: a new episode folder, reuse the engine,
and follow every rule below. Owner's words: "I want perfection."

Notes for the implementation (from the ep02 build):
- Engine changes needed: optional stars/grid (brief wants flat bg, no grid, no stars), CONTROL meter component,
  per-scene spotlight intensity/warmth, slow (non-swipe) transition into the quiet moment, lying-down pose (bed),
  face-palm pose, breath (chest rise) pose, leash snap/dissolve effect, scanner "tap and shake", coffee cup prop,
  laptop prop for Steady, safe-box debug overlay at x 150–930 / y 320–1420, per-section PNG export.
- Character height ~400px (ep02 used ~538px) -> lower V.S and move floor so labels sit in y 1310–1400.
- Extra figures: charcoal #2A2A33, thin light-grey outline, no face, smaller and behind.

---

The brief as the owner wrote it:

I'm making an animated TikTok series called "SAME AGE. SAME CITY." (account @GESHV1). Two stick-figure characters, REACTIVE and STEADY, live through the SAME situations and make different choices. Remake the existing episode "reactive-vs-steady-control.mp4" (the 4 rules: leash, feint/phone, data/scanner, silence) as ONE continuous story: a single day, tracked by a live CONTROL meter. Details below.

GOAL: viewers see themselves in Reactive, feel something, laugh once or twice, learn one concrete habit, and act on the call to action.
TONE: minimalist, precise, professional, emotional, a little dry humor, and a quiet work ethic. Never preachy, never mocking Reactive.

If the project/code from the previous version exists, REUSE the characters, rigs, fonts, colors and render pipeline. Keep the visual identity, but apply every fix below.

=== OUTPUT SPECS ===
- 1080x1920 (9:16), 30 fps, H.264 MP4, 31–32 seconds
- Export without music. Also give me a list of timestamps for sound cues (every scene cut, every CONTROL drop, the quiet moment, the leash snapping, the CTA).
- Export frame 0 and one frame from every section as PNGs.

=== LAYOUT: TIKTOK-SAFE CENTERED GRID (STRICT) ===
TikTok's UI covers the top, the right side buttons and the bottom caption. So:
- ALL content (text, characters, props, meters, bubbles, notifications) must stay inside the SAFE BOX: x = 150 to 930, y = 320 to 1420. Nothing may touch or cross its edges. (The previous version had bubbles cut off at the left edge; this must not happen.)
- Outside the safe box: only background and soft spotlight glow.
- Everything is centered on x = 540. Reactive is centered at about x 345, Steady at about x 735.
- Fixed vertical zones (same positions in every scene):
  - TEXT ZONE (y 340–620): top line (time stamp) at about y 370, headline at about y 430–560 (max 2 lines, max about 20 characters per line), subline at about y 595.
  - METER ZONE (y 650–770): the CONTROL meters.
  - ACTION ZONE (y 790–1290): characters, props, bubbles.
  - LABEL ZONE (y 1310–1400): REACTIVE / STEADY labels.

=== NON-NEGOTIABLE RULES ===
1. FRAME 0 IS FULLY VISIBLE: headline, both characters, spotlights, meters and labels. No black frame, no fade-in.
2. Text pops in fast (max 0.2s). No slow word-by-word reveals.
3. MINIMALISM: max on screen at once = 1 headline + 1 subline, 2 meters, 2 main characters, 1 extra figure, 1 prop per character, max 3 bubbles in total. Nothing else.
4. Minimum text sizes: headline 88px, subline 38px, meter numbers 72px bold, labels 38px, bubbles and notifications 42px. Bubbles max 4 words. (The previous version's sublines, notifications, scanner labels and bubble pile were too small; fix all of them.)
5. Characters about 400px tall. Hold every important moment at least 1 second so it can be read.
6. Extra figures (stranger, boss, texter) must NOT blend in with Reactive: solid dark charcoal body (#2A2A33) with a thin light-grey outline, no face details, no spotlight. Keep them smaller and slightly behind the main characters.

=== CHARACTERS ===
- REACTIVE: grey hoodie body, red cap, white round head. Likable and relatable. His reactions are what real people do. The humor is in recognizing ourselves, never in mocking him.
- STEADY: white body, black spiky hair, white round head. Calm, quiet, not arrogant. WORK ETHIC: whenever he isn't reacting, he's quietly doing something productive (laptop open, training, reading). He never talks much.

=== VISUAL STYLE (MINIMAL) ===
- Background: flat near-black (#0B0B0F), very subtle floor reflection. No grid, no star particles, no detailed environments.
- Spotlights: red cone (#E0344A) over Reactive, white/grey cone over Steady, in every scene. As Reactive's CONTROL drops, his spotlight gets dimmer. Steady's stays steady and gets slightly warmer toward the end.
- Location = ONE simple white line-art prop or silhouette per scene (street lamp, phone, desk, ring ropes, bed). No full rooms.
- CONTROL METER: above each character in the METER ZONE, a thin horizontal bar (about 260px wide) with a bold number above it ("CONTROL 100%"). Reactive's is red, Steady's is white. When it drops, the bar shrinks with a quick tick and the number counts down.
- Text system: top line = spaced uppercase sans-serif with thin lines on each side (— 8:12 AM —). Headline = elegant italic serif, white, ONE key word in red. Subline = light-grey sans-serif.
- Bubbles: rounded, dark fill, thin red outline (Reactive) or white outline (Steady/others), inside the ACTION ZONE, never stacked more than 3.

=== TIMELINE ===

0.0–1.5s | HOOK
Top line: "SAME AGE. SAME CITY. — PT. 3". Headline: "Same day. / Different control." (red: "control."). Both characters in spotlights, both meters at "CONTROL 100%", labels visible.

1.5–6.0s | "— 8:12 AM —" STREET (prop: street lamp)
Headline: "Emotion is a leash." (red: "leash.") Subline: "Whoever pulls it, leads you."
- A stranger with a coffee bumps into both of them.
- Reactive: a glowing red LEASH appears on his neck, the stranger's movement yanks him forward, bubble "SAY THAT AGAIN?!" Meter 100 → 78%.
- HUMOR: the stranger doesn't even notice, sips his coffee and walks off. Reactive is left yelling at nobody.
- Steady: a small nod, keeps walking. Meter stays 100%.

6.0–10.5s | "— 1:40 PM —" PHONE (prop: phone)
Headline: "A feint is a question." (red: "question.") Subline: "The reactive man always answers."
- Both get the same big notification: "we need to talk 😐".
- Reactive: types fast, bubbles appear one at a time (max 3): "what??" → "what did I do" → "ANSWER ME". Meter 78 → 52%.
- HUMOR: the reply arrives: "lol about the trip". Reactive slowly lowers his phone and face-palms.
- Steady: reads it, puts the phone face down, keeps typing on his laptop. Meter stays 100%.

10.5–15.0s | "— 4:05 PM —" WORK (prop: desk)
Headline: "Your reaction is their data." (red: "data.") Subline: "Give them nothing to read."
- A boss figure points a red scanner beam at both.
- Reactive: his face flashes red (blush) and a small panel above him fills: "DATA ✓". Meter 52 → 31%.
- Steady: keeps working, his face stays neutral, and his panel glitches: "NO DATA". HUMOR: the boss taps the scanner and shakes it like it's broken.

15.0–19.0s | "— 9:30 PM —" SPARRING (prop: ring ropes)
Headline: "Silence is pressure." (red: "pressure.") Subline: "Let them fill it. Then watch."
- Reactive is drained and throws wild punches. Each one shows a small "MISS" (3 times). Meter 31 → 8%.
- Steady stays silent and patient, slips, then lands ONE clean punch. Reactive stumbles.

19.0–23.0s | "— 11:48 PM —" THE QUIET MOMENT (prop: bed)
No headline, just the time stamp. Slow, calm, emotional.
- Reactive lies awake on his bed staring up, red spotlight very dim, meter "CONTROL 8%". One thought bubble: "should've said…" (dry humor with real pain behind it: he's still replaying the 8:12 AM stranger).
- Steady is asleep, warm soft light, meter "CONTROL 100%".
Hold this moment. Slow the animation down.

23.0–25.5s | THE LESSON (stage, no props, no meters)
Headline: "Stay unreadable." (red: "unreadable.")
Subline: "Next trigger: one breath before you react."

25.5–28.5s | THE HOPE: CALLBACK (prop: street lamp)
Top line: "— NEXT DAY. 8:12 AM —"
- The same stranger with coffee bumps Reactive again. The red leash starts to appear… Reactive pauses, takes one visible breath (his chest rises), and the leash SNAPS and dissolves.
- His meter ticks UP: "CONTROL 9%". His red spotlight warms slightly.
- HUMOR: the stranger looks back, confused that nothing happened.
- Subline: "Day one."

28.5–31.5s | CALL TO ACTION
Both characters side by side in spotlights, no meters.
Headline: "Which one are you?" (red: "you?")
Subline: "Free 2-min fighter quiz — link in bio."
Small: "@GESHV1". Hold for the full 3 seconds.

Transitions: fast cuts or quick swipes (max 0.3s). The only slow transition is into the quiet moment.

=== FINAL CHECK BEFORE YOU FINISH ===
- Render frame 0 and one frame from every section, and draw the safe box (x 150–930, y 320–1420) as a debug overlay on copies. Confirm that ALL text, bubbles, notifications, meters, props and characters are fully inside. Fix anything outside.
- Frame 0 is not black and shows the headline, both characters, the meters and the labels.
- No frame exceeds the element limits in rule 3, and all minimum text sizes are met.
- Extra figures are clearly distinguishable from Reactive.
- The meters animate at every drop and end at Reactive 8% → 9% and Steady 100%.
- Total length is 31–32s at 1080x1920, 30 fps.

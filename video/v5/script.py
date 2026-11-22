"""Video 5 ("The Pause"): 4:3 ultra-minimal, illustrated figures.
Each line shows a title block; entries map words to the voice in order
(o = overline, t = title, s = sub). A third item "static" shows a label that
is not spoken (appears with the scene)."""
LINES = [
    dict(voice="Seven seconds.", show=[("o", "THE PAUSE", "static"), ("t", "SEVEN SECONDS.")]),
    dict(voice="That's how long he let the silence sit.", show=[("s", "that's how long he let"), ("t", "THE SILENCE SIT.")]),
    dict(voice="The other man broke first, and lowered his own price.",
         show=[("s", "the other man"), ("t", "BROKE FIRST,"), ("s", "and lowered his own price.")]),
    dict(voice="Most people can't hold a pause. They explain. They justify. They negotiate against themselves.",
         show=[("s", "most people can't hold a pause."), ("o", "THEY EXPLAIN. THEY JUSTIFY."),
               ("t", "THEY NEGOTIATE"), ("t", "AGAINST THEMSELVES.")]),
    dict(voice="Silence is pressure you never have to push.", show=[("t", "SILENCE IS PRESSURE"), ("s", "you never have to push.")]),
    dict(voice="He learned it at five in the morning, on the bar, when every rep begged him to let go.",
         show=[("o", "HE LEARNED IT AT"), ("t", "5 IN THE MORNING,"), ("s", "on the bar, when every rep"),
               ("s", "begged him to let go.")]),
    dict(voice="Discomfort, held calmly, becomes leverage.",
         show=[("s", "discomfort, held calmly,"), ("o", "BECOMES"), ("t", "LEVERAGE.")]),
    dict(voice="Train the body to hold. The mind learns to wait.",
         show=[("s", "train the body"), ("t", "TO HOLD."), ("s", "the mind learns"), ("t", "TO WAIT.")]),
    dict(voice="And whoever can wait, owns the room.", show=[("s", "and whoever can wait,"), ("t", "OWNS THE ROOM.")]),
    dict(voice="The Complete Fighter. Link in bio.", show=[("o", "THE COMPLETE"), ("t", "FIGHTER"), ("s", "link in bio")]),
]
GAPS = [0.7, 0.6, 0.65, 0.65, 0.75, 0.6, 0.65, 0.65, 0.8]

"""Video 6 ("The Pause", v2): stronger hook, faster narration, more varied animation.
Entries: (tier, text) or (tier, text, opts) with opts "static" or {"at": [voice word index per display word]}."""
LINES = [
    dict(voice="Seven seconds of silence. Seventy thousand dollars.",
         show=[("t", "SEVEN SECONDS"), ("s", "of silence."), ("t", "$70,000.", {"at": [4]})]),
    dict(voice="That's what it cost the man across the table.",
         show=[("s", "that's what it cost"), ("t", "THE MAN ACROSS"), ("t", "THE TABLE.")]),
    dict(voice="He made an offer. Then he waited.", show=[("s", "he made an offer."), ("t", "THEN HE WAITED.")]),
    dict(voice="No smile. No nod. Nothing.", show=[("t", "NO SMILE."), ("t", "NO NOD."), ("t", "NOTHING.")]),
    dict(voice="Most people can't survive a pause. They explain. They justify. They lower their own price.",
         show=[("s", "most people can't survive a pause."), ("o", "THEY EXPLAIN. THEY JUSTIFY."),
               ("t", "THEY LOWER"), ("t", "THEIR OWN PRICE.")]),
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
GAPS = [0.45, 0.35, 0.35, 0.4, 0.45, 0.45, 0.35, 0.4, 0.45, 0.55]

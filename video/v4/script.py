"""Video 4 ("Quiet power"): 4:3 ultra-minimal. Each line shows a small text block:
words map one-to-one to the voice, styled by tier: o = overline, t = title, s = sub."""
LINES = [
    dict(voice="Five rules of quiet power.", show=[("o", "FIVE RULES OF"), ("t", "QUIET POWER")]),
    dict(voice="Rule one. Say less than you know.", show=[("o", "RULE ONE"), ("t", "SAY LESS"), ("s", "than you know")]),
    dict(voice="Rule two. Don't react. Respond.", show=[("o", "RULE TWO"), ("s", "don't react."), ("t", "RESPOND.")]),
    dict(voice="Rule three. Master your body. Train every day.",
         show=[("o", "RULE THREE"), ("t", "MASTER YOUR BODY"), ("s", "train every day")]),
    dict(voice="Rule four. Move in silence.", show=[("o", "RULE FOUR"), ("t", "MOVE IN SILENCE")]),
    dict(voice="Rule five. Let them underestimate you.", show=[("o", "RULE FIVE"), ("s", "let them"), ("t", "UNDERESTIMATE YOU")]),
    dict(voice="Calm mind. Strong body. Quiet power.", show=[("t", "CALM MIND."), ("t", "STRONG BODY."), ("t", "QUIET POWER.")]),
    dict(voice="The Complete Fighter. Link in bio.", show=[("o", "THE COMPLETE"), ("t", "FIGHTER"), ("s", "link in bio")]),
]
GAPS = [0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.8]

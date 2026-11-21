"""Video 2 ("The calm one"): script, caption chunks and key words.

Each line: voice text, and on-screen caption chunks (2-4 words). Caption words map
one-to-one onto voice words unless `map` gives the voice-word index for each.
A trailing * marks the red key word.
"""
LINES = [
    dict(voice="The calm one always wins.", show=[["THE", "CALM*", "ONE"], ["ALWAYS", "WINS."]]),
    dict(voice="He doesn't shout.", show=[["HE", "DOESN'T", "SHOUT.*"]]),
    dict(voice="He doesn't chase.", show=[["HE", "DOESN'T", "CHASE.*"]]),
    dict(voice="Pressure hits. He doesn't move.", show=[["PRESSURE", "HITS."], ["HE", "DOESN'T", "MOVE.*"]]),
    dict(voice="That's not talent. It's training.", show=[["THAT'S", "NOT", "TALENT."], ["IT'S", "TRAINING.*"]]),
    dict(voice="Every round makes fear smaller.", show=[["EVERY", "ROUND"], ["MAKES", "FEAR*", "SMALLER."]]),
    dict(voice="Every rep builds control.", show=[["EVERY", "REP"], ["BUILDS", "CONTROL.*"]]),
    dict(voice="People feel it.", show=[["PEOPLE", "FEEL*", "IT."]]),
    dict(voice="Calm is power.", show=[["CALM", "IS", "POWER.*"]]),
    dict(voice="Control yourself. Control the room.", show=[["CONTROL", "YOURSELF.*"], ["CONTROL", "THE", "ROOM.*"]]),
    dict(voice="I built a system for this.", show=[["I", "BUILT", "A", "SYSTEM*"], ["FOR", "THIS."]]),
    dict(voice="The Complete Fighter. Mind. Fight. Body.", show=[["THE", "COMPLETE", "FIGHTER.*"], ["MIND.", "FIGHT.", "BODY."]]),
    dict(voice="Nineteen euros. Link in bio.", show=[["€19*"], ["LINK", "IN", "BIO.*"]], map=[0, 2, 3, 4]),
]
GAPS = [0.55, 0.35, 0.45, 0.45, 0.5, 0.4, 0.5, 0.35, 0.5, 0.6, 0.55, 0.6]   # silence after each line

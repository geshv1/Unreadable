"""Video 3 ("Your enemy is you"): script, caption chunks and key words (* = red key word)."""
LINES = [
    dict(voice="Your enemy is you.", show=[["YOUR", "ENEMY"], ["IS", "YOU.*"]]),
    dict(voice="Not the opponent.", show=[["NOT", "THE", "OPPONENT.*"]]),
    dict(voice="The voice in your head.", show=[["THE", "VOICE*"], ["IN", "YOUR", "HEAD."]]),
    dict(voice="It says stop.", show=[["IT", "SAYS", "STOP.*"]]),
    dict(voice="It says you'll fail.", show=[["IT", "SAYS"], ["YOU'LL", "FAIL.*"]]),
    dict(voice="So fail. Then go again.", show=[["SO", "FAIL."], ["THEN", "GO", "AGAIN.*"]]),
    dict(voice="Pain is not the enemy.", show=[["PAIN*", "IS", "NOT"], ["THE", "ENEMY."]]),
    dict(voice="Pain is the teacher.", show=[["PAIN", "IS"], ["THE", "TEACHER.*"]]),
    dict(voice="Every fall makes you harder.", show=[["EVERY", "FALL"], ["MAKES", "YOU", "HARDER.*"]]),
    dict(voice="Fear gets quiet when you move.", show=[["FEAR", "GETS", "QUIET"], ["WHEN", "YOU", "MOVE.*"]]),
    dict(voice="Beat yourself, and you beat everything.", show=[["BEAT", "YOURSELF,*"], ["AND", "YOU", "BEAT"], ["EVERYTHING.*"]]),
    dict(voice="The Complete Fighter. Mind. Fight. Body.", show=[["THE", "COMPLETE", "FIGHTER.*"], ["MIND.", "FIGHT.", "BODY."]]),
    dict(voice="Start now. Link in bio.", show=[["START", "NOW.*"], ["LINK", "IN", "BIO.*"]]),
]
GAPS = [0.5, 0.45, 0.4, 0.4, 0.55, 0.5, 0.4, 0.5, 0.5, 0.55, 0.6, 0.6]

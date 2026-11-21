"""Embed images as data URIs (file:// images would taint the canvas and block frame export)."""
import base64, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
b = base64.b64encode((ROOT.parent / "cover.jpg").read_bytes()).decode()
(ROOT / "comps" / "assets.js").write_text(
    "// generated from ../cover.jpg by: python3 tts/make_assets.py\nwindow.M.ASSETS = { cover: \"data:image/jpeg;base64," + b + "\" };\n"
)

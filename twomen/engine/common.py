from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W, H, FPS = 1080, 1920, 30
SW, SH = 540, 960          # resolution the scenes are painted at (upscaled by the camera)
SS = 2                     # supersampling for silhouette edges
SR = 48000                 # audio sample rate
FONTS = ROOT / "assets" / "fonts"
CACHE = ROOT / "cache"
RED = (200, 16, 46)        # #C8102E
WHITE = (255, 255, 255)

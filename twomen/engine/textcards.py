"""On-screen text cards: bold uppercase white, one key word in red, pop/fade animation.

Text in [brackets] is the red accent. Cards are laid out inside the TikTok safe zone:
never in the bottom 20 % or the right-hand 15 % of the frame.
"""
import re

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .common import FONTS, H, RED, W, WHITE

SAFE_LEFT = int(W * 0.07)
SAFE_RIGHT = int(W * 0.85)   # right 15 % is TikTok's button column
SAFE_TOP = int(H * 0.08)
SAFE_BOTTOM = int(H * 0.80)  # bottom 20 % is caption/username
CENTER_X = (SAFE_LEFT + SAFE_RIGHT) // 2
MAX_W = SAFE_RIGHT - SAFE_LEFT - 40


def parse(text):
    """'ONE LOSES [EVERYTHING]' -> [('ONE', False), ('LOSES', False), ('EVERYTHING', True)]"""
    words = []
    for part in re.split(r"(\[[^\]]*\])", text):
        if not part:
            continue
        accent = part.startswith("[")
        for w in part.strip("[]").split():
            if w == "|":
                words.append((w, False))
            elif words and re.fullmatch(r"[.,!?:;…\"'”’]+", w):
                prev, acc = words[-1]
                words[-1] = (prev + w, acc)
            else:
                words.append((w.upper(), accent))
    return words


def _layout(words, font, max_w, space):
    lines, cur, cur_w = [], [], 0
    for w, acc in words:
        if w == "|":  # forced line break
            if cur:
                lines.append(cur)
            cur, cur_w = [], 0
            continue
        ww = font.getlength(w)
        add = ww if not cur else cur_w + space + ww
        if cur and add > max_w:
            lines.append(cur)
            cur, cur_w = [(w, acc, ww)], ww
        else:
            cur.append((w, acc, ww))
            cur_w = add
    if cur:
        lines.append(cur)
    return lines


class Card:
    """A pre-rendered text card (RGBA, full-res pixels) with its on-screen position."""

    def __init__(self, text, font_file="Montserrat-ExtraBold.ttf", size=112, y=0.34, max_lines=2, box=False):
        words = parse(text)
        font_path = str(FONTS / font_file)
        while True:
            font = ImageFont.truetype(font_path, size)
            space = font.getlength(" ") * 1.05
            lines = _layout(words, font, MAX_W, space)
            widest = max(sum(w for _, _, w in ln) + space * (len(ln) - 1) for ln in lines)
            if (len(lines) <= max_lines and widest <= MAX_W) or size <= 40:
                break
            size -= 4
        asc, desc = font.getmetrics()
        line_h = int((asc + desc) * 1.02)
        pad = int(size * 0.6)
        bw = int(widest) + pad * 2
        bh = line_h * len(lines) + pad * 2
        txt = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        d = ImageDraw.Draw(txt)
        y0 = pad
        for ln in lines:
            lw = sum(w for _, _, w in ln) + space * (len(ln) - 1)
            x = (bw - lw) / 2
            for w, acc, ww in ln:
                d.text((x, y0), w, font=font, fill=(RED if acc else WHITE) + (255,))
                x += ww + space
            y0 += line_h
        # soft shadow + faint scrim so text stays readable over bright light
        alpha = txt.split()[3]
        shadow = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(size * 0.10)).point(lambda v: int(v * 0.85)))
        scrim = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        scrim.putalpha(alpha.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(size * 0.35))
                      .point(lambda v: int(min(185, v * 2.2))))
        img = Image.alpha_composite(scrim, shadow)
        img.alpha_composite(Image.new("RGBA", (bw, bh), (0, 0, 0, 0)), (0, 0))
        offset = max(2, size // 28)
        shifted = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        shifted.alpha_composite(shadow, (0, offset))
        img = Image.alpha_composite(img, shifted)
        if box:  # solid dark plate for busy/red backgrounds
            plate = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
            ImageDraw.Draw(plate).rounded_rectangle([pad * 0.45, pad * 0.55, bw - pad * 0.45, bh - pad * 0.55],
                                                    radius=int(size * 0.25), fill=(0, 0, 0, 165))
            img = Image.alpha_composite(img, plate)
        img = Image.alpha_composite(img, txt)
        self.img = img
        self.text = text
        self.size = size
        self.lines = len(lines)
        cy = int(H * y)
        self.cx = CENTER_X
        self.cy = min(max(cy, SAFE_TOP + bh // 2), SAFE_BOTTOM - bh // 2)
        # glyph box (without padding) for the safe-zone check
        self.box = (self.cx - widest / 2, self.cy - line_h * len(lines) / 2,
                    self.cx + widest / 2, self.cy + line_h * len(lines) / 2)
        self.arr = np.asarray(img, np.float32) / 255.0

    def safe(self):
        x0, y0, x1, y1 = self.box
        return x0 >= 0 and x1 <= SAFE_RIGHT and y0 >= 0 and y1 <= SAFE_BOTTOM


def _ease_out_back(x):
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def draw(frame, card, t_in, t_out, style="pop", first=False):
    """Composite `card` onto a uint8 HxWx3 frame. t_in: seconds since the card appeared,
    t_out: seconds until it disappears."""
    if style == "pop":
        a_in = 1.0 if first else min(1.0, t_in / 0.09)
        k = min(1.0, t_in / 0.20)
        scale = 1.0 + 0.16 * (1 - _ease_out_back(k)) if not first else 1.0
        scale = max(0.92, scale)
    else:
        a_in = 1.0 if first else min(1.0, t_in / 0.25)
        scale = 1.0
    a_out = min(1.0, max(0.0, t_out / 0.10))
    alpha = a_in * a_out
    if alpha <= 0:
        return frame
    arr = card.arr
    if abs(scale - 1.0) > 0.004:
        im = card.img.resize((max(1, int(card.img.width * scale)), max(1, int(card.img.height * scale))),
                             Image.BILINEAR)
        arr = np.asarray(im, np.float32) / 255.0
    h, w = arr.shape[:2]
    x0, y0 = int(card.cx - w / 2), int(card.cy - h / 2)
    xa, ya, xb, yb = max(x0, 0), max(y0, 0), min(x0 + w, W), min(y0 + h, H)
    sub = arr[ya - y0:yb - y0, xa - x0:xb - x0]
    a = sub[..., 3:4] * alpha
    region = frame[ya:yb, xa:xb].astype(np.float32)
    frame[ya:yb, xa:xb] = (region * (1 - a) + sub[..., :3] * 255.0 * a).astype(np.uint8)
    return frame

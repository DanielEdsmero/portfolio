"""Generates assets/mango.png: 8 pixel-art monkey frames, 24x24 each, in one row.
Frames: 0 idle A, 1 idle B, 2 blink, 3 talk, 4 talk B, 5 swing A, 6 swing B (whee), 7 land squash."""
from PIL import Image

S = 24
FUR, FUR_D, SKIN, EAR_IN = "#a8743f", "#85562c", "#f0d3a8", "#dba67c"
EYE, MOUTH, PINK, OUT = "#2a1a10", "#5a1e1e", "#e8837f", "#3b2412"


def blank():
    return {}


def px(g, x, y, c):
    if 0 <= x < S and 0 <= y < S:
        g[(x, y)] = c


def ell(g, cx, cy, rx, ry, c):
    for y in range(S):
        for x in range(S):
            if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1:
                px(g, x, y, c)


def line(g, x0, y0, x1, y1, c, w=2):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(n + 1):
        x = round(x0 + (x1 - x0) * i / n)
        y = round(y0 + (y1 - y0) * i / n)
        for k in range(w):
            px(g, x + k, y, c)


TAILS = {
    "a": [(7, 19), (6, 20), (5, 20), (4, 19), (3, 18), (3, 17), (4, 16)],
    "b": [(7, 19), (6, 20), (5, 21), (4, 21), (3, 20), (2, 19), (2, 18)],
    "up": [(7, 17), (6, 16), (5, 15), (5, 14), (4, 13), (4, 12), (5, 11)],
}


def monkey(arm_up=False, tail="a", eyes="open", mouth="closed", squash=0, tuck=False):
    g = blank()
    for x, y in TAILS[tail]:
        px(g, x, y, FUR_D); px(g, x, y + 1, FUR_D)
    top = 1 if squash else 0
    # legs and feet
    fy = 21 if tuck else 22
    ell(g, 9, fy, 2.4, 1.6, FUR_D); ell(g, 15, fy, 2.4, 1.6, FUR_D)
    # body
    ell(g, 12, 17 + squash * .5, 4.6 + squash, 5 - squash, FUR)
    ell(g, 12, 18 + squash * .5, 2.8 + squash * .5, 3.2 - squash, SKIN)
    # arms
    if arm_up:
        line(g, 17, 14, 19, 2, FUR, 2)
        for x in range(18, 21):
            for y in range(0, 3):
                px(g, x, y, SKIN)
        line(g, 8, 14, 6, 19, FUR, 2)
    else:
        line(g, 7, 14, 5, 20 - top, FUR, 2)
        line(g, 16, 14, 18, 20 - top, FUR, 2)
        for x0 in (5, 18):
            px(g, x0, 20 - top, SKIN); px(g, x0 + 1, 20 - top, SKIN)
    # ears + head
    h = top
    ell(g, 5.8, 9 + h, 2.3, 2.3, FUR); ell(g, 18.2, 9 + h, 2.3, 2.3, FUR)
    px(g, 5, 9 + h, EAR_IN); px(g, 6, 9 + h, EAR_IN); px(g, 17, 9 + h, EAR_IN); px(g, 18, 9 + h, EAR_IN)
    ell(g, 12, 9 + h, 5.2, 5.2, FUR)
    ell(g, 12, 10.6 + h, 3.6, 3.1, SKIN)
    ell(g, 9.2, 8 + h, 1.7, 1.5, SKIN); ell(g, 14.8, 8 + h, 1.7, 1.5, SKIN)
    # eyes
    ey = 9 + h
    if eyes == "open":
        px(g, 10, ey, EYE); px(g, 10, ey + 1, EYE); px(g, 13, ey, EYE); px(g, 13, ey + 1, EYE)
    else:
        px(g, 9, ey + 1, EYE); px(g, 10, ey + 1, EYE); px(g, 13, ey + 1, EYE); px(g, 14, ey + 1, EYE)
    # mouth
    my = 12 + h
    if mouth == "closed":
        px(g, 11, my, MOUTH); px(g, 12, my, MOUTH)
    else:
        for x in (10, 11, 12, 13):
            px(g, x, my, MOUTH); px(g, x, my + 1, MOUTH)
        px(g, 11, my + 1, PINK); px(g, 12, my + 1, PINK)
    # shading on right side of fur
    for (x, y), c in list(g.items()):
        if c == FUR and x >= 15 and y > 12:
            g[(x, y)] = FUR_D
    # outline
    out = dict(g)
    for (x, y) in g:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n not in g and 0 <= n[0] < S and 0 <= n[1] < S:
                out[n] = OUT
    return out


frames = [
    monkey(tail="a"),
    monkey(tail="b"),
    monkey(tail="a", eyes="blink"),
    monkey(tail="a", mouth="open"),
    monkey(tail="b", mouth="open"),
    monkey(arm_up=True, tail="up", tuck=True),
    monkey(arm_up=True, tail="b", tuck=True, mouth="open"),
    monkey(tail="a", squash=1),
]
sheet = Image.new("RGBA", (S * len(frames), S), (0, 0, 0, 0))
for i, g in enumerate(frames):
    for (x, y), c in g.items():
        sheet.putpixel((i * S + x, y), tuple(int(c[j:j + 2], 16) for j in (1, 3, 5)) + (255,))
sheet.save("assets/mango.png")
sheet.resize((sheet.width * 8, sheet.height * 8), Image.NEAREST).save("/tmp/claude-0/-home-user/f130a9cb-9277-5413-b91b-65168a3efe60/scratchpad/mango_preview.png")

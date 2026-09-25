# images-b-prep, part C: oven control panel (arc scale, vector digits), needle, glow, temp buttons, start button, logo.
# Run: python tools/gen_prep_c.py [names...]   (writes into images-b-prep/ only)
import math, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prepkit import *  # noqa: F401,F403

OV, OV_D, OV_DD, OV_L = gen_kitchen.OV, gen_kitchen.OV_D, gen_kitchen.OV_DD, gen_kitchen.OV_L
CHROME, CHROME_D, CHROME_L = gen_kitchen.CHROME, gen_kitchen.CHROME_D, gen_kitchen.CHROME_L
BLUE, BLUE_D, BLUE_L = "#5BA8D8", "#3F7FB0", "#A3D3EF"
INK = "#4A2A1C"

# ---- oven panel geometry (panel + needle share viewBox 0 0 1100 720) ----
PW, PH = 1200, 720
PC = (600, 540)                  # rotation centre of the needle (= centre of the arc scale)
VALUES = (50, 100, 150, 200, 250)
ANGLES = {50: -80, 100: -40, 150: 0, 200: 40, 250: 80}   # degrees, clockwise from straight up (needle art points up = 150)
R_DIGIT, R_BAND = 380, (212, 266)
DIGIT_H = 112

# ---- vector glyphs: open stroke paths in a 100-high box (y 0..100), with advance widths ----
GLYPH = {
    "0": ("M23,8 A19,42 0 1 1 22.9,8Z", 46),
    "1": ("M4,24 L22,8 L22,92", 30),
    "2": ("M5,28 C6,6 44,4 44,30 C44,52 22,66 5,92 L47,92", 50),
    "5": ("M44,8 L12,8 L9,46 C20,38 46,38 46,66 C46,96 18,100 5,86", 50),
}


def number(txt, cx, cy, h, col, w=20, gap=12, shadow=None):
    """Draw a number centred at (cx,cy), glyph height h, as round-capped strokes."""
    s = h / 100
    total = sum(GLYPH[c][1] for c in txt) + gap * (len(txt) - 1)
    x = cx - total * s / 2
    g = ""
    for c in txt:
        d, adv = GLYPH[c]
        t = f'transform="translate({n(x)} {n(cy - h / 2)}) scale({s:.3f})"'
        if shadow:
            g += f'<path d="{d}" fill="none" stroke="{shadow}" stroke-width="{w + 7}" stroke-linecap="round" stroke-linejoin="round" {t[:-1]} translate(1.5 2.5)"/>'
        g += f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {t}/>'
        x += (adv + gap) * s
    return g


def digit_centre(v, clear=310):
    """Each number sits on its own radius so its box stays outside r=clear (the ticks end at 294)."""
    txt = str(v)
    hw = (sum(GLYPH[c][1] for c in txt) + 12 * (len(txt) - 1)) * DIGIT_H / 100 / 2 + 11
    hh = DIGIT_H / 2 + 11
    a = math.radians(ANGLES[v])
    return polar_pt(ANGLES[v], clear + hw * abs(math.sin(a)) + hh * abs(math.cos(a)))


def polar_pt(a_deg, r, c=PC):
    a = math.radians(a_deg - 90)
    return (c[0] + math.cos(a) * r, c[1] + math.sin(a) * r)


def sector(a0, a1, r0, r1, col, extra=""):
    p0, p1, q1, q0 = polar_pt(a0, r1), polar_pt(a1, r1), polar_pt(a1, r0), polar_pt(a0, r0)
    return P(f"M{n(p0[0])},{n(p0[1])} A{r1},{r1} 0 0 1 {n(p1[0])},{n(p1[1])} L{n(q1[0])},{n(q1[1])} A{r0},{r0} 0 0 0 {n(q0[0])},{n(q0[1])}Z", col, extra)


def ramp(t):
    """blue (cool, low) -> teal -> yellow -> orange -> red (hot, high)."""
    stops = [(0, BLUE), (.25, "#7CC4C2"), (.5, "#FFD152"), (.75, CORAL), (1, RED)]
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t <= t1:
            return mix(c0, c1, (t - t0) / (t1 - t0))
    return RED


def flame(cx, cy, s, outer, inner, core=None):
    d = "M0,-86 C40,-48 62,-14 56,26 C50,62 26,80 0,80 C-26,80 -50,62 -56,30 C-62,-2 -42,-24 -28,-42 C-26,-20 -18,-8 -8,-4 C-14,-32 -12,-60 0,-86Z"
    g = P(d, outer, f' transform="translate({n(cx)} {n(cy)}) scale({s})"')
    g += P(d, inner, f' transform="translate({n(cx)} {n(cy + 22 * s)}) scale({s * .58})"')
    if core:
        g += P(d, core, f' transform="translate({n(cx)} {n(cy + 40 * s)}) scale({s * .28})"')
    return g


def drop(cx, cy, s, col, light):
    d = "M0,-60 C18,-30 40,-6 40,20 C40,44 22,60 0,60 C-22,60 -40,44 -40,20 C-40,-6 -18,-30 0,-60Z"
    return P(d, col, f' transform="translate({n(cx)} {n(cy)}) scale({s})"') + E(cx - 14 * s, cy + 14 * s, 8 * s, 13 * s, light, ' opacity="0.9"')


def oven_panel():
    p = "op-"
    L = [G(E(PC[0], 700, PW / 2 - 50, 16, SH, ' opacity="0.3"'), p + "bl")]
    L.append(G(P(wrect(10, 12, PW - 20, 690, 84, 1.4, 1, 60), OV_D), p + "cut"))
    L.append(G(P(wrect(18, 10, PW - 36, 674, 78, 1.4, 2, 60), OV), p + "sh"))
    L.append(P(wrect(30, 90, 18, 520, 9, .8, 3), OV_L, ' opacity="0.7"') + P(wrect(PW - 48, 90, 18, 520, 9, .8, 4), OV_D, ' opacity="0.6"'))
    L.append(G(P(wrect(58, 52, PW - 116, 604, 56, 1.2, 5, 60), CREAM2), p + "sh"))
    L.append(P(wrect(64, 56, PW - 128, 590, 52, 1, 6, 60), CREAM))
    for x, y in ((104, 96), (PW - 104, 96), (104, 612), (PW - 104, 612)):                                     # chrome screws
        L.append(G(C(x, y, 13, CHROME_D) + C(x, y - 1.5, 10.5, CHROME) + P(wrect(x - 7, y - 3, 14, 4, 2, .2, int(x)), CHROME_D), p + "sh"))
    # colour band (cool blue at 50 -> hot red at 250), in 24 overlapping paper segments
    band = ""
    a0, a1, N = -90, 90, 26
    for i in range(N):
        s0 = a0 + (a1 - a0) * i / N; s1 = a0 + (a1 - a0) * (i + 1) / N + .6
        band += sector(s0, s1, *R_BAND, ramp(i / (N - 1)))
    L.append(G(band, p + "cut"))
    L.append(sector(a0 + 1, a1 - 1, R_BAND[1] - 12, R_BAND[1] - 4, WHITE, ' opacity="0.35"'))
    # ticks at the five values, small ticks between
    tk = ""
    for v, a in ANGLES.items():
        q0, q1 = polar_pt(a, 274), polar_pt(a, 294)
        tk += stroke(f"M{n(q0[0])},{n(q0[1])} L{n(q1[0])},{n(q1[1])}", INK, 12)
    for a in (-60, -20, 20, 60):
        q0, q1 = polar_pt(a, 278), polar_pt(a, 292)
        tk += stroke(f"M{n(q0[0])},{n(q0[1])} L{n(q1[0])},{n(q1[1])}", mix(INK, CREAM, .45), 7)
    L.append(G(tk, p + "sh"))
    # the five numbers (big vector digits)
    dg = ""
    for v, a in ANGLES.items():
        cx, cy = digit_centre(v)
        dg += number(str(v), cx, cy, DIGIT_H, INK, w=21)
    L.append(G(dg, p + "sh"))
    # cold / hot icons at the ends of the band
    bx, by = polar_pt(-112, 238)
    hx, hy = polar_pt(112, 238)
    L.append(G(drop(bx, by, .62, BLUE, BLUE_L) + flame(hx, hy, .44, RED, CHEESE), p + "sh"))
    # hub socket (the needle file draws the cap on top)
    L.append(G(C(*PC, 58, CREAM2) + C(PC[0], PC[1] - 2, 52, mix(CREAM2, OV, .15)), p + "sh"))
    return doc(p, PW, PH, "".join(L), material="default", seed=161, sh=(4, 3.5, .33))


def oven_needle():
    p = "on-"
    cx, cy = PC
    tip = cy - 244
    needle = P(f"M{cx - 20},{cy} L{cx - 5},{tip + 14} Q{cx},{tip} {cx + 5},{tip + 14} L{cx + 20},{cy} Q{cx},{cy + 64} {cx - 20},{cy}Z", RED_D)
    L = [G(needle, p + "cut")]
    L.append(P(f"M{cx - 9},{cy - 20} L{cx - 3},{tip + 30} Q{cx - 1},{tip + 22} {cx + 1},{tip + 30} L{cx - 1},{cy - 20}Z", RED_L, ' opacity="0.9"'))
    L.append(G(C(cx, cy, 44, CHROME_D) + C(cx, cy - 3, 40, CHROME) + P(wob(cx - 10, cy - 18, 20, 11, .06, 3, 12, -30), CHROME_L, ' opacity="0.85"')
               + C(cx, cy, 16, RED_D) + C(cx - 3, cy - 3, 6, RED_L), p + "sh"))
    return doc(p, PW, PH, "".join(L), material="default", seed=163, sh=(4, 3.5, .33))


GLOW_W, GLOW_H = 400, 280


def temp_glow():
    """Soft golden halo around a selected number (400x280, centre 200,140). The middle (ellipse ~150x96) is clear,
    so it can sit behind a separate digit OR on top of the panel's printed digit without washing it out."""
    p = "tg-"
    grad = (f'<radialGradient id="{p}g" cx="200" cy="140" r="196" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 140) scale(1 .68) translate(0 -140)">'
            f'<stop offset="0.5" stop-color="{CHEESE_L}" stop-opacity="0"/><stop offset="0.62" stop-color="{CHEESE_L}" stop-opacity="0.95"/>'
            f'<stop offset="0.76" stop-color="{CHEESE}" stop-opacity="0.8"/><stop offset="1" stop-color="{CORAL}" stop-opacity="0"/></radialGradient>')
    L = [E(200, 140, 196, 134, f"url(#{p}g)")]
    rays = ""
    for i in range(14):
        a = i / 14 * 2 * math.pi
        q0 = (200 + math.cos(a) * 158, 140 + math.sin(a) * 108)
        q1 = (200 + math.cos(a) * 190, 140 + math.sin(a) * 130)
        rays += stroke(f"M{n(q0[0])},{n(q0[1])} L{n(q1[0])},{n(q1[1])}", CHEESE, 11, ' opacity="0.9"')
    L.append(G(rays, p + "sh"))
    return doc(p, GLOW_W, GLOW_H, "".join(L), material="smooth", seed=165, sh=(2, 2, .2), extra_defs=grad)


def arrow_btn(up):
    p = "bu-" if up else "bd-"
    pts = [(120, 50), (180, 112), (144, 112), (144, 176), (96, 176), (96, 112), (60, 112)]
    if not up:
        pts = [(x, 226 - y) for x, y in pts]
    ic = G(P(rpoly(pts, 10), CREAM), p + "sh2")
    if up:
        return gen_kitchen.button(p, RED_D, mix(RED, CORAL, .35), CORAL_L, ic, 171)
    return gen_kitchen.button(p, BLUE_D, BLUE, BLUE_L, ic, 181)


def oven_start(on):
    p = "so-" if on else "sf-"
    c = (160, 154)
    L = []
    defs = ""
    if on:
        defs = (f'<radialGradient id="{p}h" cx="160" cy="154" r="158" gradientUnits="userSpaceOnUse">'
                f'<stop offset="0.6" stop-color="{CHEESE}" stop-opacity="0.85"/><stop offset="0.8" stop-color="{CORAL}" stop-opacity="0.4"/>'
                f'<stop offset="1" stop-color="{CORAL}" stop-opacity="0"/></radialGradient>')
        L.append(C(*c, 158, f"url(#{p}h)"))
    L.append(ground_shadow(160, 290, 112, 8, p, .35))
    rim, face, light = (OV_D, mix(ORANGE if False else CORAL, CHEESE, .35), CHEESE_L) if on else (mix(METAL_D, OV_D, .25), mix(CREAM2, METAL, .45), CREAM)
    L.append(G(P(wob(*c, 128, 127, .008, 3, 32), rim), p + "cut"))
    L.append(G(P(wob(c[0], c[1] - 5, 110, 109, .01, 4, 32), face), p + "sh"))
    L.append(P(wob(c[0] - 6, c[1] - 16, 84, 76, .04, 5, 24), light, f' opacity="{.6 if on else .45}"'))
    L.append(P("M62,130 Q76,72 134,50 Q96,80 84,134Z", WHITE, ' opacity="0.4"'))
    if on:
        L.append(G(flame(160, 150, .95, RED, CHEESE, CHEESE_L), p + "sh2"))
    else:
        L.append(G(flame(160, 150, .95, METAL_D, mix(METAL, CREAM2, .3)), p + "sh2"))
    d = std_defs(p, "default", seed=191 + on, sh=(4, 3, .36), sh2=(5, 3, .45), cut={"rim": 2.4, "rough": 4.5})
    return svg(320, 320, d + defs, G("".join(L), p + "gr"))


ORANGE = "#F79A3E"

# ---- logo: "Cooking with Mom" in cut-paper letters (round-capped strokes, baseline y=0, x-height 60, cap 95) ----
LETTER = {
    "C": ("M68,-80 C52,-98 8,-100 4,-48 C0,4 52,6 70,-14", 76),
    "o": ("M30,-60 C66,-60 66,0 30,0 C-6,0 -6,-60 30,-60Z", 60),
    "k": ("M0,-98 L0,0 M42,-60 L4,-24 M14,-34 L44,0", 46),
    "i": ("M0,-58 L0,0", 0),
    "n": ("M0,0 L0,-58 M0,-34 C0,-64 44,-68 44,-34 L44,0", 44),
    "g": ("M52,-38 C46,-66 2,-66 2,-32 C2,2 46,2 52,-26 M52,-60 L52,10 C52,40 14,42 4,26", 56),
    "w": ("M0,-58 L14,0 L30,-40 L46,0 L60,-58", 60),
    "t": ("M14,-86 L14,-14 C14,2 30,2 38,-4 M0,-58 L34,-58", 38),
    "h": ("M0,-98 L0,0 M0,-34 C0,-64 44,-68 44,-34 L44,0", 44),
    "M": ("M0,0 L2,-94 L36,-40 L70,-94 L72,0", 72),
    "m": ("M0,0 L0,-58 M0,-36 C0,-64 36,-66 36,-36 L36,0 M36,-36 C36,-66 72,-64 72,-36 L72,0", 72),
}
HEART = "M0,14 C-16,4 -18,-8 -10,-13 C-5,-16 0,-12 0,-8 C0,-12 5,-16 10,-13 C18,-8 16,4 0,14Z"


def word(txt, x, base, s, cols, w=20, gap=17, rots=None):
    g = ""
    for i, ch in enumerate(txt):
        d, adv = LETTER[ch]
        col = cols[i % len(cols)]
        dark = mix(col, "#3A1A10", .45)
        rot = (rots or [0])[i % len(rots or [0])]
        cx = adv / 2
        t = f'translate({n(x)} {base}) scale({s}) rotate({rot} {n(cx)} -40)'
        inner = (f'<path d="{d}" fill="none" stroke="{dark}" stroke-width="{w + 9}" stroke-linecap="round" stroke-linejoin="round" transform="translate(2 3.5)"/>'
                 f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
                 f'<path d="{d}" fill="none" stroke="{mix(col, WHITE, .45)}" stroke-width="{w * .22:.1f}" stroke-linecap="round" stroke-linejoin="round" transform="translate(-2.5 -3)" opacity="0.7"/>')
        if ch == "i":
            inner += P(HEART, RED, ' transform="translate(0 -88) scale(1.25)"')
        g += f'<g transform="{t}">{inner}</g>'
        x += (adv + gap) * s
    return g


def word_width(txt, s, gap=17):
    return (sum(LETTER[c][1] for c in txt) + gap * (len(txt) - 1)) * s


def logo():
    p = "lg-"
    L = [G(P(wob(450, 206, 432, 172, .03, 3, 30), CREAM), p + "cut")]
    L.append(P(wob(446, 200, 404, 150, .04, 4, 28), WHITE, ' opacity="0.45"'))
    s1 = 1.5
    w1 = word_width("Cooking", s1)
    L.append(G(word("Cooking", 450 - w1 / 2 + 6, 176, s1, [RED, CORAL, "#E9A21E", GREEN, TEAL, RED, CORAL], w=19, rots=[-4, 3, -2, 4, -3, 2, -2]), p + "sh"))
    s2, s3, sp = .92, 1.32, 46
    w2, w3 = word_width("with", s2), word_width("Mom", s3)
    x0 = 450 - (w2 + sp + w3) / 2
    L.append(G(word("with", x0, 330, s2, [WALNUT], w=19, rots=[-3, 2, -2, 3]), p + "sh"))
    L.append(G(word("Mom", x0 + w2 + sp, 336, s3, [mix(RED, PINK_D, .35)], w=21, rots=[-3, 2, -2]), p + "sh"))
    hx = x0 + w2 + sp + w3 + 58
    L.append(G(P(HEART, RED, f' transform="translate({n(hx)} 244) scale(2.0) rotate(14)"'), p + "sh"))
    return doc(p, 900, 400, "".join(L), material="default", seed=201, sh=(4, 3.5, .33))


ITEMS = {"oven-panel": oven_panel, "oven-needle": oven_needle, "temp-glow": temp_glow,
         "btn-temp-up": lambda: arrow_btn(True), "btn-temp-down": lambda: arrow_btn(False),
         "oven-start-off": lambda: oven_start(False), "oven-start-on": lambda: oven_start(True),
         "logo-cooking-with-mom": logo}

if __name__ == "__main__":
    only = sys.argv[1:]
    for name, fn in ITEMS.items():
        if not only or name in only:
            save(name, fn())
    print("needle centre", PC, "angles", ANGLES)
    for v, a in ANGLES.items():
        print(v, "digit centre", tuple(round(c) for c in digit_centre(v)))

# The mermaid salon (research/mermaid-dressup-spec.md 3, 5, 10; PR V): everything the girls wear and everything the
# salon is made of. Style B paper cut-out on the shared kit (pb.py, gen_clinic.py, gen_sea.py: all read-only here).
# - Worn items sit on the customers' 600x700 frame (gen_customers.py; head centre (300, 236), the tail's lowest curve on
#   y 684), so the game puts every one at the customer's origin and the WebP's trim keeps only the drawing.
# - TINTED items (hair-back-*, hair-front-*, tail-*) are white paper with grey shade (gen_customers.T_*: no colour of
#   their own); the game multiplies them by ART_SALON.hair / .tail. Their light that must stay light is a separate,
#   untinted layer over them: hair-shine-<style> (only after the comb) and tail-<shape>-shine (always).
# - Everything else (tops, crowns, the clip, necklaces, gems, tools, furniture) has its own colours.
# Run: python tools/gen_salon.py [names...]   (writes into images-b-sea/; prints ART_SALON's anchors and writes
# tools/salon-tints.json for salon-sheet.html); then copy the SVGs into public/assets/images and bake the WebPs.
import sys, os, math, random, json
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_sea import *  # noqa: F401,F403  (gen_clinic, pb and the sea's palette and shapes)
import gen_customers as gcu   # noqa: E402
HERE = os.path.dirname(os.path.abspath(__file__))   # (again: gen_clinic's star import brings its own HERE)
from gen_mom import taper, scales, curl_mass, curl_highlight, grad   # noqa: E402
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))

HY = gcu.HY
W, H = 600, 700
T_HI, T_BASE, T_MID, T_DARK, T_DEEP = gcu.T_HI, gcu.T_BASE, gcu.T_MID, gcu.T_DARK, gcu.T_DEEP
TINTED = dict(hair=T_BASE, hair_d=T_DARK, hair_m=T_MID, hair_l=T_HI)   # curl_mass's palette, in the tinted values
SH_OP = 0.38   # the shade's opacity on tinted hair never under 0.3 (spec 10: Pearl's black hair stays readable)


def frame(p, body, seed, material="smooth", cut=None):
    """A 600x700 item on the customers' frame."""
    return svg(W, H, std_defs(p, material, seed, (4, 3.5, .3), (8, 7, .26), cut or {"rim": 2.4, "rough": 3}), G(body, p + "gr"))


def arc(a0, a1, rx, ry, cy=HY, k=18, cx=300):
    return [(cx + math.cos(math.radians(a)) * rx, cy + math.sin(math.radians(a)) * ry) for a in [a0 + (a1 - a0) * i / (k - 1) for i in range(k)]]


def lock(pts, ws, seed, hi=0.75):
    """One tinted lock of hair along pts: a darker edge under it, the main value, a light streak and a shade streak."""
    body = taper(pts, ws, cap=4)
    mid = [(x - 3, y) for x, y in pts]
    return (P(body, T_DARK, ' transform="translate(3 5)"') + P(body, T_BASE)
            + stroke(smooth_open(mid[1:-1], .2), T_HI, max(4, ws[1] * .16), f' opacity="{hi}"')
            + stroke(smooth_open([(x + ws[i] * .22, y) for i, (x, y) in enumerate(pts)][1:-1], .2), T_MID, max(3, ws[1] * .12), f' opacity="{SH_OP + .2}"'))


def wave_side(sgn, y0, y1, x0, spread, k=12, amp=16, waves=3.0):
    return [(300 + sgn * (x0 + spread * (i / (k - 1)) + amp * math.sin(i / (k - 1) * math.pi * waves)), y0 + (y1 - y0) * i / (k - 1)) for i in range(k)]


# ================================================================ hair: five styles, each back + front (+ shine)
def hair_back_waves():
    """Long waves down her back to her waist, lifted a little by the water (behind her body and tail)."""
    p = "hbw-"
    right, left = wave_side(1, HY + 10, HY + 300, 150, 52), wave_side(-1, HY + 10, HY + 300, 150, 52)
    x0, x1 = right[-1][0], left[-1][0]
    tips = [(x0 + (x1 - x0) * i / 7, HY + 318 + (20 if i % 2 else -4)) for i in range(1, 7)]
    top = arc(200, 340, 168, 164, k=8)
    out = top + right + tips + left[::-1]
    inner = [(x * .94 + 300 * .06, y - 10) for x, y in out]
    s = G(P(smooth(out), T_DARK), p + "cut") + P(smooth(inner), T_BASE)
    st = "".join(stroke(smooth_open([(300 + xr + 13 * math.sin(i / 6 * math.pi * 3 + ph), HY + 40 + 46 * i) for i in range(7)], .2), col, w, f' opacity="{op}"')
                 for xr, ph, col, w, op in ((-164, 0, T_MID, 16, SH_OP + .25), (164, 0, T_MID, 16, SH_OP + .25), (-182, .6, T_HI, 6, .8), (182, .6, T_HI, 6, .8),
                                            (-138, 1.8, T_HI, 5, .7), (138, 1.8, T_HI, 5, .7), (-196, 1.2, T_DEEP, 3, .3), (196, 1.2, T_DEEP, 3, .3)))
    s += f'<clipPath id="{p}hc"><path d="{smooth(inner)}"/></clipPath><g clip-path="url(#{p}hc)">{st}</g>'
    return frame(p, s, 801, "default")


def front_cap(fringe, a0=168, a1=372, rx=162, ry=158):
    return smooth(arc(a0, a1, rx, ry) + fringe)


def hair_front_waves():
    """A soft wavy fringe and two long waves framing her face over her shoulders."""
    p = "hfw-"
    fringe = [(456, HY + 4), (446, HY - 40), (414, HY - 60), (380, HY - 50), (350, HY - 72), (316, HY - 58), (284, HY - 76), (250, HY - 58),
              (216, HY - 70), (184, HY - 44), (154, HY - 36), (144, HY + 4)]
    s = G(P(front_cap(fringe), T_BASE), p + "cut")
    s += "".join(stroke(f"M{x},{HY - 150} Q{x + dx},{HY - 110} {x + dx * 1.6},{HY - 66}", T_MID, 5, f' opacity="{SH_OP + .15}"') for x, dx in ((236, -14), (276, -6), (324, 6), (364, 14)))
    s += P(f"M190,{HY - 108} Q250,{HY - 142} 330,{HY - 140} Q258,{HY - 128} 204,{HY - 96}Z", T_HI, ' opacity="0.8"')
    for sgn, seed in ((-1, 11), (1, 12)):
        k = 9
        pts = [(300 + sgn * (150 - 6 * i) + 14 * math.sin(i / (k - 1) * math.pi * 2.2), HY - 30 + 210 * i / (k - 1)) for i in range(k)]
        s += G(lock(pts, [54, 58, 58, 54, 50, 44, 38, 30, 18], seed), p + "sh")
    return frame(p, s, 802, "default")


def hair_shine_waves():
    p = "hsw-"
    s = stroke(smooth_open(arc(206, 320, 138, 132, k=10), .2), WHITE, 16, ' opacity="0.55"')
    s += stroke(smooth_open(arc(214, 300, 124, 118, k=8), .2), WHITE, 6, ' opacity="0.8"')
    for sgn in (-1, 1):
        s += stroke(smooth_open([(300 + sgn * (146 - 6 * i) + 14 * math.sin(i / 8 * math.pi * 2.2) - sgn * 4, HY - 10 + 26 * i) for i in range(1, 7)], .2), WHITE, 5, ' opacity="0.7"')
    s += sparkle(214, HY - 110, 14) + sparkle(372, HY - 128, 10) + sparkle(132, HY + 110, 9) + sparkle(470, HY + 70, 11)
    return svg(W, H, "", s)


def hair_back_curls():
    """A big cloud of curls round her head, down to her shoulders."""
    p = "hbc-"
    spots = []
    for i in range(15):
        a = math.radians(180 + 180 * i / 14)
        spots.append((300 + math.cos(a) * 178, HY - 8 + math.sin(a) * 170, 44))
    for sgn in (-1, 1):
        spots += [(300 + sgn * 186, HY + 50, 46), (300 + sgn * 178, HY + 110, 44), (300 + sgn * 160, HY + 160, 40), (300 + sgn * 130, HY + 190, 34)]
    return frame(p, curl_mass(TINTED, spots, p, 811, "cut"), 812, "default")


def hair_front_curls():
    p = "hfc-"
    spots = [(300, HY - 132, 36), (254, HY - 128, 34), (346, HY - 128, 34), (212, HY - 112, 32), (388, HY - 112, 32),
             (176, HY - 82, 30), (424, HY - 82, 30), (158, HY - 44, 26), (442, HY - 44, 26), (276, HY - 96, 28),
             (324, HY - 96, 28), (232, HY - 82, 26), (368, HY - 82, 26), (150, HY - 6, 22), (450, HY - 6, 22)]
    s = G(P(front_cap([(444, HY - 30), (300, HY - 92), (156, HY - 30)], 172, 368, 156, 152), T_BASE), p + "sh")
    s += curl_mass(TINTED, spots, p, 821, "cut")
    # two springy curls by her cheeks
    for sgn in (-1, 1):
        x = 300 + sgn * 158
        s += G(stroke(f"M{x},{HY + 10} q{sgn * 16},18 0,32 q{-sgn * 16},14 0,30 q{sgn * 14},12 2,26", T_DARK, 14, ' transform="translate(2 3)"')
               + stroke(f"M{x},{HY + 10} q{sgn * 16},18 0,32 q{-sgn * 16},14 0,30 q{sgn * 14},12 2,26", T_BASE, 11), p + "sh")
    return frame(p, s, 822, "default")


def hair_shine_curls():
    spots = [(300, HY - 132, 36), (212, HY - 112, 32), (388, HY - 112, 32), (176, HY - 82, 30), (424, HY - 82, 30), (254, HY - 128, 34), (346, HY - 128, 34)]
    s = "".join(curl_highlight(x - 4, y - 4, r * .8, WHITE, .7) for x, y, r in spots)
    s += sparkle(230, HY - 150, 13) + sparkle(400, HY - 140, 10) + sparkle(120, HY + 60, 9) + sparkle(486, HY + 110, 11)
    return svg(W, H, "", s)


# (salon review B2: the braid hangs from behind her ear down over her shoulder, outside her face's outline: head
#  ellipse (300, HY) 150x146, the right cheek (394, HY + 80) and gem slot 4 stay clear of it)
BRAID = [(452, HY + 24), (472, HY + 72), (484, HY + 122), (490, HY + 172), (490, HY + 222), (486, HY + 270), (480, HY + 314)]


def hair_back_braid():
    """The hair gathered behind her head (the braid itself is in front, over her shoulder)."""
    p = "hbb-"
    back = [(140, HY - 30), (130, HY + 30), (146, HY + 80), (190, HY + 100), (300, HY + 108), (410, HY + 100), (454, HY + 80), (470, HY + 30), (460, HY - 30)]
    s = G(P(smooth(back), T_DARK), p + "cut") + P(smooth([(x * .95 + 15, y - 6) for x, y in back]), T_BASE)
    s += "".join(stroke(f"M{x},{HY} Q{x + 10},{HY + 50} {x + 20},{HY + 92}", T_MID, 6, f' opacity="{SH_OP + .2}"') for x in (152, 430))
    return frame(p, s, 831, "default")


def hair_front_braid():
    """A side-swept fringe and one thick braid over her shoulder, tied with a little band."""
    p = "hfb-"
    fringe = [(456, HY - 6), (440, HY - 44), (404, HY - 56), (360, HY - 46), (316, HY - 62), (270, HY - 56), (228, HY - 70), (190, HY - 44), (160, HY - 10), (146, HY + 20)]
    s = G(P(front_cap(fringe), T_BASE), p + "cut")
    s += "".join(stroke(f"M{x},{HY - 132} Q{x + 36},{HY - 104} {x + 70},{HY - 64}", T_MID, 5, f' opacity="{SH_OP + .15}"') for x in (226, 262, 298))
    s += P(f"M196,{HY - 112} Q250,{HY - 146} 320,{HY - 140} Q258,{HY - 128} 210,{HY - 98}Z", T_HI, ' opacity="0.8"')
    # where the braid starts: a smooth lock from the side of her head, behind her ear
    seg = G(lock([(446, HY - 40), (452, HY - 6), (456, HY + 28)], [34, 36, 30], 839), p + "sh")
    # the braid: plaits alternating left and right of its line, getting smaller

    for i, (x, y) in enumerate(BRAID):
        w = 38 - i * 2.2
        sgn = -1 if i % 2 else 1
        ox = sgn * 7
        seg += G(P(wob(x + ox, y, w * .76, 30, .05, 840 + i, 16, sgn * 28), T_DARK, ' transform="translate(2 4)"')
                 + P(wob(x + ox, y, w * .76, 30, .05, 840 + i, 16, sgn * 28), T_BASE)
                 + stroke(f"M{n(x + ox - 16)},{n(y - 12)} Q{n(x + ox)},{n(y - 22)} {n(x + ox + 16)},{n(y - 10)}", T_HI, 4, ' opacity="0.75"')
                 + stroke(f"M{n(x - sgn * 12)},{n(y + 18)} Q{n(x + sgn * 4)},{n(y + 24)} {n(x + sgn * 20)},{n(y + 14)}", T_MID, 4, f' opacity="{SH_OP + .2}"'), p + "sh")
    tx, ty = BRAID[-1][0], BRAID[-1][1] + 34
    seg += G(P(wrect(tx - 18, ty - 10, 36, 18, 8, 1, 851), T_DEEP), p + "sh")   # the band (tinted darker)
    tuft = smooth([(tx - 16, ty + 6), (tx - 28, ty + 44), (tx - 12, ty + 70), (tx, ty + 56), (tx + 14, ty + 74), (tx + 28, ty + 44), (tx + 16, ty + 6)])
    seg += G(P(tuft, T_DARK, ' transform="translate(2 4)"') + P(tuft, T_BASE) + stroke(f"M{tx - 6},{ty + 12} Q{tx - 10},{ty + 40} {tx - 4},{ty + 60}", T_HI, 4, ' opacity="0.7"'), p + "sh")
    s += seg
    return frame(p, s, 852, "default")


def hair_shine_braid():
    s = stroke(smooth_open(arc(208, 300, 134, 128, k=8), .2), WHITE, 14, ' opacity="0.5"')
    s += "".join(stroke(f"M{n(x + (-1 if i % 2 else 1) * 7 - 12)},{n(y - 14)} Q{n(x + (-1 if i % 2 else 1) * 7)},{n(y - 20)} {n(x + (-1 if i % 2 else 1) * 7 + 10)},{n(y - 12)}", WHITE, 5, ' opacity="0.85"') for i, (x, y) in enumerate(BRAID))
    s += sparkle(226, HY - 120, 13) + sparkle(530, HY + 160, 11) + sparkle(448, HY + 300, 9)
    return svg(W, H, "", s)


BUN = (300, HY - 160)


def hair_back_bun():
    """A little hair behind her ears (the bun itself is on top, in front)."""
    p = "hbn-"
    back = [(146, HY - 40), (136, HY + 10), (150, HY + 54), (190, HY + 70), (410, HY + 70), (450, HY + 54), (464, HY + 10), (454, HY - 40)]
    s = G(P(smooth(back), T_DARK), p + "cut") + P(smooth([(x * .95 + 15, y - 5) for x, y in back]), T_BASE)
    return frame(p, s, 861, "default")


def hair_front_bun():
    """Combed up smooth into a big round bun on top, two curly wisps by her ears."""
    p = "hfu-"
    line = [(452, HY - 14), (436, HY - 52), (396, HY - 76), (344, HY - 86), (300, HY - 88), (256, HY - 86), (204, HY - 76), (164, HY - 52), (148, HY - 14)]
    s = G(P(front_cap(line, 172, 368, 158, 154), T_BASE), p + "cut")
    s += "".join(stroke(f"M{x0},{HY - 84} Q{(x0 + 300) / 2 + (x0 - 300) * .2},{HY - 150} 300,{HY - 160}", T_MID, 5, f' opacity="{SH_OP + .15}"') for x0 in (196, 236, 364, 404))
    s += P(f"M196,{HY - 104} Q240,{HY - 140} 296,{HY - 150} Q246,{HY - 128} 210,{HY - 92}Z", T_HI, ' opacity="0.8"')
    bx, by = BUN
    s += G(P(wob(bx, by + 4, 66, 56, .04, 862, 24), T_DARK, ' transform="translate(2 5)"') + P(wob(bx, by, 66, 56, .04, 862, 24), T_BASE), p + "cut")
    s += "".join(stroke(f"M{bx - 56},{by + d} Q{bx},{by + d - 34} {bx + 56},{by + d}", T_MID, 5, f' opacity="{SH_OP + .2}"') for d in (-14, 8, 30))
    s += P(f"M{bx - 44},{by - 24} Q{bx - 10},{by - 56} {bx + 30},{by - 48} Q{bx - 8},{by - 40} {bx - 36},{by - 12}Z", T_HI, ' opacity="0.8"')
    s += G(P(wrect(bx - 54, by + 46, 108, 18, 9, 1, 863), T_DEEP), p + "sh")   # where the bun is tied (tinted darker)
    for sgn in (-1, 1):
        x = 300 + sgn * 152
        s += G(stroke(f"M{x},{HY - 6} q{sgn * 12},16 0,30 q{-sgn * 12},12 0,26", T_DARK, 9, ' transform="translate(2 3)"') + stroke(f"M{x},{HY - 6} q{sgn * 12},16 0,30 q{-sgn * 12},12 0,26", T_BASE, 7), p + "sh")
    return frame(p, s, 864, "default")


def hair_shine_bun():
    bx, by = BUN
    s = stroke(smooth_open(arc(214, 290, 132, 126, k=8), .2), WHITE, 13, ' opacity="0.5"')
    s += stroke(f"M{bx - 46},{by - 18} Q{bx - 8},{by - 50} {bx + 34},{by - 42}", WHITE, 9, ' opacity="0.7"')
    s += sparkle(bx + 52, by - 36, 13) + sparkle(220, HY - 118, 10) + sparkle(452, HY - 40, 9)
    return svg(W, H, "", s)


def hair_back_bob():
    p = "hbo-"
    s = G(P(f"M138,{HY - 30} Q122,{HY + 70} 140,{HY + 130} Q170,{HY + 150} 204,{HY + 132} L396,{HY + 132} Q430,{HY + 150} 460,{HY + 130} Q478,{HY + 70} 462,{HY - 30}Z", T_DARK), p + "cut")
    s += P(f"M146,{HY - 20} Q134,{HY + 70} 150,{HY + 120} Q176,{HY + 134} 204,{HY + 120} L396,{HY + 120} Q424,{HY + 134} 450,{HY + 120} Q466,{HY + 70} 454,{HY - 20}Z", T_BASE)
    s += "".join(stroke(f"M{x},{HY} L{x + 4},{HY + 116}", T_MID, 5, f' opacity="{SH_OP + .2}"') for x in (152, 168, 428, 444))
    return frame(p, s, 871, "default")


def hair_front_bob():
    """A straight bob with a straight fringe."""
    p = "hfo-"
    fringe = [(458, HY + 6), (452, HY - 48), (420, HY - 66), (300, HY - 70), (180, HY - 66), (148, HY - 48), (142, HY + 6)]
    s = G(P(front_cap(fringe, 170, 370, 164, 160), T_BASE), p + "cut")
    s += "".join(stroke(f"M{x},{HY - 70} L{x + 2},{HY - 112}", T_MID, 5, f' opacity="{SH_OP + .2}"') for x in (220, 262, 304, 346, 388))
    s += P(f"M190,{HY - 108} Q250,{HY - 142} 330,{HY - 140} Q258,{HY - 128} 204,{HY - 96}Z", T_HI, ' opacity="0.8"')
    # the sides in front of her ears, straight down to her chin
    for sgn in (-1, 1):
        x = 300 + sgn * 150
        side = f"M{x - sgn * 4},{HY - 40} Q{x + sgn * 14},{HY + 40} {x + sgn * 6},{HY + 128} L{x - sgn * 20},{HY + 124} Q{x - sgn * 16},{HY + 40} {x - sgn * 18},{HY - 20}Z"
        s += G(P(side, T_BASE), p + "sh") + stroke(f"M{x},{HY - 10} L{x - sgn * 2},{HY + 110}", T_MID, 4, f' opacity="{SH_OP + .15}"')
    return frame(p, s, 872, "default")


def hair_shine_bob():
    s = stroke(smooth_open(arc(206, 334, 140, 134, k=10), .2), WHITE, 15, ' opacity="0.55"')
    s += stroke(smooth_open(arc(214, 318, 126, 120, k=8), .2), WHITE, 5, ' opacity="0.8"')
    s += sparkle(208, HY - 118, 13) + sparkle(392, HY - 122, 10) + sparkle(136, HY + 90, 9)
    return svg(W, H, "", s)


# ================================================================ tails: three shapes, tinted, each + its shine
def fluke_lobes(fx, fy, ang, k, frills=False):
    """Two wide lobes from (fx, fy), opening along ang (0 = up), in the tinted values; returns (shapes, rim paths)."""
    lobe_l = "M6,6 C-30,-6 -112,-26 -150,-98 Q-120,-96 -104,-118 Q-84,-92 -62,-112 Q-48,-80 -26,-90 Q-14,-50 8,-16Z"
    lobe_r = "M-6,6 C10,-30 40,-96 104,-142 Q110,-110 136,-108 Q124,-82 150,-66 Q120,-52 124,-30 Q60,-20 12,10Z"
    if frills:
        lobe_l = "M6,6 C-30,-6 -100,-20 -150,-98 Q-138,-92 -132,-108 Q-120,-96 -110,-118 Q-100,-100 -86,-112 Q-80,-94 -62,-112 Q-56,-90 -40,-98 Q-36,-80 -24,-88 Q-14,-50 8,-16Z"
        lobe_r = "M-6,6 C10,-30 44,-96 104,-142 Q106,-124 124,-126 Q118,-108 138,-104 Q126,-92 146,-82 Q130,-72 150,-60 Q128,-54 132,-40 Q100,-36 108,-24 Q60,-20 12,10Z"
    g = f'transform="translate({n(fx)} {n(fy)}) rotate({n(ang)}) scale({k})"'
    body = (P(lobe_l, T_DARK, ' transform="translate(0 5)"') + P(lobe_l, T_BASE) + P(lobe_r, T_DARK, ' transform="translate(0 5)"') + P(lobe_r, T_BASE))
    ribs = "".join(stroke(f"M0,-4 Q{n(dx * .5)},{n(dy * .5 - 8)} {n(dx)},{n(dy)}", T_MID, 5, f' opacity="{SH_OP + .25}"')
                   for dx, dy in ((-136, -92), (-106, -104), (-74, -98), (-44, -80), (84, -124), (112, -102), (132, -72), (110, -40)))
    return f"<g {g}>{body}{ribs}</g>", (g, lobe_l, lobe_r)


def tail_body(p, line, widths, frill, extra=""):
    """The tail's body along `line` with its scales (tinted values) and the frill at the waist."""
    body = taper(line, widths, cap=3)
    s = f'<clipPath id="{p}tc"><path d="{body}"/></clipPath>'
    s += G(P(body, T_DARK, ' transform="translate(0 5)"') + P(body, T_BASE), p + "cut")
    xs = [x for x, _ in line]
    s += scales(f"{p}tc", min(xs) - max(widths) / 2, 500, max(xs) + max(widths) / 2, max(y for _, y in line) + 40, 15, T_DARK, T_HI, 0.85)
    s += f'<g clip-path="url(#{p}tc)">' + P(taper([(x - w * .22, y + 6) for (x, y), w in zip(line, widths)], [w * .16 for w in widths], cap=2), T_HI, ' opacity="0.5"') + "</g>"
    s += f'<g clip-path="url(#{p}tc)">' + P(taper([(x + w * .3, y) for (x, y), w in zip(line, widths)], [w * .2 for w in widths], cap=2), T_MID, f' opacity="{SH_OP}"') + "</g>"
    return s + extra + G(frill, p + "sh")


CLASSIC = ([(300, 500), (302, 590), (316, 632), (348, 660), (390, 670), (428, 658), (456, 630)], [212, 198, 172, 142, 112, 86, 62])
FRILLY = ([(300, 500), (300, 584), (310, 628), (340, 658), (382, 670), (422, 660), (452, 634)], [212, 200, 176, 146, 116, 88, 64])
LONG = ([(300, 500), (298, 576), (282, 622), (252, 652), (214, 666), (176, 660), (150, 636), (138, 604)], [212, 196, 170, 144, 116, 92, 72, 54])


def frill_band(kind):
    if kind == "classic":   # a scalloped band
        d = "M194,532 " + " ".join(f"Q{n(194 + i * 26.5 + 13)},{n(564)} {n(194 + (i + 1) * 26.5)},532" for i in range(8)) + " L406,516 Q300,502 194,516Z"
        return P(d, T_DARK, ' transform="translate(0 3)"') + P(d, T_BASE) + stroke("M200,524 Q300,512 400,524", T_HI, 5, ' opacity="0.8"')
    if kind == "frilly":    # two rows of big ruffles
        out = ""
        for row, (y, k, depth) in enumerate(((548, 7, 40), (530, 9, 26))):
            w = 228 / k
            d = f"M186,{y - 20} " + " ".join(f"Q{n(186 + i * w + w / 2)},{n(y + depth)} {n(186 + (i + 1) * w)},{y - 20 + (4 if i % 2 else 0)}" for i in range(k)) + f" L414,{y - 30} Q300,{y - 44} 186,{y - 30}Z"
            out += P(d, T_DARK, ' transform="translate(0 4)"') + P(d, T_BASE if row else T_MID)
            out += "".join(stroke(f"M{n(186 + i * w + w / 2)},{y - 14} L{n(186 + i * w + w / 2)},{n(y + depth * .6)}", T_HI if row else T_BASE, 3, ' opacity="0.6"') for i in range(k))
        return out
    d = "M196,516 Q300,500 404,516 L400,540 Q350,548 300,580 Q250,548 200,540Z"   # long: a slim band with a point
    return P(d, T_DARK, ' transform="translate(0 3)"') + P(d, T_BASE) + stroke("M206,524 Q300,510 394,524", T_HI, 4, ' opacity="0.8"') + stroke("M300,548 L300,572", T_MID, 3, ' opacity="0.6"')


def side_frills(line, widths):
    """frilly: little ruffled fins along both sides of the tail."""
    out = ""
    for i in range(1, len(line) - 2):
        (x0, y0), (x1, y1) = line[i], line[i + 1]
        dx, dy = x1 - x0, y1 - y0
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        for sgn in (-1, 1):
            w = widths[i] / 2 + 4
            cx, cy = x0 + dx * .5 + nx * w * sgn, y0 + dy * .5 + ny * w * sgn
            r = 12 + widths[i] * .07
            ang = math.degrees(math.atan2(ny * sgn, nx * sgn))
            out += P(wob(cx, cy, r * 1.3, r * .7, .1, 900 + i * 2 + (sgn > 0), 14, ang), T_DARK, ' transform="translate(1 3)"') + P(wob(cx, cy, r * 1.3, r * .7, .1, 900 + i * 2 + (sgn > 0), 14, ang), T_BASE)
    return out


def tail_classic():
    p = "tcl-"
    line, ws = CLASSIC
    fl, _ = fluke_lobes(456, 628, 28, 0.64)
    return frame(p, G(fl, p + "cut") + tail_body(p, line, ws, frill_band("classic")), 881, "default")


def tail_frilly():
    p = "tfr-"
    line, ws = FRILLY
    fl, _ = fluke_lobes(452, 632, 30, 0.68, frills=True)
    return frame(p, G(fl, p + "cut") + G(side_frills(line, ws), p + "sh") + tail_body(p, line, ws, frill_band("frilly")), 882, "default")


def tail_long():
    """Long and winding, curling to her right, with a butterfly fin (four lobes)."""
    p = "tlo-"
    line, ws = LONG
    up, _ = fluke_lobes(138, 606, -30, 0.62)
    low, _ = fluke_lobes(138, 610, -120, 0.4)
    return frame(p, G(low + up, p + "cut") + tail_body(p, line, ws, frill_band("long")), 883, "default")


def tail_shine(line, ws, flukes, frilly=False):
    """Over the tinted tail, untinted: a pearly see-through edge on the fins, a band of shine, sparkles."""
    s = ""
    for g, ll, lr in flukes:
        s += f'<g {g}>' + "".join(f'<path d="{d}" fill="none" stroke="#FFFFFF" stroke-width="9" opacity="0.55"/>' for d in (ll, lr))
        s += P("M-20,-30 Q-70,-50 -110,-96 Q-60,-70 -20,-46Z", WHITE, ' opacity="0.4"') + P("M20,-30 Q60,-70 98,-126 Q80,-70 30,-40Z", WHITE, ' opacity="0.35"') + "</g>"
    s += P(taper([(x - w * .2, y + 4) for (x, y), w in zip(line, ws)][1:], [w * .08 for w in ws][1:], cap=2), WHITE, ' opacity="0.55"')
    rr = random.Random(len(line) * 7 + frilly)
    for i in range(1, len(line) - 1):
        x, y = line[i]
        s += sparkle(x + rr.uniform(-ws[i] * .3, ws[i] * .3), y + rr.uniform(-10, 10), rr.uniform(6, 10))
    return svg(W, H, "", s)


def tail_classic_shine():
    _, fl = fluke_lobes(456, 628, 28, 0.64)
    return tail_shine(*CLASSIC, [fl])


def tail_frilly_shine():
    _, fl = fluke_lobes(452, 632, 30, 0.68, frills=True)
    return tail_shine(*FRILLY, [fl], True)


def tail_long_shine():
    _, up = fluke_lobes(138, 606, -30, 0.62)
    _, low = fluke_lobes(138, 610, -120, 0.4)
    return tail_shine(*LONG, [up, low])


# ================================================================ tops (their own colours; every one covers the vest)
TOP_OUTLINE = "M212,450 Q300,430 388,450 Q402,452 402,468 L407,530 Q300,548 193,530 L198,468 Q198,452 212,450Z"


def top_base(p, col, col_d, straps=True):
    s = G(P(TOP_OUTLINE, col_d, ' transform="translate(0 3)"') + P(TOP_OUTLINE, col), p + "cut")
    if straps:
        for sgn in (-1, 1):
            x = 300 + sgn * 62
            s += G(stroke(f"M{x},{404} Q{x + sgn * 6},{432} {x + sgn * 4},{458}", col, 13), p + "sh")
    return s


def top_shells():
    """A lilac top with two pink scallop shells on it and strings of pearls over her shoulders."""
    p = "tsh-"
    s = top_base(p, LILAC, "#9A7EBA", straps=False)
    for sgn in (-1, 1):
        x = 300 + sgn * 62
        s += "".join(C(x + sgn * (i * .6), 406 + i * 6.5, 5.6, PEARL, ' stroke="#D9D2C4" stroke-width="1"') for i in range(8))
    s += stroke("M210,462 Q300,442 390,462", "#E2D4F2", 6, ' opacity="0.9"')
    for sgn in (-1, 1):
        s += G(scallop(300 + sgn * 46, 500, 40, 46, SHELL, SHELL_D, SHELL_L, 7), p + "sh")
    s += G(C(300, 486, 9, PEARL_D) + C(300, 484, 8, PEARL) + C(297, 481, 2.6, WHITE), p + "sh")
    s += "".join(C(220 + i * 32, 524 + 3 * math.sin(i), 3, "#E2D4F2", ' opacity="0.9"') for i in range(6))
    return frame(p, s, 901)


def top_starfish():
    """A turquoise top with little white waves and a big orange starfish on its strap."""
    p = "tsf-"
    s = top_base(p, TURQ, TURQ_D)
    clip = f'<clipPath id="{p}c"><path d="{TOP_OUTLINE}"/></clipPath>'
    waves = "".join(stroke(" ".join([f"M190,{y}"] + [f"q12,-8 24,0 q12,8 24,0" for _ in range(5)]), WHITE, 4, ' opacity="0.7"') for y in (486, 512))
    s += clip + f'<g clip-path="url(#{p}c)">{waves}</g>'
    s += stroke("M208,462 Q300,442 392,462", TURQ_L, 6, ' opacity="0.9"')
    s += G(starfish(258, 458, 34, "#F7A04B", -80), p + "cut")
    s += C(258, 458, 5, "#FFE0B8")
    return frame(p, s, 902)


def top_frill():
    """A seaweed-green top of soft frills in three layers, with a little pink sea flower."""
    p = "tfl-"
    s = top_base(p, "#7CC47A", "#5A9E58")
    for row, (y, col) in enumerate(((530, "#5FAE5D"), (506, "#7CC47A"), (482, "#9AD696"))):
        k = 7 + row
        w = 212 / k
        d = f"M194,{y - 22} " + " ".join(f"Q{n(194 + i * w + w / 2)},{n(y + 14)} {n(194 + (i + 1) * w)},{y - 22}" for i in range(k)) + f" L406,{y - 30} Q300,{y - 40} 194,{y - 30}Z"
        s += G(P(d, col), p + "sh")
    s += G("".join(E(346 + 11 * math.cos(math.radians(a)), 470 + 11 * math.sin(math.radians(a)), 9, 6, "#F58FB4", f' transform="rotate({a} {n(346 + 11 * math.cos(math.radians(a)))} {n(470 + 11 * math.sin(math.radians(a)))})"') for a in range(0, 360, 72)) + C(346, 470, 6, "#F7C948"), p + "sh")
    return frame(p, s, 903)


# ================================================================ crowns, the clip, necklaces, face gems
def crown_pearl():
    """A pearl tiara: a pearly band with pearls rising to a big one in the middle."""
    p = "cpe-"
    band = "M192,112 Q300,64 408,112 L404,126 Q300,80 196,126Z"
    s = G(P(band, PEARL_D, ' transform="translate(0 3)"') + P(band, PEARL), p + "cut")
    for i in range(11):
        t = (i - 5) / 5
        x = 300 + 102 * t
        top = 98 - 46 * (1 - t * t) * 1.0 - 4
        y_band = 94 + 26 * t * t
        s += stroke(f"M{n(x)},{n(y_band)} L{n(x)},{n(top + 8)}", "#E9E2D6", 3) + C(x, top, 7 + 4 * (1 - abs(t)), PEARL, ' stroke="#D9D2C4" stroke-width="1.4"') + C(x - 2, top - 2, 2.6, WHITE)
    s += G(C(300, 40, 18, PEARL_D) + C(300, 38, 17, PEARL) + C(294, 32, 6, WHITE) + C(300, 38, 17, "#F7D6E6", ' opacity="0.3"'), p + "sh")
    s += sparkle(352, 44, 9) + sparkle(244, 54, 7)
    return frame(p, s, 911)


def crown_starfish():
    """A golden crown with five points; the middle one is a big orange starfish, small ones on the sides."""
    p = "csf-"
    pts = [(194, 124), (204, 76), (236, 104), (262, 60), (300, 96), (338, 60), (364, 104), (396, 76), (406, 124)]
    d = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + " Q300,100 194,124Z"
    s = G(P(d, GOLD_D, ' transform="translate(0 4)"') + P(d, GOLD), p + "cut")
    s += stroke("M198,118 Q300,94 402,118", "#FFE39A", 6, ' opacity="0.9"')
    s += "".join(C(x, y, 5, PEARL) for x, y in ((204, 76), (262, 60), (338, 60), (396, 76)))
    s += G(starfish(300, 58, 42, "#F4883C", -90), p + "cut") + C(300, 58, 7, "#FFE0B8")
    s += G(starfish(232, 106, 16, "#F7A04B", -70) + starfish(368, 106, 16, "#F7A04B", -110), p + "sh")
    s += "".join(C(220 + i * 32, 116 - 10 * math.sin(i / 5 * math.pi), 4, "#F58FB4") for i in range(6))
    return frame(p, s, 912)


def crown_coral():
    """Pink coral branches rising from a little band, a tiny pearl on each tip."""
    p = "cco-"
    band = "M200,118 Q300,82 400,118 L396,130 Q300,96 204,130Z"
    branches = ""
    tips = []
    rr = random.Random(913)
    for i, (x0, ang, ln) in enumerate(((222, -112, 44), (254, -100, 54), (286, -92, 62), (314, -88, 64), (346, -80, 54), (378, -68, 44))):
        y0 = 118 - 34 * (1 - ((x0 - 300) / 100) ** 2)
        a = math.radians(ang)
        x1, y1 = x0 + math.cos(a) * ln, y0 + math.sin(a) * ln
        branches += stroke(f"M{n(x0)},{n(y0)} Q{n((x0 + x1) / 2 + rr.uniform(-8, 8))},{n((y0 + y1) / 2)} {n(x1)},{n(y1)}", CORALC, 12)
        tips.append((x1, y1))
        for side in (-1, 1):   # a little twig off each branch
            t = .55
            bx, by = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            b2 = math.radians(ang + side * 38)
            tx, ty = bx + math.cos(b2) * ln * .34, by + math.sin(b2) * ln * .34
            branches += stroke(f"M{n(bx)},{n(by)} L{n(tx)},{n(ty)}", CORALC, 8)
            tips.append((tx, ty))
    s = G(G(branches, None, ' transform="translate(0 4)" opacity="0.5"').replace(CORALC, CORALC_D) + branches, p + "cut")
    s += "".join(stroke(f"M{n(x)},{n(y + 6)} l0,-4", "#FFC2B6", 4, ' opacity="0.8"') for x, y in tips)
    s += "".join(C(x, y, 6 if i % 3 == 0 else 4.5, PEARL) for i, (x, y) in enumerate(tips))
    s += G(P(band, "#D96A58", ' transform="translate(0 3)"') + P(band, "#F7A7A8"), p + "sh")
    return frame(p, s, 914)


def clip_flower():
    """A sea-flower hair clip on the left of her head: five pink petals, a pearl in the middle, a green leaf."""
    p = "clf-"
    cx, cy = 186, 148
    s = G(P(wob(cx + 30, cy + 24, 26, 11, .05, 3, 16, 35), "#5FA35A") + stroke(f"M{cx + 8},{cy + 8} L{cx + 48},{cy + 36}", "#457F43", 3), p + "sh")
    pet = "".join(E(cx + 24 * math.cos(math.radians(a)), cy + 24 * math.sin(math.radians(a)), 22, 15, "#F58FB4",
                    f' transform="rotate({a} {n(cx + 24 * math.cos(math.radians(a)))} {n(cy + 24 * math.sin(math.radians(a)))})"') for a in range(-90, 270, 72))
    s += G(pet, p + "cut")
    s += "".join(stroke(f"M{cx},{cy} L{n(cx + 30 * math.cos(math.radians(a)))},{n(cy + 30 * math.sin(math.radians(a)))}", "#D9668F", 3, ' opacity="0.6"') for a in range(-90, 270, 72))
    s += G(C(cx, cy, 12, PEARL_D) + C(cx, cy - 1, 11, PEARL) + C(cx - 3, cy - 4, 3.4, WHITE), p + "sh")
    return frame(p, s, 921)


def necklace_pearl():
    p = "npe-"
    pts = [(250 + 100 * i / 14, 404 + 34 * math.sin(math.pi * i / 14)) for i in range(15)]
    s = stroke(smooth_open(pts, .2), "#D9D2C4", 2)
    s += "".join(C(x, y, 7.4, PEARL, ' stroke="#D9D2C4" stroke-width="1.2"') + C(x - 2, y - 2, 2.4, WHITE) for x, y in pts)
    s += G(C(300, 456, 12, PEARL_D) + C(300, 454, 12, PEARL) + C(296, 450, 4, WHITE) + C(300, 454, 12, "#F7D6E6", ' opacity="0.3"'), p + "sh")
    return frame(p, G(s, p + "sh"), 931)


def necklace_star():
    p = "nst-"
    s = stroke("M248,404 Q300,452 352,404", GOLD_D, 4)
    s += G(stroke("M300,430 L300,442", GOLD_D, 3) + star(300, 462, 22, GOLD, -90, .5) + star(300, 462, 12, "#FFE39A", -90, .5, ' opacity="0.8"'), p + "sh")
    s += sparkle(322, 446, 7)
    return frame(p, G(s, p + "sh"), 932)


def gem_star():
    """90x90: a sparkling blue star gem with facets."""
    p = "gst-"
    s = G(star(45, 47, 40, "#3E92C8", -90, .5) + star(45, 45, 40, "#6EC4EE", -90, .5), p + "cut")
    s += star(45, 45, 20, "#BFEAFB", -90, .5, ' opacity="0.9"')
    s += "".join(stroke(f"M45,45 L{n(45 + math.cos(math.radians(-90 + i * 72)) * 38)},{n(45 + math.sin(math.radians(-90 + i * 72)) * 38)}", WHITE, 2, ' opacity="0.5"') for i in range(5))
    s += sparkle(30, 26, 8) + C(54, 34, 3, WHITE)
    return doc(p, 90, 90, s, "smooth", seed=941, cut={"rim": 2, "rough": 2})


def gem_heart():
    """90x90: a shiny pink heart gem."""
    p = "ght-"
    s = G(heart(45, 46, 1.2, "#D9668F") + heart(45, 43, 1.2, "#F58FB4"), p + "cut")
    s += heart(45, 40, .62, "#FFC2D8", ' opacity="0.85"')
    s += P("M24,30 Q28,18 40,22", "none", f' stroke="{WHITE}" stroke-width="5" stroke-linecap="round" opacity="0.9"') + sparkle(64, 24, 7)
    return doc(p, 90, 90, s, "smooth", seed=942, cut={"rim": 2, "rough": 2})


# ================================================================ tools (240x240) and the spray's cap (80, tinted)
SPRAY_CAP = (120, 56)   # where spray-cap's centre sits on tool-spray


def tool_sponge():
    p = "tsp-"
    body = wob(120, 128, 88, 70, .07, 951, 26, -8)
    s = G(P(body, "#E9B53A", ' transform="translate(0 6)"') + P(body, "#F7D35A"), p + "cut")
    rr = random.Random(952)
    holes = [(rr.uniform(52, 188), rr.uniform(78, 182), rr.uniform(6, 13)) for _ in range(22)]
    s += "".join(E(x, y, r, r * .78, "#D69E2A", ' opacity="0.8"') + E(x - 1, y - 2, r * .6, r * .42, "#C68A20", ' opacity="0.5"')
                 for x, y, r in holes if ((x - 120) / 80) ** 2 + ((y - 128) / 62) ** 2 < 1)
    s += P(wob(98, 98, 40, 16, .08, 953, 14, -14), "#FFF1B8", ' opacity="0.6"')
    # soap foam on top and two soap bubbles (salon review B4: the sponge must not look like the sand on her)
    foam = "".join(C(x, y, r, WHITE) for x, y, r in ((86, 70, 16), (108, 62, 20), (134, 64, 18), (156, 74, 14), (70, 82, 11), (122, 78, 14)))
    s += G(foam, p + "sh") + "".join(C(x, y, r, "#D8F1FA", ' opacity="0.8"') for x, y, r in ((104, 58, 6), (142, 60, 5)))
    s += bubble(186, 70, 16) + bubble(206, 104, 10) + bubble(54, 64, 12)
    s += C(196, 44, 13, "#BFE6F5", ' opacity="0.55"') + bubble(196, 44, 13, .9) + C(34, 104, 9, "#BFE6F5", ' opacity="0.55"') + bubble(34, 104, 9, .9)
    return doc(p, 240, 240, s, "rough", seed=954, cut={"rim": 2.6, "rough": 4})


def tool_shower():
    """A shower made of a pink scallop shell on a coral handle, drops falling from it."""
    p = "tsw-"
    s = G(stroke("M150,150 Q180,176 190,208", CORALC_D, 26) + stroke("M150,150 Q180,176 190,208", CORALC, 20), p + "cut")
    s += G(scallop(112, 150, 78, 96, SHELL, SHELL_D, SHELL_L, 8), p + "cut")
    s += "".join(C(112 + math.cos(math.radians(a)) * 52, 150 + math.sin(math.radians(a)) * 62, 4, SHELL_D) for a in range(-150, -20, 22))
    s += "".join(P(f"M{x},{y} q-7,12 0,16 q7,-4 0,-16Z", "#8ED6F0") for x, y in ((70, 176), (100, 190), (130, 184), (88, 214), (120, 220)))
    return doc(p, 240, 240, s, "smooth", seed=955, cut={"rim": 2.6, "rough": 3})


def tool_spray():
    """A round pearly spray bottle with sea-glass sides; the coloured cap (spray-cap) sits on its top."""
    p = "tsy-"
    s = G(P(wrect(98, 66, 44, 34, 8, 1, 956), "#D9D2C4") + P(wrect(100, 64, 40, 30, 8, 1, 957), PEARL), p + "sh")
    body = wob(120, 156, 66, 70, .03, 958, 26)
    s += G(P(body, "#8FBFD0", ' transform="translate(0 6)"') + P(body, "#BFE6EE"), p + "cut")
    s += P(wob(120, 172, 52, 44, .04, 959, 22), WHITE, ' opacity="0.35"')
    s += P("M84,124 Q92,100 116,98", "none", f' stroke="{WHITE}" stroke-width="10" stroke-linecap="round" opacity="0.8"')
    s += scallop(120, 190, 22, 26, PEARL, PEARL_D, WHITE, 6)
    s += stroke("M140,58 L176,48", "#B3C3C6", 8) + C(180, 46, 6, "#B3C3C6")
    return doc(p, 240, 240, s, "smooth", seed=960, cut={"rim": 2.6, "rough": 3})


def spray_cap():
    """80x80: the spray's push cap in white paper (the game tints it the colour she has picked)."""
    p = "scp-"
    s = G(P(wrect(14, 22, 52, 40, 12, 1, 961), T_DARK, ' transform="translate(0 3)"') + P(wrect(14, 22, 52, 40, 12, 1, 961), T_BASE), p + "cut")
    s += P(wrect(20, 26, 40, 10, 5, 1, 962), T_HI, ' opacity="0.9"') + C(58, 44, 5, T_MID)
    return doc(p, 80, 80, s, "smooth", seed=963, cut={"rim": 2, "rough": 2})


def tool_comb():
    p = "tcb-"
    back = "M30,96 Q120,52 210,96 L206,122 Q120,92 34,122Z"
    s = G(P(back, "#D9668F", ' transform="translate(0 4)"') + P(back, "#F7A7C4"), p + "cut")
    s += G("".join(stroke(f"M{n(40 + i * 10.6)},{n(118 - 22 * math.sin(math.pi * i / 16) * .6)} L{n(40 + i * 10.6)},{n(176 - 18 * math.sin(math.pi * i / 16))}", "#F7A7C4", 7) for i in range(17)), p + "sh")
    s += scallop(120, 88, 34, 40, PEARL, PEARL_D, WHITE, 6) + stroke("M44,100 Q120,66 196,100", "#FFD0E0", 5, ' opacity="0.8"')
    return doc(p, 240, 240, s, "smooth", seed=964, cut={"rim": 2.6, "rough": 3})


def brush(p, seed, tip, handle="#B99BD8", band=GOLD):
    s = G(stroke("M170,202 L112,120", "#9A7EBA", 24) + stroke("M170,202 L112,120", handle, 18), p + "cut")
    s += G(P(wrect(88, 98, 40, 34, 8, 1, seed, 20), GOLD_D, ' transform="rotate(-35 108 115)"') + P(wrect(90, 96, 36, 30, 8, 1, seed + 1, 20), band, ' transform="rotate(-35 108 115)"'), p + "sh")
    return s + tip


def tool_blush():
    """A big round fluffy blush brush."""
    p = "tbl-"
    tip = G(P(wob(78, 72, 52, 48, .08, 971, 22), "#E9A0B0", ' transform="translate(0 4)"') + P(wob(78, 72, 52, 48, .08, 971, 22), "#F9C8D2"), p + "cut")
    tip += "".join(stroke(f"M{n(78 + math.cos(math.radians(a)) * 20)},{n(72 + math.sin(math.radians(a)) * 20)} L{n(78 + math.cos(math.radians(a)) * 44)},{n(72 + math.sin(math.radians(a)) * 42)}", "#FFE4EA", 3, ' opacity="0.7"') for a in range(0, 360, 30))
    tip += P(wob(64, 56, 20, 12, .1, 972, 12), WHITE, ' opacity="0.5"')
    return doc(p, 240, 240, brush(p, 973, tip), "smooth", seed=974, cut={"rim": 2.6, "rough": 3})


def tool_shadow():
    """An eyeshadow wand with a soft oval sponge tip."""
    p = "tsd-"
    s = G(stroke("M182,206 L96,96", "#3FA9A6", 18) + stroke("M182,206 L96,96", TURQ, 12), p + "cut")
    s += G(P(wob(78, 72, 22, 40, .05, 981, 18, -38), "#C7B2EA", ' transform="translate(0 3)"') + P(wob(78, 72, 22, 40, .05, 981, 18, -38), "#E2D4F2"), p + "cut")
    s += P(wob(70, 62, 7, 18, .1, 982, 12, -38), WHITE, ' opacity="0.6"')
    s += C(186, 210, 10, GOLD) + sparkle(150, 70, 10)
    return doc(p, 240, 240, s, "smooth", seed=983, cut={"rim": 2.6, "rough": 3})


def tool_lipstick():
    """A lipstick in a golden shell case."""
    p = "tlp-"
    g = ' transform="rotate(28 120 130)"'
    s = G(P(wrect(84, 116, 72, 96, 14, 1, 991), "#E29A9A", g) + P(wrect(84, 112, 72, 92, 14, 1, 992), SHELL, g), p + "cut")
    s += G(P(wrect(90, 92, 60, 26, 6, 1, 993), GOLD_D, g) + P(wrect(92, 90, 56, 22, 6, 1, 994), GOLD, g), p + "sh")
    s += G(P("M98,92 L98,54 Q120,24 142,44 L142,92Z", "#D9466E", g) + P("M104,90 L104,58 Q116,40 124,44 L124,90Z", "#F27098", g), p + "sh")
    s += P("M110,84 L110,60", "none", f' stroke="{WHITE}" stroke-width="5" stroke-linecap="round" opacity="0.6"{g}')
    s += G(scallop(120, 176, 22, 26, PEARL, PEARL_D, WHITE, 5), None, g)
    return doc(p, 240, 240, s, "smooth", seed=995, cut={"rim": 2.6, "rough": 3})


def tool_glitter():
    """A glitter brush: a pointed tip full of rainbow sparkles."""
    p = "tgl-"
    tip = G(P("M46,44 Q96,40 122,100 Q108,118 88,124 Q42,98 46,44Z", "#C7B2EA", ' transform="translate(0 3)"') + P("M46,44 Q96,40 122,100 Q108,118 88,124 Q42,98 46,44Z", "#F7F0FF"), p + "cut")
    rr = random.Random(1001)
    cols = ("#F58FB4", "#4FB8E0", "#F7C948", "#5CC98A", "#9B7BE0")
    tip += "".join(C(rr.uniform(56, 108), rr.uniform(54, 110), rr.uniform(3, 5.5), cols[i % 5]) for i in range(22))
    tip += sparkle(40, 30, 14, "#FFF4B8") + sparkle(132, 52, 10) + sparkle(30, 92, 8)
    return doc(p, 240, 240, brush(p, 1002, tip, "#F58FB4", "#E2D4F2"), "smooth", seed=1003, cut={"rim": 2.6, "rough": 3})


def shell_surprise():
    """220x220: the surprise shell, closed, a rainbow of pearly colours with a bow and sparkles (no question mark)."""
    p = "ssu-"
    defs = grad(f"{p}g", ((0, "#F7A7C4"), (0.35, "#C7B2EA"), (0.7, "#9ADFF0"), (1, "#FFE39A")), 0, 0, 1, 0)
    s = defs + G(scallop(110, 176, 96, 140, f"url(#{p}g)", "#B98AB8", WHITE, 9), p + "cut")
    s += G(P("M110,64 Q78,30 62,52 Q70,76 110,70Z", GOLD) + P("M110,64 Q142,30 158,52 Q150,76 110,70Z", GOLD) + C(110, 66, 10, GOLD_D)
           + P("M104,72 L92,104 L104,98Z", GOLD) + P("M116,72 L128,104 L116,98Z", GOLD), p + "sh")
    s += sparkle(36, 54, 14) + sparkle(186, 70, 12, "#FFF4B8") + sparkle(178, 150, 9) + sparkle(40, 140, 8, "#FFF4B8")
    return doc(p, 220, 220, s, "smooth", seed=1011, cut={"rim": 2.6, "rough": 3})


# ================================================================ furniture
CHAIR_SEAT = (350, 590)   # salon-chair: where the customer frame's (300, 684) goes, at the customer's scale


def salon_chair():
    """700x600: a giant open clam: its fan back rising behind her, the pearly seat bowl under her."""
    p = "sch-"
    s = G(scallop(350, 470, 310, 440, SHELL, SHELL_D, SHELL_L, 11), p + "cut")
    s += P(wob(350, 300, 230, 160, .03, 1021, 26), "#FFE9EC", ' opacity="0.55"')
    s += "".join(C(350 + math.cos(math.radians(a)) * 292, 470 + math.sin(math.radians(a)) * 412, 9, PEARL) for a in range(-158, -20, 12))
    bowl = "M40,470 Q60,596 350,598 Q640,596 660,470 Q520,520 350,520 Q180,520 40,470Z"
    s += G(P(bowl, SHELL_D, ' transform="translate(0 6)"') + P(bowl, SHELL), p + "cut")
    s += P("M70,478 Q350,560 630,478 Q560,520 350,526 Q140,520 70,478Z", "#FFE9EC", ' opacity="0.8"')
    s += "".join(stroke(f"M{x},{530 + abs(x - 350) * -.05} Q{x + (x - 350) * .08},560 {x + (x - 350) * .14},{590 - abs(x - 350) * .12}", SHELL_D, 6, ' opacity="0.45"') for x in range(110, 600, 60))
    s += sparkle(170, 200, 16) + sparkle(560, 170, 12) + sparkle(470, 90, 9)
    return doc(p, 700, 600, s, "smooth", seed=1022, cut={"rim": 3, "rough": 4})


MIRROR_WIN = {"x": 122, "y": 196, "w": 316, "h": 352}


def salon_mirror():
    """560x720: a tall mirror in a shell frame with pearls round it, on a coral foot; its glass (MIRROR_WIN) clear."""
    p = "smr-"
    x0, x1, yt, yb, r = 102, 458, 290, 566, 178
    frame_d = f"M{x0 - 26},{yb + 10} L{x0 - 26},{yt} A{r + 26},{r + 26} 0 0 1 {x1 + 26},{yt} L{x1 + 26},{yb + 10} Q280,{yb + 46} {x0 - 26},{yb + 10}Z"
    glass = f"M{x0},{yb} L{x0},{yt} A{r},{r} 0 0 1 {x1},{yt} L{x1},{yb} Q280,{yb + 26} {x0},{yb}Z"
    s = G(stroke("M280,600 Q250,650 220,700 M280,600 Q300,660 344,704 M280,600 L280,708", CORALC_D, 26, ' transform="translate(0 4)"')
          + stroke("M280,600 Q250,650 220,700 M280,600 Q300,660 344,704 M280,600 L280,708", CORALC, 20), p + "cut")
    s += G(P(wob(280, 708, 120, 14, .05, 1031, 18), SAND_D), p + "sh")
    s += G(scallop(280, 150, 150, 124, SHELL, SHELL_D, SHELL_L, 9), p + "cut")
    s += G(P(frame_d, "#C9A0C8", ' transform="translate(0 6)"') + P(frame_d, "#F2D3EA"), p + "cut")
    s += f'<linearGradient id="{p}gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E4F7FA"/><stop offset="1" stop-color="#9CD3E2"/></linearGradient>'
    s += P(glass, "#7FB0C4", ' transform="translate(0 3)"') + P(glass, f"url(#{p}gl)")
    s += f'<clipPath id="{p}gc"><path d="{glass}"/></clipPath><g clip-path="url(#{p}gc)">'
    s += P("M120,420 L300,150 L360,150 L170,470Z", WHITE, ' opacity="0.45"') + P("M200,500 L380,230 L404,230 L226,520Z", WHITE, ' opacity="0.35"') + "</g>"
    beads = [(x0 - 13, y) for y in range(yb, yt, -30)] + [(280 + math.cos(math.radians(a)) * (r + 13), yt + math.sin(math.radians(a)) * (r + 13)) for a in range(-180, 1, 15)] + [(x1 + 13, y) for y in range(yt, yb + 1, 30)]
    s += "".join(C(x, y, 8, PEARL, ' stroke="#D9D2C4" stroke-width="1.4"') + C(x - 2, y - 2, 2.6, WHITE) for x, y in beads)
    s += G(starfish(280, 92, 34, "#F4883C"), p + "sh") + sparkle(410, 120, 14) + sparkle(150, 90, 10)
    return doc(p, 560, 720, s, "smooth", seed=1032, cut={"rim": 3, "rough": 4})


# salon review B1: all visit long a closed shell stands where the mirror will be (salon-mirror-closed: its lower half
# and the coral stand; salon-mirror-lid: its upper half on the same 560x720 frame). At the end the lid swings up round
# its hinge (LID_HINGE, the seam's right end) and the mirror appears in its place.
SEAM_Y = 410
LID_HINGE = (462, SEAM_Y)


def shell_seam(k=9, x0=98, x1=462, y=SEAM_Y, dip=12):
    """The scalloped seam where the two halves meet, left to right: a bump down for every rib."""
    pts = []
    for i in range(k * 6 + 1):
        t = i / (k * 6)
        x = x0 + (x1 - x0) * t
        pts.append((x, y + dip * abs(math.sin(math.pi * t * k)) - 4 * math.sin(math.pi * t)))
    return pts


def salon_mirror_closed():
    """560x720: the shell's lower half (pearls peeping out of its seam, a glow inside) on a tall coral stand."""
    p = "smc-"
    # the coral stand: a stem and two branches with round tips, on a little mound of sand
    st = "M280,520 L280,708 M280,610 Q244,646 214,700 M280,610 Q316,650 350,702 M280,560 Q236,560 214,530 M280,590 Q326,586 350,556"
    s = G(stroke(st, CORALC_D, 26, ' transform="translate(0 4)"') + stroke(st, CORALC, 20), p + "cut")
    s += G(C(214, 530, 13, CORALC) + C(350, 556, 13, CORALC), p + "sh")
    s += G(P(wob(280, 708, 120, 14, .05, 1031, 18), SAND_D), p + "sh")
    # the lower half: a pearly bowl with ribs meeting at its foot
    seam = shell_seam()
    bowl = smooth(seam + [(450, SEAM_Y + 40), (410, SEAM_Y + 92), (340, SEAM_Y + 120), (280, SEAM_Y + 126), (220, SEAM_Y + 120), (150, SEAM_Y + 92), (110, SEAM_Y + 40)], 1 / 10)
    s += G(P(bowl, "#C9707F", ' transform="translate(0 6)"') + P(bowl, "#EE9CAB"), p + "cut")
    s += f'<clipPath id="{p}bc"><path d="{bowl}"/></clipPath><g clip-path="url(#{p}bc)">'
    s += "".join(stroke(f"M280,{SEAM_Y + 150} L{n(280 + (x - 280) * 1.1)},{SEAM_Y - 10}", "#C9707F", 6, ' opacity="0.5"') for x in range(98, 470, 40))
    s += P(f"M120,{SEAM_Y + 30} Q280,{SEAM_Y + 70} 440,{SEAM_Y + 30} Q280,{SEAM_Y + 52} 120,{SEAM_Y + 30}Z", "#FFE3E8", ' opacity="0.7"') + "</g>"
    # the light inside, peeping out of the seam, and the pearls caught in it
    s += E(280, SEAM_Y + 2, 150, 16, "#FFF2C8", ' opacity="0.85"')
    s += "".join(C(x, SEAM_Y + 4, 13, PEARL, ' stroke="#D9D2C4" stroke-width="1.5"') + C(x - 4, SEAM_Y, 4, WHITE) for x in (146, 206, 354, 414))
    s += "".join(C(x, SEAM_Y + 22, 11, PEARL, ' stroke="#D9D2C4" stroke-width="1.4"') + C(x - 3, SEAM_Y + 18, 3.4, WHITE) for x in (176, 240, 320, 384))
    return doc(p, 560, 720, s, "smooth", seed=1035, cut={"rim": 3, "rough": 4})


def salon_mirror_lid():
    """560x720 (the same frame): the shell's upper half, a ribbed pink dome, a starfish clasp on its front edge."""
    p = "sml-"
    seam = shell_seam()
    dome = []
    for i in range(1, 24):
        a = math.radians(180 + 180 * i / 24)
        dome.append((280 + math.cos(a) * 190, SEAM_Y - 8 + math.sin(a) * 214))
    lid = smooth(seam[::-1] + dome, 1 / 10)
    s = G(P(lid, SHELL_D, ' transform="translate(0 6)"') + P(lid, SHELL), p + "cut")
    s += f'<linearGradient id="{p}lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3E8" stop-opacity="0.75"/><stop offset="1" stop-color="#FFE3E8" stop-opacity="0"/></linearGradient>'
    s += f'<clipPath id="{p}lc"><path d="{lid}"/></clipPath><g clip-path="url(#{p}lc)">'
    s += P(lid, f"url(#{p}lg)")
    # ribs fanning out from the hinge behind it, each a raised band with a light edge
    for j in range(9):
        a = math.radians(-162 + 144 * (j + .5) / 9)
        x2, y2 = 280 + math.cos(a) * 260, SEAM_Y + 60 + math.sin(a) * 300
        s += stroke(f"M280,{SEAM_Y + 60} L{n(x2)},{n(y2)}", SHELL_D, 7, ' opacity="0.5"')
        s += stroke(f"M{n(280 + 6)},{SEAM_Y + 60} L{n(x2 + 6)},{n(y2)}", "#FFE9EC", 4, ' opacity="0.6"')
    s += "</g>"
    s += P(f"M150,{SEAM_Y - 120} Q230,{SEAM_Y - 210} 350,{SEAM_Y - 196}", "none", f' stroke="{SHELL_L}" stroke-width="14" stroke-linecap="round" opacity="0.7"')
    # pearls along its rim, a starfish clasp at the front
    s += "".join(C(x, y, 7, PEARL, ' stroke="#D9D2C4" stroke-width="1.2"') + C(x - 2, y - 2, 2.4, WHITE) for x, y in dome[2:-2:3])
    s += G(starfish(280, SEAM_Y - 6, 34, "#F4883C"), p + "sh")
    s += sparkle(400, SEAM_Y - 150, 13) + sparkle(170, SEAM_Y - 70, 9)
    return doc(p, 560, 720, s, "smooth", seed=1036, cut={"rim": 3, "rough": 4})


BENCH_SEATS = (0.2, 0.5, 0.8)
BENCH_SEAT_Y = 150   # in salon-bench: where a customer's frame y 684 goes (her tail rests on the bench)


def salon_bench():
    """1300x260: a long low bench of warm sand-coral stone with a pink scallop trim and three plump shell cushions."""
    p = "sbn-"
    SAND_B, SAND_BD, SAND_BL = "#F1D9B8", "#D9B98F", "#FBEBD3"
    # the stone: a soft slab, its front face a little darker under a lighter top
    top = smooth([(34, 148), (90, 116), (240, 104), (420, 110), (650, 102), (880, 110), (1060, 104), (1210, 116), (1268, 148), (1252, 234), (650, 250), (48, 234)])
    s = G(P(top, SAND_BD, ' transform="translate(0 7)"') + P(top, SAND_B), p + "cut")
    s += P(smooth([(54, 146), (240, 120), (650, 116), (1060, 120), (1248, 146), (1060, 140), (650, 136), (240, 140)]), SAND_BL, ' opacity="0.9"')
    front = smooth([(52, 180), (650, 196), (1248, 180), (1240, 230), (650, 246), (60, 230)])
    s += P(front, SAND_BD, ' opacity="0.35"')
    # the pink scallop trim along its front edge, a pearl in every dip
    trim = ""
    xs = list(range(70, 1240, 46))
    for j, x in enumerate(xs):
        y = 172 + 6 * math.sin(j * .5)
        trim += P(f"M{n(x - 24)},{n(y)} Q{n(x)},{n(y + 30)} {n(x + 24)},{n(y)}Z", SHELL_D, ' transform="translate(0 3)"') + P(f"M{n(x - 24)},{n(y)} Q{n(x)},{n(y + 30)} {n(x + 24)},{n(y)}Z", SHELL)
        trim += stroke(f"M{n(x)},{n(y + 2)} L{n(x)},{n(y + 16)}", SHELL_D, 3, ' opacity="0.5"')
        if j:
            trim += C(x - 23, y + 2, 6, PEARL, ' stroke="#D9D2C4" stroke-width="1.2"') + C(x - 25, y, 2, WHITE)
    s += G(trim, p + "sh")
    rr = random.Random(1041)
    s += "".join(C(rr.uniform(90, 1210), rr.uniform(206, 232), rr.uniform(2, 4), rr.choice((SAND_BD, SAND_BL)), ' opacity="0.7"') for _ in range(40))
    # three plump cushions, each a little scallop, standing clear above the girls' tails
    for i, f in enumerate(BENCH_SEATS):
        x = 1300 * f
        col, dark, light = ((SHELL, SHELL_D, "#FFE9EC"), (LILAC, "#9A7EBA", "#EFE6FA"), (TURQ_L, TURQ_D, "#DDF6F3"))[i]
        cush = smooth([(x - 176, 140), (x - 150, 104), (x - 90, 86), (x, 80), (x + 90, 86), (x + 150, 104), (x + 176, 140), (x + 120, 158), (x, 162), (x - 120, 158)])
        s += G(P(cush, dark, ' transform="translate(0 6)"') + P(cush, col), p + "sh")
        s += "".join(stroke(f"M{n(x + dx * .55)},{n(150)} Q{n(x + dx * .8)},{n(118)} {n(x + dx)},{n(96 + abs(dx) * .1)}", dark, 4, ' opacity="0.5"') for dx in (-150, -100, -50, 0, 50, 100, 150))
        s += P(f"M{n(x - 120)},{n(104)} Q{n(x - 40)},{n(84)} {n(x + 40)},{n(90)} Q{n(x - 30)},{n(96)} {n(x - 110)},{n(114)}Z", light, ' opacity="0.85"')
        s += C(x, 160, 9, PEARL, ' stroke="#D9D2C4" stroke-width="1.4"') + C(x - 3, 157, 3, WHITE)
    # a starfish and a scallop at the ends, a pearl pair, two sprigs of sea grass
    s += G(starfish(62, 214, 30, "#F3A65A") + scallop(1232, 236, 30, 36, SHELL, SHELL_D, SHELL_L, 6), p + "sh")
    s += G(C(1186, 230, 9, PEARL) + C(1166, 236, 7, PEARL), p + "sh")
    s += "".join(G(stroke(f"M{x},{252} Q{x - 8},{226} {x + 4},{206} M{x + 10},{252} Q{x + 16},{230} {x + 26},{214}", KELP, 7), p + "sh") for x in (360, 930))
    s += sparkle(300, 92, 12) + sparkle(1020, 88, 10)
    return doc(p, 1300, 260, s, "rough", seed=1051, cut={"rim": 3, "rough": 4})


def salon_vanity():
    """520x300: a little coral table with pots of colour, a brush pot and a pearl box (a crab may live in a pot)."""
    p = "svn-"
    s = G(stroke("M110,140 Q96,220 70,290 M110,140 Q130,220 150,290 M410,140 Q396,220 370,290 M410,140 Q430,220 450,290", CORALC_D, 22, ' transform="translate(0 4)"')
          + stroke("M110,140 Q96,220 70,290 M110,140 Q130,220 150,290 M410,140 Q396,220 370,290 M410,140 Q430,220 450,290", CORALC, 16), p + "cut")
    slab = wrect(40, 112, 440, 40, 18, 1.5, 1061)
    s += G(P(slab, "#C99A6A", ' transform="translate(0 5)"') + P(slab, "#E8C08A"), p + "cut")
    s += stroke("M56,122 L464,122", "#F6DDB0", 6, ' opacity="0.8"')
    for x, col, dark in ((110, "#F58FB4", "#D9668F"), (190, "#4FB8E0", "#2E8FBF"), (270, "#F7C948", "#D19A2A")):
        jar = wrect(x - 30, 64, 60, 52, 12, 1, x)
        s += G(P(jar, dark, ' transform="translate(0 4)"') + P(jar, col) + P(wrect(x - 32, 54, 64, 16, 7, 1, x + 1), PEARL) + E(x - 12, 84, 8, 14, WHITE, ' opacity="0.4"'), p + "sh")
    s += G(P(wrect(332, 52, 52, 64, 10, 1, 1062), TURQ_D) + P(wrect(334, 50, 48, 62, 10, 1, 1063), TURQ), p + "sh")
    s += "".join(stroke(f"M{x},{56} L{x + dx},{14}", col, 7) + C(x + dx, 12, 8, col2) for x, dx, col, col2 in ((346, -10, "#B99BD8", "#F9C8D2"), (358, 0, GOLD, "#F7F0FF"), (370, 10, "#F58FB4", "#E2D4F2")))
    s += G(scallop(436, 112, 34, 40, LILAC, "#9A7EBA", "#E2D4F2", 6) + C(436, 96, 7, PEARL), p + "sh") + sparkle(470, 56, 10)
    return doc(p, 520, 300, s, "rough", seed=1064, cut={"rim": 3, "rough": 4})


def sand_spot():
    """120x90: a damp patch of sand on her skin (the sponge rubs it off): flat and see-through, an uneven edge, coarse
    grains and two little shell bits; no paper rim, no shadow and no yellow, so it never reads as the sponge."""
    p = "ssp-"
    rr = random.Random(1071)
    pts = []
    for i in range(14):
        a = i / 14 * 2 * math.pi
        f = rr.uniform(.62, 1.0) if i % 3 else rr.uniform(.9, 1.08)
        pts.append((60 + math.cos(a) * 52 * f, 46 + math.sin(a) * 30 * f))
    s = P(smooth(pts), "#E9D5A8", ' opacity="0.75"')
    s += P(smooth([(x * .72 + 60 * .28 - 4, y * .7 + 46 * .3 - 3) for x, y in pts]), "#F3E4C2", ' opacity="0.55"')
    rg = random.Random(1073)
    grains = []
    while len(grains) < 15:
        x, y = rg.uniform(18, 102), rg.uniform(20, 72)
        if ((x - 60) / 48) ** 2 + ((y - 46) / 27) ** 2 < .8:
            grains.append((x, y))
    s += "".join(E(x, y, rg.uniform(2.6, 4.2), rg.uniform(2.2, 3.4), rg.choice(("#C9A86A", "#B8955A", "#FFF4D6", "#D8BC84"))) for x, y in grains)
    # two tiny bits of pink shell
    s += P("M30,38 L40,33 L42,42 Z", "#F6C9C0") + stroke("M33,38 L39,36", "#E3A79C", 1.4)
    s += P("M82,56 Q90,50 96,57 Q89,62 82,56Z", "#F6C9C0") + stroke("M85,56 L93,56", "#E3A79C", 1.4)
    return doc(p, 120, 90, s, "rough", seed=1074)


def weed_bit():
    """90x60: a little bit of seaweed caught in her hair (a tap plucks it out)."""
    p = "wbt-"
    s = stroke("M12,46 Q30,20 48,32 Q64,44 80,14", KELP_D, 16) + stroke("M12,46 Q30,20 48,32 Q64,44 80,14", KELP, 11)
    s += stroke("M40,30 Q36,14 46,8", KELP, 8) + stroke("M20,40 Q30,30 46,30", KELP_L, 3, ' opacity="0.8"')
    return doc(p, 90, 60, G(s, p + "sh"), "smooth", seed=1081, cut={"rim": 2, "rough": 2})


def icon_salon():
    """The salon's shell door: a shell hand mirror, a comb and a heart lipstick."""
    s = G(stroke("M96,112 L124,146", CORALC_D, 16) + stroke("M96,112 L124,146", CORALC, 11))
    s += scallop(80, 108, 50, 64, SHELL, SHELL_D, SHELL_L, 7)
    s += E(78, 76, 26, 24, "#BFE6EE") + P("M62,82 L82,58 L90,60 L70,86Z", WHITE, ' opacity="0.7"')
    s += G("".join(stroke(f"M{x},{118} L{x},{140}", "#9A7EBA", 4) for x in range(22, 62, 7)) + P("M18,108 L64,108 L64,120 L18,120Z", LILAC))
    s += heart(128, 46, .55, "#F27098") + sparkle(138, 92, 9, GOLD) + sparkle(30, 40, 8, WHITE)
    return icon_doc("dsl-", s, 156)


ITEMS = {
    **{f"hair-back-{k}": f for k, f in (("waves", hair_back_waves), ("curls", hair_back_curls), ("braid", hair_back_braid), ("bun", hair_back_bun), ("bob", hair_back_bob))},
    **{f"hair-front-{k}": f for k, f in (("waves", hair_front_waves), ("curls", hair_front_curls), ("braid", hair_front_braid), ("bun", hair_front_bun), ("bob", hair_front_bob))},
    **{f"hair-shine-{k}": f for k, f in (("waves", hair_shine_waves), ("curls", hair_shine_curls), ("braid", hair_shine_braid), ("bun", hair_shine_bun), ("bob", hair_shine_bob))},
    "tail-classic": tail_classic, "tail-frilly": tail_frilly, "tail-long": tail_long,
    "tail-classic-shine": tail_classic_shine, "tail-frilly-shine": tail_frilly_shine, "tail-long-shine": tail_long_shine,
    "top-shells": top_shells, "top-starfish": top_starfish, "top-frill": top_frill,
    "crown-pearl": crown_pearl, "crown-starfish": crown_starfish, "crown-coral": crown_coral, "clip-flower": clip_flower,
    "necklace-pearl": necklace_pearl, "necklace-star": necklace_star, "gem-star": gem_star, "gem-heart": gem_heart,
    "salon-sponge": tool_sponge, "salon-shower": tool_shower, "salon-spray": tool_spray, "spray-cap": spray_cap, "salon-comb": tool_comb,
    "tool-blush": tool_blush, "tool-shadow": tool_shadow, "tool-lipstick": tool_lipstick, "tool-glitter": tool_glitter,
    "shell-surprise": shell_surprise,
    "salon-chair": salon_chair, "salon-mirror": salon_mirror, "salon-mirror-closed": salon_mirror_closed, "salon-mirror-lid": salon_mirror_lid, "salon-bench": salon_bench, "salon-vanity": salon_vanity,
    "sand-spot": sand_spot, "weed-bit": weed_bit, "door-icon-salon": icon_salon,
}

# ---------------------------------------------------------------- the colours and the game's tints (ART_SALON)
DYE = {"pink": "#F58FB4", "purple": "#9B7BE0", "blue": "#4FB8E0", "gold": "#F2C14E", "seagreen": "#3FBFA0", "pearl": "#ECE0F6"}
PAINT = {"pink": "#F58FB4", "purple": "#9B7BE0", "blue": "#4FB8E0", "gold": "#F7C948"}
NATURAL_HAIR = {cid: c["hair"] for cid, c in gcu.CUSTOMERS.items()}
NATURAL_TAIL = {"marina": "#9A86E8", "coral": "#F28C7A", "pearl": "#6FCBD8"}
NATURAL_LIPS = {cid: c["lips"] for cid, c in gcu.CUSTOMERS.items()}
BASE = 0xE6 / 255   # T_BASE: the tinted art's main value


def tint_of(hexcol, base=BASE):
    """The tint that makes the tinted art's main value come out as `hexcol` (multiply: art x tint)."""
    r, g, b = rgb(hexcol)
    return hexc([min(255, v / base) for v in (r, g, b)])


def tints():
    hair = {k: tint_of(v) for k, v in DYE.items()} | {f"natural-{k}": tint_of(v) for k, v in NATURAL_HAIR.items()}
    tail = {k: tint_of(v) for k, v in DYE.items()} | {f"natural-{k}": tint_of(v) for k, v in NATURAL_TAIL.items()}
    lips = {k: tint_of(v, gcu.LIP_BASE) for k, v in PAINT.items()} | {f"natural-{k}": tint_of(v, gcu.LIP_BASE) for k, v in NATURAL_LIPS.items()}
    return dict(hair=hair, tail=tail, lips=lips, dye={k: tint_of(v) for k, v in DYE.items()},
                gemSlots=gcu.FACE_ANCHORS["gemSlots"], gemScale=0.5, sprayCap={"x": SPRAY_CAP[0], "y": SPRAY_CAP[1]},
                chairSeat={"x": CHAIR_SEAT[0], "y": CHAIR_SEAT[1]}, lidHinge={"x": LID_HINGE[0], "y": LID_HINGE[1]}, benchSeats=list(BENCH_SEATS), benchSeatY=BENCH_SEAT_Y)


def save(name, s):
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:24s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS.items():
        if not only or k in only:
            save(k, fn())
    with open(os.path.join(HERE, "salon-tints.json"), "w", encoding="utf8") as f:
        json.dump(tints(), f, indent=1)
    print("ART_SALON: chairSeat", CHAIR_SEAT, "benchSeats", BENCH_SEATS, "benchSeatY", BENCH_SEAT_Y, "mirrorWindow", MIRROR_WIN, "sprayCap", SPRAY_CAP, "lidHinge", LID_HINGE)

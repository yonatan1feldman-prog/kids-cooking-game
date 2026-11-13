# The premium round, PR 2 ("light and depth", research/premium-spec.md section 2): the dressing that gives each world
# depth without moving by itself. Style B on the shared kit (pb.py).
#  * counter-cloth (1300x420): a plain gingham oilcloth lying under the recipe's work area (stage.cloth).
#  * fg-* : one or two big things in the very front of each world, only inside the no-touch strips (the bottom 8%,
#    the side 4%), shown a little larger and a little darker than the play things (core/scenery.ts addForeground):
#    fg-lemons + fg-napkin (kitchen), fg-leaves (garden), fg-basket (market), fg-fence (farm), fg-desk (clinic).
#    Each is drawn with its bottom edge on the frame's bottom edge (the screen's bottom), and cut off by it.
# Run: python images-b/tools/gen_dressing.py   (writes into images-b/dressing/), then copy the SVGs into
# public/assets/images and bake the WebPs.
import sys, os, math, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import *  # noqa: F401,F403
import pb

SUB = "dressing"
LEMON = "#F7D348"; LEMON_D = "#E2AF26"; LEMON_L = "#FCE88C"
LEAF = "#5E9E46"; LEAF_D = "#3F7A30"; LEAF_L = "#86C062"
BOWL = "#4F8FB0"; BOWL_D = "#3A6F8C"; BOWL_L = "#7FB4CF"
WICKER = "#D9A35E"; WICKER_D = "#B07A3C"; WICKER_L = "#EBC386"
CHECK = "#E2604A"


def wr(x, y, w, h, rad, j=1.2, seed=1, step=40):
    return pb.wrect(x, y, w, h, rad, j, seed, step)


def doc(p, w, h, body, material="default", seed=3, cut=None, sh=(5, 4.5, .3)):
    d = std_defs(p, material, seed=seed, sh=sh, cut=cut or {"rim": 2.4, "rough": 5})
    return svg(w, h, d, G(body, p + "gr"))


def counter_cloth():
    """1300x420: a gingham oilcloth lying flat on the counter, a touch narrower at the back (seen from above-front).
    Calm and even (smooth paper, a soft sage check) so the work on it stands out."""
    p = "ccl-"
    W, H = 1300, 420
    top = 30
    pts = [(46, top), (W - 46, top), (W - 14, H - 26), (14, H - 26)]
    edge = (f"M70,{top} L{W - 70},{top} Q{W - 44},{top} {W - 42},{top + 24} L{W - 18},{H - 52} Q{W - 16},{H - 26} {W - 44},{H - 26} "
            f"L44,{H - 26} Q16,{H - 26} 18,{H - 52} L42,{top + 24} Q44,{top} 70,{top}Z")
    base = "#F6F1E2"
    stripe = mix(SAGE, base, .45)
    defs_clip = f'<clipPath id="{p}cl"><path d="{edge}"/></clipPath>'
    check = ""
    # horizontal bands (rows get a little taller toward the front), vertical bands fan out a little toward the front
    ys = [top + (H - 26 - top) * (i / 7) ** 1.08 for i in range(8)]
    for i in range(0, 7, 2):
        check += rect_(-10, ys[i], W + 20, ys[i + 1] - ys[i], stripe, .55)
    cols = 16
    for i in range(0, cols, 2):
        xt0, xt1 = 46 + (W - 92) * i / cols, 46 + (W - 92) * (i + 1) / cols
        xb0, xb1 = 14 + (W - 28) * i / cols, 14 + (W - 28) * (i + 1) / cols
        check += P(f"M{n(xt0)},{top - 10} L{n(xt1)},{top - 10} L{n(xb1)},{H} L{n(xb0)},{H}Z", stripe, ' opacity="0.55"')
    body = G(P(edge, base) + G(check, None, f' clip-path="url(#{p}cl)"'), p + "cut")
    # a soft hem line just inside the edge
    hem = (f"M78,{top + 14} L{W - 78},{top + 14} Q{W - 58},{top + 14} {W - 56},{top + 34} L{W - 34},{H - 58} Q{W - 32},{H - 40} {W - 52},{H - 40} "
           f"L52,{H - 40} Q32,{H - 40} 34,{H - 58} L56,{top + 34} Q58,{top + 14} 78,{top + 14}Z")
    body += P(hem, "none", f' stroke="{mix(SAGE_D, base, .3)}" stroke-width="3" stroke-dasharray="14 10" opacity="0.5"')
    d = std_defs(p, "smooth", seed=41, sh=(5, 5, .22), cut={"rim": 2.6, "rough": 5, "freq": .12}) + defs_clip
    return svg(W, H, d, G(body, p + "gr"))


def rect_(x, y, w, h, fill, op=1.0):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{fill}" opacity="{op}"/>'


def lemon(cx, cy, rx, ry, rot, seed):
    s = P(wob(cx, cy, rx, ry, .04, seed, 18, rot), LEMON)
    a = math.radians(rot)
    tip = (cx + math.cos(a) * rx * .98, cy + math.sin(a) * rx * .98)
    s += P(wob(tip[0], tip[1], rx * .16, ry * .2, .1, seed + 1, 10, rot), LEMON_D)
    s += P(wob(cx - rx * .25, cy - ry * .35, rx * .42, ry * .18, .1, seed + 2, 12, rot - 8), LEMON_L, ' opacity="0.8"')
    s += P(wob(cx + rx * .1, cy + ry * .45, rx * .6, ry * .2, .1, seed + 3, 12, rot), LEMON_D, ' opacity="0.35"')
    return s


def leaf(x, y, L, wdt, ang, col, seed, vein=True):
    """A leaf from its stem (x, y) pointing at ang degrees."""
    a = math.radians(ang)
    ux, uy = math.cos(a), math.sin(a)
    vx, vy = -uy, ux
    pts = []
    for i in range(9):
        t = i / 8
        w = math.sin(math.pi * t) ** .8 * wdt * (1 + random.Random(seed + i).uniform(-.06, .06))
        pts.append((x + ux * L * t + vx * w, y + uy * L * t + vy * w))
    for i in range(7, 0, -1):
        t = i / 8
        w = math.sin(math.pi * t) ** .8 * wdt * (1 + random.Random(seed + 20 + i).uniform(-.06, .06))
        pts.append((x + ux * L * t - vx * w, y + uy * L * t - vy * w))
    s = P(smooth(pts), col)
    if vein:
        s += stroke(f"M{n(x)},{n(y)} Q{n(x + ux * L * .5 + vx * 6)},{n(y + uy * L * .5 + vy * 6)} {n(x + ux * L * .9)},{n(y + uy * L * .9)}", mix(col, "#FFFFFF", .3), 3.5, ' opacity="0.7"')
    return s


def fg_lemons():
    """360x230: a blue bowl of lemons standing on the counter's front edge (its foot is below the frame's bottom)."""
    p = "fgl-"
    W, H = 360, 230
    s = ""
    # lemons heaped in the bowl (behind the bowl's front)
    s += G(lemon(120, 108, 62, 44, -16, 11) + lemon(236, 100, 64, 45, 14, 21) + lemon(178, 72, 60, 43, -4, 31), p + "sh")
    s += G(leaf(150, 70, 96, 22, -150, LEAF, 41) + leaf(214, 66, 90, 20, -38, LEAF_D, 51), p + "sh")
    # the bowl: a wide paper bowl with a rim, the dots of its pattern
    bowl = f"M18,128 Q180,150 342,128 Q336,212 290,{H + 20} L70,{H + 20} Q24,212 18,128Z"
    s += G(P(bowl, BOWL) + P(f"M18,128 Q180,150 342,128 Q340,146 330,152 Q180,170 30,152 Q20,146 18,128Z", BOWL_L)
           + "".join(C(70 + i * 44, 190 + (i % 2) * 8, 9, CREAM, ' opacity="0.9"') for i in range(6))
           + P(f"M290,150 Q326,180 300,{H + 20} L276,{H + 20} Q300,190 282,152Z", BOWL_D, ' opacity="0.6"'), p + "cut")
    return doc(p, W, H, s, "default", seed=61)


def fg_napkin():
    """300x210: a checked napkin lying on the counter's front edge and hanging over it (the fold at y 120)."""
    p = "fgn-"
    W, H = 300, 210
    fold = 118
    top = f"M30,40 L262,30 Q286,80 296,{fold} L6,{fold} Q14,78 30,40Z"
    hang = f"M6,{fold} L296,{fold} Q290,170 300,{H + 10} L0,{H + 10} Q10,170 6,{fold}Z"
    cl = f'<clipPath id="{p}c1"><path d="{top}"/></clipPath><clipPath id="{p}c2"><path d="{hang}"/></clipPath>'
    chk = "".join(rect_(x, -10, 26, H + 30, CHECK, .55) for x in range(10, 300, 52))
    chk_t = "".join(rect_(-10, y, W + 20, 18, CHECK, .55) for y in (48, 84))
    chk_h = "".join(rect_(-10, y, W + 20, 24, CHECK, .55) for y in (fold + 22, fold + 70))
    s = G(P(top, WHITE) + G(chk + chk_t, None, f' clip-path="url(#{p}c1)"'), p + "cut")
    s += G(P(hang, mix(WHITE, PAPER, .35)) + G(chk + chk_h, None, f' clip-path="url(#{p}c2)"')
           + P(f"M6,{fold} L296,{fold} L296,{fold + 10} L6,{fold + 10}Z", SH, ' opacity="0.12"'), p + "cut")
    d = std_defs(p, "smooth", seed=71, sh=(5, 4.5, .3), cut={"rim": 2.4, "rough": 5}) + cl
    return svg(W, H, d, G(s, p + "gr"))


def fg_leaves():
    """440x330: a clump of big garden leaves growing up from the bottom corner (drawn for the left corner)."""
    p = "fgv-"
    W, H = 440, 330
    s = ""
    specs = [(40, H + 10, 300, 70, -62, LEAF_D), (110, H + 10, 260, 62, -84, LEAF), (20, H, 280, 66, -38, LEAF_L),
             (170, H + 10, 230, 56, -66, mix(LEAF, LEAF_L, .4)), (0, H - 20, 220, 58, -18, LEAF_D), (220, H + 10, 200, 48, -48, LEAF)]
    for i, (x, y, L, w, a, c) in enumerate(specs):
        s += G(leaf(x, y, L, w, a, c, 100 + i * 7), p + "cut")
    # two daisies peeking out
    for cx, cy, sd in ((250, 120, 3), (330, 190, 4)):
        petals = "".join(P(wob(cx + math.cos(k * .785) * 18, cy + math.sin(k * .785) * 18, 15, 8, .1, sd * 10 + k, 10, math.degrees(k * .785)), WHITE) for k in range(8))
        s += G(stroke(f"M{cx},{cy} Q{cx - 20},{cy + 90} {cx - 50},{H + 10}", LEAF_D, 7) + petals + C(cx, cy, 11, MUSTARD), p + "sh")
    return doc(p, W, H, s, "default", seed=81)


def fg_basket():
    """380x240: a wicker basket of apples and a loaf, standing on the market counter's front edge."""
    p = "fgb-"
    W, H = 380, 240
    s = ""
    s += G(P(wob(250, 96, 92, 40, .05, 11, 18, -10), CRUST) + "".join(stroke(f"M{x},{80 + (x - 200) * -.15} q12,-14 24,0", CRUST_D, 4) for x in (196, 236, 276))
           + P(wob(240, 82, 60, 12, .1, 12, 12, -10), CRUST_L, ' opacity="0.7"'), p + "sh")
    for i, (cx, cy) in enumerate(((96, 116), (156, 104), (126, 76))):
        s += G(P(wob(cx, cy, 36, 33, .05, 20 + i, 16), RED) + P(wob(cx - 10, cy - 12, 12, 7, .1, 30 + i, 10, -20), RED_L, ' opacity="0.8"')
               + stroke(f"M{cx},{cy - 30} q2,-14 8,-18", WALNUT_D, 4) + leaf(cx + 6, cy - 40, 30, 9, -30, LEAF, 40 + i, False), p + "sh")
    body = f"M14,120 L366,120 Q356,190 330,{H + 20} L50,{H + 20} Q24,190 14,120Z"
    cl = f'<clipPath id="{p}cl"><path d="{body}"/></clipPath>'
    weave = "".join(rect_(-10, y, W + 20, 9, WICKER_D, .5) for y in range(134, H + 20, 22))
    weave += "".join(rect_(x, 110, 7, H, WICKER_L, .45) for x in range(30, 360, 34))
    s += G(P(body, WICKER) + G(weave, None, f' clip-path="url(#{p}cl)"') + P(wr(6, 108, 368, 26, 12, 1, 51), WICKER_D), p + "cut")
    d = std_defs(p, "rough", seed=91, sh=(5, 4.5, .3), cut={"rim": 2.4, "rough": 5}) + cl
    return svg(W, H, d, G(s, p + "gr"))


def fg_fence():
    """300x560: a close fence post with the ends of its rails and a tuft of grass and flowers at its foot (left edge)."""
    p = "fgf-"
    W, H = 300, 560
    s = ""
    # (the rails run off to the left, behind the screen's edge: only the post stands in the side strip)
    s += G(P(wr(-40, 210, 120, 34, 10, 1.4, 1), mix(WOOD, WOOD_D, .2)) + P(wr(-40, 360, 120, 34, 10, 1.4, 2), mix(WOOD, WOOD_D, .2)), p + "sh")
    post = f"M40,{H + 20} L40,150 Q40,128 60,116 L86,100 L112,116 Q132,128 132,150 L132,{H + 20}Z"
    s += G(P(post, WOOD_L) + P(wr(48, 130, 22, H - 20, 8, 1, 4), mix(WOOD_L, CREAM, .3), ' opacity="0.6"')
           + P(wob(100, 300, 9, 5, .1, 5, 10), WOOD_D, ' opacity="0.5"') + P(wob(70, 440, 12, 6, .1, 6, 10), WOOD_D, ' opacity="0.5"')
           + P("M86,100 L112,116 Q132,128 132,150 L132,170 Q110,150 86,146Z", WOOD_D, ' opacity="0.3"'), p + "cut")
    grass = ""
    rr = random.Random(7)
    for i in range(16):
        x = rr.uniform(-10, 290); h = rr.uniform(70, 150); a = rr.uniform(-18, 18)
        grass += P(f"M{n(x - 12)},{H + 5} Q{n(x + a * .5)},{n(H - h * .6)} {n(x + a)},{n(H - h)} Q{n(x + 4 + a * .3)},{n(H - h * .5)} {n(x + 12)},{H + 5}Z", rr.choice([GREEN, GREEN_D, GREEN_L]))
    for cx, cy, sd in ((200, H - 120, 1), (250, H - 80, 2)):
        grass += "".join(P(wob(cx + math.cos(k * 1.256) * 11, cy + math.sin(k * 1.256) * 11, 10, 6, .1, sd * 9 + k, 10, math.degrees(k * 1.256)), MUSTARD if sd == 1 else WHITE) for k in range(5)) + C(cx, cy, 7, CORAL)
    s += G(grass, p + "sh")
    return doc(p, W, H, s, "rough", seed=101)


def fg_desk():
    """420x250: the corner of the nurse's white desk with a jar of tongue sticks and a little plant (left corner)."""
    p = "fgd-"
    W, H = 420, 250
    s = ""
    # the jar
    s += G("".join(P(wr(118 + i * 18, 40 + (i % 2) * 10, 14, 110, 7, .6, 10 + i), mix(WOOD_L, CREAM, .4)) for i in range(4))
           + P(wr(100, 96, 98, 96, 18, 1, 20), mix("#CFE7EC", WHITE, .2)) + P(wr(100, 96, 98, 20, 8, .6, 21), TEAL_L, ' opacity="0.8"'), p + "sh")
    # a little potted plant
    s += G(leaf(286, 110, 70, 18, -120, LEAF, 31) + leaf(290, 110, 76, 18, -60, LEAF_L, 32) + leaf(288, 112, 60, 16, -92, LEAF_D, 33)
           + P("M250,112 L330,112 L318,190 L262,190Z", CORAL) + P(wr(244, 104, 92, 18, 7, .6, 34), CORAL_D), p + "sh")
    # the desk's corner: its top seen from the front, and its front face
    s += G(P(f"M-20,182 L400,170 Q412,176 412,192 L412,{H + 20} L-20,{H + 20}Z", "#F4F6F2")
           + P("M-20,182 L400,170 Q412,176 412,192 L-20,204Z", WHITE) + P(f"M-20,214 L412,206 L412,212 L-20,220Z", TEAL_L, ' opacity="0.7"'), p + "cut")
    return doc(p, W, H, s, "smooth", seed=111)


ITEMS = {"counter-cloth": counter_cloth, "fg-lemons": fg_lemons, "fg-napkin": fg_napkin, "fg-leaves": fg_leaves,
         "fg-basket": fg_basket, "fg-fence": fg_fence, "fg-desk": fg_desk}


def main():
    names = sys.argv[1:] or list(ITEMS)
    for k in names:
        path, size = write(k, ITEMS[k](), SUB)
        print(f"{k:16s} {size / 1024:6.1f} KB")


if __name__ == "__main__":
    main()

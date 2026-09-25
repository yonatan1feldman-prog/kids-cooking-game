# images-b-pancakes, part A: the batter in the prep bowl (pancake-batter-0..3), the cooktop (stove-top, stove-knob-off/-on, flame),
# the pan, the ladle and the pan-sized family (batter-puddle-1..3, pancake-bubbles, pancake-golden).
# Run: python tools/gen_pancakes_a.py [names...]   (writes into images-b-pancakes/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pancakekit import *  # noqa: F401,F403
import gen_cookies_a as CA

YOLK_AT = CA.YOLK_ON_MOUND        # (372, 150): where egg-3's drop point lands (the cookie anchor, re-used)
FLOUR_AT = (300, 150)             # top of the flour island on stage 0 (flour-bag stream target)


# ================= BATTER STAGES (640x520 = prep-bowl frame; stack prep-bowl-back -> stage -> prep-bowl-front) =================
def clip_open(p, inner):
    return (f'<clipPath id="{p}c"><ellipse cx="{IC[0]}" cy="{IC[1]}" rx="{IRX - 2}" ry="{IRY - 2}"/></clipPath>'
            + G(inner, None, f' clip-path="url(#{p}c)"'))


def lump(x, y, s, seed, col=None, shade=None):
    col, shade = col or FLOUR, shade or FLOUR_D
    return P(wob(x + s * .1, y + s * .3, s * 1.1, s * .7, .15, seed, 10), shade) + P(wob(x, y, s, s * .62, .16, seed + 50, 10), col) \
        + P(wob(x - s * .3, y - s * .22, s * .4, s * .18, .2, seed + 90, 8), WHITE, ' opacity="0.9"')


def batter(stage):
    p = f"pb{stage}-"
    r = random.Random(70 + stage)
    L = []
    if stage == 0:       # flour + milk + egg, not stirred: a flour island in a milk pool, the whole yolk on it, floating lumps
        pool = P(wob(IC[0], 204, 240, 58, .02, 3, 30), MILKP_D) + P(wob(IC[0] - 6, 198, 232, 50, .02, 4, 30), MILKP)
        pool += P(wob(IC[0] + 90, 214, 90, 16, .1, 5, 16), MILKP_D, ' opacity="0.5"')
        pool += P("M96,190 Q150,160 250,152 Q160,172 112,200Z", WHITE) + P("M420,210 Q490,206 540,188 Q500,218 430,220Z", WHITE, ' opacity="0.9"')   # milk shine
        m = CA.mound(300, 210, 176, 66, 7)
        isl = P(smooth([(x, y + 8) for x, y in m]), mix(FLOUR_D, "#B89A70", .35)) + P(smooth(m), mix(FLOUR, "#F6E9CF", .6))      # review fix: warm flour on cool milk
        isl += P("M150,196 Q190,150 268,140 Q210,164 172,204Z", WHITE, ' opacity="0.95"') + P("M330,146 Q420,160 460,196 Q410,180 350,168Z", FLOUR_D, ' opacity="0.7"')
        lumps = "".join(lump(x, y, s, i) for i, (x, y, s) in enumerate(((108, 206, 14), (500, 196, 16), (470, 226, 11), (160, 232, 12), (540, 214, 10), (404, 232, 13))))
        yx, yy = YOLK_AT
        yolk = C(yx + 2, yy + 5, 33, YOLK_D) + C(yx, yy, 31, YOLK) + P(wob(yx - 10, yy - 10, 12, 7, .1, 5, 10, -30), YOLK_L) + C(yx - 14, yy - 13, 4.5, WHITE)
        yolk = P(wob(yx + 6, yy + 12, 52, 20, .08, 9, 16), "#FFFFFF", f' opacity="0.8" stroke="{MILKP_D}" stroke-width="2"') + yolk      # a bit of egg white
        L.append(clip_open(p, G(pool, p + "sh")) + G(isl + lumps, p + "sh") + G(yolk, p + "sh"))
    elif stage == 1:     # first stir: yolk streaks swirling through milk, lots of flour lumps
        pool = P(wob(IC[0], 204, 240, 58, .02, 6, 30), mix(MILKP_D, BAT_D, .4)) + P(wob(IC[0] - 6, 198, 232, 50, .02, 7, 30), mix(MILKP, BAT, .35))
        sw = ""
        for i, (rx, ry, a0, col, w) in enumerate(((180, 36, 20, YOLK, 16), (120, 24, 200, YOLK_L, 12), (70, 14, 90, YOLK, 10), (206, 44, 250, mix(YOLK, BAT, .5), 10))):
            pts = [(IC[0] + math.cos(math.radians(a)) * rx * (1 - (a - a0) / 900), 196 + math.sin(math.radians(a)) * ry * (1 - (a - a0) / 900)) for a in range(a0, a0 + 250, 18)]
            sw += stroke("M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts), col, w, ' opacity="0.9"')
        lumps = ""
        for i in range(24):
            a, rr = r.uniform(0, 6.283), math.sqrt(r.random())
            x, y = IC[0] + math.cos(a) * rr * 200, 196 + math.sin(a) * rr * 44
            lumps += lump(x, y, r.uniform(9, 17), 100 + i)
        L.append(clip_open(p, G(pool + sw, p + "sh") + G(lumps, p + "sh")))
    elif stage == 2:     # nearly mixed: pale yellow batter, a few small lumps, one swirl
        pool = P(wob(IC[0], 202, 242, 60, .02, 8, 30), BAT_D) + P(wob(IC[0] - 6, 196, 234, 52, .02, 9, 30), mix(BAT, MILKP, .25))
        pool += P(wob(IC[0] - 70, 184, 110, 22, .06, 10, 18), mix(BAT_L, MILKP, .3), ' opacity="0.8"')
        spiral = [(IC[0] + math.cos(t) * (18 + t * 26), 196 + math.sin(t) * (4 + t * 6)) for t in [i * .35 for i in range(22)]]
        sw = stroke("M" + " L".join(f"{n(x)},{n(y)}" for x, y in spiral), BAT_D, 6, ' opacity="0.7"')
        lumps = "".join(lump(x, y, s, 200 + i) for i, (x, y, s) in enumerate(((150, 206, 9), (236, 222, 8), (420, 186, 10), (498, 210, 8), (352, 226, 7), (270, 170, 7))))
        L.append(clip_open(p, G(pool + sw, p + "sh") + G(lumps, p + "sh")))
    else:                # smooth runny batter: one level glossy pool with a ribbon folding onto the surface
        pool = P(wob(IC[0], 198, 250, 64, .012, 11, 32), BAT_D) + P(wob(IC[0] - 4, 193, 244, 57, .012, 12, 32), BAT)
        pool += P(wob(IC[0] - 60, 180, 150, 26, .04, 13, 22), BAT_L, ' opacity="0.8"')
        spiral = [(IC[0] + 24 + math.cos(t) * (10 + t * 24), 200 + math.sin(t) * (3 + t * 5.6)) for t in [i * .3 for i in range(26)]]
        rib = stroke("M" + " L".join(f"{n(x)},{n(y)}" for x, y in spiral), BAT_D, 9, ' opacity="0.55"')
        rib += stroke("M" + " L".join(f"{n(x)},{n(y - 3)}" for x, y in spiral), BAT_L, 5, ' opacity="0.95"')
        gloss = P("M140,176 Q200,150 300,146 Q220,160 160,186Z", WHITE, ' opacity="0.85"') + C(452, 168, 5, WHITE, ' opacity="0.8"') + C(470, 176, 3, WHITE, ' opacity="0.8"')
        bub = "".join(C(x, y, s, BAT_D, ' opacity="0.6"') + C(x - 1, y - 1, s * .6, BAT_L) for x, y, s in ((210, 214, 5), (230, 222, 3.5), (430, 214, 4.5)))
        L.append(clip_open(p, G(pool, p + "sh") + rib + gloss + bub))
    return doc(p, 640, 520, "".join(L), material="smooth", seed=400 + stage, sh=(3, 3, .3))


# ================= STOVE TOP (1200x920, cream enamel cooktop seen from above; big burner under the pan) =================
def burner(p, cx, cy, k, arms=6):
    g = C(cx, cy, 300 * k, HOB_D) + C(cx - 4 * k, cy - 6 * k, 288 * k, mix(HOB, HOB_D, .45))                           # drip tray
    g += C(cx, cy, 128 * k, GRATE) + C(cx, cy, 104 * k, mix(GRATE, GRATE_L, .35))
    g += "".join(C(cx + math.cos(i / 16 * 6.283) * 116 * k, cy + math.sin(i / 16 * 6.283) * 116 * k, 5 * k, "#2A2624") for i in range(16))   # gas ports
    g += C(cx, cy, 78 * k, GRATE) + C(cx - 8 * k, cy - 10 * k, 60 * k, GRATE_L, ' opacity="0.8"')
    arm = ""
    for i in range(arms):
        a = i / arms * 6.283 + .26
        x0, y0, x1, y1 = cx + math.cos(a) * 146 * k, cy + math.sin(a) * 146 * k, cx + math.cos(a) * 430 * k, cy + math.sin(a) * 430 * k
        arm += stroke(f"M{n(x0)},{n(y0)} L{n(x1)},{n(y1)}", GRATE, 24 * k) + stroke(f"M{n(x0)},{n(y0 - 5 * k)} L{n(x1)},{n(y1 - 5 * k)}", GRATE_L, 7 * k, ' opacity="0.7"')
    return g, arm


def stove_top():
    p = "st-"
    W, H = STOVE
    L = [G(P(wrect(22, 40, W - 36, H - 48, 56, 1.5, 1, 40), SH, ' opacity="0.35"'), p + "bl")]
    L.append(G(P(wrect(16, 40, W - 32, H - 50, 56, 1.2, 2, 40), TEAL), p + "cut"))                         # front band (thickness)
    L.append(P(wrect(16, 820, W - 32, 50, 24, .8, 3, 40), TEAL_D, ' opacity="0.5"'))
    top = wrect(16, 16, W - 32, 826, 56, 1.2, 4, 40)
    L.append(P(top, HOB))
    L.append(f'<clipPath id="{p}t"><path d="{top}"/></clipPath>'
             + G(G(P("M16,16 L700,16 Q300,260 16,560Z", HOB_L, ' opacity="0.8"') + P("M1184,842 L600,842 Q1000,640 1184,380Z", HOB_D, ' opacity="0.55"'), p + "bl"), None, f' clip-path="url(#{p}t)"'))
    L.append(P(wrect(46, 46, W - 92, 766, 38, 1, 5, 40), "none", f' stroke="{TEAL_L}" stroke-width="6" opacity="0.8"'))
    b1, a1 = burner(p, *BURNER, 1.0)
    b2, a2 = burner(p, *BURNER2, .36, 4)
    L.append(G(b1 + b2, p + "sh"))
    L.append(G(a1 + a2, p + "sh"))
    kx, ky = KNOB_SEAT                                                                                        # the knob's recess
    L.append(C(kx, ky, 128, HOB_D) + C(kx - 3, ky - 4, 120, mix(HOB, HOB_D, .3)))
    return doc(p, W, H, "".join(L), material="default", seed=411, sh=(5, 4, .33), blur=10, paper={"fibre": .09, "tooth": .35})


# ================= STOVE KNOB (280x280, one frame; centre (140,140); off = pointer up, on = pointer right + lit lamp) =================
def flame_icon(cx, cy, s, lit):
    """Three little flame tongues (the 'on' mark). Review fix: the single blue teardrop read as a water drop."""
    o, y = (FL_O, FL_Y) if lit else ("#B9B2A8", "#D8D2CA")
    g = ""
    for dx, h, w in ((-9, 20, 7), (0, 28, 9), (9, 20, 7)):
        x = cx + dx * s
        g += P(f"M{n(x - w * s)},{n(cy + 12 * s)} Q{n(x - w * s)},{n(cy + (12 - h * .5) * s)} {n(x)},{n(cy + (12 - h) * s)} Q{n(x + w * s)},{n(cy + (12 - h * .5) * s)} {n(x + w * s)},{n(cy + 12 * s)}Z", o)
    g += P(f"M{n(cx - 5 * s)},{n(cy + 12 * s)} Q{n(cx - 5 * s)},{n(cy + 2 * s)} {n(cx)},{n(cy - 6 * s)} Q{n(cx + 5 * s)},{n(cy + 2 * s)} {n(cx + 5 * s)},{n(cy + 12 * s)}Z", y)
    g += P(f"M{n(cx - 14 * s)},{n(cy + 12 * s)} L{n(cx + 14 * s)},{n(cy + 12 * s)} L{n(cx + 14 * s)},{n(cy + 16 * s)} L{n(cx - 14 * s)},{n(cy + 16 * s)}Z", FL_B if lit else "#B9B2A8")
    return g


def knob(on):
    p = "kn1-" if on else "kn0-"
    cx, cy = KNOB_C
    L = []
    if on:
        L.append(G(C(cx, cy, 134, FL_Y, ' opacity="0.45"'), p + "bl"))                                       # warm glow: the stove is on
    L.append(G(C(cx, cy, 124, HOB_D), p + "cut"))
    L.append(C(cx - 2, cy - 3, 118, HOB_L))
    L.append(C(cx, 40, 8, "#8A817A"))                                                                          # off mark (top)
    L.append(flame_icon(238, cy, 1.25, on))                                                                     # on mark (right)
    lx, ly = cx - 74, cy + 74                                                                                  # indicator lamp
    if on:
        L.append(G(C(lx, ly, 22, FL_O, ' opacity="0.8"'), p + "bl") + C(lx, ly, 12, "#E0641E") + C(lx, ly, 9.5, FL_Y) + C(lx - 3, ly - 3, 3.5, WHITE))
    else:
        L.append(C(lx, ly, 12, "#6E6660") + C(lx, ly, 9.5, "#A69E96") + C(lx - 3, ly - 3, 3, "#D6D0C8"))
    rot = 90 if on else 0
    k = G(C(cx, cy + 4, 90, CORAL_D), p + "sh2") + C(cx, cy, 86, CORAL) + P(wob(cx - 24, cy - 28, 44, 30, .06, 3, 16, -30), CORAL_L, ' opacity="0.55"')
    bar = (P(wrect(cx - 26, cy - 84, 52, 168, 26, .5, 5), CORAL_D) + P(wrect(cx - 23, cy - 88, 46, 162, 23, .4, 6), mix(CORAL, CORAL_L, .5))
           + P(wrect(cx - 12, cy - 80, 10, 120, 5, .3, 7), WHITE, ' opacity="0.45"')
           + P(f"M{cx},{cy - 84} L{cx + 13},{cy - 60} L{cx - 13},{cy - 60}Z", WHITE))                          # pointer (white tip)
    L.append(k + G(f'<g transform="rotate({rot} {cx} {cy})">{bar}</g>', p + "sh"))
    return doc(p, KNOB_BOX, KNOB_BOX, "".join(L), material="smooth", seed=421 + on, sh=(4, 3.5, .33), sh2=(6, 5, .3), blur=6)


# ================= FLAME (1000x1000, centre (500,500) = pan disc centre at the pan's scale; drawn UNDER the pan) =================
def flame():
    p = "fl-"
    cx, cy = FLAME_C
    L = [G(P(ring_d(cx, cy, FLAME_OUT - 20, FLAME_IN), FL_BL, ' opacity="0.45" fill-rule="evenodd"'), p + "bl")]
    tong = ""
    N = 22                                                               # review fix: round, overlapping tongues (the sharp spikes read as petals / a sun)
    for i in range(N):
        a = i / N * 360
        tip = FLAME_OUT if i % 2 == 0 else FLAME_OUT - 22
        y0, y1, w = cy - FLAME_IN, cy - tip, 40
        h = y0 - y1
        c = 8 if i % 2 else -8                                           # the tip leans a little, alternately
        t = (P(f"M{cx - w},{y0} C{cx - w},{y0 - h * .45} {cx - w * .5 + c},{y1 + h * .3} {cx + c},{y1} C{cx + w * .5 + c},{y1 + h * .3} {cx + w},{y0 - h * .45} {cx + w},{y0}Z", FL_B)
             + P(f"M{cx - w * .6},{y0} C{cx - w * .6},{y0 - h * .4} {cx - w * .3 + c},{y1 + h * .4} {cx + c * .8},{y1 + h * .16} C{cx + w * .3 + c},{y1 + h * .4} {cx + w * .6},{y0 - h * .4} {cx + w * .6},{y0}Z", FL_BL, ' opacity="0.9"')
             + P(f"M{cx - w * .42},{y0 - h * .22} C{cx - w * .44},{y0 - h * .55} {cx - w * .2 + c},{y1 + h * .3} {cx + c * .7},{y1 + h * .12} C{cx + w * .2 + c},{y1 + h * .3} {cx + w * .44},{y0 - h * .55} {cx + w * .42},{y0 - h * .22} Q{cx},{y0 - h * .12} {cx - w * .42},{y0 - h * .22}Z", FL_O)
             + P(f"M{cx - w * .2},{y0 - h * .3} C{cx - w * .2},{y0 - h * .55} {cx + c * .4},{y1 + h * .38} {cx + c * .5},{y1 + h * .3} C{cx + w * .2},{y0 - h * .55} {cx + w * .2},{y0 - h * .3} {cx + w * .2},{y0 - h * .3} Q{cx},{y0 - h * .24} {cx - w * .2},{y0 - h * .3}Z", FL_Y))
        tong += f'<g transform="rotate({n(a)} {cx} {cy})">{t}</g>'
    L.append(G(tong, p + "sh"))
    return doc(p, FLAME_BOX, FLAME_BOX, "".join(L), material="smooth", seed=431, sh=(2, 2, .2), blur=12)


# ================= PAN (1240x800, top view; disc centre (400,400), outer rim r 372, cooking surface r 336; handle to the right) =================
def pan():
    p = "pn-"
    cx, cy = PAN_C
    L = [G(C(cx + 10, cy + 16, PAN_R, SH, ' opacity="0.4"') + P(wrect(760, 380, 470, 70, 34, .5, 1), SH, ' opacity="0.35"'), p + "bl")]
    # handle: metal neck with rivets, then a walnut grip with a hanging hole
    hd = (P(f"M{cx + 330},{cy - 34} L{cx + 490},{cy - 22} L{cx + 490},{cy + 22} L{cx + 330},{cy + 34}Z", METAL_D)
          + P(f"M{cx + 330},{cy - 30} L{cx + 490},{cy - 19} L{cx + 490},{cy - 2} L{cx + 330},{cy - 4}Z", METAL_L, ' opacity="0.8"')
          + C(cx + 400, cy - 14, 6, METAL_L) + C(cx + 400, cy + 14, 6, METAL_L))
    grip = wrect(cx + 470, cy - 38, 360, 76, 36, .8, 3)
    hd += P(grip, WALNUT) + P(wrect(cx + 486, cy - 32, 330, 26, 13, .6, 4), WALNUT_L, ' opacity="0.8"') + P(wrect(cx + 486, cy + 12, 330, 16, 8, .5, 5), WALNUT_D, ' opacity="0.6"')
    hd += C(cx + 790, cy, 14, WALNUT_D) + C(cx + 790, cy + 2, 10, "#5A3A22")
    L.append(G(hd, p + "cut"))
    # the pan: outer lip, sloping inner wall, dark non-stick floor
    L.append(G(C(cx, cy, PAN_R, PAN_D), p + "cut"))
    L.append(P(ring_d(cx, cy, PAN_R - 3, PAN_R - 18), METAL_D, ' fill-rule="evenodd"'))
    L.append(P(ring_d(cx - 2, cy - 3, PAN_R - 5, PAN_R - 13), METAL_L, ' fill-rule="evenodd" opacity="0.7"'))
    L.append(C(cx, cy, PAN_R - 18, PAN_L))
    L.append(G(C(cx + 8, cy + 10, PAN_IN + 6, PAN_D, ' opacity="0.9"'), p + "bl"))
    L.append(C(cx, cy, PAN_IN, PAN))
    L.append(P(ring_d(cx, cy, PAN_IN * .8, PAN_IN * .78), PAN_L, ' fill-rule="evenodd" opacity="0.35"')
             + P(ring_d(cx, cy, PAN_IN * .5, PAN_IN * .485), PAN_L, ' fill-rule="evenodd" opacity="0.3"'))
    L.append(G(P(f"M{cx - 300},{cy - 40} Q{cx - 250},{cy - 250} {cx - 40},{cy - 300} Q{cx - 210},{cy - 200} {cx - 262},{cy - 30}Z", PAN_L, ' opacity="0.9"'), p + "bl"))
    L.append(P(f"M{cx - 330},{cy - 110} Q{cx - 280},{cy - 280} {cx - 110},{cy - 330}", "none", f' stroke="{WHITE}" stroke-width="7" stroke-linecap="round" opacity="0.55"'))
    return doc(p, PAN_BOX[0], PAN_BOX[1], "".join(L), material="default", seed=441, sh=(5, 4, .35), blur=10)


# ================= LADLE (400x640, full of batter; pour point = the little spout on the left lip) =================
def ladle():
    p = "ld-"
    rc, rx, ry = (196, 458), 152, 40
    L = []
    # handle (behind the cup): a long steel stem with a teal grip and a hook
    stem = f"M{rc[0] + 120},{rc[1] - 16} Q{rc[0] + 160},{rc[1] - 200} {rc[0] + 150},{rc[1] - 400}"
    L.append(G(stroke(stem, METAL_D, 28) + stroke(stem, METAL, 20) + stroke(f"M{rc[0] + 112},{rc[1] - 30} Q{rc[0] + 150},{rc[1] - 200} {rc[0] + 142},{rc[1] - 390}", METAL_L, 6, ' opacity="0.8"'), p + "cut"))
    grip = f"M{rc[0] + 154},{rc[1] - 250} Q{rc[0] + 156},{rc[1] - 330} {rc[0] + 150},{rc[1] - 400}"
    L.append(G(stroke(grip, TEAL_D, 44) + stroke(grip, TEAL, 36) + stroke(f"M{rc[0] + 146},{rc[1] - 260} Q{rc[0] + 148},{rc[1] - 330} {rc[0] + 142},{rc[1] - 392}", TEAL_L, 9, ' opacity="0.8"')
               + C(rc[0] + 150, rc[1] - 386, 8, TEAL_D) + stroke(f"M{rc[0] + 150},{rc[1] - 400} Q{rc[0] + 146},{rc[1] - 440} {rc[0] + 118},{rc[1] - 436}", METAL_D, 16)
               + stroke(f"M{rc[0] + 150},{rc[1] - 400} Q{rc[0] + 146},{rc[1] - 440} {rc[0] + 118},{rc[1] - 436}", METAL, 10), p + "sh"))
    # the cup: a steel half-bowl with a small pouring spout on the left lip
    lx, ly = LADLE_POUR
    cup = (f"M{lx},{ly} Q{rc[0] - rx + 4},{ly + 2} {rc[0] - rx},{rc[1] + 4} Q{rc[0] - rx + 8},{rc[1] + 146} {rc[0]},{rc[1] + 150} "
           f"Q{rc[0] + rx - 8},{rc[1] + 146} {rc[0] + rx},{rc[1]} L{rc[0] - rx + 10},{rc[1] - 8}Z")
    L.append(G(P(cup, METAL), p + "cut"))
    L.append(f'<clipPath id="{p}cc"><path d="{cup}"/></clipPath>'
             + G(G(E(rc[0] + 90, rc[1] + 90, 110, 110, METAL_D, ' opacity="0.8"') + E(rc[0] - 80, rc[1] + 50, 34, 70, METAL_L, ' opacity="0.9"'), p + "bl"), None, f' clip-path="url(#{p}cc)"'))
    L.append(E(*rc, rx, ry, METAL_D))                                                                    # inner back wall
    L.append(E(rc[0] + 2, rc[1] + 6, rx - 14, ry - 10, BAT_D) + E(rc[0], rc[1] + 4, rx - 18, ry - 13, BAT)
             + E(rc[0] - 40, rc[1], 60, 9, BAT_L, ' opacity="0.9"') + C(rc[0] + 60, rc[1] + 8, 4, WHITE, ' opacity="0.8"'))
    L.append(P(f"M{rc[0] - rx},{rc[1]} A{rx},{ry} 0 0 0 {rc[0] + rx},{rc[1]}", "none", f' stroke="{METAL_L}" stroke-width="7"'))       # front lip
    L.append(P(f"M{lx},{ly} Q{lx + 16},{ly - 10} {rc[0] - rx + 12},{rc[1] - 8} L{rc[0] - rx + 18},{rc[1] + 4}Z", METAL_L))                 # spout
    # a drip of batter hanging from the spout
    L.append(G(P(f"M{lx + 2},{ly - 2} Q{lx + 16},{ly} {lx + 12},{ly + 18} Q{lx + 10},{ly + 42} {lx + 2},{ly + 44} Q{lx - 6},{ly + 40} {lx - 4},{ly + 20} Q{lx - 8},{ly + 2} {lx + 2},{ly - 2}Z", BAT)
               + C(lx + 1, ly + 34, 3, WHITE, ' opacity="0.8"'), p + "sh"))
    return doc(p, LADLE[0], LADLE[1], "".join(L), material="default", seed=451, sh=(4, 3.5, .33), blur=8)


# ================= PAN-SIZED FAMILY (680x680, centre (340,340) = pan disc centre; top-left at pan (60,60) at the pan's scale) =================
def puddle(k):
    p = f"bp{k}-"
    g, _ = pancake_top(p, *PUD_C, PUD_R[k], "wet", seed=460 + k)
    return doc(p, PUD_BOX, PUD_BOX, G(g, p + "sh"), material="smooth", seed=460 + k, sh=(2, 2.5, .3), blur=6)


def bubbles():
    p = "pbb-"
    g, _ = pancake_top(p, *PUD_C, CAKE_R, "set", seed=470)
    return doc(p, PUD_BOX, PUD_BOX, G(g, p + "sh"), material="smooth", seed=470, sh=(2, 2.5, .3), blur=6)


def golden():
    p = "pgo-"
    g, _ = pancake_top(p, *PUD_C, CAKE_R, "golden", seed=480)
    return doc(p, PUD_BOX, PUD_BOX, G(g, p + "sh"), material="smooth", seed=480, sh=(4, 4, .33), blur=14)


ITEMS = {**{f"pancake-batter-{i}": (lambda i=i: batter(i)) for i in range(4)},
         "stove-top": stove_top, "stove-knob-off": lambda: knob(False), "stove-knob-on": lambda: knob(True), "flame": flame,
         "pan": pan, "ladle": ladle, **{f"batter-puddle-{k}": (lambda k=k: puddle(k)) for k in (1, 2, 3)},
         "pancake-bubbles": bubbles, "pancake-golden": golden}

if __name__ == "__main__":
    run(ITEMS)

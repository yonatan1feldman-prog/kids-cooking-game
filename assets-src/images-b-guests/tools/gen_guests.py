# The guests (the guests round): three animals the child can invite to share the dish with Mom and Pipa.
# Style B paper cut-out, built on the images-b kit (pb.py, READ-ONLY) and Pipa's own eye/mouth drawings (gen_pippa.py).
# Each guest is a stack of layers on one 600x700 frame, exactly like Pipa (character-*), so the game's Character class
# drives them: body, eyes open / blink / happy / surprised, mouth closed / open / chew, plus a "funny" mouth (their
# own reaction: the giraffe licks her nose, the turtle dozes off content, the penguin sneezes). Their feet stand on
# y 684 like Pipa's; the giraffe has no feet on screen: her head hangs down from above, and `guest-giraffe-neck`
# continues her neck up out of the frame (its bottom edge meets the frame's top edge).
# `guest-card-<name>` (240x240) is the round badge she taps to invite one.
# Run: python tools/gen_guests.py   (writes into images-b-guests/ only)
import math, os, sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
GUEST_DIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
from pb import *                      # noqa: F401,F403
import pb                             # noqa: E402
from gen_pippa import round_eye, arc_band, lashes   # noqa: E402

W, H = 600, 700
NECK_H = 1200

# ---------------- palettes ----------------
TUR = dict(skin="#A9CF72", skin_d="#86B052", skin_l="#C8E39A", shell="#7E9F48", shell_d="#5E7C33", shell_l="#A3C16A",
           plate="#96B85A", rim="#E8C35E", rim_d="#C99E3E", belly="#F2DDA0", belly_d="#DDC27E", scarf=CORAL, scarf_d=CORAL_D,
           mouth="#6E2E26", tongue="#EE7A70", brow="#5E7C33")
GIR = dict(skin="#F4C45C", skin_d="#E0A43E", skin_l="#FAD98E", spot="#C9803F", spot_d="#A9642C", muzzle="#F8E2B4",
           muzzle_d="#EDCB92", horn="#E0A43E", knob="#8E5530", ear_in=PINK, mane="#B8692E", mouth="#6E2E26",
           tongue="#8C6AA8", tongue_l="#AC8CC6", brow="#8E5530")
PEN = dict(body="#34445E", body_d="#27354B", body_l="#4A5C7A", belly="#FBF6EC", belly_d="#E9E0CF", beak="#F4A23C",
           beak_d="#D87F22", beak_in="#B4552A", foot="#F4A23C", foot_d="#D87F22", scarf=RED, scarf_d=RED_D,
           scarf_l=RED_L, brow="#27354B")


def defs(p, seed, blur=4):
    return std_defs(p, "smooth", seed, sh=(5, 4, .33), blur=blur)


def face_defs(p, seed):
    return std_defs(p, "smooth", seed, sh=(3, 2.5, .3))


def layer(w, h, d, body):
    return svg(w, h, d, body)


# ---------------- eyes (shared: Pipa's eyes, placed per guest) ----------------
def eyes(g, kind, name):
    """g: dict(xs, y, rx, ry, lash, brow)."""
    p = f"g{name[:2]}-e{kind[0]}-"
    L = []
    for cx in g["xs"]:
        sgn = -1 if cx < 300 else 1
        ey, rx, ry = g["y"], g["rx"], g["ry"]
        s = rx / 38
        if kind == "open":
            L.append(G(round_eye(p, cx, ey, rx, ry), p + "sh") + (lashes(cx, ey, s) if g["lash"] else ""))
        elif kind == "surprised":
            L.append(G(round_eye(p, cx, ey - 4, rx * 1.16, ry * 1.13, True), p + "sh") + (lashes(cx, ey - 8, s * 1.1) if g["lash"] else ""))
            bx, by = cx + sgn * 4, ey - ry * 1.85
            L.append(G(P(arc_band(bx, by, 50 * s, 9, 11, True), g["brow"], f' transform="rotate({-sgn * 8} {bx} {by})"'), p + "sh"))
        elif kind == "blink":
            cy = ey + 14 * s
            L.append(G(P(arc_band(cx, cy, 70 * s, 12 * s, 13, False), EYE), p + "sh"))
            if g["lash"]:
                ox = cx + sgn * 33 * s
                L.append(P(f"M{n(ox)},{n(cy - 2)} Q{n(ox + sgn * 18)},{n(cy - 4)} {n(ox + sgn * 26)},{n(cy - 16)} Q{n(ox + sgn * 14)},{n(cy + 2)} {n(ox)},{n(cy + 8)}Z", EYE))
        elif kind == "happy":
            cy = ey + 18 * s
            L.append(G(P(arc_band(cx, cy, 76 * s, 20 * s, 15, True), EYE), p + "sh"))
            if g["lash"]:
                ox = cx + sgn * 36 * s
                L.append(P(f"M{n(ox)},{n(cy - 6)} Q{n(ox + sgn * 16)},{n(cy - 20)} {n(ox + sgn * 26)},{n(cy - 18)} Q{n(ox + sgn * 14)},{n(cy - 8)} {n(ox + sgn * 4)},{n(cy + 4)}Z", EYE))
    return face_defs(p, 41 + len(kind) + len(name)), G("".join(L), p + "gr")


# ---------------- mouths for the turtle and the giraffe (Pipa's shapes, moved and sized) ----------------
def at(mx, my, s, inner):
    return f'<g transform="translate({n(mx)} {n(my)}) scale({s}) translate(-300 -410)">{inner}</g>'


def soft_mouth(kind, c, m, name):
    """kind: open | closed | chew. c: palette, m: dict(x, y, s, cheek_dx, face)."""
    p = f"g{name[:2]}-m{kind[0]}-"
    mx, my, s = m["x"], m["y"], m["s"]
    if kind == "open":
        d = "M252,394 Q300,408 348,394 Q360,392 358,406 Q350,474 300,476 Q250,474 242,406 Q240,392 252,394Z"
        inner = (f'<clipPath id="{p}c"><path d="{d}"/></clipPath>'
                 + G(P(d, c["mouth"]) + G(E(300, 482, 46, 32, c.get("tongue", "#EE7A70")), None, f' clip-path="url(#{p}c)"'), p + "sh"))
    elif kind == "closed":
        d = "M262,396 Q300,418 338,396 Q344,393 343,400 Q328,432 300,432 Q272,432 257,400 Q256,393 262,396Z"
        inner = G(P(d, c["mouth"]) + E(300, 424, 14, 5, "#DC6C66"), p + "sh")
    else:  # chew: puffed cheeks + a wavy closed mouth
        inner = ""
        for sgn in (-1, 1):
            cx = 300 + sgn * m["cheek_dx"]
            inner += G(P(wob(cx, 408, 48, 40, .03, 60 + sgn), m["face"]) + E(cx + sgn * 8, 408, 36, 24, CHEEK, ' opacity="0.8"'), p + "sh")
        inner += G(stroke(smooth_open([(266, 406), (283, 418), (300, 411), (317, 418), (334, 406)], .2), c["mouth"], 12), p + "sh")
    return face_defs(p, 51 + len(kind) + len(name)), at(mx, my, s, inner)


# ---------------- the turtle ----------------
T_EYES = dict(xs=(250, 350), y=338, rx=30, ry=37, lash=False, brow=TUR["brow"])
T_MOUTH = dict(x=300, y=408, s=.72, cheek_dx=104, face=TUR["skin"])


def turtle_body():
    c, p = TUR, "gtu-bd-"
    cut, sh = p + "cut", p + "sh"
    L = [G(E(300, 678, 236, 12, SH, ' opacity="0.4"'), p + "bl")]
    # the shell: a wide dome behind her, a yellow rim, plates
    dome = "M58,604 C58,430 170,300 300,300 C430,300 542,430 542,604 Q300,640 58,604Z"
    L.append(G(P(dome, c["shell_d"]), cut))
    L.append(G(P("M78,596 C82,444 184,322 300,322 C416,322 518,444 522,596 Q300,628 78,596Z", c["shell"]), sh))
    plates = ""
    for i, (x, y, rx, ry) in enumerate([(140, 500, 58, 70), (460, 500, 58, 70), (196, 400, 56, 52), (404, 400, 56, 52), (300, 370, 64, 44)]):
        plates += P(wob(x, y, rx, ry, .05, 80 + i, 7), c["plate"]) + P(wob(x - 6, y - 8, rx * .55, ry * .45, .08, 90 + i, 7), c["shell_l"], ' opacity="0.7"')
    L.append(G(plates, sh))
    L.append(G(P("M62,600 Q300,650 538,600 L540,622 Q300,672 60,622Z", c["rim"]) + "".join(
        f'<rect x="{n(96 + i * 51)}" y="{n(618 + 10 * math.sin(i / 8 * math.pi))}" width="5" height="22" rx="2.5" fill="{c["rim_d"]}" opacity="0.8"/>' for i in range(9)), sh))
    # back feet peeking out under the rim, front feet in front
    feet = P(wob(170, 660, 58, 26, .05, 1), c["skin_d"]) + P(wob(430, 660, 58, 26, .05, 2), c["skin_d"])
    L.append(G(feet, cut))
    # neck and tummy plate
    L.append(G(P(wob(300, 500, 86, 76, .03, 3), c["skin"]), sh))
    L.append(G(P(wob(300, 572, 128, 82, .025, 4), c["belly"]) + stroke("M190,560 Q300,580 410,560", c["belly_d"], 5, ' opacity="0.8"')
               + stroke("M300,500 L300,648", c["belly_d"], 5, ' opacity="0.8"') + stroke("M206,612 Q300,630 394,612", c["belly_d"], 5, ' opacity="0.8"'), sh))
    for sgn, sd in ((-1, 5), (1, 6)):
        x = 300 + sgn * 150
        leg = P(wob(x, 620, 52, 58, .05, sd, 20, sgn * 12), c["skin"])
        toes = "".join(C(x + sgn * 4 + dx, 668, 9, c["skin_l"]) for dx in (-24, 0, 24))
        L.append(G(leg + toes, cut))
    # the scarf: a coral neckerchief with its knot on one side
    scarf = P("M214,462 Q300,488 386,462 L392,486 Q300,516 208,486Z", c["scarf"])
    scarf += P("M352,478 Q372,520 356,556 Q340,540 334,500Z", c["scarf_d"]) + P("M360,476 Q392,506 394,540 Q372,530 350,496Z", c["scarf"])
    L.append(G(scarf, cut))
    # head: round, a little wider than tall
    L.append(G(P(wob(300, 350, 132, 120, .02, 7), c["skin_d"]), cut))
    L.append(G(P(wob(300, 346, 124, 112, .02, 8), c["skin"]), sh))
    L.append(E(300, 300, 84, 46, c["skin_l"], ' opacity="0.55"'))
    L.append(E(206, 388, 30, 19, CHEEK, ' opacity="0.8"') + E(394, 388, 30, 19, CHEEK, ' opacity="0.8"'))
    L.append(C(290, 372, 5, c["skin_d"]) + C(310, 372, 5, c["skin_d"]))   # nostrils
    # a few freckles on the head (turtle skin)
    L.append("".join(C(x, y, r, c["skin_d"], ' opacity="0.45"') for x, y, r in [(236, 264, 7), (262, 250, 5), (356, 256, 6), (380, 272, 5), (300, 244, 4)]))
    return layer(W, H, defs(p, 131), G("".join(L), p + "gr"))


def turtle_funny():
    """Dozing off, content: a small, soft smile (the game closes her eyes and floats sleep bubbles)."""
    c, p = TUR, "gtu-mf-"
    inner = G(stroke("M276,402 Q300,420 324,402", c["mouth"], 10), p + "sh")
    return layer(W, H, face_defs(p, 61), at(T_MOUTH["x"], T_MOUTH["y"], 1, inner))


# ---------------- the giraffe ----------------
G_EYES = dict(xs=(250, 350), y=372, rx=30, ry=37, lash=True, brow=GIR["brow"])
G_MOUTH = dict(x=300, y=548, s=.66, cheek_dx=118, face=GIR["muzzle"])
NECK_X0, NECK_X1 = 238, 362


def neck_spots(y0, y1, seed):
    import random as R
    r = R.Random(seed)
    s = ""
    y = y0
    i = 0
    while y < y1:
        for x in (262 + r.random() * 10, 334 + r.random() * 10):
            s += P(wob(x + (i % 2) * 18 - 9, y, 26 + r.random() * 8, 22 + r.random() * 6, .12, seed * 50 + i, 8, r.random() * 40), GIR["spot"])
            i += 1
        y += 96
    return s


def giraffe_neck_path(y0, y1):
    return f"M{NECK_X0},{y1} L{NECK_X0},{y0} L{NECK_X1},{y0} L{NECK_X1},{y1}Z"


def giraffe_body():
    c, p = GIR, "ggi-bd-"
    cut, sh = p + "cut", p + "sh"
    L = []
    # the neck, coming down from the top of the frame (continued above by guest-giraffe-neck)
    neck = P(giraffe_neck_path(-4, 330), c["skin"])
    clip = f'<clipPath id="{p}nc"><path d="{giraffe_neck_path(-4, 330)}"/></clipPath>'
    L.append(clip + G(neck + G(neck_spots(40, 300, 3), None, f' clip-path="url(#{p}nc)"'), sh))
    # a little mane down the back of the neck (the right edge)
    L.append(G(P(f"M{NECK_X1 - 4},-4 L{NECK_X1 + 20},-4 L{NECK_X1 + 20},250 Q{NECK_X1 + 8},290 {NECK_X1 - 4},270Z", c["mane"]), sh))
    # horns (ossicones) with dark knobs
    for sgn in (-1, 1):
        x = 300 + sgn * 54
        L.append(G(P(wrect(x - 14, 178, 28, 90, 12, 1, 10 + sgn), c["horn"]) + P(wob(x, 176, 24, 22, .06, 12 + sgn), c["knob"]), cut))
    # ears, out to the sides and a little down
    for sgn in (-1, 1):
        x = 300 + sgn * 150
        L.append(G(P(wob(x, 300, 62, 28, .05, 20 + sgn, 22, sgn * 20), c["skin_d"]) + P(wob(x + sgn * 4, 300, 38, 14, .08, 22 + sgn, 22, sgn * 20), c["ear_in"]), cut))
    # head: a round forehead and a long soft muzzle below it
    L.append(G(P(wob(300, 360, 126, 118, .02, 30), c["skin_d"]) + P(wob(300, 500, 104, 100, .02, 31), c["skin_d"]), cut))
    L.append(G(P(wob(300, 356, 118, 110, .02, 32), c["skin"]), sh))
    L.append(G(P(wob(300, 272, 34, 26, .08, 33), c["spot"]) + P(wob(222, 330, 18, 14, .1, 34), c["spot"]) + P(wob(380, 318, 20, 15, .1, 35), c["spot"]), sh))
    L.append(G(P(wob(300, 502, 98, 94, .02, 36), c["muzzle"]), sh))
    L.append(E(300, 468, 70, 24, WHITE, ' opacity="0.35"'))
    L.append(G(P(wob(276, 500, 10, 13, .1, 37, 12, -14), c["muzzle_d"]) + P(wob(324, 500, 10, 13, .1, 38, 12, 14), c["muzzle_d"]), sh))   # nostrils
    L.append(E(212, 450, 26, 17, CHEEK, ' opacity="0.8"') + E(388, 450, 26, 17, CHEEK, ' opacity="0.8"'))
    return layer(W, H, defs(p, 141), G("".join(L), p + "gr"))


def giraffe_neck():
    """The neck above the frame: 600 x NECK_H, the same column as the body's neck; its bottom edge meets the body's
    top edge (the game stands it on the frame's top, overlapping 4 units)."""
    c, p = GIR, "ggi-nk-"
    y1 = NECK_H + 4
    clip = f'<clipPath id="{p}nc"><path d="{giraffe_neck_path(0, y1)}"/></clipPath>'
    body = clip + G(P(giraffe_neck_path(0, y1), c["skin"]) + G(neck_spots(40, NECK_H + 40, 7), None, f' clip-path="url(#{p}nc)"'), p + "sh")
    body += G(P(f"M{NECK_X1 - 4},0 L{NECK_X1 + 20},0 L{NECK_X1 + 20},{y1} L{NECK_X1 - 4},{y1}Z", c["mane"]), p + "sh")
    return svg(W, NECK_H, std_defs(p, "smooth", 151, sh=(5, 4, .33)), G(body, p + "gr"))


def giraffe_funny():
    """Her long tongue curls up and licks her nose (giraffes do), then back in."""
    c, p = GIR, "ggi-mf-"
    mx, my = G_MOUTH["x"], G_MOUTH["y"]
    smile = stroke(f"M{mx - 30},{my - 6} Q{mx},{my + 18} {mx + 30},{my - 6}", c["mouth"], 10)
    t = (f"M{mx - 20},{my + 2} C{mx - 40},{my - 26} {mx - 58},{my - 44} {mx - 48},{my - 62} C{mx - 38},{my - 80} {mx - 8},{my - 70} {mx + 2},{my - 40}"
         f" C{mx + 8},{my - 20} {mx + 16},{my - 2} {mx + 18},{my + 4}Z")
    tongue = G(P(t, c["tongue"]) + P(wob(mx - 36, my - 60, 12, 7, .1, 5, 10, -30), c["tongue_l"], ' opacity="0.8"')
               + stroke(f"M{mx - 6},{my - 4} Q{mx - 22},{my - 36} {mx - 30},{my - 56}", mix(c["tongue"], "#3A2216", .25), 3, ' opacity="0.6"'), p + "sh")
    return layer(W, H, face_defs(p, 63), G(smile, p + "sh") + tongue)


# ---------------- the penguin ----------------
P_EYES = dict(xs=(262, 338), y=334, rx=27, ry=33, lash=False, brow=PEN["brow"])
BEAK = (300, 400)


def penguin_body():
    c, p = PEN, "gpe-bd-"
    cut, sh = p + "cut", p + "sh"
    L = [G(E(300, 678, 170, 11, SH, ' opacity="0.42"'), p + "bl")]
    # feet
    for sgn in (-1, 1):
        x = 300 + sgn * 62
        L.append(G(P(wob(x, 664, 56, 22, .05, 1 + sgn), c["foot"]) + P(wob(x, 656, 40, 12, .08, 3 + sgn), c["foot_d"], ' opacity="0.5"'), cut))
    # flippers, a little out to the sides
    for sgn in (-1, 1):
        x = 300 + sgn * 168
        L.append(G(P(wob(x, 486, 38, 96, .04, 5 + sgn, 22, -sgn * 22), c["body_d"]), cut))
    # body: a round egg, dark back, white tummy
    L.append(G(P(wob(300, 468, 176, 214, .015, 9), c["body"]), cut))
    L.append(G(P(wob(300, 520, 124, 156, .02, 10), c["belly"]), sh))
    L.append(E(300, 610, 92, 44, c["belly_d"], ' opacity="0.45"'))
    # the face: a white heart like Pipa's, under the dark cap
    L.append(G(C(254, 338, 66, c["belly"]) + C(346, 338, 66, c["belly"]) + E(300, 390, 100, 62, c["belly"]), sh))
    L.append(P("M196,300 Q300,248 404,300 Q360,276 300,274 Q240,276 196,300Z", c["body_l"], ' opacity="0.5"'))
    L.append(E(212, 386, 24, 15, CHEEK, ' opacity="0.8"') + E(388, 386, 24, 15, CHEEK, ' opacity="0.8"'))
    # a red scarf with a striped tail
    scarf = P("M178,452 Q300,490 422,452 L428,486 Q300,528 172,486Z", c["scarf"])
    tail = P("M366,490 Q392,556 380,612 L342,604 Q350,556 334,502Z", c["scarf_d"])
    tail += "".join(P(f"M{n(348 + i * 2)},{n(526 + i * 26)} L{n(386 - i * 1)},{n(532 + i * 26)} L{n(385 - i)},{n(544 + i * 26)} L{n(347 + i * 2)},{n(538 + i * 26)}Z", c["scarf_l"], ' opacity="0.9"') for i in range(3))
    L.append(G(tail, cut) + G(scarf, sh))
    L.append(P("M190,460 Q300,494 410,460 L410,468 Q300,502 190,468Z", c["scarf_l"], ' opacity="0.8"'))
    return layer(W, H, defs(p, 161), G("".join(L), p + "gr"))


def beak(kind):
    """The penguin's mouth is her beak: closed, open, chewing, and the big sneeze (funny)."""
    c = PEN
    p = f"gpe-m{kind[0]}{kind[-1]}-"
    x, y = BEAK
    if kind == "closed":
        g = P(f"M{x - 34},{y - 8} Q{x},{y - 22} {x + 34},{y - 8} Q{x + 12},{y + 30} {x},{y + 34} Q{x - 12},{y + 30} {x - 34},{y - 8}Z", c["beak"])
        g += stroke(f"M{x - 26},{y + 2} Q{x},{y + 10} {x + 26},{y + 2}", c["beak_d"], 5)
    elif kind in ("open", "funny"):
        big = 1.35 if kind == "funny" else 1.0
        top = f"M{x - 36},{y - 10} Q{x},{y - 24} {x + 36},{y - 10} Q{x + 14},{y + 8} {x},{y + 10} Q{x - 14},{y + 8} {x - 36},{y - 10}Z"
        g = P(f"M{x - 26},{y + 4} Q{x},{y + 4 + 30 * big} {x + 26},{y + 4} Q{x},{y + 14} {x - 26},{y + 4}Z", c["beak_in"])
        g += P(f"M{x - 28},{y + 6} Q{x},{y + 16 + 34 * big} {x + 28},{y + 6} Q{x},{y + 16 + 22 * big} {x - 28},{y + 6}Z", c["beak_d"])
        g += P(top, c["beak"])
        if kind == "funny":   # scrunched up for the ahh-choo: little squint lines above the beak
            g += stroke(f"M{x - 20},{y - 30} Q{x},{y - 40} {x + 20},{y - 30}", c["body_d"], 5, ' opacity="0.6"')
    else:  # chew: the beak shut, puffed white cheeks around it
        g = ""
        for sgn in (-1, 1):
            g += P(wob(x + sgn * 64, y + 6, 40, 32, .04, 60 + sgn), c["belly"]) + E(x + sgn * 70, y + 6, 28, 18, CHEEK, ' opacity="0.85"')
        g += P(f"M{x - 32},{y - 6} Q{x},{y - 20} {x + 32},{y - 6} Q{x + 10},{y + 22} {x},{y + 24} Q{x - 10},{y + 22} {x - 32},{y - 6}Z", c["beak"])
        g += stroke(f"M{x - 22},{y + 2} Q{x - 8},{y + 10} {x},{y + 4} Q{x + 8},{y + 10} {x + 22},{y + 2}", c["beak_d"], 5)
    return layer(W, H, face_defs(p, 71 + len(kind)), G(g, p + "sh"))


# ---------------- the invitation badges ----------------
CARD_BG = {"turtle": "#E6F0D2", "giraffe": "#FBE9C2", "penguin": "#DDE9F2"}
CARD_RING = {"turtle": TUR["shell"], "giraffe": GIR["skin_d"], "penguin": PEN["body_l"]}
# which part of the frame the badge shows: (centre x, centre y, scale)
CARD_VIEW = {"turtle": (300, 400, .5), "giraffe": (300, 400, .5), "penguin": (300, 400, .48)}


def strip_svg(s):
    """(defs, body) of one of our layer files."""
    a = s.index("<defs>") + 6
    b = s.index("</defs>")
    return s[a:b], s[b + 7:-6]


def card(name, layers):
    p = f"gc{name[:2]}-"
    cx, cy, sc = CARD_VIEW[name]
    d_all, inner = "", ""
    for s in layers:
        d, b = strip_svg(s)
        d_all += d
        inner += b
    clip = f'<clipPath id="{p}cc"><circle cx="120" cy="120" r="100"/></clipPath>'
    disc = G(C(120, 120, 112, CARD_RING[name]) + C(120, 120, 100, CARD_BG[name]), p + "cut")
    art = G(f'<g transform="translate(120 {n(120 + 18)}) scale({sc}) translate({-cx} {-cy})">{inner}</g>', None, f' clip-path="url(#{p}cc)"')
    body = disc + art + C(120, 120, 100, "none", f' stroke="{CARD_RING[name]}" stroke-width="6"')
    return svg(240, 240, std_defs(p, "rough", 171 + len(name), sh=(4, 3.5, .33)) + clip + d_all, G(body, p + "gr"))


def save(name, s):
    path = os.path.join(GUEST_DIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    return len(s.encode("utf8"))


def main():
    files = {}
    for name, body, ey, mouth, funny in (
        ("turtle", turtle_body(), T_EYES, lambda k: soft_mouth(k, TUR, T_MOUTH, "turtle"), turtle_funny()),
        ("giraffe", giraffe_body(), G_EYES, lambda k: soft_mouth(k, GIR, G_MOUTH, "giraffe"), giraffe_funny()),
        ("penguin", penguin_body(), P_EYES, None, beak("funny")),
    ):
        files[f"guest-{name}-body"] = body
        for kind in ("open", "blink", "happy", "surprised"):
            d, b = eyes(ey, kind, name)
            files[f"guest-{name}-eyes-{kind}"] = svg(W, H, d, b)
        for kind in ("closed", "open", "chew"):
            if mouth:
                d, b = mouth(kind)
                files[f"guest-{name}-mouth-{kind}"] = svg(W, H, d, b)
            else:
                files[f"guest-{name}-mouth-{kind}"] = beak(kind)
        files[f"guest-{name}-mouth-funny"] = funny
        files[f"guest-card-{name}"] = card(name, [body, files[f"guest-{name}-eyes-open"], files[f"guest-{name}-mouth-closed"]])
    files["guest-giraffe-neck"] = giraffe_neck()
    for k, s in files.items():
        size = save(k, s)
        print(f"{k:30s} {size / 1024:6.1f} KB")
        assert size <= 60 * 1024, k


if __name__ == "__main__":
    main()

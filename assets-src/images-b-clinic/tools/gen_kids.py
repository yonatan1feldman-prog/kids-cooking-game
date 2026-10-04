# The clinic, round 4 (research/clinic-research-2.md): four children come to the clinic, like the girl and the boy in
# "Doctor Games for kids". Style B paper cut-out on the images-b kit (pb.py, READ-ONLY), the guests' eyes (gen_guests.py)
# and Mom's limb tool (gen_mom.taper). Each child is a stack of layers on the patients' 600x700 frame (feet on y 684),
# exactly like Pipa and the guests, so the game's Character class drives them: body, eyes open / blink / happy /
# surprised, mouth closed / open / chew. They sit on the bench: knees forward, hands in the lap, feet hanging.
# - Lily (5): ginger pigtails, freckles, a pink dotted top and a teal skirt; a little shy.
# - Leo (6): deep brown skin, short black curls, a yellow T-shirt with a star; brave and cheerful.
# - Mia (3): black bob with a red bow, a lilac dress with a white collar; the smallest (a bigger head for her size).
# - Sam (4): messy blond hair, a green striped T-shirt, brown shorts; giggly.
# Run: python tools/gen_kids.py   (writes kid-<name>-*.svg into images-b-clinic/; then copy them into
# public/assets/images and bake the WebPs). The frame points the game uses are printed at the end (core/clinic.ts).
import math, os, sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-guests", "tools")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
from pb import *                      # noqa: F401,F403
from gen_guests import eyes as guest_eyes, face_defs, at   # noqa: E402
from gen_mom import taper, curl_mass   # noqa: E402

W, H = 600, 700

KIDS = {
    "lily": dict(skin="#F8D5BC", hair="#D8743C", style="pigtails", tie="#F06A8A", shirt="#F59BB4", dots="#FFF4F6",
                 bottom="#4FA8A6", skirt=True, sock="#FFFDF7", shoe="#E2533F", lash=True, freckles=True, hy=240, body=1.0),
    "leo": dict(skin="#8E5A3B", hair="#24170F", style="curly", shirt="#F6C445", star="#FFFDF7", bottom="#4F7FC0",
                skirt=False, sock="#FFFDF7", shoe="#5DB043", lash=False, freckles=False, hy=240, body=1.0),
    "mia": dict(skin="#F4D3B2", hair="#221A1C", style="bob", bow="#E8463C", shirt="#B99CE3", collar="#FFFDF7",
                bottom="#B99CE3", skirt=True, sock="#FFE3EC", shoe="#E86A8A", lash=True, freckles=False, hy=262, body=.86),
    "sam": dict(skin="#EBB892", hair="#E8C163", style="messy", shirt="#7CC47A", stripe="#FFFDF7", bottom="#9C6B45",
                skirt=False, sock="#FFFDF7", shoe="#4C8FD0", lash=False, freckles=False, hy=240, body=1.0),
}


def pal(c):
    s = c["skin"]
    c = dict(c)
    c.update(skin_d=mix(s, "#6A3226", .22), skin_l=mix(s, "#FFF4E6", .3), nose=mix(s, "#7A3E30", .18),
             mouth=mix(s, "#5A1618", .75), hair_d=mix(c["hair"], "#120A06", .4),
             hair_l=mix(c["hair"], "#FFE9CC", .32) if lum(c["hair"]) > .2 else mix(c["hair"], "#9A7A70", .4),
             hair_m=mix(c["hair"], "#FFE9CC", .14) if lum(c["hair"]) > .2 else mix(c["hair"], "#6A5048", .3),
             brow=mix(c["hair"], "#120A06", .3), shirt_d=mix(c["shirt"], "#3A2216", .2), bottom_d=mix(c["bottom"], "#3A2216", .22),
             shoe_d=mix(c["shoe"], "#3A2216", .25))
    return c


def defs(p, seed):
    return std_defs(p, "smooth", seed, sh=(5, 4, .33))


def head_pts(cx, cy, rx, ry):
    pts = []
    for i in range(32):
        a = i / 32 * 2 * math.pi
        r = rx + 8 * max(0, math.sin(a)) * math.cos(a) ** 2   # fuller cheeks low down
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * (ry if math.sin(a) < 0 else ry * .98)))
    return smooth(pts)


# ---------------- the body below the neck (scaled for the little one around her feet) ----------------
def lower_body(c, p):
    cut, sh = p + "cut", p + "sh"
    L = [G(E(300, 680, 170, 10, SH, ' opacity="0.35"'), p + "bl")]
    # legs hanging from the knees, socks, shoes
    for sgn, seed in ((-1, 1), (1, 2)):
        x = 300 + sgn * 68
        L.append(G(P(wrect(x - 23, 588, 46, 72, 18, 1, seed), c["skin"]), cut))
        L.append(E(x, 604, 18, 9, c["skin_l"], ' opacity="0.6"'))                    # the knee's light
        L.append(G(P(wrect(x - 24, 636, 48, 30, 10, 1, seed + 2), c["sock"]), sh))
        L.append(G(P(wob(x + sgn * 4, 668, 42, 17, .04, seed + 4), c["shoe"]) + P(wob(x + sgn * 4, 662, 30, 7, .08, seed + 6), mix(c["shoe"], "#FFFFFF", .35), ' opacity="0.6"'), cut))
    # the lap: a skirt or shorts (the thighs come toward us, so the lap is short and wide)
    if c["skirt"]:
        lap = "M178,532 L422,532 Q440,566 450,606 Q300,628 150,606 Q160,566 178,532Z"
    else:
        lap = "M180,536 L420,536 L430,602 Q384,612 334,602 L300,590 L266,602 Q216,612 170,602Z"
    L.append(G(P(lap, c["bottom"]), cut))
    L.append(stroke("M196,560 Q300,572 404,560", c["bottom_d"], 5, ' opacity="0.5"'))
    # the top: a T-shirt (or the dress's bodice) with short sleeves
    torso = "M200,436 Q212,412 256,404 L344,404 Q388,412 400,436 L414,552 Q300,570 186,552Z"
    L.append(G(P(torso, c["shirt"]), cut))
    clip = f'<clipPath id="{p}tc"><path d="{torso}"/></clipPath>'
    if c.get("dots"):
        pat = "".join(C(x + (14 if r % 2 else 0), 430 + r * 28, 6, c["dots"]) for r in range(6) for x in range(186, 420, 30))
        L.append(clip + G(pat, None, f' clip-path="url(#{p}tc)" opacity="0.9"'))
    if c.get("stripe"):
        pat = "".join(f'<rect x="170" y="{y}" width="260" height="13" fill="{c["stripe"]}"/>' for y in range(424, 560, 30))
        L.append(clip + G(pat, None, f' clip-path="url(#{p}tc)" opacity="0.85"'))
    if c.get("star"):
        pts = []
        for i in range(10):
            a = math.radians(-90 + i * 36)
            r = 38 if i % 2 == 0 else 17
            pts.append((300 + math.cos(a) * r, 488 + math.sin(a) * r))
        L.append(G(P("M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + "Z", c["star"]), sh))
    if c.get("collar"):
        L.append(G(P("M246,408 Q264,446 300,430 Q336,446 354,408 Q326,418 300,418 Q274,418 246,408Z", c["collar"]), sh))
    else:
        L.append(P("M262,406 Q300,436 338,406 L330,404 Q300,424 270,404Z", c["shirt_d"]))   # the neckline
    # arms down the sides, hands in the lap
    for sgn, seed in ((-1, 7), (1, 8)):
        sx = 300 + sgn * 98
        pts = [(sx, 448), (sx + sgn * 14, 486), (sx + sgn * 8, 526), (sx - sgn * 8, 556)]
        L.append(G(P(taper(pts, [42, 40, 38, 34]), c["skin"]), sh))
        L.append(G(P(wob(sx + sgn * 2, 450, 40, 34, .05, seed, 18, sgn * 20), c["shirt"]) + P(wob(sx + sgn * 6, 470, 34, 8, .08, seed + 9, 14, sgn * 20), c["shirt_d"], ' opacity="0.55"'), sh))
        L.append(G(P(wob(sx - sgn * 14, 562, 26, 22, .06, seed + 20), c["skin"]) + P(wob(sx - sgn * 22, 558, 8, 12, .1, seed + 30, 12), c["skin_l"], ' opacity="0.5"'), sh))
    inner = "".join(L)
    k = c["body"]
    return inner if k == 1 else f'<g transform="translate(300 684) scale({k}) translate(-300 -684)">{inner}</g>'


# ---------------- the head and the hair ----------------
def head(c, p):
    cut, sh = p + "cut", p + "sh"
    hy = c["hy"]
    L = []
    # the back hair (the bob's sides, the pigtails) goes behind the head
    if c["style"] == "bob":
        L.append(G(P(f"M138,{hy - 30} Q122,{hy + 70} 140,{hy + 130} Q170,{hy + 150} 204,{hy + 132} L396,{hy + 132} Q430,{hy + 150} 460,{hy + 130} Q478,{hy + 70} 462,{hy - 30}Z", c["hair_d"]), cut))
    if c["style"] == "pigtails":
        for sgn, seed in ((-1, 41), (1, 42)):
            x = 300 + sgn * 176
            L.append(G(P(wob(x, hy + 58, 44, 70, .06, seed, 22, sgn * -16), c["hair"]) + P(wob(x - sgn * 4, hy + 40, 16, 40, .1, seed + 2, 14, sgn * -16), c["hair_l"], ' opacity="0.7"')
                       + "".join(stroke(f"M{n(x - 18 + i * 12)},{hy + 10} Q{n(x - 22 + i * 12 + sgn * 6)},{hy + 70} {n(x - 14 + i * 12)},{hy + 120}", c["hair_d"], 3, ' opacity="0.4"') for i in range(4)), cut))
    L.append(G(P(f"M272,{hy + 120} L328,{hy + 120} L330,{hy + 172} Q300,{hy + 184} 270,{hy + 172}Z", c["skin_d"]), sh))   # the neck
    for sgn, seed in ((-1, 3), (1, 4)):
        x = 300 + sgn * 150
        L.append(G(P(wob(x, hy + 30, 26, 32, .05, seed), c["skin"]) + P(wob(x + sgn * 2, hy + 30, 14, 19, .08, seed + 4), c["skin_d"], ' opacity="0.55"'), cut))
    L.append(G(P(head_pts(300, hy, 150, 146), c["skin"]), cut))
    L.append(P(wob(272, hy - 40, 92, 64, .04, 5), c["skin_l"], ' opacity="0.4"'))
    L.append(E(206, hy + 80, 27, 16, CHEEK, ' opacity="0.7"') + E(394, hy + 80, 27, 16, CHEEK, ' opacity="0.7"'))
    L.append(E(300, hy + 62, 10, 7, c["nose"]) + E(297, hy + 59, 3.6, 2.4, c["skin_l"], ' opacity="0.7"'))
    if c["freckles"]:
        L.append("".join(C(x, y + hy, r, mix(c["hair"], c["skin"], .35), ' opacity="0.7"') for x, y, r in
                         ((236, 60, 3.6), (252, 70, 3), (226, 72, 3), (364, 60, 3.6), (348, 70, 3), (374, 72, 3), (244, 54, 2.6), (356, 54, 2.6))))
    L.append(hair_front(c, p))
    return "".join(L)


def hair_front(c, p):
    cut, sh = p + "cut", p + "sh"
    hy = c["hy"]
    h, hd, hl = c["hair"], c["hair_d"], c["hair_l"]
    top = lambda a0, a1, rx, ry, k=18: [(300 + math.cos(math.radians(a)) * rx, hy + math.sin(math.radians(a)) * ry)
                                         for a in [a0 + (a1 - a0) * i / (k - 1) for i in range(k)]]
    L = []
    if c["style"] == "pigtails":
        outer = top(168, 372, 160, 158)
        fringe = [(452, hy - 12), (420, hy - 56), (380, hy - 74), (346, hy - 62), (318, hy - 80), (288, hy - 66), (256, hy - 82), (222, hy - 64), (186, hy - 40), (152, hy - 8)]
        L.append(G(P(smooth(outer + fringe), h), cut))
        L.append(P(f"M196,{hy - 104} Q250,{hy - 140} 320,{hy - 136} Q258,{hy - 124} 210,{hy - 92}Z", hl, ' opacity="0.8"'))
        L.append(stroke(f"M300,{hy - 156} L300,{hy - 96}", hd, 4, ' opacity="0.45"'))   # the parting
        for sgn in (-1, 1):
            L.append(G(C(300 + sgn * 150, hy - 2, 15, c["tie"]) + C(300 + sgn * 146, hy - 6, 5, "#FFFFFF", ' opacity="0.6"'), sh))
    elif c["style"] == "bob":
        outer = top(170, 370, 164, 160)
        fringe = [(456, hy - 2), (450, hy - 48), (300 + 120, hy - 66), (300, hy - 70), (180, hy - 66), (150, hy - 48), (144, hy - 2)]
        L.append(G(P(smooth(outer + fringe), h), cut))
        L.append("".join(stroke(f"M{x},{hy - 70} L{x + 2},{hy - 104}", hd, 4, ' opacity="0.5"') for x in (220, 262, 304, 346, 388)))
        L.append(P(f"M190,{hy - 108} Q250,{hy - 142} 330,{hy - 140} Q258,{hy - 128} 204,{hy - 96}Z", hl, ' opacity="0.8"'))
        bx, by = 396, hy - 132
        bow = (P(f"M{bx},{by} Q{bx - 52},{by - 46} {bx - 58},{by + 6} Q{bx - 40},{by + 38} {bx},{by}Z", c["bow"])
               + P(f"M{bx},{by} Q{bx + 52},{by - 46} {bx + 58},{by + 6} Q{bx + 40},{by + 38} {bx},{by}Z", c["bow"])
               + C(bx, by, 14, mix(c["bow"], "#3A2216", .2)) + C(bx - 30, by - 8, 7, "#FFFFFF", ' opacity="0.5"'))
        L.append(G(bow, sh))
    elif c["style"] == "curly":
        spots = [(300, hy - 132, 34), (254, hy - 128, 32), (346, hy - 128, 32), (212, hy - 112, 30), (388, hy - 112, 30),
                 (178, hy - 84, 28), (422, hy - 84, 28), (160, hy - 48, 24), (440, hy - 48, 24), (276, hy - 96, 26),
                 (324, hy - 96, 26), (232, hy - 84, 24), (368, hy - 84, 24)]
        L.append(curl_mass(c, spots, p, 960, "cut"))
    else:  # messy: a jagged fringe
        outer = top(172, 368, 158, 154)
        fringe = [(450, hy - 20), (430, hy - 50), (404, hy - 58), (388, hy - 40), (366, hy - 76), (340, hy - 62), (312, hy - 84), (288, hy - 60), (262, hy - 80), (236, hy - 56), (212, hy - 70), (186, hy - 44), (152, hy - 18)]
        L.append(G(P(smooth(outer + fringe), h), cut))
        L.append(P(f"M196,{hy - 100} Q250,{hy - 136} 320,{hy - 132} Q258,{hy - 120} 210,{hy - 88}Z", hl, ' opacity="0.8"'))
    return "".join(L)


def body_layer(name):
    c = pal(KIDS[name])
    p = f"kd{name[:2]}-bd-"
    return svg(W, H, defs(p, 700 + len(name)), G(lower_body(c, p) + head(c, p), p + "gr"))


# ---------------- the face layers ----------------
def eye_geo(c):
    return dict(xs=(244, 356), y=c["hy"] + 22, rx=27, ry=33, lash=c["lash"], brow=mix(c["hair"], "#3A2216", .3))


def mouth_layer(name, kind):
    c = pal(KIDS[name])
    p = f"kd{name[:2]}-m{kind[0]}-"
    my = c["hy"] + 98
    teeth = "#FFFBF2"
    if kind == "open":
        d = f"M262,{my - 16} Q300,{my - 8} 338,{my - 16} Q348,{my - 16} 345,{my - 4} Q336,{my + 38} 300,{my + 40} Q264,{my + 38} 255,{my - 4} Q252,{my - 16} 262,{my - 16}Z"
        inner = (f'<clipPath id="{p}c"><path d="{d}"/></clipPath>'
                 + G(P(d, c["mouth"]) + G(E(300, my + 40, 32, 20, "#EE7A70")
                                          + P(f"M266,{my - 14} Q300,{my - 6} 334,{my - 14} L332,{my - 2} Q300,{my + 6} 268,{my - 2}Z", teeth),
                                          None, f' clip-path="url(#{p}c)"'), p + "sh"))
    elif kind == "closed":
        d = f"M268,{my - 12} Q300,{my + 4} 332,{my - 12} Q338,{my - 14} 337,{my - 7} Q322,{my + 20} 300,{my + 20} Q278,{my + 20} 263,{my - 7} Q262,{my - 14} 268,{my - 12}Z"
        inner = G(P(d, c["mouth"]) + E(300, my + 13, 11, 4, "#DC6C66"), p + "sh")
    else:  # chew: puffed cheeks, a wavy closed mouth
        inner = ""
        for sgn in (-1, 1):
            cx = 300 + sgn * 70
            inner += G(P(wob(cx, my - 10, 34, 28, .03, 60 + sgn), c["skin"]) + E(cx + sgn * 6, my - 10, 26, 17, CHEEK, ' opacity="0.75"'), p + "sh")
        inner += G(stroke(smooth_open([(274, my - 6), (287, my + 2), (300, my - 3), (313, my + 2), (326, my - 6)], .2), c["mouth"], 9), p + "sh")
    return svg(W, H, face_defs(p, 80 + len(kind) + len(name)), inner)


def save(name, s):
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:28s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name in KIDS:
        if only and name not in only:
            continue
        c = pal(KIDS[name])
        save(f"kid-{name}-body", body_layer(name))
        for kind in ("open", "blink", "happy", "surprised"):
            d, b = guest_eyes(eye_geo(c), kind, "k" + name)
            save(f"kid-{name}-eyes-{kind}", svg(W, H, d, b))
        for kind in ("closed", "open", "chew"):
            save(f"kid-{name}-mouth-{kind}", mouth_layer(name, kind))
    # the frame points the game uses (core/clinic.ts): forehead, cheeks, chest, knee (left), hand (left), spots
    for name, c in KIDS.items():
        hy, k = c["hy"], c["body"]
        b = lambda x, y: (round(300 + (x - 300) * k), round(684 + (y - 684) * k))
        print(name, "forehead", (300, hy - 60), "cheeks", ((206, hy + 80), (394, hy + 80)), "nose", (300, hy + 62),
              "chest", (b(300, 470), b(250, 520), b(350, 520)), "knee", b(232, 604), "hand", b(216, 562))


if __name__ == "__main__":
    main()

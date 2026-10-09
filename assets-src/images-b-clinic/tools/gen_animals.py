# The clinic, round 5 (research/clinic-spec-5.md): four more animal patients, on the guests' kit (gen_guests.py: Pipa's
# eyes, the soft mouths) and the images-b kit (pb.py, READ-ONLY). Each is a stack of layers on the patients' 600x700 frame
# (feet on y 684), exactly like Pipa, the guests and the children, so the game's Character class drives them: body, eyes
# open / blink / happy / surprised, mouth closed / open / chew. They sit, front paws down.
# - Mittens the cat: ginger and white, stripes, a curly tail, a bell on her collar.
# - Bao the panda: black and white, a round tummy, a little honey pot beside him (only a picture).
# - Clover the bunny: peach and cream, one ear flopped over, two front teeth.
# - Biscuit the puppy: golden brown, floppy ears, his tongue out in a smile.
# Run: python tools/gen_animals.py [names...]   (writes animal-<name>-*.svg into images-b-clinic/; then copy them into
# public/assets/images and bake the WebPs). The frame points the game uses are printed at the end (core/clinic.ts).
import math, os, sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-guests", "tools")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
from pb import *                      # noqa: F401,F403
from gen_guests import eyes as guest_eyes, face_defs, at   # noqa: E402
from gen_mom import taper   # noqa: E402

W, H = 600, 700

CAT = dict(fur="#F2A65A", fur_d="#D9823A", fur_l="#F8C88E", white="#FFF6EA", white_d="#EBDCC8", ear="#F3A6A0",
           nose="#E8838A", collar="#E2533F", bell="#EEB23C", mouth="#6E2E26", brow="#B8692E")
PANDA = dict(white="#FBF8F2", white_d="#E4DED2", black="#38302E", black_l="#5A504C", cream="#F7EFE0", pad="#7A6A64",
             jar="#EEB23C", jar_d="#C98A22", lid="#E2533F", mouth="#6E2E26", brow="#38302E")
BUNNY = dict(fur="#F2CDA8", fur_d="#E0B088", fur_l="#FBE6D2", cream="#FFF6EA", ear="#F3A6A0", nose="#E8838A",
             tooth="#FFFDF7", mouth="#6E2E26", brow="#C99878")
PUP = dict(fur="#D9A25E", fur_d="#B98243", fur_l="#EBC48C", ear="#8E5A30", ear_l="#A86E3A", cream="#F5DDB4",
           nose="#2E201B", collar="#4C8FD0", tag="#EEB23C", tongue="#EE7A70", mouth="#6E2E26", brow="#8E5A30")


def defs(p, seed):
    return std_defs(p, "smooth", seed, sh=(5, 4, .33))


def shadow(p, rx=170):
    return G(E(300, 680, rx, 11, SH, ' opacity="0.38"'), p + "bl")


# ---------------- Mittens the cat ----------------
CAT_EYES = dict(xs=(246, 354), y=322, rx=29, ry=35, lash=True, brow=CAT["brow"])
CAT_MOUTH = dict(x=300, y=402, s=.6, cheek_dx=96, face=CAT["white"])


def cat_body():
    c, p = CAT, "acat-bd-"
    cut, sh = p + "cut", p + "sh"
    L = [shadow(p, 180)]
    # the curly tail, behind her, up on the right
    pts = [(400, 640), (470, 630), (510, 580), (512, 520), (490, 482), (458, 476), (444, 500), (462, 516)]
    L.append(G(P(taper(pts, [40, 38, 36, 34, 30, 26, 22, 18]), c["fur"]) + "".join(
        stroke(f"M{n(x - 14)},{n(y - 8)} L{n(x + 14)},{n(y + 8)}", c["fur_d"], 6, ' opacity="0.8"') for x, y in ((470, 630), (508, 566), (500, 500))), cut))
    # the body sitting: haunches, the white chest, the front paws
    L.append(G(P(wob(190, 630, 66, 52, .04, 1), c["fur"]) + P(wob(410, 630, 66, 52, .04, 2), c["fur"]), cut))
    L.append(G(P(wob(300, 560, 142, 128, .02, 3), c["fur"]), cut))
    L.append("".join(stroke(f"M{x},{y} q{18 * s},14 {6 * s},40", c["fur_d"], 9, ' opacity="0.7"') for x, y, s in ((176, 520, 1), (172, 576, 1), (424, 520, -1), (428, 576, -1))))
    L.append(G(P(wob(300, 566, 78, 104, .03, 4), c["white"]), sh))
    for sgn, sd in ((-1, 5), (1, 6)):
        x = 300 + sgn * 54
        L.append(G(P(wrect(x - 30, 586, 60, 80, 26, 1, sd), c["white"]) + "".join(stroke(f"M{x + dx},{652} L{x + dx},{664}", c["white_d"], 4) for dx in (-10, 10)), sh))
    # the collar and its bell
    L.append(G(P("M204,446 Q300,480 396,446 L398,466 Q300,502 202,466Z", c["collar"]), sh))
    L.append(G(C(300, 498, 20, c["bell"]) + C(294, 492, 6, "#FFF4C8") + stroke("M286,506 L314,506", mix(c["bell"], "#3A2216", .3), 4) + C(300, 512, 3.5, "#3A2216"), sh))
    # the head: pointed ears, stripes on the forehead, the white muzzle and pink nose, whiskers
    for sgn, sd in ((-1, 7), (1, 8)):
        x = 300 + sgn * 104
        L.append(G(P(f"M{x - 54},{254} L{x + sgn * 16},{150} L{x + 54},{240}Z", c["fur"]), cut))
        L.append(P(f"M{x - 30},{246} L{x + sgn * 12},{180} L{x + 30},{240}Z", c["ear"]))
    L.append(G(P(wob(300, 330, 148, 120, .02, 9), c["fur"]), cut))
    L.append(P(wob(276, 290, 86, 50, .05, 10), c["fur_l"], ' opacity="0.45"'))
    L.append("".join(stroke(f"M{x},{214} Q{x + 4},{240} {x},{258}", c["fur_d"], 10, ' opacity="0.85"') for x in (276, 300, 324)))
    L.append("".join(stroke(f"M{300 + s * 146},{y} q{-s * 26},4 {-s * 40},14", c["fur_d"], 8, ' opacity="0.8"') for s in (-1, 1) for y in (316, 346)))
    L.append(G(P(wob(300, 392, 76, 50, .04, 11), c["white"]), sh))
    L.append(E(212, 374, 26, 16, CHEEK, ' opacity="0.7"') + E(388, 374, 26, 16, CHEEK, ' opacity="0.7"'))
    L.append(G(P("M286,372 L314,372 Q312,386 300,390 Q288,386 286,372Z", c["nose"]), sh))
    L.append("".join(stroke(f"M{300 + s * 40},{y} L{300 + s * 112},{y + dy}", "#FFFFFF", 3, ' opacity="0.9"') for s in (-1, 1) for y, dy in ((390, -10), (402, 6))))
    return svg(W, H, defs(p, 181), G("".join(L), p + "gr"))


# ---------------- Bao the panda ----------------
PANDA_EYES = dict(xs=(246, 354), y=338, rx=26, ry=31, lash=False, brow=PANDA["brow"])
PANDA_MOUTH = dict(x=300, y=420, s=.6, cheek_dx=100, face=PANDA["white"])


def honey_pot(x, y, c, p):
    s = P(wob(x, y, 40, 36, .04, 31), c["jar"]) + P(wob(x - 12, y - 8, 12, 18, .1, 32), "#FFE08A", ' opacity="0.7"')
    s += P(f"M{x - 34},{y - 30} Q{x},{y - 52} {x + 34},{y - 30} L{x + 38},{y - 20} Q{x},{y - 34} {x - 38},{y - 20}Z", c["lid"])
    s += P(f"M{x + 10},{y - 22} Q{x + 18},{y - 2} {x + 12},{y + 6} Q{x + 6},{y - 4} {x + 6},{y - 20}Z", c["jar_d"])
    return G(s, p + "sh")


def panda_body():
    c, p = PANDA, "apan-bd-"
    cut, sh = p + "cut", p + "sh"
    L = [shadow(p, 190)]
    L.append(honey_pot(92, 640, c, p))
    # legs, the round tummy, arms; a black band over the shoulders
    for sgn, sd in ((-1, 1), (1, 2)):
        x = 300 + sgn * 92
        L.append(G(P(wob(x, 646, 62, 40, .04, sd), c["black"]) + P(wob(x, 652, 30, 20, .08, sd + 4), c["pad"], ' opacity="0.8"')
                   + "".join(C(x + dx, 622, 7, c["pad"], ' opacity="0.8"') for dx in (-20, 0, 20)), cut))
    L.append(G(P(wob(300, 560, 156, 132, .02, 3), c["white"]), cut))
    L.append(P(wob(300, 590, 96, 84, .03, 4), c["cream"]))
    L.append(G(P(wob(300, 462, 160, 42, .04, 5), c["black"]), sh))
    for sgn, sd in ((-1, 6), (1, 7)):
        sx = 300 + sgn * 128
        pts = [(sx, 470), (sx + sgn * 10, 520), (sx - sgn * 10, 566), (sx - sgn * 34, 590)]
        L.append(G(P(taper(pts, [70, 64, 58, 52]), c["black"]), sh))
    # the head: black ears, eye patches (a cream ring where the eyes go), the muzzle and nose
    for sgn in (-1, 1):
        L.append(G(C(300 + sgn * 120, 226, 46, c["black"]) + C(300 + sgn * 118, 230, 24, c["black_l"], ' opacity="0.7"'), cut))
    L.append(G(P(wob(300, 340, 156, 128, .02, 8), c["white"]), cut))
    L.append(P(wob(280, 290, 90, 50, .05, 9), "#FFFFFF", ' opacity="0.5"'))
    for sgn, x in ((-1, 246), (1, 354)):
        L.append(P(wob(x + sgn * 4, 346, 46, 56, .05, 10 + sgn, 18, -sgn * 28), c["black"]))
        L.append(E(x, 338, 32, 37, c["cream"]))
    L.append(G(P(wob(300, 410, 66, 44, .04, 12), c["cream"]), sh))
    L.append(E(204, 396, 24, 15, CHEEK, ' opacity="0.7"') + E(396, 396, 24, 15, CHEEK, ' opacity="0.7"'))
    L.append(G(P("M282,384 Q300,376 318,384 Q314,402 300,404 Q286,402 282,384Z", c["black"]) + C(294, 386, 4, "#FFFFFF", ' opacity="0.6"'), sh))
    return svg(W, H, defs(p, 191), G("".join(L), p + "gr"))


# ---------------- Clover the bunny ----------------
BUNNY_EYES = dict(xs=(248, 352), y=330, rx=28, ry=34, lash=True, brow=BUNNY["brow"])
BUNNY_MOUTH = dict(x=300, y=402, s=.58, cheek_dx=96, face=BUNNY["fur"])


def bunny_body():
    c, p = BUNNY, "abun-bd-"
    cut, sh = p + "cut", p + "sh"
    L = [shadow(p, 170)]
    # the cotton tail peeking out on the right
    L.append(G(P(wob(436, 612, 40, 36, .08, 1, 16), c["cream"]), cut))
    # long hind feet, the body, the cream tummy, little front paws
    for sgn, sd in ((-1, 2), (1, 3)):
        x = 300 + sgn * 104
        L.append(G(P(wob(x, 664, 66, 22, .04, sd), c["fur"]) + "".join(C(x + sgn * 44 + dx, 664, 7, c["fur_d"], ' opacity="0.6"') for dx in (-10, 6)), cut))
    L.append(G(P(wob(300, 566, 136, 120, .02, 4), c["fur"]), cut))
    L.append(P(wob(300, 588, 82, 84, .03, 5), c["cream"]))
    for sgn, sd in ((-1, 6), (1, 7)):
        x = 300 + sgn * 50
        L.append(G(P(wrect(x - 24, 590, 48, 64, 22, 1, sd), c["fur"]) + stroke(f"M{x - 8},{644} L{x - 8},{652}", c["fur_d"], 4) + stroke(f"M{x + 8},{644} L{x + 8},{652}", c["fur_d"], 4), sh))
    # the ears: the left one tall, the right one flopped over
    L.append(G(P(wob(234, 150, 36, 112, .03, 8, 22, -8), c["fur"]) + P(wob(236, 160, 18, 84, .05, 9, 18, -8), c["ear"]), cut))
    flop = [(362, 240), (378, 160), (404, 112), (446, 110), (480, 150), (494, 206)]
    L.append(G(P(taper(flop, [66, 70, 70, 66, 58, 44]), c["fur"]) + P(taper(flop[1:], [34, 36, 34, 28, 18]), c["ear"], ' opacity="0.9"'), cut))
    # the head, fluffy cheeks, the muzzle, the pink nose
    L.append(G(P(wob(300, 336, 140, 120, .02, 10), c["fur"]), cut))
    L.append(G(P(wob(196, 380, 40, 34, .06, 11), c["fur"]) + P(wob(404, 380, 40, 34, .06, 12), c["fur"]), sh))
    L.append(P(wob(280, 292, 80, 46, .05, 13), c["fur_l"], ' opacity="0.6"'))
    L.append(G(P(wob(300, 396, 64, 42, .04, 14), c["cream"]), sh))
    L.append(E(210, 380, 24, 15, CHEEK, ' opacity="0.7"') + E(390, 380, 24, 15, CHEEK, ' opacity="0.7"'))
    L.append(G(P(wob(300, 376, 16, 11, .08, 15), c["nose"]), sh))
    return svg(W, H, defs(p, 201), G("".join(L), p + "gr"))


# ---------------- Biscuit the puppy ----------------
PUP_EYES = dict(xs=(250, 350), y=318, rx=29, ry=35, lash=False, brow=PUP["brow"])
PUP_MOUTH = dict(x=300, y=408, s=.6, cheek_dx=98, face=PUP["cream"])


def pup_body():
    c, p = PUP, "apup-bd-"
    cut, sh = p + "cut", p + "sh"
    L = [shadow(p, 180)]
    # the tail up on the right, wagging
    L.append(G(P(taper([(410, 600), (466, 560), (500, 500), (506, 456)], [36, 32, 26, 18]), c["fur"]), cut))
    for sgn, sd in ((-1, 1), (1, 2)):
        L.append(G(P(wob(300 + sgn * 112, 634, 64, 48, .04, sd), c["fur"]), cut))
    L.append(G(P(wob(300, 562, 138, 126, .02, 3), c["fur"]), cut))
    L.append(G(P(wob(300, 548, 72, 88, .03, 4), c["cream"]), sh))
    for sgn, sd in ((-1, 5), (1, 6)):
        x = 300 + sgn * 54
        L.append(G(P(wrect(x - 28, 580, 56, 86, 24, 1, sd), c["fur"]) + P(wob(x, 660, 32, 16, .05, sd + 9), c["cream"])
                   + stroke(f"M{x - 9},{654} L{x - 9},{666}", c["fur_d"], 4) + stroke(f"M{x + 9},{654} L{x + 9},{666}", c["fur_d"], 4), sh))
    # the collar and its tag
    L.append(G(P("M206,446 Q300,478 394,446 L396,466 Q300,500 204,466Z", c["collar"]), sh))
    L.append(G(C(300, 498, 18, c["tag"]) + C(300, 498, 8, mix(c["tag"], "#FFFFFF", .4)), sh))
    # the head, a lighter muzzle, the big black nose; the floppy ears hang in front of the head's sides
    L.append(G(P(wob(300, 326, 146, 124, .02, 7), c["fur"]), cut))
    L.append(P(wob(278, 270, 84, 48, .05, 8), c["fur_l"], ' opacity="0.5"'))
    L.append(P(wob(352, 300, 44, 40, .06, 9), c["fur_l"], ' opacity="0.6"'))
    L.append(G(P(wob(300, 396, 80, 54, .04, 10), c["cream"]), sh))
    L.append(E(214, 380, 24, 15, CHEEK, ' opacity="0.7"') + E(386, 380, 24, 15, CHEEK, ' opacity="0.7"'))
    L.append(G(P(wob(300, 370, 28, 19, .05, 11), c["nose"]) + E(292, 364, 9, 5, "#FFFFFF", ' opacity="0.6"'), sh))
    for sgn, sd in ((-1, 12), (1, 13)):
        L.append(G(P(wob(300 + sgn * 158, 330, 42, 92, .05, sd, 22, -sgn * 16), c["ear"]) + P(wob(300 + sgn * 160, 340, 22, 62, .08, sd + 4, 18, -sgn * 16), c["ear_l"], ' opacity="0.7"'), cut))
    return svg(W, H, defs(p, 211), G("".join(L), p + "gr"))


# ---------------- the mouths (Pipa's soft mouths, moved and sized; the bunny's teeth, the puppy's tongue) ----------------
def mouth(kind, c, m, name, extra=""):
    p = f"a{name[:3]}-m{kind[0]}-"
    if kind == "open":
        d = "M252,394 Q300,408 348,394 Q360,392 358,406 Q350,474 300,476 Q250,474 242,406 Q240,392 252,394Z"
        inner = (f'<clipPath id="{p}c"><path d="{d}"/></clipPath>'
                 + G(P(d, c["mouth"]) + G(E(300, 482, 46, 32, "#EE7A70"), None, f' clip-path="url(#{p}c)"'), p + "sh"))
        if extra == "teeth":
            inner += G(P("M282,398 L298,400 L298,426 Q290,430 282,424Z", c["tooth"]) + P("M302,400 L318,398 L318,424 Q310,430 302,426Z", c["tooth"]), p + "sh")
    elif kind == "closed":
        d = "M262,396 Q300,418 338,396 Q344,393 343,400 Q328,432 300,432 Q272,432 257,400 Q256,393 262,396Z"
        if extra == "teeth":   # a little "w" and two front teeth under it
            inner = G(stroke("M258,396 Q278,414 300,398 Q322,414 342,396", c["mouth"], 10) + P("M280,404 L298,402 L298,438 Q288,442 280,436Z", c["tooth"])
                      + P("M302,402 L320,404 L320,436 Q312,442 302,438Z", c["tooth"]) + stroke("M300,402 L300,438", "#E4DDD0", 3), p + "sh")
        elif extra == "tongue":   # a happy pant, the tongue out
            inner = G(P(d, c["mouth"]) + P("M276,418 Q300,428 324,418 Q330,470 300,476 Q270,470 276,418Z", c["tongue"]) + stroke("M300,428 L300,460", mix(c["tongue"], "#3A2216", .25), 4, ' opacity="0.7"'), p + "sh")
        else:
            inner = G(P(d, c["mouth"]) + E(300, 424, 14, 5, "#DC6C66"), p + "sh")
    else:  # chew: puffed cheeks + a wavy closed mouth
        inner = ""
        for sgn in (-1, 1):
            cx = 300 + sgn * m["cheek_dx"]
            inner += G(P(wob(cx, 408, 48, 40, .03, 60 + sgn), m["face"]) + E(cx + sgn * 8, 408, 36, 24, CHEEK, ' opacity="0.8"'), p + "sh")
        inner += G(stroke(smooth_open([(266, 406), (283, 418), (300, 411), (317, 418), (334, 406)], .2), c["mouth"], 12), p + "sh")
    return svg(W, H, face_defs(p, 91 + len(kind) + len(name)), at(m["x"], m["y"], m["s"], inner))


ANIMALS = {
    "cat": (cat_body, CAT, CAT_EYES, CAT_MOUTH, ""),
    "panda": (panda_body, PANDA, PANDA_EYES, PANDA_MOUTH, ""),
    "bunny": (bunny_body, BUNNY, BUNNY_EYES, BUNNY_MOUTH, "teeth"),
    "puppy": (pup_body, PUP, PUP_EYES, PUP_MOUTH, "tongue"),
}

# The frame points the game uses (core/clinic.ts): forehead, cheeks, nose, chest (3), a front paw (the splinter, the
# scrape), places for spots / mud / burns (face first, then the body), the tummy's tint.
POINTS = {
    "cat": dict(forehead=(300, 256), cheeks=((212, 374), (388, 374)), nose=(300, 380), chest=((300, 552), (256, 600), (344, 600)),
                foot=(354, 640), spots=((230, 380), (370, 380), (196, 540), (404, 540), (300, 600), (300, 246), (250, 520), (350, 640))),
    "panda": dict(forehead=(300, 264), cheeks=((204, 396), (396, 396)), nose=(300, 392), chest=((300, 540), (254, 600), (346, 600)),
                  foot=(392, 646), spots=((210, 400), (390, 400), (300, 600), (240, 620), (360, 620), (300, 262), (256, 540), (344, 560))),
    "bunny": dict(forehead=(300, 266), cheeks=((210, 380), (390, 380)), nose=(300, 376), chest=((300, 540), (256, 596), (344, 596)),
                  foot=(404, 664), spots=((220, 384), (380, 384), (196, 560), (404, 560), (300, 610), (300, 262), (258, 540), (342, 620))),
    "puppy": dict(forehead=(300, 252), cheeks=((214, 380), (386, 380)), nose=(300, 370), chest=((300, 540), (254, 590), (346, 590)),
                  foot=(354, 650), spots=((226, 386), (374, 386), (196, 560), (404, 560), (300, 600), (300, 248), (250, 530), (350, 620))),
}


def save(name, s):
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:30s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, (body, c, ey, m, extra) in ANIMALS.items():
        if only and name not in only:
            continue
        save(f"animal-{name}-body", body())
        for kind in ("open", "blink", "happy", "surprised"):
            d, b = guest_eyes(ey, kind, "a" + name)
            save(f"animal-{name}-eyes-{kind}", svg(W, H, d, b))
        for kind in ("closed", "open", "chew"):
            save(f"animal-{name}-mouth-{kind}", mouth(kind, c, m, name, extra))
    for name, pt in POINTS.items():
        print(name, pt)


if __name__ == "__main__":
    main()

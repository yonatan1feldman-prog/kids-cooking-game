# The mermaid world (research/mermaid-spec.md, change of 2026-11-06): Marina, the little mermaid girl who swims beside
# Mom in the lagoon and in every activity (in place of Pipa in her bubble). A child of the clinic's kids' kit
# (images-b-clinic/tools/gen_kids.py: the head, the eyes, the mouths) on the same 600x700 frame (feet, here the tail's
# lowest curve, on y 684), so the game's Character class drives her like Pipa: body, eyes open / blink / happy /
# surprised, mouth closed / open / chew. Long golden wavy hair with a starfish band, a pink shell top, a lilac tail with
# shimmering scales curling to her left and a wide pink fluke.
# Run: python tools/gen_marina.py   (writes marina-*.svg into images-b-sea/; then copy them into public/assets/images
# and bake the WebPs).
import math, os, sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-clinic", "tools")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-guests", "tools")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
import gen_kids as gk   # noqa: E402
from pb import *        # noqa: F401,F403,E402
from gen_mom import taper, scales, sparkle, grad, fluke as mom_fluke   # noqa: E402
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))

gk.KIDS["marina"] = dict(skin="#F4CFAE", hair="#E8A93A", style="wavy", band="#F7A04B", shirt="#F58FB4", bottom="#9A86E8",
                         skirt=True, sock="#FFFDF7", shoe="#F58FB4", lash=True, freckles=False, hy=236, body=1.0)
TAIL, TAIL_D, TAIL_L = "#9A86E8", "#7563C8", "#D6CCFA"
SHELL, SHELL_D, SHELL_L = "#F58FB4", "#D9668F", "#FFD0E0"
PEARL = "#F4F1EA"


def long_hair(c, p):
    """Her long wavy hair behind her head and back, down to her waist, a little lifted by the water."""
    hy = c["hy"]
    def side(sgn, k=12):
        return [(300 + sgn * (150 + 46 * (i / (k - 1)) + 16 * math.sin(i / (k - 1) * math.pi * 3)), hy + 10 + 300 * i / (k - 1)) for i in range(k)]
    right, left = side(1), side(-1)
    x0, x1 = right[-1][0], left[-1][0]
    tips = [(x0 + (x1 - x0) * i / 7, hy + 316 + (18 if i % 2 else -4)) for i in range(1, 7)]
    top = [(300 + math.cos(math.radians(a)) * 166, hy + math.sin(math.radians(a)) * 162) for a in range(200, 341, 20)]
    out = top + right + tips + left[::-1]
    inner = [(x * .94 + 300 * .06, y - 10) for x, y in out]
    s = G(P(smooth(out), c["hair_d"]), p + "cut") + P(smooth(inner), c["hair"])
    st = "".join(stroke(smooth_open([(300 + xr + 12 * math.sin(i / 6 * math.pi * 3 + ph), hy + 40 + 46 * i) for i in range(7)], .2), col, w, f' opacity="{op}"')
                 for xr, ph, col, w, op in ((-160, 0, c["hair_m"], 14, .7), (160, 0, c["hair_m"], 14, .7), (-176, .6, c["hair_l"], 5, .8),
                                            (176, .6, c["hair_l"], 5, .8), (-140, 1.8, c["hair_l"], 5, .7), (140, 1.8, c["hair_l"], 5, .7)))
    return s + f'<clipPath id="{p}hc"><path d="{smooth(inner)}"/></clipPath><g clip-path="url(#{p}hc)">{st}</g>'


# the tail's centre line: from her waist down, curling to her left (the viewer's right) and up into the fluke
TAIL_LINE = [(300, 540), (302, 590), (316, 630), (348, 658), (390, 668), (428, 656), (454, 630)]
TAIL_W = [210, 196, 170, 140, 110, 84, 60]


def mer_body(c, p):
    cut, sh = p + "cut", p + "sh"
    L = [G(E(330, 690, 150, 9, SH, ' opacity="0.25"'), p + "bl")]
    body = taper(TAIL_LINE, TAIL_W, cap=3)
    g = f"{p}tg"
    L.append(grad(g, ((0, TAIL), (0.7, TAIL), (1, SHELL)), 0, 0, 1, 1))
    L.append(f'<clipPath id="{p}tc"><path d="{body}"/></clipPath>')
    L.append(G(P(body, TAIL_D, ' transform="translate(0 5)"') + P(body, f"url(#{g})"), cut))
    L.append(scales(f"{p}tc", 180, 520, 520, 700, 14, TAIL_D, TAIL_L, 0.8))
    L.append(f'<g clip-path="url(#{p}tc)">' + P(taper([(270, 560), (276, 600), (294, 636), (330, 660), (380, 668)], [18, 18, 16, 12, 8], cap=2), WHITE, ' opacity="0.35"') + "</g>")
    L.append(mom_fluke(p, 454, 628, 28, 0.64))
    L.append(G(P(wob(454, 630, 24, 12, .12, 7, 14, 30), TAIL_D) + P(wob(452, 626, 15, 6, .12, 9, 12, 30), TAIL_L, ' opacity="0.7"'), sh))
    # the frilly fin band at her waist
    frill = "M196,536 " + " ".join(f"Q{n(196 + i * 26 + 13)},{n(566)} {n(196 + (i + 1) * 26)},536" for i in range(8)) + " L404,520 Q300,506 196,520Z"
    L.append(G(P(frill, SHELL_D, ' transform="translate(0 3)"') + P(frill, SHELL), sh))
    # the top: a pink top with a scallop-shell front and little pearl straps
    torso = "M206,436 Q216,412 256,404 L344,404 Q384,412 394,436 L404,528 Q300,540 196,528Z"
    L.append(G(P(torso, c["skin"]), cut))
    top = "M206,460 Q300,440 394,460 L402,526 Q300,538 198,526Z"
    L.append(G(P(top, c["shirt_d"], ' transform="translate(0 3)"') + P(top, c["shirt"]), sh))
    L.append("".join(stroke(f"M300,530 L{x},{462 if abs(x - 300) < 60 else 470}", SHELL_L, 4, ' opacity="0.8"') for x in (226, 262, 300, 338, 374)))
    L.append(stroke("M210,462 Q300,442 390,462", SHELL_L, 6, ' opacity="0.9"'))
    L.append("".join(C(x, y, 4.5, PEARL) for x, y in [(240 + i * 2, 410 + i * 10) for i in range(5)] + [(360 - i * 2, 410 + i * 10) for i in range(5)]))
    L.append(P("M262,406 Q300,432 338,406 L330,404 Q300,422 270,404Z", gk.mix(c["skin"], "#6A3226", .22)))
    # arms: down her sides, hands resting at her waist (the fin band)
    for sgn, seed in ((-1, 7), (1, 8)):
        sx = 300 + sgn * 96
        pts = [(sx, 446), (sx + sgn * 16, 486), (sx + sgn * 12, 522), (sx - sgn * 2, 548)]
        L.append(G(P(taper(pts, [40, 38, 36, 32]), c["skin"]), sh))
        L.append(G(P(wob(sx + sgn * 2, 444, 30, 26, .05, seed, 18, sgn * 20), c["skin"]) + P(wob(sx - sgn * 6, 438, 12, 7, .08, seed + 9, 12), c["skin_l"], ' opacity="0.5"'), sh))
        L.append(G(P(wob(sx - sgn * 6, 556, 24, 21, .06, seed + 20), c["skin"]) + P(wob(sx - sgn * 12, 552, 8, 11, .1, seed + 30, 12), c["skin_l"], ' opacity="0.5"'), sh))
    L.append("".join(sparkle(x, y, r) for x, y, r in ((360, 640, 8), (300, 600, 6), (410, 660, 7), (520, 540, 7))))
    return "".join(L)


def body_layer():
    c = gk.pal(gk.KIDS["marina"])
    p = "mrn-bd-"
    star = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        r = 30 if i % 2 == 0 else 13
        star.append((404 + math.cos(a) * r, c["hy"] - 118 + math.sin(a) * r))
    st = G(P(smooth(star, 1 / 9), "#D9772E", ' transform="translate(0 3)"') + P(smooth(star, 1 / 9), "#F7A04B"), p + "sh") + C(404, c["hy"] - 118, 5, "#FFC98A")
    return svg(gk.W, gk.H, gk.defs(p, 741), G(long_hair(c, p) + mer_body(c, p) + gk.head(c, p) + st, p + "gr"))


def save(name, s):
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    print(f"{name:28s} {len(s.encode()) / 1024:6.1f} KB")


def main():
    c = gk.pal(gk.KIDS["marina"])
    save("marina-body", body_layer())
    for kind in ("open", "blink", "happy", "surprised"):
        d, b = gk.guest_eyes(gk.eye_geo(c), kind, "kmarina")
        save(f"marina-eyes-{kind}", svg(gk.W, gk.H, d, b))
    for kind in ("closed", "open", "chew"):
        save(f"marina-mouth-{kind}", gk.mouth_layer("marina", kind))


if __name__ == "__main__":
    main()

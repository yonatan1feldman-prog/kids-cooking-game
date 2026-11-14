# The mermaid salon (research/mermaid-dressup-spec.md 4 and 10, PR V): the three little mermaid girls who come to the
# salon, Marina (the friend from the lagoon), Coral and Pearl. All three are children of the clinic's kids' kit
# (images-b-clinic/tools/gen_kids.py: the head, the eyes) on the characters' 600x700 frame (the tail's lowest curve on
# y 684), with the SAME head (hy 236) and body (1.0), so every salon item (hair, tails, tops, jewels: gen_salon.py) sits
# on all three alike. They come WITHOUT hair and WITHOUT a tail (those are the items): a short cap of hair in her own
# colour under any hairstyle (she is never bald between two styles), a plain cream vest with one little sea thing on it
# (a paper doll is always dressed), arms down with her hands resting at her waist.
# Layers per girl (the game's Character): cust-<id>-body, -eyes-open / blink / happy / surprised, -mouth-closed / open /
# chew. The MOUTHS are baked white and grey (shape and shade only) and the game tints them: her own lip colour, or the
# lipstick (ART_SALON.lips in core/salonAssets.ts has each girl's natural tint, compensated for the grey).
# Run: python tools/gen_customers.py   (writes cust-*.svg into images-b-sea/ and src/core/salonFaceArt.ts; then copy
# the SVGs into public/assets/images and bake the WebPs).
import math, os, sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-clinic", "tools")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-guests", "tools")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
import gen_kids as gk   # noqa: E402
from pb import *        # noqa: F401,F403,E402
from gen_mom import taper   # noqa: E402
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
REPO = os.path.normpath(os.path.join(HERE, "..", "..", ".."))

HY = 236   # the head's centre in the frame: the same for all three (spec 4)

# Each girl: skin, her natural hair (the cap, the brows), the vest's little sea thing, her earrings, her lips (natural).
CUSTOMERS = {
    "marina": dict(skin="#F4CFAE", hair="#E8A93A", badge="shell", badge_col="#F58FB4", ear="pearl", lips="#E98A86"),
    "coral": dict(skin="#8D5A3B", hair="#3A2418", badge="star", badge_col="#F7A04B", ear="gold", lips="#B8605A"),
    "pearl": dict(skin="#FBE3D3", hair="#2B2B38", badge="fan", badge_col="#B99BD8", ear="pink", lips="#EE9AA0"),
}
for _id, _c in CUSTOMERS.items():
    gk.KIDS["c" + _id] = dict(skin=_c["skin"], hair=_c["hair"], style="none", shirt="#FBF0DA", bottom="#FBF0DA", skirt=False,
                              sock="#FFFDF7", shoe="#FFFDF7", lash=True, freckles=False, hy=HY, body=1.0)

# The tinted layers' values (white paper, grey shade): every tinted salon picture uses these, so one tint reads alike on
# all of them. LIP_BASE is the lips' main value: the game's tint for a colour X is X / LIP_BASE (ART_SALON.lips does it).
T_HI, T_BASE, T_MID, T_DARK, T_DEEP = "#FFFFFF", "#E6E6EC", "#C9C9D4", "#ABABBA", "#6E6E80"
LIP_BASE = 0xE6 / 255

VEST = "M214,453 Q300,434 386,453 Q398,455 398,470 L402,528 Q300,542 198,528 L202,470 Q202,455 214,453Z"   # the base vest (every top covers it: gen_salon.TOP_OUTLINE)


def cap(c, p):
    """The short cap of her own hair on top of her head (under every hairstyle; each style's front covers it all)."""
    pts = [(300 + math.cos(math.radians(a)) * 150, HY - 4 + math.sin(math.radians(a)) * 148) for a in range(184, 357, 8)]
    line = [(440, HY - 64), (396, HY - 96), (340, HY - 108), (300, HY - 110), (260, HY - 108), (204, HY - 96), (160, HY - 64)]
    s = G(P(smooth(pts + line), c["hair"]), p + "sh")
    s += P(f"M206,{HY - 120} Q250,{HY - 142} 316,{HY - 140} Q256,{HY - 130} 214,{HY - 108}Z", c["hair_l"], ' opacity="0.5"')
    return s


def badge(c, kind, col, p):
    """The vest's one little sea thing, over her heart."""
    x, y = 338, 486
    if kind == "shell":
        pts = []
        for i in range(17):
            a = math.radians(-160 + 140 * i / 16)
            pts.append((x + math.cos(a) * 20 * (1 + .07 * abs(math.sin(i * math.pi / 2))), y + 10 + math.sin(a) * 24))
        pts += [(x + 4, y + 12), (x - 4, y + 12)]
        s = P(smooth(pts, 1 / 10), col) + "".join(stroke(f"M{x},{y + 8} L{n(x + math.cos(math.radians(a)) * 17)},{n(y + 10 + math.sin(math.radians(a)) * 20)}", mix(col, "#7A2A40", .3), 2.4, ' opacity="0.6"') for a in (-140, -115, -90, -65, -40))
    elif kind == "star":
        pts = []
        for i in range(10):
            a = math.radians(-90 + i * 36)
            r = 22 if i % 2 == 0 else 10
            pts.append((x + math.cos(a) * r, y + math.sin(a) * r))
        s = P(smooth(pts, 1 / 9), col) + "".join(C(x + math.cos(math.radians(-90 + i * 72)) * 11, y + math.sin(math.radians(-90 + i * 72)) * 11, 2.2, "#FFE0B8") for i in range(5))
    else:   # a little fan shell
        s = P(f"M{x},{y + 16} L{x - 22},{y - 6} Q{x},{y - 26} {x + 22},{y - 6}Z", col) + "".join(stroke(f"M{x},{y + 14} L{x + dx},{y - 12}", mix(col, "#3A2060", .3), 2.4, ' opacity="0.6"') for dx in (-14, -5, 5, 14))
    return G(s, p + "sh")


def earring(c, kind, p):
    out = ""
    for sgn in (-1, 1):
        x, y = 300 + sgn * 152, HY + 56
        if kind == "pearl":
            out += C(x, y, 7, "#F4F1EA") + C(x - 2, y - 2, 2.4, WHITE)
        elif kind == "gold":
            out += f'<circle cx="{x}" cy="{y + 6}" r="9" fill="none" stroke="#E8B53A" stroke-width="3.6"/>'
        else:
            out += C(x, y, 6, "#F58FB4") + C(x - 2, y - 2, 2, WHITE)
    return G(out, p + "sh")


def body_layer(cid):
    """cust-<id>-body: the vest, the arms, the neck, the head with ears, cheeks and nose, the cap of hair. No hair, no
    tail. The tail (gen_salon) is behind this layer and runs up under the vest's lower edge."""
    c = gk.pal(gk.KIDS["c" + cid])
    o = CUSTOMERS[cid]
    p = f"cu{cid[:2]}-bd-"
    L = []
    # the torso and the vest
    torso = "M206,436 Q216,412 256,404 L344,404 Q384,412 394,436 L404,532 Q300,546 196,532Z"
    L.append(G(P(torso, c["skin"]), p + "cut"))
    L.append(P("M262,406 Q300,432 338,406 L330,404 Q300,422 270,404Z", gk.mix(c["skin"], "#6A3226", .22)))
    vest_d = mix("#FBF0DA", "#8A6A4A", .16)
    L.append(G(P(VEST, vest_d, ' transform="translate(0 3)"') + P(VEST, "#FBF0DA"), p + "sh"))
    L.append(stroke("M212,462 Q300,444 388,462", "#FFFDF7", 6, ' opacity="0.9"'))
    L.append("".join(stroke(f"M{x},{460 if abs(x - 300) < 60 else 466} L{x + 2},{458 + 64}", vest_d, 2.4, ' opacity="0.35"') for x in (232, 270, 330, 368)))
    for sgn in (-1, 1):   # thin straps over the shoulders
        x = 300 + sgn * 62
        L.append(stroke(f"M{x},{406} Q{x + sgn * 6},{432} {x + sgn * 4},{456}", "#FBF0DA", 9) + stroke(f"M{x},{406} Q{x + sgn * 6},{432} {x + sgn * 4},{456}", vest_d, 2, ' opacity="0.4"'))
    L.append(badge(c, o["badge"], o["badge_col"], p))
    # arms down her sides, hands resting at her waist (over the tail's frill)
    for sgn, seed in ((-1, 7), (1, 8)):
        sx = 300 + sgn * 96
        pts = [(sx, 446), (sx + sgn * 16, 486), (sx + sgn * 12, 522), (sx - sgn * 2, 550)]
        L.append(G(P(taper(pts, [40, 38, 36, 32]), c["skin"]), p + "sh"))
        L.append(G(P(wob(sx + sgn * 2, 444, 30, 26, .05, seed, 18, sgn * 20), c["skin"]) + P(wob(sx - sgn * 6, 438, 12, 7, .08, seed + 9, 12), c["skin_l"], ' opacity="0.5"'), p + "sh"))
        hand = P(wob(sx - sgn * 6, 558, 24, 21, .06, seed + 20), c["skin"]) + P(wob(sx - sgn * 12, 554, 8, 11, .1, seed + 30, 12), c["skin_l"], ' opacity="0.5"')
        hand += "".join(stroke(f"M{n(sx - sgn * (16 - i * 7))},{566} l{n(-sgn * 2)},10", c["skin_d"], 2.4, ' opacity="0.45"') for i in range(3))
        L.append(G(hand, p + "sh"))
    # the head: the kids' kit's head with no hair, then her cap and earrings
    k = dict(c)
    L.append(gk.head(k, p).replace(gk.hair_front(k, p), ""))
    L.append(earring(c, o["ear"], p))
    L.append(cap(c, p))
    return svg(gk.W, gk.H, gk.defs(p, 760 + len(cid)), G("".join(L), p + "gr"))


def mouth_layer(cid, kind):
    """Lips the game tints: drawn in the salon's white-grey values. Closed: a happy closed smile of soft lips; open:
    a laughing mouth, lips round a dark inside and a tongue (no teeth: they would take the lipstick too); chew: lips
    pressed in a little wavy pout (no puffed cheeks: they would take it too)."""
    p = f"cu{cid[:2]}-m{kind[0]}-"
    my = HY + 98
    if kind == "closed":
        d = f"M266,{my - 12} Q300,{my + 2} 334,{my - 12} Q342,{my - 15} 340,{my - 6} Q324,{my + 22} 300,{my + 22} Q276,{my + 22} 260,{my - 6} Q258,{my - 15} 266,{my - 12}Z"
        inner = (P(d, T_MID, ' transform="translate(0 2)"') + P(d, T_BASE)
                 + stroke(f"M266,{my - 9} Q300,{my + 6} 334,{my - 9}", T_DEEP, 3.4, ' opacity="0.8"')
                 + P(f"M284,{my + 10} Q300,{my + 17} 316,{my + 10} Q300,{my + 13} 284,{my + 10}Z", T_HI, ' opacity="0.9"')
                 + E(312, my + 12, 7, 2.6, T_HI, ' opacity="0.8"'))
    elif kind == "open":
        d = f"M260,{my - 18} Q300,{my - 8} 340,{my - 18} Q352,{my - 18} 348,{my - 4} Q338,{my + 42} 300,{my + 44} Q262,{my + 42} 252,{my - 4} Q248,{my - 18} 260,{my - 18}Z"
        cav = f"M270,{my - 10} Q300,{my - 2} 330,{my - 10} Q338,{my - 10} 335,{my} Q326,{my + 30} 300,{my + 32} Q274,{my + 30} 265,{my} Q262,{my - 10} 270,{my - 10}Z"
        inner = (P(d, T_MID, ' transform="translate(0 2)"') + P(d, T_BASE)
                 + f'<clipPath id="{p}c"><path d="{cav}"/></clipPath>'
                 + G(P(cav, "#4E4E5E") + E(300, my + 32, 24, 14, T_DARK), None, f' clip-path="url(#{p}c)"')
                 + E(300, my + 39, 13, 3, T_HI, ' opacity="0.8"') + E(278, my - 13, 8, 2.4, T_HI, ' opacity="0.7"'))
    else:
        pts = [(270, my - 4), (284, my + 6), (300, my - 1), (316, my + 6), (330, my - 4)]
        inner = (stroke(smooth_open(pts, .2), T_MID, 16, ' transform="translate(0 2)"') + stroke(smooth_open(pts, .2), T_BASE, 14)
                 + stroke(smooth_open(pts, .2), T_DEEP, 3, ' opacity="0.7"') + E(310, my + 6, 5, 2, T_HI, ' opacity="0.8"'))
    return svg(gk.W, gk.H, gk.face_defs(p, 90 + len(kind) + len(cid)), G(inner, p + "sh"))


# The face's geometry for the game's makeup (spec 5.3; read from gen_kids, not guessed): src/core/salonFaceArt.ts.
EYE = gk.eye_geo(gk.pal(gk.KIDS["cmarina"]))
FACE_ANCHORS = {
    "head": {"x": 300, "y": HY, "rx": 150, "ry": 146},
    "cheeks": [{"x": 206, "y": HY + 80}, {"x": 394, "y": HY + 80}],
    "cheekSize": {"rx": 46, "ry": 30},
    "eyes": [{"x": EYE["xs"][0], "y": EYE["y"]}, {"x": EYE["xs"][1], "y": EYE["y"]}],
    "eyeSize": {"rx": EYE["rx"], "ry": EYE["ry"]},
    # the eyeshadow: an arc over each eye, from the lid's top (it shows round the eye's top: the eye layer is over it)
    "lids": [{"x": EYE["xs"][0], "y": EYE["y"] - 24, "rx": 40, "ry": 26}, {"x": EYE["xs"][1], "y": EYE["y"] - 24, "rx": 40, "ry": 26}],
    "mouth": {"x": 300, "y": HY + 98, "rx": 46, "ry": 24},
    "nose": {"x": 300, "y": HY + 62},
    # where the face is clear for glitter (below the fringe, above the chin)
    "skin": {"x": 300, "y": HY + 40, "rx": 128, "ry": 100},
    # the six places a face gem sticks (spec 5.5): forehead, beside each eye, the two cheeks, the chin
    "gemSlots": [{"x": 300, "y": HY - 34}, {"x": 196, "y": HY + 6}, {"x": 404, "y": HY + 6},
                 {"x": 222, "y": HY + 62}, {"x": 378, "y": HY + 62}, {"x": 300, "y": HY + 134}],
}


def write_face_ts():
    path = os.path.join(REPO, "src", "core", "salonFaceArt.ts")
    js = lambda v: str(v).replace("'", '"')
    lines = ["// GENERATED by assets-src/images-b-sea/tools/gen_customers.py (the mermaid salon, PR V): do not edit by hand.",
             "// The customers' face geometry in their 600x700 frame (the same for Marina, Coral and Pearl), read from the",
             "// kids' kit (gen_kids.py), for the makeup canvas, the lipstick, the glitter and the face gems.",
             "export const FACE_ANCHORS = {"]
    for k, v in FACE_ANCHORS.items():
        val = json_like(v)
        lines.append(f"  {k}: {val},")
    lines.append("} as const;")
    with open(path, "w", encoding="utf8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    print("wrote", os.path.relpath(path, REPO))


def json_like(v):
    if isinstance(v, dict):
        return "{ " + ", ".join(f"{k}: {json_like(x)}" for k, x in v.items()) + " }"
    if isinstance(v, list):
        return "[" + ", ".join(json_like(x) for x in v) + "]"
    return str(v)


def save(name, s):
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:28s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for cid in CUSTOMERS:
        if only and cid not in only:
            continue
        c = gk.pal(gk.KIDS["c" + cid])
        save(f"cust-{cid}-body", body_layer(cid))
        for kind in ("open", "blink", "happy", "surprised"):
            d, b = gk.guest_eyes(gk.eye_geo(c), kind, "c" + cid)
            save(f"cust-{cid}-eyes-{kind}", svg(gk.W, gk.H, d, b))
        for kind in ("closed", "open", "chew"):
            save(f"cust-{cid}-mouth-{kind}", mouth_layer(cid, kind))
    write_face_ts()


if __name__ == "__main__":
    main()

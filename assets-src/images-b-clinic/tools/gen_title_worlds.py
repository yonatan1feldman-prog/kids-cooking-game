# The title's two games as two big cards (clinic round 3, the owner: "on entering, choose Cooking with Mom or Doctor
# with Mom"): world-card-kitchen and world-card-clinic, 700x760 each. The lettering is the logo's cut-paper letters
# (images-b-prep/tools/gen_prep_c.py, read-only; three letters added here: D, c, r), the picture the world button's.
# Like the logo, the lettering is the game's title, part of the art (the only words in the game).
# Run: python tools/gen_title_worlds.py   then copy the SVGs into public/assets/images and bake the WebPs.
import sys, os, math
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_clinic import *  # noqa: F401,F403
import gen_clinic as gc
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-prep", "tools")))
import gen_prep_c as lg
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
import gen_mom as gm

lg.LETTER.update({
    "D": ("M2,0 L2,-94 M2,-94 C92,-98 92,4 2,0", 74),
    "c": ("M50,-48 C38,-66 2,-62 2,-30 C2,2 40,4 52,-12", 54),
    "r": ("M0,0 L0,-58 M0,-30 C4,-56 26,-62 42,-54", 40),
    # the mermaid world (research/mermaid-spec.md 1): "Mermaid"
    "e": ("M4,-30 L52,-30 C52,-64 4,-66 4,-30 C4,2 44,4 54,-10", 56),
    "a": ("M50,-36 C46,-64 2,-64 2,-30 C2,2 46,2 50,-26 M50,-58 L50,0", 52),
    "d": ("M50,-36 C46,-64 2,-64 2,-30 C2,2 46,2 50,-26 M50,-98 L50,0", 52),
})

SEA = "#5FC9C3"; SEA_D = "#3FA9A6"; SEA_L = "#BFEDE8"; SEA_DEEP = "#7FCAD9"
PUBLIC = os.path.normpath(os.path.join(HERE, "..", "..", "..", "public", "assets", "images"))
# Mom the mermaid on the card is the game's own Mom: her layers (gen_mom.py) placed in the card as nested pictures, so she
# is exactly the Mom she meets in the lagoon (run gen_mom.py first). Back to front, her waving arm and her open hand.
MERMAID_LAYERS = ["mom-arm-right", "mom-mer-top", "mom-head", "mom-hair", "mom-mer-crown", "mom-eyes-happy",
                  "mom-mouth-smile", "mom-arm-left-open"]


def nested(key, x, y, s):
    """One of Mom's 800-frame layers as a nested picture at (x, y), scale s."""
    src = open(os.path.join(PUBLIC, key + ".svg"), encoding="utf8").read()
    body = src[src.index(">") + 1: src.rindex("</svg>")]
    return f'<svg x="{n(x)}" y="{n(y)}" width="{n(800 * s)}" height="{n(800 * s)}" viewBox="0 0 800 800" overflow="visible">{body}</svg>'


def mermaid_picture():
    """The sea under the lettering, Mom the mermaid (her tail curling left, waving), a rock in front of her waist, an
    open pink shell with a pearl, bubbles."""
    p = "wcme-"
    s = G(P(wr(66, 352, 568, 360, 40, 1.6, 21, step=30), SEA_DEEP), p + "sh")
    s += P("M66,420 Q200,400 340,420 T634,414 L634,400 L66,400Z", WHITE, ' opacity="0.35"')
    s += "".join(C(x, y, r, WHITE, ' opacity="0.25"') + f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{WHITE}" stroke-width="3" opacity="0.8"/>'
                 for x, y, r in ((110, 470, 14), (130, 430, 8), (590, 450, 16), (570, 410, 9), (610, 520, 7)))
    sc = 0.4
    clip = f'<clipPath id="{p}pc"><path d="{wr(66, 352, 568, 360, 40, 1.6, 21, step=30)}"/></clipPath>'
    s += clip + f'<g clip-path="url(#{p}pc)">' + "".join(nested(k, 410 - 500 * sc, 636 - 800 * sc, sc) for k in MERMAID_LAYERS)
    # her big tail (the card's own: bigger than in the lagoon, so the card says "mermaid" from across the room): from her
    # waist down, curling left over the rock, the pink fin up on the left
    line = [(410, 612), (404, 660), (370, 694), (300, 704), (226, 684), (172, 640), (146, 590)]
    body = gm.taper(line, [150, 140, 118, 96, 76, 58, 44], cap=3)
    s += f'<clipPath id="{p}tl"><path d="{body}"/></clipPath>'
    s += G(P(body, "#3FA9A6", ' transform="translate(0 4)"') + P(body, "#5FC9C3"), p + "cut")
    s += gm.scales(f"{p}tl", 120, 560, 500, 720, 12, "#3FA9A6", "#A6E6DF", 0.8)
    fx, fy = 146, 594
    lobe_l = f"M{fx + 6},{fy + 6} C{fx - 24},{fy - 10} {fx - 70},{fy - 30} {fx - 84},{fy - 84} Q{fx - 64},{fy - 80} {fx - 54},{fy - 94} Q{fx - 40},{fy - 76} {fx - 26},{fy - 90} Q{fx - 12},{fy - 54} {fx + 8},{fy - 18}Z"
    lobe_r = f"M{fx - 4},{fy + 4} C{fx + 4},{fy - 34} {fx + 2},{fy - 86} {fx + 28},{fy - 120} Q{fx + 38},{fy - 96} {fx + 56},{fy - 100} Q{fx + 52},{fy - 78} {fx + 70},{fy - 66} Q{fx + 36},{fy - 34} {fx + 12},{fy + 8}Z"
    s += G(P(lobe_l, "#D9708F", ' transform="translate(0 4)"') + P(lobe_l, "#F59AB5") + P(lobe_r, "#D9708F", ' transform="translate(0 4)"') + P(lobe_r, "#F59AB5"), p + "cut")
    s += "".join(stroke(f"M{fx},{fy - 4} L{n(fx + dx)},{n(fy + dy)}", "#FBC8D7", 4, ' opacity="0.9"') for dx, dy in ((-74, -72), (-50, -76), (30, -104), (52, -82)))
    s += "</g>"
    rock = "M200,716 Q220,700 300,698 Q380,690 460,700 Q540,694 600,702 Q624,706 634,716Z"
    s += G(P(rock, "#6D8288", ' transform="translate(0 4)"') + P(rock, "#8FA3A8") + P("M230,698 Q330,684 440,698 Q330,694 240,708Z", "#B3C3C6", ' opacity="0.7"'), p + "cut")
    shell = "".join(P(f"M560,664 L{n(560 + 48 * math.cos(math.radians(a)))},{n(664 + 48 * math.sin(math.radians(a)))} L{n(560 + 48 * math.cos(math.radians(a + 20)))},{n(664 + 48 * math.sin(math.radians(a + 20)))}Z", "#F7A7A8" if i % 2 else "#FCC0C0") for i, a in enumerate(range(-170, -10, 20)))
    s += G(shell + P("M514,668 Q560,700 606,668 Q590,690 560,692 Q530,690 514,668Z", "#F7A7A8") + C(560, 668, 13, "#F4F1EA") + C(556, 664, 4, WHITE), p + "sh")
    return s

W, H = 700, 760


def picture(kind, cx, cy, s):
    """The world button's picture (240 frame) at (cx, cy), scale s."""
    col, col_d = (CORAL, CORAL_D) if kind == "kitchen" else (AQUA, AQUA_D)
    t = f' transform="translate({n(cx - 120 * s)} {n(cy - 120 * s)}) scale({s})"'
    b = P(wob(120, 126, 104, 104, .015, 1, 36), col_d) + P(wob(120, 120, 104, 104, .015, 2, 36), col)
    b += P(wob(92, 72, 40, 18, .1, 3, 14, -30), WHITE, ' opacity="0.35"')
    if kind == "kitchen":
        b += P("M58,112 L182,112 L172,176 Q120,190 68,176Z", WHITE) + rect(44, 112, 152, 14, WHITE) + P(wr(104, 96, 32, 14, 6, 1, 4), WHITE)
        b += rect(36, 126, 24, 10, WHITE) + rect(180, 126, 24, 10, WHITE)
        b += "".join(stroke(f"M{x},88 Q{x - 10},72 {x},58 Q{x + 10},44 {x},30", WHITE, 7, ' opacity="0.9"') for x in (92, 120, 148))
        b += heart(120, 150, .45, col)
    else:
        b += P(wr(54, 88, 132, 100, 18, 1.2, 5), WHITE) + stroke("M96,90 L96,70 Q96,62 104,62 L136,62 Q144,62 144,70 L144,90", WHITE, 10)
        b += heart(120, 140, .8, HEART)
    return f'<g{t}>{b}</g>'


def card(kind):
    p = f"wc{kind[:2]}-"
    if kind == "mermaid":
        return mermaid_card()
    col, col_d, col_l = (CORAL, CORAL_D, "#FBD3C2") if kind == "kitchen" else (AQUA, AQUA_D, AQUA_L)
    s = G(P(wr(16, 22, W - 32, H - 34, 46, 2, 3, step=30), col_d) + P(wr(16, 12, W - 32, H - 34, 46, 2, 4, step=30), col), p + "cut")
    s += G(P(wr(44, 40, W - 88, H - 90, 34, 1.6, 5, step=30), CREAM), p + "sh")
    s += P(wob(W / 2, 190, 290, 120, .04, 6, 26), col_l, ' opacity="0.55"')
    first = "Cooking" if kind == "kitchen" else "Doctor"
    cols = [RED, CORAL, "#E9A21E", GREEN, TEAL, RED, CORAL] if kind == "kitchen" else [TEAL, AQUA_D, HEART, "#E9A21E", TEAL, HEART]
    s1 = 1.2 if kind == "kitchen" else 1.32
    w1 = lg.word_width(first, s1)
    s += G(lg.word(first, W / 2 - w1 / 2 + 6, 186, s1, cols, w=19, rots=[-4, 3, -2, 4, -3, 2, -2]), p + "sh")
    s2, s3, sp = .86, 1.2, 40
    w2, w3 = lg.word_width("with", s2), lg.word_width("Mom", s3)
    x0 = W / 2 - (w2 + sp + w3) / 2
    s += G(lg.word("with", x0, 318, s2, [WALNUT], w=19, rots=[-3, 2, -2, 3]), p + "sh")
    s += G(lg.word("Mom", x0 + w2 + sp, 324, s3, [mix(RED, PINK_D, .35)], w=21, rots=[-3, 2, -2]), p + "sh")
    s += G(picture(kind, W / 2, 536, 1.45), p + "sh")
    return doc(p, W, H, s, "default", seed=700 + len(kind), cut={"rim": 3, "rough": 4})


def mermaid_card():
    """world-card-mermaid (the mermaid world, research/mermaid-spec.md 1): sea-blue, "Mermaid with Mom" in the logo's
    letters, Mom the mermaid on her rock in the sea (the pot's card is cream, the bag's pink, this one the sea)."""
    p = "wcme-"
    s = G(P(wr(16, 22, W - 32, H - 34, 46, 2, 3, step=30), "#2E6F9E") + P(wr(16, 12, W - 32, H - 34, 46, 2, 4, step=30), "#3E8FC0"), p + "cut")
    s += G(P(wr(44, 40, W - 88, H - 90, 34, 1.6, 5, step=30), "#EAF8F5"), p + "sh")
    s += P(wob(W / 2, 170, 290, 110, .04, 6, 26), SEA_L, ' opacity="0.6"')
    first = "Mermaid"
    cols = [TEAL, "#E46F92", "#8E6BBF", AQUA_D, "#E9A21E", TEAL, "#E46F92"]
    s1 = 1.12
    w1 = lg.word_width(first, s1)
    s += G(lg.word(first, W / 2 - w1 / 2 + 6, 172, s1, cols, w=19, rots=[-4, 3, -2, 4, -3, 2, -2]), p + "sh")
    s2, s3, sp = .8, 1.1, 36
    w2, w3 = lg.word_width("with", s2), lg.word_width("Mom", s3)
    x0 = W / 2 - (w2 + sp + w3) / 2
    s += G(lg.word("with", x0, 290, s2, [WALNUT], w=19, rots=[-3, 2, -2, 3]), p + "sh")
    s += G(lg.word("Mom", x0 + w2 + sp, 296, s3, [mix(RED, PINK_D, .35)], w=21, rots=[-3, 2, -2]), p + "sh")
    s += mermaid_picture()
    return doc(p, W, H, s, "default", seed=707, cut={"rim": 3, "rough": 4})


ITEMS = {"world-card-kitchen": lambda: card("kitchen"), "world-card-clinic": lambda: card("clinic"),
         "world-card-mermaid": mermaid_card}


def icon(maskable):
    """The PWA icon (polish round): the kitchen card's pot on its paper disc, on the card's cream, full bleed (512).
    The maskable one keeps the disc inside the 80% safe circle (Android cuts it to its own shape)."""
    p = "ic" + ("m" if maskable else "a") + "-"
    s = rect(0, 0, 512, 512, CREAM)
    s += G(picture("kitchen", 256, 262, 1.78 if maskable else 2.2), p + "sh")
    return doc(p, 512, 512, s, "default", seed=731)


# Not game art: scripts/make-icons.mjs renders these to public/icons (they stay out of public/assets/images).
ICONS = {"icon-any": lambda: icon(False), "icon-maskable": lambda: icon(True)}

if __name__ == "__main__":
    only = sys.argv[1:]
    if only == ["--icons"]:
        out = os.path.normpath(os.path.join(HERE, "..", "icons"))
        os.makedirs(out, exist_ok=True)
        for k, fn in ICONS.items():
            with open(os.path.join(out, k + ".svg"), "w", encoding="utf8") as f:
                f.write(fn())
            print(k)
        sys.exit(0)
    for k, fn in ITEMS.items():
        if not only or k in only:
            gc.save(k, fn())

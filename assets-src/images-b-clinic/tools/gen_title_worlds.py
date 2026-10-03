# The title's two games as two big cards (clinic round 3, the owner: "on entering, choose Cooking with Mom or Doctor
# with Mom"): world-card-kitchen and world-card-clinic, 700x760 each. The lettering is the logo's cut-paper letters
# (images-b-prep/tools/gen_prep_c.py, read-only; three letters added here: D, c, r), the picture the world button's.
# Like the logo, the lettering is the game's title, part of the art (the only words in the game).
# Run: python tools/gen_title_worlds.py   then copy the SVGs into public/assets/images and bake the WebPs.
import sys, os
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_clinic import *  # noqa: F401,F403
import gen_clinic as gc
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-prep", "tools")))
import gen_prep_c as lg

lg.LETTER.update({
    "D": ("M2,0 L2,-94 M2,-94 C92,-98 92,4 2,0", 74),
    "c": ("M50,-48 C38,-66 2,-62 2,-30 C2,2 40,4 52,-12", 54),
    "r": ("M0,0 L0,-58 M0,-30 C4,-56 26,-62 42,-54", 40),
})

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


ITEMS = {"world-card-kitchen": lambda: card("kitchen"), "world-card-clinic": lambda: card("clinic")}

if __name__ == "__main__":
    only = sys.argv[1:]
    for k, fn in ITEMS.items():
        if not only or k in only:
            gc.save(k, fn())

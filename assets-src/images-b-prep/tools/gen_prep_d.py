# images-b-prep, part D: kid hands (skin-tone parameter, like Mom), Mom's demo hands knife/press/mitt, Mom chewing mouth.
# Usage: python tools/gen_prep_d.py                          -> default look into images-b-prep/
#        python tools/gen_prep_d.py --out _variants/dark --skin_tone "#9A6444" --sleeve_color "#8FB86A"
#        (--out relative to images-b-prep/ unless absolute; --skin_tone also recolours Mom's hands/mouth if --mom_skin is not given)
import argparse, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prepkit import *  # noqa: F401,F403
from gen_mom import palette, tube, wrist_cuff, cuff_band, fist_on_stick, hand_file, layer, shift, MY, PARAMS as MOM_PARAMS  # noqa: E402
import gen_prep_b  # noqa: E402

# ---- change one line to restyle the child's hands ----
KID_PARAMS = {"skin_tone": "#F0C4A0", "sleeve_color": MUSTARD, "nail_color": PINK}
KID_ANCHORS = {"left_palm": (192, 232), "right_palm": (408, 232), "centre": (300, 214)}
MOM_ANCHORS = {"knife": (149, 364), "press": (140, 150), "mitt": (150, 150)}


# ================= KID HANDS (600x420, both hands from the bottom edge, backs of the hands up) =================
def kid_hand(c, kp):
    """Child's left hand seen from above (back of hand), palm centre local (0,0), fingers up, thumb on +x."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    sl = kp["sleeve_color"]
    sl_d, sl_l = mix(sl, "#7A3E1E", .28), mix(sl, "#FFF6E6", .4)
    g = P(wrect(-66, 72, 132, 230, 46, .8, 1), sl_d) + P(wrect(-62, 70, 124, 226, 42, .8, 2), sl)
    g += "".join(P(wrect(-62, y, 124, 12, 5, .5, 3 + i), sl_l, ' opacity="0.85"') for i, y in enumerate((120, 156, 192)))
    g += P(wrect(-72, 58, 144, 34, 16, .8, 7), sl_d) + P(wrect(-70, 54, 140, 30, 14, .8, 8), sl_l)       # rolled-up cuff
    g += P(wrect(-36, 18, 72, 52, 24, .6, 9), sh) + P(wrect(-33, 16, 66, 48, 22, .6, 10), s)             # wrist
    g += tube(c, [(40, 16), (56, -4), (63, -26)], 27)                                                      # thumb (round 11: shorter, so the two thumbs no longer meet)
    g += P(wob(2, 3, 54, 50, .03, 11), sh) + P(wob(0, 0, 52, 48, .03, 12), s)                              # back of hand
    fing = (((30, -24), (36, -62), (39, -92), 28), ((9, -30), (10, -70), (10, -103), 29), ((-13, -28), (-16, -66), (-18, -96), 28), ((-34, -22), (-40, -52), (-45, -76), 25))   # round 11: a little longer and slimmer
    for a, b, t, w in fing:
        g += tube(c, [a, b, t], w, nail=False)
        (ax, ay), (bx, by) = b, t
        l = math.hypot(bx - ax, by - ay)
        nx, ny = bx - (bx - ax) / l * 9, by - (by - ay) / l * 9
        g += E(nx, ny, w * .24, w * .3, kp["nail_color"], f' transform="rotate({n(math.degrees(math.atan2(bx - ax, ay - by)))} {n(nx)} {n(ny)})"')
        g += E(nx - 1.5, ny - 3, w * .09, w * .1, WHITE, ' opacity="0.8"')
    g += E(-4, 10, 26, 16, lt, ' opacity="0.4"')
    for x in (-26, -4, 18):                                                                                 # knuckle dimples
        g += E(x, -22, 4, 2.4, sh, ' opacity="0.45"')
    return g


def kid_hands(kp):
    p = "kh-"
    c = skin_palette(kp["skin_tone"])
    h = kid_hand(c, kp)
    (lx, ly), (rx, ry) = KID_ANCHORS["left_palm"], KID_ANCHORS["right_palm"]
    L = G(f'<g transform="translate({lx} {ly}) rotate(10) scale(1.3)">{h}</g>', p + "cut")
    L += G(f'<g transform="translate({rx} {ry}) rotate(-10) scale(-1.3 1.3)">{h}</g>', p + "cut")
    defs = std_defs(p, "smooth", 211, sh=(3, 2.5, .28), sh2=(6, 5, .25), cut=dict(dy=10, blur=6, op=.28))
    return svg(600, 420, defs, G(L, p + "gr"))


# ================= MOM DEMO HANDS (400x400, same frame/cuff/shadow as images-b mom-hand-*) =================
def hand_knife(c):
    p = "mh-kn-"
    fx, fy = 150, 120
    ks = .5
    kn = f'<g transform="translate({fx} {fy}) scale({ks}) translate(-120 -130)">{gen_prep_b.knife_body(p)}</g>'
    fist = f'<g transform="translate({fx} {fy})">{fist_on_stick(c)}</g>'
    return hand_file(p, kn + fist, 51)


def hand_press(c):
    """Flat hand pressing down, fingers a little spread (kneading / squashing tomatoes); palm centre = anchor."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    g = wrist_cuff(c, 34)
    g += tube(c, [(-50, 16), (-80, -8), (-96, -34)], 32)                                          # thumb, lying out flat
    g += P(wob(2, 4, 64, 60, .03, 14), sh) + P(wob(0, 0, 62, 58, .03, 15), s)
    for a, b, t, w in (((-36, -36), (-44, -80), (-50, -112), 30), ((-12, -42), (-12, -94), (-12, -128), 31),
                       ((13, -40), (18, -90), (22, -120), 30), ((36, -32), (46, -70), (52, -96), 27)):
        g += tube(c, [a, b, t], w)
    g += P("M-48,-24 Q0,-36 48,-20 Q0,-28 -48,-24Z", sh, ' opacity="0.5"')                    # knuckle fold
    # (round 11: no row of knuckle highlights: they read as beads, a paw rather than a hand)
    g += P(wob(-8, 8, 30, 22, .05, 16), lt, ' opacity="0.35"')
    ax, ay = MOM_ANCHORS["press"]
    return hand_file("mh-pr-", f'<g transform="translate({ax} {ay}) rotate(-40) scale(1 .9)">{g}</g>', 53)


def hand_mitt(c):
    """Mom's hand inside a teal oven mitt; blouse cuff at the lower right; mitt palm centre = anchor."""
    p = "mh-mt-"
    g = cuff_band(c, 146, 124, 110) + gen_prep_b.mitt(p, -98, -130, 1, 0)
    ax, ay = MOM_ANCHORS["mitt"]
    return hand_file(p, f'<g transform="translate({ax} {ay}) rotate(-40) scale(.78)">{g}</g>', 55)


# ================= MOM CHEWING MOUTH (800x800, same frame as mom-mouth-*) =================
def mouth_chew(c):
    p = "mp-mch-"
    L = []
    for sgn in (-1, 1):                                             # puffed cheeks (style-test coords, shifted by gen_mom.shift)
        cx = 300 + sgn * 78
        L.append(G(P(wob(cx, MY - 6, 44, 34, .03, 60 + sgn), c["skin"]) + E(cx + sgn * 6, MY - 8, 32, 19, c["blush"], ' opacity="0.8"')
                   + C(cx - sgn * 4, MY - 18, 5, c["skin_lt"], ' opacity="0.9"'), p + "sh"))
    wave = smooth_open([(272, MY), (286, MY + 9), (300, MY + 3), (314, MY + 9), (328, MY)], .2)
    L.append(G(stroke(wave, c["mouth"], 10), p + "sh"))
    L.append(G(P(wob(340, MY + 16, 7, 6, .15, 70, 9), CRUST) + P(wob(339, MY + 15, 4, 3.4, .15, 71, 8), CRUST_L), p + "sh"))
    return layer(p, shift("".join(L)), "smooth", 29)


def build(out, kp, mp):
    os.makedirs(out, exist_ok=True)
    c = palette(mp)
    files = {"kid-hands": kid_hands(kp), "mom-hand-knife": hand_knife(c), "mom-hand-press": hand_press(c),
             "mom-hand-mitt": hand_mitt(c), "mom-mouth-chew": mouth_chew(c)}
    for name, s in files.items():
        if os.path.normpath(out) == PREP:
            save(name, s)
        else:
            with open(os.path.join(out, name + ".svg"), "w", encoding="utf8") as f:
                f.write(s)
            print(out, name, f"{len(s.encode()) / 1024:.1f} KB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    for k in KID_PARAMS:
        ap.add_argument("--" + k)
    ap.add_argument("--mom_skin")
    a = ap.parse_args()
    kp = dict(KID_PARAMS)
    for k in KID_PARAMS:
        if getattr(a, k):
            kp[k] = getattr(a, k)
    mp = dict(MOM_PARAMS)
    if a.mom_skin:
        mp["skin_tone"] = a.mom_skin
    out = PREP if not a.out else (a.out if os.path.isabs(a.out) else os.path.join(PREP, a.out))
    out = os.path.normpath(out)
    assert out.startswith(PREP), "output must stay inside images-b-prep"
    build(out, kp, mp)


if __name__ == "__main__":
    main()

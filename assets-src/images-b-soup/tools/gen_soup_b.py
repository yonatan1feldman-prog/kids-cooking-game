# images-b-soup, part B: the pot (pot-back / pot-front, the main work item), the chopped vegetables piling up in it
# (pot-heap-1..3) and the soup cooking (soup-stage-1..3). All six contents files share the pot layers' viewBox (1000x760)
# and are drawn between pot-back and pot-front at the same position, exactly like images-b-prep/prep-bowl-back + sauce-stage-* + prep-bowl-front.
# Run: python tools/gen_soup_b.py [names...]     (writes into images-b-soup/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from soupkit import *  # noqa: F401,F403

W, H = POT
RC, RRX, RRY = POT_RIM, POT_RRX, POT_RRY
IC, IRX, IRY = POT_IC, POT_IRX, POT_IRY


# ================= THE POT (1000x760, two layers; base contact (500,676) rx 330) =================
def ears():
    """The two side handles. Drawn before the body, so the body and then the front wall cover their inner ends."""
    g = ""
    for s in (-1, 1):
        x = lambda v: n(500 + s * v)
        d = f"M{x(388)},296 C{x(438)},292 {x(454)},330 {x(448)},354 C{x(442)},382 {x(400)},392 {x(352)},382"
        g += stroke(d, PT_DD, 42) + stroke(d, PT, 29) + stroke(d, PT_L, 8, ' opacity="0.65"')
    return g


def pot_back():
    p = "ptb-"
    L = [G(E(500, 730, 372, 26, SH, ' opacity="0.36"'), p + "bl")]                                  # ground shadow
    L.append(G(P(wob(500, 696, 236, 24, .02, 3), PT_DD), p + "sh"))                                  # dark contact under the base
    L.append(G(ears(), p + "cut"))
    L.append(G(P(POT_BODY, PT) + E(*RC, RRX, RRY, PT), p + "cut"))
    L.append(E(*RC, RRX, RRY, PT_L))                                                                  # the rim seen from above
    grad = (f'<linearGradient id="{p}in" x1="0" y1="{IC[1] - IRY}" x2="0" y2="{IC[1] + IRY}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{mix(PT_DD, SH, .62)}"/><stop offset="0.38" stop-color="{mix(PT_D, SH, .34)}"/>'
            f'<stop offset="0.78" stop-color="{mix(PT_D, CREAM2, .45)}"/><stop offset="1" stop-color="{mix(CREAM2, "#B08466", .3)}"/></linearGradient>')
    L.append(E(*IC, IRX, IRY, f"url(#{p}in)"))                                                        # the inside of the pot
    # review fix 5: the inside read as one flat dark disc. A lit floor, a soft wall shade and a bright back-wall edge give it depth.
    L.append(G(E(500, 322, 280, 44, mix(CREAM2, "#C79A7A", .2), ' opacity="0.7"'), p + "bl"))         # the lit floor of the pot
    L.append(G(E(500, 212, 320, 54, mix(PT_DD, SH, .35), ' opacity="0.5"'), p + "bl"))                # the far wall in shadow
    L.append(P(f"M{IC[0] - IRX + 6},{IC[1]} A{IRX - 6},{IRY - 4} 0 0 0 {IC[0] + IRX - 6},{IC[1]}", "none",
               f' stroke="{mix(PT_D, CREAM, .45)}" stroke-width="7" opacity="0.6"'))                  # the lit near wall
    L.append(P("M150,226 Q330,176 560,170 Q340,196 170,242Z", PT_L, ' opacity="0.35"'))               # rim highlight, back left
    L.append(P(f"M148,250 A{RRX},{RRY} 0 0 0 852,250 L852,258 A{RRX - 8},{RRY - 6} 0 0 1 148,258Z", PT_D, ' opacity="0.35"'))
    return doc(p, W, H, "".join(L), material="default", seed=651, sh=(4, 3.5, .33), blur=9, extra_defs=grad)


def pot_front():
    p = "ptf-"
    L = [G(P(POT_FRONT, PT), p + "cut")]
    L.append(f'<clipPath id="{p}f"><path d="{POT_FRONT}"/></clipPath>')
    inner = P("M108,500 C140,636 300,700 500,700 C700,700 860,636 892,500 C852,624 700,676 500,676 C300,676 148,624 108,500Z",
              PT_D, ' opacity="0.8"')                                                                 # the shaded lower belly
    band = "M104,436 Q500,502 896,436 L892,522 Q500,588 108,522Z"                                     # cream enamel band
    inner += G(P(band, PT_IN), p + "sh")
    inner += P("M104,436 Q500,502 896,436 L894,452 Q500,518 106,452Z", PT_IN_D, ' opacity="0.55"')
    inner += "".join(C(x, 478 + 66 * (1 - ((x - 500) / 392) ** 2), 13, TEAL) + C(x - 3, 475 + 66 * (1 - ((x - 500) / 392) ** 2), 4.5, TEAL_L, ' opacity="0.8"')
                     for x in range(150, 900, 75))                                                    # a row of teal dots on the band
    inner += P("M126,300 Q146,462 236,600 Q160,464 150,306Z", PT_L, ' opacity="0.6"')                 # tall left highlight
    L.append(G(inner, None, f' clip-path="url(#{p}f)"'))
    L.append(P(POT_FRONT_RIM, PT_L))                                                                   # the front face of the rim
    L.append(P(f"M170,282 Q500,352 830,282 Q500,330 170,282Z", WHITE, ' opacity="0.4"'))               # lip shine
    for x in (146, 854):                                                                               # rivets where the ears are fixed
        L.append(G(C(x, 318, 15, PT_DD) + C(x, 316, 11, STEEL) + C(x - 3, 313, 4, STEEL_L), p + "sh"))
    return doc(p, W, H, "".join(L), material="default", seed=653, sh=(4, 3.5, .33), blur=9)


# ================= CHOPPED VEGETABLES PILING UP (pot-heap-1..3) =================
# (surface ellipse cy, rx, ry, top of the mound): 1 = a layer deep in the pot, 2 = half full, 3 = heaped above the rim
HEAP = {1: (344, 272, 50, 312), 2: (306, 340, 78, 216), 3: (286, 362, 90, 136)}
ORDER = ["P", "K", "Z", "P", "O", "K", "Z", "P", "K", "Z", "P", "O"]          # potato, carrot, zucchini, onion
BIT_S = {"P": 44, "K": 34, "Z": 36, "O": 22}                                  # big, chunky pieces so they read at phone size


def heap_top(x, stage):
    cy, rx, ry, top = HEAP[stage]
    u = (x - IC[0]) / rx
    if abs(u) >= 1:
        return None
    ell = cy - ry * math.sqrt(1 - u * u)
    dome = (cy - ry) - ((cy - ry) - top) * max(0, 1 - u * u) ** .8
    return min(ell, dome)


def heap_pieces(stage, seed):
    r = random.Random(seed)
    cy, rx, ry, top = HEAP[stage]
    rows = {1: 2, 2: 5, 3: 7}[stage]
    items, ki = [], 0
    y0, y1 = top + 26, cy + ry * .85
    for j in range(rows):
        y = y0 + (y1 - y0) * (j / max(1, rows - 1))
        depth = .86 + .22 * (y - y0) / max(1, y1 - y0)
        off = r.uniform(0, 60)
        for x in range(int(IC[0] - rx), int(IC[0] + rx), 86):
            x = x + off + r.uniform(-12, 12)
            u = (x - IC[0]) / rx
            if abs(u) > .95:
                continue
            t = heap_top(x, stage)
            if t is None or y < t + 18:
                continue
            kind = ORDER[ki % len(ORDER)]; ki += 1
            yy = y + r.uniform(-12, 12)
            s = BIT_S[kind] * depth * r.uniform(.9, 1.08)
            items.append((yy, bit(kind, x, yy, s, r.randint(0, 9999), r.uniform(-30, 30) if kind == "P" else 0)))
    # a crown of pieces along the top edge, so the pile's edge is never a bare curve
    for i in range(3 + 4 * stage):
        x = IC[0] - rx * .86 + i * rx * 1.72 / max(1, 2 + 4 * stage) + r.uniform(-10, 10)
        t = heap_top(x, stage)
        if t is None:
            continue
        kind = ORDER[ki % len(ORDER)]; ki += 1
        items.append((t + 20, bit(kind, x, t + 20, BIT_S[kind] * .88, r.randint(0, 9999), r.uniform(-30, 30) if kind == "P" else 0)))
    items.sort(key=lambda q: q[0])
    return items


def pot_heap(stage):
    p = f"phe{stage}-"
    cy, rx, ry, top = HEAP[stage]
    x0, x1 = int(IC[0] - rx * .93), int(IC[0] + rx * .93)
    topc = [(x, heap_top(x, stage) + 14) for x in range(x0, x1 + 1, 24)]
    bot = [(IC[0] + math.cos(a) * rx * .95, cy + math.sin(a) * ry) for a in [i / 20 * math.pi for i in range(1, 20)]]
    ring_ = topc + bot[::-1]
    fill = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in ring_) + "Z"      # a plain polygon: a spline overshoots into a spike at the corners
    body = G(P(fill, mix(POT_F_D, "#8E6E42", .5)), p + "cut")             # the shaded bed that gives the pile its volume
    body += G(P(wob(IC[0] - rx * .12, cy - ry * .25 - (cy - ry - top) * .35, rx * .55,
                    (ry + (cy - ry - top)) * .34, .05, 3, 20), POT_F, ' opacity="0.3"'), p + "bl")
    items = heap_pieces(stage, 20 + stage)
    third = max(1, len(items) // 3)
    for lay in (items[:third], items[third:2 * third], items[2 * third:]):
        body += G("".join(u for _, u in lay), p + "sh")
    return doc(p, W, H, clip_pot(p, body), seed=661 + stage, sh=(3, 2.5, .33), blur=8)


# ================= THE SOUP COOKING (soup-stage-1..3) =================
# (surface cy, rx, ry, film opacity, bubble size, steam wisps): pale and watery -> golden -> rich and thick
SOUP = {1: (266, 364, 89, .42, 13, 1), 2: (272, 360, 87, .84, 20, 3), 3: (278, 356, 85, 1.0, 30, 4)}


def bubble(x, y, r_, lo, hi, popped=False):
    if popped:
        return (E(x, y, r_ * 1.15, r_ * .8, mix(lo, SH, .3), ' opacity="0.55"')
                + E(x, y, r_ * .72, r_ * .48, mix(lo, SH, .5), ' opacity="0.5"'))
    g = E(x, y + r_ * .12, r_, r_ * .72, lo, ' opacity="0.9"')
    g += E(x, y, r_ * .84, r_ * .58, hi, ' opacity="0.9"')
    g += E(x - r_ * .28, y - r_ * .22, r_ * .26, r_ * .17, WHITE, ' opacity="0.9"')
    return g


def soup_stage(stage):
    p = f"sst{stage}-"
    cy, rx, ry, op, bs, wisps = SOUP[stage]
    br, br_l, br_d = BROTH[stage]
    r = random.Random(70 + stage)
    # 1) the vegetables in the pot, drawn first: at stage 1 the pale broth barely veils them, at stage 3 only their tops show
    veg = ""
    lay = []
    for i in range(20):
        a, rr = r.uniform(0, 6.283), math.sqrt(r.random())
        x = IC[0] + math.cos(a) * rx * .82 * rr
        y = cy + 6 + math.sin(a) * ry * .72 * rr
        kind = ORDER[i % len(ORDER)]
        s = BIT_S[kind] * (1.0 if stage < 3 else .96) * r.uniform(.9, 1.06)
        lay.append((y, bit(kind, x, y, s, r.randint(0, 9999), r.uniform(-30, 30) if kind == "P" else 0)))
    lay.sort(key=lambda q: q[0])
    veg = "".join(u for _, u in lay)
    body = G(veg, p + "sh")
    # 2) the broth: a wobbly surface pool over them; the film's opacity is what makes the three stages read
    pool = P(wob(IC[0], cy + 4, rx, ry, .012, stage, 32), br_d, f' opacity="{min(1, op + .12):.2f}"')
    pool += P(wob(IC[0] - 6, cy, rx * .985, ry * .95, .014, stage + 1, 32), br, f' opacity="{op:.2f}"')
    pool += P(wob(IC[0] - 40, cy - ry * .34, rx * .6, ry * .42, .03, stage + 2, 22), br_l, f' opacity="{op * .7:.2f}"')
    body += pool
    # 3) the surface: shines, bubbles, and at stage 3 herb flecks and a thick glossy skin
    sh_ = P(f"M{IC[0] - rx * .74},{n(cy - ry * .3)} Q{IC[0] - rx * .3},{n(cy - ry * .78)} {IC[0] + rx * .1},{n(cy - ry * .62)} "
            f"Q{IC[0] - rx * .28},{n(cy - ry * .48)} {IC[0] - rx * .7},{n(cy - ry * .12)}Z", WHITE, f' opacity="{.3 + .18 * stage:.2f}"')
    sh_ += E(IC[0] + rx * .42, cy + ry * .2, rx * .18, ry * .1, WHITE, f' opacity="{.25 + .12 * stage:.2f}"')
    body += sh_
    nb = {1: 7, 2: 13, 3: 18}[stage]
    bb = ""
    for i in range(nb):
        a, rr = r.uniform(0, 6.283), math.sqrt(r.random())
        x = IC[0] + math.cos(a) * rx * .84 * rr
        y = cy + 2 + math.sin(a) * ry * .7 * rr
        s = bs * r.uniform(.55, 1.0)
        bb += bubble(x, y, s, br_d, br_l, popped=(i % 4 == 0 and stage > 1))
    body += bb
    if stage == 3:                                     # thick soup: herbs and a folding ribbon on the surface
        hb = ""
        for i in range(16):
            a, rr = r.uniform(0, 6.283), math.sqrt(r.random())
            x, y = IC[0] + math.cos(a) * rx * .8 * rr, cy + math.sin(a) * ry * .66 * rr
            hb += E(x, y, r.uniform(5, 9), r.uniform(2.4, 4), HERBX, f' transform="rotate({n(r.uniform(0, 180))} {n(x)} {n(y)})"')
            hb += E(x - 1, y - 1, r.uniform(2.5, 4.5), r.uniform(1.2, 2), HERBX_L, ' opacity="0.8"')
        body += G(hb, p + "sh")
        body += stroke(f"M{IC[0] - rx * .6},{n(cy + ry * .34)} Q{IC[0] - rx * .1},{n(cy + ry * .06)} {IC[0] + rx * .5},{n(cy + ry * .3)}",
                       br_l, 9, ' opacity="0.7"')
    L = [clip_pot(p, body)]
    if wisps:                                          # steam rises out of the pot (never clipped)
        L.append(steam(p, IC[0], cy - ry * .5, .8 + .18 * stage, wisps, seed=90 + stage))
    return doc(p, W, H, "".join(L), material="smooth", seed=671 + stage, sh=(3, 2.5, .33), blur=9)


ITEMS = {"pot-back": pot_back, "pot-front": pot_front,
         "pot-heap-1": lambda: pot_heap(1), "pot-heap-2": lambda: pot_heap(2), "pot-heap-3": lambda: pot_heap(3),
         "soup-stage-1": lambda: soup_stage(1), "soup-stage-2": lambda: soup_stage(2), "soup-stage-3": lambda: soup_stage(3)}

if __name__ == "__main__":
    run(ITEMS)

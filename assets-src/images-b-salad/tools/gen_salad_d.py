# images-b-salad, part D: photo-frame-salad (the prep photo frame with a lettuce sticker instead of the pizza slice) and
# salad-heap-1..3 (the bowl filling up before mixing: vegetables still in their own patches on a bed of lettuce).
# Run: python tools/gen_salad_d.py [names...]   (writes into images-b-salad/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from saladkit import *  # noqa: F401,F403
import gen_salad_a as SA
import gen_salad_b as SB


# ================= PHOTO FRAME FOR THE SALAD (700x780, same window as images-b-prep photo-frame) =================
def pizza_sticker():
    """The exact markup of the pizza-slice sticker in gen_prep_b.photo_frame (so it can be swapped out)."""
    return (P("M410,726 L380,668 Q410,654 440,668Z", SAUCE) + P("M410,716 L388,672 Q410,662 432,672Z", CHEESE)
            + P(wrect(376, 656, 68, 16, 8, .3, 5), CRUST) + C(404, 686, 5, RED) + C(416, 700, 4, OLIVE))


def lettuce_sticker():
    """Small lettuce leaf with a cherry-tomato half on it, the size of the other stickers on the band."""
    g, _ = SA.leaf_body(406, 694, 30, 23, -35)
    tom = C(424, 706, 13, mix(RED_D, "#7A2016", .28)) + C(423.5, 705, 11, RED) + C(424, 706, 8, RED_L)
    tom += "".join(C(424 + math.cos(a) * 4, 706 + math.sin(a) * 4, 2.6, SEEDPOCK) for a in (-1.2, .9, 3))
    return g + tom


def photo_frame_salad():
    s = PB.photo_frame()
    old = pizza_sticker()
    assert s.count(old) == 1, "pizza sticker not found in the prep frame code"
    return s.replace(old, lettuce_sticker()).replace("pf-", "pfs-")


# ================= SALAD HEAPS (900x620, between salad-bowl-back and salad-bowl-front) =================
OC, ORX, ORY = SB.OC, SB.ORX, SB.ORY
# level of the filling: surface ellipse (cy, rx, ry) seen inside the opening, and the top of the mound above it
LEVELS = {1: (266, 318, 56, 204), 2: (240, 352, 72, 150), 3: (222, 380, 88, 92)}
# patches: each vegetable still lies in its own area (x from left to right on the surface), lettuce everywhere under and between them
PATCHES = [("T", 0.12), ("C", 0.3), ("K", 0.5), ("G", 0.7), ("O", 0.88)]


def surface_top(x, stage):
    cy, rx, ry, top = LEVELS[stage]
    u = (x - OC[0]) / rx
    if abs(u) >= 1: return None
    ell = cy - ry * math.sqrt(1 - u * u)
    dome = (cy - ry) - ((cy - ry) - top) * max(0, 1 - u * u) ** .7
    return min(ell, dome)


def heap_pieces(p, stage, seed):
    r = random.Random(seed)
    cy, rx, ry, top = LEVELS[stage]
    items = []
    y0 = top + 14
    ybot = cy + ry
    rows = {1: 4, 2: 6, 3: 8}[stage]
    for j in range(rows):
        y = y0 + (ybot - y0) * j / (rows - 1)
        depth = .88 + .2 * (y - y0) / max(1, ybot - y0)             # smaller at the back, bigger at the front
        off = r.uniform(0, 30)
        for x in range(int(OC[0] - rx), int(OC[0] + rx), 56):
            x = x + off + r.uniform(-8, 8)
            u = (x - OC[0]) / rx
            if abs(u) > .97: continue
            t = surface_top(x, stage)
            if t is None or y < t + 16: continue
            if y > cy + ry * math.sqrt(max(0, 1 - u * u)) + 10: continue
            f = (x - (OC[0] - rx)) / (2 * rx) + .05 * math.sin(y / 23 + x / 90)   # wavy patch borders, not ruler-straight stripes
            patch = min(PATCHES, key=lambda q: abs(q[1] - f))
            near = abs(patch[1] - f) < .078
            leafy = r.random() < (.35 if near else .85)             # vegetables in their patch, lettuce between the patches
            kind = r.choice(["L0", "L1", "L2", "L0"]) if leafy else patch[0]
            yy = y + r.uniform(-9, 9)
            sc = (1.12 if leafy else 1.3) * depth * r.uniform(.92, 1.06)
            tilt = r.uniform(.8, .95) if kind in ("G", "O") else r.uniform(.6, .92)          # rings stay rings, never thin lines
            items.append((yy + (0 if leafy else 4), SB.mix_use(p, kind, x, yy, sc * (1.12 if kind == "G" else 1), r.randint(0, 359), tilt)))
    # frilly crown: leaves + patch colours along the top edge so the edge is not a hard curve
    for i in range(16):
        x = OC[0] - rx * .9 + i * rx * 1.8 / 15 + r.uniform(-6, 6)
        t = surface_top(x, stage)
        if t is None: continue
        f = (x - (OC[0] - rx)) / (2 * rx)
        patch = min(PATCHES, key=lambda q: abs(q[1] - f))
        kind = patch[0] if (i % 3 == 1 and abs(patch[1] - f) < .08) else ["L0", "L1", "L2"][i % 3]
        items.append((t + 14, SB.mix_use(p, kind, x, t + 14, (1.05 if kind.startswith("L") else 1.2) * .9, r.randint(0, 359), r.uniform(.8, .9) if kind in ("G", "O") else r.uniform(.6, .85))))
    items.sort(key=lambda q: q[0])
    return items


def salad_heap(stage):
    p = f"sh{stage}-"
    cy, rx, ry, top = LEVELS[stage]
    x0, x1 = int(OC[0] - rx * .93), int(OC[0] + rx * .93)             # stop short of the tips so the base never ends in a thin spike
    topc = [(x, surface_top(x, stage) + 12) for x in range(x0, x1 + 1, 22)]
    bot = [(OC[0] + math.cos(a) * rx * .95, cy + math.sin(a) * ry) for a in [i / 20 * math.pi for i in range(1, 20)]]
    ring_ = topc + bot[::-1]
    fill = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in ring_) + "Z"      # straight polygon: a spline overshoots at the side corners (thin spike)
    clip = (f'<clipPath id="{p}c"><rect x="0" y="0" width="900" height="{OC[1]}"/>'
            f'<ellipse cx="{OC[0]}" cy="{OC[1]}" rx="{ORX - 4}" ry="{ORY - 3}"/></clipPath>')
    body = G(P(fill, mix(LET_D, "#2E5A22", .35)), p + "cut")                               # leafy shadow base (gives the volume)
    body += G(P(wob(OC[0] - rx * .15, cy - ry * .2 - (cy - ry - top) * .4, rx * .55, (ry + (cy - ry - top)) * .35, .05, 3, 20), LET, ' opacity="0.35"'), p + "bl")
    items = heap_pieces(p, stage, 10 + stage)
    third = max(1, len(items) // 3)
    for lay in (items[:third], items[third:2 * third], items[2 * third:]):
        body += G("".join(u for _, u in lay), p + "sh")
    r = random.Random(20 + stage)
    body += SB.gloss(p, [(r.uniform(OC[0] - rx * .7, OC[0] + rx * .7), r.uniform(top + 20, cy + ry * .3)) for _ in range(4 + 3 * stage)], stage)
    L = [clip, G(body, None, f' clip-path="url(#{p}c)"')]
    return gen_items.doc(p, 900, 620, "".join(L), seed=411 + stage, sh=(3, 2.5, .33), extra_defs=SB.mix_defs(p))


ITEMS = {"photo-frame-salad": photo_frame_salad,
         "salad-heap-1": lambda: salad_heap(1), "salad-heap-2": lambda: salad_heap(2), "salad-heap-3": lambda: salad_heap(3)}

if __name__ == "__main__":
    run(ITEMS)

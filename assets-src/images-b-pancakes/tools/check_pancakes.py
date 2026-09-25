# Mechanical check for images-b-pancakes. Run: python tools/check_pancakes.py [--md]
# 1) exactly the required names (no extra svg)  2) size <= 60 KB  3) clean SVG (well-formed XML; no text/fonts/images/scripts/external refs)
# 4) touch size: short side >= 240 (the four toppings are 140x140 stamps like topping-*), the main work items >= 500
# 5) viewBox families (also against the pizza / prep / cookie partners)  6) photo-frame-pancakes has the prep frame's exact window
# 7) the anchors in scenes-pancakes.js equal the generators, and the plate / pan geometry is measured again here
# 8) nothing outside images-b-pancakes changed (md5 against tools/baseline-md5.txt, taken before any work started)
import os, re, sys, math, json, hashlib, xml.etree.ElementTree as ET
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
PK = os.path.normpath(os.path.join(HERE, ".."))
ASSETS = os.path.normpath(os.path.join(PK, ".."))
DIRS = {"b:": "images-b", "p:": "images-b-prep", "s:": "images-b-salad", "c:": "images-b-cookies", "m:": "images-b-smoothie"}
BASELINE = os.path.join(HERE, "baseline-md5.txt")

BATTER = [f"pancake-batter-{i}" for i in range(4)]
PUDDLE = ["batter-puddle-1", "batter-puddle-2", "batter-puddle-3", "pancake-bubbles", "pancake-golden"]
STAMPS = ["syrup-blob", "berry", "banana-coin", "butter-pat"]
REQUIRED = (["card-pancakes"] + BATTER + ["stove-top", "stove-knob-off", "stove-knob-on", "flame", "pan", "ladle"] + PUDDLE
            + ["plate-big", "syrup-bottle"] + STAMPS + ["photo-frame-pancakes"])
UNTOUCHED = set(STAMPS)                          # tapped stamps, 140x140 like the pizza topping-* (placed by a tap, never dragged)
BIG = BATTER + ["stove-top", "pan", "plate-big"] + PUDDLE
FAMILIES = {
    "batter (= prep-bowl / sauce-stage / cookie batter-stage, 640x520)": BATTER + ["p:prep-bowl-back", "p:sauce-stage-0", "c:batter-stage-0"],
    "pan-sized family (puddles, bubbles, golden)": PUDDLE,
    "stove knobs": ["stove-knob-off", "stove-knob-on"],
    "plate-big (= pizza dough-flat, 720x720)": ["plate-big", "b:dough-flat"],
    "toppings (= topping-*, 140x140)": STAMPS + ["b:topping-tomato", "c:candy-dot"],
    "photo frames (= prep photo-frame)": ["photo-frame-pancakes", "p:photo-frame", "c:photo-frame-cookies", "m:photo-frame-smoothie"],
    "recipe cards (= card-cookies / card-smoothie)": ["card-pancakes", "c:card-cookies", "m:card-smoothie"],
}
FORBID = [r"<text", r"<image", r"<script", r"@font-face", r"font-family", r"<foreignObject", r"href=\"(?!#)", r"url\((?!#)", r"\son\w+="]


def path_of(n):
    for pre, d in DIRS.items():
        if n.startswith(pre): return os.path.join(ASSETS, d, n[2:] + ".svg")
    return os.path.join(PK, n + ".svg")


def dims(p):
    m = re.search(r"<svg[^>]*>", open(p, encoding="utf8").read(3000)).group(0)
    g = lambda a: (re.search(a + r'="([^"]*)"', m) or [None, None])[1]
    return g("viewBox"), g("width"), g("height")


def frame_window():
    sys.path.insert(0, HERE)
    import pancakekit as K
    x, y, w, h = K.PB.FRAME_HOLE
    hole = K.wrect(x, y, w, h, 8, .6, 9, 40)
    new, old = (open(path_of(n), encoding="utf8").read() for n in ("photo-frame-pancakes", "p:photo-frame"))
    same = (" " + hole + '" fill') in new and (" " + hole + '" fill') in old and new.count(hole) == old.count(hole)
    return (x, y, w, h), same


def geometry():
    sys.path.insert(0, HERE)
    import pancakekit as K, gen_pancakes_a as A, gen_pancakes_b as Bm
    js = open(os.path.join(PK, "scenes-pancakes.js"), encoding="utf8").read()
    blob = lambda key: re.search(r"\b" + key + r": \{[^}]*\}", js).group(0)
    arr = lambda b, key: json.loads(re.search(r"\b" + key + r": (\[[^\]]*\])", b).group(1))
    num = lambda b, key: float(re.search(r"\b" + key + r": ([\d.]+)", b).group(1))
    # measured: the top pancake outline of plate-big (same call as pancake_top 'golden'), the stack and the plate rim
    top = K.gen_items.wobp(*K.PLATE_C, K.TOP_R, K.TOP_R * .99, .014, 480, 40)
    rs = [math.hypot(x - K.PLATE_C[0], y - K.PLATE_C[1]) for x, y in top]
    stack = max(math.hypot(dx, dy + 7) + K.TOP_R for dx, dy in Bm.STACK)
    plate_ext = K.PLATE_R + math.hypot(4, 8)                  # the plate + its offset contact shadow
    pud = max(K.PUD_R.values()) * 1.035
    root = re.search(r"const PANC = \{(.*?)\n  \};", js, re.S).group(1)
    geo = {
        f"plate-big top pancake: circle centred (360,360), r {min(rs):.1f}-{max(rs):.1f} (spec 280-300)": 280 <= min(rs) and max(rs) <= 300 and K.PLATE_C == (360, 360),
        f"plate-big: everything inside r 350 (stack {stack:.1f}, plate+shadow {plate_ext:.1f})": stack <= 350 and plate_ext <= 350,
        f"pan disc >= 700 across (outer rim {2 * K.PAN_R})": 2 * K.PAN_R >= 700,
        f"puddle family fits the pan's cooking surface (max puddle r {pud:.0f} <= {K.PAN_IN})": pud <= K.PAN_IN and K.PUD_BOX == 2 * K.PUD_C[0],
        "puddle offset = pan centre - family centre": K.PUD_OFF == (60, 60),
        "flame ring starts under the pan and reaches beyond its rim": K.FLAME_IN <= K.PAN_R <= K.FLAME_OUT - 40,
        "scenes-pancakes.js stove = kit (burner, knob seat)": tuple(arr(blob("stove"), "burner")) == K.BURNER and tuple(arr(blob("stove"), "knob")) == K.KNOB_SEAT,
        "scenes-pancakes.js pan = kit (centre, r, inner)": tuple(arr(blob("pan"), "c")) == K.PAN_C and num(blob("pan"), "r") == K.PAN_R and num(blob("pan"), "inner") == K.PAN_IN,
        "scenes-pancakes.js flame = kit": tuple(arr(blob("flame"), "c")) == K.FLAME_C and num(blob("flame"), "rIn") == K.FLAME_IN and num(blob("flame"), "rOut") == K.FLAME_OUT,
        "scenes-pancakes.js puddle family = kit (c, off, cake r)": tuple(arr(root, "off")) == K.PUD_OFF and num(root, "cake") == K.CAKE_R,
        "scenes-pancakes.js ladle pour point = kit": tuple(arr(blob("ladle"), "pour")) == K.LADLE_POUR,
        "scenes-pancakes.js plate = kit (c, top r)": tuple(arr(blob("plate"), "c")) == K.PLATE_C and num(blob("plate"), "top") == K.TOP_R,
        "scenes-pancakes.js syrup tip = kit": tuple(arr(blob("syrup"), "tip")) == K.SYRUP_TIP,
        "scenes-pancakes.js yolk anchor = the cookie anchor (gen_cookies_a)": tuple(arr(root, "yolkAt")) == A.YOLK_AT == A.CA.YOLK_ON_MOUND,
        "knob centre = kit": tuple(arr(blob("knob"), "c")) == K.KNOB_C,
    }
    return geo


def outside_unchanged():
    want = {}
    for line in open(BASELINE, encoding="utf8"):
        if not line.strip(): continue
        h, f = line.rstrip("\n").split(None, 1)
        want[f.lstrip("*")] = h
    now = {}
    for root, dirs, files in os.walk(ASSETS):
        rel = os.path.relpath(root, ASSETS).replace("\\", "/")
        if rel == "images-b-pancakes" or rel.startswith("images-b-pancakes/"):
            continue
        for fn in files:
            f = "./" + (fn if rel == "." else rel + "/" + fn)
            now[f] = hashlib.md5(open(os.path.join(root, fn), "rb").read()).hexdigest()
    changed = [f for f in want if f in now and now[f] != want[f]]
    removed = [f for f in want if f not in now]
    added = [f for f in now if f not in want]
    return len(want), changed, removed, added


def main():
    md = "--md" in sys.argv
    rows, fails = [], 0
    for n in REQUIRED:
        p = path_of(n); r = {"name": n, "exists": os.path.exists(p)}
        if r["exists"]:
            txt = open(p, encoding="utf8").read()
            r["kb"] = os.path.getsize(p) / 1024
            r["vb"], r["w"], r["h"] = dims(p)
            try:
                ET.fromstring(txt); r["xml"] = True
            except ET.ParseError:
                r["xml"] = False
            r["clean"] = r["xml"] and not any(re.search(f, txt) for f in FORBID)
            vw, vh = [float(v) for v in r["vb"].split()[2:]]
            r["short"] = min(vw, vh)
            r["size_ok"] = (r["short"] == 140) if n in UNTOUCHED else r["short"] >= (500 if n in BIG else 240)
        r["ok"] = r["exists"] and r["kb"] <= 60 and r["clean"] and r["size_ok"]
        fails += not r["ok"]; rows.append(r)
    fam = []
    for f, mem in FAMILIES.items():
        vbs = {m: dims(path_of(m)) for m in mem if os.path.exists(path_of(m))}
        same = len(vbs) == len(mem) and len(set(vbs.values())) == 1
        fam.append((f, same, next(iter(vbs.values()))[0] if vbs else "-", len(mem)))
        fails += not same
    win, win_ok = frame_window()
    fails += not win_ok
    geo = geometry()
    fails += sum(not v for v in geo.values())
    extra = sorted(f for f in os.listdir(PK) if f.endswith(".svg") and f[:-4] not in REQUIRED)
    fails += len(extra)
    if md:
        print("| file | viewBox | short side | KB | clean | size rule |\n|---|---|---|---|---|---|")
        for r in rows:
            if not r["exists"]:
                print(f"| {r['name']} | MISSING | | | | |"); continue
            rule = "140 stamp (like topping-*)" if r["name"] in UNTOUCHED else (">= 500 (work item)" if r["name"] in BIG else ">= 240")
            print(f"| {r['name']} | {r['vb']} | {r['short']:.0f} | {r['kb']:.1f} | {'ok' if r['clean'] else 'NO'} | {rule}: {'ok' if r['size_ok'] else 'NO'} |")
        print("\n| family | files | shared viewBox | identical |\n|---|---|---|---|")
        for f, same, vb, cnt in fam:
            print(f"| {f} | {cnt} | {vb} | {'yes' if same else 'NO'} |")
    else:
        for r in rows:
            print(("OK  " if r["ok"] else "FAIL"), f"{r['name']:24s}", r.get("vb"), f"{r.get('kb', 0):5.1f}KB short={r.get('short', 0):.0f} clean={r.get('clean')}")
        for f, same, vb, cnt in fam:
            print(("OK  " if same else "FAIL"), "family:", f, vb)
    for k, v in geo.items():
        print(("OK  " if v else "FAIL"), "geometry:", k)
    print(f"\nphoto-frame-pancakes window: x {win[0]}-{win[0] + win[2]}, y {win[1]}-{win[1] + win[3]}, identical hole path to prep photo-frame: {'yes' if win_ok else 'NO'}")
    total, changed, removed, added = outside_unchanged()
    bad = changed or removed or added
    fails += bool(bad)
    print(f"outside images-b-pancakes: {total} files in baseline; changed {len(changed)}, removed {len(removed)}, added {len(added)}"
          + ("" if not bad else f"  {changed[:5]} {removed[:5]} {added[:5]}"))
    print(f"\nrequired: {len(REQUIRED)}, present: {sum(r['exists'] for r in rows)}, failing checks: {fails}, extra svgs: {extra or 'none'}")
    big = max(rows, key=lambda r: r.get("kb", 0))
    print(f"largest item: {big['name']} {big.get('kb', 0):.1f} KB")
    print("RESULT:", "PASS" if not fails else "FAIL")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()

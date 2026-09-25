# Mechanical check for images-b-cake. Run: python tools/check_cake.py [--md]
# 1) exactly the 18 required names (no extra svg)   2) size <= 60 KB   3) clean SVG (well-formed XML; no text/fonts/images/scripts/external refs)
# 4) touch size: everything she TOUCHES has a short side >= 240 and the main work items >= 500; the tap-placed stamp
#    (choc-chip, = candy-dot / berry, 140), the tint brush (frosting-blob, = sauce-blob, 200) and the two effects the
#    game draws by itself (flame-candle, smoke-puff) are never touched and keep their own frames
# 5) viewBox families: cake-batter-* = images-b-prep sauce-stage-* / prep-bowl-*; cake-pan = cake-pan-full;
#    cake-baked = images-b/dough-flat; cake-plate = images-b/pizza-board; frosting-blob = images-b/sauce-blob;
#    choc-chip = the 140 stamp; photo-frame-cake = images-b-prep/photo-frame; card-cake = card-soup / card-cookies
# 6) registration: photo-frame-cake carries the prep frame's EXACT window path; cake-baked and cake-plate are built on
#    the pizza's own centre and radius (proved by rebuilding the dough-flat / tray outlines and finding them in those files)
# 7) the anchors in scenes-cake.js equal the generators (the candle's base and flame points, the tub, the blob, the
#    pan's batter window, the cake's centre/radius, the candle seats, the frame window)
# 8) nothing outside images-b-cake changed (md5 against tools/baseline-md5.txt, taken before any work started)
import os, re, sys, json, math, hashlib, xml.etree.ElementTree as ET
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
CK = os.path.normpath(os.path.join(HERE, ".."))
ASSETS = os.path.normpath(os.path.join(CK, ".."))
DIRS = {"b:": "images-b", "p:": "images-b-prep", "s:": "images-b-salad", "c:": "images-b-cookies",
        "m:": "images-b-smoothie", "k:": "images-b-pancakes", "u:": "images-b-soup"}
BASELINE = os.path.join(HERE, "baseline-md5.txt")

BATTER = [f"cake-batter-{i}" for i in range(4)]
PANS = ["cake-pan", "cake-pan-full"]
CAKES = ["cake-baked", "cake-plate"]
TUBS = [f"frosting-tub-{k}" for k in ("pink", "white", "choc")]
FX = ["candle", "flame-candle", "smoke-puff"]
REQUIRED = ["card-cake"] + BATTER + PANS + CAKES + TUBS + ["frosting-blob", "choc-chip"] + FX + ["photo-frame-cake"]

BIG = BATTER + PANS + CAKES + ["photo-frame-cake"]          # main work items: short side >= 500
EXACT = {"choc-chip": (140, 140),                            # tap-placed stamp, = candy-dot / berry
         "frosting-blob": (200, 200),                        # the tint brush, = images-b/sauce-blob
         "flame-candle": (200, 280), "smoke-puff": (240, 360)}   # effects the game draws on the candle; never touched
TOUCHED = ["card-cake"] + TUBS + ["candle"] + BIG            # everything she actually puts a finger on

FAMILIES = {
    "batter in the big bowl (= prep sauce-stage-* / prep-bowl-*, 640x520)":
        BATTER + ["p:sauce-stage-0", "p:sauce-stage-3", "p:prep-bowl-back", "p:prep-bowl-front"],
    "the cake pan, one frame for empty and full (800x800)": PANS,
    "cake-baked = the pizza's dough-flat frame (720x720)": ["cake-baked", "b:dough-flat"],
    "cake-plate = the pizza's board frame (820x830)": ["cake-plate", "b:pizza-board"],
    "the three frosting tubs (320x360)": TUBS,
    "frosting-blob = images-b/sauce-blob (200x200)": ["frosting-blob", "b:sauce-blob"],
    "choc-chip = the 140 stamp (candy-dot / berry)": ["choc-chip", "c:candy-dot", "k:berry"],
    "photo frames (= prep photo-frame, 700x780)": ["photo-frame-cake", "p:photo-frame", "u:photo-frame-soup"],
    "recipe cards (= card-soup / card-cookies, 400x520)": ["card-cake", "u:card-soup", "c:card-cookies"],
}
FORBID = [r"<text", r"<image", r"<script", r"@font-face", r"font-family", r"<foreignObject", r"href=\"(?!#)", r"url\((?!#)", r"\son\w+="]


def path_of(n):
    for pre, d in DIRS.items():
        if n.startswith(pre):
            return os.path.join(ASSETS, d, n[2:] + ".svg")
    return os.path.join(CK, n + ".svg")


def text_of(n):
    return open(path_of(n), encoding="utf8").read()


def dims(p):
    m = re.search(r"<svg[^>]*>", open(p, encoding="utf8").read(3000)).group(0)
    g = lambda a: (re.search(a + r'="([^"]*)"', m) or [None, None])[1]
    return g("viewBox"), g("width"), g("height")


def frame_window():
    sys.path.insert(0, HERE)
    import cakekit as K
    x, y, w, h = K.PB.FRAME_HOLE
    hole = K.wrect(x, y, w, h, 8, .6, 9, 40)
    new, old = text_of("photo-frame-cake"), text_of("p:photo-frame")
    same = (" " + hole + '" fill') in new and (" " + hole + '" fill') in old and new.count(hole) == old.count(hole)
    return (x, y, w, h), same


def registration():
    """cake-baked and cake-plate must be built on the PIZZA's own centre and radius: rebuild the outlines that
    images-b/tools/gen_items.py draws for dough-flat and for the tray (= pizza-board) from the cake kit's numbers,
    and find them verbatim in those two files."""
    sys.path.insert(0, HERE)
    import cakekit as K
    G = K.gen_items
    cx, cy = K.CAKE_C
    dough = G.smooth(G.wobp(cx, cy, K.CAKE_R, K.CAKE_R - 2, .008, 3, 44))          # gen_items.dough_flat outer crust
    px, py = K.PLATE_C
    tray = G.smooth(G.wobp(px, py + 5, K.PLATE_R, K.PLATE_R, .004, 400, 60))       # gen_items.tray board edge
    out = {
        f"cake-baked uses the pizza's centre {K.CAKE_C} and radius {K.CAKE_R} (dough-flat's own outline rebuilds)":
            dough in text_of("b:dough-flat"),
        f"cake-plate uses the pizza board's centre {K.PLATE_C} and radius {K.PLATE_R} (the tray's own edge rebuilds)":
            tray in text_of("b:pizza-board"),
        "the cake fits its plate (cake r < plate r)": K.CAKE_R < K.PLATE_R,
        "the cake fits the pan's floor exactly (batter window r == cake r)": K.PAN_IR == K.CAKE_R,
        "the batter surface stays inside the pan's floor": K.PAN_BAT_R < K.PAN_IR < K.PAN_LIP < K.PAN_R,
        "frosting-blob has sauce-blob's centre and radius": (K.BLOB == (200, 200) and K.BLOB_AT == (100, 100)
                                                             and 60 <= K.BLOB_R <= 70),
    }
    return out


def geometry():
    sys.path.insert(0, HERE)
    import cakekit as K
    js = open(os.path.join(CK, "scenes-cake.js"), encoding="utf8").read()
    blob = lambda key: re.search(r"\b" + key + r": \{[^}]*\}", js).group(0)
    arr = lambda b, key: json.loads(re.search(r"\b" + key + r": (\[[^\]]*\])", b).group(1))
    num = lambda b, key: float(re.search(r"\b" + key + r": ([\d.]+)", b).group(1))
    top = lambda key: json.loads(re.search(r"[\s,]" + key + r": (\[[^\]]*\])", js).group(1))
    seats = json.loads(re.search(r"seats: (\[\[.*?\]\]),", js).group(1))
    pan, baked, plate, tub, bl, cand, flame, smoke = (blob(k) for k in
        ("pan", "baked", "plate", "tub", "blob", "candle", "flame", "smoke"))
    geo = {
        # --- the candle: the two anchors the game needs
        f"scenes-cake.js candle frame = kit {K.CANDLE}": (num(cand, "w"), num(cand, "h")) == K.CANDLE,
        f"scenes-cake.js candle BASE anchor = kit {K.CANDLE_BASE}": tuple(arr(cand, "base")) == K.CANDLE_BASE,
        f"scenes-cake.js candle FLAME point = kit {K.CANDLE_FLAME}": tuple(arr(cand, "flame")) == K.CANDLE_FLAME,
        "the candle's flame point is the wick tip (base - CAND_H - 34)":
            K.CANDLE_FLAME == (K.CANDLE_BASE[0], K.CANDLE_BASE[1] - K.CAND_H - 34),
        "the whole candle fits its frame (wax + base ellipse + shadow)":
            (0 < K.CANDLE_BASE[0] - K.CAND_RX * 1.2 and K.CANDLE_BASE[0] + K.CAND_RX * 1.2 + 24 < K.CANDLE[0]
             and 0 < K.CANDLE_FLAME[1] and K.CANDLE_BASE[1] + K.CAND_RY + 12 < K.CANDLE[1]),
        f"scenes-cake.js flame frame / foot = kit {K.FLAME} {K.FLAME_BASE}":
            (num(flame, "w"), num(flame, "h")) == K.FLAME and tuple(arr(flame, "base")) == K.FLAME_BASE,
        f"scenes-cake.js smoke frame / foot = kit {K.SMOKE} {K.SMOKE_BASE}":
            (num(smoke, "w"), num(smoke, "h")) == K.SMOKE and tuple(arr(smoke, "base")) == K.SMOKE_BASE,
        "the flame's body fits above its foot": 192 < K.FLAME_BASE[1] and K.FLAME_BASE[1] < K.FLAME[1],
        "the smoke's wisp fits above its foot": 300 < K.SMOKE_BASE[1] <= K.SMOKE[1],
        # --- the five seats
        f"scenes-cake.js candle seats = kit {K.CANDLE_SEATS}": [tuple(v) for v in seats] == K.CANDLE_SEATS,
        f"there are {K.CANDLES} seats (she is five)": len(K.CANDLE_SEATS) == K.CANDLES == 5,
        "every seat is on the frosted face (r < the frosting field)":
            all(math.hypot(*v) < K.CAKE_FACE_R for v in K.CANDLE_SEATS),
        "no two candles overlap at the scene's candle scale":
            all(math.hypot(a[0] - b[0], a[1] - b[1]) > 2 * K.CAND_RX * float(re.search(r"candleS: ([\d.]+)", js).group(1))
                for i, a in enumerate(K.CANDLE_SEATS) for b in K.CANDLE_SEATS[i + 1:]),
        # --- the pan, the cake, the plate
        f"scenes-cake.js pan frame / centre / batter window = kit":
            ((num(pan, "w"), num(pan, "h")) == K.PAN and tuple(arr(pan, "c")) == K.PAN_C
             and num(pan, "floorR") == K.PAN_IR and num(pan, "batR") == K.PAN_BAT_R and num(pan, "r") == K.PAN_R
             and num(pan, "lip") == K.PAN_LIP),
        "scenes-cake.js baked cake frame / centre / radius / face = kit":
            ((num(baked, "w"), num(baked, "h")) == K.CAKE and tuple(arr(baked, "c")) == K.CAKE_C
             and num(baked, "r") == K.CAKE_R and num(baked, "faceR") == K.CAKE_FACE_R),
        "scenes-cake.js plate frame / centre / radius = kit":
            ((num(plate, "w"), num(plate, "h")) == K.PLATE and tuple(arr(plate, "c")) == K.PLATE_C
             and num(plate, "r") == K.PLATE_R),
        # --- the tub, the blob, the bowl, the frame
        "scenes-cake.js tub frame / base / opening = kit":
            ((num(tub, "w"), num(tub, "h")) == K.TUB and tuple(arr(tub, "base")) == K.TUB_BASE
             and tuple(arr(tub, "top")) == K.TUB_TOP and num(tub, "orx") == K.TUB_ORX and num(tub, "ory") == K.TUB_ORY),
        "scenes-cake.js blob frame / centre / radius = kit":
            ((num(bl, "w"), num(bl, "h")) == K.BLOB and tuple(arr(bl, "at")) == K.BLOB_AT and num(bl, "r") == K.BLOB_R),
        f"scenes-cake.js bowl frame = the prep bowl {K.BOWL}": tuple(top("bowl")) == K.BOWL,
        "scenes-cake.js bowl opening = the prep bowl's": tuple(top("bowlOpen")) == (K.IC[0], K.IC[1], K.IRX, K.IRY),
        f"scenes-cake.js stamp = {K.STAMP}": int(re.search(r"stamp: (\d+)", js).group(1)) == K.STAMP,
        f"scenes-cake.js card / frame = kit {K.CARD} {K.FRAME}": tuple(top("card")) == K.CARD and tuple(top("frame")) == K.FRAME,
        "scenes-cake.js frame window = the prep frame's": tuple(top("frameWin")) == tuple(K.PB.FRAME_HOLE),
        f"scenes-cake.js pan in the oven = kit {K.PAN_IN_OVEN}": tuple(top("panInOven")) == K.PAN_IN_OVEN,
        "the pan fits the oven window at that scale":
            K.PAN[0] * K.PAN_IN_OVEN[2] < K.OVEN_WIN[2] + 20 and K.PAN[1] * K.PAN_IN_OVEN[2] < K.OVEN_WIN[3] + 20,
    }
    return geo


def outside_unchanged():
    want = {}
    for line in open(BASELINE, encoding="utf8"):
        if not line.strip():
            continue
        h, f = line.rstrip("\n").split(None, 1)
        want[f.lstrip("*")] = h
    now = {}
    for root, dirs, files in os.walk(ASSETS):
        rel = os.path.relpath(root, ASSETS).replace("\\", "/")
        if rel == "images-b-cake" or rel.startswith("images-b-cake/"):
            continue
        for fn in files:
            f = "./" + (fn if rel == "." else rel + "/" + fn)
            now[f] = hashlib.md5(open(os.path.join(root, fn), "rb").read()).hexdigest()
    cache = lambda f: "__pycache__" in f
    changed = [f for f in want if f in now and now[f] != want[f] and not cache(f)]
    removed = [f for f in want if f not in now and not cache(f)]
    added = [f for f in now if f not in want and not cache(f)]
    # Python bytecode caches are not assets and are regenerable, so they do not fail the run; they are still reported.
    # (Every kit sets sys.dont_write_bytecode before importing the kit below it, so no new ones are written here.)
    pyc = sorted(f for f in set(list(want) + list(now)) if cache(f) and want.get(f) != now.get(f))
    return len(want), changed, removed, added, pyc


def main():
    md = "--md" in sys.argv
    rows, fails = [], 0
    for nm in REQUIRED:
        p = path_of(nm)
        r = {"name": nm, "exists": os.path.exists(p), "kb": 0, "clean": False, "size_ok": False}
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
            if nm in EXACT:
                r["size_ok"] = (vw, vh) == EXACT[nm]
            else:
                r["size_ok"] = r["short"] >= (500 if nm in BIG else 240)
        r["ok"] = r["exists"] and r["kb"] <= 60 and r["clean"] and r["size_ok"]
        fails += not r["ok"]; rows.append(r)
    fam = []
    for f, mem in FAMILIES.items():
        vbs = {m: dims(path_of(m)) for m in mem if os.path.exists(path_of(m))}
        same = len(vbs) == len(mem) and len(set(v[0] for v in vbs.values())) == 1
        fam.append((f, same, next(iter(vbs.values()))[0] if vbs else "-", len(mem)))
        fails += not same
    win, win_ok = frame_window()
    fails += not win_ok
    reg = registration()
    geo = geometry()
    fails += sum(not v for v in reg.values()) + sum(not v for v in geo.values())
    extra = sorted(f for f in os.listdir(CK) if f.endswith(".svg") and f[:-4] not in REQUIRED)
    fails += len(extra)
    if md:
        print("| file | viewBox | short side | KB | clean | size rule |\n|---|---|---|---|---|---|")
        for r in rows:
            if not r["exists"]:
                print(f"| {r['name']} | MISSING | | | | |"); continue
            rule = ("%dx%d (stamp / brush / effect)" % EXACT[r["name"]]) if r["name"] in EXACT else (
                ">= 500 (work item)" if r["name"] in BIG else ">= 240 (touched)")
            print(f"| {r['name']} | {r['vb']} | {r['short']:.0f} | {r['kb']:.1f} | {'ok' if r['clean'] else 'NO'} | {rule}: {'ok' if r['size_ok'] else 'NO'} |")
        print("\n| family | files | shared viewBox | identical |\n|---|---|---|---|")
        for f, same, vb, cnt in fam:
            print(f"| {f} | {cnt} | {vb} | {'yes' if same else 'NO'} |")
    else:
        for r in rows:
            print(("OK  " if r["ok"] else "FAIL"), f"{r['name']:20s}", r.get("vb"), f"{r['kb']:5.1f}KB short={r.get('short', 0):.0f} clean={r['clean']}")
        for f, same, vb, cnt in fam:
            print(("OK  " if same else "FAIL"), "family:", f, vb)
    for k, v in list(reg.items()) + list(geo.items()):
        print(("OK  " if v else "FAIL"), "geometry:", k)
    print(f"\nphoto-frame-cake window: x {win[0]}-{win[0] + win[2]}, y {win[1]}-{win[1] + win[3]}, identical hole path to prep photo-frame: {'yes' if win_ok else 'NO'}")
    total, changed, removed, added, pyc = outside_unchanged()
    bad = changed or removed or added
    fails += bool(bad)
    print(f"outside images-b-cake: {total} files in baseline; changed {len(changed)}, removed {len(removed)}, added {len(added)}"
          + ("" if not bad else f"  {changed[:5]} {removed[:5]} {added[:5]}"))
    if pyc:
        print(f"  (bytecode caches outside the baseline, not assets, left by an earlier import: {pyc})")
    print(f"\nrequired: {len(REQUIRED)}, present: {sum(r['exists'] for r in rows)}, failing checks: {fails}, extra svgs: {extra or 'none'}")
    big = max(rows, key=lambda r: r["kb"])
    print(f"largest item: {big['name']} {big['kb']:.1f} KB")
    print("RESULT:", "PASS" if not fails else "FAIL")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()

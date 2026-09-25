# Mechanical check for images-b-soup. Run: python tools/check_soup.py [--md]
# 1) exactly the 24 required names (no extra svg)   2) size <= 60 KB   3) clean SVG (well-formed XML; no text/fonts/images/scripts/external refs)
# 4) touch size: short side >= 240, the main work items >= 500 (the two cut-face strips are the images-b-prep strip spec: 60 wide)
# 5) viewBox families: pot layers = pot-heap-* = soup-stage-*, the peel skins = their whole vegetable, the new vegetables = the salad's,
#    the slices = the prep slices, the soup bowls, photo-frame-soup = images-b-prep/photo-frame, card-soup = card-pancakes
# 6) registration: photo-frame-soup has the prep frame's exact window path; each peel skin carries the EXACT outline path and scale
#    of the vegetable it lies on   7) the anchors and profiles in scenes-soup.js equal the generators; the pot's seat on the hob is measured
# 8) nothing outside images-b-soup changed (md5 against tools/baseline-md5.txt, taken before any work started)
import os, re, sys, math, json, hashlib, xml.etree.ElementTree as ET
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
SP = os.path.normpath(os.path.join(HERE, ".."))
ASSETS = os.path.normpath(os.path.join(SP, ".."))
DIRS = {"b:": "images-b", "p:": "images-b-prep", "s:": "images-b-salad", "c:": "images-b-cookies",
        "m:": "images-b-smoothie", "k:": "images-b-pancakes"}
BASELINE = os.path.join(HERE, "baseline-md5.txt")

VEGS = ["potato", "zucchini"]
VEG_FILES = [f"veg-{v}-{k}" for v in VEGS for k in ("whole", "slice", "inside")]
PEEL = ["peel-skin-carrot", "peel-skin-potato", "peeler", "peel-strip"]
POT_LAYERS = ["pot-back", "pot-front"]
HEAPS = [f"pot-heap-{i}" for i in (1, 2, 3)]
STAGES = [f"soup-stage-{i}" for i in (1, 2, 3)]
SERVE = ["soup-bowl-empty", "soup-bowl-full", "soup-portion"]
REQUIRED = (["card-soup"] + VEG_FILES + PEEL + POT_LAYERS + HEAPS + STAGES + ["water-jug"] + SERVE + ["photo-frame-soup"])
# not touched by the child; the size is set by the images-b-prep vegetable spec (a 60-wide cut-face strip on the cut line)
STRIPS = {"veg-potato-inside": 224, "veg-zucchini-inside": 198}
BIG = [f"veg-{v}-whole" for v in VEGS] + POT_LAYERS + HEAPS + STAGES + ["peel-skin-carrot", "peel-skin-potato", "photo-frame-soup"]
FAMILIES = {
    "pot layers = heaps = soup stages (1000x760)": POT_LAYERS + HEAPS + STAGES,
    "peel-skin-carrot = the salad carrot": ["peel-skin-carrot", "s:veg-carrot-whole"],
    "peel-skin-potato = the new potato": ["peel-skin-potato", "veg-potato-whole"],
    "whole vegetables (= prep / salad veg-*-whole, 672x504)": [f"veg-{v}-whole" for v in VEGS] + ["s:veg-carrot-whole", "p:veg-tomato-whole"],
    "slices (= prep / salad veg-*-slice, 240x240)": [f"veg-{v}-slice" for v in VEGS] + ["s:veg-carrot-slice", "p:veg-tomato-slice"],
    "soup bowls (one frame for empty and full)": ["soup-bowl-empty", "soup-bowl-full"],
    "photo frames (= prep photo-frame)": ["photo-frame-soup", "p:photo-frame", "k:photo-frame-pancakes", "s:photo-frame-salad"],
    "recipe cards (= card-pancakes / card-salad)": ["card-soup", "k:card-pancakes", "s:card-salad"],
}
FORBID = [r"<text", r"<image", r"<script", r"@font-face", r"font-family", r"<foreignObject", r"href=\"(?!#)", r"url\((?!#)", r"\son\w+="]


def path_of(n):
    for pre, d in DIRS.items():
        if n.startswith(pre):
            return os.path.join(ASSETS, d, n[2:] + ".svg")
    return os.path.join(SP, n + ".svg")


def text_of(n):
    return open(path_of(n), encoding="utf8").read()


def dims(p):
    m = re.search(r"<svg[^>]*>", open(p, encoding="utf8").read(3000)).group(0)
    g = lambda a: (re.search(a + r'="([^"]*)"', m) or [None, None])[1]
    return g("viewBox"), g("width"), g("height")


def frame_window():
    sys.path.insert(0, HERE)
    import soupkit as K
    x, y, w, h = K.PB.FRAME_HOLE
    hole = K.wrect(x, y, w, h, 8, .6, 9, 40)
    new, old = text_of("photo-frame-soup"), text_of("p:photo-frame")
    same = (" " + hole + '" fill') in new and (" " + hole + '" fill') in old and new.count(hole) == old.count(hole)
    return (x, y, w, h), same


def registration():
    """Each peel skin must carry the EXACT outline path and the same x1.2 scale as the vegetable it lies on."""
    sys.path.insert(0, HERE)
    import soupkit as K, gen_soup_a as A
    out = {}
    pairs = [("peel-skin-carrot", "s:veg-carrot-whole", K.smooth(K.SA.carrot_pts(), .14)),
             ("peel-skin-potato", "veg-potato-whole", K.smooth(A.potato_pts()))]
    for skin, veg, d in pairs:
        a, b = text_of(skin), text_of(veg)
        scale = f'transform="scale({K.VEG_K})"'
        out[f"{skin} lies exactly on {veg} (same outline path and x{K.VEG_K} scale)"] = (d in a and d in b and scale in a and scale in b)
    return out


def geometry():
    sys.path.insert(0, HERE)
    import soupkit as K, gen_soup_a as A, gen_soup_b as Bm, gen_soup_c as Cm
    js = open(os.path.join(SP, "scenes-soup.js"), encoding="utf8").read()
    blob = lambda key: re.search(r"\b" + key + r": \{[^}]*\}", js).group(0)
    arr = lambda b, key: json.loads(re.search(r"\b" + key + r": (\[[^\]]*\])", b).group(1))
    num = lambda b, key: float(re.search(r"\b" + key + r": ([\d.]+)", b).group(1))
    jprof = json.loads(re.search(r"^\s*vegProfile: (\{.*\}),\s*$", js, re.M).group(1))
    jspan = {v: json.loads(re.search(r"vegSpan: \{[^}]*" + v + r": (\[[^\]]*\])", js).group(1)) for v in VEGS}
    jstrip = {v: int(re.search(r"stripH: \{[^}]*" + v + r": (\d+)", js).group(1)) for v in VEGS}
    pot, peeler, jug, bowl, portion, stove = (blob(k) for k in ("pot", "peeler", "jug", "bowl", "portion", "stove"))
    # measured again here: the pot's foot against the images-b-pancakes hob, and the opening inside the rim
    grate = 430                       # the cooktop's grate arms reach r 430 around the big burner (gen_pancakes_a.burner)
    seat = (K.BURNER[0] - K.POT_BASE[0], K.BURNER[1] + K.POT_SEAT_DY - K.POT_BASE[1])
    geo = {
        f"pot >= 600 (viewBox {K.POT[0]}x{K.POT[1]})": min(K.POT) >= 600,
        f"pot opening inside the rim (opening rx {K.POT_IRX} <= rim rx {K.POT_RRX})": K.POT_IRX < K.POT_RRX and K.POT_IRY < K.POT_RRY,
        f"pot foot fits the hob (base rx {K.POT_BRX} <= grate reach {grate})": K.POT_BRX <= grate,
        f"pot fits the cooktop at the same scale (x {seat[0]}..{seat[0] + K.POT[0]} in a 1200-wide stove)": 0 <= seat[0] + K.POT[0] <= 1200 + 60,
        f"scenes-soup.js pot onStove = the kit seat {seat}": tuple(arr(pot, "onStove")) == seat,
        "scenes-soup.js pot rim / opening / base = kit": (tuple(arr(pot, "rim")) == (K.POT_RIM[0], K.POT_RIM[1], K.POT_RRX, K.POT_RRY)
                                                          and tuple(arr(pot, "opening")) == (K.POT_IC[0], K.POT_IC[1], K.POT_IRX, K.POT_IRY)
                                                          and tuple(arr(pot, "base")) == (K.POT_BASE[0], K.POT_BASE[1], K.POT_BRX, K.POT_BRY)),
        "scenes-soup.js pot w/h = kit": (num(pot, "w"), num(pot, "h")) == K.POT,
        f"scenes-soup.js peeler grip = kit {K.PEELER_GRIP}": tuple(arr(peeler, "grip")) == K.PEELER_GRIP,
        f"scenes-soup.js peeler blade line = kit {K.PEELER_BLADE}": tuple(arr(peeler, "blade")) == K.PEELER_BLADE,
        "peeler blade sits below the grip (a tool held above what it peels)": K.PEELER_BLADE[2] > K.PEELER_GRIP[1] + 150,
        f"scenes-soup.js jug spout = kit {K.JUG_SPOUT}": tuple(arr(jug, "spout")) == K.JUG_SPOUT,
        "scenes-soup.js soup bowl opening = kit": tuple(arr(bowl, "opening")) == (K.SBOWL_IC[0], K.SBOWL_IC[1], K.SBOWL_IRX, K.SBOWL_IRY),
        f"scenes-soup.js ladle anchor = kit {K.PORTION_AT}": tuple(arr(portion, "at")) == K.PORTION_AT,
        "scenes-soup.js portion frame = kit": (num(portion, "w"), num(portion, "h")) == K.PORTION,
        "scenes-soup.js stove = the images-b-pancakes cooktop": tuple(arr(stove, "burner")) == K.BURNER and tuple(arr(stove, "knob")) == K.KNOB_SEAT,
        "heaps and soup stages rise stage by stage": all(Bm.HEAP[i][3] > Bm.HEAP[i + 1][3] for i in (1, 2)) and all(Bm.SOUP[i][3] < Bm.SOUP[i + 1][3] for i in (1, 2)),
        "soup bits fit the pot's opening": max(Bm.BIT_S.values()) * 2 < K.POT_IRY * 2,
    }
    for v in VEGS:                      # the measured vegetable profile must be the one scenes-soup.js carries
        geo[f"scenes-soup.js {v} profile = gen_soup_a.py --profiles"] = jprof[v] == A.profile(v)
        geo[f"scenes-soup.js {v} span / stripH = measured"] = jspan[v] == list(A.VEG_SPAN[v]) and jstrip[v] == A.strip_height(v)
        vb = dims(path_of(f"veg-{v}-inside"))[0].split()
        geo[f"veg-{v}-inside is {A.PE.SW} x {A.strip_height(v)} (the prep strip spec)"] = [float(vb[2]), float(vb[3])] == [A.PE.SW, A.strip_height(v)]
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
        if rel == "images-b-soup" or rel.startswith("images-b-soup/"):
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
            r["size_ok"] = (vw == 60 and vh == STRIPS[nm]) if nm in STRIPS else r["short"] >= (500 if nm in BIG else 240)
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
    reg = registration()
    fails += sum(not v for v in reg.values())
    geo = geometry()
    fails += sum(not v for v in geo.values())
    extra = sorted(f for f in os.listdir(SP) if f.endswith(".svg") and f[:-4] not in REQUIRED)
    fails += len(extra)
    if md:
        print("| file | viewBox | short side | KB | clean | size rule |\n|---|---|---|---|---|---|")
        for r in rows:
            if not r["exists"]:
                print(f"| {r['name']} | MISSING | | | | |"); continue
            rule = ("60 x %d cut-face strip (prep spec)" % STRIPS[r["name"]]) if r["name"] in STRIPS else (">= 500 (work item)" if r["name"] in BIG else ">= 240")
            print(f"| {r['name']} | {r['vb']} | {r['short']:.0f} | {r['kb']:.1f} | {'ok' if r['clean'] else 'NO'} | {rule}: {'ok' if r['size_ok'] else 'NO'} |")
        print("\n| family | files | shared viewBox | identical |\n|---|---|---|---|")
        for f, same, vb, cnt in fam:
            print(f"| {f} | {cnt} | {vb} | {'yes' if same else 'NO'} |")
    else:
        for r in rows:
            print(("OK  " if r["ok"] else "FAIL"), f"{r['name']:22s}", r.get("vb"), f"{r['kb']:5.1f}KB short={r.get('short', 0):.0f} clean={r['clean']}")
        for f, same, vb, cnt in fam:
            print(("OK  " if same else "FAIL"), "family:", f, vb)
    for k, v in list(reg.items()) + list(geo.items()):
        print(("OK  " if v else "FAIL"), "geometry:", k)
    print(f"\nphoto-frame-soup window: x {win[0]}-{win[0] + win[2]}, y {win[1]}-{win[1] + win[3]}, identical hole path to prep photo-frame: {'yes' if win_ok else 'NO'}")
    total, changed, removed, added = outside_unchanged()
    bad = changed or removed or added
    fails += bool(bad)
    print(f"outside images-b-soup: {total} files in baseline; changed {len(changed)}, removed {len(removed)}, added {len(added)}"
          + ("" if not bad else f"  {changed[:5]} {removed[:5]} {added[:5]}"))
    print(f"\nrequired: {len(REQUIRED)}, present: {sum(r['exists'] for r in rows)}, failing checks: {fails}, extra svgs: {extra or 'none'}")
    big = max(rows, key=lambda r: r["kb"])
    print(f"largest item: {big['name']} {big['kb']:.1f} KB")
    print("RESULT:", "PASS" if not fails else "FAIL")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()

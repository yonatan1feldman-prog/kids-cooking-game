# Mechanical check for images-b-salad. Run: python tools/check_salad.py [--md] [--baseline <md5 list of everything outside images-b-salad>]
# 1) every required name exists  2) size <= 60 KB  3) clean SVG (well-formed XML; no text/fonts/images/scripts/external refs)
# 4) touch size: short side >= 240; main work items >= 500  5) families share an identical viewBox (also with images-b / prep partners)
# 6) the new vegetables meet the prep vegetable spec (viewBoxes, strip width/height = measured profile, profile in scenes-salad.js and README)
# 7) optional: nothing outside images-b-salad changed (md5 against a baseline taken before the work started)
import os, re, sys, json, hashlib, xml.etree.ElementTree as ET
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.normpath(os.path.join(HERE, ".."))
ASSETS = os.path.normpath(os.path.join(SAL, ".."))
B = os.path.join(ASSETS, "images-b"); PR = os.path.join(ASSETS, "images-b-prep")

REQUIRED = ["card-salad",
            "veg-cucumber-whole", "veg-cucumber-slice", "veg-cucumber-inside", "veg-carrot-whole", "veg-carrot-slice", "veg-carrot-inside",
            "lettuce-head", "lettuce-tear-1", "lettuce-tear-2", "lettuce-tear-3",
            "piece-cucumber", "piece-carrot", "piece-lettuce",
            "salad-bowl-back", "salad-bowl-front", "salad-mixed",
            "lemon-half-1", "lemon-half-2", "lemon-half-3", "juice-drop", "oil-bottle", "oil-drop", "salt-shaker",
            "salad-servers", "serving-bowl", "salad-portion", "colander", "water-drop",
            "photo-frame-salad", "salad-heap-1", "salad-heap-2", "salad-heap-3"]
# not touched by the child; sizes set by the brief (topping size / cut-line strip / falling particles): no 240 minimum
NOT_TOUCHED = {"piece-cucumber": "in-bowl piece, = topping size 140", "piece-carrot": "in-bowl piece, = topping size 140",
               "piece-lettuce": "in-bowl piece, = topping size 140", "veg-cucumber-inside": "cut-face strip (prep spec)",
               "veg-carrot-inside": "cut-face strip (prep spec)", "juice-drop": "falling particle", "oil-drop": "falling particle",
               "water-drop": "falling particle"}
BIG = ["veg-cucumber-whole", "veg-carrot-whole", "lettuce-head", "lettuce-tear-1", "lettuce-tear-2", "lettuce-tear-3",
       "salad-bowl-back", "salad-bowl-front", "salad-mixed", "salad-heap-1", "salad-heap-2", "salad-heap-3", "colander", "lemon-half-1", "lemon-half-2", "lemon-half-3"]
FAMILIES = {
    "lettuce states": ["lettuce-head", "lettuce-tear-1", "lettuce-tear-2", "lettuce-tear-3"],
    "lemon squeeze states": ["lemon-half-1", "lemon-half-2", "lemon-half-3"],
    "salad bowl layers + heaps + mixed filling": ["salad-bowl-back", "salad-bowl-front", "salad-heap-1", "salad-heap-2", "salad-heap-3", "salad-mixed"],
    "photo frames (= images-b-prep photo-frame)": ["photo-frame-salad", "p:photo-frame"],
    "recipe cards (= images-b card-pizza)": ["card-salad", "b:card-pizza"],
    "whole vegetables (= prep veg-*-whole)": ["veg-cucumber-whole", "veg-carrot-whole", "p:veg-tomato-whole", "p:veg-pepper-whole", "p:veg-onion-whole"],
    "slices (= prep veg-*-slice)": ["veg-cucumber-slice", "veg-carrot-slice", "p:veg-tomato-slice", "p:veg-pepper-slice"],
    "bowl pieces (= images-b topping-*)": ["piece-cucumber", "piece-carrot", "piece-lettuce", "b:topping-tomato", "b:topping-pepper", "b:topping-onion"],
    "drops": ["juice-drop", "oil-drop", "water-drop"],
}
FORBID = [r"<text", r"<image", r"<script", r"@font-face", r"font-family", r"<foreignObject", r"href=\"(?!#)", r"url\((?!#)", r"\son\w+="]


def path_of(n):
    if n.startswith("b:"): return os.path.join(B, n[2:] + ".svg")
    if n.startswith("p:"): return os.path.join(PR, n[2:] + ".svg")
    return os.path.join(SAL, n + ".svg")


def dims(p):
    m = re.search(r"<svg[^>]*>", open(p, encoding="utf8").read(3000)).group(0)
    g = lambda a: (re.search(a + r'="([^"]*)"', m) or [None, None])[1]
    return g("viewBox"), g("width"), g("height")


def veg_spec():
    """The new vegetables against the prep spec + the measured profiles (same code that draws them)."""
    sys.path.insert(0, HERE)
    import gen_salad_a as A
    js = open(os.path.join(SAL, "scenes-salad.js"), encoding="utf8").read()
    readme = open(os.path.join(SAL, "README-salad.md"), encoding="utf8").read() if os.path.exists(os.path.join(SAL, "README-salad.md")) else ""
    jsprof = json.loads(re.search(r"vegProfile: (\{.*?\]\]\})", js).group(1))
    rows = []
    for v in ("cucumber", "carrot"):
        H = A.strip_height(v)
        chk = {
            "whole 672x504": dims(path_of(f"veg-{v}-whole"))[0] == dims(path_of("p:veg-tomato-whole"))[0] == "0 0 672 504",
            "slice 240x240 (= prep slices)": dims(path_of(f"veg-{v}-slice"))[0] == dims(path_of("p:veg-tomato-slice"))[0] == "0 0 240 240",
            "strip 60 wide x tallest body": dims(path_of(f"veg-{v}-inside"))[0] == f"0 0 60 {H}",
            "profile in scenes-salad.js = measured": jsprof.get(v) == A.profile(v),
            "cut span in scenes-salad.js": f"{v}: [{A.VEG_SPAN[v][0]}, {A.VEG_SPAN[v][1]}]" in js,
            "profile table + alignment steps in README": (f"| {v} |" in readme and "insideStrip" in readme),
        }
        rows.append((v, chk))
    return rows


def frame_window():
    """photo-frame-salad has exactly the transparent window of the prep photo-frame: the same hole path (evenodd) in both files."""
    sys.path.insert(0, HERE)
    import saladkit as K
    x, y, w, h = K.PB.FRAME_HOLE
    hole = K.wrect(x, y, w, h, 8, .6, 9, 40)
    new, old = (open(path_of(n), encoding="utf8").read() for n in ("photo-frame-salad", "p:photo-frame"))
    same = (" " + hole + '" fill') in new and (" " + hole + '" fill') in old and new.count(hole) == old.count(hole)
    return (x, y, w, h), same


def outside_unchanged(baseline):
    want = {}
    for line in open(baseline, encoding="utf8"):
        if not line.strip(): continue
        h, f = line.rstrip("\n").split(None, 1)
        want[f.lstrip("*")] = h
    now = {}
    for root, dirs, files in os.walk(ASSETS):
        rel = os.path.relpath(root, ASSETS).replace("\\", "/")
        if rel == "images-b-salad" or rel.startswith("images-b-salad/"):
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
            r["size_ok"] = True if n in NOT_TOUCHED else r["short"] >= (500 if n in BIG else 240)
        r["ok"] = r["exists"] and r["kb"] <= 60 and r["clean"] and r["size_ok"]
        fails += not r["ok"]; rows.append(r)
    fam = []
    for f, mem in FAMILIES.items():
        vbs = {m: dims(path_of(m)) for m in mem if os.path.exists(path_of(m))}
        same = len(vbs) == len(mem) and len(set(vbs.values())) == 1
        fam.append((f, same, next(iter(vbs.values()))[0] if vbs else "-", len(mem)))
        fails += not same
    spec = veg_spec()
    fails += sum(not ok for _, c in spec for ok in c.values())
    win, win_ok = frame_window()
    fails += not win_ok
    extra = sorted(f for f in os.listdir(SAL) if f.endswith(".svg") and f[:-4] not in REQUIRED)
    fails += len(extra)
    if md:
        print("| file | exists | viewBox | short side | KB | <= 60 KB | clean SVG | size rule |")
        print("|---|---|---|---|---|---|---|---|")
        for r in rows:
            if not r["exists"]:
                print(f"| {r['name']} | NO | | | | | | |"); continue
            rule = NOT_TOUCHED.get(r["name"]) or (">= 500 (main work item)" if r["name"] in BIG else ">= 240")
            print(f"| {r['name']} | yes | {r['vb']} | {r['short']:.0f} | {r['kb']:.1f} | {'ok' if r['kb'] <= 60 else 'OVER'} | {'ok' if r['clean'] else 'NO'} | {rule}: {'ok' if r['size_ok'] else 'NO'} |")
        print("\n| family | files | shared viewBox | identical |\n|---|---|---|---|")
        for f, same, vb, cnt in fam:
            print(f"| {f} | {cnt} | {vb} | {'yes' if same else 'NO'} |")
        print("\n| vegetable | " + " | ".join(spec[0][1].keys()) + " |\n|---|" + "---|" * len(spec[0][1]))
        for v, c in spec:
            print(f"| {v} | " + " | ".join("ok" if ok else "NO" for ok in c.values()) + " |")
    else:
        for r in rows:
            print(("OK  " if r["ok"] else "FAIL"), f"{r['name']:22s}", r.get("vb"), f"{r.get('kb', 0):5.1f}KB short={r.get('short', 0):.0f} clean={r.get('clean')}")
        for f, same, vb, cnt in fam:
            print(("OK  " if same else "FAIL"), "family:", f, vb)
        for v, c in spec:
            for k, ok in c.items():
                print(("OK  " if ok else "FAIL"), "veg spec:", v, k)
    print(f"\nphoto-frame-salad window: x {win[0]}-{win[0] + win[2]}, y {win[1]}-{win[1] + win[3]} ({win[2]}x{win[3]}), identical hole path to prep photo-frame: {'yes' if win_ok else 'NO'}")
    if "--baseline" in sys.argv:
        total, changed, removed, added = outside_unchanged(sys.argv[sys.argv.index("--baseline") + 1])
        bad = changed or removed or added
        fails += bool(bad)
        print(f"\noutside images-b-salad: {total} files in baseline; changed {len(changed)}, removed {len(removed)}, added {len(added)}"
              + ("" if not bad else f"  {changed[:5]} {removed[:5]} {added[:5]}"))
    print(f"\nrequired: {len(REQUIRED)}, present: {sum(r['exists'] for r in rows)}, failing checks: {fails}, extra svgs: {extra or 'none'}")
    print(f"largest item: {max(r.get('kb', 0) for r in rows):.1f} KB")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()

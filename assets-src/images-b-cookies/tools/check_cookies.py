# Mechanical check for images-b-cookies. Run: python tools/check_cookies.py [--md]
# 1) exactly the 32 required names (no extra svg)  2) size <= 60 KB  3) clean SVG (well-formed XML; no text/fonts/images/
# scripts/external refs)  4) touch size: short side >= 240, central work items >= 500 (stamps = topping size 140 by design)
# 5) viewBox families (also against the images-b / prep partners)  6) photo-frame-cookies has the prep frame's exact window
# 7) the slot / cutter geometry in scenes-cookies.js equals cookiekit.py  8) nothing outside images-b-cookies changed
#    (md5 against tools/baseline-md5.txt, taken before any work started)
import os, re, sys, json, hashlib, xml.etree.ElementTree as ET
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
CK = os.path.normpath(os.path.join(HERE, ".."))
ASSETS = os.path.normpath(os.path.join(CK, ".."))
B = os.path.join(ASSETS, "images-b"); PR = os.path.join(ASSETS, "images-b-prep")
BASELINE = os.path.join(HERE, "baseline-md5.txt")

REQUIRED = ["card-cookies", "flour-bag", "sugar-jar", "butter-cube", "egg-1", "egg-2", "egg-3",
            "batter-stage-0", "batter-stage-1", "batter-stage-2", "batter-stage-3",
            "cookie-dough-knead-1", "cookie-dough-knead-2", "cookie-dough-knead-3", "cookie-dough-ball", "cookie-dough-flat",
            "cutter-star", "cutter-heart", "cutter-circle", "cutter-flower",
            "cookie-star", "cookie-heart", "cookie-circle", "cookie-flower", "baking-tray",
            "icing-tube-pink", "icing-tube-choc", "icing-blob-pink", "icing-blob-choc", "sprinkles-cluster", "candy-dot",
            "photo-frame-cookies"]
STAMPS = {"icing-blob-pink", "icing-blob-choc", "sprinkles-cluster", "candy-dot"}      # placed by a tap, = topping size 140
BIG = ["batter-stage-0", "batter-stage-1", "batter-stage-2", "batter-stage-3", "cookie-dough-flat", "baking-tray"]
FAMILIES = {
    "eggs": ["egg-1", "egg-2", "egg-3"],
    "batter stages (= prep sauce-stage / prep-bowl)": ["batter-stage-0", "batter-stage-1", "batter-stage-2", "batter-stage-3", "p:sauce-stage-0", "p:prep-bowl-back"],
    "cookie dough (= images-b dough-ball)": ["cookie-dough-knead-1", "cookie-dough-knead-2", "cookie-dough-knead-3", "cookie-dough-ball", "b:dough-ball"],
    "cutters": ["cutter-star", "cutter-heart", "cutter-circle", "cutter-flower"],
    "cookies": ["cookie-star", "cookie-heart", "cookie-circle", "cookie-flower"],
    "sheet + tray (same slots)": ["cookie-dough-flat", "baking-tray"],
    "stamps (= images-b topping-*)": ["icing-blob-pink", "icing-blob-choc", "sprinkles-cluster", "candy-dot", "b:topping-tomato"],
    "icing tubes": ["icing-tube-pink", "icing-tube-choc"],
    "photo frames (= prep photo-frame)": ["photo-frame-cookies", "p:photo-frame"],
    "recipe cards (= images-b card-pizza)": ["card-cookies", "b:card-pizza"],
}
FORBID = [r"<text", r"<image", r"<script", r"@font-face", r"font-family", r"<foreignObject", r"href=\"(?!#)", r"url\((?!#)", r"\son\w+="]


def path_of(n):
    if n.startswith("b:"): return os.path.join(B, n[2:] + ".svg")
    if n.startswith("p:"): return os.path.join(PR, n[2:] + ".svg")
    return os.path.join(CK, n + ".svg")


def dims(p):
    m = re.search(r"<svg[^>]*>", open(p, encoding="utf8").read(3000)).group(0)
    g = lambda a: (re.search(a + r'="([^"]*)"', m) or [None, None])[1]
    return g("viewBox"), g("width"), g("height")


def frame_window():
    sys.path.insert(0, HERE)
    import cookiekit as K
    x, y, w, h = K.PB.FRAME_HOLE
    hole = K.wrect(x, y, w, h, 8, .6, 9, 40)
    new, old = (open(path_of(n), encoding="utf8").read() for n in ("photo-frame-cookies", "p:photo-frame"))
    same = (" " + hole + '" fill') in new and (" " + hole + '" fill') in old and new.count(hole) == old.count(hole)
    return (x, y, w, h), same


def geometry():
    sys.path.insert(0, HERE)
    import cookiekit as K
    js = open(os.path.join(CK, "scenes-cookies.js"), encoding="utf8").read()
    slots = json.loads(re.search(r"slots: (\[\[.*?\]\])", js).group(1))
    press = json.loads(re.search(r"cutterPress: (\[[^\]]*\])", js).group(1))
    return {"slots in scenes-cookies.js = cookiekit.SLOTS": [tuple(s) for s in slots] == K.SLOTS,
            "cutter press point in scenes-cookies.js = cookiekit.CUT_PRESS": tuple(press) == K.CUT_PRESS,
            "README lists the six slots": all(f"({x}, {y})" in open(os.path.join(CK, "README-cookies.md"), encoding="utf8").read() for x, y in K.SLOTS)
            if os.path.exists(os.path.join(CK, "README-cookies.md")) else False}


def outside_unchanged():
    want = {}
    for line in open(BASELINE, encoding="utf8"):
        if not line.strip(): continue
        h, f = line.rstrip("\n").split(None, 1)
        want[f.lstrip("*")] = h
    now = {}
    for root, dirs, files in os.walk(ASSETS):
        rel = os.path.relpath(root, ASSETS).replace("\\", "/")
        if rel == "images-b-cookies" or rel.startswith("images-b-cookies/"):
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
            r["size_ok"] = r["short"] == 140 if n in STAMPS else r["short"] >= (500 if n in BIG else 240)
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
    extra = sorted(f for f in os.listdir(CK) if f.endswith(".svg") and f[:-4] not in REQUIRED)
    fails += len(extra)
    if md:
        print("| file | viewBox | short side | KB | clean | size rule |\n|---|---|---|---|---|---|")
        for r in rows:
            if not r["exists"]:
                print(f"| {r['name']} | MISSING | | | | |"); continue
            rule = "stamp = topping 140" if r["name"] in STAMPS else (">= 500 (work item)" if r["name"] in BIG else ">= 240")
            print(f"| {r['name']} | {r['vb']} | {r['short']:.0f} | {r['kb']:.1f} | {'ok' if r['clean'] else 'NO'} | {rule}: {'ok' if r['size_ok'] else 'NO'} |")
        print("\n| family | files | shared viewBox | identical |\n|---|---|---|---|")
        for f, same, vb, cnt in fam:
            print(f"| {f} | {cnt} | {vb} | {'yes' if same else 'NO'} |")
    else:
        for r in rows:
            print(("OK  " if r["ok"] else "FAIL"), f"{r['name']:22s}", r.get("vb"), f"{r.get('kb', 0):5.1f}KB short={r.get('short', 0):.0f} clean={r.get('clean')}")
        for f, same, vb, cnt in fam:
            print(("OK  " if same else "FAIL"), "family:", f, vb)
    for k, v in geo.items():
        print(("OK  " if v else "FAIL"), "geometry:", k)
    print(f"\nphoto-frame-cookies window: x {win[0]}-{win[0] + win[2]}, y {win[1]}-{win[1] + win[3]}, identical hole path to prep photo-frame: {'yes' if win_ok else 'NO'}")
    total, changed, removed, added = outside_unchanged()
    bad = changed or removed or added
    fails += bool(bad)
    print(f"outside images-b-cookies: {total} files in baseline; changed {len(changed)}, removed {len(removed)}, added {len(added)}"
          + ("" if not bad else f"  {changed[:5]} {removed[:5]} {added[:5]}"))
    print(f"\nrequired: {len(REQUIRED)}, present: {sum(r['exists'] for r in rows)}, failing checks: {fails}, extra svgs: {extra or 'none'}")
    big = max(rows, key=lambda r: r.get("kb", 0))
    print(f"largest item: {big['name']} {big.get('kb', 0):.1f} KB")
    print("RESULT:", "PASS" if not fails else "FAIL")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()

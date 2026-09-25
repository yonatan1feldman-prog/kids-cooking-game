# Mechanical check for images-b-smoothie. Run: python tools/check_smoothie.py [--md]
# 1) exactly the 31 required names (no extra svg)  2) size <= 60 KB  3) clean SVG (well-formed XML; no text/fonts/images/
# scripts/external refs)  4) touch size: short side >= 240 (the cut-face strips and the milk drop are untouched overlays/particles,
# sized by the vegetable spec / the salad drops), the main work items (jar family) >= 500  5) viewBox families (also against the
# prep / salad partners)  6) photo-frame-smoothie has the prep frame's exact window  7) the fruit profiles and the anchors in
# scenes-smoothie.js equal the generators (measured again here)  8) nothing outside images-b-smoothie changed
# (md5 against tools/baseline-md5.txt, taken before any work started)
import os, re, sys, json, hashlib, xml.etree.ElementTree as ET
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
SM = os.path.normpath(os.path.join(HERE, ".."))
ASSETS = os.path.normpath(os.path.join(SM, ".."))
PR = os.path.join(ASSETS, "images-b-prep"); SA = os.path.join(ASSETS, "images-b-salad"); CO = os.path.join(ASSETS, "images-b-cookies")
BASELINE = os.path.join(HERE, "baseline-md5.txt")
FR = ["banana", "strawberry", "mango", "kiwi"]

REQUIRED = (["card-smoothie", "colander-fruit"] + [f"fruit-{f}-{k}" for f in FR for k in ("whole", "slice", "inside")]
            + ["blender-jar-back", "blender-jar-front", "jar-heap-1", "jar-heap-2", "jar-heap-3", "blend-stage-1", "blend-stage-2", "blend-stage-3",
               "blender-base", "blender-button-off", "blender-button-on", "blender-lid", "milk-carton", "milk-drop", "glass-empty", "glass-full",
               "photo-frame-smoothie"])
UNTOUCHED = {f"fruit-{f}-inside" for f in FR} | {"milk-drop"}      # overlays / particles: sized by the spec, never touched
BIG = ["blender-jar-back", "blender-jar-front", "jar-heap-1", "jar-heap-2", "jar-heap-3", "blend-stage-1", "blend-stage-2", "blend-stage-3"]
FAMILIES = {
    "jar family (back, heaps, stages, front)": BIG,
    "whole fruit (= prep veg-*-whole, salad veg-*-whole)": [f"fruit-{f}-whole" for f in FR] + ["p:veg-tomato-whole", "s:veg-carrot-whole"],
    "slices (= prep veg-*-slice)": [f"fruit-{f}-slice" for f in FR] + ["p:veg-tomato-slice"],
    "blender buttons": ["blender-button-off", "blender-button-on"],
    "glasses": ["glass-empty", "glass-full"],
    "drops (= salad water-drop)": ["milk-drop", "s:water-drop"],
    "colander (= salad colander)": ["colander-fruit", "s:colander"],
    "photo frames (= prep photo-frame)": ["photo-frame-smoothie", "p:photo-frame", "c:photo-frame-cookies"],
    "recipe cards (= card-salad / card-cookies)": ["card-smoothie", "s:card-salad", "c:card-cookies"],
}
FORBID = [r"<text", r"<image", r"<script", r"@font-face", r"font-family", r"<foreignObject", r"href=\"(?!#)", r"url\((?!#)", r"\son\w+="]


def path_of(n):
    for pre, d in (("p:", PR), ("s:", SA), ("c:", CO)):
        if n.startswith(pre): return os.path.join(d, n[2:] + ".svg")
    return os.path.join(SM, n + ".svg")


def dims(p):
    m = re.search(r"<svg[^>]*>", open(p, encoding="utf8").read(3000)).group(0)
    g = lambda a: (re.search(a + r'="([^"]*)"', m) or [None, None])[1]
    return g("viewBox"), g("width"), g("height")


def frame_window():
    sys.path.insert(0, HERE)
    import smoothiekit as K
    x, y, w, h = K.PB.FRAME_HOLE
    hole = K.wrect(x, y, w, h, 8, .6, 9, 40)
    new, old = (open(path_of(n), encoding="utf8").read() for n in ("photo-frame-smoothie", "p:photo-frame"))
    same = (" " + hole + '" fill') in new and (" " + hole + '" fill') in old and new.count(hole) == old.count(hole)
    return (x, y, w, h), same


def geometry():
    sys.path.insert(0, HERE)
    import gen_smoothie_a as A, gen_smoothie_b as Bm, gen_smoothie_c as Cm
    js = open(os.path.join(SM, "scenes-smoothie.js"), encoding="utf8").read()
    prof = json.loads(re.search(r"fruitProfile: (\{.*?\]\]\})", js).group(1))
    span = json.loads(re.search(r"fruitSpan: (\{.*?\})", js).group(1))
    sh = json.loads(re.search(r"stripH: (\{.*?\})", js).group(1))
    num = lambda key: json.loads(re.search(key + r": (\[[^\]]*\])", js).group(1))
    jar = re.search(r"jar: \{[^}]*\}", js).group(0); base = re.search(r"base: \{[^}]*\}", js).group(0)
    arr = lambda blob, key: json.loads(re.search(key + r": (\[[^\]]*\])", blob).group(1))
    readme = open(os.path.join(SM, "README-smoothie.md"), encoding="utf8").read() if os.path.exists(os.path.join(SM, "README-smoothie.md")) else ""
    strips_ok = all(dims(path_of(f"fruit-{f}-inside"))[0] == f"0 0 60 {A.strip_height(f)}" for f in FR)
    return {
        "fruit profiles in scenes-smoothie.js = measured (gen_smoothie_a.profile)": all(prof[f] == A.profile(f) for f in FR),
        "fruit cut spans in scenes-smoothie.js = gen_smoothie_a.VEG_SPAN": all(tuple(span[f]) == A.VEG_SPAN[f] for f in FR),
        "strip heights in scenes-smoothie.js = measured, and = the inside viewBoxes": all(sh[f] == A.strip_height(f) for f in FR) and strips_ok,
        "jar seat / spout / mouth in scenes-smoothie.js = gen_smoothie_b": tuple(arr(jar, "seat")) == Bm.SEAT and tuple(arr(jar, "spout")) == Bm.SPOUT
            and arr(jar, "mouth") == [*Bm.RIM_C, Bm.RIM_RX, Bm.RIM_RY],
        "base seat / button centre in scenes-smoothie.js = gen_smoothie_b": tuple(arr(base, "seat")) == Bm.BASE_SEAT and tuple(arr(base, "button")) == Bm.BUTTON_C,
        "lid seat in scenes-smoothie.js = gen_smoothie_b": tuple(num(r"lid: \{ w: 480, h: 240, seat")) == Bm.LID_SEAT,
        "carton spout in scenes-smoothie.js = gen_smoothie_c": tuple(num(r"carton: \{ w: 320, h: 560, spout")) == Cm.CARTON_SPOUT,
        "README has the profile table for all four fruits": all(f"| {f} |" in readme for f in FR),
    }


def outside_unchanged():
    want = {}
    for line in open(BASELINE, encoding="utf8"):
        if not line.strip(): continue
        h, f = line.rstrip("\n").split(None, 1)
        want[f.lstrip("*")] = h
    now = {}
    for root, dirs, files in os.walk(ASSETS):
        rel = os.path.relpath(root, ASSETS).replace("\\", "/")
        if rel == "images-b-smoothie" or rel.startswith("images-b-smoothie/"):
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
            r["size_ok"] = True if n in UNTOUCHED else r["short"] >= (500 if n in BIG else 240)
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
    extra = sorted(f for f in os.listdir(SM) if f.endswith(".svg") and f[:-4] not in REQUIRED)
    fails += len(extra)
    if md:
        print("| file | viewBox | short side | KB | clean | size rule |\n|---|---|---|---|---|---|")
        for r in rows:
            if not r["exists"]:
                print(f"| {r['name']} | MISSING | | | | |"); continue
            rule = "untouched overlay (spec size)" if r["name"] in UNTOUCHED else (">= 500 (work item)" if r["name"] in BIG else ">= 240")
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
    print(f"\nphoto-frame-smoothie window: x {win[0]}-{win[0] + win[2]}, y {win[1]}-{win[1] + win[3]}, identical hole path to prep photo-frame: {'yes' if win_ok else 'NO'}")
    total, changed, removed, added = outside_unchanged()
    bad = changed or removed or added
    fails += bool(bad)
    print(f"outside images-b-smoothie: {total} files in baseline; changed {len(changed)}, removed {len(removed)}, added {len(added)}"
          + ("" if not bad else f"  {changed[:5]} {removed[:5]} {added[:5]}"))
    print(f"\nrequired: {len(REQUIRED)}, present: {sum(r['exists'] for r in rows)}, failing checks: {fails}, extra svgs: {extra or 'none'}")
    big = max(rows, key=lambda r: r.get("kb", 0))
    print(f"largest item: {big['name']} {big.get('kb', 0):.1f} KB")
    print("RESULT:", "PASS" if not fails else "FAIL")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()

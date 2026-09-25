# Mechanical check for images-b-prep. Run: python tools/check_prep.py [--md]
# 1) every required name exists  2) size <= 60 KB  3) clean SVG (well-formed XML; no text/fonts/images/scripts/external refs)
# 4) touch size: short side >= 240; main work items >= 500  5) families share an identical viewBox (also with images-b partners)
import os, re, sys, xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
PREP = os.path.normpath(os.path.join(HERE, ".."))
B = os.path.normpath(os.path.join(PREP, "..", "images-b"))

REQUIRED = ["sink-basin", "faucet", "water-stream", "kid-hands", "bubble",
            "dough-knead-1", "dough-knead-2", "dough-knead-3",
            "prep-bowl-back", "prep-bowl-front", "sauce-stage-0", "sauce-stage-1", "sauce-stage-2", "sauce-stage-3", "spoon-wood",
            "cheese-block", "grater", "cheese-pile-1", "cheese-pile-2", "cheese-pile-3", "cheese-handful",
            "cutting-board", "knife", "veg-tomato-whole", "veg-tomato-slice", "veg-mushroom-whole", "veg-mushroom-slice",
            "veg-pepper-whole", "veg-pepper-slice", "veg-onion-whole", "veg-onion-slice",
            "can-corn-closed", "can-corn-open", "can-lid", "jar-olives-closed", "jar-olives-open", "jar-lid",
            "oven-panel", "oven-needle", "temp-glow", "btn-temp-up", "btn-temp-down", "oven-start-off", "oven-start-on",
            "oven-mitts", "mitt-single", "mom-hand-knife", "mom-hand-press", "mom-hand-mitt", "mom-mouth-chew",
            "photo-frame", "logo-cooking-with-mom",
            "veg-tomato-inside", "veg-mushroom-inside", "veg-pepper-inside", "veg-onion-inside", "press-dent"]
# not touched by the child (placed by code on a cut line / under a hand), sizes given by the brief: no 240 minimum
OVERLAY = ["veg-tomato-inside", "veg-mushroom-inside", "veg-pepper-inside", "veg-onion-inside", "press-dent"]
BIG = ["veg-tomato-whole", "veg-mushroom-whole", "veg-pepper-whole", "veg-onion-whole", "cutting-board", "prep-bowl-back",
       "prep-bowl-front", "grater", "oven-panel"]
FAMILIES = {   # name -> members ("b:" = file in images-b, must match too)
    "sauce stages + bowl layers": ["prep-bowl-back", "prep-bowl-front", "sauce-stage-0", "sauce-stage-1", "sauce-stage-2", "sauce-stage-3"],
    "knead stages (= images-b dough-ball)": ["dough-knead-1", "dough-knead-2", "dough-knead-3", "b:dough-ball"],
    "start button off/on": ["oven-start-off", "oven-start-on"],
    "Mom mouth (= images-b mom-mouth-*)": ["mom-mouth-chew", "b:mom-mouth-smile", "b:mom-mouth-open", "b:mom-mouth-talk"],
    "oven panel + needle": ["oven-panel", "oven-needle"],
    "Mom demo hands (= images-b mom-hand-*)": ["mom-hand-knife", "mom-hand-press", "mom-hand-mitt", "b:mom-hand-point", "b:mom-hand-grab"],
    "arrow buttons (= images-b btn-*)": ["btn-temp-up", "btn-temp-down", "b:btn-play"],
    "can open/closed": ["can-corn-closed", "can-corn-open"], "jar open/closed (label changed, size kept)": ["jar-olives-closed", "jar-olives-open"],
}
FORBID = [r"<text", r"<image", r"<script", r"@font-face", r"font-family", r"<foreignObject", r"href=\"(?!#)", r"url\((?!#)", r"\son\w+="]


def path_of(n):
    return os.path.join(B, n[2:] + ".svg") if n.startswith("b:") else os.path.join(PREP, n + ".svg")


def dims(p):
    m = re.search(r"<svg[^>]*>", open(p, encoding="utf8").read(3000)).group(0)
    g = lambda a: (re.search(a + r'="([^"]*)"', m) or [None, None])[1]
    return g("viewBox"), g("width"), g("height")


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
            r["size_ok"] = True if n in OVERLAY else r["short"] >= (500 if n in BIG else 240)
        r["ok"] = r["exists"] and r["kb"] <= 60 and r["clean"] and r["size_ok"]
        fails += not r["ok"]; rows.append(r)
    fam = []
    for f, mem in FAMILIES.items():
        vbs = {m: dims(path_of(m)) for m in mem if os.path.exists(path_of(m))}
        same = len(vbs) == len(mem) and len(set(vbs.values())) == 1
        fam.append((f, same, next(iter(vbs.values()))[0] if vbs else "-", len(mem)))
        fails += not same
    extra = sorted(f for f in os.listdir(PREP) if f.endswith(".svg") and f[:-4] not in REQUIRED)
    if md:
        print("| file | exists | viewBox | short side | KB | <= 60 KB | clean SVG | size rule |")
        print("|---|---|---|---|---|---|---|---|")
        for r in rows:
            if not r["exists"]:
                print(f"| {r['name']} | NO | | | | | | |"); continue
            rule = "overlay, not touched" if r["name"] in OVERLAY else (">= 500" if r["name"] in BIG else ">= 240")
            print(f"| {r['name']} | yes | {r['vb']} | {r['short']:.0f} | {r['kb']:.1f} | {'ok' if r['kb'] <= 60 else 'OVER'} | {'ok' if r['clean'] else 'NO'} | {rule}: {'ok' if r['size_ok'] else 'NO'} |")
        print("\n| family | files | shared viewBox | identical |\n|---|---|---|---|")
        for f, same, vb, cnt in fam:
            print(f"| {f} | {cnt} | {vb} | {'yes' if same else 'NO'} |")
    else:
        for r in rows:
            print(("OK  " if r["ok"] else "FAIL"), f"{r['name']:24s}", r.get("vb"), f"{r.get('kb', 0):5.1f}KB short={r.get('short', 0):.0f} clean={r.get('clean')}")
        for f, same, vb, cnt in fam:
            print(("OK  " if same else "FAIL"), "family:", f, vb)
    total = sum(1 for _, _, fs in os.walk(PREP) for _ in fs)
    print(f"\nrequired: {len(REQUIRED)}, present: {sum(r['exists'] for r in rows)}, failing checks: {fails}, extra svgs: {extra or 'none'}")
    print(f"max item size: {max(r.get('kb', 0) for r in rows):.1f} KB; files in images-b-prep (all, incl. tools/shots): {total}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()

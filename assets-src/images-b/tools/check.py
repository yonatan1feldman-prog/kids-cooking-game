# Mechanical check for images-b. Run: python images-b/tools/check.py [--md]
# 1) every required name exists  2) same viewBox/width/height as images/ (except the background)
# 3) size budgets (60 KB item, 150 KB background)  4) forbidden content (text, fonts, images, scripts, external refs)
import os, re, sys, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.normpath(os.path.join(HERE, ".."))
OLD = os.path.normpath(os.path.join(B, "..", "images"))

REPLACE = ["bg-kitchen-landscape", "dough-ball", "dough-flat", "rolling-pin", "sauce-bowl", "sauce-blob", "cheese-shaker", "cheese-shred",
           "topping-tomato", "topping-olive", "topping-mushroom", "topping-corn", "topping-pepper", "topping-onion", "tray", "oven-closed",
           "oven-open", "oven-inside", "pizza-slice", "star", "btn-play", "btn-home", "btn-done", "card-pizza",
           "character-body", "character-eyes-open", "character-eyes-blink", "character-eyes-happy", "character-eyes-surprised",
           "character-mouth-open", "character-mouth-closed", "character-mouth-chew", "hand-hint"]
NEW = ["topping-bin", "pizza-board", "mom-body", "mom-head", "mom-hair", "mom-arm-left", "mom-arm-right", "mom-eyes-open", "mom-eyes-blink",
       "mom-eyes-happy", "mom-eyes-surprised", "mom-mouth-smile", "mom-mouth-open", "mom-mouth-talk",
       "mom-hand-point", "mom-hand-roll", "mom-hand-spread", "mom-hand-sprinkle", "mom-hand-grab"]
FORBID = [r"<text", r"<image", r"<script", r"@font-face", r"font-family", r"href=\"http", r"url\(http", r"<foreignObject", r"xlink:href=\"(?!#)"]


def dims(path):
    head = open(path, encoding="utf8").read(2000)
    m = re.search(r"<svg[^>]*>", head).group(0)
    g = lambda a: (re.search(a + r'="([^"]*)"', m) or [None, None])[1]
    return g("viewBox"), g("width"), g("height")


def main():
    md = "--md" in sys.argv
    rows, fails = [], 0
    for name in REPLACE + NEW:
        p = os.path.join(B, name + ".svg")
        exists = os.path.exists(p)
        r = {"name": name, "exists": exists, "kind": "replace" if name in REPLACE else "new"}
        if exists:
            r["vb"], r["w"], r["h"] = dims(p)
            r["kb"] = os.path.getsize(p) / 1024
            limit = 150 if name == "bg-kitchen-landscape" else 60
            r["size_ok"] = r["kb"] <= limit
            txt = open(p, encoding="utf8").read()
            r["clean"] = not any(re.search(f, txt) for f in FORBID)
            op = os.path.join(OLD, name + ".svg")
            if os.path.exists(op):
                o = dims(op)
                r["old"] = o
                r["dims_ok"] = (r["vb"], r["w"], r["h"]) == o if name != "bg-kitchen-landscape" else (r["vb"], r["w"], r["h"]) == ("0 0 2400 1080", "2400", "1080")
            else:
                r["old"] = None
                r["dims_ok"] = None
        ok = exists and r.get("size_ok") and r.get("clean") and r.get("dims_ok") is not False
        r["ok"] = ok
        fails += not ok
        rows.append(r)
    # pizza-board must be a copy of tray
    same = False
    try:
        h = lambda f: hashlib.md5(open(os.path.join(B, f), "rb").read()).hexdigest()
        same = h("tray.svg") == h("pizza-board.svg")
    except OSError:
        pass
    if md:
        print("| file | exists | viewBox / width x height (new) | old (images/) | same dims | size KB | budget | clean SVG |")
        print("|---|---|---|---|---|---|---|---|")
        for r in rows:
            if not r["exists"]:
                print(f"| {r['name']} | NO | | | | | | |"); continue
            old = f"{r['old'][0]} / {r['old'][1]}x{r['old'][2]}" if r["old"] else "(new file)"
            dok = {True: "yes", False: "NO", None: "n/a"}[r["dims_ok"]]
            if r["name"] == "bg-kitchen-landscape" and r["dims_ok"]:
                dok = "exception: 2400x1080 as required"
            print(f"| {r['name']} | yes | {r['vb']} / {r['w']}x{r['h']} | {old} | {dok} | {r['kb']:.1f} | {'ok' if r['size_ok'] else 'OVER'} | {'ok' if r['clean'] else 'NO'} |")
    else:
        for r in rows:
            print(("OK  " if r["ok"] else "FAIL"), r["name"], r.get("vb"), r.get("w"), r.get("h"), f"{r.get('kb', 0):.1f}KB",
                  "dims:" + str(r.get("dims_ok")), "clean:" + str(r.get("clean")))
    print(f"\npizza-board identical to tray: {same}")
    print(f"required files: {len(rows)}, failing: {fails}")
    extra = sorted(f for f in os.listdir(B) if f.endswith(".svg") and f[:-4] not in REPLACE + NEW)
    print("other svgs in images-b:", extra or "none")
    sys.exit(1 if fails or not same else 0)


if __name__ == "__main__":
    main()

"""Scans the audio folders and writes preview.html (mobile listening page)."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VO_TEXT = {
    "vo-welcome": "Let's cook!", "vo-pick-pizza": "Let's make a pizza!", "vo-roll": "Roll the dough!",
    "vo-sauce": "Spread the sauce!", "vo-cheese": "Sprinkle the cheese!", "vo-toppings": "Add your toppings!",
    "vo-done-hint": "Tap when you're done!", "vo-oven": "Into the oven!", "vo-baking": "It's baking!",
    "vo-ready": "Ding! It's ready!", "vo-feed": "Time to eat!", "vo-praise-1": "Great job!",
    "vo-praise-2": "Wow!", "vo-praise-3": "Beautiful!", "vo-praise-4": "Yummy!", "vo-finale": "You made a pizza!",
}
MOM_TEXT = {
    "vo-welcome": "Let's cook together!", "vo-pick-pizza": "Let's make a pizza!", "vo-watch-me": "Watch me first!",
    "vo-your-turn": "Now you try!", "vo-roll": "Let's roll the dough!", "vo-sauce": "Now spread the sauce!",
    "vo-cheese": "Sprinkle the cheese!", "vo-toppings": "Put on anything you like!", "vo-done-hint": "Tap here when you're done!",
    "vo-oven": "Into the oven it goes!", "vo-baking": "Look, it's baking!", "vo-ready": "Ding! It's ready!",
    "vo-feed": "Let's give Pipa a taste!", "vo-help": "Let me help you!", "vo-praise-1": "Great job!", "vo-praise-2": "Wow!",
    "vo-praise-3": "Beautiful!", "vo-praise-4": "Yummy!", "vo-praise-5": "I love it!", "vo-praise-6": "You worked so hard!",
    "vo-praise-7": "I love how you did that!", "vo-finale": "We made a pizza together!", "vo-bye": "That was fun! Bye bye!",
}
SFX_GROUPS = [  # prefix, title, existing sound to compare with (or None)
    ("munch", "Munch (eating)", "munch.ogg"),
    ("squish", "Squish (dough / sauce)", "squish.ogg"),
    ("sprinkle", "Sprinkle (cheese)", "sprinkle.ogg"),
    ("whoosh", "Whoosh (slide)", "whoosh.ogg"),
    ("bake", "Baking in the oven (new)", "oven-ding.ogg"),
    ("star", "Star appears (new)", None),
    ("complete", "Stage complete (new)", "cheer-jingle.ogg"),
]

def files(folder):
    d = ROOT / folder
    return sorted(p.name for p in d.glob("*.ogg")) if d.exists() else []

def nat(s):
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", s)]

a, b = set(files("voice-a")), set(files("voice-b"))
vo = [{"id": k, "text": t, "a": f"{k}.ogg" in a, "b": f"{k}.ogg" in b} for k, t in VO_TEXT.items()]
ma, mb = set(files("voice-a-mom")), set(files("voice-b-mom"))
mom = [{"id": k, "text": t, "a": f"{k}.ogg" in ma, "b": f"{k}.ogg" in mb} for k, t in MOM_TEXT.items()]
music = sorted(files("music"), key=nat)
cands = files("sfx-candidates")
sfx = []
for prefix, title, cur in SFX_GROUPS:
    items = sorted([c for c in cands if re.fullmatch(rf"{prefix}-\d+\.ogg", c)], key=nat)
    sfx.append({"prefix": prefix, "title": title, "current": cur, "items": items})
character = files("character")
# Prep steps (2026-09-19): new Voice A lines, read from the script so the text is never out of sync
_block = (ROOT / "scripts/make_vo.py").read_text(encoding="utf-8").split("# Prep steps", 1)[1].split("# Salad (", 1)[0]
prep_vo = [{"id": k, "text": t, "a": f"{k}.ogg" in ma}
           for k, t in re.findall(r'^\s*"((?:vo|count|temp)-[\w-]+)": "(.*)",$', _block, re.M)]
PREP_SFX = [("chop", "Chop on the board"), ("water", "Running water (loop)"), ("bubbles", "Soap bubbles"),
            ("can-open", "Open a can"), ("jar-open", "Open a jar"), ("pour", "Pour into the bowl"),
            ("grate", "Grate"), ("camera", "Camera"), ("click", "Oven knob click"), ("beep", "Oven start beep")]
prep_sfx = [{"prefix": pf, "title": t, "loop": pf == "water",
             "items": sorted([c for c in cands if re.fullmatch(rf"{re.escape(pf)}-\d+\.ogg", c)], key=nat)}
            for pf, t in PREP_SFX]
# Salad (2026-09-19): read from the script the same way
_block = (ROOT / "scripts/make_vo.py").read_text(encoding="utf-8").split("# Salad (", 1)[1].split("}", 1)[0].split("# Cookies (", 1)[0]
salad_vo = [{"id": k, "text": t, "a": f"{k}.ogg" in ma}
            for k, t in re.findall(r'^\s*"((?:vo|name)-[\w-]+)": "(.*)",$', _block, re.M)]
SALAD_SFX = [("tear", "Tear the lettuce"), ("squeeze", "Squeeze the lemon"), ("crunch", "Crunchy bite"),
             ("drizzle", "Drizzle the oil"), ("salt", "Salt shaker")]
salad_sfx = [{"prefix": pf, "title": t,
              "items": sorted([c for c in cands if re.fullmatch(rf"{re.escape(pf)}-\d+\.ogg", c)], key=nat)}
             for pf, t in SALAD_SFX]
data = {"mom": mom, "vo": vo, "music": music, "sfx": sfx, "character": character,
        "prep": {"vo": prep_vo, "sfx": prep_sfx}, "salad": {"vo": salad_vo, "sfx": salad_sfx}}

html = (ROOT / "scripts/preview_template.html").read_text(encoding="utf-8")
(ROOT / "preview.html").write_text(html.replace("/*DATA*/null", json.dumps(data, ensure_ascii=False)), encoding="utf-8")
print(json.dumps(data, indent=1))

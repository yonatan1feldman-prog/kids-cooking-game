"""Targeted fixes to the vegetable-soup lines in voice-a-mom (2026-09-20; copy of fix_vo_pancakes.py, same functions, only the line list and the chosen fixes differ). Everything else keeps make_vo.py's processing.
Reuses fix_vo.py / fix_vo_salad.py functions unchanged (measurement, approach-B cut, soft limiter, normalize, encode).

  python fix_vo_soup.py measure  -> measures the 16 soup lines (lead/trail extra vowel + speech recognizer) into work/vo/fix-soup/measure.json
  python fix_vo_soup.py build    -> renders candidates into work/vo/fix-soup/ and measures them
  python fix_vo_soup.py apply    -> backs up the originals to work/vo/pre-fix-soup/, copies the chosen candidates into voice-a-mom/,
                                    updates work/vo/report-mom.json
"""
import json, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fix_vo as F
import fix_vo_salad as S
import fix_vo_pancakes as P

ROOT = F.ROOT
WORK = F.WORK = ROOT / "work/vo/fix-soup"
PRE = ROOT / "work/vo/pre-fix-soup"
LINES = ["vo-album", "vo-pick-soup", "name-potato", "name-zucchini", "vo-peel", "vo-peel-done", "vo-into-pot", "vo-water",
         "vo-stir-soup", "vo-soup-ready", "vo-serve-soup", "vo-soup-mom", "vo-soup-pipa", "vo-soup-yum", "vo-photo-soup",
         "vo-finale-soup"]
NAMES = ["potato", "zucchini"]  # recognizer grammar for the name-* files, as for the salad names
F.TAIL_CUT = set()
S.START_RUN = {"name-zucchini": 0, "vo-stir-soup": 0}  # consonant run the word starts at; Kokoro put a voiced "uh" in front (as count-2/5/7, name-carrot)
GAP = set()          # words starting with a plosive with no consonant-noise run (P.gap_cut)
S.VOICING = set()    # start at the first voiced frame after a leading hiss (bt_cut / S.cut)

gap_cut, tail_cut, bt_cut = P.gap_cut, P.tail_cut, P.bt_cut


def measure():
    WORK.mkdir(parents=True, exist_ok=True)
    res = {}
    for n in LINES:
        p = ROOT / f"voice-a-mom/{n}.ogg"
        res[n] = F.measure(p, "vo-temp-more") | {"asr_free": F.asr(p, grammar=False)}
        print(n, res[n]["dur"], res[n]["lufs"], res[n]["peak_dbfs"], res[n]["lead_db"],
              "|", " ".join(w for w, _ in res[n]["asr_free"]),
              min([c for _, c in res[n]["asr_free"]] or [0]), flush=True)
    json.dump(res, open(WORK / "measure.json", "w"), indent=1)


def measure_names():
    """The name-* files against a grammar of only the two soup vegetable names (as fix_vo_salad does)."""
    old = F.NUMS
    F.NUMS = NAMES + ["[unk]"]
    out = {}
    for n in ("name-potato", "name-zucchini"):
        for folder in ("voice-a-mom", None):
            p = (ROOT / f"{folder}/{n}.ogg") if folder else (WORK / f"{n}_L.ogg")
            if p.exists():
                out[str(p.relative_to(ROOT)).replace("\\", "/")] = F.asr(p, grammar=True)
    F.NUMS = old
    print(json.dumps(out, indent=1))
    json.dump(out, open(WORK / "measure-names.json", "w"), indent=1)


def build(specs):  # e.g. fix_vo_soup.py build vo-album=L
    WORK.mkdir(parents=True, exist_ok=True)
    res = {}
    for name, kind in specs.items():
        x, sr = S.raw(name); info = {}
        if kind == "L":
            z, info["limiter_max_gr_db"] = F.limit_and_normalize(F.trim(x, sr), sr)
        elif kind in ("B", "BL"):
            y, info["cut_at_s"] = gap_cut(x, sr) if name in GAP else S.cut(x, sr, name)
            if kind == "BL":  # start cut, then the soft limiter + normalize (both approved: name-carrot B, vo-temp-more L)
                z, info["limiter_max_gr_db"] = F.limit_and_normalize(y, sr)
            else:
                z = S.pad(F.normalize(y, sr), sr)
        elif kind == "BT":
            y, info["cut_s"] = bt_cut(x, sr, name); z = F.normalize(y, sr)
        elif kind == "TL":
            y, info["end_at_s"] = tail_cut(x, sr); z, info["limiter_max_gr_db"] = F.limit_and_normalize(y, sr)
        else:  # T
            y, info["end_at_s"] = tail_cut(x, sr); z = F.normalize(y, sr)
        out = F.encode(z, sr, f"{name}_{kind}")
        res[name] = {"before": F.measure(ROOT / f"voice-a-mom/{name}.ogg", "vo-temp-more"),
                     kind: F.measure(out, "vo-temp-more") | {"asr_free": F.asr(out, grammar=False)} | info}
        m = res[name][kind]; print(name, kind, m["dur"], m["lufs"], m["peak_dbfs"], m["lead_db"], info, "|",
                                   " ".join(w for w, _ in m["asr_free"]), flush=True)
    json.dump(res, open(WORK / "measure-build.json", "w"), indent=1)


def apply(choice):
    PRE.mkdir(parents=True, exist_ok=True)
    for name in choice:
        if not (PRE / f"{name}.ogg").exists():
            shutil.copy2(ROOT / f"voice-a-mom/{name}.ogg", PRE / f"{name}.ogg")
    F.apply(choice)


if __name__ == "__main__":
    arg = dict(a.split("=") for a in sys.argv[2:])
    if sys.argv[1] == "measure":
        measure()
    elif sys.argv[1] == "names":
        measure_names()
    elif sys.argv[1] == "build":
        build(arg)
    else:
        apply(arg)

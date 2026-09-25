"""Targeted fixes to the pancake lines in voice-a-mom (2026-09-19; copy of fix_vo_smoothie.py, same functions, only the line list and the chosen fixes differ). Everything else keeps make_vo.py's processing.
Reuses fix_vo.py / fix_vo_salad.py functions unchanged (measurement, approach-B cut, soft limiter, normalize, encode).

  python fix_vo_pancakes.py measure  -> measures the 15 pancake lines (lead/trail extra vowel + speech recognizer) into work/vo/fix-pancakes/measure.json
  python fix_vo_pancakes.py build    -> renders candidates into work/vo/fix-pancakes/ and measures them
  python fix_vo_pancakes.py apply    -> backs up the originals to work/vo/pre-fix-pancakes/, copies the chosen candidates into voice-a-mom/,
                                       updates work/vo/report-mom.json
"""
import json, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fix_vo as F
import fix_vo_salad as S

ROOT = F.ROOT
WORK = F.WORK = ROOT / "work/vo/fix-pancakes"
PRE = ROOT / "work/vo/pre-fix-pancakes"
LINES = ["vo-pick-pancakes", "vo-stir-batter", "vo-stove", "vo-ladle", "vo-bubbles", "vo-flip", "vo-flip-done", "vo-more-pancake",
         "vo-decorate-pancakes", "vo-share-pancakes", "vo-pancake-mom", "vo-pancake-pipa", "vo-pancake-yum", "vo-photo-pancakes",
         "vo-finale-pancakes"]
F.TAIL_CUT = set()
S.START_RUN = {}
GAP = set()
S.VOICING = {"vo-pancake-yum"}  # BT: a 70 ms breathy hiss (up to -7 dB, consonant-like noise) before the "Mmm"; start at the first voiced frame after it

def gap_cut(x, sr):
    """B for a word starting with a plosive that has no consonant-noise run: skip the leading "uh" up to the first dip
    30 dB under the peak, start 2 ms before the frame where the level rises again (3 ms fade-in, 20 ms silence in front),
    end where make_vo ends the file."""
    fr = F.frames(x, sr); pk = max(d for _, d, _ in fr)
    i = next(k for k, (_, d, _) in enumerate(fr) if d > pk - 30)
    while fr[i][1] > pk - 30: i += 1
    while fr[i][1] <= pk - 30: i += 1
    a = max(0, fr[i][0] - int(0.002 * sr))
    env = F.np.convolve(F.np.abs(x), F.np.ones(int(0.01 * sr)) / int(0.01 * sr), mode="same")
    b = min(len(x), F.np.where(env > env.max() * 10 ** (-42 / 20))[0][-1] + int(0.06 * sr))
    return F.cut_fade(x, sr, a, b, int(0.04 * sr)), round(a / sr, 3)

def tail_cut(x, sr):
    """T: make_vo's start point, end 5 ms into the last consonant-noise run (a breathy exhale after the final "r"),
    25 ms fade-out."""
    fr = F.frames(x, sr); pk = max(d for _, d, _ in fr); r = F.runs(fr, pk)
    env = F.np.convolve(F.np.abs(x), F.np.ones(int(0.01 * sr)) / int(0.01 * sr), mode="same")
    a = max(0, F.np.where(env > env.max() * 10 ** (-42 / 20))[0][0] - int(0.02 * sr))
    b = fr[r[-1][0]][0] + int(0.005 * sr)
    y = x[a:b].copy(); fi, fo = int(0.005 * sr), int(0.025 * sr)
    y[:fi] *= F.np.linspace(0, 1, fi); y[-fo:] *= F.np.linspace(1, 0, fo)
    return y, round(b / sr, 3)

def bt_cut(x, sr, name):
    """BT: start as fix_vo_salad's voicing cut (first voiced frame after the leading noise, 2 ms before it), end as tail_cut
    (5 ms into the last consonant-noise run), 3 ms fade-in, 25 ms fade-out, 20 ms silence in front."""
    fr = F.frames(x, sr); pk = max(d for _, d, _ in fr); r = F.runs(fr, pk)
    i = r[0][1] + 1
    while fr[i][2] > 3000: i += 1
    a = max(0, fr[i][0] - int(0.002 * sr))
    b = fr[r[-1][0]][0] + int(0.005 * sr)
    return F.cut_fade(x, sr, a, b, int(0.025 * sr)), (round(a / sr, 3), round(b / sr, 3))

def measure():
    WORK.mkdir(parents=True, exist_ok=True)
    res = {}
    for n in LINES:
        p = ROOT / f"voice-a-mom/{n}.ogg"
        res[n] = F.measure(p, "vo-temp-more") | {"asr_free": F.asr(p, grammar=False)}
        print(n, res[n]["lufs"], res[n]["peak_dbfs"], res[n]["lead_db"], " ".join(w for w, _ in res[n]["asr_free"]), min([c for _, c in res[n]["asr_free"]] or [0]), flush=True)
    json.dump(res, open(WORK / "measure.json", "w"), indent=1)

def build(specs):  # e.g. fix_vo_pancakes.py build vo-ladle=L
    WORK.mkdir(parents=True, exist_ok=True)
    res = {}
    for name, kind in specs.items():
        x, sr = S.raw(name); info = {}
        if kind == "L":
            z, info["limiter_max_gr_db"] = F.limit_and_normalize(F.trim(x, sr), sr)
        elif kind == "B":
            y, info["cut_at_s"] = gap_cut(x, sr) if name in GAP else S.cut(x, sr, name); z = S.pad(F.normalize(y, sr), sr)
        elif kind == "BT":  # start cut after a leading hiss + tail cut (both approved cuts: name-onion B, vo-flour T), then -18 LUFS
            y, info["cut_s"] = bt_cut(x, sr, name); z = F.normalize(y, sr)
        elif kind == "TL":  # tail cut, then the soft limiter + normalize (both approved: vo-flour T, vo-temp-more L)
            y, info["end_at_s"] = tail_cut(x, sr); z, info["limiter_max_gr_db"] = F.limit_and_normalize(y, sr)
        else:
            y, info["end_at_s"] = tail_cut(x, sr); z = F.normalize(y, sr)
        out = F.encode(z, sr, f"{name}_{kind}")
        res[name] = {"before": F.measure(ROOT / f"voice-a-mom/{name}.ogg", "vo-temp-more"),
                     kind: F.measure(out, "vo-temp-more") | {"asr_free": F.asr(out, grammar=False)} | info}
        m = res[name][kind]; print(name, kind, m["dur"], m["lufs"], m["peak_dbfs"], m["lead_db"], info, " ".join(w for w, _ in m["asr_free"]), flush=True)
    json.dump(res, open(WORK / "measure-build.json", "w"), indent=1)

def apply(choice):
    PRE.mkdir(parents=True, exist_ok=True)
    for name in choice:
        if not (PRE / f"{name}.ogg").exists():
            shutil.copy2(ROOT / f"voice-a-mom/{name}.ogg", PRE / f"{name}.ogg")
    F.apply(choice)

if __name__ == "__main__":
    arg = dict(a.split("=") for a in sys.argv[2:])
    measure() if sys.argv[1] == "measure" else build(arg) if sys.argv[1] == "build" else apply(arg)

"""Targeted fixes to the two mini-game lines (the market, washing up) in voice-a-mom (2026-09-28; the fix_vo.py functions unchanged).
vo-market-done, vo-dishes-colour and vo-dishes-done hit the -1.5 dBFS peak cap first (-21.1 / -19.4 / -18.8 LUFS): the same
gentle soft limiter as vo-temp-more, then -18 LUFS. The recognizer check of the other rounds was not run (its model
download was blocked in the cloud session); the lead / trail measurement below was.

  python fix_vo_skewers.py measure  -> lead / trail extra-vowel levels, LUFS and peak of the 17 mini-game lines
  python fix_vo_skewers.py apply    -> backs up the three originals to work/vo/pre-fix-minigames/, limits and re-encodes them into voice-a-mom/
                                    (then copy them to final/voice/ and public/assets/sounds/voice/)
"""
import shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fix_vo as F

ROOT = F.ROOT
PRE = ROOT / "work/vo/pre-fix-minigames"
LINES = ["vo-pick-market", "vo-market-list", "vo-market-remember", "vo-market-not", "vo-market-pipa", "vo-market-two",
         "vo-market-done", "vo-pick-dishes", "vo-dishes-start", "vo-dishes-scrub", "vo-dishes-clean", "vo-dishes-rack",
         "vo-dishes-rack-2", "vo-dishes-colour", "vo-dishes-done", "name-blue", "name-yellow"]
LIMIT = ["vo-market-done", "vo-dishes-colour", "vo-dishes-done"]


def measure():
    for n in LINES:
        x, sr = F.decode(ROOT / f"voice-a-mom/{n}.ogg")
        lead, trail = F.blobs(x, sr, False)
        print(n, round(len(x) / sr, 2), round(F.loudness(x, sr), 2), round(float(20 * F.np.log10(abs(x).max())), 2), lead, trail)


def apply():
    PRE.mkdir(parents=True, exist_ok=True)
    for n in LIMIT:
        src = ROOT / f"voice-a-mom/{n}.ogg"
        if not (PRE / src.name).exists():
            shutil.copy(src, PRE / src.name)
        x, sr = F.decode(PRE / src.name)
        y, db = F.limit_and_normalize(x, sr)
        F.WORK.mkdir(parents=True, exist_ok=True)
        shutil.copy(F.encode(y, sr, n), src)
        print(n, "limited", db, "dB")


if __name__ == "__main__":
    {"measure": measure, "apply": apply}[sys.argv[1]]()

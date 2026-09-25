"""Generate English narration with Kokoro-82M (local, Apache-2.0), trim, loudness-match, encode to OGG."""
import subprocess, sys, json
from pathlib import Path
import numpy as np, soundfile as sf, pyloudnorm as pyln
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / "tools/ffmpeg/bin/ffmpeg.exe"
LINES = {
    "vo-welcome": "Let's cook!",
    "vo-pick-pizza": "Let's make a pizza!",
    "vo-roll": "Roll the dough!",
    "vo-sauce": "Spread the sauce!",
    "vo-cheese": "Sprinkle the cheese!",
    "vo-toppings": "Add your toppings!",
    "vo-done-hint": "Tap when you're done!",
    "vo-oven": "Into the oven!",
    "vo-baking": "It's baking!",
    "vo-ready": "Ding! It's ready!",
    "vo-feed": "Time to eat!",
    "vo-praise-1": "Great job!",
    "vo-praise-2": "Wow!",
    "vo-praise-3": "Beautiful!",
    "vo-praise-4": "Yummy!",
    "vo-finale": "You made a pizza!",
}
VOICES = {"voice-a": ("af_heart", 0.85), "voice-b": ("af_bella", 0.85)}

# Mom script (python make_vo.py mom): Mom narrates next to her daughter; Pipa the hedgehog tastes at the end.
# Spoken text may differ from the script only by punctuation, used to steer Kokoro's intonation.
MOM_LINES = {
    "vo-welcome": "Let's cook together!",
    "vo-pick-pizza": "Let's make a pizza!",
    "vo-watch-me": "Watch me first!",
    "vo-your-turn": "Now, you try!",
    "vo-roll": "Let's roll the dough!",
    "vo-sauce": "Now spread the sauce!",
    "vo-cheese": "Sprinkle the cheese!",
    "vo-toppings": "Put on anything you like!",
    "vo-done-hint": "Tap here when you're done!",
    "vo-oven": "Into the oven it goes!",
    "vo-baking": "Look, it's baking!",
    "vo-ready": "Ding! It's ready!",
    "vo-feed": "Let's give Pipa a taste!",
    "vo-help": "Let me help you!",
    "vo-praise-1": "Great job!",
    "vo-praise-2": "Wow!",
    "vo-praise-3": "Beautiful!",
    "vo-praise-4": "Yummy!",
    "vo-praise-5": "I love it!",
    "vo-praise-6": "You worked so hard!",
    "vo-praise-7": "I love how you did that!",
    "vo-finale": "We made a pizza together!",
    "vo-bye": "That was fun! Bye bye!",
    # Prep steps (added 2026-09-19; Voice A only: python make_vo.py mom-a)
    "vo-hello": "Hi! I'm so happy to cook with you today!",
    "vo-what-make": "What shall we make today?",
    "vo-wash": "First, let's wash our hands!",
    "vo-wash-rub": "Rub, rub, rub!",
    "vo-wash-done": "All clean!",
    "vo-knead": "Let's squish the dough!",
    "vo-crush": "Squish the tomatoes!",
    "vo-stir": "Now stir it all around!",
    "vo-grate": "Let's grate the cheese!",
    "vo-choose": "Pick three toppings you like!",
    "vo-cut": "Let's cut it together!",
    "vo-cut-careful": "Nice and slow. Careful fingers!",
    "vo-open-can": "Let's open the can!",
    "vo-open-jar": "Let's open the jar!",
    "vo-pour": "Pour it into the bowl!",
    "vo-temp": "Let's set the oven to two hundred!",
    "vo-temp-more": "A little more!",
    "vo-temp-hot": "Oops, too hot! Turn it down a little.",
    "vo-temp-done": "Perfect! Now press start!",
    "vo-mitts": "It's hot! Put on your oven mitts!",
    "vo-share": "Let's share the pizza!",
    "vo-slice-mom": "One for me? Thank you!",
    "vo-mom-yum": "Mmm, delicious!",
    "vo-slice-pipa": "One for Pipa!",
    "vo-photo": "Let's take a picture of your pizza!",
    # Counting while cutting (played in quick succession)
    "count-1": "One!",
    "count-2": "Two!",
    "count-3": "Three!",
    "count-4": "Four!",
    "count-5": "Five!",
    "count-6": "Six!",
    "count-7": "Seven!",
    "count-8": "Eight!",
    "count-9": "Nine!",
    "count-10": "Ten!",
    # Oven temperature (played on every tap of the dial)
    "temp-50": "Fifty!",
    "temp-100": "One hundred!",
    "temp-150": "One hundred fifty!",
    "temp-200": "Two hundred!",
    "temp-250": "Two hundred fifty!",
    # Salad (second recipe, added 2026-09-19; Voice A only: python make_vo.py mom-a <names>)
    "vo-pick-salad": "Let's make a salad!",
    "vo-wash-veg": "Let's wash the vegetables!",
    "vo-wash-veg-done": "Squeaky clean!",
    "vo-tear": "Tear the lettuce into little pieces!",
    "vo-choose-veg": "Pick three vegetables you like!",
    "vo-into-bowl": "Put it all in the bowl!",
    "vo-squeeze": "Squeeze the lemon!",
    "vo-oil": "Pour a little olive oil!",
    "vo-salt": "A tiny pinch of salt!",
    "vo-mix": "Now mix it all up!",
    "vo-serve": "Let's serve the salad!",
    "vo-bowl-mom": "Some for me? Thank you!",
    "vo-bowl-pipa": "Some for Pipa!",
    "vo-fresh": "Mmm, so fresh and crunchy!",
    "vo-photo-salad": "Let's take a picture of your salad!",
    "vo-finale-salad": "We made a salad together!",
    # Ingredient names (said when the child picks one; may cut each other off)
    "name-cucumber": "Cucumber!",
    "name-tomato": "Tomato!",
    "name-pepper": "Pepper!",
    "name-carrot": "Carrot!",
    "name-onion": "Onion!",
    "name-lettuce": "Lettuce!",
    "name-mushroom": "Mushroom!",
    "name-corn": "Corn!",
    "name-olives": "Olives!",
    "name-lemon": "Lemon!",
    # Cookies (third recipe, added 2026-09-19; Voice A only: python make_vo.py mom-a <names>)
    "vo-pick-cookies": "Let's bake cookies!",
    "vo-flour": "Pour in the flour!",
    "vo-sugar": "Now the sugar!",
    "vo-butter": "Drop in the butter!",
    "vo-egg": "Crack the egg! Tap, tap, tap!",
    "vo-stir-dough": "Stir it into dough!",
    "vo-knead-cookies": "Let's squish the cookie dough!",
    "vo-roll-cookies": "Roll it nice and flat!",
    "vo-pick-cutter": "Pick a shape you like!",
    "vo-stamp": "Press it into the dough!",
    "name-star": "A star!",
    "name-heart": "A heart!",
    "name-circle": "A circle!",
    "name-flower": "A flower!",
    "vo-tray": "Onto the baking tray!",
    "vo-temp-150": "Let's set the oven to one hundred fifty!",
    "vo-decorate-cookies": "Decorate them any way you like!",
    "vo-share-cookies": "Let's share the cookies!",
    "vo-cookie-mom": "A cookie for me? Thank you!",
    "vo-cookie-pipa": "A cookie for Pipa!",
    "vo-cookie-yum": "Mmm, so sweet and crumbly!",
    "vo-photo-cookies": "Let's take a picture of your cookies!",
    "vo-finale-cookies": "We made cookies together!",
    # Fruit smoothie (fourth recipe, added 2026-09-19; Voice A only: python make_vo.py mom-a <names>)
    "vo-pick-smoothie": "Let's make a smoothie!",
    "vo-wash-fruit": "Let's wash the fruit!",
    "vo-choose-fruit": "Pick three fruits you like!",
    "name-banana": "Banana!",
    "name-strawberry": "Strawberry!",
    "name-mango": "Mango!",
    "name-kiwi": "Kiwi!",
    "vo-into-blender": "Put it all in the blender!",
    "vo-milk": "Pour in the milk!",
    "vo-lid": "Put the lid on tight!",
    "vo-blend": "Press the big button!",
    "vo-blend-done": "All smooth!",
    "vo-pour-glass": "Pour it into the glasses!",
    "vo-share-smoothie": "Let's share the smoothie!",
    "vo-glass-mom": "A glass for me? Thank you!",
    "vo-glass-pipa": "A glass for Pipa!",
    "vo-smoothie-yum": "Mmm, so fruity and cold!",
    "vo-photo-smoothie": "Let's take a picture of your smoothie!",
    "vo-finale-smoothie": "We made a smoothie together!",
    # Pancakes (fifth recipe, added 2026-09-19; Voice A only: python make_vo.py mom-a <names>)
    "vo-pick-pancakes": "Let's make pancakes!",
    "vo-stir-batter": "Stir the batter nice and smooth!",
    "vo-stove": "Let's turn on the stove!",
    "vo-ladle": "Pour the batter into the pan!",
    "vo-bubbles": "Wait for the bubbles!",
    "vo-flip": "Now flip it! Swipe up!",
    "vo-flip-done": "Whee! Golden brown!",
    "vo-more-pancake": "One more!",
    "vo-decorate-pancakes": "Put on anything you like!",
    "vo-share-pancakes": "Let's share the pancakes!",
    "vo-pancake-mom": "Some for me? Thank you!",
    "vo-pancake-pipa": "Some for Pipa!",
    "vo-pancake-yum": "Mmm, warm and fluffy!",
    "vo-photo-pancakes": "Let's take a picture of your pancakes!",
    "vo-finale-pancakes": "We made pancakes together!",
    # Vegetable soup (sixth recipe, added 2026-09-20; Voice A only: python make_vo.py mom-a <names>)
    "vo-album": "Look at everything we made!",
    "vo-pick-soup": "Let's make vegetable soup!",
    "name-potato": "Potato!",
    "name-zucchini": "Zucchini!",
    "vo-peel": "Let's peel it! Swipe along!",
    "vo-peel-done": "All peeled!",
    "vo-into-pot": "Put it all in the pot!",
    "vo-water": "Pour in the water!",
    "vo-stir-soup": "Stir the soup while it cooks!",
    "vo-soup-ready": "It smells so good!",
    "vo-serve-soup": "Let's serve the soup!",
    "vo-soup-mom": "A bowl for me? Thank you!",
    "vo-soup-pipa": "A bowl for Pipa!",
    "vo-soup-yum": "Mmm, warm and cozy!",
    "vo-photo-soup": "Let's take a picture of your soup!",
    "vo-finale-soup": "We made soup together!",
    # Birthday cake (seventh recipe, added 2026-09-20; Voice A only: python make_vo.py mom-a <names>)
    "vo-pick-cake": "Let's bake a birthday cake!",
    "vo-stir-cake": "Stir the cake batter!",
    "vo-pour-pan": "Pour it into the pan!",
    "vo-pick-frosting": "Pick a frosting color!",
    "name-pink": "Pink!",
    "name-white": "White!",
    "name-chocolate": "Chocolate!",
    "vo-frost": "Spread the frosting all over!",
    "vo-decorate-cake": "Decorate your cake!",
    "vo-candles": "Put on the candles!",
    "vo-wish": "Make a wish and blow out the candles!",
    "vo-blow-more": "Keep blowing!",
    "vo-blown": "Yay! Happy birthday!",
    "vo-share-cake": "Let's share the cake!",
    "vo-cake-mom": "A slice for me? Thank you!",
    "vo-cake-pipa": "A slice for Pipa!",
    "vo-cake-yum": "Mmm, so soft and sweet!",
    "vo-photo-cake": "Let's take a picture of your cake!",
    "vo-finale-cake": "We made a birthday cake together!",
    # Fruit skewers (eighth recipe, added 2026-09-25; the thread step: copy, extend, create a pattern)
    "vo-pick-skewers": "Fruit skewers! Yummy!",
    "vo-thread": "Let's slide the fruit onto the stick!",
    "vo-copy": "Look at mine! Can you make one just like it?",
    "vo-same": "Just like mine!",
    "vo-next": "What comes next?",
    "vo-pattern": "You found the pattern!",
    "vo-new-pattern": "Ooh! A brand new pattern!",
    "vo-own": "Now make your very own!",
    "vo-share-skewers": "Let's share our fruit skewers!",
    "vo-skewer-mom": "A skewer for me? Thank you!",
    "vo-skewer-pipa": "One for Pipa!",
    "vo-skewer-yum": "Mmm, so juicy!",
    "vo-photo-skewers": "Let's take a picture of our fruit skewers!",
    "vo-finale-skewers": "We made fruit skewers together!",
}
SUFFIX = ""
if len(sys.argv) > 1 and sys.argv[1] in ("mom", "mom-a"):
    if sys.argv[1] == "mom-a":  # Voice A (af_heart) only
        VOICES = {"voice-a": VOICES["voice-a"]}
    LINES, SUFFIX = MOM_LINES, "-mom"
    if len(sys.argv) > 2:  # regenerate only the named lines, e.g. make_vo.py mom vo-bye vo-praise-7
        LINES = {k: v for k, v in LINES.items() if k in sys.argv[2:]}
TARGET_LUFS = -18.0
PEAK_LIMIT = 10 ** (-1.5 / 20)

def trim(x, sr, thresh_db=-42, pre=0.02, post=0.06):
    env = np.abs(x)
    win = int(0.01 * sr)
    env = np.convolve(env, np.ones(win) / win, mode="same")
    thr = env.max() * 10 ** (thresh_db / 20)
    idx = np.where(env > thr)[0]
    a = max(0, idx[0] - int(pre * sr)); b = min(len(x), idx[-1] + int(post * sr))
    y = x[a:b].copy()
    fi, fo = int(0.005 * sr), int(0.04 * sr)
    y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
    return y

def loudness(y, sr):
    meter = pyln.Meter(sr, block_size=min(0.4, len(y) / sr * 0.9))
    return meter.integrated_loudness(np.concatenate([y, y, y]))  # tile very short clips for stable gating

kok = Kokoro(str(ROOT / "tools/kokoro/kokoro-v1.0.onnx"), str(ROOT / "tools/kokoro/voices-v1.0.bin"))
report = []
for folder, (voice, speed) in VOICES.items():
    folder += SUFFIX
    (ROOT / folder).mkdir(exist_ok=True)
    for name, text in LINES.items():
        audio, sr = kok.create(text, voice=voice, speed=speed, lang="en-us")
        audio = np.asarray(audio, dtype=np.float64)
        sf.write(ROOT / f"work/vo/{folder}-{name}-raw.wav", audio, sr)
        y = trim(audio, sr)
        gain = 10 ** ((TARGET_LUFS - loudness(y, sr)) / 20)
        y = y * gain
        pk = np.abs(y).max()
        if pk > PEAK_LIMIT:
            y *= PEAK_LIMIT / pk
        wav = ROOT / f"work/vo/{folder}-{name}.wav"
        sf.write(wav, y, sr, subtype="PCM_16")
        out = ROOT / folder / f"{name}.ogg"
        subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libvorbis", "-q:a", "3", "-ac", "1", str(out)], check=True)
        report.append((folder, name, round(len(y) / sr, 2), round(loudness(y, sr), 1), out.stat().st_size))
        print(report[-1], flush=True)
rep_path = ROOT / f"work/vo/report{SUFFIX}.json"
old = json.load(open(rep_path)) if rep_path.exists() and len(sys.argv) > 2 else []
done = {(f, n) for f, n, *_ in report}
report = [r for r in old if (r[0], r[1]) not in done] + [[f, n, d, float(l), z] for f, n, d, l, z in report]
json.dump(report, open(rep_path, "w"), indent=1)

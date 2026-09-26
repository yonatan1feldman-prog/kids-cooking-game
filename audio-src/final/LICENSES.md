# Licenses: final/

This file covers only the files in this folder. Every file is either CC0 1.0 (public domain dedication; no attribution required, credited anyway) or narration generated locally with an Apache-2.0 model.

## voice/ (181 files)

- **Source:** generated locally with **Kokoro-82M** v1.0 (https://huggingface.co/hexgrad/Kokoro-82M), ONNX build from https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0.
- **License:** the model weights are Apache-2.0. The model was trained only on permissive or non-copyrighted audio. The generated audio contains no third-party recordings.
- **Voice and processing:** `af_heart` (American English female), speed 0.85. Silence trimmed at -42 dB relative to peak (20 ms kept before the start, 60 ms after the end), 5 ms fade-in, 40 ms fade-out. Loudness -18 LUFS with a -1.5 dBFS peak cap. Mono, 24 kHz, OGG Vorbis q3.
- **Spoken text:** matches the script word for word, except for an added comma in "Now, you try!". "Pipa" is pronounced PEE-pa.
- **Prep steps (added 2026-09-19):** 40 more lines (25 `vo-*` prep-step lines, `count-1`..`count-10`, `temp-50`..`temp-250`), same engine, voice, speed and processing. A check run reproduced the existing raw audio of vo-bye and vo-praise-1 exactly (difference below 16-bit rounding), so the new lines match the old ones.
- **Targeted fix (2026-09-19, approved): `scripts/fix_vo.py`. vo-temp-more: gentle soft limiter on its one sharp peak (max 2.96 dB), then -18 LUFS (was -20.7). count-2, count-5, count-7, temp-50: start cut just before the opening consonant (3 ms fade-in, 20 ms silence in front), which removes a short voiced "uh" the engine added before the word. Second approved round: count-6 uses the clean cut (start before the "s", end 3 ms after the final "s" with an 8 ms fade-out), padded with silence to 0.55 s, then -18 LUFS. count-5 and temp-50 got the same soft limiter and normalization as vo-temp-more (max 0.9-1.0 dB), which brings them to the level of the other count/temp files. Originals are kept in `work/vo/pre-fix/`.**
- **Salad (added 2026-09-19):** 26 more lines (16 `vo-*` salad lines and 10 `name-*` ingredient names), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_salad.py`, reusing fix_vo.py's functions):** name-carrot and name-pepper had the same voiced "uh" before the opening consonant as the count files, name-onion a short breathy noise before the vowel (the speech recognizer, limited to the ten ingredient words, heard `[unk]`), and name-corn a short blip before the "k". All four: start cut just before the word (3 ms fade-in, 20 ms silence in front), then -18 LUFS. After the fix the limited recognizer hears each word at confidence 1.0. vo-oil and vo-into-bowl: one sharp peak held them at -21.8 / -19.5 LUFS; the same soft limiter as vo-temp-more (max 4.2 / 1.8 dB), then -18 LUFS. Originals are kept in `work/vo/pre-fix-salad/`.

- **Cookies (added 2026-09-19):** 23 more lines (19 `vo-*` cookie lines and 4 `name-*` cookie-cutter shapes), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_cookies.py`, reusing fix_vo.py's functions):** vo-egg had a short voiced "uh" before "Crack" (tight start cut at the "k"); vo-flour and vo-butter a breathy exhale after the last word (end cut into the noise, 25 ms fade-out); vo-decorate-cookies, vo-photo-cookies, vo-cookie-mom, vo-temp-150 and vo-pick-cookies hit the peak cap first (-22.6 to -18.6 LUFS) and got the same gentle soft limiter as vo-temp-more, then -18 LUFS; name-heart was regenerated as "A heart!!" (same phonemes, punctuation only) because the speech recognizer heard an extra "a". After the fixes the speech recognizer hears every line as written ("flour" as its homophone "flower"; "Pipa" is not in its vocabulary).
- **Fruit smoothie (added 2026-09-19):** 19 more lines (15 `vo-*` smoothie lines and 4 `name-*` fruit names), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_smoothie.py`, a copy of fix_vo_cookies.py reusing the same functions):** name-banana had a voiced "uh" before the "b" (the speech recognizer heard "the banana"): start cut at the "b" (3 ms fade-in, 20 ms silence in front); name-kiwi had a faint noise (-33 dB) before the "k": the same start cut; vo-into-blender had a breathy exhale after "blender" (end cut into the noise, 25 ms fade-out, as vo-flour) and, with vo-pick-smoothie, vo-smoothie-yum and vo-photo-smoothie, hit the peak cap first (-20.3 to -18.7 LUFS): the same gentle soft limiter as vo-temp-more (max 0.5-2.7 dB), then -18 LUFS. After the fixes the speech recognizer hears every sentence as written ("pour" as its homophone "poor"; "Pipa" is not in its vocabulary), and, limited to the four fruit names as for the salad names, each name at confidence 1.0.
- **Pancakes (added 2026-09-19):** 15 more `vo-*` lines, same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_pancakes.py`, a copy of fix_vo_smoothie.py reusing the same functions):** vo-pancake-yum had a breathy hiss before the "Mmm" and an exhale after "fluffy": start cut at the first voiced frame after the hiss (as name-onion) and end cut into the exhale (25 ms fade-out, as vo-flour); vo-flip-done and vo-more-pancake had a breathy exhale after the last word: the same end cut; vo-ladle, vo-pick-pancakes, vo-photo-pancakes, vo-share-pancakes and vo-pancake-mom hit the peak cap first (-20.4 to -18.3 LUFS): the same gentle soft limiter as vo-temp-more (max 0.7-2.8 dB), then -18 LUFS. After the fixes the speech recognizer hears every line as written ("Whee" as its homophone "we").
- **Vegetable soup (added 2026-09-20):** 16 more lines (14 `vo-*` soup lines, `vo-album` for the recipe album, and 2 `name-*` vegetable names), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_soup.py`, a copy of fix_vo_pancakes.py reusing the same functions):** name-zucchini had a loud voiced "uh" before the "z" (-8.6 dB under the peak; the free recognizer heard "is that kieny"): start cut at the "z" (3 ms fade-in, 20 ms silence in front, as name-carrot) plus the gentle soft limiter (1.8 dB), then -18 LUFS (was -19.1); vo-stir-soup had the same "uh" before the "st" (-7.2 dB; the recognizer heard "esther the soup"): the same start cut, then -18 LUFS; vo-water had a breathy exhale after "water" (the recognizer heard "waters"): end cut 5 ms into the exhale with a 25 ms fade-out, as vo-flour; vo-album, vo-peel and vo-photo-soup hit the -1.5 dBFS peak cap first (-20.0 to -19.0 LUFS): the same gentle soft limiter as vo-temp-more (max 1.5-2.4 dB), then -18 LUFS. After the fixes the speech recognizer hears every sentence as written ("pour" as its homophone "poor"; "Pipa" is not in its vocabulary; "bowl" comes out as "ball", and "All peeled!" as "oh peeled", the same substitution the recognizer already makes on the shipped vo-wash-done, "All clean!"), and, limited to the two vegetable names as for the salad names, each name at confidence 1.0. A tail cut on vo-peel-done was tried and rejected: the noise after "peeled" is the "d" release, and cutting it lost the word. Originals are kept in `work/vo/pre-fix-soup/`.
- **Birthday cake (added 2026-09-20):** 19 more lines (16 `vo-*` cake lines and 3 `name-*` frosting colours), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_cake.py`, a copy of fix_vo_soup.py reusing the same functions):** name-pink and name-chocolate had a loud voiced "uh" before the opening consonant (-4.4 / -2.7 dB under the peak; the free recognizer heard "the tank" / "a chocolate"): start cut at the "p" / "ch" (3 ms fade-in, 20 ms silence in front, as name-carrot), then -18 LUFS; vo-pick-frosting had a fainter version of the same noise before the "p" (-14.2 dB): the same start cut, which raised the recognizer's confidence on "pick" from 0.64 to 0.81; vo-pour-pan had a breathy exhale after "pan" (the recognizer heard "pans"): end cut 5 ms into the exhale with a 25 ms fade-out, as vo-flour, after which it hears "pan" at 1.0; vo-decorate-cake, vo-photo-cake and vo-cake-pipa hit the -1.5 dBFS peak cap first (-19.0 / -18.6 / -18.2 LUFS): the same gentle soft limiter as vo-temp-more (max 1.3 / 1.1 / 0.6 dB), then -18 LUFS. After the fixes the speech recognizer hears every sentence as written ("Yay!" as its homophone "yea"; "Pipa" is not in its vocabulary, and it runs "A slice" together as "as slice", exactly as it does on the shipped vo-glass-mom / vo-cookie-mom lines), and, limited to the three frosting colours as for the salad names, each colour at confidence 1.0. The other 12 lines measured clean and were not changed. Originals of the changed lines are in `work/vo/pre-fix-cake/`.
- **Fruit skewers (added 2026-09-25, in a cloud session with the pinned packages of AGENTS.md):** 14 more `vo-*` lines, same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_skewers.py`, the fix_vo.py functions unchanged):** vo-skewer-mom, vo-skewer-yum and vo-photo-skewers hit the -1.5 dBFS peak cap first (-18.5 / -19.2 / -18.6 LUFS): the gentle soft limiter of vo-temp-more (0.45 / 1.56 / 0.83 dB), then -18 LUFS. vo-new-pattern was first generated as "Ooh, a brand new pattern!" and came out at -22.9 LUFS (the "Ooh" took the peak); written "Ooh! A brand new pattern!" it is -18.0. The speech-recognizer check of earlier rounds was not run: its model download was blocked in the cloud session. Originals of the limited lines are in `work/vo/pre-fix-skewers/`.
| file | text | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|
| voice/vo-welcome.ogg | Let's cook together! | 1.25 | -18.0 | 11773 |
| voice/vo-pick-pizza.ogg | Let's make a pizza! | 1.37 | -18.0 | 11780 |
| voice/vo-watch-me.ogg | Watch me first! | 1.18 | -18.0 | 10337 |
| voice/vo-your-turn.ogg | Now you try! | 1.11 | -18.0 | 9970 |
| voice/vo-roll.ogg | Let's roll the dough! | 1.22 | -18.3 | 11113 |
| voice/vo-sauce.ogg | Now spread the sauce! | 1.34 | -18.0 | 11683 |
| voice/vo-cheese.ogg | Sprinkle the cheese! | 1.28 | -18.7 | 11329 |
| voice/vo-toppings.ogg | Put on anything you like! | 1.58 | -18.0 | 12979 |
| voice/vo-done-hint.ogg | Tap here when you're done! | 1.31 | -18.0 | 11078 |
| voice/vo-oven.ogg | Into the oven it goes! | 1.49 | -18.8 | 12591 |
| voice/vo-baking.ogg | Look, it's baking! | 1.28 | -18.0 | 11299 |
| voice/vo-ready.ogg | Ding! It's ready! | 1.29 | -18.0 | 11513 |
| voice/vo-feed.ogg | Let's give Pipa a taste! | 1.66 | -19.5 | 13664 |
| voice/vo-help.ogg | Let me help you! | 1.08 | -18.0 | 9858 |
| voice/vo-praise-1.ogg | Great job! | 1.0 | -18.0 | 9389 |
| voice/vo-praise-2.ogg | Wow! | 0.63 | -18.0 | 7114 |
| voice/vo-praise-3.ogg | Beautiful! | 0.86 | -18.0 | 8515 |
| voice/vo-praise-4.ogg | Yummy! | 0.7 | -18.0 | 7581 |
| voice/vo-praise-5.ogg | I love it! | 0.86 | -18.0 | 8746 |
| voice/vo-praise-6.ogg | You worked so hard! | 1.27 | -18.0 | 10826 |
| voice/vo-praise-7.ogg | I love how you did that! | 1.57 | -18.0 | 12796 |
| voice/vo-finale.ogg | We made a pizza together! | 1.53 | -18.0 | 13092 |
| voice/vo-bye.ogg | That was fun! Bye bye! | 1.59 | -18.0 | 12817 |
| voice/vo-hello.ogg | Hi! I'm so happy to cook with you today! | 2.52 | -18.0 | 19000 |
| voice/vo-what-make.ogg | What shall we make today? | 1.38 | -18.0 | 12109 |
| voice/vo-wash.ogg | First, let's wash our hands! | 1.8 | -18.0 | 14419 |
| voice/vo-wash-rub.ogg | Rub, rub, rub! | 1.32 | -18.0 | 11435 |
| voice/vo-wash-done.ogg | All clean! | 0.93 | -18.0 | 8956 |
| voice/vo-knead.ogg | Let's squish the dough! | 1.33 | -18.0 | 11565 |
| voice/vo-crush.ogg | Squish the tomatoes! | 1.42 | -18.7 | 12318 |
| voice/vo-stir.ogg | Now stir it all around! | 1.48 | -18.0 | 12615 |
| voice/vo-grate.ogg | Let's grate the cheese! | 1.39 | -18.7 | 12081 |
| voice/vo-choose.ogg | Pick three toppings you like! | 1.66 | -18.0 | 13655 |
| voice/vo-cut.ogg | Let's cut it together! | 1.31 | -18.0 | 11648 |
| voice/vo-cut-careful.ogg | Nice and slow. Careful fingers! | 2.45 | -18.0 | 17756 |
| voice/vo-open-can.ogg | Let's open the can! | 1.36 | -18.0 | 11732 |
| voice/vo-open-jar.ogg | Let's open the jar! | 1.4 | -18.0 | 12063 |
| voice/vo-pour.ogg | Pour it into the bowl! | 1.34 | -18.0 | 11930 |
| voice/vo-temp.ogg | Let's set the oven to two hundred! | 1.88 | -18.6 | 14894 |
| voice/vo-temp-more.ogg | A little more! | 0.95 | -18.0 | 8998 |
| voice/vo-temp-hot.ogg | Oops, too hot! Turn it down a little. | 2.29 | -18.0 | 17120 |
| voice/vo-temp-done.ogg | Perfect! Now press start! | 1.66 | -18.0 | 13777 |
| voice/vo-mitts.ogg | It's hot! Put on your oven mitts! | 1.91 | -18.0 | 14792 |
| voice/vo-share.ogg | Let's share the pizza! | 1.33 | -18.0 | 11476 |
| voice/vo-slice-mom.ogg | One for me? Thank you! | 1.63 | -18.8 | 12769 |
| voice/vo-mom-yum.ogg | Mmm, delicious! | 1.35 | -18.0 | 12072 |
| voice/vo-slice-pipa.ogg | One for Pipa! | 1.1 | -18.0 | 10110 |
| voice/vo-photo.ogg | Let's take a picture of your pizza! | 1.98 | -18.8 | 16060 |
| voice/count-1.ogg | One! | 0.63 | -18.0 | 7060 |
| voice/count-2.ogg | Two! | 0.55 | -18.0 | 6503 |
| voice/count-3.ogg | Three! | 0.69 | -18.0 | 7542 |
| voice/count-4.ogg | Four! | 0.66 | -18.0 | 7200 |
| voice/count-5.ogg | Five! | 0.67 | -18.0 | 7298 |
| voice/count-6.ogg | Six! | 0.55 | -18.0 | 6187 |
| voice/count-7.ogg | Seven! | 0.59 | -18.0 | 6929 |
| voice/count-8.ogg | Eight! | 0.68 | -18.0 | 7384 |
| voice/count-9.ogg | Nine! | 0.72 | -18.0 | 7754 |
| voice/count-10.ogg | Ten! | 0.63 | -18.0 | 7016 |
| voice/temp-50.ogg | Fifty! | 0.69 | -18.0 | 7552 |
| voice/temp-100.ogg | One hundred! | 0.97 | -18.0 | 9044 |
| voice/temp-150.ogg | One hundred fifty! | 1.38 | -18.0 | 12172 |
| voice/temp-200.ogg | Two hundred! | 0.93 | -18.0 | 9027 |
| voice/temp-250.ogg | Two hundred fifty! | 1.28 | -18.0 | 11339 |
| voice/vo-pick-salad.ogg | Let's make a salad! | 1.31 | -18.0 | 11508 |
| voice/vo-wash-veg.ogg | Let's wash the vegetables! | 1.72 | -18.7 | 14049 |
| voice/vo-wash-veg-done.ogg | Squeaky clean! | 1.08 | -18.0 | 10230 |
| voice/vo-tear.ogg | Tear the lettuce into little pieces! | 1.98 | -18.0 | 15452 |
| voice/vo-choose-veg.ogg | Pick three vegetables you like! | 1.82 | -18.0 | 14281 |
| voice/vo-into-bowl.ogg | Put it all in the bowl! | 1.31 | -18.0 | 11405 |
| voice/vo-squeeze.ogg | Squeeze the lemon! | 1.12 | -18.0 | 10571 |
| voice/vo-oil.ogg | Pour a little olive oil! | 1.47 | -18.0 | 12303 |
| voice/vo-salt.ogg | A tiny pinch of salt! | 1.55 | -18.0 | 12791 |
| voice/vo-mix.ogg | Now mix it all up! | 1.33 | -18.0 | 11287 |
| voice/vo-serve.ogg | Let's serve the salad! | 1.36 | -18.0 | 12314 |
| voice/vo-bowl-mom.ogg | Some for me? Thank you! | 1.65 | -18.5 | 13045 |
| voice/vo-bowl-pipa.ogg | Some for Pipa! | 1.13 | -18.0 | 10367 |
| voice/vo-fresh.ogg | Mmm, so fresh and crunchy! | 2.09 | -18.1 | 15880 |
| voice/vo-photo-salad.ogg | Let's take a picture of your salad! | 1.92 | -18.4 | 15760 |
| voice/vo-finale-salad.ogg | We made a salad together! | 1.41 | -18.0 | 12231 |
| voice/name-cucumber.ogg | Cucumber! | 0.85 | -18.3 | 8604 |
| voice/name-tomato.ogg | Tomato! | 0.85 | -18.0 | 8330 |
| voice/name-pepper.ogg | Pepper! | 0.68 | -18.0 | 7400 |
| voice/name-carrot.ogg | Carrot! | 0.64 | -18.0 | 7047 |
| voice/name-onion.ogg | Onion! | 0.65 | -18.0 | 7362 |
| voice/name-lettuce.ogg | Lettuce! | 0.78 | -18.0 | 7890 |
| voice/name-mushroom.ogg | Mushroom! | 0.87 | -18.0 | 8439 |
| voice/name-corn.ogg | Corn! | 0.66 | -18.0 | 7113 |
| voice/name-olives.ogg | Olives! | 0.78 | -18.0 | 7756 |
| voice/name-lemon.ogg | Lemon! | 0.7 | -18.0 | 7747 |
| voice/vo-pick-cookies.ogg | Let's bake cookies! | 1.36 | -18.0 | 11739 |
| voice/vo-flour.ogg | Pour in the flour! | 1.04 | -18.0 | 9804 |
| voice/vo-sugar.ogg | Now the sugar! | 1.03 | -18.0 | 9705 |
| voice/vo-butter.ogg | Drop in the butter! | 1.03 | -18.0 | 9998 |
| voice/vo-egg.ogg | Crack the egg! Tap, tap, tap! | 2.1 | -18.0 | 15814 |
| voice/vo-stir-dough.ogg | Stir it into dough! | 1.27 | -18.0 | 11213 |
| voice/vo-knead-cookies.ogg | Let's squish the cookie dough! | 1.56 | -18.0 | 12896 |
| voice/vo-roll-cookies.ogg | Roll it nice and flat! | 1.5 | -18.0 | 12335 |
| voice/vo-pick-cutter.ogg | Pick a shape you like! | 1.33 | -18.0 | 11321 |
| voice/vo-stamp.ogg | Press it into the dough! | 1.4 | -18.0 | 11999 |
| voice/name-star.ogg | A star! | 0.82 | -18.0 | 8433 |
| voice/name-heart.ogg | A heart! | 0.86 | -18.0 | 8359 |
| voice/name-circle.ogg | A circle! | 0.83 | -18.0 | 8431 |
| voice/name-flower.ogg | A flower! | 0.87 | -18.0 | 8310 |
| voice/vo-tray.ogg | Onto the baking tray! | 1.46 | -18.0 | 12176 |
| voice/vo-temp-150.ogg | Let's set the oven to one hundred fifty! | 2.35 | -18.0 | 18240 |
| voice/vo-decorate-cookies.ogg | Decorate them any way you like! | 2.07 | -18.0 | 15789 |
| voice/vo-share-cookies.ogg | Let's share the cookies! | 1.37 | -18.2 | 11780 |
| voice/vo-cookie-mom.ogg | A cookie for me? Thank you! | 1.76 | -18.0 | 13707 |
| voice/vo-cookie-pipa.ogg | A cookie for Pipa! | 1.28 | -18.4 | 11138 |
| voice/vo-cookie-yum.ogg | Mmm, so sweet and crumbly! | 2.15 | -18.7 | 17184 |
| voice/vo-photo-cookies.ogg | Let's take a picture of your cookies! | 1.98 | -18.0 | 15657 |
| voice/vo-finale-cookies.ogg | We made cookies together! | 1.49 | -18.0 | 12648 |
| voice/vo-pick-smoothie.ogg | Let's make a smoothie! | 1.33 | -18.0 | 11825 |
| voice/vo-wash-fruit.ogg | Let's wash the fruit! | 1.35 | -18.0 | 11680 |
| voice/vo-choose-fruit.ogg | Pick three fruits you like! | 1.56 | -18.0 | 12757 |
| voice/name-banana.ogg | Banana! | 0.7 | -18.0 | 7525 |
| voice/name-strawberry.ogg | Strawberry! | 0.84 | -18.0 | 8468 |
| voice/name-mango.ogg | Mango! | 0.83 | -18.0 | 8283 |
| voice/name-kiwi.ogg | Kiwi! | 0.71 | -18.0 | 7346 |
| voice/vo-into-blender.ogg | Put it all in the blender! | 1.26 | -18.0 | 12084 |
| voice/vo-milk.ogg | Pour in the milk! | 1.12 | -18.0 | 10294 |
| voice/vo-lid.ogg | Put the lid on tight! | 1.34 | -18.0 | 11602 |
| voice/vo-blend.ogg | Press the big button! | 1.3 | -18.0 | 11652 |
| voice/vo-blend-done.ogg | All smooth! | 0.97 | -18.0 | 9331 |
| voice/vo-pour-glass.ogg | Pour it into the glasses! | 1.56 | -18.0 | 12997 |
| voice/vo-share-smoothie.ogg | Let's share the smoothie! | 1.35 | -18.0 | 12038 |
| voice/vo-glass-mom.ogg | A glass for me? Thank you! | 1.76 | -18.0 | 13912 |
| voice/vo-glass-pipa.ogg | A glass for Pipa! | 1.25 | -18.0 | 11124 |
| voice/vo-smoothie-yum.ogg | Mmm, so fruity and cold! | 2.14 | -18.0 | 16587 |
| voice/vo-photo-smoothie.ogg | Let's take a picture of your smoothie! | 1.96 | -18.0 | 16158 |
| voice/vo-finale-smoothie.ogg | We made a smoothie together! | 1.46 | -18.0 | 12684 |
| voice/vo-pick-pancakes.ogg | Let's make pancakes! | 1.41 | -18.0 | 12187 |
| voice/vo-stir-batter.ogg | Stir the batter nice and smooth! | 1.79 | -18.0 | 14669 |
| voice/vo-stove.ogg | Let's turn on the stove! | 1.5 | -18.0 | 12584 |
| voice/vo-ladle.ogg | Pour the batter into the pan! | 1.64 | -18.0 | 13317 |
| voice/vo-bubbles.ogg | Wait for the bubbles! | 1.28 | -18.0 | 11430 |
| voice/vo-flip.ogg | Now flip it! Swipe up! | 1.72 | -18.3 | 13565 |
| voice/vo-flip-done.ogg | Whee! Golden brown! | 1.26 | -18.0 | 10930 |
| voice/vo-more-pancake.ogg | One more! | 0.71 | -18.0 | 7700 |
| voice/vo-decorate-pancakes.ogg | Put on anything you like! | 1.58 | -18.0 | 12979 |
| voice/vo-share-pancakes.ogg | Let's share the pancakes! | 1.46 | -18.0 | 12215 |
| voice/vo-pancake-mom.ogg | Some for me? Thank you! | 1.65 | -18.0 | 13081 |
| voice/vo-pancake-pipa.ogg | Some for Pipa! | 1.13 | -18.0 | 10367 |
| voice/vo-pancake-yum.ogg | Mmm, warm and fluffy! | 1.71 | -18.0 | 13851 |
| voice/vo-photo-pancakes.ogg | Let's take a picture of your pancakes! | 2.09 | -18.0 | 16193 |
| voice/vo-finale-pancakes.ogg | We made pancakes together! | 1.66 | -18.0 | 13473 |
| voice/vo-album.ogg | Look at everything we made! | 1.62 | -18.0 | 13283 |
| voice/vo-pick-soup.ogg | Let's make vegetable soup! | 1.79 | -18.4 | 14518 |
| voice/name-potato.ogg | Potato! | 0.87 | -18.0 | 8411 |
| voice/name-zucchini.ogg | Zucchini! | 0.82 | -18.0 | 8257 |
| voice/vo-peel.ogg | Let's peel it! Swipe along! | 1.93 | -18.0 | 14964 |
| voice/vo-peel-done.ogg | All peeled! | 0.95 | -18.0 | 9129 |
| voice/vo-into-pot.ogg | Put it all in the pot! | 1.37 | -18.0 | 11866 |
| voice/vo-water.ogg | Pour in the water! | 0.92 | -18.0 | 8879 |
| voice/vo-stir-soup.ogg | Stir the soup while it cooks! | 1.45 | -18.0 | 12010 |
| voice/vo-soup-ready.ogg | It smells so good! | 1.26 | -18.0 | 11194 |
| voice/vo-serve-soup.ogg | Let's serve the soup! | 1.28 | -18.0 | 11337 |
| voice/vo-soup-mom.ogg | A bowl for me? Thank you! | 1.75 | -18.3 | 13782 |
| voice/vo-soup-pipa.ogg | A bowl for Pipa! | 1.25 | -18.0 | 10775 |
| voice/vo-soup-yum.ogg | Mmm, warm and cozy! | 1.94 | -18.0 | 14838 |
| voice/vo-photo-soup.ogg | Let's take a picture of your soup! | 1.81 | -18.0 | 14300 |
| voice/vo-finale-soup.ogg | We made soup together! | 1.36 | -18.0 | 11809 |
| voice/vo-pick-cake.ogg | Let's bake a birthday cake! | 1.65 | -18.0 | 13464 |
| voice/vo-stir-cake.ogg | Stir the cake batter! | 1.27 | -18.0 | 11392 |
| voice/vo-pour-pan.ogg | Pour it into the pan! | 1.25 | -18.0 | 11193 |
| voice/vo-pick-frosting.ogg | Pick a frosting color! | 1.39 | -18.0 | 12042 |
| voice/name-pink.ogg | Pink! | 0.6 | -18.0 | 6932 |
| voice/name-white.ogg | White! | 0.71 | -18.0 | 7612 |
| voice/name-chocolate.ogg | Chocolate! | 0.75 | -18.0 | 7731 |
| voice/vo-frost.ogg | Spread the frosting all over! | 1.73 | -18.0 | 14305 |
| voice/vo-decorate-cake.ogg | Decorate your cake! | 1.19 | -18.0 | 10666 |
| voice/vo-candles.ogg | Put on the candles! | 1.21 | -18.0 | 10647 |
| voice/vo-wish.ogg | Make a wish and blow out the candles! | 2.15 | -18.0 | 16400 |
| voice/vo-blow-more.ogg | Keep blowing! | 0.98 | -18.0 | 9185 |
| voice/vo-blown.ogg | Yay! Happy birthday! | 1.41 | -18.0 | 11874 |
| voice/vo-share-cake.ogg | Let's share the cake! | 1.22 | -18.0 | 10664 |
| voice/vo-cake-mom.ogg | A slice for me? Thank you! | 1.79 | -18.0 | 13840 |
| voice/vo-cake-pipa.ogg | A slice for Pipa! | 1.3 | -18.0 | 11155 |
| voice/vo-cake-yum.ogg | Mmm, so soft and sweet! | 2.07 | -18.0 | 16128 |
| voice/vo-photo-cake.ogg | Let's take a picture of your cake! | 1.82 | -18.0 | 14350 |
| voice/vo-finale-cake.ogg | We made a birthday cake together! | 1.72 | -18.0 | 14668 |
| voice/vo-pick-skewers.ogg | Fruit skewers! Yummy! | 1.53 | -17.8 | 12783 |
| voice/vo-thread.ogg | Let's slide the fruit onto the stick! | 1.84 | -17.7 | 14603 |
| voice/vo-copy.ogg | Look at mine! Can you make one just like it? | 2.65 | -17.8 | 19565 |
| voice/vo-same.ogg | Just like mine! | 1.13 | -17.8 | 10173 |
| voice/vo-next.ogg | What comes next? | 1.17 | -17.8 | 10709 |
| voice/vo-pattern.ogg | You found the pattern! | 1.32 | -17.9 | 11737 |
| voice/vo-new-pattern.ogg | Ooh! A brand new pattern! | 1.69 | -17.9 | 13332 |
| voice/vo-own.ogg | Now make your very own! | 1.45 | -18.0 | 12549 |
| voice/vo-share-skewers.ogg | Let's share our fruit skewers! | 1.56 | -17.9 | 12838 |
| voice/vo-skewer-mom.ogg | A skewer for me? Thank you! | 1.79 | -17.7 | 13690 |
| voice/vo-skewer-pipa.ogg | One for Pipa! | 1.10 | -17.9 | 10161 |
| voice/vo-skewer-yum.ogg | Mmm, so juicy! | 1.43 | -17.5 | 11439 |
| voice/vo-photo-skewers.ogg | Let's take a picture of our fruit skewers! | 2.17 | -17.5 | 16360 |
| voice/vo-finale-skewers.ogg | We made fruit skewers together! | 1.69 | -17.8 | 14198 |
| voice/vo-pipa-wants.ogg | Look! Pipa wants... | 1.39 | -18.0 | 11896 |
| voice/vo-pipa-got-it.ogg | Just what Pipa wanted! | 1.56 | -18.0 | 12815 |
| voice/vo-pipa-loves.ogg | Pipa loves it! | 1.10 | -18.0 | 10120 |
| voice/vo-bless-you.ogg | Bless you, Pipa! | 1.14 | -18.0 | 10188 |
| voice/vo-guest-who.ogg | Who's coming to eat with us? | 1.60 | -18.0 | 13291 |
| voice/vo-pipa-brought.ogg | Pipa brought a friend! | 1.32 | -18.0 | 11356 |
| voice/vo-guest-giraffe.ogg | Look, Giraffe is here! | 1.46 | -18.0 | 12045 |
| voice/vo-guest-turtle.ogg | Look, Turtle is here! | 1.33 | -18.0 | 11348 |
| voice/vo-guest-penguin.ogg | Look, Penguin is here! | 1.41 | -18.0 | 11898 |
| voice/vo-for-giraffe.ogg | Some for Giraffe! | 1.20 | -18.0 | 10406 |
| voice/vo-for-turtle.ogg | Some for Turtle! | 1.10 | -18.0 | 10212 |
| voice/vo-for-penguin.ogg | Some for Penguin! | 1.17 | -18.0 | 10710 |
| voice/vo-giraffe-loves.ogg | Giraffe loves green food! | 1.72 | -18.0 | 14003 |
| voice/vo-turtle-loves.ogg | Turtle loves it! | 1.11 | -18.0 | 10244 |
| voice/vo-penguin-loves.ogg | Penguin loves it! | 1.16 | -18.0 | 10591 |
| voice/vo-turtle-nap.ogg | Shh! Turtle is having a little nap. | 2.58 | -20.2 | 18605 |
| voice/vo-bless-penguin.ogg | Bless you, Penguin! | 1.17 | -19.0 | 10182 |
| voice/vo-pull-out.ogg | Now pull it out, nice and slow! | 2.03 | -18.0 | 15350 |
| voice/vo-cut-slices.ogg | Let's cut it into slices! | 1.71 | -18.4 | 13820 |
| voice/vo-puzzle.ogg | Let's make a puzzle from your picture! | 1.93 | -18.0 | 15119 |
| voice/vo-puzzle-done.ogg | You put it all together! | 1.38 | -18.0 | 12389 |
| voice/vo-find-grater.ogg | Which one is the grater? Can you find it? | 2.55 | -18.2 | 18806 |
| voice/vo-find-pin.ogg | Which one is the rolling pin? Can you find it? | 2.79 | -19.1 | 19730 |
| voice/vo-find-spoon.ogg | Which one is the wooden spoon? Can you find it? | 2.83 | -19.0 | 20787 |
| voice/name-grater.ogg | Grater! | 0.78 | -18.0 | 8026 |
| voice/name-rolling-pin.ogg | Rolling pin! | 0.99 | -18.7 | 9043 |
| voice/name-spoon.ogg | Spoon! | 0.77 | -18.0 | 8115 |
| voice/name-whisk.ogg | Whisk! | 0.66 | -18.0 | 7344 |
| voice/name-spatula.ogg | Spatula! | 0.88 | -18.0 | 8722 |
| voice/vo-pipa-order.ogg | Look! Pipa wants two things, in order. First... | 2.82 | -19.8 | 20439 |
| voice/vo-then.ogg | and then... | 0.77 | -18.0 | 8149 |
| voice/vo-first-this.ogg | Pipa wants this one first! | 1.77 | -18.0 | 14155 |
| voice/vo-stir-arrow.ogg | Stir round and round, the way the arrow goes! | 2.83 | -18.0 | 20780 |
| voice/vo-other-way.ogg | Now stir the other way! | 1.43 | -20.0 | 12420 |

## music/ (1 file)

`music-main.ogg` is `music-1.ogg` from the sound pack, renamed. Details:

| target file | title | author | source page URL | direct download URL | license (exact) | original file | processing | duration | size bytes | character | seam verification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| music-1.ogg | Cozy Puzzle In-Game 1 | MintoDog | https://opengameart.org/content/cozy-puzzle-in-game-1 | https://opengameart.org/sites/default/files/cozy_puzzle_in-game_1_bpm118.ogg | CC0 (page license field: "CC0") | cozy_puzzle_in-game_1_bpm118.ogg (Vorbis 44.1k stereo, 130.17 s) | The author labels it loopable. The length is exactly 256 beats at 118 BPM (5,740,475 samples), so no trim or crossfade was needed. Gain -7.89 dB (from -12.1 to -20.0 LUFS). Vorbis q2 (~96 kbps) to stay under 1.5 MB | 130.170 s | 1,477,823 | Gentle bossa-nova "cozy puzzle" tune. Author tags: bossa nova, flute, mallets, saxophone, relax, cozy. 118 BPM. Very steady level (LRA 1.9 LU) | Measured on the decoded OGG: join jump 0.0095, below the 99th-percentile sample step near the seam (0.031). No high-frequency spike at the join (-26 dB vs following 10 ms). Head is 10 dB louder than tail because the loop's downbeat lands on sample 0 |

## sfx/ (34 files)

Each file is candidate no. 1 from `sfx-candidates/`, renamed (e.g. `munch-1.ogg` → `munch.ogg`). The rows below are copied unchanged from the candidate notes, so the first column shows the candidate name.
- **Freesound files:** munch, sprinkle, whoosh and bake use the public, no-login HQ preview. All four source pages were checked live on 2026-09-19 and show Creative Commons 0.
- **OpenGameArt files:** squish, star and complete. Their pages list CC0 only.

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| munch-1.ogg | Apple Bite Quick.wav | RoofDog | https://freesound.org/people/RoofDog/sounds/79240/ | https://cdn.freesound.org/previews/79/79240_1227539-hq.ogg (Freesound HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-01-12 (freesound.org gave HTTP 502 from this network) | 79240 HQ preview, 3.63 s; used 1.55-2.25 s (the main bite at about 1.63 s) | cut 1.55-2.40s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -23.2 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.70 s | 10746 | Studio recording (Sony PCM-D50, close mic) of a quick, crisp apple bite. The background is clean and the attack is sharp. |
| squish-1.ogg | Squish Sounds Effects | ezduzziteh | https://opengameart.org/content/squish-sounds-effects | https://opengameart.org/sites/default/files/squish_01_0.mp3 | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/) | squish_01.mp3 (0.45 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.2 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.30 s | 6379 | A short, soft squish with a very clean background (noise about -87 dB) and little treble. It was made for a bug-squishing game, but the sound is short and not gory. |
| sprinkle-1.ogg | salt shaking.wav | simosco | https://freesound.org/people/simosco/sounds/235561/ | https://cdn.freesound.org/previews/235/235561_4258636-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-02-08 (freesound.org gave HTTP 502 from this network) | 235561 HQ preview (10.5 s, repeated shakes); used 0.50-1.95 s (3 shakes) | cut 0.50-1.95s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 150 Hz; mono 44.1k; loudness -18.0 LUFS, peak -3.3 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.45 s | 17635 | A sea-salt shaker: a light rattle of fine grains. Three quick shakes are about as long as sprinkling cheese. It is bright, but not clipped. |
| whoosh-1.ogg | Woosh | florianreichelt | https://freesound.org/people/florianreichelt/sounds/683096/ | https://cdn.freesound.org/previews/683/683096_6253486-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-07-12 (freesound.org gave HTTP 502 from this network) | 683096 HQ preview (1.72 s); used 0.50-1.45 s (swell and peak) with a 120 ms fade-in | cut 0.50-1.45s; trim silence (thr -40 dB rel. max, 5 ms pre-roll), 120 ms fade-in, 120 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.8 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.95 s | 11079 | A slow, soft air woosh that builds up gradually, with no sharp stick-swing crack. This is the gentlest option for sliding the pizza into the oven. |
| bake-1.ogg | sizzling cooking on stove.mp3 | FartMuffin | https://freesound.org/people/FartMuffin/sounds/575514/ | https://cdn.freesound.org/previews/575/575514_10643288-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-12-20 (freesound.org gave HTTP 502 from this network) | 575514 HQ preview (9.9 s); used 3.0-7.6 s (skips a loud pop at 2.25 s) | seamless loop: 4.0s body, 0.6s equal-power crossfade of tail into head; high-pass 80 Hz; low-pass 9000 Hz; soft peak limiter (max gain reduction 9.9 dB); mono 44.1k; loudness -20.8 LUFS, peak -6.0 dBFS (target -20 LUFS, peak cap -6); OGG Vorbis -q:a 4 | 4.00 s | 40535 | **LOOP.** Food sizzling in a pan, taken from its steadiest part (the level changes by only about ±2 dB). Crackle peaks were softly limited so single pops don't jump out. |
| star-1.ogg | Chimey UI Sounds (Chime_Confirm) | mousebyte | https://opengameart.org/content/chimey-ui-sounds | https://opengameart.org/sites/default/files/mousebyte_chimeyui.7z | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); the page says "No rights reserved, no credit needed"; no license file in the 7z | Chime_Confirm.mp3 from the 7z (1.31 s); whole take | trim silence (thr -50 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; mono 44.1k; loudness -20.0 LUFS, peak -8.0 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.31 s | 10536 | A soft chime with a very clean background. It is medium-bright, so it should not be piercing. |
| complete-1.ogg | Win Jingle (WinVibraphone) | fupi | https://opengameart.org/content/win-jingle | https://opengameart.org/sites/default/files/winjingle.zip | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); no license file in the zip | WinVibraphone.ogg from the zip (3.78 s); cut to 2.8 s with a 300 ms fade-out | trim silence (thr -50 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 300 ms fade-out; mono 44.1k; loudness -20.0 LUFS, peak -6.4 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 2.80 s | 18215 | A short jingle made for 'end of level / job well done', played on a soft vibraphone. It is warm, not brassy. |

### Prep-step sounds (batch 2, added 2026-09-19)

Candidate no. 1 of each, renamed the same way. All ten are Freesound CC0; each license was read live on the sound's own page on 2026-09-19. Downloads are the public HQ previews.

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| chop-1.ogg | Chop on cuttingboard | SunBanana | https://freesound.org/people/SunBanana/sounds/862542/ | https://cdn.freesound.org/previews/862/862542_2530072-hq.ogg (Freesound HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 862542 HQ preview (0.50 s, single chop); whole take, trimmed to start at the chop (about 0.16 s) | trim silence (thr -30 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.6 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.34 s | 6850 | "Me chopping a knife on a cutting board": a single soft chop with a medium-dark tone (centroid about 2.4 kHz) and no clipping. It is already a short one-shot. |
| water-1.ogg | Kitchen Faucet with Water running into the Sink (Take A) | ani_music | https://freesound.org/people/ani_music/sounds/632457/ | https://cdn.freesound.org/previews/632/632457_3008343-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"; the page adds "Sound credit would be nice but not necessary"); page checked live on freesound.org, 2026-09-19 | 632457 HQ preview (31.2 s); used 9.5-13.6 s (the steadiest part: ±0.7 dB) | seamless loop: 3.5s body, 0.5s equal-power crossfade of tail into head; high-pass 100 Hz; low-pass 9000 Hz; soft peak limiter (max gain reduction -0.0 dB); mono 44.1k; loudness -20.0 LUFS, peak -8.1 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 3.50 s | 37852 | **LOOP.** A kitchen tap running into the sink. It is the most even recording found (level std 0.7 dB) and has no clipping. The low-pass takes the edge off the hiss. |
| bubbles-1.ogg | mutliple bubbles bursting | florianreichelt | https://freesound.org/people/florianreichelt/sounds/683100/ | https://cdn.freesound.org/previews/683/683100_6253486-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 683100 HQ preview (1.16 s); whole take (5 bubble pops, 0.05-0.70 s) | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.66 s | 8547 | A quick string of soft, round bubble "bloops" (centroid about 1.3 kHz), with silence in between. Gentle and playful, not hissy. It reads as "bubbly" more than as a real sink. |
| can-open-1.ogg | Opening Can with fizz - Soda / Beer / Pop | MutilatorBCB | https://freesound.org/people/MutilatorBCB/sounds/689705/ | https://cdn.freesound.org/previews/689/689705_1025379-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"; the page adds "Credit ... appreciated but not necessary"); page checked live on freesound.org, 2026-09-19 | 689705 HQ preview (3.5 s); used 1.00-2.00 s (the main "pssht" pop and a short fizz; skips the first tab clicks) | cut 1.00-2.00s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 200 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -18.5 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.79 s | 12189 | A studio recording (Neumann TLM-102) of a pull-tab can opening with fizz. The background is very clean (about -75 dB) and it is not clipped. The classic, easy-to-recognise "can open" sound. |
| jar-open-1.ogg | Opening & closing the lid on a glass jar | randbsoundbites | https://freesound.org/people/randbsoundbites/sounds/829762/ | https://cdn.freesound.org/previews/829/829762_16968183-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"; the page says "Free to use as you see fit"); page checked live on freesound.org, 2026-09-19 | 829762 HQ preview (4.15 s: open at 0.55 s, close at 2.65 s); used 0.50-1.00 s (the opening only) | cut 0.50-1.00s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.35 s | 7259 | A glass-jar lid twisted and lifted off: a short twist and "tock" with a warm tone (centroid about 3.8 kHz). The background is very clean. |
| pour-1.ogg | Cereal Pour.wav | Zeemilo | https://freesound.org/people/Zeemilo/sounds/452378/ | https://cdn.freesound.org/previews/452/452378_9387410-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 452378 HQ preview (10.4 s); used 1.55-3.40 s (the start of the pour: swell, then a full stream) | cut 1.55-3.40s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 300 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.9 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.83 s | 24757 | Cereal poured into a bowl, recorded with a Zoom H4n inside the bowl. The pour starts naturally, the background is quiet (about -63 dB) and the tone is medium (centroid about 5 kHz). |
| grate-1.ogg | carrot-grating-slow-medium-fast | BogumilaMerc | https://freesound.org/people/BogumilaMerc/sounds/835794/ | https://cdn.freesound.org/previews/835/835794_18186550-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 835794 HQ preview (22.1 s: slow, medium, fast); used 0.10-2.05 s (the first 3 slow strokes) | cut 0.10-2.05s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 150 Hz; low-pass 10000 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.6 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.95 s | 19554 | Real grating on a box grater (Zoom H6 + shotgun), with 3 clearly separate strokes and silence between them (background about -73 dB). A carrot rather than cheese, but it is the same "scritch" sound. Low-passed at 10 kHz to soften it. |
| camera-1.ogg | Camera Shutter Snap | SecureSubset | https://freesound.org/people/SecureSubset/sounds/784946/ | https://cdn.freesound.org/previews/784/784946_16752880-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 784946 HQ preview (0.25 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -2.8 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.19 s | 5680 | A compact "ka-chik" shutter snap. It is the least bright of all the shutters found (centroid about 4 kHz), and it is clean and not clipped. |
| click-1.ogg | microwave switch knob click dial select turn satisfying mechanical control foley kitchen zoom-h5 xy-microphone_ | dimapain | https://freesound.org/people/dimapain/sounds/862193/ | https://cdn.freesound.org/previews/862/862193_18051562-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 862193 HQ preview (14.2 s, about 29 knob detents); used 7.26-7.44 s (one clean detent at 7.28 s) | cut 7.26-7.44s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -1.2 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.15 s | 5323 | The detent click of a kitchen appliance (microwave) dial, recorded at 96/24 (Zoom H5). One soft, dull tick (centroid about 3.5 kHz) that suits playing once per dial step. |
| beep-1.ogg | Oven Beeps | trendkill_ivxx | https://freesound.org/people/trendkill_ivxx/sounds/846672/ | https://cdn.freesound.org/previews/846/846672_18514981-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 846672 HQ preview (5.5 s, "my little oven tune"); used 0.24-0.72 s (the first two tones) | cut 0.24-0.72s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 400 Hz; mono 44.1k; loudness -20.0 LUFS, peak -11.9 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.48 s | 8175 | A real oven's two-note beep (about 2.8 kHz, then 2.6 kHz). Each note fades out gently like a small chime instead of cutting off hard, which makes it the softest beep found. The high-pass removes a 120/286 Hz mains hum. What remains of the background is about -45 dB. |

**Missing (no CC0 source found):** none.

### Salad sounds (batch 3, added 2026-09-19)

Candidate no. 1 of each, renamed the same way. Only CC0 sources; each license was read live on the sound's own page on 2026-09-19 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 3).

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| tear-1.ogg | lettuce rip chomp chew saw | spanrucker | https://freesound.org/people/spanrucker/sounds/272240/ | https://cdn.freesound.org/previews/272/272240_220835-hq.ogg (Freesound HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 272240 HQ preview (47.6 s, iceberg lettuce: rip, chomp, chew, saw); used 4.50-5.05 s (the first and loudest rip, at 4.56 s) | cut 4.50-5.05s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -22.6 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.55 s | 10322 | Real iceberg lettuce (tags "lettuce, rip, salad, kitchen"): one short, crisp leafy rip with a very clean background (about -71 dB). Centroid about 6.4 kHz. |
| squeeze-1.ogg | Lemon,Juicy,Squeeze,Fruit.wav | Filipe Chagas | https://freesound.org/people/Filipe%20Chagas/sounds/91915/ | https://cdn.freesound.org/previews/91/91915_1512131-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 91915 HQ preview (45.6 s, several lemon squeezes); used 17.12-17.78 s (one full squeeze) | cut 17.12-17.78s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.63 s | 12002 | "Squeezed lemon with juice", recorded with a Schoeps CMC MK41 and a Sound Devices 722 in a very quiet room (background about -73 dB). A wet, juicy squish (centroid about 5.2 kHz). |
| crunch-1.ogg | Biting an apple | Urkki69 | https://freesound.org/people/Urkki69/sounds/628260/ | https://cdn.freesound.org/previews/628/628260_12244617-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 628260 HQ preview (4.5 s, a single bite at 1.02-1.32 s); used 0.95-1.60 s | cut 0.95-1.60s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.4 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.48 s | 8589 | One crisp bite into a green Granny Smith apple, with no chewing. The background is silent and it is not clipped. It is the fullest, least harsh bite found (centroid about 5.2 kHz). |
| drizzle-1.ogg | Water pouring into glass bowl 01 | Rudmer_Rotteveel | https://freesound.org/people/Rudmer_Rotteveel/sounds/700352/ | https://cdn.freesound.org/previews/700/700352_4921277-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"; the page says "CC0, so no need to give credit"); page checked live on freesound.org, 2026-09-19 | 700352 HQ preview (5.2 s); used 0.50-2.55 s (the start of the pour: a thin, even stream, before the louder end at 2.6 s) | cut 0.50-2.55s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 300 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.7 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 2.05 s | 28891 | A thin stream poured into a glass bowl (like a salad bowl). It starts naturally, is fairly even and has a very clean original (about -78 dB). Water, not oil. Centroid about 5.5 kHz. |
| salt-1.ogg | Shaking Salt 1 | OutbreakProtocol | https://freesound.org/people/OutbreakProtocol/sounds/720467/ | https://cdn.freesound.org/previews/720/720467_15607324-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 720467 HQ preview (2.6 s, about 6 shakes); used 0.30-1.15 s (the first 4 shakes) | cut 0.30-1.15s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 150 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.7 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.85 s | 11012 | Distinct "shk-shk-shk-shk" salt shakes with short gaps between them. It is the least bright salt shaker found (centroid about 6 kHz) and has a clean background (about -63 dB). |

**Missing (no suitable CC0 source found):** none.

### Cookie sounds (batch 4, added 2026-09-19)

Candidate no. 1 of each, renamed the same way. Only CC0 sources; each license was read live on the sound's own Freesound page on 2026-09-19 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 4). stamp is a rubber-stamp press and icing a generic smooth squeeze (no CC0 cookie-cutter or piping-bag recording was found).

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| egg-crack-1.ogg | egg - crack - with hit - wide.wav | Anthousai | https://freesound.org/people/Anthousai/sounds/336614/ | https://cdn.freesound.org/previews/336/336614_5923045-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 336614 HQ preview (4.54 s, an egg cracked on the side of a glass bowl); used 3.50-4.20 s (the single loudest crack at 3.60 s) | cut 3.50-4.20s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 51 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.8 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.155 s | 5368 | one clean, sharp crack of a real egg on a bowl |
| flour-poof-1.ogg | Dry Puff.wav | valeofhearts | https://freesound.org/people/valeofhearts/sounds/532234/ | https://cdn.freesound.org/previews/532/532234_5285794-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 532234 HQ preview (0.83 s, a single dry puff of air; tags: air, flour, poof, wind); whole file | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 150 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.8 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.624 s | 9992 | a short, soft 'poof', tagged flour/poof by its author |
| stamp-1.ogg | 17_stamp, rubber, plastic.wav | 15FPanska_KristynaHaupt | https://freesound.org/people/15FPanska_KristynaHaupt/sounds/461888/ | https://cdn.freesound.org/previews/461/461888_9681967-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 461888 HQ preview (15.6 s, a rubber stamp pressed several times); used 0.10-0.60 s (the first press) | cut 0.10-0.60s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -20.3 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.339 s | 7127 | a soft, dull press-thump; a cookie cutter pressed into dough is a similar soft thud (no CC0 recording of a cutter pressed into dough was found; 462645 is cutters rattling on a counter) |
| icing-1.ogg | Squeezing Sound | wesleywestmusic | https://freesound.org/people/wesleywestmusic/sounds/680684/ | https://cdn.freesound.org/previews/680/680684_14164674-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 680684 HQ preview (8.9 s, several squeezes; tags: squeeze, squash, mash, knead); used 0.25-0.75 s (the first smooth squeeze) | cut 0.25-0.75s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 20 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -18.0 LUFS, peak -2.9 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.5 s | 8545 | a smooth, rounded squeeze envelope, closest to squeezing an icing bag (no CC0 piping-bag/icing recording found; the whipped-cream sprays 846514/32921 are pressurised hisses) |
| cookie-crunch-1.ogg | Eating A Biscuit or Cookie | black_trillium | https://freesound.org/people/black_trillium/sounds/752128/ | https://cdn.freesound.org/previews/752/752128_4889106-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 752128 HQ preview (74 s, a biscuit being eaten, denoised with RX-8); used 1.65-2.15 s (the first bite: two crisp crunches) | cut 1.65-2.15s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 80 Hz; soft peak limiter (max gain reduction 8.6 dB); mono 44.1k; loudness -22.8 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.414 s | 8081 | a real biscuit bite, clean (denoised) background; different from crunch (apple) and munch |

**Missing (no suitable CC0 source found):** none.

### Smoothie sounds (batch 5, added 2026-09-19)

Candidate no. 1 of each, renamed the same way. Only CC0 sources; each license was read live on the sound's own Freesound page on 2026-09-19 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 5). blender is a seamless loop (4.0 s; loop the whole file). glass-pour is water poured into a glass and lid-click a plastic container lid (no CC0 smoothie-pour or blender-lid recording was found).

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| blender-1.ogg | blender-making-lassi.ogg | pbimal | https://freesound.org/people/pbimal/sounds/646773/ | https://cdn.freesound.org/previews/646/646773_11830391-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 646773 HQ preview (16.9 s, a kitchen blender blending lassi, a yogurt drink); used 8.6-13.2 s (the steadiest part) | seamless loop: 4.0s body, 0.6s equal-power crossfade of tail into head; high-pass 80 Hz; low-pass 8000 Hz; soft peak limiter (max gain reduction -0.0 dB); mono 44.1k; loudness -20.0 LUFS, peak -8.8 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 4.00 s | 39299 | **LOOP.** A real blender running with liquid inside (closest to a smoothie), very even (±0.3 dB) and darker than the dry-motor recordings (spectral centroid about 4.2 kHz vs 5-10 kHz); the 8 kHz low-pass softens it further |
| lid-click-1.ogg | Close_Plastic_Container_Lid | Mediasaur | https://freesound.org/people/Mediasaur/sounds/788095/ | https://cdn.freesound.org/previews/788/788095_10164671-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 788095 HQ preview (0.39 s, the lid of a plastic container snapped shut; noise-reduced by the author); whole file | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -18.0 LUFS, peak -1.7 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.389 s | 7936 | one clean plastic snap with a small second tick, like a blender lid pressed on |
| slurp-1.ogg | milkshake.wav | 180007 | https://freesound.org/people/180007/sounds/445523/ | https://cdn.freesound.org/previews/445/445523_8287416-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 445523 HQ preview (7.1 s, slurping a thick milkshake through a straw); used 0.60-1.45 s (one short slurp) | cut 0.60-1.45s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 20 ms fade-in, 150 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.85 s | 11502 | a thick drink through a straw, just like a smoothie; short and bubbly, no voice (529295 ends with a spoken "ah"; the others are cup, coffee or soda-with-ice slurps) |
| glass-pour-1.ogg | Pouring water into a glass | ahamirikia | https://freesound.org/people/ahamirikia/sounds/710550/ | https://cdn.freesound.org/previews/710/710550_15407943-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 710550 HQ preview (7.5 s, water poured from a bottle into a glass); used 0.35-2.45 s (the main pour) | cut 0.35-2.45s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 20 ms fade-in, 300 ms fade-out; high-pass 100 Hz; soft peak limiter (max gain reduction 5.3 dB); mono 44.1k; loudness -18.8 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 2.075 s | 34011 | liquid into a glass, no clipping (316686 and 579752 clip in the preview); a different recording from drizzle (700352, a glass bowl) |

**Missing (no suitable CC0 source found):** none.

### Pancake sounds (batch 6, added 2026-09-19)

Candidate no. 1, renamed the same way. Only CC0 sources; the license was read live on the sound's own Freesound page on 2026-09-19 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 6). sizzle is a seamless loop (4.0 s; loop the whole file), a steady pan sizzle (the recording is of frying meat; the CC0 pancake/crepe recordings were too noisy).

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| sizzle-1.ogg | pan fry1.wav | Vital_Sounds | https://freesound.org/people/Vital_Sounds/sounds/534484/ | https://cdn.freesound.org/previews/534/534484_10944090-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 534484 HQ preview (46.3 s, food frying in oil in a pan); used 40.0-44.6 s (the steadiest, least crackly part) | seamless loop: 4.0s body, 0.6s equal-power crossfade of tail into head; high-pass 80 Hz; low-pass 6000 Hz; soft peak limiter (max gain reduction -0.0 dB); mono 44.1k; loudness -20.0 LUFS, peak -6.8 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 4.00 s | 39086 | **LOOP.** A clean, continuous, even pan sizzle (no handling noise, no clipping, ±2 dB), the least spiky of the candidates; the on-topic "Cooking a pancake" (383138) and "Crepe Making" (117602) recordings are much quieter, with mic bumps and handling noise, and "Frying Bacon, Seamless Loop" (753538) and 571670 are crackly (crest 29-33 dB) |

**Missing (no suitable CC0 source found):** none.

### Vegetable-soup sounds (batch 7, added 2026-09-20)

Candidate no. 1, renamed the same way. Only CC0 sources; the license was read live on the sound's own Freesound page on 2026-09-20 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 7). peel is one isolated stroke of a Y-style vegetable peeler on a carrot, exactly the brief. Its onset transient is sharp, so the -1.0 dBFS peak cap holds it at -22.9 LUFS, like munch, tear and cookie-crunch; play it at gain 1.0.

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| peel-1.ogg | Peeling a Carrot | Erbsland-Music | https://freesound.org/people/Erbsland-Music/sounds/634142/ | https://cdn.freesound.org/previews/634/634142_522747-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-20 | 634142 HQ preview (20.0 s, several groups of peeler strokes on a carrot with a Y-style aluminium peeler); used 2.05-2.52 s (one isolated medium-length stroke with a quiet lead-in at -35 dB and no neighbouring stroke inside the cut) | cut 2.05-2.52s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -22.9 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.47 s | 8770 | Exactly the brief: a vegetable peeler taking a strip off a carrot. Recorded with a Zoom H6 + XYH-6 at 96 kHz/24-bit with only cutting and gain applied, so it is the cleanest of the five CC0 peeler recordings: a clear blade-bite onset, an even scrape body and no handling rumble or sink/room noise. "Peeling Carrots" (429887) is over a kitchen sink, "Carrot Peeling" (672731) and "carrot-peeling-slow-medium-fast" (835795) are noisier and have strokes too close together to isolate, and "Skinning Carrots" (534376) is an unprocessed SM58 close recording whose author adds a statement against certain reuses, so it was set aside |

**Missing (no suitable CC0 source found):** none.

### Birthday-cake sounds (batch 8, added 2026-09-20)

Candidate no. 1, renamed the same way. Only CC0 sources; the license was read live on the sound's own Freesound page on 2026-09-20 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 8). blow is one short, soft puff of breath blowing a candle out (0.34 s), exactly the brief: 81 % of its energy sits in the 800-3000 Hz breath band and only 0.9 % below 200 Hz, so it reads as a puff and not as a gust or a mic wind-blast. It reaches -18 LUFS at a -2.7 dBFS peak without touching the peak cap, so it needed no limiter; play it at gain 0.65 like the other one-shots.

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| blow-1.ogg | blowing out candle.wav | Reitanna | https://freesound.org/people/Reitanna/sounds/242867/ | https://cdn.freesound.org/previews/242/242867_950925-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-20 | 242867 HQ preview (0.80 s, one close-miked breath puff blowing a candle out); used 0.20-0.60 s (the whole puff: 0.04 s of room floor, the rise, the peak and the full decay, with nothing else in the file) | cut 0.20-0.60s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -2.7 dBFS (target -18 LUFS, peak cap -1) | 0.34 s | 6930 | Exactly the brief, and the only candidate that is gentle, short and clean at once. Breath-band spectrum (81 % of the energy in 800-3000 Hz, 1.4 % below 200 Hz), 40 dB signal-to-noise against the room floor, 0.36 s of usable puff, no clipping, and the file contains this one puff and nothing else. "Candle blow" (656818, Samsung phone) is a mic wind-blast, not a puff: 62 % of its energy is below 200 Hz and its spectral centroid is 242 Hz, so high-passing it would leave almost nothing. "Man Blowing Candle Out" (382667) has usable takes but only 17.5 dB signal-to-noise (its quietest take peaks at -33.7 dBFS and needs about 31 dB of gain) and its takes run 0.7-1.4 s, a sustained blow rather than a short puff. "Blowing on a candle" (573035) is 46 s of many takes over a -41 dB room floor (26 dB signal-to-noise) and its one strong take is a hard 0.5 s blow with audible high-frequency hiss. "Blowing Out Candle_more airy" (406648) peaks at -32.3 dBFS with a -50 dB floor, so only about 18 dB of usable range. "Candle flame flickers, blown out" (826338) is a spliced composite with added reverb, a continuous flame flicker under the blow and a clipped +3.2 dBFS peak |

**Missing (no suitable CC0 source found):** none.

### Gameplay round (added 2026-09-25): Pipa's voice and sneeze

`char-yay.ogg`, `char-giggle.ogg` and `char-wow.ogg` are copied unchanged from `character/` (sources, CC0 licences and
processing in `character/CHARACTER-NOTES.md`). `pipa-sneeze.ogg` is generated by `scripts/make_pipa_sneeze.py` (Kokoro-82M,
voice af_sky, "Ahh... CHOO!", pitched up 5 semitones, -18 LUFS; 0.74 s). None of the four was listened to by the agent
(no speakers in the cloud, and the speech checker's model could not be downloaded there).

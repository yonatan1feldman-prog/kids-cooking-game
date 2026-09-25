# Character vocal candidates (wordless)

Six short vocal reactions for the game's character, to **choose by ear**. None were listened to. They were chosen by title, description and waveform checks. As an extra check, a small offline speech recognizer (Vosk small-en) was run on each vocal candidate to catch real words. It found no words in the files kept here, except that "yay" and "wow" are exclamations by nature.

The license rules, Freesound access notes (pages checked via Internet Archive snapshots because freesound.org gave HTTP 502; downloads are the public HQ previews) and processing steps are the same as in `../sfx-candidates/SFX-NOTES.md`. All six are normalized to -18 LUFS with a -1 dBFS peak cap, mono, 44.1 kHz, OGG Vorbis q4.

**Honest caveat:** I could not find a CC0 **child** voice that is clean and wordless. The voices here are a teenage girl (giggle), adult women (ah), cartoon/creature voices (yay, whoop, huh) and a high-pitched "wow". None were pitch-shifted by me. If the character should sound younger, a small pitch-up (+2 to +3 semitones) in code or ffmpeg is an option, but judge by ear first.

## Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| char-giggle.ogg | Girl, female, laughing, giggling.wav | SpliceSound | https://freesound.org/people/SpliceSound/sounds/218308/ | https://cdn.freesound.org/previews/218/218308_1480854-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-11-07 (freesound.org gave HTTP 502 from this network) | 218308 HQ preview (11.4 s, 6 separate giggles); used 3.00-3.95 s (3rd giggle) | cut 3.00-3.95s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -5.5 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.82 s | 11645 | A teenage girl giggling. It is a very clean recording with short, separate giggles. I used the longest single giggle. |
| char-yay.ogg | yay.wav | Higgs01 | https://freesound.org/people/Higgs01/sounds/428156/ | https://cdn.freesound.org/previews/428/428156_8014960-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-02-26 (freesound.org gave HTTP 502 from this network) | 428156 HQ preview (1.23 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -1.4 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.06 s | 13155 | A high cartoon 'yay!' made for a game where a rat cheers, so it already sounds like a cute character. Clean and not clipped. 'Yay' is an exclamation, not a real word. |
| char-wow.ogg | wow.mp3 | willy_ineedthatapp_com | https://freesound.org/people/willy_ineedthatapp_com/sounds/167355/ | https://cdn.freesound.org/previews/167/167355_3062051-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-03-11 (freesound.org gave HTTP 502 from this network) | 167355 HQ preview (1.66 s); whole take | trim silence (thr -35 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 120 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -5.5 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.60 s | 11680 | A high, rising 'wow' (happily amazed). There is some background noise, so listen for hiss. |
| char-ah-surprise.ogg | 01-Ah Oh Sorpresivo.wav | lauracarolina09 | https://freesound.org/people/lauracarolina09/sounds/445868/ | https://cdn.freesound.org/previews/445/445868_9244716-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2024-07-14 (freesound.org gave HTTP 502 from this network) | 445868 HQ preview (2.6 s, 'Ah' then 'Oh'); used 0.15-1.00 s (the 'Ah!' only) | cut 0.15-1.00s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.2 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.80 s | 11140 | A surprised female 'Ah!' with no words, for the happy-surprise / gasp moment. I cut the second half ('oh') because the speech checker heard it as 'no'. |
| char-whoop.ogg | Funny Whoop Cartoon Sounds | Breviceps | https://freesound.org/people/Breviceps/sounds/684510/ | https://cdn.freesound.org/previews/684/684510_9159316-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-01-13 (freesound.org gave HTTP 502 from this network) | 684510 HQ preview (4.6 s, 6 whoops); used 0.05-0.68 s (1st whoop) | cut 0.05-0.68s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -7.2 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.56 s | 8282 | A happy cartoon 'whoop': very clean, short and wordless. |
| (moved to work/character-alternates/char-huh.ogg, to keep the folder at 6) | Huh | tinyworlds | https://opengameart.org/content/huh | https://opengameart.org/sites/default/files/huh.wav | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/) | huh.wav (0.35 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -6.7 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.35 s | 6368 | A cute, soft 'huh?' made for a character in a Samorost-like game, for curious or 'hmm?' moments. Low-pitched and wordless. |
| char-mmm-synth.ogg | (synthesized) "mmm" hum | generated locally with Kokoro-82M, voice af_heart | https://huggingface.co/hexgrad/Kokoro-82M | n/a (generated from phonemes `mˈmmmː!`, speed 0.8) | Kokoro-82M weights: Apache-2.0; generated output carries no third-party rights | whole take | trim silence, 5 ms fade-in / 40 ms fade-out; -18 LUFS, peak cap -1.5 dBFS; mono 24 kHz; OGG Vorbis -q:a 3 | 0.86 s | 8360 | **Experimental.** No CC0 recording of "mmm" was found, so this is a TTS hum. Analysis shows a voiced hum with falling pitch (~240 → 170 Hz), but it was not heard. It may sound robotic. |

## Coverage vs. the wish-list

| wanted | file | status |
|---|---|---|
| giggle | char-giggle.ogg | found |
| delight / "yay" | char-yay.ogg, char-whoop.ogg | found (cartoon voices) |
| surprise "oh!/ooh!" / happy gasp | char-ah-surprise.ogg, char-wow.ogg | found ("ah!" and "wow" instead of "ooh") |
| curious "hmm?" | work/character-alternates/char-huh.ogg | found, but moved out of character/ to keep the limit of 6 (not on the original wish-list) |
| **"mmm" (yummy)** | char-mmm-synth.ogg (synthetic fallback) | **no CC0 recording found**; a TTS-generated hum was added instead. The good ones (AudioRichter "Mmm Female Various", freesound 169342) are CC-BY. adamcreeper "hmmmm.wav" (freesound 678493, said to be CC0) had no archived page, so I could not check its license. |

## Other CC0 options checked (alternates, not in the folder)

- OGA "Group giggling" (AuraVoice / nocturnalvanguard, CC0, https://opengameart.org/content/group-giggling): clean, but a **group** of adult women. The speech checker heard some words around 3.3-3.9 s. The first 1.6 s would work as a "crowd giggle".
- OGA "80 CC0 creature SFX" (rubberduck): `cute_01`-`cute_10` (pitched-up squeaks, somewhat noisy) and `ooh.ogg` (0.2 s, low male "oh").
- OGA "Female RPG voice starter pack" (cicifyre, CC0): the cutesy voice's `healed1.wav` sounds like an "ah~". The other lines are words (spell names).
- Freesound CC0, not processed: zut50 "yay.mp3" (162395, a group of adults), jayfrosting "Gasp 1 with surprise" (333412, small **crowd**), FloydP "Women gasping.wav" (346213, 8.8 s multi-take), Vikra9409 "Short Whispering Gasp" (825529, whispery), Breviceps "Cartoon - Uh-Oh!" (445964, negative meaning), Sadiquecat "Yippee" (810904, adult man; page shows both CC-BY and CC0 labels, which is unclear).

## Rejected

| candidate | reason |
|---|---|
| JohnsonBrandEditing "Cartoon giggle laugh high pitch" (freesound 243378, CC0) | heavily clipped (about 4900 samples at full scale), so it is distorted |
| FunWithSound "Laugh Group of Children" (416703, CC0) | old family video: noisy background (floor about -28 dB) and room sound |
| SoundMunger "Little Girl giggle" (62263) | Attribution 4.0 |
| thatjeffcarter "giggle.wav" (85135), OBXJohn "Child Laughing" (242932) | Attribution 4.0 |
| Stevious42 "Baby Laugh" (259611) | Attribution 3.0 |
| magicalmysticva "Cute Girl Voice Reactions" (736463) / "Cute Anime Girl Laughing" (734049) | Attribution 4.0 |
| AudioRichter "OOh Female Various" (169336), "Mmm" (169342) | Attribution. They were also described as "sexy/flirty", which is wrong for this game |
| silversatyr "Surprised Woman" (333267), Iceofdoom "Oh!" (371555) | Attribution |
| TheScarlettWitch89 "Female 'Ooh' Singing Voice" (427200) | Attribution 3.0 |
| LittleRainySeasons "Wow Sound.wav" (338047, CC0) | not a voice (a "Hallelujah"-like effect) |
| DarkNightPrincess "Woah!" (621774), tuhinpaul "young girls giggling" (342838), craigsmith "Children Cheering" (438421), makkuzu "wow.wav" (555610), Legnalegna55 "WOW wow" (547353), qubodup "Nom Nom Nom" (210432) | the Freesound page could not be fetched (site down, and not archived or the archive rate-limited me), so the license could not be checked. Worth checking in a browser, since some are said to be CC0 |
| OGA "Tiny creatures sounds" laugh.ogg (fvcalderan) | a pitched-up "battle" creature voice; its tail (0.9 s build-up) may sound spooky |
| OGA "Pixie voice saying game over", "Little girl saying game over" | real words |


## License re-check (2026-09-19)

freesound.org was reachable again at the end of the session. All five Freesound pages above were opened live on 2026-09-19 and every one links to creativecommons.org/publicdomain/zero/1.0 (CC0).

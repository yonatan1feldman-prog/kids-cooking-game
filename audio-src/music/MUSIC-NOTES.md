# Background music loops (pizza cooking game)

All three tracks are from OpenGameArt.org. Each source page lists **CC0** as its license ("CC0 1.0 Universal / Public Domain Dedication"). I checked the license block on each page on 2026-09-19. The music-box zip has no license file inside. It holds only the four .ogg files, so the page is the only license statement. No attribution is required. Crediting the authors is still polite and costs nothing, for example in a credits screen.

Common processing for all three files:
- Decoded to 44.1 kHz stereo float.
- Loop built or trimmed as described in each row.
- Loudness measured with ffmpeg `loudnorm` (measurement pass), then a **single linear gain** (`volume=`) brings each file to **-20 LUFS integrated**. A linear gain keeps the seam intact, which dynamic loudnorm would not.
- Encoded with ffmpeg libvorbis at 44.1 kHz stereo.
- Checked again after encoding: decoded sample count equals the loop length, integrated loudness is -20.0 LUFS, true peak is at or below -6.6 dBTP.

| target file | title | author | source page URL | direct download URL | license (exact) | original file | processing | duration | size bytes | character | seam verification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| music-1.ogg | Cozy Puzzle In-Game 1 | MintoDog | https://opengameart.org/content/cozy-puzzle-in-game-1 | https://opengameart.org/sites/default/files/cozy_puzzle_in-game_1_bpm118.ogg | CC0 (page license field: "CC0") | cozy_puzzle_in-game_1_bpm118.ogg (Vorbis 44.1k stereo, 130.17 s) | The author labels it loopable. The length is exactly 256 beats at 118 BPM (5,740,475 samples), so no trim or crossfade was needed. Gain -7.89 dB (from -12.1 to -20.0 LUFS). Vorbis q2 (~96 kbps) to stay under 1.5 MB | 130.170 s | 1,477,823 | Gentle bossa-nova "cozy puzzle" tune. Author tags: bossa nova, flute, mallets, saxophone, relax, cozy. 118 BPM. Very steady level (LRA 1.9 LU) | Measured on the decoded OGG: join jump 0.0095, below the 99th-percentile sample step near the seam (0.031). No high-frequency spike at the join (-26 dB vs following 10 ms). Head is 10 dB louder than tail because the loop's downbeat lands on sample 0 |
| music-2.ogg | 4 Music Box Tracks: "musicbox2_cute_tune" | Aureolus_Omicron | https://opengameart.org/content/4-music-box-tracks | https://opengameart.org/sites/default/files/musicbox2_cute_tune.ogg (also inside https://opengameart.org/sites/default/files/4_music_box_tracks_ogg.zip, which is byte-identical) | CC0 (page license field: "CC0"; page tags include "looping") | musicbox2_cute_tune.ogg (Vorbis 44.1k stereo, 137.146 s) | Authored looping OGG, 256 beats at 112 BPM. Kept all 6,048,006 samples: the 6 samples past the exact beat grid lead smoothly into sample 0, and trimming them made the join jump larger (0.008 became 0.033). Gain -4.95 dB (from -15.05 to -20.0 LUFS). Vorbis q2 (~96 kbps) | 137.143 s | 1,340,065 | Cute music box / celesta tune. Author tags: cute, happy, music box, celesta. About 112 BPM, light and sparse | Measured on the decoded OGG: join jump 0.0010, smaller than 98% of all sample steps. No high-frequency spike at the join (-11 dB vs following 10 ms). The level rise at the join is a music-box note starting on the downbeat: its high-frequency content keeps ringing, so it is not a click |
| music-3.ogg | Children's Game Music 3 - Home | heartade | https://opengameart.org/content/childrens-game-music-3-home | https://opengameart.org/sites/default/files/children_soundtrack_3.wav | CC0 (page license field: "CC0") | children_soundtrack_3.wav (85.5 s) | The original is not a loop: it plays to about 84.5 s and then fades out in about 1 s. Spectral cross-correlation showed the opening material recurs at exactly 168 beats at 140 BPM (72.000 s, correlation 0.87), so the loop length is 72.000 s (3,175,200 samples). **Loop crossfade:** the continuation after 72 s (x[72s : 73.5s]) is equal-power crossfaded into the first 1.5 s of the head, and everything after 72 s is dropped. The end of the file therefore flows into material that continues it. Gain -6.83 dB (from -13.2 to -20.0 LUFS). Vorbis q3 (~112 kbps) | 72.000 s | 963,388 | Peaceful, warm indoor theme with piano, flute and strings. Author: "Peaceful indoors theme ... created for an educational game for children"; tags: indoors, childlike, warm. About 140 BPM (felt as a relaxed 70) | Measured on the decoded OGG: join jump 0.0017, smaller than 93% of sample steps. Tail and head levels over 50 ms are -21.5 and -19.9 dB. RMS in 250 ms steps across the crossfade stays between -13 and -18 dB, with no dip or bump. No high-frequency spike at the join (-8 dB) |

### How the seam was measured

The scripts are in `work/music/scripts/`: `seam.py`, `make_loops.py` and `analyze.py`. Each loop is treated as wrapping around (last sample, then first sample). The checks are:
1. The largest per-channel sample jump at the join, compared with the distribution of all sample-to-sample steps and with the 99th percentile within ±200 ms of the seam.
2. RMS of the last 50 ms compared with the first 50 ms.
3. Log-spectrum cosine similarity of the last 200 ms and the first 200 ms.
4. A click detector: the energy above 6 kHz in the 2 ms that straddle the join, compared with the 10 ms that follow it. A click shows up as a positive spike. All three files show a negative value, meaning no spike.

All checks were run on the pre-encode WAV and again on the decoded final OGG.

### Integration notes
- **Vorbis priming:** ffprobe reports the container `duration_ts` 128 samples longer than the audio (for example 5,740,603 against 5,740,475). This is the standard Vorbis pre-skip, marked with a negative start PTS. Decoders that honour Ogg granule positions, such as ffmpeg, browsers' `decodeAudioData` and Android ExoPlayer, return exactly the loop length; I confirmed this with ffmpeg. For a truly gapless loop in the game, decode to a buffer and loop that buffer (Web Audio `AudioBufferSourceNode.loop = true`, or Howler with `html5:false`). Avoid looping an `<audio>` element / HTML5 media, which usually leaves a small gap.
- All three files are at the same loudness (-20 LUFS), so they can be switched between without volume jumps.
- I could not listen to the audio. Character descriptions come from the authors' descriptions and tags plus signal analysis (tempo, onset density, brightness, level stability). Someone should listen quickly before shipping.

## Rejected / alternative candidates

| candidate | license on page | reason not used |
|---|---|---|
| Happy Clappy Loop (OwlishMedia) https://opengameart.org/content/happy-clappy-loop | CC0 | Good cheerful piano that loops seamlessly, but only 17.4 s long, so it would get repetitive quickly. **Best backup** if a 4th track or a short menu loop is wanted (raw file in work/music/HappyClappyLoop.wav) |
| Happy Lullaby (song17) (cynicmusic) https://opengameart.org/content/happy-lullaby-song17 | CC0 | Bells and arpeggios, 39.5 s. The source is a 32 kHz MP3 (lower fidelity), it fades out at the end (tail -53 dB), and the calm lullaby character is close to the music box |
| musicbox4_happy_polka (Aureolus_Omicron) | CC0 | Fine license, but would give two music-box tracks. It is also denser (3.8 onsets/s) and has a wider level range. Alternative for music-2 |
| Ukulele Forest (StarNinjas) https://opengameart.org/content/ukulele-forest-beginning-loop-and-end | CC0 | Ukulele fits the brief, but the loop is only 8.4 s (too repetitive) |
| Feel Good Island (Brandon75689) https://opengameart.org/content/feel-good-island | OGA-BY 3.0 + CC0 (CC0 usable) | Not loop-ready: 0.2 s of leading silence, 3 s trailing fade, and a quiet intro section (-49 dB). Bass-heavy mix at 129 BPM |
| Napping on a Cloud (congusbongus) https://opengameart.org/content/napping-on-a-cloud | CC0 | 4 min 8 s tracker/chiptune piece with a hot master (sample peak +2 dBFS, clipped). Too long for a 1.5 MB budget |
| Jungle Simple Style 1 (Tozan) https://opengameart.org/content/jungle-simple-style-1 | CC0 | Source is 16 kHz (dull, low fidelity), very quiet with long silences |
| Children's Game Music 1 - Picnic / 4 - Activity (heartade) | CC0 | Picnic (sax, vibraphone, strings, 37 s) is more upbeat and ends in a fade. Activity is percussion-driven (shakers, woodblocks). Both are possible alternatives from the same author as music-3 |
| Shop Theme "Buy Something!" (CleytonKauffman) https://opengameart.org/content/shop-theme | CC0 | Looped bossa "elevator" tune. Downloaded (work/music/shop_theme/) but not processed because music-1 already covers bossa |
| Apple Cider (Zane Little Music) https://opengameart.org/content/apple-cider | CC0 | Guitar, flute, whistle and bells, but not labelled as a loop, and the source is a 3.2 MB OGG or 70 MB WAV. Not evaluated further |
| Bossa (SpringySpringo) https://opengameart.org/content/bossa-shop-theme-in-low-fi-and-hd | CC-BY 3.0 + CC0 | Built from BandLab samples, so the provenance of the underlying samples is a question. Skipped to stay safe |
| FreePD.com | "Public Domain" only | The site now shows a closure notice and says only "free-to-use, Public Domain", with no explicit CC0 wording. Not used, per the rules |
| Kenney.nl | CC0 | Kenney's audio packs are sound effects and short jingles, not background music loops, so there was nothing suitable |
| Freesound previews | - | Not needed. OpenGameArt had enough full-quality CC0 downloads, so no login-gated sources or preview-quality files were used |

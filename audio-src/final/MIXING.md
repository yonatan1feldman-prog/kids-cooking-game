# Mixing guide: final/

Recommended playback volumes (gain 0–1, as `GainNode.gain` or `volume`) for a phone speaker. Mom's voice is the reference and always plays at full volume. Everything else sits below it, so a 5-year-old can always hear what Mom says.

## How loud the files are

| group | measured loudness | note |
|---|---|---|
| voice/* | -18 LUFS | 181 files, all within about 1 dB |
| voice/count-1..10, temp-50..250 | -18 LUFS | short number calls, same level as all the other voice files; count files are 0.63-0.73 s long |
| voice/name-* (salad) | -18 LUFS | ingredient names, same level as all the other voice files; 0.64-0.87 s long |
| voice/name-star, heart, circle, flower (cookies) | -18 LUFS | cookie-cutter shapes ("A star!"), same level; 0.82-0.87 s long |
| voice/name-banana, strawberry, mango, kiwi (smoothie) | -18 LUFS | fruit names, same level; 0.70-0.84 s long |
| voice/name-potato, zucchini (soup) | -18 LUFS | vegetable names, same level; 0.82-0.87 s long |
| voice/name-pink, white, chocolate (cake) | -18 LUFS | frosting colours, same level; 0.60-0.75 s long |
| voice/vo-album | -18 LUFS | "Look at everything we made!" for the recipe album; 1.62 s |
| music/music-main.ogg | -20 LUFS | steady level all the way through |
| sfx/squish, sprinkle, whoosh | -18 LUFS | |
| sfx/munch | -23 LUFS | a sharp bite; the peak cap kept it about 5 dB quieter than the others |
| sfx/star, complete | -20 LUFS | intentionally soft |
| sfx/bake | -21 LUFS | loop |
| sfx/chop, grate | -18 LUFS | |
| sfx/bubbles, can-open, pour | -19 to -20 LUFS | the peak cap kept them slightly under -18 |
| sfx/jar-open | -20 LUFS | |
| sfx/camera, click, beep | -20 LUFS | intentionally soft UI-type sounds |
| sfx/water | -20 LUFS | loop, 3.5 s |
| sfx/crunch, salt | -18 LUFS | salad |
| sfx/squeeze | -20 LUFS | salad |
| sfx/drizzle | -20 LUFS | salad; a 2 s thin pour |
| sfx/tear | -23 LUFS | salad; a sharp leaf rip, the peak cap kept it about 5 dB quieter |
| sfx/flour-poof, icing | -18 LUFS | cookies |
| sfx/egg-crack | -20 LUFS | cookies; one short crack (0.16 s) |
| sfx/stamp | -20 LUFS | cookies; a soft press-thump |
| sfx/cookie-crunch | -23 LUFS | cookies; a crisp bite, the peak cap kept it about 5 dB quieter (like tear) |
| sfx/blender | -20 LUFS | smoothie; loop, 4.0 s, a blender running with liquid inside |
| sfx/lid-click, slurp | -18 LUFS | smoothie |
| sfx/glass-pour | -19 LUFS | smoothie; a 2 s pour into a glass (soft limiter on the splashes) |
| sfx/sizzle | -20 LUFS | pancakes; loop, 4.0 s, a soft, steady pan sizzle (low-passed at 6 kHz, peak -6.8 dBFS) |
| sfx/peel | -23 LUFS | soup; one 0.47 s peeler stroke on a carrot. Its blade-bite onset is sharp (crest factor 22 dB), so the -1.0 dBFS peak cap kept it about 5 dB quieter than the others, like munch, tear and cookie-crunch |
| sfx/blow | -18 LUFS | cake; one short, soft puff of breath blowing a candle out (0.34 s). Its onset is soft, so it reaches the full -18 LUFS at a -2.7 dBFS peak without the peak cap engaging, and it needed no limiter |

## Recommended volumes

| sound | gain | why |
|---|---|---|
| **voice (Mom)** | **1.0** | reference; never lower it |
| **count-1..10, temp-50..250** | **1.0** | these are voice files too: play at voice volume and duck the music the same way |
| **name-* (salad ingredients, cookie shapes, smoothie fruits, soup vegetables, cake frosting colours)** | **1.0** | voice files too: voice volume, duck the music the same way |
| **music, normal** | **0.25** | about 14 dB under the voice: present, but in the background |
| **music, while Mom speaks** | **0.12** | "ducking": ramp down over ~150 ms when a voice line starts, back up to 0.25 over ~500 ms after it ends |
| squish, sprinkle, whoosh | 0.65 | clearly heard, never louder than the voice |
| munch | 1.0 | the file is 5 dB quieter, so full gain puts it level with the other effects |
| star | 0.6 | soft sparkle; with several stars in a row, keep at least ~120 ms between them |
| complete | 0.7 | duck the music to 0.12 while it plays, as for the voice |
| bake (loop) | 0.4 | background sizzle while the pizza bakes; fade in over 300 ms and out over 300 ms |
| **water (loop)** | **0.35** | running tap during hand washing; loop through Web Audio (see below), fade in over 300 ms and out over 300 ms |
| chop, grate, bubbles, can-open, pour | 0.65 | same as the other one-shot effects |
| jar-open | 0.8 | the file is about 2 dB quieter, so a little more gain brings it level |
| camera, beep | 0.6 | short and soft; play just before or just after Mom speaks |
| crunch, salt | 0.65 | same as the other one-shot effects; salt may repeat per shake, at most one per ~150 ms |
| squeeze | 0.8 | the file is about 2 dB quieter |
| drizzle | 0.8 | about 2 dB quieter; 2 s long, so play it just before or just after Mom speaks |
| tear | 1.0 | the file is about 5 dB quieter, so full gain puts it level with the other effects (like munch) |
| flour-poof, icing | 0.65 | same as the other one-shot effects; icing may repeat while decorating, at most one per ~200 ms |
| egg-crack, stamp | 0.8 | the files are about 2 dB quieter; egg-crack can play on each "tap" |
| cookie-crunch | 1.0 | about 5 dB quieter, so full gain (like munch and tear) |
| **blender (loop)** | **0.35** | runs while the child holds the big button; loop through Web Audio like water (see below), fade in over 100 ms and out over 200 ms; duck the music to 0.12 while it runs |
| lid-click, slurp | 0.65 | same as the other one-shot effects; slurp may play once per sip, at most one per ~400 ms |
| glass-pour | 0.7 | about 1 dB quieter; 2 s long, so play it just before or just after Mom speaks (like drizzle) |
| **sizzle (loop)** | **0.3** | batter sizzling in the pan while the child holds the ladle over it (and while the pancake cooks); loop through Web Audio like water (see below), fade in over 300 ms and out over 300 ms; a quiet background bed, so Mom's lines play over it without ducking it (duck the music to 0.12 as usual while she speaks) |
| peel | 1.0 | the file is about 5 dB quieter, so full gain puts it level with the other effects (like munch, tear and cookie-crunch). One stroke per swipe, at most one per ~250 ms; stop the previous stroke before starting the next so two never overlap |
| blow | 0.65 | same as the other one-shot effects: it is already at the full -18 LUFS. Play it once per blow on the candles (at most one per ~400 ms) and let it overlap Mom's line if she is still speaking - it is short and soft |
| click | 0.5 | plays once per oven-dial step; at most one click per ~80 ms, and stop the previous click before starting the next |

Rules of thumb:
- **Voice lines:** never play two at once. If a new line starts, stop the previous one with a short fade (~50 ms).
- **Counting and temperature:** count-* and temp-* are voice lines too, so the same rule applies. In a fast counting run, start each number when the previous one ends (or cut the previous one with the ~50 ms fade). On the temperature dial, a new tap stops the number that is still playing and plays the new one. The dial click may play together with the number.
- **Ingredient names (salad), cookie shapes, smoothie fruits, soup vegetables and cake frosting colours:** name-* are voice lines too, but they are the one exception to "never cut a line short": when the child picks quickly, a new pick stops the name that is still playing (~50 ms fade) and plays the new one. Never play two names at once. If Mom's salad line is still playing when a name starts, stop the line the same way.
- **Effects with voice:** short effects (squish, star) may play together with the voice. Longer ones (complete, sprinkle) should come just before or just after it.
- **Music:** don't restart it on every screen. Let it keep running and only change its volume.
- **Tuning:** if everything together sounds too loud on the phone, lower the master volume, not the voice alone.

## Loop the music (and the bake, water, blender and sizzle loops) through Web Audio

`music-main.ogg` is a gapless loop, exactly 256 beats long. `sfx/bake.ogg` and `sfx/water.ogg` are also loops (water: 3.5 s, play at gain 0.35 through its own `GainNode`, using the same `startLoop()` below).
`sfx/blender.ogg` is a loop too: 4.0 s, loop points = the whole file (`loopStart` 0, `loopEnd` 4.000 s = 176400 samples at 44.1 kHz; the defaults of `AudioBufferSourceNode` already loop the whole buffer). Play it at gain 0.35 through its own `GainNode` with the same `startLoop()`, exactly like `waterOn()` / `waterOff()` below: start it when the child presses the button (100 ms fade-in), stop it on release (200 ms fade-out, then `src.stop()`), so a hold of any length stays gapless.
`sfx/sizzle.ogg` is a loop too: 4.0 s, loop points = the whole file (`loopStart` 0, `loopEnd` 4.000 s = 176400 samples at 44.1 kHz; the `AudioBufferSourceNode` defaults already loop the whole buffer). Play it at gain 0.3 through its own `GainNode` with the same `startLoop()`, like `waterOn()` / `waterOff()` below: start it when the ladle is over the pan (300 ms fade-in), stop it when the step ends (300 ms fade-out, then `src.stop()`).
- **Don't** loop them with `<audio loop>` or `new Audio()`: on Android that often leaves a small gap or click at the restart.
- **Do** decode the file into an `AudioBuffer` and play it with `AudioBufferSourceNode.loop = true`.
- With Howler.js, use `html5: false`, which is the default: it plays through Web Audio.

```js
const ctx = new AudioContext();
const musicGain = ctx.createGain();
musicGain.gain.value = 0.25;
musicGain.connect(ctx.destination);

async function startLoop(url, gainNode) {
  const buf = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;            // sample-accurate, gapless
  src.connect(gainNode);
  src.start();
  return src;                 // call src.stop() to end it
}

// Browsers allow sound only after a user gesture: call this from the first tap.
async function onFirstTap() {
  await ctx.resume();
  startLoop('music/music-main.ogg', musicGain);
}

// Water while washing hands: 35 %, with a 300 ms fade in and out
const waterGain = ctx.createGain();
waterGain.gain.value = 0;
waterGain.connect(ctx.destination);
let waterSrc = null;
async function waterOn() {
  waterSrc = await startLoop('sfx/water.ogg', waterGain);
  waterGain.gain.setTargetAtTime(0.35, ctx.currentTime, 0.1);
}
function waterOff() {
  const src = waterSrc; waterSrc = null;
  waterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  if (src) src.stop(ctx.currentTime + 0.4);
}

// Ducking while Mom speaks
function duck(on) {
  const t = ctx.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(on ? 0.12 : 0.25, t + (on ? 0.15 : 0.5));
}

// Pause all sound when the app goes to the background
document.addEventListener('visibilitychange', () =>
  document.hidden ? ctx.suspend() : ctx.resume());
```

Short one-shot effects and voice lines can use the same `AudioContext`, each through its own `GainNode` at the volumes above. Decode them once at startup so they play instantly.

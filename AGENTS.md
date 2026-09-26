# AGENTS.md — read this first

## Quick start (read this, then only the sections your task needs)
- **What:** a text-free, English-speaking cooking game for a 5-year-old (Android phone, landscape): she cooks with
  Mom, Pipa the hedgehog watches and eats. Phaser 4 + Vite + TypeScript PWA, deployed to GitHub Pages from `master`.
  Eight recipes: pizza, salad, cookies, smoothie, pancakes, vegetable soup, birthday cake and fruit skewers (`src/recipes/<name>.ts`),
  cards in a grid on the home screen, with the memory book's button in one more cell once there is a photo in it.
- **Where things are:** `src/recipes/` recipes as pure data (`types.ts` = every step type's params); `src/steps/` one
  reusable class per step type (`registry.ts` maps names to classes); `src/core/tuning.ts` every count and threshold;
  `src/core/stage.ts` every position; `src/core/assets.ts` the asset contract (image keys, sizes, art anchors `ART`);
  `src/core/audio.ts` voice keys and the voice queue; `scripts/harness.js` the test harness (automated Chrome).
- **Add a recipe:** see "Recipes are data" (what every recipe must provide). In short: copy its SVGs into
  `public/assets/images`, sounds into `public/assets/sounds/{voice,sfx}`; add the image keys to `IMAGES` (and anchors to
  `ART`), sound keys to `SOUND_KEYS` / `VoiceKey`; bake the WebPs; write `src/recipes/<name>.ts` on the existing step
  types (a step type bound to one recipe's art gets optional params, defaults = today's behaviour); add it to `RECIPES`
  (its `card`, `pickLine`); its counts in `TUNING`; a `photo` step last. Then `ASSET-LICENSES.md`. The salad is the
  worked example (round 6 handoff note).
- **Which sections for which task:**
  - any change: "Child wellbeing rules", "UX rules", "Working rules".
  - new recipe or step type: "Recipes are data", "Asset contract", Handoff notes 00000 (cookies), 0000 (salad) and 000 (part B).
  - layout / positions: "Landscape layout", Handoff notes 2; tuning after watching her play: `core/tuning.ts` only.
  - voice or sound: "Asset contract" (levels), "Recipes are data" (voice lines per event, the queue rules).
  - testing: "Testing notes for agents", Handoff notes 1 (harness) and 5 (Phaser pitfalls).
  - working in the cloud, art or voice sources: "Cloud workflow".
  - deploying: "Deployment" (every push needs the owner's explicit approval for that round).

## What this is
A private cooking game for a 5-year-old girl. She plays mainly on an Android phone (20:9) held
sideways (landscape, locked), sometimes on a tablet. It is not for any app store. The owner is not
technical and does no manual steps: agents do everything.

**Language: the child speaks English.** Anything spoken or worded in the game (voice-over,
narration, sung jingles with words, any text ever shown) is in **English**, now and in the future.
The screen stays text-free (see the UX rules). Commit messages stay in Hebrew: they are for the owner.

**The idea: cooking with Mom.** Mom stands at the counter for the whole recipe, shows every move with her hand,
and talks in a warm, encouraging English voice. Pipa the hedgehog is the kitchen pet; she tastes the pizza at the end.

Current content: two recipes. The salad (round 6): wash hands, wash the vegetables, tear the lettuce, choose three
vegetables, cut each, put everything in the bowl, squeeze the lemon, oil, salt, mix, serve Mom and Pipa, the photo.
The pizza, start to finish, with the style-B paper cut-out art, Mom's voice, music and
sounds, in landscape: wash hands, knead, roll, crush the tomatoes, stir the sauce, spread it, grate the cheese,
sprinkle it, choose three toppings, prepare each (cut a vegetable; open a can or a jar and pour it), decorate, bake
(drag it in, set the oven to 200, start it, put on the mitts, take it out), share it between Mom and Pipa, and the
finale with a photo of her pizza. The owner decided that she cuts and starts the oven herself (a friendly knife, Mom's
"Careful fingers!"). Later recipes (salad, cookies, soup...) should be mostly a new data file
(plus their voice lines): the prep steps are reusable, data-driven step types (see "Recipes are data").

Stack: Phaser 4 (4.2.x) + Vite + TypeScript, installed as a PWA (vite-plugin-pwa).
The official Phaser 4 skills are in `node_modules/phaser/skills/*/SKILL.md`. Read the
relevant ones (scenes, input, tweens, particles, scale-and-responsive, loading-assets,
audio-and-sound, render-textures) before changing engine-level code. They beat any other
notes (e.g. `../cooking-game-assets/mechanics-notes.md` is hints only). Phaser 4 differs from 3
(for example tint modes, filters instead of masks and FX, Vector2 instead of Point, and
DynamicTexture needs `.render()`).

## UX rules (must hold for every change)
1. **Zero text to read.** Icons, motion and sound only. No words, letters or digits on screen. (One exception, asked
   for by the owner: the oven's temperature panel shows its printed numbers 50-250, part of the art; she doesn't have
   to read them: Mom says each value, the needle, the colour band and the oven's glow show it, and 200 glows.)
2. **You can't fail and you can't get stuck.** Each step: the first time a recipe is played, Mom shows it once
   before it starts (her demo hand, at most 2.5 s, the dish unchanged; a touch ends it at once and counts). After 8 s
   without progress her hand shows the gesture again (the hint, with a glow on the target), and after 20 more seconds
   Mom helps: "Let me help you!" and her hand visibly does it (the timings are in the tuning table,
   `src/core/tuning.ts`: `HINT_AFTER_MS`, `AUTO_AFTER_HINT_MS`, `DEMO_MAX_MS`, `DEMO_WAIT_MS`). The title and home
   screens keep a 5 s hint (`SCREEN_HINT_MS`; Mom's pointing hand taps the play button / the card; `screenHint` in core/hand.ts).
   (The gameplay round, after watching her play, gave her more room to try by herself: it was 5 s / 10 s and two demo runs.) Exception: free decorating waits 15 s for the hint (once something is on the
   pizza she points at the done button: "Tap here when you're done!") and 15 more to help. 3 missed drops in a row
   show the hint right away (`Step.miss()`). There is no wrong answer and no losing.
3. **One finger only:** tap, drag, rub. No double-tap gestures, no long-press, no multi-touch, no time limits.
   The first finger to touch owns the action until lifted. A second finger or a resting palm
   never interrupts or steals it (`Step.onDown/onMove/onUp`, `iconButton`).
   The one deliberate exception is the home button: it needs two separate taps within 2 s (see 9).
4. **Physical size first.** On the phone, 1080 world units are only about 6.5 cm. The pizza and its
   board are shown at their full native size (no 75% reduction). Everything the child touches is at least
   **200 world units on its short side**, and its touch area reaches beyond the drawing. Drop targets accept
   generous misses. A lost touch (pointercancel, release off the screen, the device turned to portrait)
   sends the item gently back. Touch size beats identical outline thickness (see "Sizes" below).
5. **No-touch zones:** nothing interactive may start in the bottom 8% of the screen (palm, `PALM_ZONE`)
   or in 4% of the width on each side (the thumbs of the holding hands, `SIDE_ZONE`).
   `inNoTouchZone()` in `layout.ts` is applied by `Step.onDown` and `iconButton` (screen coordinates),
   and the stage table keeps every touch area out of those strips.
6. **Instant feedback** for every action on touch-down: motion + particles + sound.
   Buttons fire on press. Only the play button fires on release, because browsers grant fullscreen,
   audio unlock, orientation lock and wake lock only from a completed tap.
7. **Progress lives in the object** (dough flattens, sauce spreads, pizza fills). No progress bars, no dots,
   no top bar.
8. **Landscape only, any landscape ratio, no distortion.** 4:3 to 20:9 (see "Landscape layout"). Held
   upright, a text-free rotate screen covers the game and the game pauses (`core/orientation.ts`).
9. **Home button** (top-left, the only button on the recipe screen besides done): the first tap makes it
   grow and wobble, a second tap within 2 s goes home, otherwise it shrinks back. No long press.

## Child wellbeing rules (permanent, must hold for every change)
1. **No character is ever sad, disappointed or pleading** when she leaves or stops. No reminders to come back, no
   daily streaks, no rewards for returning, no counters, no points, no scores.
2. **Every recipe ends with a clear, warm finale** (Mom: "We made a pizza together!", a cheer, "That was fun! Bye bye!")
   and then goes quietly back to the home screen. The game never starts another recipe by itself.
3. **No time pressure. She can't fail. Leaving is always easy** (the home button is always there; two taps only so a
   stray palm can't end her work; the device's own home/back always works).
4. **Praise is for effort and process, never for a trait** ("You worked so hard!", "I love how you did that!",
   or about the pizza: "Beautiful!", "Yummy!"). Never "you're so smart / talented / good".
5. **Every animation, sound and effect answers something she did** (or helps her after she stopped: the hint, Mom's
   help). Nothing sparkles, bobs, pulses or wiggles by itself to pull her attention. Allowed exceptions, because they
   are life, not lures: Mom breathing and blinking, Pipa breathing (round 13) and blinking, the soft background music, the loading spinner,
   the text-free rotate animation, and the living window (visual round 4, the owner's request: now and then a few birds fly
   past the window, one cloud drifts across it, the sunbeam dims while it covers the sun; only inside the window's glass,
   slow, muted, silent, never tappable; `core/scenery.ts`). Pipa's thought bubble (her wish) pops in once when a step starts and then stays
   still; the kitchen's jars, utensils, pots and sun move only when she taps them. The oven's glow and steam while baking are the result of her putting the
   pizza in. (Round 4 removed: the play button's endless pulse, the recipe card's endless bobbing, the bins' endless
   wiggle, the done button's endless pulse, the oven's endless "tap me" hop, stars around Pipa's head at every step.)
6. **No ads, no purchases, no links out, no data collection.** Nothing is sent anywhere. The only thing stored is a
   local run counter per recipe (`localStorage`, `cooking.runs.<id>`), used only to stop Mom's automatic demos after
   the first run and to let Pipa's wishes grow a little (one thing to find, then two; three to count, up to five); it is
   never shown (and the memory book's photos, see Round 9).

## Landscape layout
- **World:** always **1080 units high**. The width follows the screen: 1440 at 4:3, 1920 at 16:9, 2400 at 20:9
  (the main device). `main.ts`: Scale `EXPAND` on a 1440x1080 base (`BASE_W/BASE_H` in `layout.ts`).
- **Positions are never absolute 1920 numbers.** Everything is in ONE table, `src/core/stage.ts`
  (`getStage(layout)`), placed relative to the side margins (`m = 4%` of the width) and the center:
  `[ this step's ingredients / bins ] [ the dish on its board ] [ Mom (and little Pipa) ]`. Scenes and steps read
  `ctx.stage.*`. To change the layout, change the table, not the steps.
- **Content scale `k`** (`layout.k`): 1 on every screen 16:9 and wider. Only screens narrower than 16:9
  (4:3 tablets, physically much bigger) show everything at `k < 1` (0.75 at 4:3), because the densest step
  (bins + full board + character at 75%) needs 1766 units between the side strips (`FIT_W`).
  `layout.Y(v)` maps a y of the 1080 design band to the world, scaled by k around the palm-strip line, so on
  those screens things still stand on the counter.
- **Background** `bg-kitchen-landscape` (2400x1080): anchored bottom-center at native height, so it is only
  cropped at the sides (16:9, 4:3); at 20:9 it fits exactly at scale 1. If a screen is ever wider than 2400 it grows
  uniformly just enough to cover the width, still bottom-anchored (`addBackground`).
- **Sizes** (the old "uniform art scale" rule is cancelled): images are shown at native size x `k`, except where
  the stage table gives an item its own scale: Mom (the right column's scale, 75-100% of native: 100% at 20:9,
  75% at 16:9), the oven (75-90%, filling the room left of the board), the topping bins (as big as the left column
  allows, about 213 units at 16:9 and 20:9), the home button (85% = 204 units), the play button (1.4x, rasterized
  at 1.4x: `raster` in assets.ts), Pipa (0.4 small, 0.62 big, x k), Mom's demo hands (point 0.62, roll/spread/grab
  0.66, sprinkle 1.1, x k: `HAND_SCALE` in core/hand.ts, from the art agent's checked scenes).
  The pizza (dish radius 350) and the board are always at native size x k.
- **Prep steps (round 5, from the art agent's `scenes-prep.js`):** the work happens in the middle where the pizza
  sits: the sink (1.1), the kneading dough on the board (1.6), the prep bowl (1.25; smaller at 16:9 so it never
  reaches Pipa: 0.93), the grater (0.91) with its pile under it. While the middle is busy with the bowl or the
  grater, the board with the pizza waits small (0.4) in the left column (`stage.aside`); for washing there is no
  board yet. The title: logo and play button in one column left of centre (4:3: centred left of Mom's face).
- **Part B places (round 5, from the art agent's cut / can / panel / bakeout / celebrate scenes):** `stage.work` (the
  middle, clear of Pipa: the six choose cells), `prepArea` + `cutBoard` (the cutting board at up to 1.05), `pourBowl` +
  `pourRest` + `lidRest` (the bowl at up to 1.0, the can or jar left of it), `binWait` (filled bins in the left column,
  20:9 only: `prepWide`), `panel` + `tempDown/Start/Up` (right of the oven, at most 0.82, buttons at least 200 units at
  16:9), `mitts` (on the empty board), `photo` (the frame where the dish was, clear of Pipa).
- **Composition per step:** Mom stands on the right for the whole recipe, her 800x800 frame's bottom on the screen
  bottom (it is cut at her waist, so she never jumps: her happy move is a stretch and sway from the waist).
  On 16:9 and wider, Pipa sits small on the counter between the pizza and Mom (never over the pizza itself or Mom's
  face; 0.362 at 16:9 where the gap is narrow). On 4:3 Pipa only comes for feeding. Roll: the pin rests upright in the
  left column and lies across the finger while rolling. Spread: bowl left. Sprinkle: shaker left. Decorate: 6 bins in
  2 columns on the left, done button above Mom's head. Bake: the oven left of the dish, side by side.
  Feed: Pipa moves to the board's right rim, big (0.62); where that would cover Mom's face (16:9, 4:3) Mom steps right
  (`feedMomShift`, her face stays on screen). Slices are dragged right to Pipa's mouth (tip first).
- **Mom's pointing arm** stays in its drawn pose (pointing at the pizza) on phones. Only on 4:3, where Pipa is not on
  screen, it turns (max 20 degrees around the shoulder) toward the oven while baking. On the phone that aim passed over
  Pipa's head, so there the demo hand points at the oven instead. Feeding: -18 degrees (tucked behind Pipa); finale: +55.
- **Orientation:** manifest `orientation: 'landscape'`; the play button asks for fullscreen + `lock('landscape')`
  (works only in fullscreen / installed PWA). Otherwise `core/orientation.ts` watches the size of `#game`: when it
  is taller than wide it shows `#rotate` (index.html: a phone turning, with a round arrow, CSS animation), pauses
  every running scene except Boot (step timers, idle clocks, tweens, delayed calls) and all sounds, and first emits
  `ORIENTATION_PAUSE` so RecipeScene drops the current gesture gently (`Step.cancelGesture()`). Back in landscape it
  resumes exactly where it was and emits `ORIENTATION_RESUME`. Title and Home rebuild at the new size
  (`keepLayoutOnResize(..., { relayout: true })`); the recipe keeps its layout and the camera zooms if the size changed.

## Project layout
```
index.html                 page shell (no scroll/zoom/pull-to-refresh/callout/selection) + #rotate screen
vite.config.ts             base path /kids-cooking-game/, dev server (--host), PWA (landscape manifest), asset-manifest plugin
.github/workflows/deploy.yml  builds and publishes to GitHub Pages on every push to master
README.md, ASSET-LICENSES.md  public description and the asset licenses (the repo is public)
plugins/asset-manifest.ts  virtual:asset-manifest = the asset files that exist on disk
scripts/make-icons.mjs     regenerates the temporary PWA icons (public/icons)
scripts/harness.js         test harness for the automated Chrome (see "Testing notes")
scripts/bake-webp.js       pre-renders the SVGs to WebP, run inside the game page (see "Pre-rendered art")
public/assets/images/      SVG art (the source, from the art agent) + webp/ (pre-rendered, committed)
public/assets/sounds/      voice/ (Mom, 63 lines), music/ (1 loop), sfx/ (22 effects incl. the bake and water loops)
src/main.ts                Phaser config (3 touch pointers), gesture blocking, lifecycle, orientation guard, SW registration
src/core/
  assets.ts                THE ASSET CONTRACT: image keys + native sizes, sound keys, ART geometry (Mom pivots, hand anchors)
  placeholders.ts          code-drawn stand-ins for missing images (a generic one for most); sauce brush; opaqueBounds
  svgRaster.ts             SVG -> texture at native size, aspect kept; WebP -> texture
  audio.ts                 all sound on one Web Audio context: loading, levels, Mom's voice queue, music, bake loop, holds
  sfx.ts                   sfx(): plays an effect if loaded, silent otherwise (relative volume); sfxThen(): chain
  device.ts                browser-gesture blocking, wake lock, audio resume (background return, every touch)
  layout.ts                world size, k, Y(), no-touch zones, resize handling, background
  stage.ts                 THE LAYOUT TABLE: every position and per-item scale, relative to margins and center
  orientation.ts           landscape guard: rotate screen, pause/resume
  fx.ts                    burst / puff / stars particles, boing squash
  juice.ts                 the polish round: touch ripples, paper confetti, sway of a held thing, Mom and Pipa tickles
  hand.ts                  MomHandView: Mom's 5 demo hands, keyframed motions (demo / looping hint), follow (help), props
  ui.ts                    iconButton (padded hit circle, fires on press, optional two-tap confirm)
  tuning.ts                THE TUNING TABLE: every count, threshold and idle timing (and Pipa's wishes: `wish`, `taste`)
  kitchen.ts               the living kitchen: the wall's tappable pieces over the background, and their answers
  tastes.ts                Pipa's tastes: love (her wish) / sneeze / wow / giggle / plain, from what is on a piece
  update.ts                service worker registration and the safe update (only at the title, see "Deployment")
src/recipes/
  types.ts                 Recipe + StepDef + CharacterDef types (one params type per step type)
  pizza.ts                 the pizza recipe, pure data
  index.ts                 RECIPES list shown on the home screen
src/core/vegArt.ts         the whole vegetables' measured body profiles (cutting: slice positions, cut-face strips)
src/steps/
  Step.ts                  base: intro (demo + voice), idle timer, hint, Mom's help, finger ownership, miss streak, cancelGesture
  Mom.ts                   Mom: 12 layers, breathing, blink, look-at, lip movement from the voice, cheer, arm aim
  Character.ts             Pipa: layers, blink, look-at, moods (expect, chew, party), small beside Mom / big for feeding
  Dish.ts                  the food carried between steps; capture() flattens it into one texture
  slices.ts                cuts the captured pizza into wedges (2D canvas), stock-art fallback
  registry.ts              step type name -> implementation
  RollStep / SpreadStep / SprinkleStep / DecorateStep / BakeStep / FeedStep
  WashStep / PressStep (knead, crush) / StirStep / GrateStep   the round-5 prep step types
  ChooseStep / ChopStep / OpenPourStep / ShareStep / PhotoStep  the round-5 part B step types (BakeStep extended)
  PrepBowl                 the big prep bowl in three layers, kept across steps
  ToppingBin               the topping bin a prep step fills and leaves for decorating
src/scenes/
  BootScene                loads the title's 4 images, starts Title, then the title art (logo, Mom, Pipa, pointing hand), the rest + all sounds
  TitleScene               play button at once; logo, Mom, Pipa fade in when loaded; the tap: audio, fullscreen, lock, wake lock, music, vo-hello + wave; the update check
  HomeScene                one card per recipe, Mom (and Pipa), vo-what-make; waits for the art before starting a recipe
  RecipeScene              runs any recipe's steps in order; board under the dish; Mom, Pipa, Mom's hand; demo counter; home button
  AlbumScene               the memory book (round 9); an enlarged photo has the puzzle button beside it
  PuzzleScene              the puzzle from a memory-book photo (pieces cut at runtime by core/puzzle.ts)
```

## Recipes are data
A recipe is `{ id, card, board, character, steps: StepDef[] }`. Each step names a reusable type and its params.
Step types: `wash`, `knead`, `crush`, `stir`, `grate`, `roll`, `spread`, `sprinkle`, `choose`, `chop`, `peel`, `open-pour`,
`decorate`, `bake`, `candles`, `share`, `photo`, `cutters`, `blend`, `flip`, `thread` (and `feed`, the older single-eater ending with its own finale, no longer used).
The salad (`salad.ts`) is the second worked example: see Handoff notes 0000.
The pizza: wash, knead, roll, crush, stir, spread, grate, sprinkle, choose, then the prep step of each of the three
chosen toppings in the order she picked them (chop, or open-pour), decorate, bake (with the panel and the mitts),
share, photo (the finale). The run's step list is live: a `choose` step puts its picks' `prep` steps right after
itself (`run.insert`, RecipeScene); `?step=N&pick=tomato,corn,olive` jumps past it in dev.
**Every count and threshold (how many presses, how much rubbing or stirring) is in ONE table, `src/core/tuning.ts`
(`TUNING`); recipes read their numbers from there.** Change the table after watching the child play, not the steps.

Reusable prep step types (round 5; params in `recipes/types.ts`, each with Mom's demo, 5 s hint and help):
- `wash` (`WashStep`, `WashParams`): a basin, a tap, the child's hands (`kid-hands`, bottom edge below the screen),
  bubbles. Tap the tap (the stream grows down onto the hands, `waterLoop`), rub the hands (a bubble per
  `rubPerBubble` of finger travel, `rubLine` after `rubLineAt` bubbles), then by itself: the bubbles wash off, the
  done line, the tap closes. Tapping the hands first only wiggles them (a miss; 3 misses show the hint).
- `knead` and `crush` are the same class, `PressStep` (`PressParams`): each press squashes the food and springs back,
  a dent (`press-dent`, or a drawn shadow if missing) under the finger, bits fly (`splash` colour), a sound; every
  `pressesPerStage` presses the food changes to its next picture in `stages`. `place: 'board'` = on the board in the
  middle; `place: 'bowl'` = inside the big prep bowl (`PrepBowl`: back layer, contents, front layer) with the pizza
  waiting small in the left column. `handoff` leaves the result for the next step (the dough ball for `roll`).
  Salad, cookies, soup: mashing, squashing cookie dough, pressing anything is this type with other pictures.
- `stir` (`StirStep`, `StirParams`): the spoon (`spoon-wood`, anchored at its bowl) follows the finger inside the
  bowl's opening; any movement in the bowl adds up (`distance`), no circles needed; `from` fades into `to`. At the
  end the bowl moves to the left column and turns into `handoffAs` (the sauce bowl of `spread`).
- `grate` (`GrateStep`, `GrateParams`): the block follows the finger; rubbing on the tool's face (up/down counts
  fully, sideways a third) drops `piece`s into a pile that grows through `piles`, the block shrinks. The pile goes to
  the left column for the next step. Also fits any "rub it on a tool" step.
- `sprinkle` gained `toolKind: 'handful'` + `source`: a handful taken from the pile (the grated cheese), held just
  above the finger, instead of the upside-down shaker.
Reusable step types of round 5, part B (params in `recipes/types.ts`; every one: can't fail, no precision, instant
feedback on every touch, Mom's demo, the 5 s hint from her hand, her help after the long idle; counts in `TUNING`):
- `choose` (`ChooseStep`, `ChooseParams` + `ChooseOption { id, image, topping, prep? }`): the options on their bins in
  the middle (`stage.choice`, 3 per row), the dish aside. A tap picks (a hop, it stays a little lifted with a soft
  glow, pop, Mom counts `count-N`), a tap on a picked one puts it back. At `pick` picks it goes on after `pauseMs`;
  `run.chosen` = the picked options in order, and their `prep` steps are inserted right after it. Help picks the
  first free ones. Salad (pick vegetables), cookies (pick decorations), soup: the same type, other options.
- `chop` (`ChopStep`, `ChopParams`): a cutting board in the prep area, the whole vegetable (`veg` = its measured
  profile in `core/vegArt.ts`), the knife upright above the next cut line. The knife follows the finger by its blade
  tip (`ART.prep.knifeTip`; over the vegetable it glides onto the cut line; held high it stays low enough for its
  handle to stay on screen). Any short stroke down over the vegetable (`minSwipe`, anywhere sideways) cuts the next
  slice: `cuts` cuts at one slice width (body span / (cuts + 1)) from right to left, the whole image cropped at the
  cut, the `inside` strip on the cut line fitted to the profile (the mushroom's cap part only outside its stem), a
  `slice` drops onto the pile, chop, Mom counts. One cut per stroke (the finger goes up 25 units or lifts for the
  next). After the last cut the end that is left becomes the last slice; the slices fly into the topping's bin.
  `careful` is said once per run (`run.once`). A new vegetable = its whole / slice / inside art + its profile (the art
  agent's `gen_prep_e.py --profiles`) in vegArt.ts.
- `open-pour` (`OpenPourStep`, `OpenPourParams`): `kind: 'can'` (a swipe up of `swipe` or `taps` taps on the lid:
  the lid flies aside) or `'jar'` (sideways rubbing on the lid adds up to `twist`, a tap a quarter: the jar rocks, the
  lid comes off and goes down); then she drags the open container over the bowl (`stage.pourBowl`, prep-bowl layers):
  it tips over by itself and `piece`s pour from its mouth into the bowl, between the layers, while it is held there,
  until `pourMs` of pouring. Everything lands in the bowl. Its contents go into the topping's bin. Milk, flour, a bag
  of pasta: the same type with other pictures (the tops are `ART.prep.canTop` / `jarTop`).
- The topping bin (`ToppingBin.ts`): a prep step ends by filling `bin` (with `topping` drawn on it, as in decorating)
  and leaving it under `bin:<topping>` in `run.handoff`: it waits small in the left column (`stage.binWait`, only on
  wide screens: `stage.prepWide`), else it slides off to the left, hidden. `decorate` adopts the bins of `run.chosen`
  and shows only those, bigger when there are three (`stage.binScale(3)` uses the free counter up to the board).
- `bake` gained two optional parts. `panel` (`TempPanel`): after the door closes a big panel between the oven and
  Pipa (the empty board fades meanwhile), the needle on `from`; down/up buttons (`iconButton`, 120 ms lock, their own
  click) move it by `step` between `min` and `max`: the needle turns to the art's angle (`ART.prep.panelAngle`), Mom
  says `temp-N`, the oven glows and tints from cool to warm. At `target`: the glow ring over its number, "Perfect! Now
  press start!", the hand on start; at `max`: "Oops, too hot!" and the hand on down; idle below the target: "A little
  more!" and the hand on up. Start only works at the target (elsewhere it wiggles: a miss), then beep, `startOn`, the
  old baking. The pizza never burns. `mitts`: after the ding the mitts lie on the board, "Put on your oven mitts!"; she
  drags them to the oven (the door opens, a mitt holds the rim), then drags the pizza out onto the board (gameplay
  round 2, see its handoff note). Mom's hand: pointing at the buttons and the mitts, `mom-hand-mitt` pulling it out.
- `share` (`ShareStep`, `ShareParams`): her pizza cut into slices (as `feed`), Pipa big on the board's rim, Mom a step
  aside (`stage.feedPet`, `feedMomShift`). A slice goes to whoever's mouth it is let go near (or, right of Pipa's
  edge, the nearer one). The one it comes near opens wide (Mom: surprised eyes, open mouth, `Mom.expectFood`); Mom
  chews (`Mom.chew`, `mom-mouth-chew`), Pipa munches with a jump or an up-down squish (nothing sideways: Mom's face is
  close). All to one is fine; the other keeps smiling. First for Mom: `forMom` + `momYum`; first for Pipa: `forPet`.
  The hint and Mom's help carry a slice to whoever has had fewer. Since the guests round she first invites a guest
  (turtle, giraffe or penguin; see Handoff notes, the guests round), a third mouth left of the dish.
- `photo` (`PhotoStep`, `PhotoParams`): the finale, the last step of a recipe: "Let's take a picture of your pizza!",
  camera + white flash, the photo frame (`stage.photo`) with her dish in its window (a DynamicTexture `photo-made`: a
  square of the kitchen, the board, her captured pizza with its baked tint), "We made a pizza together!", the cheer,
  stars off every face and the photo, "That was fun! Bye bye!", home. No hint, no help (nothing to do).

Reusable step type of round 7 (the cookies; params in `recipes/types.ts`):
- `cutters` (`CuttersStep`, `CutterParams`): the rolled sheet is the dish's base (left by `roll` with `size`), the big
  cutters stand where the bins go (`stage.bin(i, n)`). A tap on a cutter picks it (it lifts, soft glow, pop, Mom says its
  `name`, group 'name'); a tap anywhere on the sheet presses the picked one into the free slot nearest the finger
  (`slots` in the sheet's frame; the cutter's `press` point lands on the slot centre at the sheet's scale): it comes down,
  squashes, `sound`, Mom counts (`count-N`), and the `cookie` of its shape stays on the sheet with a darker cut outline
  under it (`dish.cookies`). A tap on the sheet before any pick uses the next cutter. After the last slot: `trayLine`,
  the cookies hop, the sheet fades and the `tray` (the same frame and slots) becomes the base. Demo (`mom-hand-press`):
  tap a cutter, press the dough, `stampLine` with it. Help: a different cutter for each cookie. Biscuits, sandwiches,
  anything stamped out: the same type with other pictures.
- Round 7 also generalised, each optional (defaults = the pizza and salad as before): `open-pour` `keep.spot:
  'pourBowl'` (the kept bowl on the pour spot), `piece: 'fx-dot'` + `pieceTint` / `pieceSize` (flour, sugar drawn in
  code), `dropIn` (the thing itself drops in and stays on the contents: butter); `crush` over the bowl `overAngle` /
  `overSize` / `dropFrom` / `lands` (the egg, its yolk left on the flour; `PrepBowl.extras`); `stir` `via` (stages in
  between; what lies on the contents mixes in); `roll` `line` / `size`; `bake` `tray` (where a tray sits in the oven;
  only `dish.cookies` turn golden); `decorate` `line` / `places` (the icing tube puts a blob) / `sizes` / `onto:
  'cookies'` (each thing lands inside the nearest cookie; at the end every cookie with its icing is captured on its own,
  `run.pieces`, and the whole tray into MADE_KEY without flattening the dish); `share` `pieces` (her cookies carried
  upright; the empty tray fades at the end); `photo` `made` (the photo shows MADE_KEY, no board).

Reusable step type of round 8 (the smoothie; params in `recipes/types.ts`):
- `blend` (`BlendStep`, `BlendParams`): the kept jar stands on its motor base (a `PrepBowl` whose back layer is
  `blender-jar-back`: its `stand` = the base and the big button, moving with it). A tap on the lid (or the jar) drops it on
  the mouth (`lidSound`, `lidLine` then `line`). While a finger is on the button (big touch area, or anywhere on the jar)
  the motor runs: button lit, the jar shakes a little, the contents sway, bits whirl, `blenderLoop` (audio.ts); a tap
  runs it at least `tapMs`, so taps add up too. The running time goes through `stages` up to `runMs`, then `doneLine`,
  the lid lifts off, the jar is kept. Demo and help: `mom-hand-point` tapping the lid, then pressing and holding the button.
  A milkshake, a soup, a mixer: the same type with other pictures.
- `flip` (`FlipStep`, `FlipParams`, pour and flip): the stove top with the pan on the left of the prep area, the ladle
  resting on its right. `stove` first: a tap on the knob lights it (the flame ring under the pan, `click`, "Let's turn on
  the stove!"). Then `count` times: drag the ladle over the pan and hold (it tips, a batter stream, the puddle grows
  through `puddles` in `pourMs`, `sizzleLoop`); "Wait for the bubbles!" (first time), after `cookMs` the bubbles and
  "Now flip it! Swipe up!" (first time); a swipe up from anywhere on the pan (`minSwipe`) flips it in the air and it
  lands golden ("Whee! Golden brown!" the first time), slides onto the stack in the left column (off to the left on
  4:3), Mom counts, "One more!". Nothing burns, nothing is timed but the bubbles. At the end the `plate` becomes the
  recipe's board and a `golden` pancake the dish's base, so `decorate`, `share` (cut like the pizza, `cutRadius` for the
  smaller disc) and the default `photo` work as for the pizza. Demo: the grab hand carries a see-through ladle; the
  pointing hand taps the knob and swipes up. Crepes, fritters, an egg in a pan: the same type with other pictures.
- Round 8 also generalised, each optional: `open-pour` `glasses` (the kept jar itself is poured into `count` glasses on
  its left: it becomes one picture, `jar-made`; each glass fills from the bottom up, `full` cropped over `empty`; the full
  glasses become `run.pieces` for `share` with `pieces`, and MADE_KEY for `photo` with `made`); a tall kept bowl's pour
  point stays on screen; chop's vegetables include the fruit (`FruitName` in vegArt.ts); a bin's icon from a bigger frame
  (a 240 fruit slice) shows at the topping size (`iconScale`).

Reusable step type of round 13 (the fruit skewers; params in `recipes/types.ts`):
- `thread` (`ThreadStep`, `ThreadParams`): patterning, the one "slightly harder" mechanic. The recipe's board is a tray
  (`skewer-tray`); the bins of what she chose and cut stand where decorating puts them (`stage.bin(i, n)`). One skewer per
  round, each on its own row of the tray (`ART.skewers.rows`, row 0 = Mom's model): `copy` (Mom's AB AB A lies above hers;
  a matching piece makes Mom's piece hop and sparkle), `extend` (Mom's hand threads the first `given`, ABC, then "What
  comes next?"), `free` ("Now make your very own!"). A tap on a bin threads its fruit (it flies to the stick's point and
  slides to the next place); a drag from a bin let go near the stick (`reach`) does the same, elsewhere it floats back (a
  miss). Mom says each fruit's name as it lands (`name-*`, group 'name'), so the sequence is heard. Whatever she makes is
  fine: a skewer that follows the pattern gets `sameLine` / `patternLine` (`isPattern` for her own: a unit of 2+ things
  repeated), any other one `newLine` ("Ooh! A brand new pattern!"); nothing is taken off or counted. Hint and demo: the
  grab hand carries a see-through piece from the bin the pattern needs; help fills the current skewer with the pattern and
  gives the next one back. At the end every skewer becomes a picture (`skewer-made-N`, `run.pieces` for `share` with
  `pieces`) and the tray with all of them MADE_KEY (`photo` with `made`). A pasta necklace, a vegetable kebab, a sandwich
  in layers: the same type with other pictures.

**What every future recipe must provide** (data only, unless it needs a new step type):
1. `src/recipes/<name>.ts` with `id`, `card`, `board`, `character` and its `steps`, added to `RECIPES`.
2. Its art in the contract (`core/assets.ts` IMAGES, anchors in `ART` if any), its SVGs in `public/assets/images` and
   baked WebPs; a vegetable it cuts needs its profile in `core/vegArt.ts`.
3. Its voice lines in `public/assets/sounds/voice` and their keys in `VoiceKey` (core/audio.ts): a line per step, the
   choose line, the finale lines (photo, finale, bye). Counting and temperatures are shared (`count-1..10`, `temp-*`).
   Lines that speak a number must match the tuning (vo-choose says "three": `choose.pick` 3; vo-temp says "two
   hundred": `oven.target` 200).
4. Its counts in `TUNING` (a section per step, read by the recipe file); positions in `core/stage.ts` only if a step
   needs a new kind of place.
5. A `photo` step at the end (the finale) and, if it uses `choose`, a `prep` step on every option.

Shared pieces for step types: `Step.workspace('dish' | 'aside' | 'none')` (where the board with the pizza is during
the step), `run.handoff` + `Step.handOff(key, img)` / `Step.adopt(key)` (the food visibly carries on from one step
to the next), `PrepBowl.take(ctx)` / `keep()` (the bowl across steps), `HandMotion.mark` (the dent under Mom's
pressing hand), `HandMotion.size` (a bigger hand next to the big bowl), `tapMotion(at, k)`. `character` lists Pipa's layer keys
(body, eyes x4, mouth x3). Mom is the same for every recipe (fixed keys in `steps/Mom.ts`).
To add a recipe: create `src/recipes/<name>.ts`, add it to `RECIPES`, and add any new image keys
to the contract in `src/core/assets.ts` together with a placeholder in `placeholders.ts`.
A new step type means a new `Step` subclass + a `StepDef` variant + a registry entry + its anchors in `stage.ts`.
Every step subclass must implement `demo()` (Mom's hand motion for the current phase, max 2.5 s, never changing the
dish: anything carried is a see-through prop) and `autoFinish()` (Mom's help: her hand visibly does it, via
`hand.follow` or `hand.play`), set `stepLine` (its voice line, if any), call `poke()` on real progress, and treat
`onUp(..., cancelled)` as "put it back gently". `showHint()` defaults to looping `demo()`.
Voice lines per event: Title tap vo-hello (Mom waves); home screen vo-what-make (from the title or the home button;
not after a finished recipe: the home screen stays quiet then); card vo-pick-pizza; demo: Mom first finishes the
line she is saying (at most `DEMO_WAIT_MS`), then the step line (vo-wash / vo-knead / vo-roll / vo-crush / vo-stir /
vo-sauce / vo-grate / vo-cheese / vo-choose / vo-cut / vo-open-can / vo-open-jar / vo-toppings / vo-share) while her
hand shows it. Part B: each pick and each cut `count-N`; the first cut of a run vo-cut-careful after vo-cut; opened:
vo-pour; door closed: vo-oven, then vo-temp; each value `temp-N`; at 200 vo-temp-done, at 250 vo-temp-hot, idle
below 200 vo-temp-more; half-way vo-baking; after the ding vo-mitts (vo-ready only without mitts); first slice for Mom
vo-slice-mom + vo-mom-yum, for Pipa vo-slice-pipa; the photo step: vo-photo, vo-finale, the cheer, vo-bye. Only the FIRST demo of a recipe run
is introduced with vo-watch-me and followed by vo-your-turn (`run.demoTalkDone`); later demos just show. No demo:
the step line only. Wash also says vo-wash-rub part-way through the rubbing and vo-wash-done before the tap closes.
Step done: a praise line from a shuffled deck (all seven vo-praise-1..7 before any repeats, never the same twice in a
row, also across decks; `voice.praise`); decorate done-hint vo-done-hint; pizza in the oven vo-oven, half-way
vo-baking, ding vo-ready; finale vo-finale, then the cheer effect, then vo-bye, then home.
One line at a time, never overlapping, and **never cut**: every line waits for the one playing (with a time-to-live;
a line whose moment has passed is dropped, core/audio.ts `Voice`). The one exception is `group`: a count may cut the
count playing, a temperature the temperature playing (quick cuts, quick taps). Counting (`sequence`) keeps every
number in order behind other lines ("one" is never skipped); for temperatures only the newest waiting value is kept.
Only leaving (home, rotate, background) stops a line (`voice.stop`); its `done` still runs, so a step that continues
from a line's `done` checks `this.aborted` first.

The child's own pizza: at the end of decorating, `Dish.capture()` renders the dish (dough, sauce,
cheese, toppings where she put them) into one texture (`pizza-made`). That exact pizza goes into
the oven, is seen through the window, and is cut into the slices she feeds. `pizza-slice` is only a
fallback if the capture fails.

## Asset contract (another agent produces the art and sounds)
- Images: `public/assets/images/<key>.svg` (the source) and, pre-rendered, `public/assets/images/webp/<key>.webp`.
  Sounds: `public/assets/sounds/{voice,music,sfx}/<key>.ogg` (and/or `.mp3`; the key is the file name).
- Image keys (142: the 109 below and the salad's 33, see `assets.ts` and README-salad.md), all delivered and all loaded (`NOT_LOADED` is empty since part B) (style B, from `../cooking-game-assets/images-b` and, since round 5,
  `../cooking-game-assets/images-b-prep`; see their README-mom.md / README-prep.md, CRITIQUE.md and the scene
  composers `scenes.js` / `scenes-prep.js`, the reference for positions and scales):
  bg-kitchen-landscape, dough-ball, dough-flat, rolling-pin, sauce-bowl, sauce-blob, cheese-shaker, cheese-shred,
  topping-tomato, topping-olive, topping-mushroom, topping-corn, topping-pepper, topping-onion, topping-bin,
  tray, pizza-board, oven-inside, oven-closed, oven-open, pizza-slice,
  character-body, character-eyes-open / -blink / -surprised / -happy, character-mouth-closed / -open / -chew (Pipa),
  **mom (12 layers, 800x800):** mom-arm-right, mom-body, mom-head, mom-hair, mom-eyes-open / -blink / -happy /
  -surprised, mom-mouth-smile / -talk / -open, mom-arm-left,
  **mom-hand (6, 400x400):** mom-hand-point, mom-hand-roll, mom-hand-spread, mom-hand-sprinkle, mom-hand-grab,
  mom-hand-press,
  **pizza-board** (the board under the dish; `tray` is an identical older copy),
  hand-hint (the old single hand, still in the contract, not shown), star, btn-play, btn-home, btn-done, card-pizza,
  **title:** logo-cooking-with-mom (900x400; its lettering is the only writing in the game, part of the art),
  **prep steps (round 5, part A):** sink-basin, faucet, water-stream, kid-hands, bubble (wash);
  dough-knead-1/2/3, press-dent (knead); prep-bowl-back, prep-bowl-front, sauce-stage-0..3, spoon-wood (crush, stir);
  grater, cheese-block, cheese-pile-1/2/3, cheese-handful (grate, sprinkle),
  **part B (used since round 5, part B):** btn-temp-up/down, can-corn-closed/open,
  can-lid, jar-lid, jar-olives-closed/open, cutting-board, knife, mom-hand-knife, mom-hand-mitt, mom-mouth-chew,
  mitt-single, oven-mitts, oven-panel, oven-needle, oven-start-off/on, temp-glow, photo-frame,
  veg-tomato/mushroom/pepper/onion-whole / -slice / -inside. (`NOT_LOADED` in assets.ts is the place for art that is
  delivered before a step uses it: baked and precached, but not loaded.)
- Round 9 added the soup's art (`../cooking-game-assets/images-b-soup`, README-soup.md: the pot's contents window and
  stove offset, the peeler's grip, the jug's mouth, the ladle's anchor, the two new vegetable profiles) and the memory
  book's own two textures, drawn in code (`makeAlbumTextures`).
- Sound keys: effects (`sfx/`, 27; the salad added tear, squeeze, drizzle, salt, crunch; levels tear 1.0, squeeze and
  drizzle 0.8, per MIXING.md): tap, pop, squish, sprinkle, whoosh, oven-ding, munch, cheer, cheer-jingle,
  star, complete (not used yet), bake (loop), water (loop), bubbles, grate, and for part B chop, can-open, jar-open,
  pour, camera, click, beep. Voice (89, `voice/`, English; the salad's 16 lines and 10 `name-*` are listed in
  ASSET-LICENSES.md): vo-welcome (no longer used: the title says vo-hello),
  vo-hello, vo-what-make, vo-pick-pizza, vo-watch-me, vo-your-turn, vo-wash, vo-wash-rub, vo-wash-done, vo-knead,
  vo-roll, vo-crush, vo-stir, vo-sauce, vo-grate, vo-cheese, vo-toppings, vo-done-hint, vo-oven, vo-baking, vo-ready,
  vo-feed, vo-help, vo-praise-1..7, vo-finale, vo-bye; for part B vo-choose, vo-cut, vo-cut-careful, vo-open-can,
  vo-open-jar, vo-pour, vo-temp, vo-temp-more, vo-temp-hot, vo-temp-done, vo-mitts, vo-share, vo-slice-mom,
  vo-mom-yum, vo-slice-pipa, vo-photo, count-1..10, temp-50/100/150/200/250. A voice line is any file in `voice/`
  (count-* and temp-* too). Music (`music/`): music-main (a gapless 256-beat loop).
- Levels (core/audio.ts `LEVEL`, from the sound agent's MIXING.md with the owner's numbers): voice 1.0; effects 0.65
  (munch 1.0, star 0.6, complete 0.7, jar-open 0.8, camera and beep 0.6, click 0.5); bake loop 0.4 and water loop
  0.35 (300 ms fades, `bakeLoop` / `waterLoop`); music 0.22, ducked to 0.11 while Mom speaks,
  back over 0.5 s. Music and the bake loop are AudioBufferSourceNode loops. No mute button.
- Art conventions the code assumes:
  - viewBox = native size in world units (the world is 1080 high).
  - `bg-kitchen-landscape`: 2400x1080; the counter must stay plain across the whole width (it is bottom-anchored).
  - Mom: every layer shares the 800x800 frame; y 800 = her waist (the screen bottom); body centre x 500. Stack back
    to front: arm-right, body, head, hair, eyes, mouth, arm-left. Pivots: arm-left (350, 505), arm-right (650, 505);
    the pointing fingertip is at (37, 378). Her face (hair to chin) x 330-670, y 40-420 (kept clear of stars and Pipa).
  - Demo-hand anchors (the point placed on the target): point (100,100) fingertip, roll (140,140) palm, spread
    (110,250) spoon bowl, sprinkle (125,115) pinch, grab (110,150) carried item's centre (`ART.momHands`).
  - Pipa's layers share a 600x700 frame (opaque x 30-574, feet y 684); the mouth is measured from `character-mouth-open`.
  - `topping-bin` 240x240: the topping (140) is drawn on it at (120,112).
  - `tray` is the round pizza board under the dough (not a topping bin; that is `topping-bin`).
  - `pizza-slice`: crust at the top, tip pointing down.
  - `cheese-shaker`: holes at the top (it is turned upside down while shaking).
  - `rolling-pin`: drawn lying down; the game stands it upright (rotated 90 degrees) while it rests.
  - Oven layers share a 700x800 frame (opaque x 34-664, from y 20); the window hole is x 150-550, y 320-610; the pizza
    sits at (350, 480), diameter about 320.
  - `sauce-blob`: its silhouette becomes a solid sauce brush (outline removed).
- **Loading by recipe (round 8):** `RECIPE_ASSETS` / `CORE_IMAGES` in `core/assets.ts` is the one place that says what
  is core (loaded at boot: title, home, Mom, Pipa, kitchen, demo hands, buttons, cards; every sound no recipe lists) and
  what belongs to a recipe (its images and own sounds). A card tap loads the recipe's part (`recipeAssets` in
  BootScene; Mom waves, a small spinner over the card after 250 ms); the home screen releases every non-core texture
  and the recipe's sounds (`releaseRecipe`). A new recipe MUST add its entry (including every shared line or effect another recipe lists: a listed sound is not core); a key asked for but not loaded warns
  `[assets] not loaded yet: <key>` in the console, a key in no list warns at boot. The service worker still precaches
  everything. Measured (desktop, hidden automated tab): home textures 177 -> 41; all art ready 4.6 s -> core 1.4 s;
  a recipe loads in 1.6-1.9 s. Harness: `__infra8()` (enter / leave / re-enter runs), `__loadStats()`, `__bg8()`.
- **Background (round 8):** `device.ts` pauses the whole game (`game.pause()`) on `visibilitychange` to hidden and
  resumes it on return, besides holding the audio. (Round 7's paused=false / idleFrozen=false came from the harness:
  it faked only `visibilityState`, which Phaser's own handler ignores, and steps the loop by hand.) `__setHidden(on)`
  fakes both `document.hidden` and `visibilityState`.
- **Missing files are fine:** a placeholder is drawn in code and a missing sound is silent. Swapping in
  real assets is only copying files into those folders. The dev server reloads by itself. For the
  production/PWA build, run `npm run build` again, since the asset list is fixed at build time.
- **Pre-rendered art (WebP).** The style-B SVGs use filters (paper texture, torn edges) that took ~2.6 s to rasterize
  at load (desktop Chrome; a phone is slower). `scripts/bake-webp.js` runs inside the game page on the dev server and
  renders each SVG exactly like the game does, at its texture size (native x `raster`), to `images/webp/<key>.webp`
  (lossless when that is under 64 KB, else lossy 0.92), recording the SVG's sha1 in `images/webp/sources.json`.
  The build uses a WebP only if that sha1 matches the SVG on disk; otherwise it warns and the game rasterizes the SVG.
  **After changing or adding an SVG, re-run the bake** (open the dev page, then in the JS tool:
  `eval(await (await fetch('scripts/bake-webp.js')).text()); await __bakeWebp(); await __compareWebp();`),
  check the pixel diff (small items about 0.1/255, large lossy ones mean at most 3.5/255), commit `images/webp/`.
  Nothing in the build or in GitHub Actions runs the bake (no extra tool or dependency). SVGs with a valid WebP are
  not precached by the service worker.
- The browser console lists which placeholders and silent sounds are in use (`[assets]` lines).

## Cloud workflow (round 10: everything the game is made from lives in this repo)
Since round 10 the art and audio sources are inside the repo, so any agent (also Claude Code in the cloud) can
continue without the owner's computer. The older folders beside the repo (`../cooking-game-assets`,
`../cooking-game-audio`) are the same sources; where this file or a comment says `../cooking-game-assets/X`,
read `assets-src/X` (and `../cooking-game-audio/X` -> `audio-src/X`).

**Folders**
```
public/assets/images/          the SVGs the game loads, plus webp/ (the baked WebPs and webp/sources.json). The game
                               and the build read only public/; nothing in src/, plugins/ or vite.config.ts reads
                               assets-src/ or audio-src/.
public/assets/sounds/          voice/, music/, sfx/ as the game plays them
assets-src/                    the art sources (was ../cooking-game-assets)
  images-b*/                   style-B SVGs per batch (images-b = pizza, Mom, Pipa, kitchen; -prep, -salad, -cookies,
                               -smoothie, -pancakes, -soup, -cake), each with README-*.md, tools/ (the generators,
                               *kit.py, montage / sheet pages, shot.sh) and ref/ (one reference shot, 960 px wide,
                               for each step type the batch introduced, from its latest round: pizza roll / spread /
                               sprinkle / decorate / bake, prep wash / knead / mash / cut / can / grate / momeats /
                               celebrate, cookies cut, smoothie blend, pancakes flip, soup peel, cake candles; the
                               salad added no step type). images-b also has CRITIQUE.md.
  images/, sounds/             the first-round placeholders; STYLE.md, ux-guidelines.md, mechanics-notes.md, LICENSES.md
audio-src/                     the audio sources (was ../cooking-game-audio)
  scripts/                     make_vo.py (Kokoro narration), fix_vo*.py (per-recipe fixes), build_final.py, previews
  voice-a-mom/                 Mom's lines as generated and fixed (the source of final/voice)
  final/                       what is copied into public/assets/sounds (voice/, music/, sfx/), with LICENSES.md
  music/, character/, voice-a/, LICENSES.md
  tools/, work/, .venv/        NOT in git (see below); create them locally
```
Not carried over (still only on the owner's computer): the full-size shots, images-v1, sounds-v1, style-test,
sfx-candidates, voice-b*, work. `build_final.py` reads `sfx-candidates/`, so do not re-run it: copy single files
into `final/` and `public/assets/sounds/` by hand, and extend `final/LICENSES.md` and `ASSET-LICENSES.md`.

**Baking the WebPs** (after adding or changing an SVG in `public/assets/images`): `npm run dev`, open
`http://localhost:5173/kids-cooking-game/` in a browser the agent drives (headless Chrome / Playwright is fine; the
bake must run in a real browser because it rasterizes like the game does), then in the page's console:
`eval(await (await fetch('scripts/bake-webp.js')).text()); await __bakeWebp(); await __compareWebp();`.
The dev server's `/__bake` endpoint writes `public/assets/images/webp/<key>.webp` and `webp/sources.json`.
Commit `public/assets/images/webp/`. Details: "Asset contract", "Pre-rendered art (WebP)".

**Producing Mom's voice** (Linux shell, from the repo root; the scripts find everything relative to `audio-src/`,
so the files must sit exactly at these paths and the scripts need no change):
```
cd audio-src
python3 -m venv .venv && . .venv/bin/activate
pip install kokoro-onnx==0.4.7 soundfile==0.14.0 pyloudnorm==0.2.0 numpy scipy vosk==0.3.45
mkdir -p tools/kokoro tools/ffmpeg/bin work/vo work/sfx
# Kokoro-82M v1.0 ONNX model (Apache-2.0), 310 MB + 27 MB
curl -L -o tools/kokoro/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o tools/kokoro/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
# ffmpeg with libvorbis. The scripts call tools/ffmpeg/bin/ffmpeg.exe; on Linux that name is just a link.
curl -L https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz | tar xJ
cp ffmpeg-master-latest-linux64-gpl/bin/ffmpeg tools/ffmpeg/bin/ffmpeg.exe && rm -rf ffmpeg-master-latest-linux64-gpl
#   (or, if apt has ffmpeg: ln -s "$(command -v ffmpeg)" tools/ffmpeg/bin/ffmpeg.exe)
# only for fix_vo*.py (speech check of the fixed lines): Vosk small English model, 40 MB
curl -L -o work/sfx/vosk.zip https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
(cd work/sfx && unzip -q vosk.zip && rm vosk.zip)
```
On Windows the same paths hold (`tools/ffmpeg/bin/ffmpeg.exe` is the real Windows build, `.venv\Scripts\activate`).
Then: add the line to `MOM_LINES` in `scripts/make_vo.py` and run `python scripts/make_vo.py mom <line-key> ...`
(only the named lines; voice af_heart; trims, loudness-matches, writes `voice-a-mom/<key>.ogg` and
`work/vo/report-mom.json`). Listen / check the report; for a click or an "uh" before a word, copy the newest
`fix_vo_<recipe>.py` pattern (`build`, then `apply`). Copy the chosen `.ogg` to `final/voice/` and
`public/assets/sounds/voice/`, add the key to `VoiceKey` / `SOUND_KEYS` (`src/core/audio.ts`, `assets.ts`) and a
line to the licence files. Keep `audio-src/tools`, `work` and `.venv` out of git (they are in `.gitignore`).

**Deploying from the cloud:** work on a branch and open a pull request to `master`
(`gh pr create --base master`). The owner merges it; the merge is the deployment (the push to `master` runs
`.github/workflows/deploy.yml`). An agent never pushes to `master` or merges itself unless the owner has
explicitly approved that one push in the current round (see "Working rules" and "Deployment").

## Working rules
- Work on a branch. **The repo is public on GitHub** (remote `origin`, see "Deployment").
  **Every push needs its own explicit approval message from the owner, every time.** An approval covers
  only the round it was given in. Never push, and never merge to master, without it.
- Nothing personal in the repo: no local IPs, no Windows paths with user names, no e-mail addresses,
  phone numbers, people's names, secrets or keys, in files or in commit messages. Commits use the
  GitHub noreply address set in the repo's local git config (never change the global config).
- `git add` explicit paths only. Never `git add .` or `git add -A`. For assets, the folder paths
  `public/assets/images` and `public/assets/sounds` are allowed.
- Commit messages in Hebrew, written to a file and committed with `git commit -F <file>`.
- After each significant step, `npm run typecheck` and `npm run build` must both pass with no errors, then commit.
- Don't install libraries beyond what is needed.
- Stay inside this folder. `../cooking-game-assets` may be READ and copied FROM, never written,
  changed or deleted (another agent works there). Use `images/` and top-level `sounds/*.ogg`,
  not `images-v1/`, `sounds-v1/` or `sounds/voice/`, unless the owner says otherwise.
  Its STYLE.md "Landscape layout" section is a starting point only; the owner's instructions won over it
  (no top bar, full-size pizza instead of 0.75x, background never cropped at the top).
- Rollback points: tags `rollback-start` (first commit), `rollback-pre-assets` (before the real assets),
  `rollback-pre-landscape` (end of round 1, portrait), `v0.2-landscape` (end of round 2, landscape),
  `rollback-pre-mom` (master before round 4, the Mom round), `v0.3-mom` (end of round 4), `rollback-pre-prep`
  (master before round 5, the prep steps), `rollback-pre-prep-b` (round-5-prep-a before part B), `v0.4-pizza-full`
  (the full pizza), `rollback-pre-salad` (master before round 6), `v0.5-salad` (with the salad). `rollback-pre-cloud` (master before round 10, the sources moved into the repo), `v0.13-cloud` (after it).
- Temporary files go in `.tmp/` inside this folder (git-ignored), never outside it.
- This computer's memory is limited: one automated browser only, no parallel runs, no heavy sub-agents, and at least
  2 GB free before running the harness.

## Running
- Everything is served under the sub-path `/kids-cooking-game/` (Vite `base`), in dev and preview too.
  Code builds URLs from `import.meta.env.BASE_URL` (or page-relative paths), never from a leading `/`.
- `npm run dev`: dev server on the LAN (`--host`, port 5173). Open `http://<computer's LAN address>:5173/kids-cooking-game/` on the phone.
- Dev only: `?step=N` (0-based) jumps straight to step N of the recipe.
- Mom's demos show only the first two times a recipe starts on a device (`localStorage` key `cooking.runs.pizza`).
  To see them again: `localStorage.removeItem('cooking.runs.pizza')` in the console (the harness: `__demos(true)`).
- Load time is logged: `[assets] title images ready in N ms` and `all images ready N ms after boot` (`window.__loadTiming`).
- `npm run build`, `npm run preview`: production build (preview: `http://localhost:4173/kids-cooking-game/`).
  The service worker and the screen wake lock only work on HTTPS or localhost, so over plain LAN http the
  screen may still dim. The HTTPS deployment (see "Deployment") is where the PWA is installed from.

## Deployment
- Public URL: **https://yonatan1feldman-prog.github.io/kids-cooking-game/** (GitHub Pages, public repo
  `yonatan1feldman-prog/kids-cooking-game`, Pages source = GitHub Actions).
- How: every push to `master` runs `.github/workflows/deploy.yml` (npm ci, npm run build, then the official
  `actions/upload-pages-artifact` + `actions/deploy-pages`). Watch it with `gh run watch`. Nothing else to do.
- **A push is a deployment to the child's phone. Every push needs a separate, explicit approval from the owner.**
  Only `master` and tags are pushed; work branches stay local.
- `gh` (GitHub CLI) is installed at `C:\Program Files\GitHub CLI\gh.exe` and logged in; in an old shell it may
  not be on PATH, call it by its full path.
- After a deploy, check: the URL, `manifest.webmanifest` and `sw.js` return 200, every file in `public/assets`
  returns 200, the game loads with no console errors and no placeholders except known missing art, and the
  service worker registers.
- **How a new version reaches the phone (safe update, `src/core/update.ts`):** the new service worker installs in
  the background and then WAITS (the build has no skipWaiting; `registerType: 'prompt'`, registered by our own code).
  Only the title screen, before the play tap, checks for a waiting version (`titleShown()`, also right when one
  finishes installing while the title is up). If there is one, it is switched on (`SKIP_WAITING` message) and the
  page reloads at once, before the game starts; a play tap in that blink is ignored (`updating()`). After the play
  tap (`gameStarted()`) the page is never reloaded: not in a recipe, not on the home screen; a version that arrives
  later waits for the next start at the title. So after a deploy: the first start downloads it in the background,
  the next start (or the same title screen, if the download finishes before she taps play) switches it on.
- Precache revisions: only Vite's own hashed files (`assets/index-XXXXXXXX.js`) skip the content revision
  (`dontCacheBustURLsMatching` in vite.config.ts). The game's art and sounds also live under `assets/` but keep their
  names when they change, so they carry an md5 revision and a changed file is really re-downloaded.
- `.gitattributes`: text files are LF everywhere (also in the Windows working copy), art and sound are binary, so a
  local build and the GitHub Actions build produce the same revisions and the same SVG sha1s.
- The `github-pages` environment only lets `master` deploy (a branch policy; it was set to `main` at first and
  the first run was rejected). Git pushes use gh as the credential helper for that one command:
  `git -c credential.helper= -c 'credential.helper=!"C:/Program Files/GitHub CLI/gh.exe" auth git-credential' push origin master`.
- Harness against the deployed build: `scripts/harness.js` is not deployed; load it from
  `https://raw.githubusercontent.com/yonatan1feldman-prog/kids-cooking-game/master/scripts/harness.js`. The build
  minifies class names, so first override `__step` to read the step type from the recipe
  (`sc.recipe.steps.find(s => s.params === sc.step.params).type` -> 'RollStep' etc.). Start `__auditRun` without
  awaiting it and read the result from a window variable in later short calls (45 s tool limit). A tab that stays
  hidden for minutes gets its timers throttled until nothing moves: open a fresh tab.

## Testing notes for agents
- Use `scripts/harness.js` (served by the dev server). Details and pitfalls: Handoff notes, section 1.
- **Voice timing without sound:** `__voSim(true)` (core/audio.ts `Voice.simulate`) ends every line after its file's
  real length on the game's clock (virtual under the harness), so voice logs are exact in the hidden window. Round 5b
  helpers: `__fullRun5(demos, 'child' | 'fast' | 'none', picks)`, `__auditRun5(w, h, picks)`, `__robust5(how)`,
  `__tour5b(w, h, tag)`, `__voCheck(log)`, `__yourTurnTest()`; `window.__pickOrder` / `__shareTo` steer the gestures.
  Long runs: start without awaiting and read the result later (45 s tool limit). The page's memory grows with every
  `__setup`: after a few long runs open a fresh tab (check 2 GB free first).
- In an automated Chrome whose window is hidden, requestAnimationFrame doesn't run. The harness drives frames
  with `game.loop.step(t)` and replaces `Date.now` with the same virtual clock BEFORE any scene starts
  (the TweenManager uses its own `Date.now` clock and freezes if it runs behind).
- Synthetic `mouseup` must be dispatched on the canvas (not on window) for Phaser to see it.
- Desktop Chrome has no touch listeners. The harness calls `game.input.onTouchStart/onTouchMove/onTouchEnd/
  onTouchCancel` with fake events.
- Nothing replaces a real finger on a real phone. Always list what still needs a hands-on check.
- **Audio in the automated Chrome:** synthetic touches are not a user gesture, so the AudioContext stays suspended
  and voice lines only "end" by their safety timer. One real click (the computer tool's left_click on the play button)
  unlocks it for the rest of that page's life. For a voice log, play in real time (`__real`), see Handoff notes.

## Handoff notes (written for the next agent; visual round 4 (the living window), the puzzle, gameplay round 3, the final QA round, the guests round, gameplay round 2, round 14 (polish) and round 13 (skewers) on top; rounds 2-12 below still hold)
### 000000000000000. Visual round 4 (the living window)
The owner asked for "birds flying past the window, and anything that makes the scenery nicer". `core/scenery.ts`
(`addScenery`, called by `addBackground`, so title, home, album and every recipe have it):
- **Birds:** every 18-34 s (first after 3-7 s) one to three birds (`kitchen-bird-up` / `-down`, 58x44, flapping 1.2 s,
  gliding 0.8 s) cross the window left to right in about 6 s. **Cloud:** one `kitchen-cloud` (156x62) drifts across at 4.5
  units/s, then waits 6-20 s. Both are cropped to the window's two upper panes (`Clipped`: one image per pane, `setCrop`,
  no mask filter), so the frame and its cross stay in front. Art: `assets-src/images-b/tools/gen_kitchen_sky.py`.
- **Sunbeam** (`fx-sunbeam`, a canvas texture drawn once, kept by `releaseRecipe`): soft light from the window onto the
  wall and counter with the window's cross as shade, depth -98 (under the board at -1), alpha 0.26, dimmed to ~45% while
  the cloud passes the sun, turning -1.5..2.5 degrees over 5 min (the afternoon).
- Runs on the scene's update, so it pauses with the scene. Costs: ~8 images and one small canvas; 3 WebPs of 4-10 KB.
- The photo's kitchen (`drawKitchenPieces`) has no birds or beam, on purpose.
- **Needs a real child:** does she look at the window instead of the step? If so, lengthen `BIRD_GAP_MS`.
### 0000000000000. The puzzle (a memory-book photo as a jigsaw)
Spec and research: `/mnt/project-files/research/puzzle-spec.md`. No new art: everything is cut and drawn at runtime.
- **Way in:** in the album, a tap on a photo enlarges it (as before) and the puzzle button (`PUZZLE_ICON`, a piece on
  the album's cream disc, `makePuzzleIcon`) stands beside it; a tap starts `Puzzle` with `{ photoId, page }`. The home
  button (two taps) and the finale both go back to the album on that page (`Album` `init({ page })`).
- **Pieces (`core/puzzle.ts`):** `cutGrid` gives every inner edge a random tab/hole; `piecePath` is the outline (a neck
  and a round head, tabs sized from the cell's shorter side); `makePieceTextures` draws each piece from the photo on its
  own canvas (cell + `pad`, light and shade edges, ink outline) and the board's guide (the photo at `TUNING.puzzle.ghost`
  with dashed outlines). Sizes by a local count of finished puzzles (`cooking.puzzles`, never shown):
  `TUNING.puzzle.grids` 2x2, 3x2, 3x3, then 4x3 for good.
- **Scene:** the whole photo shows, "Let's make a puzzle from your picture!", then the pieces fly to the tray left of
  the board (the largest size up to `trayMax` at which they fit without overlapping, clear of the home button). A piece
  grows to its board size when lifted; let go within `snap` x the cell's shorter side of its place it clicks in (click,
  pop, stars), anywhere else it floats back (over the board that is a quiet miss; 3 in a row show the hint). First
  puzzle on a device: Mom's grab hand shows one piece's way (see-through). Hint after `HINT_AFTER_MS`, help after
  `AUTO_AFTER_HINT_MS` more: "Let me help you!" and her hand puts ONE piece in (corners, border, middle), then it is
  hers again. All in: the clean photo over the pieces, jingle, stars, confetti, Mom celebrates, Pipa hops, "You put it
  all together!", back to the album 2.2 s after the line. Rotation mid-drag drops the piece back gently.
- **Touch:** every piece's touch area is at least 200 x 200 world units (x k) around its cell. On 4:3 (k 0.75) the
  12-piece board is 568 units and a cell 134 x 178.
- **Checked (cloud, virtual clock):** 20:9, 16:9, 4:3 with 12 pieces: no tray overlap, nothing on the home button,
  Mom's face or Pipa, no touch start in the strips; solved to the end and back in the album; a miss; rotation while
  held (dropped back, resumed); the idle hint and Mom's help; textures freed on leaving. Voice lines not heard by an agent.
- **Needs a real child:** is 12 pieces right at the end (`grids`)? Does she find the button beside the big photo?

### 00000000000000. Gameplay round 3 (everyone eats; a bit more to do in every step)
- **Everyone eats** (`ShareStep`): the step ends only when Mom, Pipa and the guest have each had a piece. `hungry` = who
  has not eaten (the guest counts from her invitation, before she has walked in); `mayHave(who, s)`: a second piece is
  fine while enough pieces are left for every hungry one. A piece brought to one who has eaten when it is needed for
  another comes back gently (`stillHungry`): the full one smiles and does a little squish (no "no", nobody sad), the
  hungry one opens wide and hops, Mom names her once with the recipe's own line ("Some for Pipa!", `forPet` /
  `forGuest`; her first-bite line is then not repeated), and Mom's hand shows it at once (`Step.hintNow`). Mom's help
  (`helpFor`) waits for a guest still walking in. The smoothie pours three glasses (`TUNING.smoothie.glass.count`) and
  the soup serves three bowls, so every recipe has at least three pieces. `MOUTH_REACH` 380 -> 320 (a slightly
  smaller target; right of Pipa's edge still counts).
- **More to do, never harder** (`core/tuning.ts`, age 4-5, no time pressure, hint 8 s and help 20 s unchanged): wash
  bubbles 12->14 (the fruit/veg washes +2), knead/crush/tear/lemon 3->4 presses per stage, cookie egg 2->3, stir and
  grate +600 (pancakes/soup/cake 4200->4800, salad mix 3000->3600), roll 5->6 widths (cookies 4->5, frosting 4->5),
  spread coverage 0.70->0.78, sprinkle 45->55, salt 5->6, chop 5->6 cuts (salad/soup 4->5) with a longer stroke
  (minSwipe 50->70), can 3->4 taps / swipe 80->110, jar twist 900->1100, pour 2.5->2.8 s, blend 6->7 s, pancake flip
  swipe 60->90, peel 5->6 strips (stroke 110->130), pulling out of the oven 0.4->0.55 of the way, the cut stroke
  200->260, Pipa's wishes grow sooner (choose 1,2,2 things; decorate 3,4,4,5,5).
- Harness: `__gesture` in share tries a full one once per piece (`window.__redirects`) then feeds a hungry one;
  `__fullRun5` records `window.__fed` and runs up to 12000 rounds (Mom's help to the end takes longer now).
- **Needs a real child:** does she understand the piece coming back (the hungry one hopping, Mom's line)? Are the longer
  steps still fun (the recipe's length; tune `TUNING` down if she drifts off)?
### 0000000000000. The final QA round (all eight recipes)
- **QA round 2 (after gameplay round 3, the living window, the puzzle):** Title, Home and the album each added a watcher
  for Mom's eyes on the scene's update at every visit and never removed it (the scene object lives on), so they piled
  up; now removed on shutdown. Checked flat over four Home -> recipe -> album -> puzzle cycles: update/input listeners,
  tweens, textures, heap. The window's own watcher was already clean. Harness note: with `headlessStep` the guest's
  layers load in real time while the virtual clock races, so a harness child may wait "28 s" for the guest and get
  Mom's help; with rendering on it does not happen.
- **A sound some recipe lists is loaded only for the recipes that list it** (`RECIPE_SOUNDS`). vo-cut / vo-cut-careful
  and name-tomato / name-onion were listed by the soup (and the skewers), so the pizza, salad and smoothie cut in silence
  and named no tomato or onion; the cake never said vo-temp; the pancakes' banana wish had no name. A recipe that uses
  a line or effect another recipe lists must list it too. Now a line or effect asked for but never loaded warns once:
  `[assets] voice not loaded: <key>` / `[assets] sound not loaded: <key>`.
- **Candles:** after Mom's help stood the candles up the step stayed in help mode (`auto`), so nobody could blow the
  flames out: a child who waited was stuck forever. `resumeAfterAuto()` when the flames are lit.
- Checked (virtual clock, simulated voice, `headlessStep`): every recipe with demos at 20:9 (voice in order, no overlap,
  photo in the book), with no touch at 4:3 (Mom helps to the end, home), layout audits at 20:9 and 4:3 (only the known
  finale sway and Mom's step aside), rotate and background with the mitts, the pulled dish, the knife and a fruit held,
  hint at 8 s and help 20 s later, object and particle counts flat over a whole recipe, and the update flow against two
  production builds (a new version waits through a recipe and the home screen, and is on at the next start).

### 000000000000. The guests round (who comes to eat)
The owner's idea: each meal she picks who comes to eat. Pipa stays the pet; a guest joins Mom and Pipa in `share`.
- **Data:** `src/core/guests.ts` (`GUESTS`: turtle, giraffe, penguin): layers like Pipa's (`CharacterDef` + `back` for
  the giraffe's neck), `mouthFunny`, how she arrives (`above` / `walk`), `likes` (core/tastes.ts `Likes`: what she
  loves, whether onion and pepper make her sneeze), `chew` (the turtle is 1.6x slower), her voice lines.
- **Art:** `assets-src/images-b-guests/tools/gen_guests.py` (pb.py kit + Pipa's eyes and mouths from gen_pippa.py):
  per guest body, eyes x4, mouths x4 (closed, open, chew, funny) on a 600x700 frame (feet at 684), the giraffe's neck
  (600x1200, standing on the frame's top edge) and a 240 badge each. Layers are textures at 0.75 (`GUEST_RASTER`,
  Character scales them back up); they load when `share` starts (`GUEST_LAYERS`, `loadImages`) and the two not
  invited are freed at once; the badges are in every recipe's `RECIPE_ASSETS`.
- **Flow (ShareStep):** three badges in the left column (`stage.bin(i, 3)`), "Who's coming to eat with us?" (the step
  line; demo and hint tap a badge). A tap invites (the others go); with no pick after `TUNING.guests.bringAfterMs`
  Pipa brings one at random (her bubble shows the badge, "Pipa brought a friend!"). "Look, Giraffe is here!", then the
  recipe's share line. She comes in (`Guest.arrive`: the giraffe's head down from above at `stage.guestAbove`, clear of
  the home button; the others walk in from the left edge to `stage.guest`) and is a third mouth (`eaters`,
  `nearest`; anything let go left of `stage.guestRight` is hers). Salad and soup: the big bowl and portions move right
  of her; she eats from the spoon (no serving bowl). Hint and help: the guest first when even, then Mom, then Pipa.
  All eaten: she leaves the way she came.
- **Reactions (`steps/Guest.ts`, extends Character):** Pipa's reactions with the guest's own pitch (`sfx` `rate`), plus:
  the giraffe loves green food and licks her nose after it; the turtle chews slowly and after her favourite or her
  third bite dozes off (eyes shut, a dozy smile, breathing, three sleep bubbles, "Shh! Turtle is having a little nap."),
  a bite coming near wakes her happy; the penguin sneezes at onion and pepper (her beak wide) then laughs, "Bless you,
  Penguin!", and rocks happily when she loves something. Nobody is ever sad.
- **Voice (13 lines, Kokoro af_heart, make_vo.py):** vo-guest-who, vo-pipa-brought, vo-guest-giraffe/-turtle/-penguin,
  vo-for-giraffe/-turtle/-penguin (her first bite), vo-giraffe-loves/-turtle-loves/-penguin-loves, vo-turtle-nap,
  vo-bless-penguin.
- **Harness:** `window.__guest = 'turtle' | 'giraffe' | 'penguin'` picks the badge in `__gesture`; `__shareTo` gained
  'guest' and 'alt' cycles guest, Mom, Pipa once she is in.
### 00000000000. Gameplay round 2 (the owner: "she should cut it herself; drag the mitts, pull it out")
- **Taking it out of the oven** (`BakeStep`, every baked recipe: pizza, cookies, cake, since they share the pizza's
  `mitts`): after the ding the mitts lie on the board; she DRAGS them to the oven (dropped near it or carried well toward
  it counts; anywhere else they slide back, a miss). The door opens with hot air, a mitt holds the dish's rim, Mom:
  "Now pull it out, nice and slow!" (`mitts.pull`, vo-pull-out). She drags the dish out: it follows her finger and grows
  from its oven size to its board size; let go past `TUNING.bake.pullAt` (0.4 of the way) it lands on the board, earlier
  it slides gently back in (a miss). Puffs of hot air answer the pulling. First run: Mom's hand shows each of the two
  moments once (`firstRunShow`); the 8 s hint loops it; her help carries the mitts (then gives it back), then pulls it out.
- **Cutting before sharing** (`ShareStep`, `cut: { knife, line }`: pizza, cake, pancakes): the whole dish on its board, a
  dotted guide where the next cut goes, the knife (tip-anchored, as in `chop`) beside it. Any stroke over the dish of
  `TUNING.share.cutSwipe` (200 x k) makes the next cut all the way across its line (no precision, no wrong direction),
  chop, Mom counts; 6 slices = 3 diameters (an odd number: radii). Then the pieces come apart and the share line plays.
  Demo / hint: Mom's knife hand draws the next cut (size 0.75); help: her hand cuts the rest, then sharing is hers.
- **Finale glitch fixed:** `render.maxTextures: 8` in main.ts (with 16, a crowded screen lost pieces of Mom in WebGL).
- Voice: vo-pull-out, vo-cut-slices (Kokoro, `make_vo.py mom-a`), not heard by an agent.
- **Needs a real child:** does she drag the mitts or tap them (a tap does nothing now: the hint comes after 3 taps or 8 s)?
  Is the pull clear? Is a 200-unit stroke per cut right?
### 0000000000. Round 14, the polish round ("juice", all recipes)
State: branch `claude/project-thread-k5x3u3`; `rollback-pre-juice` = master before it (see PROJECT-KNOWLEDGE.md's
pending tags). No new art or sound: everything is drawn in code (`fx-ring`, `fx-paper` in `makeFxTextures`, kept by
`releaseRecipe`). Every effect answers a touch (wellbeing rule 5):
- **Touch ripple** (`touchRipples`, recipe and home): a cream paper ring grows and fades where the first finger lands
  (not in the no-touch strips). One image per touch; never a miss or progress.
- **Mom and Pipa answer a tap on them** (`tickles`, `Mom.hit/tickle`, `Character.hit/tickle`; recipe and home; not in
  `share` / `feed`, where they are what she feeds, and not on a button). Mom: happy eyes, open smile, one sway from the
  waist, two or three hearts, a soft pop; not while she chews, demos, holds a mouth or has a mood (1.2 s gap).
  Pipa: happy face, a vertical squish-hop, `char-giggle`, hearts; only at rest (0.7 s gap). Mom's shapes are not
  assumed: `hit` is a box in her 800 frame (x 300-700, y 30-620), so her redesign keeps working if the frame does.
- **Pipa breathes** like Mom: her three layers hang from her feet (origin at `FOOT`) and rise 1.8% slowly, no inner container (the audit
  measures her as before).
- **A step done**: fewer stars (10) plus paper confetti (18 strips that flip as they fall, `confetti`).
- **A held thing swings like paper** (`sway` / `settle`): decorating's toppings and the cake's candles tilt toward
  where the finger moves them and settle when it stops.
- Considered and left out: a page-turn between steps (it would hide her dish for a moment and slow the pace), a
  squash on every ingredient (most steps already answer their own touch with a boing or bits).
- **Needs a real child:** does she find tickling Mom and Pipa (nothing points at it), and does it pull her away from
  the step for too long? Is the ripple visible under her finger on the phone?
### 000000000. Round 13 (the fruit skewers, the eighth recipe; the `thread` step type)
State: `rollback-pre-skewers` = master before the round; branch `claude/project-thread-pgpwe5`, PR to master. Research
and spec: `/mnt/project-files/research/new-stage-spec.md` (patterning: copy, then extend, then create is the order a
4-5-year-old learns it in; one new mechanic, built on the smoothie's fruit, colander, cutting and names).
- **The recipe** (`src/recipes/skewers.ts`): wash hands · wash the fruit (the smoothie's colander) · choose 3 of 4 fruits
  (Pipa's wish bubble as in every `choose`) · chop each · thread (copy Mom's AB skewer, extend ABC, make her own) · share
  the three skewers (`pieces`; each piece carries what is on it, `run.pieces[].contents`, so Pipa tastes the real fruit:
  her wished fruit = love, kiwi / mango = wow) · photo of the tray (`made`). Counts: `TUNING.skewers`, help pace
  `TUNING.help.threadEveryMs`. Art: `assets-src/images-b-skewers` (`tools/gen_skewers.py`: stick, tray, card, frame);
  anchors `ART.skewers`. Voice: 14 lines (`make_vo.py`, three soft-limited by `fix_vo_skewers.py`).
- **Checked (virtual clock, simulated voice):** layout audit on every step at 20:9 and 4:3: clean but Mom's known finale
  sway (and at 4:3 her known step aside while sharing); a child-pace run with demos: voice in order, no overlap, no forbidden
  cut, vo-watch-me / vo-your-turn / vo-cut-careful once, vo-copy, vo-same, vo-next, vo-pattern, vo-own, then Pipa loves
  her wished strawberry; a no-touch run (Mom helped 10 times) ends at home; the three thread paths (pattern taps, a drag,
  one fruit only; her own free skewer gets a line only when it is a real pattern, the step's praise follows anyway);
  rotate and background with a fruit and a skewer held mid-drag: dropped, kept, finished (background's idle clock is
  the harness artefact of round 7); smoothie and pizza regression runs: home, no voice problems. Screenshots:
  `/mnt/project-files/research/screens-skewers/`.
- **Harness speed in the cloud:** with SwiftShader every rendered frame is slow (a whole audited recipe took ~25 min).
  For runs that need no pixels, `game.loop.callback = game.headlessStep.bind(game)` first makes them take seconds; the
  step times it logs are then inflated (captures and image decodes wait in real time while the virtual clock runs), so
  measure a recipe's length with rendering on.
- **Needs a real child:** does she copy Mom's skewer or just tap? Is "What comes next?" clear? Tapping vs dragging a fruit.

### 00000000. Round 12, the gameplay round (after she played: "too simple, too short")
State: `rollback-pre-gameplay` = master before the round; branch `claude/project-thread-dsv460`, PR to master. Research
behind it: `/mnt/project-files/research/gameplay-research.md` (Toca Kitchen, Dr. Panda, Sago Mini: what keeps 4-5-year-olds
playing is funny answers to what they did, choice, and a result that differs; not more presses).
- **Less help:** hint 8 s (was 5), help 20 s later (was 10), Mom's demos only on the first run (was two). Title and
  home keep 5 s (`SCREEN_HINT_MS`).
- **The living kitchen** (`core/kitchen.ts`): 12 pieces of the wall (3 jars, the basil, ladle, whisk, spatula, pan, 3
  copper pots, the sun) are their own SVGs (`assets-src/images-b/tools/gen_kitchen_live.py`, same code and seeds as
  `gen_kitchen.py`, viewBox = their box in the 2400x1080 frame), and `bg-kitchen-landscape` no longer has them;
  `addBackground` lays them over it everywhere (the photo too: `drawKitchenPieces`). In a recipe a tap makes one answer
  (a jar hops and puffs, the basil wiggles, a utensil or pot swings, the sun spins): first finger only, not in the
  no-touch strips, not where a button is, never a miss or progress. A new background must keep those spots or update
  `KITCHEN_PIECES` (box, pivot).
- **Pipa's tastes** (`core/tastes.ts`, `Character.react`): after chewing, what was on the piece decides her answer:
  her wish = love (hop, hearts, `char-yay`, Mom "Pipa loves it!" once), onion/pepper = a sneeze that ends in a giggle
  (`pipa-sneeze`, Mom "Bless you, Pipa!" once; at most `TUNING.taste.maxSneezes`), mushroom/olive/chocolate/syrup/icing/
  kiwi/mango = wow, anything else = giggle, nothing on it = the old munch. What is on each slice: `Dish.placed` (recorded
  at the capture) by wedge angle; cookies by `on`; portions and glasses: the chosen things in turn.
- **Pipa's wishes** (the small challenge, `Character.showWish`): a thought bubble over her head. `choose`: 1 option (2
  from the third run) to find; Mom "Look! Pipa wants..." + its name; found = the bubble bursts, Pipa overjoyed, "Just
  what Pipa wanted!"; Mom's hint and help go to it first. `decorate`: N of one thing (3, 3, 4, 4, 5 by run), Mom says the
  number (and the name if there is one), counts each one put on, at N the wish comes true. Not doing it changes nothing:
  the bubble goes quietly when the step ends. Not shown where Pipa is off screen (4:3). Tuning: `TUNING.wish`.
- **Voice:** vo-pipa-wants, vo-pipa-got-it, vo-pipa-loves, vo-bless-you (Kokoro, `make_vo.py mom-a`); Pipa's
  char-yay / char-giggle / char-wow (the sound agent's candidates) and pipa-sneeze (`make_pipa_sneeze.py`). None heard
  by an agent: the owner's ear decides.
- **Needs a real child:** does she notice the bubble and look for the thing? Is counting to 5 on the pizza fun or a chore?
  Does she laugh at the sneeze? Does she discover the kitchen (nothing points at it, on purpose)?

### 0000000b. Round 11 (visual polish, part 1)
From a visual audit (20:9 screenshots of the pizza and the salad). All art changes were made in the cloud with the
generators in `assets-src/*/tools` (they reproduce the delivered SVGs byte for byte), then baked (`__bakeWebp(keys)`).
- **Mom's pointing hand** (`point_hand` in `images-b/tools/gen_mom.py`; the old `pointing_hand` stays for Pipa): a
  natural index finger out of the knuckle line, the other fingers one soft fist, the thumb across it. Used by
  `mom-arm-left` and `mom-hand-point` (anchor (100,100) unchanged). The pointing arm is almost straight now, out of its
  sleeve at the shoulder (it used to rise from the collar with the sleeve hanging under it); the fingertip stays at
  `FINGERTIP_L` = (37, 378) = `ART.mom.fingertipL`.
- **Two new arm poses** (same pivots and frame): `mom-arm-right-rest` (hand on the hip, her pose while she works; the
  wave `mom-arm-right` only for hello, a step done, the finale) and `mom-arm-left-reach` (down to the counter, out of the
  frame). `Mom.followHand(() => hand.active)` (RecipeScene): while her demo hand shows, the pointing arm reaches down,
  so the hand reads as hers (no more three hands); back up 700 ms after it goes. Poses cross-fade in 160 ms.
  `celebrate()` points at the photo (-12°) instead of swinging the arm +55° off the screen.
- Sauce brush (`makeBrush`): a seeded paper grain, one tint for every stamp (the darker stamps showed scalloped edges).
  Dents: warm tint, alpha 0.5, at most two. `cheese-handful`: a heap of shreds, not a yellow disc. Bowl fronts
  (`prep-bowl-front`, `salad-bowl-front`): the torn edge only below the rim (`FRONT_LOW`), no seams at the sides.
  `kid-hands`: slimmer fingers, shorter thumbs. `mom-hand-press`: no bead row of knuckle lights. Choose: items fit 0.84
  of the bin wide, 0.80 high. Grater 50 higher, cheese block 0.95.
- **Open:** in the cloud's software WebGL (SwiftShader) the cut slices on the chopping pile lose rectangular pieces;
  with the Canvas renderer they are whole. Check on the phone before touching ChopStep. Not done yet: the kitchen
  background (the counter reads as a wall), `mom-hand-roll`'s knuckle beads, the title/home hint hand (Mom still points).

### 0000000. Round 9 (the memory book; the soup and the birthday cake)
State: `rollback-pre-album` = master before the round; `round-9-album` merged and tagged `v0.10-album`;
`rollback-pre-soup`, `round-9-soup` -> `v0.11-soup`; `rollback-pre-cake`, `round-9-cake` -> `v0.12-cake`.
- **The memory book** (`src/core/album.ts`, `src/scenes/AlbumScene.ts`): at every finale `PhotoStep` snapshots the photo
  it has just shown (`PHOTO_KEY`), shrinks it to 420 px, encodes it as WebP (~20 KB) and files it in IndexedDB
  (`cooking-album` / `photos`) with the recipe's id and the date. At most `ALBUM_MAX` = 40; the oldest goes quietly.
  Every failure (no IndexedDB, a private window, a full disk) is swallowed: the finale never waits for it and never
  changes. `albumCount()` is the count as last read (refreshed once in BootScene, kept up to date by `keepPhoto`), so
  the home screen can decide synchronously.
- **Home:** with at least one photo the album button takes one more cell in the same card grid (`S.card(n, n + 1)`):
  never an empty slot waiting to be filled. Its picture is drawn in code (`makeAlbumTextures` in placeholders.ts:
  `ALBUM_ICON`, `ALBUM_ARROW`), text-free like everything she touches.
- **The album scene:** four photos a page (2 x 2, in `S.albumArea`: right of the home button, left of Mom's face),
  newest first, each in the frame of its own recipe (taken from that recipe's `photo` step, so a new recipe needs
  nothing here). Arrows only when there is more than a page. A tap enlarges a photo, another tap puts it back. The
  home button (two taps) goes back. Mom and Pipa stand beside it. No counters, no empty slots, no rewards.
  Frames are loaded on demand (`loadImages` / `releaseImages` in BootScene) and freed when the book closes, as are
  the photo textures. Harness: `game.scene.getScene('Album').shown` = { page, pages, count, recipes, big }.
- Checked: a pancake run to the end, its photo in the book in the pancake frame and still there after a reload; a
  salad run beside it, newest first, both frames right; paging, enlarging and back; 20:9 and 4:3 on the home screen
  and in the book; no console errors, no placeholders.
- Found and fixed: with three columns every frame came out at scale 0.37 (the room left of Mom is only ~1150 units
  wide), so a page shows four bigger ones; a single photo was sized in a three-column cell instead of the free room.

- **The vegetable soup is data** (`src/recipes/soup.ts`, tag `v0.11-soup`, `rollback-pre-soup` before): wash hands ·
  wash the vegetables (the salad's colander) · choose 3 of 5 (carrot, potato, onion, zucchini, tomato) · peel the ones
  with a skin (new type) · chop each · everything into the pot (open-pour `sources: ['chosen']`, pot-heap-1..3) · the
  water (`water-jug`) · salt · light the stove and stir it cooking (stir's new `stove` phase, soup-stage-1..3) · a ladle
  to each bowl (share `portions`, slurp) · photo. Counts: `TUNING.soup`. Reference shots:
  `../cooking-game-assets/images-b-soup/shots/`.
- **New step type `peel`** (`steps/PeelStep.ts`, `PeelParams`): the vegetable lies on the cutting board exactly where
  `chop` puts it, under a layer of peel (`skin`: the whole vegetable's own viewBox, aligned to its body). The peeler
  follows the finger; every `minSwipe` of travel along it, in either direction, takes off one of `strips` bands (that
  band of the skin goes, a curl flies off, the `peel` sound). All off: `doneLine` and on. She cannot fail: no wrong
  direction, place or speed. Demo and help: `mom-hand-grab` carrying a see-through peeler. Anything with a skin (a
  potato, an apple, a cucumber) is the same type with other pictures.
- **Round 9 also generalised, each optional:** a `choose` option's `prep` may be several steps in order
  (`prepSteps` in recipes/types.ts), so the carrot and the potato are peeled before they are cut; `stir` gained
  `stove` (a tap on the knob lights the flame under the pot first, `vo-stove`), `cook` (the bake loop while she stirs
  and steam as an answer to it) and `doneLine`; `MomHandView.follow` can carry props, like `play`.
- **Checked (virtual clock, simulated voice):** 182 s at child pace with demos (the smoothie is 173, the cookies 178),
  voice in order with no overlap and no help needed; salad regression clean; layout audits clean on every step at 20:9
  and 4:3 (only Mom's known finale sway); rotate and background while the peeler, the spoon and a ladle were held:
  dropped, kept, finished; the soup's photo reaches the memory book in `photo-frame-soup`. No placeholders, no silent
  sounds, no console errors.
- **Found and fixed:** Mom's help at the stove knob lit it but never gave the step back to the child
  (`resumeAfterAuto`), so the stirring could never start; the peeler was first sized off the board (a gadget, then
  longer than the carrot) — it is now `BODY_SHARE` of the vegetable's own body; the knob's touch area was only its
  drawing; the bins waiting to pour into the pot shrank to 93 units, so the cooktop takes the salad bowl's 0.62 share
  of the work area, not 0.70; the potato and zucchini bins use the delivered `veg-*-slice` art (`fitOf` sizes a 240
  frame down to the bin's 140) instead of two icons that were never drawn.
- **Needs a real finger:** the peeling stroke (is any direction really enough? `TUNING.soup.peel.minSwipe`), picking
  up a waiting bin (124 units wide) and carrying it over the pot, and the stove knob in the bottom-right corner.

- **The birthday cake is data** (`src/recipes/cake.ts`, tag `v0.12-cake`, `rollback-pre-cake` before): wash hands ·
  flour, sugar and milk into the prep bowl · the egg · stir through cake-batter-0..3 · the bowl tipped into the pan
  (open-pour `glasses`, count 1: `cake-pan` -> `cake-pan-full`) · bake at 200 with the mitts (`startsAs` the full pan,
  `becomes` the baked cake on its plate) · choose 1 of 3 frostings (each pick carries a `tint`) · spread `frosting-blob`
  tinted by it (`tintFrom: 'chosen'`, `makeBrush`) · decorate (sprinkles, candy, berry, choc-chip) · candles (new type)
  · share in 6 wedges like the pizza · photo of the cake with its candles alight (`madeKey`). Counts: `TUNING.cake`.
  Reference shots: `../cooking-game-assets/images-b-cake/shots/`.
- **New step type `candles`** (`steps/CandlesStep.ts`, `CandlesParams`): `count` candles wait in the left column; she
  drags each onto the cake and stands it wherever she likes inside the frosting field (`PLACE_R`), Mom counts. All up:
  Mom lights them at once (whoosh, `wishLine`); a tap on a flame or a finger drawn across them puts them out one by one
  (`blow`, a wisp of smoke); the last one: `doneLine`, the jingle, stars. It keeps the lit cake in `capture` (the
  photo's picture) before they go out. Sized from the cake (`ART.cake.cakeRadius`, `size` 0.62), the flame and the smoke
  stand on the wick by their own foot (`ART.cake`). Cupcakes, a cake for Pipa: the same type with other pictures.
- **Round 9 also generalised (the cake), each optional:** `bake` `startsAs` / `becomes`; `choose` option `tint`;
  `spread` `tintFrom` (its own `blob` becomes a flat brush in that colour, `makeBrush` in placeholders.ts, `Dish.setBrush`);
  `photo` `madeKey`; `open-pour` `glasses` keeps a wide vessel and the poured bowl's picture out of the palm strip.
- **Checked:** 189 s at child pace with demos, voice in order, no help; audits at 20:9 and 4:3 clean but Mom's known
  finale sway; rotate and background with a candle and a wedge held: dropped, kept, finished; pizza regression clean;
  the lit cake reaches the memory book in `photo-frame-cake`. No placeholders, no silent sounds, no console errors.
- **Found and fixed (the cake):** the pan poured into became a "piece" and nothing went into the oven (`startsAs`);
  the candles were sized from the bin column and stood taller than the cake; Mom's help at the knob (soup) and the
  candles' celebrate sway (cut at the right edge on 20:9: `Mom.happy` instead); the poured bowl's 800-square snapshot and
  the cake pan reached into the palm strip.
- **Needs a real finger:** blowing by sweeping across the flames vs tapping each (`FLAME_TOUCH`), dropping a candle near
  the cake's rim (it is pulled inside), the frosting tubs' taps.
- Precache: 17.8 MB after the soup (461 files); see the cake's commit for the final count.

### 000000. Round 8 (loading by recipe; the smoothie, the fourth recipe)
State: `rollback-pre-round8` = master before the round; `v0.7-infra` = loading by recipe + the background fix (see
"Asset contract"); `rollback-pre-smoothie`, branch `round-8-smoothie` merged and tagged `v0.8-smoothie`.
Reference shots: `../cooking-game-assets/images-b-smoothie/shots/` (README-smoothie.md: jar mouth, seat, lip, base
button, glass fill rows).
- **The smoothie is data** (`src/recipes/smoothie.ts`): wash · wash the fruit (`colander-fruit`) · choose 3 of 4 fruits
  (names) · chop each (fruit profiles in vegArt.ts) · into the jar (open-pour `sources: ['chosen']`, jar-heap-1..3) ·
  milk (`milk-carton`, `milk-drop`, the kept jar) · blend (new type) · pour into two glasses (open-pour `glasses`) · share
  the glasses (`pieces`, slurp) · photo (`made`). The jar stands on its base on `stage.blenderJar` / `blenderBase`.
  Counts: `TUNING.smoothie`. Harness: `__robust8(recipe, moments, how)`, `__smoothieMoments()`, `__recipe = 'smoothie'`
  for `__fullRun5` / `__auditRun5`; `__blendTaps = true` blends by taps instead of holding.
- **Checked (virtual clock, simulated voice):** child pace with demos 173 s card to home (cookies 178 s), voice in order,
  no overlap, no help needed; salad fast regression home, clean. Layout audit on every step at 20:9 and 4:3: clean but
  Mom's known finale sway. Rotate and background mid-blend (finger on the button) and mid-drag of a glass: dropped,
  kept, finished.
- **Found and fixed:** the recipe screen's update ran before its art had loaded (dev links, a rotation during loading);
  the glasses were tiny (sized from the salad's waiting area); the blender small; fruit slices huge on their bins; the
  harness's rub path started above a colander's touch area (the salad's too: its runs needed Mom's help).
- **Needs a real finger:** holding vs tapping the blender button (does she hold it?), dragging the heavy-looking jar over
  a glass and keeping it there, carrying a glass to Pipa.
- Precache: 17.2 MB (420 files) after the pancakes; the service worker still precaches every recipe (only memory is per recipe).

- **The pancakes are data** (`src/recipes/pancakes.ts`, tag `v0.9-pancakes`, `rollback-pre-pancakes` before): wash · flour
  (the cookies' flour layer) and milk (`pancake-batter-0`) into the prep bowl · the egg (the cookies' egg) · stir through
  pancake-batter-0..3 · flip (the stove, then three pancakes) · decorate the top pancake (syrup bottle puts syrup-blob,
  `sizes` 1.7; berry, banana-coin, butter-pat) · share in 4 wedges (`cutRadius` 290/350) · photo (plate + her pancake).
  Counts: `TUNING.pancakes`. Harness: `__pancakeMoments()`, `__recipe = 'pancakes'`. Reference shots:
  `../cooking-game-assets/images-b-pancakes/shots/`. Checked: 142 s at child pace with demos (the model; a real child is
  slower), voice in order, audits clean at 20:9 and 4:3, rotate/background mid-pour and mid-drag fine, cookies regression
  fine. Found and fixed: "Now flip it!" was dropped (said now when the bubbles show), the pan's handle reached Mom's
  hand, the wedges were cut at the pizza's radius, the syrup was too small to see. Needs a real finger: holding the ladle
  over the pan, the swipe up (is a short one enough? `minSwipe`), placing syrup.

### 00000. Round 7 (the cookies, the third recipe)
State: `rollback-pre-cookies` = master before the cookies; branch `round-7-cookies` merged and tagged `v0.6-cookies`.
Screenshots (git-ignored): `docs/screenshots-round7/` (`__tour7(w, h, tag)`), to compare with
`../cooking-game-assets/images-b-cookies/shots/` (README-cookies.md has the slots, press point, oven fit).
- **The cookies are data** (`src/recipes/cookies.ts`) on the old types plus `cutters` (see "Recipes are data"): wash ·
  open-pour flour / sugar (code specks) / butter (`dropIn`) into the prep bowl on the pour spot · crush the egg over it
  (the yolk lands) · stir through batter-stage-0..3 · knead · roll (the sheet at 0.82) · cutters (six, onto the tray) ·
  bake at 150 (`vo-temp-150`, the tray in the oven, only the cookies turn golden) · decorate the cookies (four boxes) ·
  share the six cookies · photo of the decorated tray. Counts: `TUNING.cookies`. Harness: `__tour7`, `__auditRun7`,
  `__robust7`; `window.__recipe = 'cookies'` for `__fullRun5`.
- **Checked (virtual clock, simulated voice):** full run with demos at the child model's pace: 178 s from the card to
  home, voice in order, no overlap, no forbidden cut. Pizza and salad fast regression runs: home, no voice problems.
  Layout audit at 20:9 and 4:3: clean except Mom's known finale sway. Rotate and background mid-press in cutters and
  mid-drag in sharing: dropped, kept, finished (background behaves as the salad's).
- **Found and fixed:** the emptied tray stayed behind the photo frame; the egg was too small over the bowl; the flour
  specks were too small to see.
- **Needs a real finger:** picking a cutter and tapping the dough (is "the nearest free slot" what she expects?),
  dragging the butter over the bowl, the egg taps, dropping icing on a small cookie, carrying a cookie to Pipa.
- Precache: 13.5 MB (327 files). At 15 MB switch to caching per recipe (round 6's open task).


### 0000. Round 6 (the salad, the second recipe)
State: `v0.4-pizza-full` = the full pizza on master; `rollback-pre-salad` = master before the salad; branch
`round-6-salad` merged and tagged `v0.5-salad`. Screenshots (git-ignored): `docs/screenshots-round6/` (`__tour6(w, h,
tag)`), to compare with `../cooking-game-assets/images-b-salad/shots/`.
- **The salad is data on the old step types** (`src/recipes/salad.ts`): wash (hands, the pizza's own step) · wash
  `target: 'basket'` (the colander; rubbing throws `water-drop`s and makes the vegetables shine) · knead (`board:
  'cutting-board'`, the lettuce's four states, `handoff: 'bin:lettuce'` + `park`: it waits like a filled bin) · choose
  (5 vegetables, `name` on each option: Mom says the name, a newer name may cut the name playing, group 'name'; the
  pizza's options got names too; cutting still counts) · chop per pick (cucumber and carrot profiles in `vegArt.ts`) ·
  open-pour `kind: 'open'` + `sources` + `keep.fills` (drag the lettuce and each bin over the salad bowl; each pours
  `TUNING.salad.transfer.ms`; the contents rise salad-heap-1..3) · crush `place: 'over-bowl'` (the lemon held tilted
  over the bowl, `juice-drop`s) · open-pour `kind: 'open'` + `keep` (the oil bottle, `oil-drop`, drizzle) · sprinkle
  `into: 'bowl'` + `holes` (salt grains drawn in code, a shake counts one) · stir `keep` + `toolAnchor` (the servers,
  heap-3 -> salad-mixed) · share `portions` (4 portions dragged to the serving bowls in front of Mom and Pipa; crunch)
  · photo `bowl` (the mixed bowl in `photo-frame-salad`). The recipe has `board: null` (an invisible board).
- **The big bowl across steps:** `PrepBowl` knows two bowls by their back layer (`BOWLS`): the prep bowl in the middle
  (`stage.prepBowl`) and the salad bowl on the right of the prep area (`stage.saladBowl`); `stage.pourFrom` is the room
  on its left for the things poured in (and the salt shaker's rest). Each salad step `take`s it and `keep`s it.
- **Home:** `stage.card(i, n)` / `cardScale(n)`: one row up to 3 cards, else two rows (up to 8), left of Mom and Pipa.
  `Recipe.pickLine` is said on the tap. Demo counters stay per recipe (`cooking.runs.<id>`).
- **Checked (virtual clock, simulated voice):** full salad at the child model's pace with demos (cucumber, carrot,
  tomato): 190 s from the card to home, voice in order, no overlap, no forbidden cut, vo-cut-careful once. Pizza
  regression run: see the round's report. Layout audit (`__auditRun6`) at 20:9 (two pick sets) and 4:3: clean except
  Mom's known finale sway. Rotate and background (`__robust6`) mid-pour and mid-serve: dropped gently, resumed, home.
- **Found and fixed:** the colander's touch area reached the tap (it now starts at the vegetables); the first salt
  shake's grains started at the shaker's rest; the parked lettuce was tiny; the portions were crowded over the bowl
  (now a row on the counter, two rows where it is narrow); a waiting bin's touch margin touched the thumb strip at 4:3.
- **Needs a real finger:** tearing (taps on the lettuce), rubbing the colander, dragging four things over the bowl
  (1.3 s each), holding the oil bottle (1.8 s), the salt shakes (taps over the bowl), mixing with the servers,
  dragging a portion to a serving bowl (at 4:3 the two bowls are close), and whether the names ("Cucumber!") help.
- **Open task: when the precache passes 15 MB, switch to caching per recipe** (precache the shared art and the title;
  each recipe's own art and voice in a runtime cache filled when its card is first tapped). It is 11.5 MB (267 files) now.
- **Length:** the child model gives 3.2 min; a real child is slower (the pizza's model said 3.8 for a 6-8 min aim).
  If the real salad runs short or long, the knobs are in `TUNING.salad`.

### 000. Round 5, part B (choose, cut, open and pour, the oven panel, mitts, sharing, the photo)
State: branch `round-5-prep-b` (from `round-5-prep-a` at tag `rollback-pre-prep-b`), not merged, not pushed. Commits:
stage 1 (the simulated voice clock, vo-your-turn), 2a-2g (one per step type: choose, chop, open-pour, decorate with
the chosen toppings, bake extended, share, photo), 3a-3c (voice rule, fixes from the audit and the full runs, the
photo fix), then this AGENTS update. Screenshots of every step (Mom's demo and the child mid-gesture) at 20:9 and 4:3:
`docs/screenshots-round5b/` (git-ignored; `__tour5b(w, h, tag)`), to compare with
`../cooking-game-assets/images-b-prep/shots/final-*-2400.png` / `-1440.png`.
- **Assets:** the 63 voice files, 17 effects and 57 prep SVGs were identical to the sound and art agents' folders at
  the start (the corrected count-5, count-6, temp-50 were already in part A's last commit); nothing to re-bake.
- **vo-your-turn (stage 1):** `Voice.simulate(true)` (harness `__voSim()`) ends every line after its file's real
  length on the game's own clock, without sound. With it, after the first demo and no touch, the log is vo-pick-pizza,
  vo-watch-me, vo-wash, vo-your-turn (`__yourTurnTest`). The expiry logic had no bug: in part A's runs the hidden
  window's throttled timers made lines "end" late, so the queued line expired. In a freshly loaded page wait for
  `__voice.allLoaded` before a virtual-time run: the virtual clock outruns the decoding, and a line whose file is not
  decoded yet is skipped.
- **The voice rule:** no line cuts another any more (praise, vo-help, vo-oven, vo-ready, wash-done, vo-hello,
  vo-pick-pizza used to cut). Only `count-*` and `temp-*` cut their own kind (`group`); counting keeps its order
  (`sequence`). Checked by `__voCheck` in every run (overlaps, cuts other than that exception).
- **Full runs (virtual clock, simulated voice, `__fullRun5`):** with demos at a child's pace (tomato, corn, olive):
  231.5 s from the card tap to home; without demos (mushroom, pepper, onion): 216.7 s; no touch at all (Mom helped 17
  times): 375.9 s, ends at home. All three: no overlap, no forbidden cut, in order, vo-watch-me once (demo run only),
  vo-your-turn once, vo-cut-careful once. The logs are in the round's report. The child model is an idealised child
  (650 units/s, 0.45 s between actions, 1 s to look): a real 5-year-old looks around, tries things and listens more.
- **Audit (`__auditRun5`, after every gesture too):** 20:9, 16:9, 4:3 x (tomato, mushroom, onion) and (corn, olive,
  pepper): no problems except moments inside animations: the rolling pin swinging back past the home button's reach
  (part A), the prep bowl passing the aside pizza as it moves left at 16:9 (part A), Mom's finale sway (her frame dips
  up to 15 units below the screen edge for a moment; she is cut at the waist anyway).
- **Robustness (`__robust5('rotate' | 'background')`):** in choose, chop (knife held mid-stroke), open-pour (held over
  the bowl, pouring), bake (on the panel at 150), share (a slice held) and the photo: paused, the gesture dropped
  gently, progress kept, idle clock frozen, resumes and finishes, ends at home. A touch during Mom's demo ends it and
  counts (choose: a pick; chop: a cut). Quick taps on the temperature buttons (8 in 1 s): stops at 250, only the
  newest number is said. All six slices to Mom, or all to Pipa: accepted, the other stays smiling.
- **Found and fixed in testing:** count-1 was dropped behind "Careful fingers!" (counting now waits in order); the
  third waiting bin sat on the first; the resting knife's handle left the screen at 16:9; Pipa's container kept her
  small scale when an older tween ran over `moveTo` (then jumped big over Mom's chin at 16:9): `moveTo` now kills
  older tweens and sets the new resting size at once; the photo's temporary images were destroyed before the
  DynamicTexture drew them (the window was empty with a real pizza); a voice `done` after leaving the scene started
  the photo in a dead scene (`Step.aborted`).
- **Service worker:** 203 precached files, 9.33 MB (9559 KiB); all part B WebPs, voices and effects are in it.
- **Memory book (not built, how to add it later):** the photo is the texture `photo-made` (`PHOTO_KEY` in
  PhotoStep.ts), size = the frame's window (about 513 px at 20:9). To keep it: in `snap()`, after `makePhoto`, call
  `dt.snapshot((img) => ...)` (as `Dish.capture` does), turn the image into a JPEG blob on a canvas (`toBlob`, quality
  0.85, about 60-100 KB), and store it in IndexedDB (a store `photos` with `{ recipe, date, blob }`), on the device
  only, never sent anywhere. A book screen (a new scene from the home screen) would list them. Before building it,
  check the wellbeing rules: no counting of photos, no "come back to fill your book", nothing that rewards returning;
  the owner decides. `navigator.storage.persist()` would keep the photos when the browser clears space.

### 00. Round 5, part A (the prep steps): what changed and how to check it
State: branch `round-5-prep-a` (from `master` at tag `rollback-pre-prep`), not merged, not pushed. Commits: stage 1
(five fixes + infra), stage 2 (assets), stage 3a-3d (wash, knead, crush + stir, grate + handful), stage 4 (verification,
harness, docs). Part B (choosing toppings, cutting, cans and jars, oven temperature, sharing the pizza) is the next
round; its art and voice are already in the repo (`NOT_LOADED` in assets.ts; the lines are listed in the asset contract).
Screenshots of every step (Mom's demo and the child mid-gesture) at 20:9 and 4:3: `docs/screenshots-round5a/`
(git-ignored; `__tour5(w, h, tag)`). Compare with `../cooking-game-assets/images-b-prep/shots/final-*-2400.png` / `-1440.png`.
- **Fixes:** vo-watch-me / vo-your-turn only with the run's first demo (`run.demoTalkDone`); a demo first lets Mom
  finish her current line (`DEMO_WAIT_MS`), and the step's real tool is hidden only when her hand starts
  (`onDemoStart`); praise from a shuffled deck (`Voice.praise`; the deck carries across runs); title: play button at
  once, logo + Mom + Pipa fade in (`TITLE_ART` group in Boot, `titleArtReady()`), the tap: vo-hello + `Mom.wave()`,
  Home after 900 ms (the title no longer rebuilds on the fullscreen resize after the tap: `canRelayout`); home:
  vo-what-make; the 5 s pointing-hand hint on title and home (`screenHint`); the safe update (see "Deployment");
  the manifest name; `.gitattributes`.
- **Precache revisions:** before this round every art and sound file under `assets/` had `revision: null`
  (vite-plugin-pwa treats `assets/` as hashed), so a changed sound or WebP with the same name would never have reached
  an installed app. Now only Vite's hashed chunks skip the revision (`dontCacheBustURLsMatching`). 203 files, 9.3 MB.
- **First deploy of this round:** the phone runs round 4's code, which cannot switch the new waiting service worker
  on (and the new one has no skipWaiting). The new version therefore arrives only after the app has been fully closed
  once (all windows); from then on every update is switched on at the title screen. Checked against a local build.
- **Voice/sound:** new keys in `VoiceKey`; a voice line is any file in `voice/` (count-*, temp-* too); `waterLoop`
  (0.35) next to `bakeLoop`; effect gains for the new files in sfx.ts (MIXING.md). All 50 new files exist: no sound missing.
- **Harness (`scripts/harness.js`):** `__type()` (the recipe step type; knead and crush share `PressStep`), `__to(type)`,
  gestures and audit for the new steps (`together` = pairs drawn together on purpose: sink/faucet, board/dough,
  grater/block; Pipa may stand in front of the sink rim as in the art agent's scene); `__real` hops through a
  MessageChannel (a hidden tab throttles setTimeout to once a second); `__fullRun(demos, 'fast' | 'child' | 'none')`
  (child = 650 units/s drags, about 0.5 s between actions; it fakes `visibilityState` so the hidden window doesn't hold
  the sound); `__tour5`; `__saveShot(name, dir)` (the dev server's `/__dev/shot?dir=screenshots-roundN`).
- **Checked in round 5 (automated Chrome):** audit clean at 20:9, 16:9 and 4:3 in all 11 steps; a full run with demos
  at a child's pace (236 s from the card tap to home), a full run without demos, a full run with no touch (Mom helped
  12 times, ends at home): voice logs without overlaps, in order, vo-watch-me once, the praise decks complete; rotation
  and background in the middle of wash, knead, crush, stir and grate (the gesture is dropped, everything pauses, the
  idle clock is frozen, progress is kept, it carries on); a touch mid-demo ends it and counts; the update check at the
  title (applied, reloaded), after the play tap (waits, no reload on home or in a recipe), at the next start (applied).
- **Hidden-window artifact (again):** the automated window reports `visibilityState: hidden` even after resizing, so
  the AudioContext never runs there and lines "end" by their throttled safety timer: logged durations are long and a
  queued "Now you try!" can expire before it plays. Order and no-overlap are what count.
- **Open points (part A):** see "6. Open points" below, first block.

### 0. Round 4 (cooking with Mom): what changed and how to check it
State: branch `round-4-mom` (from `master` at tag `rollback-pre-mom`), not merged, not pushed. Commits: stage 1 art +
WebP, stage 2 Mom / Pipa / demos / voice manager, stage 3 sound files, stage 4 wellbeing rules, then this AGENTS update.
Screenshots of every step, with demos, at 20:9 and 4:3: `docs/screenshots-round4/` (git-ignored; `__tour`).
- **Load time** (desktop Chrome, this computer): SVGs rasterized at load took 2581 ms (images) / 3066 ms (to the title).
  With the WebP files and the title loading only its 4 images first: production build, first visit 1474 ms to the
  title (963 ms images); from the service worker cache 1.8 s (the rest is texture creation / GPU upload of ~20
  megapixels in the hidden automated tab). Since then the title waits only for bg, play button, star and card.
- **Voice** (`core/audio.ts`): `voice.say(key, {queue, ttlMs, valid, done})`. Default: waits for the current line;
  `queue:false` cuts it (50 ms fade). A waiting line is dropped after `ttlMs` (2.5 s) or when `valid()` is false, so a
  line never plays late. `voice.praise()` picks vo-praise-1..7, never the same twice in a row. The analyser level
  drives Mom's mouth. A real-time safety timer ends a line if the context can't run (audio locked), so Mom never
  "talks" forever. `holdAudio('rotate'|'hidden', on)` stops the line, suspends the context, resumes after.
- **Demos** (`Step.intro`, `Step.demo()`): the first two runs per device (`cooking.runs.<id>`). A scene-level
  POINTER_DOWN ends the demo (the step's own handler still gets the touch). `onDemoEnd()` / `HandMotion.onStop` undo
  what the demo hid (the roll demo hides the real pin while Mom's prop pin rolls).
- **Help** (`Step.help()` -> vo-help + `autoFinish()`): every step's autoFinish shows Mom's hand doing it
  (`hand.follow(kind, () => point)` or `hand.play`). A whole recipe with no touches ends at Home (Mom helped 7 times).
- **Stage table additions** (`core/stage.ts`): `mom`, `momFace`, `pet` (null below 1700 wide), `feedPet`,
  `feedMomShift`, `feedPetLeft`. Pipa's small scale shrinks to fit between the pizza and Mom's face (0.362 at 16:9).
  The oven is at most 90% and at Y(612): the new oven art is opaque from y 20, and at 95% its top touched the home
  button's touch area at 20:9.
- **Harness additions** (`scripts/harness.js`): `__demos(on)`, `__waitDemo()`, `__demoAt(w,h,step,ms)` (stops ms into
  that step's demo), `__real(ms)` (real-time stepping), `__voReport()`, `__fullRun(demos)` (voice log of a real-time
  run), `__saveShot(name)` + `__tour(w,h,tag)` (PNG of the game canvas into docs/screenshots-round4 through the dev
  server's `/__dev/shot`). The audit also checks Mom (without her arms) and Pipa (not over the pizza, not over
  Mom's face, not in the strips). `__gesture` waits 5.7 s after the oven drop (bake is 5 s now).
- **Checked in round 4** (automated Chrome): audit clean at 20:9, 16:9, 4:3 in every step; finale stars never over
  a face (0 of 17 at each ratio); full recipe with and without demos, voice logs without overlaps or praise repeats;
  a touch mid-demo ends it and counts (roll progress 0.55 from that drag); rotation mid-demo and mid-line (line cut,
  scene paused, idle clock frozen, resumes); background (line dropped, context suspended, resumes); Mom's help;
  capture and slices (`pizza-slice-made-*`, tint FFD49A); music 0.22 -> 0.11 while speaking -> 0.22; bake loop 0.4.
- **Hidden-tab artifact:** in the automated Chrome, `onended` of a line can arrive late (a 0.9 s line logged as 3 s),
  so logged durations are longer than the files. The order and the no-overlap check are what count.

State: branch `round-2-landscape` (from `round-1-pizza`), full pizza recipe in landscape, locked, with a rotate screen.
Round 3 (deploy): merged to `master` (tag `v0.2-landscape`), served under `/kids-cooking-game/`, published to
GitHub Pages (see "Deployment"). New work starts on a new branch from `master`.
Rollback tags: `rollback-start`, `rollback-pre-assets`, `rollback-pre-landscape` (the portrait game).
Screenshots of the last full run at 20:9, 16:9 and 4:3 (every step, plus the rotate screen) are in
`docs/screenshots-round2/` (git-ignored, local only). `docs/screenshots-round1/` are the old portrait references.

### 1. Test harness (`scripts/harness.js`, automated Chrome, no real finger)
The Chrome window used by the browser tools is hidden, so `requestAnimationFrame` never fires and the game only
moves when the harness steps it. Right after navigating to `http://localhost:5173/kids-cooking-game/`, run (JS tool):
```js
eval(await (await fetch('scripts/harness.js')).text());
await __setup(900, 405);   // container size in CSS px = the ratio to emulate: 900x405 = 20:9, 720x405 = 16:9, 640x480 = 4:3
```
`__setup` shrinks `#game`, installs the virtual clock (once), waits (stepping frames) until Boot has loaded the art and
started Title, then restarts at Title. Keep the container inside the viewport (its height changes between sessions).
Helpers (all coordinates are WORLD units; `__S` converts to CSS px):
- `__tick(ms)`, `__run(ms)`: advance virtual time. `__touch(type,id,x,y)`, `__tap(x,y)`, `__drag(pts, {hold})`.
- `__R()` = the Recipe scene (`__R().step`, `__R().ctx.dish`, `.character`, `.stage`, `.hand`), `__step()` = step class name.
- `__start()`: Title -> Home -> Recipe. `__gesture()`: one round of whatever the current step expects.
  `__to('FeedStep')`: plays until that step is current.
- `__audit()`: checks the current step: nothing cut off (opaque art extents), no touch area in the no-touch zones,
  no two items overlapping (visuals, and touch areas except the dish itself). `__auditRun(w, h)`: a whole recipe at
  that size, auditing every step. All three ratios returned no problems at the end of round 2.
- `__shotAt(w, h, what)`: screenshot tour, call in order 'title', 'home', 'roll', 'spread', 'sprinkle', 'decorate',
  'bake', 'feed' and take a screenshot after each (mid-gesture states keep the finger down).
- Rotation: set `#game` to a portrait size and `window.dispatchEvent(new Event('resize'))` (the orientation guard also
  uses a ResizeObserver, which may not fire in a hidden tab).
Timings (virtual ms): Title tap -> Home 1300; card tap -> Recipe ready 1600; between steps 800 + the step's ending
(roll ~1500, spread 1800, sprinkle 1800, decorate 2500 after done, bake: drag 480 + bake 3500 -> tap oven -> 2600,
feed 1200 per slice, party 3800 -> Home). Idle: hint at 5000 (decorate 15000), auto-finish 10000 later (decorate 30000).
Harness pitfalls:
- The JS tool call times out at 45 s (the script keeps running in the page). A whole recipe takes ~3 s real time.
- Any source edit (including `scripts/harness.js`) makes Vite reload the page: navigate again and re-run `eval` + `__setup`.
- `__yield` uses a MessageChannel (hidden-tab `setTimeout` is throttled to 1 s); each message releases every waiter and a
  timer backs it up, because a lost message once stalled a loop.
- While loading, Boot's status is LOADING and `scene.isActive('Boot')` is false: never restart scenes before Title is active.
- Screenshots: the zoom tool's coordinate frame is NOT CSS px. Region = CSS rect x (screenshot frame width / innerWidth)
  (it was 1456/1536: 20:9 -> [0,0,853,384], 16:9 -> [0,0,683,384], 4:3 -> [0,0,607,455]). A too-large region shows bands.
- The browser tools sometimes answer "Internal error" or time out without running the script. Check `__T` / `__step()` and retry.

### 2. Layout: where positions live
- `src/core/layout.ts`: `BASE_W/BASE_H` (1440x1080 EXPAND base), `PALM_ZONE` 0.08, `SIDE_ZONE` 0.04, `FIT_W` 1766,
  `getLayout()` -> `W, H, cx, cy, m, k, Y()`, `inNoTouchZone()`, `keepLayoutOnResize()`, `addBackground()`.
- `src/core/stage.ts`: the ONLY place with positions: home button, dish home, left-column spots (pin, bowl, shaker),
  bins (2 columns packed from the bottom, square cells, their 30-unit touch reach kept out of the strips and away from
  the home button), done button (above the character), oven (left of the board, scale 0.75-0.95), character (right
  column, feet near the bottom, scale 0.75-1.0 from the spare width), card grid, play button.
  Numbers there that describe the art (board 786 wide, oven body 628, character frame 600x700) are opaque extents.
- Relative distances inside steps (hit radii, lift offsets, particle sizes) are `N * k` and orientation-independent.
- A mid-scene resize doesn't re-layout the recipe: `keepLayoutOnResize` zooms the camera so the old layout stays
  visible. Title and Home rebuild themselves (they have no state).

### 3. Pizza capture and slicing (`steps/Dish.ts`, `steps/slices.ts`, `steps/FeedStep.ts`)
- `Dish.capture()` (called by DecorateStep after the done tap plus 450 ms, so the last pops have landed):
  it creates a DynamicTexture of size `2R + 24k`, temporarily moves the dish container to (0,0) at scale 1, calls
  `dt.draw(dish, size/2, size/2)` and `dt.render()`, and restores the position. Then `dt.snapshot(cb)` returns an
  HTMLImageElement, which is added as texture `pizza-made`. The layers are destroyed and the dish becomes one Image.
  `dish.madeImage` keeps the HTMLImageElement for slicing. The snapshot is NOT flipped (checked visually).
  Verified again in round 2 at all three ratios: slices are `pizza-slice-made-*`, cut from the child's pizza.
- Sensitive spots:
  - The dish must not be tweening (position or scale) at capture time. (In landscape the dish no longer moves on
    entering decorate, but the tween to `decorateDish` is still there if the stage table ever moves it.)
  - Anything added to the dish after the capture is lost (the capture is the truth from then on).
  - The capture has a 2 s safety timeout and resolves `false` on any error. FeedStep then uses `stockSlices`
    (`pizza-slice` art at scale k, tip-down art rotated to point inward).
  - The capture is taken BEFORE baking, so baking only tints `dish.base`. FeedStep copies
    `dish.base.tintTopLeft` onto every slice. Any future baked look (not only a tint) must be applied to the slices too.
  - The texture is in GAME pixels (it already includes k): show it at scale 1, not `art()`.
- `cutSlices(img, n, outline)`: for each wedge (mid-angle -90 + i*360/n) it makes a canvas the size of the wedge's
  bounding box, clips an arc path, draws the image and strokes the cut edges in ink (2x the outline width,
  half of which falls inside the clip). The origin is the apex (the pizza center). `restAngle` is 0 for real slices.
  The grab point is `sliceCenter()` (0.6 R along the mid-angle).
- Carrying (landscape): `FeedStep.carryPose()` puts the slice's middle under the finger and its tip (the origin) ahead of
  it, pointing at the mouth: angle = `restAngle + dir + 180 - midAngle`. A drop counts if the FINGER or the tip is near
  the mouth, or anywhere right of Pipa's opaque left edge (`stage.feedPetLeft`).
- The sauce is a RenderTexture inside the dish. Its stamps are recorded, and on `Renderer.Events.RESTORE_WEBGL`
  they are replayed (context loss when switching apps). After the capture it no longer matters.

### 4. Finger ownership and idle clocks (`steps/Step.ts`, `core/ui.ts`)
- Config: `input.activePointers: 3`. With 1, a resting palm grabs the only touch slot and every real touch is ignored.
- `Step.onDown` claims `owner = p` if nobody owns the step, the press is not in a no-touch zone and not on an
  interactive object. `onMove`/`onUp` only pass the owner through. The owner is cleared on its up / up-outside:
  inside `onUp` when the step registered one, and always by a `queueMicrotask` safety release registered on
  the first `onDown` (it runs after the step's own handlers). Steps get `onUp(p, cancelled)`, where
  `cancelled = pointer.wasCanceled || released outside the canvas` means "put it back gently".
- `Step.cancelGesture()` (new): calls every registered up handler with `cancelled = true` and releases the owner. Used when
  the device turns to portrait mid-gesture, so nothing stays in mid-air if the finger lifts while the game is covered.
- `iconButton` ignores presses while any other pointer is down (`otherPointerDown`), plus the no-touch zones.
  It fires on press by default. `fireOn:'up'` (play button only) fires on the release of the same pointer.
  `confirm: true` (home button): first press arms it (x1.4, wobble, 2 s timer), a second press fires. `hitPad` is in
  world units; `scale` overrides the image scale.
- Idle: `hintAfterMs` (5000) and `autoAfterHintMs` (10000) are per-step fields. DecorateStep sets 15000 / 15000.
  `update()` adds delta only while `idleOn`, and not while the owner finger is down (unless a hint is already showing).
  `poke()` = real progress (resets the clock, hides the hand). `setIdle(false)` for watch-only phases (baking).
  `miss()` x3 shows the hint immediately. `hit()` resets the streak.
  `autoFinish()` sets `auto` (input ignored). Multi-phase steps call `resumeAfterAuto()` to hand control back (BakeStep).
  While the rotate screen is up, the scene is paused, so none of these clocks run (checked: idle stayed 0 over 20 s).
- Mom's hand (`core/hand.ts`) is placed by its anchor (ART.momHands) and glows on the target only as a hint (not in
  the demo). `stop()` kills its tweens and runs the motion's `onStop`. `hand.position` is the anchor (Mom and Pipa watch it).

### 5. Phaser 4 pitfalls met here that the official skills don't mention
- The TweenManager keeps its own clock from `Date.now()` (`getDelta` in TweenManager.js), not the game loop's time.
  If `game.loop.step()` is driven with virtual time, tweens freeze. If `Date.now` is replaced after a TweenManager
  started and the new clock runs behind, the delta is negative and tweens stay frozen. Replace it once, before any scene starts.
  After a long scene pause its lag smoothing (`maxLag` 500 ms) turns the gap into one small step: tweens resume cleanly.
- Touch cancel does not have its own scene event: it arrives as `POINTER_UP` with `pointer.wasCanceled = true`.
  A release outside the canvas arrives as `POINTER_UP_OUTSIDE`. `GAME_OUT` is mouse-only and not useful for touch.
- A synthetic `mouseup` on `window` is ignored. Dispatch it on the canvas. Desktop Chrome registers no touch
  listeners, so call `game.input.onTouchStart/Move/End/Cancel` directly to simulate touches.
- `StampConfig` has `tint` but no tint mode. To paint a flat-colored silhouette (the sauce brush), recolor
  on a 2D canvas (`globalCompositeOperation = 'source-in'`) and `textures.addCanvas`.
- `DynamicTexture.draw(container, x, y)` with the container at (0,0) and scale 1 renders the container and all nested
  children, including a RenderTexture child. `dt.render()` must be called before `snapshot()`.
- Graphics `generateTexture` and `textures.addCanvas` textures expose a canvas via `getSourceImage()`. That is how
  `opaqueBounds()` measures the mouth position from the art (no GPU readback).
- `getBounds()` of an image inside a container already includes the container's transform (world bounds).
- `sound.play()` returns false when it can't play (e.g. still locked). For a chain like jingle -> cheer, use
  `sound.add` + `once('complete')`, with a timer fallback (`sfxThen`).
- Browser rule (not Phaser): on Android, fullscreen, AudioContext.resume, orientation lock and wake lock need a user
  activation. `touchend`/`pointerup` gives one; `pointerdown` on touch does not. Hence the play button fires on release.
  `screen.orientation.lock()` only works in fullscreen or an installed PWA; elsewhere the rotate screen does the job.
- Scale EXPAND: after the parent element changes size, dispatch a window `resize` event; the polling alone didn't catch it.
- SVGs are not loaded with `this.load.svg`. `core/svgRaster.ts` fetches, sets width and height to the native viewBox size,
  rasterizes to a canvas and calls `textures.addCanvas`. This gives exact native-size textures and a clean fallback.

### 5b. Open points after round 5, part B (part A's list follows)
- **Length:** the idealised child model takes 3.6-3.9 min from the card to home (231 s with demos, 217 s without),
  under the 6-8 min aim; nothing was changed for it. If a real run is short too, the tuning table's knobs are
  `chop.cuts` (5), `share.slices` (6), `pour.ms` (2500), `open.twist` (900), `knead.pressesPerStage` (3),
  `wash.bubbles` (12), `sprinkle.count` (45). If it runs over 8 min, the same knobs downwards.
- **Needs a real finger and a real ear:** the knife stroke (a 50-unit move down counts: short enough? does she
  "saw" sideways instead? the knife glides to the cut line); holding the can over the bowl for 2.5 s in total; the jar's
  rubbing (900 units); the temperature buttons (240 units at 20:9, 212 at 16:9) and whether she links the number,
  the colour and Mom's voice; "Oops, too hot!" (gentle, but it names a mistake: the owner may prefer another line);
  the mitts (a tap puts them on: does she understand without dragging them?); dragging a slice past Pipa to Mom;
  the photo's flash (380 ms at 0.9 white: strong enough, not too strong); the counting voice when she cuts fast
  (a newer number cuts the one playing).
- **Numbers on screen:** the oven panel prints 50-250 (the art, the owner's request); the only digits in the game.
- **Tight spots:** 16:9: the panel is 0.57 (its digits ~64 units), the choose cells 226 units, Pipa 10 units from
  Mom's chin while sharing (her gags are vertical only), the bins in decorating stay 0.9 (no spare width); 4:3 (k
  0.75): the panel 0.56 and its buttons 180 units, Mom's pointing hand tucks behind the up button, the photo frame is
  small (Pipa stays big beside it and Mom a step aside), the choose cells 196. At 20:9 the left column shows the
  pizza and the waiting bins beside the cutting board and the bowl; elsewhere they wait off screen.
- **Wellbeing rules, checked for part B:** nobody is sad or disappointed (the one who gets no slice smiles; a start
  before 200 only wiggles); no counters or scores (counting is Mom saying numbers aloud while cutting, nothing is
  kept); praise stays about effort and the pizza; every new motion answers her touch (the picked option's glow, the
  oven's heat, the flash) or is a hint / help; the finale is warm and goes home quietly; the photo is not stored.
- `FeedStep` is still registered (`feed`) but the pizza uses `share` + `photo`; vo-ready plays only without mitts.

### 6. Open points after round 5, part A (round 4's list follows)
- **Needs a real finger and a real ear:** whether 12 bubbles / 9 kneading presses / 6 crushing presses / 3600 units of
  stirring / 3600 of grating feel right (tune `TUNING`); the water loop and the grate sound (a 2 s file with three
  strokes, restarted at most every 0.7 s) against the voice; whether she understands tapping the tap first (the hint
  appears after 3 taps on the hands); Mom's pressing hand reading as a press (it pushes down 34 units and spreads, with
  the dent); holding the cheese handful above the finger; the demo's wait for Mom's sentence (up to 2 s of stillness).
- **Part B** is built (section 000); all voice lines are decoded at load (about 12 MB of audio in memory on the phone;
  only decode what is used if memory gets tight).
- **16:9** is tight: the prep bowl shrinks to 0.93 there so it never reaches Pipa (1.25 on 20:9, 0.94 at 4:3's k).
- The bubbles grow only over the hands (the art agent's scene also floats a few around the sink).
- vo-welcome is no longer played (vo-hello replaced it); `cheese-shaker` is still loaded but no longer shown.

### 6a. Open points after round 4 (round 2's list follows, updated)
- **Needs a real finger and a real ear:** Mom's voice level against the music and effects on the phone speaker;
  whether the lip movement reads as talking; whether "Now you try!" arriving after the step line feels natural;
  whether the demo is slow enough to follow and a 5-year-old waits for it or taps through it (both are fine);
  the finale order (finale line, cheer, bye) and its length; the music loop over a long session (no click at the
  seam); sound after a real phone call / app switch / screen lock; the service worker's 5.85 MB first download on
  mobile data; whether the praise lines vary enough.
- 4:3 feeding: Mom steps right and her waving arm leaves the screen (her face stays). The art agent's 4:3 feed shot
  had her fully visible with Pipa in front of her body; that version covered her face at our 4:3 sizes.
- `sfx/complete.ogg` is delivered but not used (a 2.8 s jingle would collide with the praise line).
- The step-completion star burst (fx.stars from the dish) is not face-aware; only the finale is.
- Title screen: the art agent's reference shows Mom, Pipa and a baked pizza on the title. The game's title stays
  plain (background + play button) so it can appear after 4 images; Mom and Pipa appear from the home screen on.

### 6b. Open points after round 2
- **Needs a real finger on the real phone (20:9):** the thumb strips (4%) and the palm strip in real two-handed play;
  whether 213-unit bins (~1.3 cm) and the 204-unit home button are easy for her; the two-tap home button (does she arm it
  by accident, does an adult find it); dragging a slice to the right with the tip leading; rolling with the pin lying
  across the finger; the rotate screen and resuming after a real rotation (browsers fire touchcancel differently);
  fullscreen + landscape lock from the play button; the look of the eyes following the finger.
- **4:3 tablets** show everything at k = 0.75 (pizza radius 262 units, bins ~160, home button 153, character 56% of
  native). Physically they are still bigger than on the phone (a tablet's 1080 units are ~15 cm), but below the
  200-unit rule in world units. If that matters, the fix is to give tablets a different composition, not to shrink more.
- **16:9** is exactly the fit width: the character is at 75%, 25-unit gaps between the columns. Nothing to spare.
- The rolling pin's shadow is drawn for a lying pin; standing upright at rest, its shadow is at its side.
- The recipe screen doesn't re-layout on a size change (camera zoom only): if the browser bar appears or disappears in
  landscape, the scene is slightly letterboxed until the next recipe.

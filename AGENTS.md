# AGENTS.md — read this first

## What this is
A private cooking game for a 5-year-old girl. She plays mainly on an Android phone held
upright (portrait), sometimes on a tablet. It is not for any app store. The owner is not
technical and does no manual steps: agents do everything.

Current content: one recipe (pizza), start to finish. Later recipes should be mostly a new data file.

Stack: Phaser 4 (4.2.x) + Vite + TypeScript, installed as a PWA (vite-plugin-pwa).
The official Phaser 4 skills are in `node_modules/phaser/skills/*/SKILL.md`. Read the
relevant ones (scenes, input, tweens, particles, scale-and-responsive, loading-assets,
audio-and-sound, render-textures) before changing engine-level code. Phaser 4 differs from 3
(for example tint modes, filters instead of masks and FX, Vector2 instead of Point, and
DynamicTexture needs `.render()`).

## UX rules (must hold for every change)
1. **Zero text to read.** Icons, motion and sound only. No words, letters or digits on screen.
2. **You can't fail and you can't get stuck.** Each step: after 5 s without progress a guiding
   hand demonstrates the gesture, and after 10 more seconds the step finishes itself
   (`src/steps/Step.ts`: `HINT_AFTER_MS`, `AUTO_AFTER_HINT_MS`). There is no wrong answer and no losing.
3. **One finger only:** tap, drag, rub. No double-tap, no long-press, no multi-touch, no time limits.
4. **Big and forgiving.** Every dragged item is at least 15% of the screen width
   (`MIN_DRAG_SHARE`), and drop targets accept generous misses (usually 1.3 to 1.5 times the target radius).
5. **Palm zone:** nothing interactive may start in the bottom 8% of the screen (`PALM_ZONE`).
   `Step.onDown` and `iconButton` already filter this. Keep layouts above `layout.safeBottom`.
6. **Instant feedback** for every action: motion + particles + sound.
7. **Any portrait size, no distortion.** The scale manager uses `EXPAND` with base 1080x1920. Scenes lay
   out from `getLayout(scene)`: `u` = size unit (min(W, 0.6H)), plus `W`, `H`, `cx`, `safeBottom`.
   Always use `fit()`/`cover()` (uniform scale), never set display width and height independently.

## Project layout
```
index.html                 page shell (touch-action none, no zoom)
vite.config.ts             dev server (--host), PWA, asset-manifest plugin
plugins/asset-manifest.ts  virtual:asset-manifest = the asset files that exist on disk
scripts/make-icons.mjs     regenerates the temporary PWA icons (public/icons)
public/assets/images/      SVG art (delivered by the asset agent)
public/assets/sounds/      ogg/mp3 sounds (delivered by the asset agent)
src/main.ts                Phaser game config, scene list, SW registration
src/core/
  assets.ts                THE ASSET CONTRACT: image keys + raster box, sound keys
  placeholders.ts          code-drawn stand-ins for every missing image
  svgRaster.ts             SVG -> texture, fitted into its box, aspect kept
  sfx.ts                   sfx(scene, key): plays if loaded, silent otherwise
  layout.ts                getLayout, fit, cover, palm zone, resize handling, background
  fx.ts                    burst / puff / stars particles, boing squash
  hand.ts                  HandHint: tap / drag / rub / circle demonstrations
  ui.ts                    iconButton (big, forgiving, fires on release)
src/recipes/
  types.ts                 Recipe + StepDef types (one params type per step type)
  pizza.ts                 the pizza recipe, pure data
  index.ts                 RECIPES list shown on the home screen
src/steps/
  Step.ts                  base class: idle timer, hint, auto-finish, input helpers
  Dish.ts                  the food carried between steps (base, sauce RT, sprinkles, toppings)
  registry.ts              step type name -> implementation
  RollStep / SpreadStep / SprinkleStep / DecorateStep / BakeStep / FeedStep
src/scenes/
  BootScene                loads existing assets, fills gaps with placeholders
  TitleScene               big play button (unlocks audio, requests fullscreen)
  HomeScene                one card per recipe
  RecipeScene              runs any recipe's steps in order
```

## Recipes are data
A recipe is `{ id, card, steps: StepDef[] }`. Each step names a reusable type and its params.
Step types: `roll`, `spread`, `sprinkle`, `decorate`, `bake`, `feed`.
To add a recipe: create `src/recipes/<name>.ts`, add it to `RECIPES`, and add any new image keys
to the contract in `src/core/assets.ts` together with a placeholder in `placeholders.ts`.
A new step type means a new `Step` subclass + a `StepDef` variant + a registry entry.
Every step subclass must implement `showHint()` and `autoFinish()`, and call `poke()` on real progress.

## Asset contract (another agent produces the art and sounds)
- Images: `public/assets/images/<key>.svg`. Sounds: `public/assets/sounds/<key>.ogg` and/or `.mp3`.
- Image keys: bg-kitchen, dough-ball, dough-flat, rolling-pin, sauce-bowl, sauce-blob,
  cheese-shaker, cheese-shred, topping-tomato, topping-olive, topping-mushroom, topping-corn,
  topping-pepper, topping-onion, tray, oven-closed, oven-open, pizza-slice, character-body,
  character-mouth-open, character-mouth-closed, character-eyes-happy, hand-hint, star,
  btn-play, btn-home, btn-done, card-pizza.
- Sound keys: tap, pop, squish, sprinkle, whoosh, oven-ding, munch, cheer.
- Any viewBox works: each SVG is rasterized to fit its box in `assets.ts` with its own aspect ratio.
  Art conventions the code assumes:
  - `hand-hint`: the fingertip is at the top center.
  - `pizza-slice`: crust at the top, tip pointing down.
  - `cheese-shaker`: holes at the top (the shaker is tipped over while shaking).
  - `character-*`: the eyes sit about 12% above the body center and the mouth about 10% below it; the parts are layered on the body.
  - `sauce-blob`: a roughly round blob, stamped many times at random angles.
- **Missing files are fine:** a placeholder is drawn in code and a missing sound is silent. Swapping in
  real assets is only copying files into those folders. The dev server reloads by itself. For the
  production/PWA build, run `npm run build` again, since the asset list is fixed at build time.
- The browser console lists which placeholders and silent sounds are in use (`[assets]` lines).

## Working rules
- Work on a branch. No remote exists. **Never push, and never merge to master,** without a separate,
  explicit approval message from the owner.
- `git add` explicit paths only. Never `git add .` or `git add -A`.
- Commit messages in Hebrew, written to a file and committed with `git commit -F <file>`.
- After each significant step, `npm run typecheck` and `npm run build` must both pass with no errors, then commit.
- Don't install libraries beyond what is needed.
- Stay inside this folder. In particular, never touch `../cooking-game-assets` (another agent's workspace).
- Rollback point: the tag `rollback-start` (the first commit on master).

## Running
- `npm run dev`: dev server on the LAN (`--host`, port 5173). Open `http://<PC-IP>:5173` on the phone.
- Dev only: `?step=N` (0-based) jumps straight to step N of the recipe.
- `npm run build`, `npm run preview`: production build. The service worker only works on HTTPS or localhost,
  so installing the PWA needs an HTTPS deployment (a future round).

## Testing notes for agents
- In an automated Chrome whose window is hidden, requestAnimationFrame doesn't run. Drive frames
  manually with `game.loop.step(t)`, and override `Date.now`, because the TweenManager uses its own clock.
  `window.game` is exposed for this.
- Synthetic `mouseup` must be dispatched on the canvas (not on window) for Phaser to see it.
- Nothing replaces a real finger on a real phone. Always list what still needs a hands-on check.

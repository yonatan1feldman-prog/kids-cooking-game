/**
 * The mermaid world's part of the asset contract ("Mermaid with Mom": LagoonScene and the activities, research/
 * mermaid-spec.md), kept in its own file so the world touches assets.ts and audio.ts by one line each, like the farm.
 * The art is made by assets-src/images-b-sea/tools/gen_sea.py (it prints the anchors in ART_SEA), Mom's mermaid layers
 * by images-b/tools/gen_mom.py, the title's card by images-b-clinic/tools/gen_title_worlds.py; the sounds by
 * audio-src/scripts/make_sea_sfx.py, make_music.py (the song 'sea') and make_vo.py (Mom's lines).
 *
 * Loading (spec 9, the lesson of the clinic-open fix: the phone's memory is the limit): `RECIPE_ASSETS.mermaid` lists
 * every file of the world (the asset manifest and the runtime cache need them all), but going in loads only the
 * lagoon (`SEA_LAGOON`); each activity loads its own (`SEA_ACTIVITY[id]`) when its shell door is tapped and frees it
 * again back in the lagoon. Every later activity adds its block below, marked with its PR.
 */
export const SEA_IMAGES = {
  // the title's card (core: the title shows it before anything else)
  'world-card-mermaid': { size: [700, 760] },
  // Mom the mermaid (gen_mom.py): her tail and her long hair behind everything, her shell top (in place of mom-body),
  // her hair let down (in place of mom-hair), her tiara, and her arms with bare shoulders (in place of mom-arm-*); the
  // same 800 frame as all her layers
  'mom-mer-tail': { size: [800, 800] },
  'mom-mer-hair-back': { size: [800, 800] },
  'mom-mer-top': { size: [800, 800] },
  'mom-mer-hair': { size: [800, 800] },
  'mom-mer-crown': { size: [800, 800] },
  'mom-mer-arm-left': { size: [800, 800] },
  'mom-mer-arm-right': { size: [800, 800] },
  'mom-mer-arm-left-reach': { size: [800, 800] },
  'mom-mer-arm-right-rest': { size: [800, 800] },
  'mom-mer-arm-right-chin': { size: [800, 800] },
  'mom-mer-arm-right-thumb': { size: [800, 800] },
  'mom-mer-arm-left-clap': { size: [800, 800] },
  'mom-mer-arm-right-clap': { size: [800, 800] },
  'mom-mer-arm-left-open': { size: [800, 800] },
  // Marina, the little mermaid girl beside Mom (images-b-sea/tools/gen_marina.py): the characters' 600x700 frame
  'marina-body': { size: [600, 700] },
  'marina-eyes-open': { size: [600, 700] },
  'marina-eyes-blink': { size: [600, 700] },
  'marina-eyes-happy': { size: [600, 700] },
  'marina-eyes-surprised': { size: [600, 700] },
  'marina-mouth-closed': { size: [600, 700] },
  'marina-mouth-open': { size: [600, 700] },
  'marina-mouth-chew': { size: [600, 700] },
  // the lagoon (mermaid PR 1)
  'bg-lagoon': { size: [2400, 1080] },
  'lagoon-rock': { size: [900, 400] },
  'door-shell': { size: [300, 260] },
  'door-shell-open': { size: [300, 260] },
  'door-icon-tail': { size: [160, 160] },
  'door-icon-ride': { size: [160, 160] },
  'door-icon-clean': { size: [160, 160] },
  'door-icon-shells': { size: [160, 160] },
  'door-icon-song': { size: [160, 160] },
  'chest-closed': { size: [300, 240] },
  'chest-open': { size: [300, 240] },
  'seaweed': { size: [200, 400] },
  'lagoon-dolphin-far': { size: [240, 120] },
  'photo-frame-sea': { size: [700, 780] },
  'sea-done': { size: [120, 120] },
  // mermaid PR 2: the sparkly tail (tail-big under the paint, tail-big-lines over it; the shells of paint) and the swim
  // with Marina (the rings in two halves, white: the game tints them; a pearl; a little fish)
  'tail-big': { size: [900, 900] },
  'tail-big-lines': { size: [900, 900] },
  'shell-paint': { size: [220, 220] },
  'paint-blob': { size: [220, 220] },
  'shell-glitter': { size: [220, 220] },
  'fx-sparkle': { size: [80, 80] },
  'ring-back': { size: [260, 260] },
  'ring-front': { size: [260, 260] },
  'pearl': { size: [110, 110] },
  'little-fish': { size: [120, 80] },
  // mermaid PR 3: cleaning the lagoon (images-b-sea/tools/gen_sea3.py): the murky water, the rubbish (green or blue: the
  // hard level sorts it by colour), the two net bags, the dolphin and the turtle (the net and the bag over them are the
  // real trash-net / trash-bag), the seaweed things hide behind, a seahorse
  'murk': { size: [1200, 700] },
  'trash-bottle': { size: [200, 200] },
  'trash-can': { size: [200, 200] },
  'trash-bag': { size: [200, 200] },
  'trash-straw': { size: [200, 200] },
  'trash-tyre': { size: [200, 200] },
  'trash-net': { size: [200, 200] },
  'net-basket-blue': { size: [420, 360] },
  'net-basket-green': { size: [420, 360] },
  'dolphin-free': { size: [520, 300] },
  'turtle-free': { size: [360, 260] },
  'seaweed-hide': { size: [240, 420] },
  'sea-seahorse': { size: [160, 220] },
  // mermaid PR 3: the shell treasure: the three kinds, the basket, the sand a shell hides under, the necklace's string,
  // and the necklace on Marina (the lagoon shows it too, so it is loaded with the lagoon)
  'shell-fan': { size: [200, 200] },
  'shell-spiral': { size: [200, 200] },
  'starfish': { size: [200, 200] },
  'shell-basket': { size: [380, 300] },
  'sand-mound': { size: [260, 120] },
  'necklace-string': { size: [1400, 60] },
  'necklace-marina': { size: [240, 130] },
  // mermaid PR 4: the shell song (SeaSong): five bell shells, biggest (lowest note) to smallest, a note's bubble, a glow
  'bell-shell-1': { size: [260, 260] },
  'bell-shell-2': { size: [245, 245] },
  'bell-shell-3': { size: [230, 230] },
  'bell-shell-4': { size: [215, 215] },
  'bell-shell-5': { size: [200, 200] },
  'note-bubble': { size: [120, 120] },
  'shell-glow': { size: [320, 320] },
} as const;
export type SeaImageKey = keyof typeof SEA_IMAGES;

/** The world's own effects (synthesised, make_sea_sfx.py). */
export const SEA_SFX = [
  // mermaid PR 1: a shell door opening, Pipa's little breath of bubbles
  'shell-open', 'bubble-breath',
  // mermaid PR 2: paint spreading on a scale, glitter rubbed on, a ring swum through, a pearl, a soft bump at a red ring
  'shimmer', 'glitter', 'ring-ding', 'pearl-plink', 'ride-bump',
  // mermaid PR 3: cleaning the lagoon and the shell treasure
  'splash-trash', 'murk-clear', 'dolphin-click', 'turtle-blub', 'net-off', 'basket-pop', 'shell-thread',
  // mermaid PR 4: the bell shells' five notes, a soft bubble (a note that is not the tune's), Mom singing "la" (hard)
  'shell-note-1', 'shell-note-2', 'shell-note-3', 'shell-note-4', 'shell-note-5', 'bubble-pop-soft', 'sing-1', 'sing-2', 'sing-3',
] as const;

/** Mom's lines in the mermaid world (make_vo.py, "The mermaid world"); the title's own line is core. */
export const SEA_VOICE = [
  'vo-world-mermaid',
  // mermaid PR 1: the lagoon
  'vo-sea-hello', 'vo-sea-again', 'vo-pick-tail', 'vo-pick-ride', 'vo-pick-clean', 'vo-pick-shells', 'vo-pick-song',
  // mermaid PR 2: the sparkly tail, the swim with Marina
  'vo-tail-start', 'vo-tail-pattern', 'vo-tail-next', 'vo-tail-glitter', 'vo-tail-fin', 'vo-tail-all', 'vo-tail-look',
  'vo-ride-start', 'vo-ride-ring', 'vo-ride-over', 'vo-ride-chest', 'vo-ride-done',
  // mermaid PR 3: cleaning the lagoon
  'vo-clean-start', 'vo-clean-sort', 'vo-clean-blue', 'vo-clean-green', 'vo-clean-hidden', 'vo-clean-dolphin', 'vo-fact-dolphin',
  'vo-clean-turtle', 'vo-fact-turtle', 'vo-fact-seahorse', 'vo-clean-clearer', 'vo-clean-done', 'name-dolphin', 'name-turtle',
  // mermaid PR 3: the shell treasure
  'vo-shell-start', 'vo-shell-hidden', 'vo-shell-big', 'vo-shell-little', 'vo-shell-thread', 'vo-shell-pattern', 'vo-shell-next',
  'vo-shell-marina', 'vo-shell-pretty', 'vo-fact-starfish', 'name-shell', 'name-swirly', 'name-starfish',
  // mermaid PR 4: the shell song
  'vo-song-start', 'vo-song-listen', 'vo-song-copy', 'vo-song-again', 'vo-song-yes', 'vo-song-sing', 'vo-song-done',
] as const;
export type SeaVoiceKey = (typeof SEA_VOICE)[number];

/** The world's song (make_music.py 'sea': 6/8, 108 dotted-quarter beats a minute). */
export const SEA_SONG = ['music-sea-base', 'music-sea-tune', 'music-sea-party', 'music-sea-up'] as const;

/** Mom the mermaid's layers and Marina's: every scene of the world shows them. */
export const MOM_MERMAID = (Object.keys(SEA_IMAGES) as SeaImageKey[]).filter((k) => k.startsWith('mom-mer-'));
export const MARINA = (Object.keys(SEA_IMAGES) as SeaImageKey[]).filter((k) => k.startsWith('marina-'));

// mermaid PR 4: the song's own effects and lines (its door loads them)
const SONG_ONLY = new Set<string>([
  'shell-note-1', 'shell-note-2', 'shell-note-3', 'shell-note-4', 'shell-note-5', 'bubble-pop-soft', 'sing-1', 'sing-2', 'sing-3',
  'vo-song-start', 'vo-song-listen', 'vo-song-copy', 'vo-song-again', 'vo-song-yes', 'vo-song-sing', 'vo-song-done',
]);

/** What going into the world loads: the lagoon and Mom's mermaid layers, the lagoon's sounds and the song. */
export const SEA_LAGOON: { images: readonly SeaImageKey[]; sounds: readonly string[] } = {
  images: [
    ...MOM_MERMAID, ...MARINA, 'bg-lagoon', 'lagoon-rock', 'door-shell', 'door-shell-open',
    'door-icon-tail', 'door-icon-ride', 'door-icon-clean', 'door-icon-shells', 'door-icon-song', 'chest-closed', 'chest-open',
    'seaweed', 'lagoon-dolphin-far', 'sea-done',
    // mermaid PR 3: Marina's shell necklace (she wears it in the lagoon once she has it)
    'necklace-marina',
    // mermaid PR 4: the lagoon's mark of the song (three little bell shells by its door)
    'bell-shell-1', 'bell-shell-3', 'bell-shell-5',
  ],
  sounds: [...SEA_SFX, ...SEA_VOICE.filter((k) => k !== 'vo-world-mermaid'), ...SEA_SONG],
};


/** The five activities behind the shell doors, in the doors' order (left to right). */
export const SEA_DOORS = ['tail', 'ride', 'clean', 'shells', 'song'] as const;
export type SeaDoor = (typeof SEA_DOORS)[number];

/**
 * Each activity: its scene (registered in main.ts) and what it loads on its door. An activity without a scene yet is a
 * closed door for now: the shell opens, Mom says its line, and it closes again (mermaid PR 1; PRs 2-4 add the scenes).
 */
export const SEA_ACTIVITY: Record<SeaDoor, { scene?: string; images: readonly string[]; sounds: readonly string[] }> = {
  // mermaid PR 2
  tail: {
    scene: 'SeaTail',
    images: ['tail-big', 'tail-big-lines', 'shell-paint', 'paint-blob', 'shell-glitter', 'fx-sparkle', 'photo-frame-sea'],
    sounds: ['shimmer', 'glitter', 'squeak', 'name-pink', 'name-blue', 'name-purple', 'name-yellow', 'name-green', 'name-white',
      'vo-tail-start', 'vo-tail-pattern', 'vo-tail-next', 'vo-tail-glitter', 'vo-tail-fin', 'vo-tail-all', 'vo-tail-look'],
  },
  ride: {
    scene: 'SeaRide',
    images: ['ring-back', 'ring-front', 'pearl', 'little-fish', 'fx-sparkle', 'photo-frame-sea'],
    sounds: ['ring-ding', 'pearl-plink', 'ride-bump', 'vo-ride-start', 'vo-ride-ring', 'vo-ride-over', 'vo-ride-chest', 'vo-ride-done'],
  },
  // mermaid PR 3
  clean: {
    scene: 'SeaClean',
    images: ['murk', 'trash-bottle', 'trash-can', 'trash-bag', 'trash-straw', 'trash-tyre', 'trash-net', 'net-basket-blue', 'net-basket-green',
      'dolphin-free', 'turtle-free', 'seaweed-hide', 'sea-seahorse', 'photo-frame-sea'],
    sounds: ['splash-trash', 'murk-clear', 'dolphin-click', 'turtle-blub', 'net-off', 'vo-clean-start', 'vo-clean-sort', 'vo-clean-blue',
      'vo-clean-green', 'vo-clean-hidden', 'vo-clean-dolphin', 'vo-fact-dolphin', 'vo-clean-turtle', 'vo-fact-turtle', 'vo-fact-seahorse',
      'vo-clean-clearer', 'vo-clean-done', 'name-dolphin', 'name-turtle', 'name-blue', 'name-green'],
  },
  shells: {
    scene: 'SeaShells',
    images: ['shell-fan', 'shell-spiral', 'starfish', 'shell-basket', 'sand-mound', 'necklace-string', 'photo-frame-sea'],
    sounds: ['basket-pop', 'shell-thread', 'vo-shell-start', 'vo-shell-hidden', 'vo-shell-big', 'vo-shell-little', 'vo-shell-thread',
      'vo-shell-pattern', 'vo-shell-next', 'vo-shell-marina', 'vo-shell-pretty', 'vo-fact-starfish', 'name-shell', 'name-swirly', 'name-starfish'],
    // (Mom's counting, count-1..10, is core: never listed here, so going back to the lagoon never frees it)
  },
  // mermaid PR 4: the shell song
  song: {
    scene: 'SeaSong',
    images: ['bell-shell-1', 'bell-shell-2', 'bell-shell-3', 'bell-shell-4', 'bell-shell-5', 'note-bubble', 'shell-glow', 'photo-frame-sea'],
    sounds: [...SONG_ONLY],
  },
};

// (mermaid PR 2: an activity's own effects and lines load on its door, not with the lagoon, though SEA_SFX and
// SEA_VOICE list them all)
{
  const own = new Set(Object.values(SEA_ACTIVITY).flatMap((a) => a.sounds));
  SEA_LAGOON.sounds = SEA_LAGOON.sounds.filter((k) => !own.has(k));
}

/** Every image of the world but the title's card (that one is core): RECIPE_ASSETS.mermaid. */
export const SEA_WORLD_IMAGES = (Object.keys(SEA_IMAGES) as SeaImageKey[]).filter((k) => k !== 'world-card-mermaid');

/** Anchors in the world's art (gen_sea.py prints them): points in each image's own frame. */
export const ART_SEA = {
  /** door-shell / -open (300x260): the shell's hinge at the bottom, where the light comes from when it opens. */
  doorHinge: { x: 150, y: 236 },
  /** chest-open (300x240): where the pearls shine inside. */
  chestIn: { x: 150, y: 96 },
  /** bg-lagoon (2400x1080): the water's surface line, the sand's top line (things stand on it). */
  surface: 120,
  sand: 900,
  photoWindow: { x: 80, y: 80, w: 540, h: 540 },
} as const;

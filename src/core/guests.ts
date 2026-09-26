import type { CharacterDef } from '../recipes/types';
import type { ImageKey } from './assets';
import type { VoiceKey } from './audio';
import type { Likes } from './tastes';

/**
 * The guests (the guests round): when the dish is shared, the child first picks who comes to eat with Mom and Pipa.
 * Each guest is drawn in layers like Pipa (the Character class drives them) and has its own way of eating and its own
 * funny moment. None is ever sad: every reaction ends happy.
 * - the giraffe loves green food; her head comes down from above on her long neck; after a bite she loves she licks
 *   her nose with her long tongue.
 * - the turtle walks in slowly, chews slowly, and after her favourite bite (or her third) she dozes off, content; a
 *   new bite coming near wakes her up happy.
 * - the penguin waddles in; onion and pepper make her sneeze, then she laughs; she flaps when she likes something.
 */
export type GuestId = 'giraffe' | 'turtle' | 'penguin';

export interface GuestDef extends CharacterDef {
  id: GuestId;
  card: ImageKey;
  /** Her funny face's mouth (the tongue, the dozy smile, the sneeze). */
  mouthFunny: ImageKey;
  /** How she comes in: down from above (the giraffe), or walking in from the left edge. */
  arrive: 'above' | 'walk';
  likes: Likes;
  /** Chewing takes this much longer than Pipa's (the turtle is slow). */
  chew: number;
  /** "Look, Giraffe is here!", "Some for Giraffe!", "Giraffe loves green food!", her funny moment's line. */
  hello: VoiceKey;
  forGuest: VoiceKey;
  loves: VoiceKey;
  funnyLine?: VoiceKey;
}

const layers = (id: GuestId): CharacterDef => ({
  body: `guest-${id}-body` as ImageKey,
  eyesOpen: `guest-${id}-eyes-open` as ImageKey,
  eyesBlink: `guest-${id}-eyes-blink` as ImageKey,
  eyesSurprised: `guest-${id}-eyes-surprised` as ImageKey,
  eyesHappy: `guest-${id}-eyes-happy` as ImageKey,
  mouthClosed: `guest-${id}-mouth-closed` as ImageKey,
  mouthOpen: `guest-${id}-mouth-open` as ImageKey,
  mouthChew: `guest-${id}-mouth-chew` as ImageKey,
});

export const GUESTS: readonly GuestDef[] = [
  {
    id: 'turtle',
    ...layers('turtle'),
    card: 'guest-card-turtle',
    mouthFunny: 'guest-turtle-mouth-funny',
    arrive: 'walk',
    likes: { love: /tomato|strawberr|berry|lettuce|carrot|mango/, sneeze: false },
    chew: 1.6,
    hello: 'vo-guest-turtle',
    forGuest: 'vo-for-turtle',
    loves: 'vo-turtle-loves',
    funnyLine: 'vo-turtle-nap',
  },
  {
    id: 'giraffe',
    ...layers('giraffe'),
    back: 'guest-giraffe-neck',
    card: 'guest-card-giraffe',
    mouthFunny: 'guest-giraffe-mouth-funny',
    arrive: 'above',
    likes: { love: /pepper|cucumber|lettuce|zucchini|kiwi|herb|basil|green/, sneeze: false },
    chew: 1,
    hello: 'vo-guest-giraffe',
    forGuest: 'vo-for-giraffe',
    loves: 'vo-giraffe-loves',
  },
  {
    id: 'penguin',
    ...layers('penguin'),
    card: 'guest-card-penguin',
    mouthFunny: 'guest-penguin-mouth-funny',
    arrive: 'walk',
    likes: { love: /banana|berry|icing|sprinkle|syrup|candy|milk/, sneeze: true },
    chew: 1,
    hello: 'vo-guest-penguin',
    forGuest: 'vo-for-penguin',
    loves: 'vo-penguin-loves',
    funnyLine: 'vo-bless-penguin',
  },
];

export const guestLayers = (g: GuestDef): ImageKey[] =>
  [g.body, g.eyesOpen, g.eyesBlink, g.eyesSurprised, g.eyesHappy, g.mouthClosed, g.mouthOpen, g.mouthChew, g.mouthFunny, ...(g.back ? [g.back] : [])];

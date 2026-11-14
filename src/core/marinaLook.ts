import type Phaser from 'phaser';
import type { CharacterDef } from '../recipes/types';
import { Character } from '../steps/Character';
import { customerImages, lookImages, savedLook, type Look } from './salon';
import { customerDef, dress, type Dressing } from './salonDress';
import { readMark } from './sea';
import { hasMark } from './seaSort';
import type { Spot } from './stage';

/**
 * Marina wears her salon look (salon PR 4, research/mermaid-dressup-spec.md 7): once she has been to the Mermaid Salon
 * (`lagoon.salon.marina`), the lagoon and the sea's activities show her on the customers' rig (`cust-marina-*`) dressed
 * in that look, instead of her own `marina-*` (which has her hair and tail drawn on). Before that, nothing changes.
 *
 * Memory (spec 9: the lagoon with the look adds at most 4 MB): only her rig and the pictures her look shows are kept
 * (`marinaWear().keys`: the lagoon keeps them when it frees the salon, and loads them coming in from the title). If any
 * of them is missing (a slow or failed load) she is simply her old self this time.
 */

/** Her salon look and every picture it needs, or null (she has not been to the salon). */
export function marinaWear(): { look: Look; keys: string[] } | null {
  if (!readMark('salon.marina')) return null;
  const look = savedLook('marina');
  // (the shell treasure's necklace, when she has it and the look has none: she wore it before, she keeps it)
  if (!look.necklace && hasMark('necklace')) look.necklace = 'marina';
  return { look, keys: [...customerImages('marina'), ...lookImages(look)] };
}

/** Her look if every picture of it is in memory now, else null. */
export function marinaLookReady(scene: Phaser.Scene): Look | null {
  const w = marinaWear();
  return w && w.keys.every((k) => scene.textures.exists(k)) ? w.look : null;
}

/**
 * Marina as a Character: dressed in her salon look when it is ready, else `plain` (her own layers). The dressed one
 * carries its Dressing in `box.getData('dressing')` (the shell treasure's necklace goes on through it: seaSort.ts).
 */
export function newMarina(scene: Phaser.Scene, plain: CharacterDef, at: Spot | null, hidden: Spot): Character {
  const look = marinaLookReady(scene);
  if (!look) return new Character(scene, plain, at, hidden);
  const ch = new Character(scene, customerDef('marina'), at, hidden);
  const d = dress(scene, ch, 'marina', look);
  ch.box.setData('dressing', d);
  return ch;
}

/** The Dressing of a Marina made by `newMarina` (null: her own layers). */
export const dressingOf = (ch: Character): Dressing | null => (ch.box.getData('dressing') as Dressing | undefined) ?? null;

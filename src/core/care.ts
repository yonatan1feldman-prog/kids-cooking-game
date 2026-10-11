import type { ImageKey } from './assets';
import type { VoiceKey } from './audio';
import type { CareId, Patient } from './clinic';

/**
 * The care rooms next door (the clinic, round 5, part 2; research/clinic-spec-5.md section 4), as data: after her two
 * problems every patient goes next door, the screen sliding sideways like in "Doctor Games for kids", to her own care
 * (`Patient.care`, never random): make her medicine, a bath, a bandage, the dentist's polish, the eye chart, or a rest and
 * a snack. scenes/ClinicCare.ts plays them; counts are in TUNING.care. Nothing here can go wrong: a wrong pick wobbles back.
 */
export interface CareRoom {
  id: CareId;
  /** Mom's first line in the room. */
  line: VoiceKey;
  /** The tools the room's tray holds (their working points are ART.clinic.tip). */
  tools: readonly string[];
}

export const CARE: Record<CareId, CareRoom> = {
  medicine: { id: 'medicine', line: 'vo-care-medicine', tools: ['syrup'] },
  bath: { id: 'bath', line: 'vo-care-bath', tools: ['sponge', 'shower', 'towel'] },
  bandage: { id: 'bandage', line: 'vo-care-wrap', tools: ['roll'] },
  polish: { id: 'polish', line: 'vo-care-paste', tools: ['polisher', 'cup'] },
  eyes: { id: 'eyes', line: 'vo-care-eyes', tools: [] },
  rest: { id: 'rest', line: 'vo-care-rest', tools: [] },
};

/** The medicine's flavours: a jar each, the colour the bottle fills with, Mom's word for it. */
export const FLAVORS: readonly { id: string; jar: ImageKey; tint: number; name: VoiceKey }[] = [
  { id: 'strawberry', jar: 'care-jar-strawberry', tint: 0xf26d7a, name: 'name-strawberry' },
  { id: 'banana', jar: 'care-jar-banana', tint: 0xf7d457, name: 'name-banana' },
  { id: 'blueberry', jar: 'care-jar-blueberry', tint: 0x7f8ae6, name: 'name-blueberry' },
];

/** The toothpastes (care-paste tinted) and Mom's word for each colour. */
export const PASTES: readonly { tint: number; name: VoiceKey }[] = [
  { tint: 0xf7a3bd, name: 'name-pink' },
  { tint: 0x8fc6ee, name: 'name-blue' },
  { tint: 0x9edb88, name: 'name-green' },
];

/** The new glasses' colours (care-glasses tinted). */
export const GLASSES: readonly number[] = [0xf28fa8, 0x5fb8b6, 0xeeb23c];

/** The snacks after the rest. */
export const SNACKS: readonly { key: ImageKey; name: VoiceKey }[] = [
  { key: 'care-apple', name: 'name-apple' },
  { key: 'care-banana', name: 'name-banana' },
  { key: 'care-berry', name: 'name-strawberry' },
];

/** The eye chart's shapes: their cards and Mom's word for each. */
export const SHAPE_NAME: Record<string, VoiceKey> = {
  star: 'name-star', heart: 'name-heart', moon: 'name-moon', circle: 'name-circle', triangle: 'name-triangle', house: 'name-house',
};

/** Where the bandage goes round: the close-up of the place she was hurt (her knee, a paw or a child's hand, her arm). */
export function bandageView(p: Patient): { lens: ImageKey; at: { x: number; y: number } } {
  if (p.signature === 'knee') return { lens: 'lens-knee', at: { x: 320, y: 285 } };
  if (p.signature === 'paw') return p.kid ? { lens: 'lens-hand', at: { x: 262, y: 330 } } : { lens: 'lens-paw', at: { x: 262, y: 340 } };
  return { lens: 'lens-skin', at: { x: 260, y: 290 } };
}

/**
 * Cutting art geometry (README-prep.md, "Cutting" and "Cut-face strips"; scenes-prep.js `PREP`, measured by the art
 * agent's gen_prep_e.py (and, for the salad's cucumber and carrot, gen_salad_a.py) from the same outlines that draw veg-*-whole). All numbers are in the 672x504 whole-vegetable
 * file's units (the vegetables rest on the board at about y 475).
 */
export type VegName = 'tomato' | 'mushroom' | 'pepper' | 'onion' | 'cucumber' | 'carrot';

export const VEG = {
  /** The veg-*-whole frame. */
  size: [672, 504] as const,
  /** The body's x span: cutting goes from right to left inside it (the pepper's stem is not cut). */
  span: { tomato: [125, 547], mushroom: [91, 581], pepper: [60, 588], onion: [31, 636], cucumber: [53, 619], carrot: [36, 577] } as Record<VegName, readonly [number, number]>,
  /** veg-*-inside strips: 60 wide, as tall as the body at its tallest. */
  stripW: 60,
  stripH: { tomato: 378, mushroom: 406, pepper: 378, onion: 327, cucumber: 168, carrot: 159 } as Record<VegName, number>,
  /** Mushroom: the cap part of its strip (rows 0..59.76%), used where the cut misses the stem. */
  mushCapFrac: 0.5976,
  /** Below this body bottom a mushroom cut misses the stem (outside x ~236..436). */
  mushStemBottom: 400,
  /** [x, top, bottom] of the body, every 24 units (linear in between). */
  profile: {
    tomato: [[153, 193.9, 364.6], [177, 158.7, 398.7], [201, 133.1, 422.9], [225, 115.8, 437.4], [249, 103.7, 447.5], [273, 96.8, 454.2], [297, 93.2, 458.5], [321, 90.6, 462.5], [345, 89.4, 466.4], [369, 91, 466.4], [393, 96.1, 461], [417, 103.8, 452.2], [441, 113.1, 441.3], [465, 125.3, 427.3], [489, 145.2, 406.5], [513, 177.4, 375.5], [537, 247.7, 320.3]],
    mushroom: [[95, 234.5, 287.2], [119, 169.1, 307.7], [143, 138.5, 312.1], [167, 117.7, 311.2], [191, 102.2, 309.6], [215, 90.5, 309.6], [239, 81.6, 459.2], [263, 75.2, 471], [287, 70.7, 472.8], [311, 68.2, 472.8], [335, 67.2, 472.8], [359, 68.1, 472.8], [383, 70.5, 472.8], [407, 74.8, 471.4], [431, 81, 461.1], [455, 89.7, 309.6], [479, 101.1, 309.6], [503, 116.2, 310.9], [527, 136.5, 312.1], [551, 165.7, 308.4], [575, 224.2, 291.2]],
    pepper: [[64, 266, 317.1], [88, 152.4, 431.9], [112, 132.8, 449.5], [136, 122.5, 460.4], [160, 116, 467.2], [184, 111.7, 471.6], [208, 108.6, 474.9], [232, 106.2, 477.1], [256, 104.6, 478.7], [280, 103.5, 479.8], [304, 103, 480.3], [328, 102.8, 480.2], [352, 103, 479.7], [376, 103.6, 478.8], [400, 104.6, 477.3], [424, 106.3, 475.9], [448, 109.1, 474.1], [472, 114, 471.7], [496, 122.3, 467.6], [520, 134.1, 460.1], [544, 148.5, 447.3], [568, 175.3, 424.7]],
    onion: [[83, 257.4, 342.6], [107, 219, 381], [131, 196.1, 403.9], [155, 179.4, 420.6], [179, 166.7, 433.3], [203, 156.8, 443.2], [227, 149.2, 450.8], [251, 143.6, 456.4], [275, 139.8, 460.2], [299, 137.5, 462.5], [323, 136.8, 463.2], [347, 137.6, 462.4], [371, 139.9, 460.1], [395, 143.7, 456.3], [419, 149, 451], [443, 156.1, 443.9], [467, 165.5, 434.5], [491, 177.3, 422.7], [515, 192.6, 407.4], [539, 213.1, 386.9], [563, 245.5, 356], [587, 260.1, 317.3], [611, 269.8, 306.3]],
    // the salad's (README-salad.md, measured by gen_salad_a.py --profiles)
    cucumber: [[57, 364.1, 394], [81, 331.7, 424.5], [105, 321.1, 433.2], [129, 312.6, 439.9], [153, 306.3, 444.6], [177, 301.3, 447.9], [201, 297.4, 450.5], [225, 294.4, 452.3], [249, 292.1, 453.5], [273, 290.5, 454.4], [297, 289.4, 454.9], [321, 288.8, 455.2], [345, 288.6, 455.5], [369, 288.6, 455.7], [393, 289, 455.7], [417, 290, 455.5], [441, 291.6, 454.8], [465, 293.9, 453.6], [489, 297.2, 451.6], [513, 301.6, 448.8], [537, 307.5, 444.6], [561, 315.3, 438.6], [585, 325.3, 430.4], [609, 351.7, 405.9]],
    carrot: [[40, 423.9, 431.1], [64, 408.8, 435.7], [88, 399.4, 437.2], [112, 391.6, 438.7], [136, 384.7, 440.2], [160, 378.2, 441.7], [184, 372.3, 443.2], [208, 366.8, 444.7], [232, 361.5, 446.3], [256, 356.5, 447.7], [280, 351.6, 449.2], [304, 347, 450.7], [328, 342.5, 452.2], [352, 338.1, 453.6], [376, 333.8, 455.2], [400, 329.7, 456.7], [424, 325.7, 458.2], [448, 321.8, 459.7], [472, 318, 461.2], [496, 314.2, 462.7], [520, 310.6, 464.2], [544, 307.4, 465.3], [568, 331.3, 441.5]],
  } as Record<VegName, [number, number, number][]>,
};

/** Top and bottom of a whole vegetable's body at file x (linear interpolation of the measured profile). */
export function vegColumn(veg: VegName, x: number) {
  const pr = VEG.profile[veg];
  if (x <= pr[0][0]) return { top: pr[0][1], bottom: pr[0][2] };
  for (let i = 1; i < pr.length; i++)
    if (x <= pr[i][0]) {
      const [x0, t0, b0] = pr[i - 1];
      const [x1, t1, b1] = pr[i];
      const u = (x - x0) / (x1 - x0);
      return { top: t0 + (t1 - t0) * u, bottom: b0 + (b1 - b0) * u };
    }
  const l = pr[pr.length - 1];
  return { top: l[1], bottom: l[2] };
}

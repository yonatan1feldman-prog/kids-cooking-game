// Generates the temporary PWA icons (a simple pizza) as PNG, with no dependencies.
// Usage: node scripts/make-icons.mjs  -> public/icons/icon-192.png, icon-512.png
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function pizzaIcon(size) {
  const px = Buffer.alloc(size * (size * 4 + 1));
  const c = size / 2;
  const toppings = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    return [c + Math.cos(a) * size * 0.2, c + Math.sin(a) * size * 0.2];
  });
  for (let y = 0; y < size; y++) {
    px[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / size;
      let col = [255, 179, 71]; // background (full-bleed, maskable-safe)
      if (d < 0.38) col = [217, 164, 95]; // crust
      if (d < 0.34) col = [229, 57, 53]; // sauce
      if (d < 0.31) col = [255, 210, 63]; // cheese
      for (const [tx, ty] of toppings) if (Math.hypot(x - tx, y - ty) < size * 0.045) col = [198, 40, 40];
      if (d < 0.035) col = [46, 158, 62];
      const o = y * (size * 4 + 1) + 1 + x * 4;
      px[o] = col[0];
      px[o + 1] = col[1];
      px[o + 2] = col[2];
      px[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(px)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
for (const s of [192, 512]) writeFileSync(`public/icons/icon-${s}.png`, pizzaIcon(s));
console.log('icons written');

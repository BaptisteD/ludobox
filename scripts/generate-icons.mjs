/**
 * Dependency-free PWA icon generator for Ludobox.
 * Emits coral "Tabletop pop" tiles (ink outline + die-three pips) as PNGs
 * into /public. Run with: node scripts/generate-icons.mjs
 *
 * Hand-rolled PNG encoder (RGBA, no filtering) so the build needs no native
 * image deps. Colors mirror src/styles/tokens.css.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CORAL = [0xe1, 0x4b, 0x6a];
const CREAM = [0xff, 0xf6, 0xe9];
const INK = [0x2a, 0x20, 0x18];

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10-12: compression / filter / interlace = 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const px = (x, y, [r, g, b]) => {
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = 255;
  };

  // Full-bleed coral ground.
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) px(x, y, CORAL);

  // Centered tile. Smaller on maskable so it stays inside the safe zone.
  const tileFrac = maskable ? 0.5 : 0.62;
  const tile = Math.round(size * tileFrac);
  const t0 = Math.round((size - tile) / 2);
  const t1 = t0 + tile;
  const radius = Math.round(tile * 0.16);
  const border = Math.max(2, Math.round(size * 0.035));

  const inRounded = (x, y, x0, y0, x1, y1, rad) => {
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
    const cx = Math.min(Math.max(x, x0 + rad), x1 - 1 - rad);
    const cy = Math.min(Math.max(y, y0 + rad), y1 - 1 - rad);
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= rad * rad;
  };

  for (let y = t0; y < t1; y++) {
    for (let x = t0; x < t1; x++) {
      if (!inRounded(x, y, t0, t0, t1, t1, radius)) continue;
      const inner = inRounded(
        x,
        y,
        t0 + border,
        t0 + border,
        t1 - border,
        t1 - border,
        Math.max(0, radius - border),
      );
      px(x, y, inner ? CREAM : INK);
    }
  }

  // Die-three pips (diagonal) in ink, inside the cream tile.
  const pipR = Math.round(tile * 0.085);
  const span = tile * 0.24;
  const cxm = t0 + tile / 2;
  const cym = t0 + tile / 2;
  const pips = [
    [cxm - span, cym - span],
    [cxm, cym],
    [cxm + span, cym + span],
  ];
  for (const [pcx, pcy] of pips) {
    for (let y = Math.floor(pcy - pipR); y <= Math.ceil(pcy + pipR); y++) {
      for (let x = Math.floor(pcx - pipR); x <= Math.ceil(pcx + pipR); x++) {
        const dx = x - pcx;
        const dy = y - pcy;
        if (dx * dx + dy * dy <= pipR * pipR) px(x, y, INK);
      }
    }
  }

  return encodePng(size, buf);
}

const targets = [
  ['pwa-192x192.png', 192, {}],
  ['pwa-512x512.png', 512, {}],
  ['pwa-maskable-512x512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: true }],
];

for (const [name, size, opts] of targets) {
  writeFileSync(join(outDir, name), makeIcon(size, opts));
  console.log('wrote', name, size + 'px');
}

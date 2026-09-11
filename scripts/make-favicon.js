'use strict';

/**
 * Draws the VMAX favicon: the same mark the wordmark uses, a black V on a
 * yellow rounded square.
 *
 * The site otherwise ships no artwork, but an icon is not photography: it is
 * the brand mark, it is the same shape at every size, and a tab with a blank
 * page icon reads as a broken site. So it is drawn here rather than waited
 * for. Run with `npm run gen:favicon`; the output is committed.
 *
 * Writes an SVG (what modern browsers actually use), a 512px PNG, a 180px
 * apple-touch-icon and a 32px ICO, with no image library: PNG is a handful of
 * chunks around a zlib stream, and an ICO is a header wrapped round a PNG.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PUBLIC = path.join(__dirname, '..', 'public');

const YELLOW = [255, 196, 0];
const YELLOW_LIGHT = [255, 216, 77];
const INK = [18, 18, 18];

/* ---------- the mark ----------------------------------------------------
   Everything is expressed on a 0..1 square so one description serves every
   size, the SVG included. */

/** Signed distance to a rounded square, negative inside. */
function roundedSquare(x, y, r) {
  const dx = Math.abs(x - 0.5) - (0.5 - r);
  const dy = Math.abs(y - 0.5) - (0.5 - r);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.min(Math.max(dx, dy), 0) + Math.sqrt(ax * ax + ay * ay) - r;
}

/* The V: two strokes meeting at a point, drawn as a polygon so the inside of
   the letter has the same optical weight at 32px as it does at 512px. */
const V_OUTER = [
  [0.205, 0.235], [0.375, 0.235], [0.5, 0.585], [0.625, 0.235], [0.795, 0.235],
  [0.59, 0.775], [0.41, 0.775],
];

function inPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * One pixel, sampled 3x3 so the curve of the corner and the point of the V
 * come out smooth rather than stepped.
 */
function sample(u, v, step) {
  let r = 0, g = 0, b = 0, a = 0;
  const N = 3;
  for (let sy = 0; sy < N; sy += 1) {
    for (let sx = 0; sx < N; sx += 1) {
      // Sub-pixel offsets have to be in the same 0..1 space as the pixel
      // origin, not in pixels, or every sample covers the whole tile.
      const x = u + ((sx + 0.5) / N) * step;
      const y = v + ((sy + 0.5) / N) * step;
      if (roundedSquare(x, y, 0.22) > 0) continue;
      // A soft diagonal lift across the tile, the same gradient the buttons use.
      const t = Math.min(1, Math.max(0, (x + y) / 2));
      const bg = [
        YELLOW_LIGHT[0] + (YELLOW[0] - YELLOW_LIGHT[0]) * t,
        YELLOW_LIGHT[1] + (YELLOW[1] - YELLOW_LIGHT[1]) * t,
        YELLOW_LIGHT[2] + (YELLOW[2] - YELLOW_LIGHT[2]) * t,
      ];
      const ink = inPolygon(x, y, V_OUTER);
      r += ink ? INK[0] : bg[0];
      g += ink ? INK[1] : bg[1];
      b += ink ? INK[2] : bg[2];
      a += 255;
    }
  }
  const n = N * N;
  if (a === 0) return [0, 0, 0, 0];
  // Premultiplied average, then un-premultiply so edge pixels blend cleanly.
  const cover = a / (n * 255);
  return [Math.round(r / (n * cover)), Math.round(g / (n * cover)), Math.round(b / (n * cover)), Math.round(a / n)];
}

/* ---------- PNG --------------------------------------------------------- */

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = -1;
  for (let i = 0; i < buf.length; i += 1) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y += 1) {
    raw[o] = 0; // filter: none
    o += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = sample(x / size, y / size, 1 / size);
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
      o += 4;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** An ICO carrying a single PNG, which every browser since Vista reads. */
function ico(pngBuf, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0; entry[3] = 0;
  entry.writeUInt16LE(1, 4);   // colour planes
  entry.writeUInt16LE(32, 6);  // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12); // offset
  return Buffer.concat([header, entry, pngBuf]);
}

/* ---------- SVG --------------------------------------------------------- */

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="VMAX">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd84d"/>
      <stop offset="1" stop-color="#ffc400"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#g)"/>
  <path d="${V_OUTER.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * 100).toFixed(1)} ${(y * 100).toFixed(1)}`).join(' ')}Z" fill="#121212"/>
</svg>
`;

fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), svg, 'utf8');
const png512 = png(512);
fs.writeFileSync(path.join(PUBLIC, 'favicon.png'), png512);
fs.writeFileSync(path.join(PUBLIC, 'apple-touch-icon.png'), png(180));
fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), ico(png(32), 32));

console.log('[favicon] wrote favicon.svg, favicon.png (512), apple-touch-icon.png (180), favicon.ico (32)');

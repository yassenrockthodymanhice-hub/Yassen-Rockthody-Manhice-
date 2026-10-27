import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, isMaskable = false) {
  // Standard PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);
    const checksum = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(checksum, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR chunk: width, height, bitDepth=8, colorType=6 (RGBA), comp=0, filter=0, interlace=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Generate image scanlines (RGBA: 4 bytes per pixel + 1 filter byte per line)
  const rowStride = width * 4;
  const rawScanlines = Buffer.alloc((rowStride + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.42;
  const rMid = width * 0.32;
  const rInner = width * 0.18;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      // Deep cyber background #060913
      let r = 6;
      let g = 9;
      let b = 19;
      let a = 255;

      // Outer tech radar ring
      if (Math.abs(dist - rOuter) < 2.5) {
        r = 56; g = 189; b = 248; // Cyan #38bdf8
      } else if (Math.abs(dist - rMid) < 2.0) {
        r = 129; g = 140; b = 248; // Indigo #818cf8
      } else if (dist < rInner) {
        // Glowing sensor core
        r = 56; g = 189; b = 248;
      } else if (Math.abs(dx) < 2.5 || Math.abs(dy) < 2.5) {
        // Crosshair lines
        if (dist < rOuter + 10) {
          r = 2; g = 132; b = 199;
        }
      }

      // Compass needle diamond
      const nx = Math.abs(dx);
      const ny = dy;
      if (ny < 0 && ny > -rOuter * 0.8 && nx < (rOuter * 0.8 + ny) * 0.35) {
        r = 56; g = 189; b = 248;
      } else if (ny >= 0 && ny < rOuter * 0.8 && nx < (rOuter * 0.8 - ny) * 0.35) {
        r = 71; g = 85; b = 105;
      }

      rawScanlines[offset++] = r;
      rawScanlines[offset++] = g;
      rawScanlines[offset++] = b;
      rawScanlines[offset++] = a;
    }
  }

  const idatCompressed = zlib.deflateSync(rawScanlines);
  const idatChunk = createChunk('IDAT', idatCompressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), createPng(64, 64, false));

console.log('Successfully generated all PWA PNG icons!');

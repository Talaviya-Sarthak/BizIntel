const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const imgPath = 'C:/Users/smit sureja/.gemini/antigravity/brain/c9f9335b-6dd6-4f0b-a4e2-716ea83dcaac/.user_uploaded/media_1789908836542.png';
const srcBuf = fs.readFileSync(imgPath);

let offset = 8;
let width, height;
let idatChunks = [];

while (offset < srcBuf.length) {
  const len = srcBuf.readUInt32BE(offset);
  const type = srcBuf.subarray(offset + 4, offset + 8).toString('ascii');
  if (type === 'IHDR') {
    width = srcBuf.readUInt32BE(offset + 8);
    height = srcBuf.readUInt32BE(offset + 12);
  } else if (type === 'IDAT') {
    idatChunks.push(srcBuf.subarray(offset + 8, offset + 8 + len));
  }
  offset += 12 + len;
}

const compressed = Buffer.concat(idatChunks);
const raw = zlib.inflateSync(compressed);
const stride = width * 4;
const pixels = Buffer.alloc(width * height * 4);
let rawOffset = 0;

for (let y = 0; y < height; y++) {
  const filter = raw[rawOffset++];
  for (let x = 0; x < width; x++) {
    const pIdx = (y * width + x) * 4;
    const rIdx = rawOffset + x * 4;
    for (let c = 0; c < 4; c++) {
      let val = raw[rIdx + c];
      const left = x > 0 ? pixels[pIdx - 4 + c] : 0;
      const up = y > 0 ? pixels[pIdx - stride + c] : 0;
      const upLeft = (x > 0 && y > 0) ? pixels[pIdx - stride - 4 + c] : 0;

      if (filter === 0) {}
      else if (filter === 1) { val = (val + left) & 0xff; }
      else if (filter === 2) { val = (val + up) & 0xff; }
      else if (filter === 3) { val = (val + Math.floor((left + up) / 2)) & 0xff; }
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        let pr;
        if (pa <= pb && pa <= pc) pr = left;
        else if (pb <= pc) pr = up;
        else pr = upLeft;
        val = (val + pr) & 0xff;
      }
      pixels[pIdx + c] = val;
    }
  }
  rawOffset += stride;
}

function encodePNG(w, h, rgbaBuffer) {
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const rawRows = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    rawRows[y * (w * 4 + 1)] = 0;
    rgbaBuffer.copy(rawRows, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }

  const idatData = zlib.deflateSync(rawRows, { level: 9 });
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    pngHeader,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Background removal with high precision
const transPixels = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
    const brightness = (r + g + b) / 3;
    
    // Background watermark is faint grey/green (brightness > 232)
    if (brightness > 234) {
      transPixels[idx] = 0;
      transPixels[idx+1] = 0;
      transPixels[idx+2] = 0;
      transPixels[idx+3] = 0;
    } else {
      // Smooth alpha ramp
      const alphaFactor = Math.min(1, Math.max(0, (234 - brightness) / 140));
      const a = Math.round(alphaFactor * 255);
      
      const invA = 1 / (alphaFactor || 1);
      const ur = Math.min(255, Math.max(0, Math.round((r - 255 * (1 - alphaFactor)) * invA)));
      const ug = Math.min(255, Math.max(0, Math.round((g - 255 * (1 - alphaFactor)) * invA)));
      const ub = Math.min(255, Math.max(0, Math.round((b - 255 * (1 - alphaFactor)) * invA)));
      
      transPixels[idx] = ur;
      transPixels[idx+1] = ug;
      transPixels[idx+2] = ub;
      transPixels[idx+3] = a;
    }
  }
}

// Crop full logo with 6px padding
const minX = Math.max(0, 20);
const maxX = Math.min(width - 1, 362);
const minY = Math.max(0, 13);
const maxY = Math.min(height - 1, 142);

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;
const cropBuf = Buffer.alloc(cropW * cropH * 4);

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcIdx = ((minY + y) * width + (minX + x)) * 4;
    const dstIdx = (y * cropW + x) * 4;
    transPixels.copy(cropBuf, dstIdx, srcIdx, srcIdx + 4);
  }
}

// Crop mark with padding
const markMinX = Math.max(0, 20);
const markMaxX = Math.min(width - 1, 148);
const markMinY = Math.max(0, 13);
const markMaxY = Math.min(height - 1, 142);

const markW = markMaxX - markMinX + 1;
const markH = markMaxY - markMinY + 1;
const markBuf = Buffer.alloc(markW * markH * 4);

for (let y = 0; y < markH; y++) {
  for (let x = 0; x < markW; x++) {
    const srcIdx = ((markMinY + y) * width + (markMinX + x)) * 4;
    const dstIdx = (y * markW + x) * 4;
    transPixels.copy(markBuf, dstIdx, srcIdx, srcIdx + 4);
  }
}

// Ensure output dirs
const publicBrandDir = path.join(__dirname, '../frontend/public/brand');
const srcAssetsDir = path.join(__dirname, '../frontend/src/assets');
fs.mkdirSync(publicBrandDir, { recursive: true });
fs.mkdirSync(srcAssetsDir, { recursive: true });

fs.writeFileSync(path.join(publicBrandDir, 'logo.png'), encodePNG(cropW, cropH, cropBuf));
fs.writeFileSync(path.join(publicBrandDir, 'logo-mark.png'), encodePNG(markW, markH, markBuf));
fs.writeFileSync(path.join(srcAssetsDir, 'logo.png'), encodePNG(cropW, cropH, cropBuf));
fs.writeFileSync(path.join(srcAssetsDir, 'logo-mark.png'), encodePNG(markW, markH, markBuf));

console.log('Brand PNGs successfully generated & saved to public/brand and src/assets.');

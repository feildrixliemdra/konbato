const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'images');

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// 1x1 pixel image base64 data
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const WEBP_BASE64 = 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
const JPEG_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKpgA//Z';

// 1x1 GIF89a with a complete 2-entry colour table (black, white)
const GIF_HEX =
  '474946383961' + // GIF89a
  '01000100' + // 1x1
  '800000' + // global colour table, 2 entries
  '000000ffffff' + // black, white
  '21f9040100000000' + // graphic control extension
  '2c0000000001000100' + // image descriptor
  '00' + // no local colour table
  '0202440100' + // LZW image data
  '3b'; // trailer

// Minimal 1x1 24-bit BMP
function makeBmp() {
  const buf = Buffer.alloc(58);
  buf.write('BM', 0);
  buf.writeUInt32LE(58, 2); // file size
  buf.writeUInt32LE(54, 10); // pixel data offset
  buf.writeUInt32LE(40, 14); // DIB header size
  buf.writeInt32LE(1, 18); // width
  buf.writeInt32LE(1, 22); // height
  buf.writeUInt16LE(1, 26); // planes
  buf.writeUInt16LE(24, 28); // bpp
  buf.writeUInt32LE(0, 30); // compression = none
  buf.writeUInt32LE(4, 34); // image size (padded)
  buf.writeUInt32LE(2835, 38);
  buf.writeUInt32LE(2835, 42);
  buf[54] = 0xff; // B
  buf[55] = 0x00; // G
  buf[56] = 0x00; // R
  buf[57] = 0x00; // pad
  return buf;
}

// Minimal 1x1 uncompressed RGB TIFF (little-endian)
function makeTiff() {
  const entryCount = 9;
  const ifdOffset = 8;
  const ifdSize = 2 + entryCount * 12 + 4;
  const bitsOffset = ifdOffset + ifdSize; // 3 shorts = 6 bytes
  const pixelOffset = bitsOffset + 6;

  const buf = Buffer.alloc(pixelOffset + 3);
  buf.write('II', 0, 'ascii');
  buf.writeUInt16LE(42, 2);
  buf.writeUInt32LE(ifdOffset, 4);

  let p = ifdOffset;
  buf.writeUInt16LE(entryCount, p);
  p += 2;

  const entry = (tag, type, count, value) => {
    buf.writeUInt16LE(tag, p);
    buf.writeUInt16LE(type, p + 2);
    buf.writeUInt32LE(count, p + 4);
    buf.writeUInt32LE(value, p + 8);
    p += 12;
  };

  entry(256, 3, 1, 1); // ImageWidth
  entry(257, 3, 1, 1); // ImageLength
  entry(258, 3, 3, bitsOffset); // BitsPerSample -> offset
  entry(259, 3, 1, 1); // Compression = none
  entry(262, 3, 1, 2); // Photometric = RGB
  entry(273, 4, 1, pixelOffset); // StripOffsets
  entry(277, 3, 1, 3); // SamplesPerPixel
  entry(278, 4, 1, 1); // RowsPerStrip
  entry(279, 4, 1, 3); // StripByteCounts

  buf.writeUInt32LE(0, p); // next IFD = none

  buf.writeUInt16LE(8, bitsOffset);
  buf.writeUInt16LE(8, bitsOffset + 2);
  buf.writeUInt16LE(8, bitsOffset + 4);

  buf[pixelOffset] = 0xff;
  buf[pixelOffset + 1] = 0x00;
  buf[pixelOffset + 2] = 0x00;
  return buf;
}

fs.writeFileSync(path.join(IMAGES_DIR, 'test-pixel.png'), Buffer.from(PNG_BASE64, 'base64'));
fs.writeFileSync(path.join(IMAGES_DIR, 'test-pixel.webp'), Buffer.from(WEBP_BASE64, 'base64'));
fs.writeFileSync(path.join(IMAGES_DIR, 'test-pixel.jpg'), Buffer.from(JPEG_BASE64, 'base64'));
fs.writeFileSync(path.join(IMAGES_DIR, 'test-pixel.gif'), Buffer.from(GIF_HEX, 'hex'));
fs.writeFileSync(path.join(IMAGES_DIR, 'test-pixel.bmp'), makeBmp());
fs.writeFileSync(path.join(IMAGES_DIR, 'test-pixel.tiff'), makeTiff());

console.log('Test images created successfully in tests/images/');

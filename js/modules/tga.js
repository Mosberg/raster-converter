import { ImageBuffer } from '../core/ImageBuffer.js';

export function registerTgaFormat(hub) {
  hub.registerFormat({
    id: 'tga',
    name: 'Truevision Targa (TGA)',
    extensions: ['tga', 'icb', 'vda', 'vst'],
    mimeType: 'image/x-tga',
    decode: (buffer) => {
      const bytes = new Uint8Array(buffer);
      const idLength = bytes[0];
      const imageType = bytes[2];
      const width = bytes[12] | (bytes[13] << 8);
      const height = bytes[14] | (bytes[15] << 8);
      const pixelDepth = bytes[16];
      const descriptor = bytes[17];

      if (imageType !== 2 && imageType !== 10) {
        throw new Error('Only 24/32-bit true-color uncompressed & RLE TGA files are implemented.');
      }

      const imgBuffer = new ImageBuffer(width, height);
      const out = imgBuffer.data;
      const isTopDown = (descriptor & 0x20) !== 0;
      const bpp = pixelDepth / 8;
      let offset = 18 + idLength;

      const readPixel = (srcOffset) => [
        bytes[srcOffset + 2], // R (TGA is BGR)
        bytes[srcOffset + 1], // G
        bytes[srcOffset],     // B
        bpp === 4 ? bytes[srcOffset + 3] : 255
      ];

      const rawPixels = new Uint8Array(width * height * 4);
      let targetIdx = 0;

      if (imageType === 2) { // Uncompressed
        for (let i = 0; i < width * height; i++) {
          const [r, g, b, a] = readPixel(offset);
          rawPixels[targetIdx++] = r;
          rawPixels[targetIdx++] = g;
          rawPixels[targetIdx++] = b;
          rawPixels[targetIdx++] = a;
          offset += bpp;
        }
      } else if (imageType === 10) { // RLE
        while (targetIdx < width * height * 4) {
          const packetHeader = bytes[offset++];
          const count = (packetHeader & 0x7f) + 1;
          if (packetHeader & 0x80) { // Run-length packet
            const [r, g, b, a] = readPixel(offset);
            offset += bpp;
            for (let i = 0; i < count; i++) {
              rawPixels[targetIdx++] = r; rawPixels[targetIdx++] = g;
              rawPixels[targetIdx++] = b; rawPixels[targetIdx++] = a;
            }
          } else { // Raw packet
            for (let i = 0; i < count; i++) {
              const [r, g, b, a] = readPixel(offset);
              offset += bpp;
              rawPixels[targetIdx++] = r; rawPixels[targetIdx++] = g;
              rawPixels[targetIdx++] = b; rawPixels[targetIdx++] = a;
            }
          }
        }
      }

      // Orient properly (default TGA is bottom-up)
      for (let y = 0; y < height; y++) {
        const srcY = isTopDown ? y : (height - 1 - y);
        const rowSrc = srcY * width * 4;
        const rowDst = y * width * 4;
        out.set(rawPixels.subarray(rowSrc, rowSrc + width * 4), rowDst);
      }

      return imgBuffer;
    },
    encode: (imgBuffer) => {
      const { width, height, data } = imgBuffer;
      const header = new Uint8Array(18);
      header[2] = 2; // Uncompressed true-color
      header[12] = width & 0xff;
      header[13] = (width >> 8) & 0xff;
      header[14] = height & 0xff;
      header[15] = (height >> 8) & 0xff;
      header[16] = 32; // 32 bits per pixel
      header[17] = 0x20; // Top-down

      const out = new Uint8Array(18 + width * height * 4);
      out.set(header, 0);

      let dst = 18;
      for (let i = 0; i < data.length; i += 4) {
        out[dst++] = data[i + 2]; // B
        out[dst++] = data[i + 1]; // G
        out[dst++] = data[i];     // R
        out[dst++] = data[i + 3]; // A
      }
      return out;
    }
  });
}

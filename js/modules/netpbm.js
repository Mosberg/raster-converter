import { ImageBuffer } from '../core/ImageBuffer.js';

export function registerNetpbmFormat(hub) {
  hub.registerFormat({
    id: 'ppm',
    name: 'Portable Pixmap (PPM)',
    extensions: ['ppm', 'pnm', 'pgm'],
    mimeType: 'image/x-portable-pixmap',
    decode: (buffer) => {
      const text = new TextDecoder('latin1').decode(buffer);
      const lines = text.split('\n')
        .map(l => l.replace(/#.*$/, '').trim())
        .filter(l => l.length > 0);

      const tokens = lines.join(' ').split(/\s+/);
      const magic = tokens[0];
      if (magic !== 'P3' && magic !== 'P6') {
        throw new Error(`Unsupported PPM header variant: ${magic}`);
      }

      const width = parseInt(tokens[1], 10);
      const height = parseInt(tokens[2], 10);
      const maxVal = parseInt(tokens[3], 10);

      const imgBuffer = new ImageBuffer(width, height);
      const out = imgBuffer.data;

      if (magic === 'P3') {
        let t = 4;
        let p = 0;
        for (let i = 0; i < width * height; i++) {
          out[p++] = (parseInt(tokens[t++], 10) / maxVal) * 255;
          out[p++] = (parseInt(tokens[t++], 10) / maxVal) * 255;
          out[p++] = (parseInt(tokens[t++], 10) / maxVal) * 255;
          out[p++] = 255;
        }
      } else {
        // Find binary start offset
        let byteOffset = 0;
        let count = 0;
        while (count < 4) {
          if (text[byteOffset] === '#') {
            while (text[byteOffset] !== '\n') byteOffset++;
          } else if (/\s/.test(text[byteOffset])) {
            while (/\s/.test(text[byteOffset])) byteOffset++;
            count++;
          } else {
            byteOffset++;
          }
        }
        const bin = new Uint8Array(buffer, byteOffset);
        let src = 0, dst = 0;
        for (let i = 0; i < width * height; i++) {
          out[dst++] = bin[src++];
          out[dst++] = bin[src++];
          out[dst++] = bin[src++];
          out[dst++] = 255;
        }
      }
      return imgBuffer;
    },
    encode: (imgBuffer) => {
      const header = `P6\n${imgBuffer.width} ${imgBuffer.height}\n255\n`;
      const headerBytes = new TextEncoder().encode(header);
      const pixelCount = imgBuffer.width * imgBuffer.height;
      const out = new Uint8Array(headerBytes.length + pixelCount * 3);
      out.set(headerBytes, 0);

      let src = 0;
      let dst = headerBytes.length;
      for (let i = 0; i < pixelCount; i++) {
        out[dst++] = imgBuffer.data[src++];
        out[dst++] = imgBuffer.data[src++];
        out[dst++] = imgBuffer.data[src++];
        src++; // skip alpha
      }
      return out;
    }
  });
}

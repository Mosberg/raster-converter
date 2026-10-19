import { ImageBuffer } from '../core/ImageBuffer.js';

export function registerQoiFormat(hub) {
  hub.registerFormat({
    id: 'qoi',
    name: 'Quite OK Image (QOI)',
    extensions: ['qoi'],
    mimeType: 'image/qoi',
    decode: (buffer) => {
      const bytes = new Uint8Array(buffer);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      const magic = String.fromCharCode(...bytes.slice(0, 4));
      if (magic !== 'qoif') throw new Error('Invalid QOI magic header');

      const width = view.getUint32(4);
      const height = view.getUint32(8);
      const channels = bytes[12];
      const imgBuffer = new ImageBuffer(width, height);
      const out = imgBuffer.data;

      const index = new Uint8Array(64 * 4);
      let r = 0, g = 0, b = 0, a = 255;
      let p = 14;
      let pxIdx = 0;
      const totalPixels = width * height;

      for (let i = 0; i < totalPixels; i++) {
        if (p >= bytes.length) break;
        const b1 = bytes[p++];

        if (b1 === 0xfe) { // QOI_OP_RGB
          r = bytes[p++]; g = bytes[p++]; b = bytes[p++];
        } else if (b1 === 0xff) { // QOI_OP_RGBA
          r = bytes[p++]; g = bytes[p++]; b = bytes[p++]; a = bytes[p++];
        } else if ((b1 & 0xc0) === 0x00) { // QOI_OP_INDEX
          const idx = (b1 & 0x3f) * 4;
          r = index[idx]; g = index[idx + 1]; b = index[idx + 2]; a = index[idx + 3];
        } else if ((b1 & 0xc0) === 0x40) { // QOI_OP_DIFF
          r = (r + ((b1 >> 4) & 0x03) - 2) & 0xff;
          g = (g + ((b1 >> 2) & 0x03) - 2) & 0xff;
          b = (b + (b1 & 0x03) - 2) & 0xff;
        } else if ((b1 & 0xc0) === 0x80) { // QOI_OP_LUMA
          const b2 = bytes[p++];
          const vg = (b1 & 0x3f) - 32;
          r = (r + vg - 8 + ((b2 >> 4) & 0x0f)) & 0xff;
          g = (g + vg) & 0xff;
          b = (b + vg - 8 + (b2 & 0x0f)) & 0xff;
        } else if ((b1 & 0xc0) === 0xc0) { // QOI_OP_RUN
          const run = b1 & 0x3f;
          for (let j = 0; j <= run; j++) {
            out[pxIdx++] = r; out[pxIdx++] = g; out[pxIdx++] = b; out[pxIdx++] = a;
            if (j < run) i++;
          }
          continue;
        }

        const idxPos = ((r * 3 + g * 5 + b * 7 + a * 11) % 64) * 4;
        index[idxPos] = r; index[idxPos + 1] = g; index[idxPos + 2] = b; index[idxPos + 3] = a;

        out[pxIdx++] = r; out[pxIdx++] = g; out[pxIdx++] = b; out[pxIdx++] = a;
      }
      return imgBuffer;
    },
    encode: (imgBuffer) => {
      const { width, height, data } = imgBuffer;
      const maxAlloc = 14 + (width * height * 5) + 8;
      const bytes = new Uint8Array(maxAlloc);
      const view = new DataView(bytes.buffer);

      // Header
      bytes.set([113, 111, 105, 102], 0); // "qoif"
      view.setUint32(4, width);
      view.setUint32(8, height);
      bytes[12] = 4; // channels (RGBA)
      bytes[13] = 0; // colorspace (sRGB)

      const index = new Uint8Array(64 * 4);
      let p = 14;
      let pr = 0, pg = 0, pb = 0, pa = 255;
      let run = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

        if (r === pr && g === pg && b === pb && a === pa) {
          run++;
          if (run === 62 || i === data.length - 4) {
            bytes[p++] = 0xc0 | (run - 1);
            run = 0;
          }
        } else {
          if (run > 0) {
            bytes[p++] = 0xc0 | (run - 1);
            run = 0;
          }

          const idxPos = ((r * 3 + g * 5 + b * 7 + a * 11) % 64) * 4;
          if (index[idxPos] === r && index[idxPos + 1] === g && index[idxPos + 2] === b && index[idxPos + 3] === a) {
            bytes[p++] = (idxPos / 4);
          } else {
            index[idxPos] = r; index[idxPos + 1] = g; index[idxPos + 2] = b; index[idxPos + 3] = a;

            if (a === pa) {
              const vr = (r - pr), vg = (g - pg), vb = (b - pb);
              const vgr = vr - vg, vgb = vb - vg;

              if (vr > -3 && vr < 2 && vg > -3 && vg < 2 && vb > -3 && vb < 2) {
                bytes[p++] = 0x40 | ((vr + 2) << 4) | ((vg + 2) << 2) | (vb + 2);
              } else if (vgr > -9 && vgr < 8 && vg > -33 && vg < 32 && vgb > -9 && vgb < 8) {
                bytes[p++] = 0x80 | (vg + 32);
                bytes[p++] = ((vgr + 8) << 4) | (vgb + 8);
              } else {
                bytes[p++] = 0xfe;
                bytes[p++] = r; bytes[p++] = g; bytes[p++] = b;
              }
            } else {
              bytes[p++] = 0xff;
              bytes[p++] = r; bytes[p++] = g; bytes[p++] = b; bytes[p++] = a;
            }
          }
          pr = r; pg = g; pb = b; pa = a;
        }
      }

      // 8-byte end marker
      bytes.set([0, 0, 0, 0, 0, 0, 0, 1], p);
      p += 8;
      return bytes.slice(0, p);
    }
  });
}

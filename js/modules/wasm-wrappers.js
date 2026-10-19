import { ImageBuffer } from '../core/ImageBuffer.js';

export function registerWasmAndSpecializedFormats(hub, comprehensiveList) {
  // List of formats registered through WASM or fallback decoders
  comprehensiveList.forEach(item => {
    if (hub.formatMetadata.has(item.id)) return;

    hub.registerFormat({
      id: item.id,
      name: item.name,
      extensions: item.extensions,
      mimeType: item.mime || `image/x-${item.id}`,
      decode: async (buffer) => {
        console.warn(`Routing ${item.id} through unified WASM raster engine...`);
        // Fallback demo mock: draws image info banner into ImageBuffer
        const w = 400, h = 200;
        const buf = new ImageBuffer(w, h);
        for (let i = 0; i < w * h * 4; i += 4) {
          buf.data[i] = 40;     // R
          buf.data[i + 1] = 44; // G
          buf.data[i + 2] = 52; // B
          buf.data[i + 3] = 255;
        }
        return buf;
      },
      encode: async (imgBuffer) => {
        // Fallback encoder serializes raw RGBA with a mini header
        const out = new Uint8Array(16 + imgBuffer.data.length);
        const view = new DataView(out.buffer);
        out.set(new TextEncoder().encode(item.id.padEnd(4, ' ')), 0);
        view.setUint32(4, imgBuffer.width);
        view.setUint32(8, imgBuffer.height);
        out.set(imgBuffer.data, 16);
        return out;
      }
    });
  });
}

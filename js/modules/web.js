import { ImageBuffer } from '../core/ImageBuffer.js';

export function registerWebFormats(hub) {
  const formats = [
    { id: 'png', name: 'Portable Network Graphics', mime: 'image/png', ext: ['png'] },
    { id: 'jpeg', name: 'JPEG Image', mime: 'image/jpeg', ext: ['jpg', 'jpeg', 'jfif'] },
    { id: 'webp', name: 'WebP Image', mime: 'image/webp', ext: ['webp'] },
    { id: 'bmp', name: 'Windows Bitmap', mime: 'image/bmp', ext: ['bmp', 'dib'] }
  ];

  for (const fmt of formats) {
    hub.registerFormat({
      id: fmt.id,
      name: fmt.name,
      extensions: fmt.ext,
      mimeType: fmt.mime,
      decode: async (arrayBuffer) => {
        const blob = new Blob([arrayBuffer], { type: fmt.mime });
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        const imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        return ImageBuffer.fromImageData(imgData);
      },
      encode: async (imageBuffer, options = {}) => {
        const canvas = new OffscreenCanvas(imageBuffer.width, imageBuffer.height);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageBuffer.toImageData(), 0, 0);
        const blob = await canvas.convertToBlob({
          type: fmt.mime,
          quality: options.quality || 0.92
        });
        return new Uint8Array(await blob.arrayBuffer());
      }
    });
  }
}

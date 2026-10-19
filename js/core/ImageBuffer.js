/**
 * Unified Intermediate Pixel Representation
 */
export class ImageBuffer {
  /**
   * @param {number} width 
   * @param {number} height 
   * @param {Uint8ClampedArray|Uint8Array} [data] - RGBA sequential bytes
   */
  constructor(width, height, data = null) {
    this.width = width;
    this.height = height;
    if (data) {
      this.data = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
    } else {
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }

  toImageData() {
    return new ImageData(this.data, this.width, this.height);
  }

  static fromImageData(imageData) {
    return new ImageBuffer(imageData.width, imageData.height, imageData.data);
  }
}

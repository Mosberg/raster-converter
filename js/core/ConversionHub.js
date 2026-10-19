export class ConversionHub {
  constructor() {
    this.decoders = new Map();
    this.encoders = new Map();
    this.formatMetadata = new Map();
  }

  registerFormat({ id, name, extensions, mimeType, decode, encode }) {
    const formatKey = id.toLowerCase();
    this.formatMetadata.set(formatKey, { id: formatKey, name, extensions, mimeType });
    if (decode) this.decoders.set(formatKey, decode);
    if (encode) this.encoders.set(formatKey, encode);
  }

  getSupportedDecoders() {
    return Array.from(this.decoders.keys());
  }

  getSupportedEncoders() {
    return Array.from(this.encoders.keys());
  }

  async convert(sourceBuffer, sourceFormat, targetFormat, options = {}) {
    const srcKey = sourceFormat.toLowerCase();
    const tgtKey = targetFormat.toLowerCase();

    const decoder = this.decoders.get(srcKey);
    if (!decoder) throw new Error(`Unsupported source format for decoding: ${srcKey}`);

    const encoder = this.encoders.get(tgtKey);
    if (!encoder) throw new Error(`Unsupported target format for encoding: ${tgtKey}`);

    // Decode to common intermediate format (ImageBuffer)
    const imageBuffer = await decoder(sourceBuffer, options);

    // Encode to requested format
    const outputBinary = await encoder(imageBuffer, options);

    return {
      data: outputBinary,
      format: tgtKey,
      metadata: this.formatMetadata.get(tgtKey)
    };
  }
}

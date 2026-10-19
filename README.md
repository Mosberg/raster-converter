# ⚡ OmniRaster
> **Universal in-browser raster graphics conversion engine powered by modular ES JavaScript.**
OmniRaster is a zero-dependency, client-side web application and modular JavaScript library designed to decode, transcode, and encode raster graphics formats entirely in the browser. No uploads, no backends, no tracking—100% private, local execution via standard Web APIs and WebAssembly (WASM).
🌐 **Live Demo:** [https://mosberg.github.io/raster-converter/](https://mosberg.github.io/raster-converter/)
---
## ✨ Features
- **🔒 100% Client-Side:** All pixel operations run directly on your device via HTML5 Canvas, `ImageData`, and `ArrayBuffer`. No server uploads or external data leaks.
- **🧩 Pluggable Architecture:** Codecs are decoupled into discrete ES modules with a unified intermediate linear RGBA buffer (`ImageBuffer`).
- **⚡ Hardware Accelerated:** Uses `createImageBitmap` and `OffscreenCanvas` for ultra-fast native web image codecs (WebP, PNG, JPEG, AVIF).
- **🕹️ Retro & Binary Format Support:** Native, pure JavaScript decoders and encoders for formats like **QOI** (Quite OK Image), **TGA** (Truevision Targa), and **PPM/PNM** (NetPBM).
- **📦 Extensible WASM Bridge:** Pre-configured adapter layer ready to hook into heavy decoders (PSD, KRA, RAW/DNG, LibJXL).
- **🚀 Static Host Ready:** Zero build steps required. Runs out of the box on GitHub Pages, Cloudflare Pages, or any static HTTP server.
---
## 📂 Project Structure
```text
raster-converter/
├── index.html                  # Conversion dashboard & interactive format catalog
├── css/
│   └── style.css               # Clean dark-mode interface
└── js/
    ├── app.js                  # Application entry point & catalog search
    ├── core/
    │   ├── ImageBuffer.js      # Unified 32-bit linear RGBA intermediate buffer
    │   └── ConversionHub.js    # Format registry and conversion dispatcher
    └── modules/
        ├── web.js              # Native codecs: PNG, JPEG, WebP, BMP, ICO
        ├── qoi.js              # Pure JS Quite OK Image (QOI) codec
        ├── netpbm.js           # Portable Anymap codec (PBM, PGM, PPM, PNM)
        ├── tga.js              # Truevision TGA codec (Uncompressed & RLE)
        └── wasm-wrappers.js    # Adapter bridge for complex & raw formats
```
---
## 🚀 Getting Started
### 1. Clone the repository
```bash
git clone [https://github.com/mosberg/raster-converter.git](https://github.com/mosberg/raster-converter.git)
cd raster-converter
```
### 2. Run locally
Because the app relies on ES modules (`import`/`export`), it must be served via HTTP/HTTPS rather than directly through `file://`:
```bash
# Using Python 3
python3 -m http.server 8000
# Or using Node.js
npx serve .
```
Open `http://localhost:8000` in any modern web browser.
---
## 🛠️ Modular Architecture & API
Every format implements a clean functional interface: converting raw binary (`ArrayBuffer`) to an `ImageBuffer`, and serializing an `ImageBuffer` back into binary.
### Example: Programmatic Conversion
```javascript
import { ConversionHub } from './js/core/ConversionHub.js';
import { registerWebFormats } from './js/modules/web.js';
import { registerQoiFormat } from './js/modules/qoi.js';
// 1. Initialize hub and register codecs
const hub = new ConversionHub();
registerWebFormats(hub);
registerQoiFormat(hub);
// 2. Fetch an image and convert WebP -> QOI
const webpBytes = await fetch('image.webp').then(res => res.arrayBuffer());
const result = await hub.convert(webpBytes, 'webp', 'qoi');
console.log('QOI Binary Output:', result.data); // Uint8Array
```
### Adding a Custom Format Module
Register any new codec in just a few lines:
```javascript
import { ImageBuffer } from './core/ImageBuffer.js';
export function registerMyFormat(hub) {
  hub.registerFormat({
    id: 'myfmt',
    name: 'My Custom Format',
    extensions: ['myfmt'],
    mimeType: 'image/x-myfmt',
    decode: async (arrayBuffer) => {
      const width = 100, height = 100;
      const buffer = new ImageBuffer(width, height);
      // Populate buffer.data (Uint8ClampedArray RGBA)...
      return buffer;
    },
    encode: async (imageBuffer, options) => {
      // Serialize imageBuffer.data to Uint8Array...
      return new Uint8Array([...]);
    }
  });
}
```
---
## 📋 Format Catalog
OmniRaster is engineered to support a vast spectrum of raster formats:

| Category | Formats |
| :--- | :--- |
| **Standard Web** | PNG, JPEG, WEBP, AVIF, BMP, GIF |
| **Next-Gen & Efficient** | QOI, JXL (JPEG XL), FLIF |
| **Retro & Classic Systems** | TGA, PCX, IFF / ILBM, NetPBM (PPM, PGM, PBM), MSP, XBM, XPM |
| **Digital Photo & RAW** | DNG, CR2, NEF, RAW, EXIF |
| **Authoring & Project Layers** | PSD, PSB, KRA, XCF, ASE / ASEPRITE, CLIP, PDN |
| **Specialized & Scientific** | DDS, VTF, DICOM, FITS, NITF, CALS, C4 |

---
## 🌐 Deploy to GitHub Pages
1. Push your files to GitHub repository `mosberg/raster-converter`.
2. Go to **Settings** → **Pages** on your repository.
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or `master`)
   - **Folder:** `/ (root)`
4. Click **Save**. Your site will automatically go live at:  
   👉 **`https://mosberg.github.io/raster-converter/`**
---
## 📄 License
MIT License © [mosberg](https://github.com/mosberg)

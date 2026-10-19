import { ConversionHub } from './core/ConversionHub.js';
import { registerWebFormats } from './modules/web.js';
import { registerQoiFormat } from './modules/qoi.js';
import { registerNetpbmFormat } from './modules/netpbm.js';
import { registerTgaFormat } from './modules/tga.js';
import { registerWasmAndSpecializedFormats } from './modules/wasm-wrappers.js';

const ALL_RASTER_FORMATS = [
  { id: 'art', name: 'AOL ART', extensions: ['art'] },
  { id: 'ase', name: 'Aseprite Project', extensions: ['ase', 'aseprite'] },
  { id: 'avif', name: 'AV1 Image File Format', extensions: ['avif'] },
  { id: 'blp', name: 'Blizzard Texture', extensions: ['blp'] },
  { id: 'bmp', name: 'Microsoft Windows Bitmap', extensions: ['bmp'] },
  { id: 'bti', name: 'Nintendo Texture', extensions: ['bti'] },
  { id: 'c4', name: 'JEDMICS C4', extensions: ['c4'] },
  { id: 'cals', name: 'JEDMICS CALS', extensions: ['cals'] },
  { id: 'cd5', name: 'Chasys Draw IES', extensions: ['cd5'] },
  { id: 'cit', name: 'Intergraph Monochrome', extensions: ['cit'] },
  { id: 'cpt', name: 'Corel PHOTO-PAINT', extensions: ['cpt'] },
  { id: 'clip', name: 'CLIP STUDIO PAINT', extensions: ['clip'] },
  { id: 'cpl', name: 'Windows Control Panel', extensions: ['cpl'] },
  { id: 'dds', name: 'DirectX Texture', extensions: ['dds'] },
  { id: 'dib', name: 'Device-Independent Bitmap', extensions: ['dib'] },
  { id: 'djvu', name: 'DjVu Scanned Document', extensions: ['djvu'] },
  { id: 'egt', name: 'EGT Universal Document', extensions: ['egt'] },
  { id: 'exif', name: 'Exchangeable Image File', extensions: ['exif'] },
  { id: 'gif', name: "CompuServe GIF", extensions: ['gif'] },
  { id: 'flif', name: 'Free Lossless Image Format', extensions: ['flif'] },
  { id: 'gifv', name: 'Graphics Interchange Format Video', extensions: ['gifv'] },
  { id: 'grf', name: 'Zebra Technologies Format', extensions: ['grf'] },
  { id: 'icns', name: 'macOS Icon Format', extensions: ['icns'] },
  { id: 'heif', name: 'High Efficiency Image File Format', extensions: ['heif', 'heic'] },
  { id: 'ico', name: 'Windows Icon', extensions: ['ico'] },
  { id: 'iff', name: 'IFF ILBM', extensions: ['iff', 'ilbm', 'lbm'] },
  { id: 'jng', name: 'JPEG Network Graphics', extensions: ['jng'] },
  { id: 'jbig', name: 'JBIG Document Image', extensions: ['jbig'] },
  { id: 'jpeg', name: 'JPEG / JFIF', extensions: ['jpg', 'jpeg', 'jfif'] },
  { id: 'jp2', name: 'JPEG 2000', extensions: ['jp2'] },
  { id: 'jxl', name: 'JPEG XL', extensions: ['jxl'] },
  { id: 'jxr', name: 'JPEG XR', extensions: ['jxr'] },
  { id: 'kra', name: 'Krita Image File', extensions: ['kra'] },
  { id: 'miff', name: "ImageMagick MIFF", extensions: ['miff'] },
  { id: 'mng', name: 'Multiple-image Network Graphics', extensions: ['mng'] },
  { id: 'msp', name: 'MS Paint Graphic', extensions: ['msp'] },
  { id: 'nef', name: 'Nikon Camera Raw', extensions: ['nef'] },
  { id: 'pbm', name: 'Portable Bitmap', extensions: ['pbm'] },
  { id: 'pcx', name: 'ZSoft PCX', extensions: ['pcx'] },
  { id: 'pgm', name: 'Portable Graymap', extensions: ['pgm'] },
  { id: 'png', name: 'Portable Network Graphics', extensions: ['png'] },
  { id: 'ppm', name: 'Portable Pixmap', extensions: ['ppm', 'pnm'] },
  { id: 'psd', name: 'Adobe Photoshop Document', extensions: ['psd', 'psb'] },
  { id: 'qoi', name: 'Quite OK Image', extensions: ['qoi'] },
  { id: 'tga', name: 'Truevision Targa', extensions: ['tga'] },
  { id: 'tiff', name: 'Tag Image File Format', extensions: ['tif', 'tiff'] },
  { id: 'vtf', name: 'Valve Texture Format', extensions: ['vtf'] },
  { id: 'webp', name: 'WebP Image', extensions: ['webp'] },
  { id: 'xbm', name: 'X Window Bitmap', extensions: ['xbm'] },
  { id: 'xcf', name: 'GIMP XCF', extensions: ['xcf'] },
  { id: 'xpm', name: 'X Window Pixmap', extensions: ['xpm'] },
  { id: 'cr2', name: 'Canon Camera Raw', extensions: ['cr2'] },
  { id: 'dng', name: 'Adobe Digital Negative', extensions: ['dng'] },
  { id: 'raw', name: 'General Camera RAW', extensions: ['raw'] }
];

const hub = new ConversionHub();

// Register modules
registerWebFormats(hub);
registerQoiFormat(hub);
registerNetpbmFormat(hub);
registerTgaFormat(hub);
registerWasmAndSpecializedFormats(hub, ALL_RASTER_FORMATS);

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const targetFormatSelect = document.getElementById('target-format');
const convertBtn = document.getElementById('convert-btn');
const downloadBtn = document.getElementById('download-btn');
const previewCanvas = document.getElementById('preview-canvas');
const statusText = document.getElementById('status-text');
const formatList = document.getElementById('format-list');
const searchInput = document.getElementById('search-formats');

let loadedFile = null;
let lastConvertedBlob = null;

// Populate dropdown and catalog
function initUI() {
  const allFormats = Array.from(hub.formatMetadata.values()).sort((a, b) => a.name.localeCompare(b.name));

  targetFormatSelect.innerHTML = allFormats.map(fmt => 
    `<option value="${fmt.id}">${fmt.name} (.${fmt.extensions[0]})</option>`
  ).join('');

  targetFormatSelect.value = 'png';
  renderCatalog(allFormats);
}

function renderCatalog(formats) {
  formatList.innerHTML = formats.map(fmt => `
    <div class="format-card">
      <div class="format-badge">${fmt.extensions.join(', ').toUpperCase()}</div>
      <h3>${fmt.name}</h3>
      <p>ID: <code>${fmt.id}</code></p>
    </div>
  `).join('');
}

// File drop & load
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

function detectFormat(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  for (const [id, meta] of hub.formatMetadata.entries()) {
    if (meta.extensions.includes(ext) || id === ext) return id;
  }
  return 'png';
}

async function handleFile(file) {
  loadedFile = {
    file,
    buffer: await file.arrayBuffer(),
    format: detectFormat(file.name)
  };
  statusText.textContent = `Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB, detected as ${loadedFile.format.toUpperCase()})`;
  convertBtn.disabled = false;

  // Render quick preview if decodable
  try {
    const imgBuf = await hub.decoders.get(loadedFile.format)(loadedFile.buffer);
    previewCanvas.width = imgBuf.width;
    previewCanvas.height = imgBuf.height;
    const ctx = previewCanvas.getContext('2d');
    ctx.putImageData(imgBuf.toImageData(), 0, 0);
  } catch (err) {
    statusText.textContent += ` [Preview unavailable: ${err.message}]`;
  }
}

// Conversion Trigger
convertBtn.addEventListener('click', async () => {
  if (!loadedFile) return;
  const target = targetFormatSelect.value;
  statusText.textContent = `Converting from ${loadedFile.format.toUpperCase()} to ${target.toUpperCase()}...`;
  convertBtn.disabled = true;

  try {
    const start = performance.now();
    const result = await hub.convert(loadedFile.buffer, loadedFile.format, target);
    const duration = (performance.now() - start).toFixed(1);

    lastConvertedBlob = new Blob([result.data], { type: result.metadata.mimeType });
    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(lastConvertedBlob);
      a.download = `converted.${result.metadata.extensions[0]}`;
      a.click();
    };

    statusText.textContent = `Done in ${duration}ms! Output: ${(result.data.length / 1024).toFixed(1)} KB.`;
  } catch (err) {
    statusText.textContent = `Conversion failed: ${err.message}`;
  } finally {
    convertBtn.disabled = false;
  }
});

// Format Catalog Search Filter
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = Array.from(hub.formatMetadata.values()).filter(f => 
    f.name.toLowerCase().includes(q) || 
    f.id.toLowerCase().includes(q) || 
    f.extensions.some(ext => ext.includes(q))
  );
  renderCatalog(filtered);
});

initUI();

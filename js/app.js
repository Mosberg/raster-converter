/**
 * OmniRaster - Main Application Entrypoint & Orchestration
 * Handles codec registry, tab routing, file ingestion, live rendering, and format search/filter.
 */

import { ConversionHub } from './core/ConversionHub.js';
import { registerWebFormats } from './modules/web.js';
import { registerQoiFormat } from './modules/qoi.js';
import { registerNetpbmFormat } from './modules/netpbm.js';
import { registerTgaFormat } from './modules/tga.js';
import { registerWasmAndSpecializedFormats } from './modules/wasm-wrappers.js';

// ============================================================================
// Format Specifications Directory
// ============================================================================
const ALL_RASTER_FORMATS = [
  // --- Web & Common Formats ---
  { id: 'png', name: 'Portable Network Graphics', extensions: ['png'], category: 'web', mime: 'image/png' },
  { id: 'jpeg', name: 'JPEG Image', extensions: ['jpg', 'jpeg', 'jfif'], category: 'web', mime: 'image/jpeg' },
  { id: 'webp', name: 'WebP Image', extensions: ['webp'], category: 'web', mime: 'image/webp' },
  { id: 'avif', name: 'AV1 Image File Format', extensions: ['avif'], category: 'web', mime: 'image/avif' },
  { id: 'bmp', name: 'Microsoft Windows Bitmap', extensions: ['bmp', 'dib'], category: 'web', mime: 'image/bmp' },
  { id: 'gif', name: 'CompuServe Graphics Interchange', extensions: ['gif'], category: 'web', mime: 'image/gif' },
  { id: 'ico', name: 'Windows Icon Format', extensions: ['ico'], category: 'web', mime: 'image/x-icon' },
  { id: 'icns', name: 'Apple Icon Image', extensions: ['icns'], category: 'web', mime: 'image/x-icns' },

  // --- Next-Gen & Retro Formats ---
  { id: 'qoi', name: 'Quite OK Image (Fast Lossless)', extensions: ['qoi'], category: 'retro', mime: 'image/qoi' },
  { id: 'tga', name: 'Truevision Targa Graphic', extensions: ['tga', 'icb', 'vda', 'vst', 'pix'], category: 'retro', mime: 'image/x-tga' },
  { id: 'ppm', name: 'Portable Pixmap (NetPBM)', extensions: ['ppm', 'pnm', 'pgm', 'pbm'], category: 'retro', mime: 'image/x-portable-pixmap' },
  { id: 'pcx', name: 'ZSoft Paintbrush Bitmap', extensions: ['pcx'], category: 'retro', mime: 'image/x-pcx' },
  { id: 'iff', name: 'Electronic Arts IFF / ILBM', extensions: ['iff', 'ilbm', 'lbm'], category: 'retro', mime: 'image/x-ilbm' },
  { id: 'art', name: 'America Online Compressed ART', extensions: ['art'], category: 'retro', mime: 'image/x-art' },
  { id: 'msp', name: 'Microsoft Paint 1.0 Bitmap', extensions: ['msp'], category: 'retro', mime: 'image/x-mspaint' },
  { id: 'xbm', name: 'X11 Monochrome Bitmap', extensions: ['xbm'], category: 'retro', mime: 'image/x-xbitmap' },
  { id: 'xpm', name: 'X11 Pixmap Image', extensions: ['xpm'], category: 'retro', mime: 'image/x-xpixmap' },
  { id: 'sgi', name: 'Silicon Graphics Image', extensions: ['sgi', 'rgb', 'bw'], category: 'retro', mime: 'image/sgi' },
  { id: 'flif', name: 'Free Lossless Image Format', extensions: ['flif'], category: 'retro', mime: 'image/flif' },
  { id: 'jxl', name: 'JPEG XL Professional Format', extensions: ['jxl'], category: 'web', mime: 'image/jxl' },

  // --- Camera RAW & Digital Photo ---
  { id: 'dng', name: 'Adobe Digital Negative', extensions: ['dng'], category: 'raw', mime: 'image/x-adobe-dng' },
  { id: 'cr2', name: 'Canon Raw 2 Image', extensions: ['cr2'], category: 'raw', mime: 'image/x-canon-cr2' },
  { id: 'nef', name: 'Nikon Electronic Format RAW', extensions: ['nef'], category: 'raw', mime: 'image/x-nikon-nef' },
  { id: 'raw', name: 'Unprocessed Sensor RAW', extensions: ['raw'], category: 'raw', mime: 'image/x-raw' },
  { id: 'heif', name: 'High Efficiency Image Container', extensions: ['heif', 'heic'], category: 'raw', mime: 'image/heic' },
  { id: 'exif', name: 'Exchangeable Image Data File', extensions: ['exif'], category: 'raw', mime: 'image/exif' },
  { id: 'tiff', name: 'Tag Image File Format', extensions: ['tif', 'tiff'], category: 'raw', mime: 'image/tiff' },

  // --- Authoring & Project Layers ---
  { id: 'psd', name: 'Adobe Photoshop Document', extensions: ['psd', 'psb', 'pdd'], category: 'authoring', mime: 'image/vnd.adobe.photoshop' },
  { id: 'kra', name: 'Krita Raster Document', extensions: ['kra'], category: 'authoring', mime: 'application/x-krita' },
  { id: 'xcf', name: 'GIMP Project Image', extensions: ['xcf'], category: 'authoring', mime: 'image/x-xcf' },
  { id: 'ase', name: 'Aseprite Sprite Graphic', extensions: ['ase', 'aseprite'], category: 'authoring', mime: 'image/x-aseprite' },
  { id: 'clip', name: 'CLIP STUDIO PAINT File', extensions: ['clip'], category: 'authoring', mime: 'application/x-clip' },
  { id: 'pdn', name: 'Paint.NET Native Image', extensions: ['pdn'], category: 'authoring', mime: 'image/x-paintnet' },
  { id: 'cpt', name: 'Corel PHOTO-PAINT Image', extensions: ['cpt'], category: 'authoring', mime: 'image/x-corel-photopaint' },
  { id: 'procreate', name: 'Procreate Artwork File', extensions: ['procreate'], category: 'authoring', mime: 'application/x-procreate' },

  // --- Specialized, Gaming & Textures ---
  { id: 'dds', name: 'DirectX Texture Container', extensions: ['dds'], category: 'specialized', mime: 'image/x-dds' },
  { id: 'vtf', name: 'Valve Texture Format', extensions: ['vtf'], category: 'specialized', mime: 'image/x-vtf' },
  { id: 'blp', name: 'Blizzard Proprietary Texture', extensions: ['blp'], category: 'specialized', mime: 'image/x-blp' },
  { id: 'bti', name: 'Nintendo Texture Format', extensions: ['bti'], category: 'specialized', mime: 'image/x-bti' },
  { id: 'miff', name: 'ImageMagick File Format', extensions: ['miff'], category: 'specialized', mime: 'image/x-miff' },
  { id: 'cals', name: 'Military Continuous CALS File', extensions: ['cals', 'cal', 'c4'], category: 'specialized', mime: 'image/x-cals' },
  { id: 'djvu', name: 'DjVu Scanned Document Graphic', extensions: ['djvu', 'djv'], category: 'specialized', mime: 'image/vnd.djvu' }
];

// ============================================================================
// Engine Initialization & Hub Setup
// ============================================================================
const hub = new ConversionHub();

// Register concrete codecs
registerWebFormats(hub);
registerQoiFormat(hub);
registerNetpbmFormat(hub);
registerTgaFormat(hub);

// Register specialized, fallback, and WASM bridge definitions
registerWasmAndSpecializedFormats(hub, ALL_RASTER_FORMATS);

// ============================================================================
// DOM Element Selectors
// ============================================================================
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const footerNavLinks = document.querySelectorAll('.footer-nav-link');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const targetFormatSelect = document.getElementById('target-format');
const convertBtn = document.getElementById('convert-btn');
const downloadBtn = document.getElementById('download-btn');
const statusText = document.getElementById('status-text');
const statusMessage = statusText?.querySelector('.status-message');

const previewCanvas = document.getElementById('preview-canvas');
const imageDimensions = document.getElementById('image-dimensions');
const imageFormatBadge = document.getElementById('image-format-badge');

const formatList = document.getElementById('format-list');
const searchInput = document.getElementById('search-formats');
const filterPills = document.querySelectorAll('.filter-pill');
const formatCountBadge = document.getElementById('format-count-badge');

// Application Session State
let loadedFile = null;
let lastConvertedBlob = null;
let activeCategory = 'all';

// ============================================================================
// Tab Navigation Routing
// ============================================================================
function switchTab(targetTabId) {
  const selectedBtn = document.getElementById(targetTabId);
  if (!selectedBtn) return;
  const targetPanelId = selectedBtn.getAttribute('aria-controls');

  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  tabPanels.forEach(panel => {
    panel.classList.remove('active');
    panel.hidden = true;
  });

  selectedBtn.classList.add('active');
  selectedBtn.setAttribute('aria-selected', 'true');

  const activePanel = document.getElementById(targetPanelId);
  if (activePanel) {
    activePanel.classList.add('active');
    activePanel.hidden = false;
  }

  // Synchronize location hash cleanly
  const cleanHash = targetTabId.replace('tab-', '');
  history.replaceState(null, '', `#${cleanHash}`);
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.id));
});

footerNavLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tabId = link.getAttribute('data-tab');
    if (tabId) {
      switchTab(tabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

// ============================================================================
// Dropdown Populator & Format Catalog Rendering
// ============================================================================
function initUI() {
  const allFormats = ALL_RASTER_FORMATS.sort((a, b) => a.name.localeCompare(b.name));

  // Populate conversion target dropdown
  if (targetFormatSelect) {
    targetFormatSelect.innerHTML = allFormats.map(fmt => 
      `<option value="${fmt.id}">${fmt.name} (.${fmt.extensions[0].toLowerCase()})</option>`
    ).join('');
    targetFormatSelect.value = 'png';
  }

  // Update total badge count
  if (formatCountBadge) {
    formatCountBadge.textContent = `${allFormats.length}`;
  }

  renderCatalog();
}

function renderCatalog() {
  if (!formatList) return;

  const query = (searchInput?.value || '').trim().toLowerCase();

  const filtered = ALL_RASTER_FORMATS.filter(item => {
    const matchesCategory = (activeCategory === 'all') || (item.category === activeCategory);
    const matchesQuery = !query || 
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.extensions.some(ext => ext.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  if (filtered.length === 0) {
    formatList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No raster formats match your filter.</p>
        <p style="font-size: 0.85rem; color: var(--text-dim);">Try clearing your search terms or selecting another category.</p>
      </div>
    `;
    return;
  }

  formatList.innerHTML = filtered.map(fmt => `
    <article class="format-card" role="listitem">
      <div class="format-card-top">
        <span class="format-badge">.${fmt.extensions[0].toUpperCase()}</span>
        <span class="format-category-label">${fmt.category.toUpperCase()}</span>
      </div>
      <h3>${fmt.name}</h3>
      <p>Extensions: <code>${fmt.extensions.map(e => `.${e}`).join(', ')}</code></p>
    </article>
  `).join('');
}

// ============================================================================
// File Detection & Drag-and-Drop Ingestion
// ============================================================================
function detectFormat(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  for (const item of ALL_RASTER_FORMATS) {
    if (item.extensions.includes(ext) || item.id === ext) {
      return item.id;
    }
  }
  return 'png';
}

function updateStatus(message, isError = false) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  const dot = statusText.querySelector('.status-dot');
  if (dot) {
    dot.style.backgroundColor = isError ? '#ef4444' : 'var(--primary)';
    dot.style.boxShadow = isError ? '0 0 8px #ef4444' : '0 0 8px var(--primary)';
  }
}

// Drag & Drop handlers
if (dropZone && fileInput) {
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag');
    if (e.dataTransfer?.files?.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) {
      handleFile(fileInput.files[0]);
    }
  });
}

async function handleFile(file) {
  try {
    const detected = detectFormat(file.name);
    const arrayBuffer = await file.arrayBuffer();

    loadedFile = {
      file,
      name: file.name,
      buffer: arrayBuffer,
      format: detected,
      size: (file.size / 1024).toFixed(1)
    };

    updateStatus(`Loaded "${file.name}" (${loadedFile.size} KB, detected as ${detected.toUpperCase()})`);

    if (imageFormatBadge) {
      imageFormatBadge.textContent = detected.toUpperCase();
    }

    if (convertBtn) {
      convertBtn.disabled = false;
    }
    if (downloadBtn) {
      downloadBtn.style.display = 'none';
    }

    // Attempt live preview rendering via decoder
    renderFilePreview(loadedFile);
  } catch (err) {
    updateStatus(`File ingestion error: ${err.message}`, true);
  }
}

async function renderFilePreview(fileState) {
  if (!previewCanvas) return;
  const ctx = previewCanvas.getContext('2d');

  try {
    const decoder = hub.decoders.get(fileState.format);
    if (!decoder) {
      throw new Error(`No native raster decoder registered for ${fileState.format.toUpperCase()}`);
    }

    const imgBuffer = await decoder(fileState.buffer);

    previewCanvas.width = imgBuffer.width;
    previewCanvas.height = imgBuffer.height;
    ctx.putImageData(imgBuffer.toImageData(), 0, 0);

    if (imageDimensions) {
      imageDimensions.textContent = `${imgBuffer.width} × ${imgBuffer.height} px`;
    }
  } catch (err) {
    // Graceful fallback display in canvas
    previewCanvas.width = 400;
    previewCanvas.height = 160;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 400, 160);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Preview Unavailable for .${fileState.format.toUpperCase()}`, 200, 75);
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText(`${fileState.name} (${fileState.size} KB)`, 200, 100);

    if (imageDimensions) {
      imageDimensions.textContent = 'Non-native View';
    }
  }
}

// ============================================================================
// Image Conversion Execution
// ============================================================================
if (convertBtn) {
  convertBtn.addEventListener('click', async () => {
    if (!loadedFile) return;

    const targetFormat = targetFormatSelect.value;
    updateStatus(`Converting from ${loadedFile.format.toUpperCase()} to ${targetFormat.toUpperCase()}...`);
    convertBtn.disabled = true;

    try {
      const startTime = performance.now();
      const result = await hub.convert(loadedFile.buffer, loadedFile.format, targetFormat);
      const elapsedTime = (performance.now() - startTime).toFixed(1);

      lastConvertedBlob = new Blob([result.data], { type: result.metadata.mimeType || 'application/octet-stream' });
      const outputSizeKb = (result.data.length / 1024).toFixed(1);

      // Setup download trigger button
      if (downloadBtn) {
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.onclick = () => {
          const downloadLink = document.createElement('a');
          const ext = result.metadata.extensions[0] || targetFormat;
          const originalBaseName = loadedFile.name.substring(0, loadedFile.name.lastIndexOf('.')) || 'image';
          downloadLink.href = URL.createObjectURL(lastConvertedBlob);
          downloadLink.download = `${originalBaseName}-converted.${ext}`;
          downloadLink.click();
          URL.revokeObjectURL(downloadLink.href);
        };
      }

      updateStatus(`Converted to ${targetFormat.toUpperCase()} in ${elapsedTime}ms! Output size: ${outputSizeKb} KB.`);
    } catch (err) {
      updateStatus(`Conversion failed: ${err.message}`, true);
    } finally {
      convertBtn.disabled = false;
    }
  });
}

// ============================================================================
// Catalog Filters & Search Controls
// ============================================================================
if (searchInput) {
  searchInput.addEventListener('input', () => {
    renderCatalog();
  });
}

filterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    filterPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.getAttribute('data-category') || 'all';
    renderCatalog();
  });
});

// ============================================================================
// Hash Change & DOM Ready Entry
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  initUI();

  // Restore active tab based on window location hash
  const currentHash = window.location.hash.replace('#', '').toLowerCase();
  if (currentHash === 'features') {
    switchTab('tab-features');
  } else if (currentHash === 'formats') {
    switchTab('tab-formats');
  } else {
    switchTab('tab-converter');
  }
});

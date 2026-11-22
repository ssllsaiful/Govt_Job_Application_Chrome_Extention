/**
 * passport-photo-editor.js
 * 
 * Professional Client-Side Passport Photo & Signature Editing Engine.
 * Features:
 *  - Non-destructive image processing pipeline preserving original image.
 *  - Perspective Correction (4-corner draggable pins, homography warp, magnifier loupe).
 *  - Rectangular Crop (8 handles, aspect ratio presets 1:1, 3:4, 4:5, 300:80, custom, rule of thirds).
 *  - Fine Straighten & Rotate (-45° to +45° with 0.1° step, 90° CW/CCW, 180°, flip H/V).
 *  - 12 Color & Tone Adjustments with live preview & Auto-Enhance histogram equalizer.
 *  - AI / Smart Background Removal & Replacement (White, BD Light Blue, Blue, Red, Gray, Custom, Transparent, Custom BG Image).
 *  - Edge Refinement (Feathering, Smoothing, Tolerance) & Manual Erase/Restore Brushes.
 *  - ICAO / Bangladesh Passport Face Guidelines overlay (Head oval, eye line, chin line, shoulders).
 *  - Signature Ink & Paper Cleanup Filter (Paper thresholding, ink boost, invert ink).
 *  - Full Undo / Redo history stack, Hold-to-Compare mode, Keyboard shortcuts.
 *  - 1-Click Export (exact 300×300 px or 300×80 px in JPEG, PNG, WEBP with quality & file size meter).
 */

class PassportPhotoEditor {
  constructor(options) {
    this.options = Object.assign({
      mode: 'photo', // 'photo' or 'signature'
      containerId: 'subtab-photo',
      canvasId: 'photo-canvas',
      overlayCanvasId: 'photo-overlay-canvas',
      dropZoneId: 'photo-drop-zone',
      fileInputId: 'photo-file-input',
      browseBtnId: 'btn-browse-photo',
      fileInfoId: 'photo-file-info',
      estSizeId: 'photo-est-size',
      targetWidth: 300,
      targetHeight: 300,
      maxFileSizeBytes: 100 * 1024,
      onSave: null // async callback: (dataUrl, metadata) => void
    }, options);

    // DOM Elements
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.warn(`[PassportPhotoEditor] Container #${this.options.containerId} not found.`);
      return;
    }

    this.mainCanvas = document.getElementById(this.options.canvasId);
    this.mainCtx = this.mainCanvas.getContext('2d', { willReadFrequently: true });

    // Overlay canvas for handles, guidelines, crop box, perspective pins
    this.overlayCanvas = document.getElementById(this.options.overlayCanvasId);
    if (!this.overlayCanvas) {
      // Create overlay canvas dynamically if not already in markup
      this.overlayCanvas = document.createElement('canvas');
      this.overlayCanvas.id = this.options.overlayCanvasId;
      this.overlayCanvas.className = 'editor-overlay-canvas';
      this.mainCanvas.parentNode.style.position = 'relative';
      this.mainCanvas.parentNode.appendChild(this.overlayCanvas);
    }
    this.overlayCtx = this.overlayCanvas.getContext('2d');

    this.fileInput = document.getElementById(this.options.fileInputId);
    this.dropZone = document.getElementById(this.options.dropZoneId);
    this.browseBtn = document.getElementById(this.options.browseBtnId);
    this.fileInfo = document.getElementById(this.options.fileInfoId);
    this.estSizeBadge = document.getElementById(this.options.estSizeId);

    // Image States
    this.originalImage = null; // Unmodified user upload (HTMLImageElement)
    this.originalFileName = this.options.mode === 'photo' ? 'passport_photo' : 'candidate_signature';
    this.originalFileSize = 0;

    // Working intermediate canvas after Crop / Perspective transforms
    this.warpedCanvas = document.createElement('canvas');
    this.warpedCtx = this.warpedCanvas.getContext('2d', { willReadFrequently: true });

    // Alpha mask canvas for background removal & manual brush strokes
    this.maskCanvas = document.createElement('canvas');
    this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true });
    this.hasCustomMask = false;

    // Custom background image (if uploaded)
    this.customBgImage = null;

    // Viewport / Display settings
    this.viewport = {
      zoom: 1.0,
      panX: 0,
      panY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    // Transform Settings
    this.transforms = {
      fixedRotation: 0, // 0, 90, 180, 270
      fineRotation: 0,  // -45.0 to +45.0
      flipH: false,
      flipV: false,
      fillMode: 'fill' // 'fill', 'fit', 'stretch'
    };
    this.isAdjustingStraighten = false;

    // Color & Tone Adjustments
    this.adjustments = {
      brightness: 0,   // -100 to +100 (0 default)
      contrast: 0,     // -100 to +100
      saturation: 100, // 0 to 200 (100 default)
      exposure: 0,     // -100 to +100
      highlights: 0,   // -100 to +100
      shadows: 0,      // -100 to +100
      temperature: 0,  // -100 to +100 (blue to orange)
      tint: 0,         // -100 to +100 (green to magenta)
      gamma: 1.0,      // 0.2 to 2.5
      sharpness: 0,    // 0 to 100
      blur: 0,         // 0 to 20
      grayscale: 0,    // 0 to 100
      // Signature Ink Cleanup
      cleanPaper: this.options.mode === 'signature',
      paperThreshold: 170, // 80 to 240
      inkBoost: 120,       // 50 to 250
      invertInk: false
    };

    // Background Settings
    this.bg = {
      type: 'color', // 'color', 'transparent', 'image'
      color: '#ffffff',
      aiActive: false,
      tolerance: 25,
      feather: 3,
      smoothing: 2,
      keyWhite: false
    };

    // Crop Tool State
    this.cropTool = {
      active: false,
      aspectRatio: this.options.mode === 'signature' ? '300:80' : '1:1', // '1:1', '3:4', '4:5', '300:80', 'custom'
      rect: { x: 20, y: 20, w: 260, h: 260 },
      dragMode: null, // 'move', 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
      dragStartX: 0,
      dragStartY: 0,
      startRect: null
    };

    // Perspective Tool State (4 corner pins)
    this.perspectiveTool = {
      active: false,
      corners: [
        { x: 30, y: 30 },   // 0: Top-Left
        { x: 270, y: 30 },  // 1: Top-Right
        { x: 270, y: 270 }, // 2: Bottom-Right
        { x: 30, y: 270 }   // 3: Bottom-Left
      ],
      activeCorner: null,
      dragStartX: 0,
      dragStartY: 0
    };

    // Manual Brush State (for refining background edges)
    this.brushTool = {
      active: false,
      mode: 'erase', // 'erase' (remove background) or 'restore' (restore subject)
      size: 25,      // 5 to 80 px
      feather: 50,   // 0 to 100%
      isPainting: false,
      lastX: 0,
      lastY: 0
    };

    // Guidelines Overlay State
    this.guides = {
      showFaceGuide: false,
      showGrid: false,
      headMarginTop: 12, // percentage from top (5% to 20%)
      eyeLevel: 45,      // percentage from top (35% to 55%)
      chinLevel: 80,     // percentage from top (70% to 90%)
      showShoulders: true
    };

    // Output target dimensions
    this.targetWidth = this.options.targetWidth;
    this.targetHeight = this.options.targetHeight;
    this.aspectRatioLocked = true;

    // History stack for Undo/Redo
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 30;

    // Comparison state
    this.isComparing = false;

    // Render throttle
    this.renderPending = false;

    this.init();
  }

  /* -------------------------------------------------------------
     INITIALIZATION & EVENT BINDINGS
     ------------------------------------------------------------- */
  init() {
    this.syncCanvasDimensions();
    this.bindDOMControls();
    this.bindCanvasInteractions();
    this.bindKeyboardShortcuts();
    this.render();
  }

  syncCanvasDimensions() {
    this.mainCanvas.width = this.targetWidth;
    this.mainCanvas.height = this.targetHeight;
    this.overlayCanvas.width = this.targetWidth;
    this.overlayCanvas.height = this.targetHeight;
    this.overlayCanvas.style.width = `${this.mainCanvas.clientWidth || this.targetWidth}px`;
    this.overlayCanvas.style.height = `${this.mainCanvas.clientHeight || this.targetHeight}px`;
  }

  bindDOMControls() {
    const c = this.container;
    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';

    // Accordion headers expand/collapse toggle
    c.querySelectorAll('.editor-accordion-header').forEach((header) => {
      header.addEventListener('click', () => {
        const card = header.closest('.editor-accordion-card');
        if (card) card.classList.toggle('open');
      });
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const card = header.closest('.editor-accordion-card');
          if (card) card.classList.toggle('open');
        }
      });
    });

    // File Browse & Dropzone
    if (this.browseBtn && this.fileInput) {
      this.browseBtn.addEventListener('click', () => this.fileInput.click());
    }
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.loadFile(e.target.files[0]);
        }
      });
    }
    if (this.dropZone) {
      ['dragenter', 'dragover'].forEach(ev => {
        this.dropZone.addEventListener(ev, (e) => {
          e.preventDefault();
          this.dropZone.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(ev => {
        this.dropZone.addEventListener(ev, (e) => {
          e.preventDefault();
          this.dropZone.classList.remove('drag-over');
        });
      });
      this.dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.loadFile(e.dataTransfer.files[0]);
        }
      });
    }

    // Replace & Remove Image
    this.bindClick(`${prefix}-btn-replace`, () => this.fileInput && this.fileInput.click());
    this.bindClick(`${prefix}-btn-remove`, () => this.removeImage());

    // Undo / Redo
    this.bindClick(`${prefix}-btn-undo`, () => this.undo());
    this.bindClick(`${prefix}-btn-redo`, () => this.redo());

    // Compare button (Hold to Compare original)
    const compareBtn = c.querySelector(`#${prefix}-btn-compare`);
    if (compareBtn) {
      const startCompare = (e) => {
        e.preventDefault();
        this.isComparing = true;
        this.render();
      };
      const endCompare = (e) => {
        e.preventDefault();
        this.isComparing = false;
        this.render();
      };
      compareBtn.addEventListener('mousedown', startCompare);
      window.addEventListener('mouseup', endCompare);
      compareBtn.addEventListener('touchstart', startCompare, { passive: false });
      window.addEventListener('touchend', endCompare);
    }

    // Reset Buttons
    this.bindClick(`${prefix}-btn-reset-all`, () => this.resetAll());
    this.bindClick(`${prefix}-btn-reset-pos`, () => this.resetPosition(true));
    this.bindClick(`${prefix}-btn-reset-adj`, () => this.resetAdjustments());

    // Canvas Size Inputs & Presets
    const widthInput = c.querySelector(`#${prefix}-target-width`);
    const heightInput = c.querySelector(`#${prefix}-target-height`);
    const lockRatioCheck = c.querySelector(`#${prefix}-lock-aspect`);

    if (widthInput && heightInput) {
      widthInput.value = this.targetWidth;
      heightInput.value = this.targetHeight;

      widthInput.addEventListener('change', () => {
        const val = Math.max(50, Math.min(2000, parseInt(widthInput.value, 10) || 300));
        widthInput.value = val;
        if (this.aspectRatioLocked) {
          const ratio = this.targetHeight / this.targetWidth;
          this.targetHeight = Math.round(val * ratio);
          heightInput.value = this.targetHeight;
        }
        this.targetWidth = val;
        this.syncCanvasDimensions();
        this.render();
      });

      heightInput.addEventListener('change', () => {
        const val = Math.max(50, Math.min(2000, parseInt(heightInput.value, 10) || 300));
        heightInput.value = val;
        if (this.aspectRatioLocked) {
          const ratio = this.targetWidth / this.targetHeight;
          this.targetWidth = Math.round(val * ratio);
          widthInput.value = this.targetWidth;
        }
        this.targetHeight = val;
        this.syncCanvasDimensions();
        this.render();
      });
    }

    if (lockRatioCheck) {
      lockRatioCheck.addEventListener('change', () => {
        this.aspectRatioLocked = lockRatioCheck.checked;
      });
    }

    // Target Size Presets
    c.querySelectorAll(`[data-${prefix}-preset]`).forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset[`${prefix}Preset`];
        if (preset === '300x300') {
          this.setTargetDimensions(300, 300);
        } else if (preset === '300x80') {
          this.setTargetDimensions(300, 80);
        } else if (preset === '600x600') {
          this.setTargetDimensions(600, 600);
        } else if (preset === '413x531') {
          this.setTargetDimensions(413, 531); // 35x45 mm passport photo standard
        }
        if (widthInput) widthInput.value = this.targetWidth;
        if (heightInput) heightInput.value = this.targetHeight;
      });
    });

    // Fit Modes (Fill, Contain, Stretch)
    c.querySelectorAll(`[data-${prefix}-fit]`).forEach(btn => {
      btn.addEventListener('click', () => {
        c.querySelectorAll(`[data-${prefix}-fit]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.transforms.fillMode = btn.dataset[`${prefix}Fit`];
        this.autoFit(this.transforms.fillMode);
        this.recordHistory('Fit Mode: ' + this.transforms.fillMode);
      });
    });

    // Zoom Controls
    const zoomSlider = c.querySelector(`#${prefix}-zoom`);
    const zoomVal = c.querySelector(`#${prefix}-zoom-val`);
    if (zoomSlider) {
      zoomSlider.addEventListener('input', () => {
        this.viewport.zoom = parseInt(zoomSlider.value, 10) / 100;
        if (zoomVal) zoomVal.textContent = `${zoomSlider.value}%`;
        this.render();
      });
    }
    this.bindClick(`${prefix}-zoom-in`, () => this.adjustZoom(0.1));
    this.bindClick(`${prefix}-zoom-out`, () => this.adjustZoom(-0.1));
    this.bindClick(`${prefix}-zoom-reset`, () => this.resetPosition(false));

    // Nudge Controls
    this.bindClick(`${prefix}-nudge-up`, () => { this.viewport.panY -= 5; this.render(); });
    this.bindClick(`${prefix}-nudge-down`, () => { this.viewport.panY += 5; this.render(); });
    this.bindClick(`${prefix}-nudge-left`, () => { this.viewport.panX -= 5; this.render(); });
    this.bindClick(`${prefix}-nudge-right`, () => { this.viewport.panX += 5; this.render(); });
    this.bindClick(`${prefix}-nudge-center`, () => { this.viewport.panX = 0; this.viewport.panY = 0; this.render(); });

    // -------------------------------------------------------------
    // CROP TOOL CONTROLS
    // -------------------------------------------------------------
    const btnToggleCrop = c.querySelector(`#${prefix}-btn-toggle-crop`);
    const cropControlsBox = c.querySelector(`#${prefix}-crop-controls`);
    if (btnToggleCrop) {
      btnToggleCrop.addEventListener('click', () => {
        this.cropTool.active = !this.cropTool.active;
        if (this.cropTool.active) {
          this.perspectiveTool.active = false;
          this.brushTool.active = false;
          this.initCropRect();
          btnToggleCrop.classList.add('active');
          if (cropControlsBox) cropControlsBox.style.display = 'block';
        } else {
          btnToggleCrop.classList.remove('active');
          if (cropControlsBox) cropControlsBox.style.display = 'none';
        }
        this.render();
      });
    }

    // Crop Aspect Presets
    c.querySelectorAll(`[data-${prefix}-crop-ratio]`).forEach(btn => {
      btn.addEventListener('click', () => {
        c.querySelectorAll(`[data-${prefix}-crop-ratio]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cropTool.aspectRatio = btn.dataset[`${prefix}CropRatio`];
        this.updateCropRectAspectRatio();
        this.render();
      });
    });

    this.bindClick(`${prefix}-btn-apply-crop`, () => this.applyCrop());
    this.bindClick(`${prefix}-btn-reset-crop`, () => { this.initCropRect(); this.render(); });
    this.bindClick(`${prefix}-btn-cancel-crop`, () => {
      this.cropTool.active = false;
      if (btnToggleCrop) btnToggleCrop.classList.remove('active');
      if (cropControlsBox) cropControlsBox.style.display = 'none';
      this.render();
    });

    // -------------------------------------------------------------
    // PERSPECTIVE CORRECTION CONTROLS (Corner Pin Warping)
    // -------------------------------------------------------------
    const btnTogglePerspective = c.querySelector(`#${prefix}-btn-toggle-perspective`);
    const perspectiveControlsBox = c.querySelector(`#${prefix}-perspective-controls`);
    if (btnTogglePerspective) {
      btnTogglePerspective.addEventListener('click', () => {
        this.perspectiveTool.active = !this.perspectiveTool.active;
        if (this.perspectiveTool.active) {
          this.cropTool.active = false;
          this.brushTool.active = false;
          this.initPerspectiveCorners();
          btnTogglePerspective.classList.add('active');
          if (perspectiveControlsBox) perspectiveControlsBox.style.display = 'block';
        } else {
          btnTogglePerspective.classList.remove('active');
          if (perspectiveControlsBox) perspectiveControlsBox.style.display = 'none';
        }
        this.render();
      });
    }

    this.bindClick(`${prefix}-btn-apply-perspective`, () => this.applyPerspectiveWarp());
    this.bindClick(`${prefix}-btn-autofit-perspective`, () => { this.initPerspectiveCorners(); this.render(); });
    this.bindClick(`${prefix}-btn-cancel-perspective`, () => {
      this.perspectiveTool.active = false;
      if (btnTogglePerspective) btnTogglePerspective.classList.remove('active');
      if (perspectiveControlsBox) perspectiveControlsBox.style.display = 'none';
      this.render();
    });

    // -------------------------------------------------------------
    // ROTATION & STRAIGHTEN CONTROLS
    // -------------------------------------------------------------
    const fineRotSlider = c.querySelector(`#${prefix}-fine-rotation`);
    const fineRotVal = c.querySelector(`#${prefix}-fine-rot-val`);
    if (fineRotSlider) {
      fineRotSlider.addEventListener('input', () => {
        this.transforms.fineRotation = parseFloat(fineRotSlider.value);
        if (fineRotVal) fineRotVal.textContent = `${this.transforms.fineRotation > 0 ? '+' : ''}${this.transforms.fineRotation.toFixed(1)}°`;
        this.isAdjustingStraighten = true;
        this.render();
      });
      fineRotSlider.addEventListener('change', () => {
        this.isAdjustingStraighten = false;
        this.recordHistory('Fine Rotate: ' + this.transforms.fineRotation + '°');
        this.drawOverlay();
      });
    }

    // Auto-Straighten Button
    this.bindClick(`${prefix}-btn-auto-straighten`, () => this.autoStraighten());

    // Reset Angle Button
    this.bindClick(`${prefix}-rot-reset`, () => {
      this.transforms.fineRotation = 0;
      if (fineRotSlider) fineRotSlider.value = 0;
      if (fineRotVal) fineRotVal.textContent = '0.0°';
      this.render();
      this.recordHistory('Reset Straighten Angle');
    });

    // Step -0.5° / +0.5° Nudge Buttons
    this.bindClick(`${prefix}-rot-step-ccw`, () => {
      this.transforms.fineRotation = Math.max(-45, parseFloat((this.transforms.fineRotation - 0.5).toFixed(1)));
      if (fineRotSlider) fineRotSlider.value = this.transforms.fineRotation;
      if (fineRotVal) fineRotVal.textContent = `${this.transforms.fineRotation > 0 ? '+' : ''}${this.transforms.fineRotation.toFixed(1)}°`;
      this.render();
      this.recordHistory('Nudge Rotate: ' + this.transforms.fineRotation + '°');
    });

    this.bindClick(`${prefix}-rot-step-cw`, () => {
      this.transforms.fineRotation = Math.min(45, parseFloat((this.transforms.fineRotation + 0.5).toFixed(1)));
      if (fineRotSlider) fineRotSlider.value = this.transforms.fineRotation;
      if (fineRotVal) fineRotVal.textContent = `${this.transforms.fineRotation > 0 ? '+' : ''}${this.transforms.fineRotation.toFixed(1)}°`;
      this.render();
      this.recordHistory('Nudge Rotate: ' + this.transforms.fineRotation + '°');
    });

    this.bindClick(`${prefix}-rot-ccw`, () => {
      this.transforms.fixedRotation = (this.transforms.fixedRotation - 90 + 360) % 360;
      this.render();
      this.recordHistory('Rotate -90°');
    });
    this.bindClick(`${prefix}-rot-cw`, () => {
      this.transforms.fixedRotation = (this.transforms.fixedRotation + 90) % 360;
      this.render();
      this.recordHistory('Rotate +90°');
    });
    this.bindClick(`${prefix}-rot-180`, () => {
      this.transforms.fixedRotation = (this.transforms.fixedRotation + 180) % 360;
      this.render();
      this.recordHistory('Rotate 180°');
    });
    this.bindClick(`${prefix}-flip-h`, () => {
      this.transforms.flipH = !this.transforms.flipH;
      this.render();
      this.recordHistory('Flip Horizontal');
    });
    this.bindClick(`${prefix}-flip-v`, () => {
      this.transforms.flipV = !this.transforms.flipV;
      this.render();
      this.recordHistory('Flip Vertical');
    });

    // -------------------------------------------------------------
    // 12 COLOR & TONE ADJUSTMENT SLIDERS
    // -------------------------------------------------------------
    const sliders = [
      { key: 'brightness', id: `${prefix}-brightness`, valId: `${prefix}-bright-val`, unit: '', def: 0 },
      { key: 'contrast', id: `${prefix}-contrast`, valId: `${prefix}-contrast-val`, unit: '', def: 0 },
      { key: 'saturation', id: `${prefix}-saturation`, valId: `${prefix}-sat-val`, unit: '%', def: 100 },
      { key: 'exposure', id: `${prefix}-exposure`, valId: `${prefix}-exposure-val`, unit: '', def: 0 },
      { key: 'highlights', id: `${prefix}-highlights`, valId: `${prefix}-highlights-val`, unit: '', def: 0 },
      { key: 'shadows', id: `${prefix}-shadows`, valId: `${prefix}-shadows-val`, unit: '', def: 0 },
      { key: 'temperature', id: `${prefix}-temperature`, valId: `${prefix}-temp-val`, unit: '', def: 0 },
      { key: 'tint', id: `${prefix}-tint`, valId: `${prefix}-tint-val`, unit: '', def: 0 },
      { key: 'gamma', id: `${prefix}-gamma`, valId: `${prefix}-gamma-val`, unit: '', def: 1.0, isFloat: true },
      { key: 'sharpness', id: `${prefix}-sharpness`, valId: `${prefix}-sharp-val`, unit: '%', def: 0 },
      { key: 'blur', id: `${prefix}-blur`, valId: `${prefix}-blur-val`, unit: 'px', def: 0 },
      { key: 'grayscale', id: `${prefix}-grayscale`, valId: `${prefix}-gray-val`, unit: '%', def: 0 }
    ];

    sliders.forEach(s => {
      const sliderEl = c.querySelector(`#${s.id}`);
      const valEl = c.querySelector(`#${s.valId}`);
      if (sliderEl) {
        sliderEl.addEventListener('input', () => {
          this.adjustments[s.key] = s.isFloat ? parseFloat(sliderEl.value) : parseInt(sliderEl.value, 10);
          if (valEl) valEl.textContent = `${this.adjustments[s.key]}${s.unit}`;
          this.render();
        });
        sliderEl.addEventListener('change', () => {
          this.recordHistory(`Adjust ${s.key}: ${this.adjustments[s.key]}`);
        });

        // Individual reset button
        const resetBtn = c.querySelector(`#${s.id}-reset`);
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            sliderEl.value = s.def;
            this.adjustments[s.key] = s.def;
            if (valEl) valEl.textContent = `${s.def}${s.unit}`;
            this.render();
            this.recordHistory(`Reset ${s.key}`);
          });
        }
      }
    });

    // Auto Enhance
    this.bindClick(`${prefix}-btn-auto-enhance`, () => this.autoEnhanceColors());

    // Signature Clean Paper Filter
    if (this.options.mode === 'signature') {
      const cleanPaperCheck = c.querySelector('#sig-clean-paper');
      const threshSlider = c.querySelector('#sig-paper-threshold');
      const threshVal = c.querySelector('#sig-thresh-val');
      const inkBoostSlider = c.querySelector('#sig-ink-boost');
      const inkBoostVal = c.querySelector('#sig-ink-boost-val');
      const invertInkCheck = c.querySelector('#sig-invert-ink');

      if (cleanPaperCheck) {
        cleanPaperCheck.addEventListener('change', () => {
          this.adjustments.cleanPaper = cleanPaperCheck.checked;
          this.render();
          this.recordHistory('Signature Clean Paper: ' + cleanPaperCheck.checked);
        });
      }
      if (threshSlider) {
        threshSlider.addEventListener('input', () => {
          this.adjustments.paperThreshold = parseInt(threshSlider.value, 10);
          if (threshVal) threshVal.textContent = threshSlider.value;
          this.render();
        });
        threshSlider.addEventListener('change', () => this.recordHistory('Paper Threshold'));
      }
      if (inkBoostSlider) {
        inkBoostSlider.addEventListener('input', () => {
          this.adjustments.inkBoost = parseInt(inkBoostSlider.value, 10);
          if (inkBoostVal) inkBoostVal.textContent = `${inkBoostSlider.value}%`;
          this.render();
        });
        inkBoostSlider.addEventListener('change', () => this.recordHistory('Ink Boost'));
      }
      if (invertInkCheck) {
        invertInkCheck.addEventListener('change', () => {
          this.adjustments.invertInk = invertInkCheck.checked;
          this.render();
          this.recordHistory('Invert Ink: ' + invertInkCheck.checked);
        });
      }
    }

    // -------------------------------------------------------------
    // BACKGROUND REMOVAL & REPLACEMENT CONTROLS
    // -------------------------------------------------------------
    const btnAiRemove = c.querySelector(`#${prefix}-btn-ai-remove-bg`);
    if (btnAiRemove) {
      btnAiRemove.addEventListener('click', () => this.executeAiBackgroundRemoval());
    }

    // Background Color Chips & Custom Color
    const bgColorInput = c.querySelector(`#${prefix}-bg-color`);
    if (bgColorInput) {
      bgColorInput.addEventListener('input', async () => {
        this.bg.type = 'color';
        this.bg.color = bgColorInput.value;
        c.querySelectorAll(`.${prefix}-color-chip`).forEach(b => b.classList.remove('active'));
        if (!this.hasCustomMask && this.warpedCanvas.width) {
          await this.executeAiBackgroundRemoval(false);
        } else {
          this.render();
        }
      });
      bgColorInput.addEventListener('change', () => this.recordHistory('Background Color: ' + this.bg.color));
    }

    c.querySelectorAll(`.${prefix}-color-chip`).forEach(btn => {
      btn.addEventListener('click', async () => {
        c.querySelectorAll(`.${prefix}-color-chip`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.dataset.color;
        if (color === 'transparent') {
          this.bg.type = 'transparent';
        } else {
          this.bg.type = 'color';
          this.bg.color = color;
          if (bgColorInput) bgColorInput.value = color;
        }

        // If background has not been separated yet, automatically separate it so the chosen color shows immediately!
        if (!this.hasCustomMask && this.warpedCanvas.width) {
          await this.executeAiBackgroundRemoval(false);
        } else {
          this.render();
        }
        this.recordHistory('Background: ' + color);
      });
    });

    // Custom Background Image Upload
    const bgImageInput = c.querySelector(`#${prefix}-bg-image-input`);
    const btnUploadBgImage = c.querySelector(`#${prefix}-btn-upload-bg-image`);
    if (btnUploadBgImage && bgImageInput) {
      btnUploadBgImage.addEventListener('click', () => bgImageInput.click());
      bgImageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const bgImg = new Image();
            bgImg.onload = async () => {
              this.customBgImage = bgImg;
              this.bg.type = 'image';
              if (!this.hasCustomMask && this.warpedCanvas.width) {
                await this.executeAiBackgroundRemoval(false);
              } else {
                this.render();
              }
              this.recordHistory('Uploaded Custom Background Image');
            };
            bgImg.src = ev.target.result;
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }

    // Background Edge Refinements (Tolerance, Feather, Smoothing)
    let bgRefineDebounce = null;
    const triggerRefine = () => {
      if (this.hasCustomMask || this.bg.aiActive) {
        clearTimeout(bgRefineDebounce);
        bgRefineDebounce = setTimeout(() => {
          this.executeAiBackgroundRemoval(false);
        }, 40);
      } else {
        this.render();
      }
    };

    const bgTolSlider = c.querySelector(`#${prefix}-bg-tolerance`);
    const bgTolVal = c.querySelector(`#${prefix}-bg-tol-val`);
    if (bgTolSlider) {
      bgTolSlider.addEventListener('input', () => {
        this.bg.tolerance = parseInt(bgTolSlider.value, 10);
        if (bgTolVal) bgTolVal.textContent = bgTolSlider.value;
        triggerRefine();
      });
      bgTolSlider.addEventListener('change', () => {
        this.recordHistory('Adjust BG Tolerance: ' + this.bg.tolerance);
      });
    }

    const bgFeatherSlider = c.querySelector(`#${prefix}-bg-feather`);
    const bgFeatherVal = c.querySelector(`#${prefix}-bg-feather-val`);
    if (bgFeatherSlider) {
      bgFeatherSlider.addEventListener('input', () => {
        this.bg.feather = parseInt(bgFeatherSlider.value, 10);
        if (bgFeatherVal) bgFeatherVal.textContent = `${bgFeatherSlider.value}px`;
        triggerRefine();
      });
      bgFeatherSlider.addEventListener('change', () => {
        this.recordHistory('Adjust BG Feather: ' + this.bg.feather + 'px');
      });
    }

    const bgSmoothSlider = c.querySelector(`#${prefix}-bg-smoothing`);
    const bgSmoothVal = c.querySelector(`#${prefix}-bg-smooth-val`);
    if (bgSmoothSlider) {
      bgSmoothSlider.addEventListener('input', () => {
        this.bg.smoothing = parseInt(bgSmoothSlider.value, 10);
        if (bgSmoothVal) bgSmoothVal.textContent = `${bgSmoothSlider.value}px`;
        triggerRefine();
      });
      bgSmoothSlider.addEventListener('change', () => {
        this.recordHistory('Adjust BG Smoothing: ' + this.bg.smoothing + 'px');
      });
    }

    const keyWhiteCheck = c.querySelector(`#${prefix}-key-white`);
    if (keyWhiteCheck) {
      keyWhiteCheck.addEventListener('change', () => {
        this.bg.keyWhite = keyWhiteCheck.checked;
        if (this.bg.keyWhite && (!this.hasCustomMask || this.bg.aiActive)) {
          this.executeAiBackgroundRemoval(false);
        } else {
          this.render();
        }
        this.recordHistory('Key out light wall: ' + keyWhiteCheck.checked);
      });
    }

    // -------------------------------------------------------------
    // MANUAL ERASE & RESTORE BRUSH CONTROLS
    // -------------------------------------------------------------
    const btnBrushErase = c.querySelector(`#${prefix}-btn-brush-erase`);
    const btnBrushRestore = c.querySelector(`#${prefix}-btn-brush-restore`);
    const btnBrushOff = c.querySelector(`#${prefix}-btn-brush-off`);
    const brushSizeSlider = c.querySelector(`#${prefix}-brush-size`);
    const brushSizeVal = c.querySelector(`#${prefix}-brush-size-val`);
    const brushFeatherSlider = c.querySelector(`#${prefix}-brush-feather`);
    const brushFeatherVal = c.querySelector(`#${prefix}-brush-feather-val`);

    if (btnBrushErase) {
      btnBrushErase.addEventListener('click', () => {
        this.brushTool.active = true;
        this.brushTool.mode = 'erase';
        this.cropTool.active = false;
        this.perspectiveTool.active = false;
        this.updateBrushButtons(prefix);
        this.render();
      });
    }
    if (btnBrushRestore) {
      btnBrushRestore.addEventListener('click', () => {
        this.brushTool.active = true;
        this.brushTool.mode = 'restore';
        this.cropTool.active = false;
        this.perspectiveTool.active = false;
        this.updateBrushButtons(prefix);
        this.render();
      });
    }
    if (btnBrushOff) {
      btnBrushOff.addEventListener('click', () => {
        this.brushTool.active = false;
        this.updateBrushButtons(prefix);
        this.render();
      });
    }
    if (brushSizeSlider) {
      brushSizeSlider.addEventListener('input', () => {
        this.brushTool.size = parseInt(brushSizeSlider.value, 10);
        if (brushSizeVal) brushSizeVal.textContent = `${brushSizeSlider.value}px`;
        this.drawOverlay();
      });
    }
    if (brushFeatherSlider) {
      brushFeatherSlider.addEventListener('input', () => {
        this.brushTool.feather = parseInt(brushFeatherSlider.value, 10);
        if (brushFeatherVal) brushFeatherVal.textContent = `${brushFeatherSlider.value}%`;
      });
    }

    this.bindClick(`${prefix}-btn-reset-mask`, () => {
      this.resetMask();
      this.render();
      this.recordHistory('Reset Background Mask');
    });

    // -------------------------------------------------------------
    // FACE POSITION & PASSPORT GUIDELINES CONTROLS
    // -------------------------------------------------------------
    const checkFaceGuide = c.querySelector(`#${prefix}-check-face-guide`);
    const checkGridGuide = c.querySelector(`#${prefix}-check-grid-guide`);
    const headMarginSlider = c.querySelector(`#${prefix}-guide-head-margin`);
    const eyeLevelSlider = c.querySelector(`#${prefix}-guide-eye-level`);
    const chinLevelSlider = c.querySelector(`#${prefix}-guide-chin-level`);

    if (checkFaceGuide) {
      checkFaceGuide.addEventListener('change', () => {
        this.guides.showFaceGuide = checkFaceGuide.checked;
        this.drawOverlay();
      });
    }
    if (checkGridGuide) {
      checkGridGuide.addEventListener('change', () => {
        this.guides.showGrid = checkGridGuide.checked;
        this.drawOverlay();
      });
    }
    if (headMarginSlider) {
      headMarginSlider.addEventListener('input', () => {
        this.guides.headMarginTop = parseInt(headMarginSlider.value, 10);
        this.drawOverlay();
      });
    }
    if (eyeLevelSlider) {
      eyeLevelSlider.addEventListener('input', () => {
        this.guides.eyeLevel = parseInt(eyeLevelSlider.value, 10);
        this.drawOverlay();
      });
    }
    if (chinLevelSlider) {
      chinLevelSlider.addEventListener('input', () => {
        this.guides.chinLevel = parseInt(chinLevelSlider.value, 10);
        this.drawOverlay();
      });
    }

    // -------------------------------------------------------------
    // EXPORT & SAVE CONTROLS
    // -------------------------------------------------------------
    const formatSelect = c.querySelector(`#${prefix}-export-format`);
    const qualitySlider = c.querySelector(`#${prefix}-export-quality`);
    const qualityVal = c.querySelector(`#${prefix}-export-qual-val`);
    const qualityGrp = c.querySelector(`#${prefix}-grp-quality`);

    if (formatSelect) {
      formatSelect.addEventListener('change', () => {
        if (qualityGrp) qualityGrp.style.display = formatSelect.value === 'image/png' ? 'none' : 'flex';
        this.updateEstFileSize();
      });
    }
    if (qualitySlider) {
      qualitySlider.addEventListener('input', () => {
        if (qualityVal) qualityVal.textContent = `${qualitySlider.value}%`;
        this.updateEstFileSize();
      });
    }

    this.bindClick(`${prefix}-btn-download`, () => this.downloadImage());
    this.bindClick(`${prefix}-btn-save-storage`, () => this.saveToStorage());
  }

  updateBrushButtons(prefix) {
    const c = this.container;
    const btnE = c.querySelector(`#${prefix}-btn-brush-erase`);
    const btnR = c.querySelector(`#${prefix}-btn-brush-restore`);
    const btnO = c.querySelector(`#${prefix}-btn-brush-off`);
    if (btnE) btnE.classList.toggle('active', this.brushTool.active && this.brushTool.mode === 'erase');
    if (btnR) btnR.classList.toggle('active', this.brushTool.active && this.brushTool.mode === 'restore');
    if (btnO) btnO.classList.toggle('active', !this.brushTool.active);
  }

  bindClick(elementId, handler) {
    const el = this.container.querySelector(`#${elementId}`);
    if (el) el.addEventListener('click', handler);
  }

  /* -------------------------------------------------------------
     CANVAS INTERACTIONS (Pan, Zoom, Crop Drag, Perspective Pin Drag, Brushes)
     ------------------------------------------------------------- */
  bindCanvasInteractions() {
    const overlay = this.overlayCanvas;

    const getCanvasPos = (clientX, clientY) => {
      const rect = overlay.getBoundingClientRect();
      const scaleX = overlay.width / rect.width;
      const scaleY = overlay.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    // Pointer Down
    const handlePointerDown = (clientX, clientY) => {
      if (!this.originalImage && !this.warpedCanvas.width) return;
      const pos = getCanvasPos(clientX, clientY);

      // 1. Perspective Pin Drag
      if (this.perspectiveTool.active) {
        const hitIndex = this.hitTestPerspectiveCorner(pos.x, pos.y);
        if (hitIndex !== null) {
          this.perspectiveTool.activeCorner = hitIndex;
          this.perspectiveTool.dragStartX = pos.x;
          this.perspectiveTool.dragStartY = pos.y;
          this.drawOverlay(pos);
          return;
        }
      }

      // 2. Crop Box Drag
      if (this.cropTool.active) {
        const hit = this.hitTestCropRect(pos.x, pos.y);
        if (hit) {
          this.cropTool.dragMode = hit;
          this.cropTool.dragStartX = pos.x;
          this.cropTool.dragStartY = pos.y;
          this.cropTool.startRect = Object.assign({}, this.cropTool.rect);
          return;
        }
      }

      // 3. Manual Brush Stroke
      if (this.brushTool.active) {
        this.brushTool.isPainting = true;
        this.brushTool.lastX = pos.x;
        this.brushTool.lastY = pos.y;
        this.applyBrushStroke(pos.x, pos.y);
        this.drawOverlay(pos);
        return;
      }

      // 4. Viewport Pan Drag
      this.viewport.isDragging = true;
      this.viewport.dragStartX = clientX - this.viewport.panX;
      this.viewport.dragStartY = clientY - this.viewport.panY;
    };

    // Pointer Move
    const handlePointerMove = (clientX, clientY) => {
      const pos = getCanvasPos(clientX, clientY);

      // Perspective Dragging
      if (this.perspectiveTool.active && this.perspectiveTool.activeCorner !== null) {
        const idx = this.perspectiveTool.activeCorner;
        this.perspectiveTool.corners[idx].x = Math.max(0, Math.min(this.targetWidth, pos.x));
        this.perspectiveTool.corners[idx].y = Math.max(0, Math.min(this.targetHeight, pos.y));
        this.drawOverlay(pos);
        return;
      }

      // Crop Dragging
      if (this.cropTool.active && this.cropTool.dragMode) {
        this.handleCropDrag(pos.x, pos.y);
        this.drawOverlay();
        return;
      }

      // Brush Painting
      if (this.brushTool.active) {
        if (this.brushTool.isPainting) {
          this.applyBrushStroke(pos.x, pos.y);
        }
        this.drawOverlay(pos);
        return;
      }

      // Viewport Panning
      if (this.viewport.isDragging) {
        this.viewport.panX = clientX - this.viewport.dragStartX;
        this.viewport.panY = clientY - this.viewport.dragStartY;
        this.render();
        return;
      }

      // Hover cursors & brush cursor ring
      if (this.cropTool.active) {
        const hit = this.hitTestCropRect(pos.x, pos.y);
        this.overlayCanvas.style.cursor = this.getCropCursor(hit);
      } else if (this.perspectiveTool.active) {
        const hitIndex = this.hitTestPerspectiveCorner(pos.x, pos.y);
        this.overlayCanvas.style.cursor = hitIndex !== null ? 'pointer' : 'crosshair';
        this.drawOverlay();
      } else if (this.brushTool.active) {
        this.overlayCanvas.style.cursor = 'none';
        this.drawOverlay(pos);
      } else {
        this.overlayCanvas.style.cursor = 'grab';
      }
    };

    // Pointer Up
    const handlePointerUp = () => {
      if (this.perspectiveTool.activeCorner !== null) {
        this.perspectiveTool.activeCorner = null;
        this.drawOverlay();
        this.recordHistory('Adjust Perspective Pins');
      }
      if (this.cropTool.dragMode) {
        this.cropTool.dragMode = null;
        this.drawOverlay();
        this.recordHistory('Adjust Crop Box');
      }
      if (this.brushTool.isPainting) {
        this.brushTool.isPainting = false;
        this.render();
        this.recordHistory(`Brush ${this.brushTool.mode}`);
      }
      if (this.viewport.isDragging) {
        this.viewport.isDragging = false;
      }
    };

    overlay.addEventListener('mousedown', (e) => handlePointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handlePointerUp);

    overlay.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        e.preventDefault();
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchend', handlePointerUp);

    // Mouse Wheel Zoom
    overlay.addEventListener('wheel', (e) => {
      if (!this.originalImage) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      this.adjustZoom(delta);
    }, { passive: false });
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Only handle if active subtab is this editor
      if (!this.container.classList.contains('active')) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        this.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        this.resetPosition(true);
      } else if (e.key === '=' || e.key === '+') {
        this.adjustZoom(0.1);
      } else if (e.key === '-' || e.key === '_') {
        this.adjustZoom(-0.1);
      } else if (e.key === 'ArrowUp') {
        this.viewport.panY -= 5;
        this.render();
      } else if (e.key === 'ArrowDown') {
        this.viewport.panY += 5;
        this.render();
      } else if (e.key === 'ArrowLeft') {
        this.viewport.panX -= 5;
        this.render();
      } else if (e.key === 'ArrowRight') {
        this.viewport.panX += 5;
        this.render();
      } else if (e.key === 'Escape') {
        if (this.cropTool.active) {
          this.cropTool.active = false;
          this.render();
        }
        if (this.perspectiveTool.active) {
          this.perspectiveTool.active = false;
          this.render();
        }
        if (this.brushTool.active) {
          this.brushTool.active = false;
          this.render();
        }
      }
    });
  }

  /* -------------------------------------------------------------
     IMAGE LOADING & RESET
     ------------------------------------------------------------- */
  loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    this.originalFileName = file.name ? file.name.replace(/\.[^/.]+$/, '') : (this.options.mode === 'photo' ? 'passport_photo' : 'signature');
    this.originalFileSize = file.size;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.resetWorkingCanvasFromOriginal();
        this.resetMask();
        this.resetPosition(true); // Auto-fit to fill

        if (this.fileInfo) {
          this.fileInfo.style.display = 'inline-block';
          this.fileInfo.textContent = `${file.name} (${img.naturalWidth}×${img.naturalHeight}px, ${(file.size / 1024).toFixed(1)} KB)`;
        }

        this.history = [];
        this.historyIndex = -1;
        this.recordHistory('Loaded Image');
        this.render();

        if (typeof showToast === 'function') {
          showToast(`${this.options.mode === 'photo' ? 'Photo' : 'Signature'} loaded successfully!`, 'success');
        }
      };
      img.onerror = () => {
        alert('Failed to load image. The file may be corrupt.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  resetWorkingCanvasFromOriginal() {
    if (!this.originalImage) return;
    this.warpedCanvas.width = this.originalImage.naturalWidth || this.originalImage.width;
    this.warpedCanvas.height = this.originalImage.naturalHeight || this.originalImage.height;
    this.warpedCtx.clearRect(0, 0, this.warpedCanvas.width, this.warpedCanvas.height);
    this.warpedCtx.drawImage(this.originalImage, 0, 0);
  }

  resetMask() {
    if (!this.warpedCanvas.width) return;
    this.maskCanvas.width = this.warpedCanvas.width;
    this.maskCanvas.height = this.warpedCanvas.height;
    this.maskCtx.fillStyle = '#ffffff'; // 100% visible foreground
    this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    this.hasCustomMask = false;
    this.bg.aiActive = false;
  }

  removeImage() {
    if (!this.originalImage) return;
    if (confirm('Are you sure you want to remove the current image?')) {
      this.originalImage = null;
      this.warpedCanvas.width = 0;
      this.warpedCanvas.height = 0;
      this.maskCanvas.width = 0;
      this.maskCanvas.height = 0;
      if (this.fileInfo) this.fileInfo.style.display = 'none';
      if (this.fileInput) this.fileInput.value = '';
      this.history = [];
      this.historyIndex = -1;
      this.render();
    }
  }

  resetAll() {
    if (!this.originalImage) return;
    if (confirm('Discard all edits and revert to the original image?')) {
      this.resetWorkingCanvasFromOriginal();
      this.resetMask();
      this.resetAdjustments();
      this.resetPosition(true);
      this.cropTool.active = false;
      this.perspectiveTool.active = false;
      this.brushTool.active = false;
      this.recordHistory('Reset All Edits');
      this.render();
    }
  }

  resetPosition(autoFit = true) {
    this.viewport.panX = 0;
    this.viewport.panY = 0;
    if (autoFit && this.warpedCanvas.width > 0) {
      this.autoFit(this.transforms.fillMode);
    } else {
      this.viewport.zoom = 1.0;
      const zoomSlider = this.container.querySelector(`#${this.options.mode === 'signature' ? 'sig' : 'photo'}-zoom`);
      const zoomVal = this.container.querySelector(`#${this.options.mode === 'signature' ? 'sig' : 'photo'}-zoom-val`);
      if (zoomSlider) zoomSlider.value = 100;
      if (zoomVal) zoomVal.textContent = '100%';
      this.render();
    }
  }

  autoFit(mode = 'fill') {
    if (!this.warpedCanvas.width || !this.warpedCanvas.height) return;
    const w = this.warpedCanvas.width;
    const h = this.warpedCanvas.height;
    const targetW = this.targetWidth;
    const targetH = this.targetHeight;

    let scale = 1.0;
    if (mode === 'contain' || mode === 'fit') {
      scale = Math.min(targetW / w, targetH / h);
    } else {
      // fill (cover - no blank borders)
      scale = Math.max(targetW / w, targetH / h);
    }

    this.viewport.zoom = scale;
    this.viewport.panX = 0;
    this.viewport.panY = 0;

    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const zoomSlider = this.container.querySelector(`#${prefix}-zoom`);
    const zoomVal = this.container.querySelector(`#${prefix}-zoom-val`);
    if (zoomSlider) {
      zoomSlider.value = Math.round(scale * 100);
      if (zoomVal) zoomVal.textContent = `${zoomSlider.value}%`;
    }
    this.render();
  }

  adjustZoom(delta) {
    if (!this.warpedCanvas.width) return;
    this.viewport.zoom = Math.min(4.0, Math.max(0.15, this.viewport.zoom + delta));
    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const zoomSlider = this.container.querySelector(`#${prefix}-zoom`);
    const zoomVal = this.container.querySelector(`#${prefix}-zoom-val`);
    if (zoomSlider) {
      zoomSlider.value = Math.round(this.viewport.zoom * 100);
      if (zoomVal) zoomVal.textContent = `${zoomSlider.value}%`;
    }
    this.render();
  }

  setTargetDimensions(w, h) {
    this.targetWidth = w;
    this.targetHeight = h;
    this.syncCanvasDimensions();
    this.autoFit(this.transforms.fillMode);
    this.recordHistory(`Canvas Size: ${w}×${h}`);
  }

  resetAdjustments() {
    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    this.adjustments.brightness = 0;
    this.adjustments.contrast = 0;
    this.adjustments.saturation = 100;
    this.adjustments.exposure = 0;
    this.adjustments.highlights = 0;
    this.adjustments.shadows = 0;
    this.adjustments.temperature = 0;
    this.adjustments.tint = 0;
    this.adjustments.gamma = 1.0;
    this.adjustments.sharpness = 0;
    this.adjustments.blur = 0;
    this.adjustments.grayscale = 0;
    this.transforms.fineRotation = 0;
    this.transforms.fixedRotation = 0;
    this.transforms.flipH = false;
    this.transforms.flipV = false;

    // Reset slider DOM values
    const resetKeys = [
      { id: `${prefix}-brightness`, val: 0, text: '0' },
      { id: `${prefix}-contrast`, val: 0, text: '0' },
      { id: `${prefix}-saturation`, val: 100, text: '100%' },
      { id: `${prefix}-exposure`, val: 0, text: '0' },
      { id: `${prefix}-highlights`, val: 0, text: '0' },
      { id: `${prefix}-shadows`, val: 0, text: '0' },
      { id: `${prefix}-temperature`, val: 0, text: '0' },
      { id: `${prefix}-tint`, val: 0, text: '0' },
      { id: `${prefix}-gamma`, val: 1.0, text: '1.0' },
      { id: `${prefix}-sharpness`, val: 0, text: '0%' },
      { id: `${prefix}-blur`, val: 0, text: '0px' },
      { id: `${prefix}-grayscale`, val: 0, text: '0%' },
      { id: `${prefix}-fine-rotation`, val: 0, text: '0.0°' }
    ];

    resetKeys.forEach(k => {
      const el = this.container.querySelector(`#${k.id}`);
      const valEl = this.container.querySelector(`#${k.id.replace(prefix + '-', prefix + '-')}-val`) || this.container.querySelector(`#${k.id}-val`);
      if (el) el.value = k.val;
      if (valEl) valEl.textContent = k.text;
    });

    this.render();
  }

  /* -------------------------------------------------------------
     CROP TOOL (Draggable, Resizable Rectangle, Aspect Ratios)
     ------------------------------------------------------------- */
  initCropRect() {
    const margin = 20;
    let w = this.targetWidth - margin * 2;
    let h = this.targetHeight - margin * 2;

    this.cropTool.rect = {
      x: margin,
      y: margin,
      w: w,
      h: h
    };
    this.updateCropRectAspectRatio();
  }

  updateCropRectAspectRatio() {
    const r = this.cropTool.aspectRatio;
    let targetRatio = null;
    if (r === '1:1') targetRatio = 1.0;
    else if (r === '3:4') targetRatio = 3 / 4;
    else if (r === '4:5') targetRatio = 4 / 5;
    else if (r === '300:80') targetRatio = 300 / 80;

    if (targetRatio !== null) {
      const center = {
        x: this.cropTool.rect.x + this.cropTool.rect.w / 2,
        y: this.cropTool.rect.y + this.cropTool.rect.h / 2
      };
      let newW = this.cropTool.rect.w;
      let newH = newW / targetRatio;
      if (newH > this.targetHeight - 20) {
        newH = this.targetHeight - 20;
        newW = newH * targetRatio;
      }
      this.cropTool.rect.w = newW;
      this.cropTool.rect.h = newH;
      this.cropTool.rect.x = Math.max(10, Math.min(this.targetWidth - newW - 10, center.x - newW / 2));
      this.cropTool.rect.y = Math.max(10, Math.min(this.targetHeight - newH - 10, center.y - newH / 2));
    }
  }

  hitTestCropRect(x, y) {
    const { x: rx, y: ry, w: rw, h: rh } = this.cropTool.rect;
    const handleSize = 14;

    // Check corners
    if (Math.hypot(x - rx, y - ry) <= handleSize) return 'nw';
    if (Math.hypot(x - (rx + rw), y - ry) <= handleSize) return 'ne';
    if (Math.hypot(x - (rx + rw), y - (ry + rh)) <= handleSize) return 'se';
    if (Math.hypot(x - rx, y - (ry + rh)) <= handleSize) return 'sw';

    // Check edge midpoints
    if (Math.hypot(x - (rx + rw / 2), y - ry) <= handleSize) return 'n';
    if (Math.hypot(x - (rx + rw), y - (ry + rh / 2)) <= handleSize) return 'e';
    if (Math.hypot(x - (rx + rw / 2), y - (ry + rh)) <= handleSize) return 's';
    if (Math.hypot(x - rx, y - (ry + rh / 2)) <= handleSize) return 'w';

    // Inside box
    if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) return 'move';

    return null;
  }

  getCropCursor(hit) {
    if (!hit) return 'default';
    if (hit === 'move') return 'move';
    if (hit === 'nw' || hit === 'se') return 'nwse-resize';
    if (hit === 'ne' || hit === 'sw') return 'nesw-resize';
    if (hit === 'n' || hit === 's') return 'ns-resize';
    if (hit === 'e' || hit === 'w') return 'ew-resize';
    return 'default';
  }

  handleCropDrag(currentX, currentY) {
    const dx = currentX - this.cropTool.dragStartX;
    const dy = currentY - this.cropTool.dragStartY;
    const s = this.cropTool.startRect;
    const minSize = 40;

    let targetRatio = null;
    if (this.cropTool.aspectRatio === '1:1') targetRatio = 1.0;
    else if (this.cropTool.aspectRatio === '3:4') targetRatio = 3 / 4;
    else if (this.cropTool.aspectRatio === '4:5') targetRatio = 4 / 5;
    else if (this.cropTool.aspectRatio === '300:80') targetRatio = 300 / 80;

    if (this.cropTool.dragMode === 'move') {
      this.cropTool.rect.x = Math.max(0, Math.min(this.targetWidth - s.w, s.x + dx));
      this.cropTool.rect.y = Math.max(0, Math.min(this.targetHeight - s.h, s.y + dy));
    } else {
      let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

      if (this.cropTool.dragMode.includes('e')) nw = Math.max(minSize, s.w + dx);
      if (this.cropTool.dragMode.includes('s')) nh = Math.max(minSize, s.h + dy);
      if (this.cropTool.dragMode.includes('w')) {
        const potentialW = s.w - dx;
        if (potentialW >= minSize) {
          nx = s.x + dx;
          nw = potentialW;
        }
      }
      if (this.cropTool.dragMode.includes('n')) {
        const potentialH = s.h - dy;
        if (potentialH >= minSize) {
          ny = s.y + dy;
          nh = potentialH;
        }
      }

      if (targetRatio !== null) {
        if (this.cropTool.dragMode === 'e' || this.cropTool.dragMode === 'w') {
          nh = nw / targetRatio;
        } else {
          nw = nh * targetRatio;
        }
      }

      this.cropTool.rect.x = Math.max(0, Math.min(this.targetWidth - minSize, nx));
      this.cropTool.rect.y = Math.max(0, Math.min(this.targetHeight - minSize, ny));
      this.cropTool.rect.w = Math.min(this.targetWidth - this.cropTool.rect.x, nw);
      this.cropTool.rect.h = Math.min(this.targetHeight - this.cropTool.rect.y, nh);
    }
  }

  applyCrop() {
    if (!this.warpedCanvas.width) return;

    // Convert crop rect from canvas display space back to warpedCanvas pixel space
    const displayRect = this.cropTool.rect;
    const inv = this.getScreenToImageTransform();

    const p0 = inv(displayRect.x, displayRect.y);
    const p1 = inv(displayRect.x + displayRect.w, displayRect.y + displayRect.h);

    const srcX = Math.max(0, Math.min(this.warpedCanvas.width, Math.min(p0.x, p1.x)));
    const srcY = Math.max(0, Math.min(this.warpedCanvas.height, Math.min(p0.y, p1.y)));
    const srcW = Math.max(10, Math.min(this.warpedCanvas.width - srcX, Math.abs(p1.x - p0.x)));
    const srcH = Math.max(10, Math.min(this.warpedCanvas.height - srcY, Math.abs(p1.y - p0.y)));

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = srcW;
    croppedCanvas.height = srcH;
    const ctx = croppedCanvas.getContext('2d');
    ctx.drawImage(this.warpedCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    // Also crop mask if exists
    if (this.hasCustomMask) {
      const croppedMask = document.createElement('canvas');
      croppedMask.width = srcW;
      croppedMask.height = srcH;
      croppedMask.getContext('2d').drawImage(this.maskCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      this.maskCanvas.width = srcW;
      this.maskCanvas.height = srcH;
      this.maskCtx.drawImage(croppedMask, 0, 0);
    }

    this.warpedCanvas.width = srcW;
    this.warpedCanvas.height = srcH;
    this.warpedCtx.drawImage(croppedCanvas, 0, 0);

    this.cropTool.active = false;
    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const btnToggleCrop = this.container.querySelector(`#${prefix}-btn-toggle-crop`);
    const cropControlsBox = this.container.querySelector(`#${prefix}-crop-controls`);
    if (btnToggleCrop) btnToggleCrop.classList.remove('active');
    if (cropControlsBox) cropControlsBox.style.display = 'none';

    this.resetPosition(true);
    this.recordHistory('Applied Crop');
    this.render();

    if (typeof showToast === 'function') {
      showToast('Crop applied successfully!', 'success');
    }
  }

  /* -------------------------------------------------------------
     PERSPECTIVE CORRECTION TOOL (4 Corner Pins, Homography Math)
     ------------------------------------------------------------- */
  initPerspectiveCorners() {
    const marginX = this.targetWidth * 0.12;
    const marginY = this.targetHeight * 0.12;
    this.perspectiveTool.corners = [
      { x: marginX, y: marginY },                                 // Top-Left
      { x: this.targetWidth - marginX, y: marginY },              // Top-Right
      { x: this.targetWidth - marginX, y: this.targetHeight - marginY }, // Bottom-Right
      { x: marginX, y: this.targetHeight - marginY }               // Bottom-Left
    ];
  }

  hitTestPerspectiveCorner(x, y) {
    const handleRadius = 16;
    for (let i = 0; i < 4; i++) {
      const pt = this.perspectiveTool.corners[i];
      if (Math.hypot(x - pt.x, y - pt.y) <= handleRadius) {
        return i;
      }
    }
    return null;
  }

  /**
   * Applies Backward-Mapping Homography Warp using Bilinear Interpolation.
   * Maps quadrilateral [P0, P1, P2, P3] from source image to axis-aligned target rectangle.
   */
  applyPerspectiveWarp() {
    if (!this.warpedCanvas.width) return;

    const corners = this.perspectiveTool.corners;
    const inv = this.getScreenToImageTransform();

    // Map screen corner coordinates to warpedCanvas image coordinates
    const p0 = inv(corners[0].x, corners[0].y); // TL
    const p1 = inv(corners[1].x, corners[1].y); // TR
    const p2 = inv(corners[2].x, corners[2].y); // BR
    const p3 = inv(corners[3].x, corners[3].y); // BL

    const targetW = this.targetWidth;
    const targetH = this.targetHeight;

    // Homography matrix coefficients mapping unit square (s, t) to quad
    const dx1 = p1.x - p2.x;
    const dx2 = p3.x - p2.x;
    const sx = p0.x - p1.x + p2.x - p3.x;
    const dy1 = p1.y - p2.y;
    const dy2 = p3.y - p2.y;
    const sy = p0.y - p1.y + p2.y - p3.y;

    let a, b, c, d, e, f, g, h;
    if (Math.abs(sx) < 1e-6 && Math.abs(sy) < 1e-6) {
      g = 0; h = 0;
      a = p1.x - p0.x;
      b = p3.x - p0.x;
      c = p0.x;
      d = p1.y - p0.y;
      e = p3.y - p0.y;
      f = p0.y;
    } else {
      const det = dx1 * dy2 - dx2 * dy1;
      if (Math.abs(det) < 1e-9) {
        alert('Invalid corner alignment. Please adjust pins.');
        return;
      }
      g = (sx * dy2 - sy * dx2) / det;
      h = (dx1 * sy - dy1 * sx) / det;
      a = p1.x - p0.x + g * p1.x;
      b = p3.x - p0.x + h * p3.x;
      c = p0.x;
      d = p1.y - p0.y + g * p1.y;
      e = p3.y - p0.y + h * p3.y;
      f = p0.y;
    }

    const srcW = this.warpedCanvas.width;
    const srcH = this.warpedCanvas.height;
    const srcImgData = this.warpedCtx.getImageData(0, 0, srcW, srcH);
    const srcPixels = srcImgData.data;

    const outImgData = this.warpedCtx.createImageData(targetW, targetH);
    const outPixels = outImgData.data;

    // Bilinear backward-mapping loop
    for (let y = 0; y < targetH; y++) {
      const t = y / (targetH - 1);
      const rowOffset = y * targetW * 4;

      for (let x = 0; x < targetW; x++) {
        const s = x / (targetW - 1);
        const denom = g * s + h * t + 1;
        const srcX = (a * s + b * t + c) / denom;
        const srcY = (d * s + e * t + f) / denom;

        const outIdx = rowOffset + x * 4;

        if (srcX >= 0 && srcX < srcW - 1 && srcY >= 0 && srcY < srcH - 1) {
          const x0 = Math.floor(srcX);
          const y0 = Math.floor(srcY);
          const dx = srcX - x0;
          const dy = srcY - y0;

          const p00 = (y0 * srcW + x0) * 4;
          const p10 = p00 + 4;
          const p01 = ((y0 + 1) * srcW + x0) * 4;
          const p11 = p01 + 4;

          for (let ch = 0; ch < 4; ch++) {
            const v0 = srcPixels[p00 + ch] * (1 - dx) + srcPixels[p10 + ch] * dx;
            const v1 = srcPixels[p01 + ch] * (1 - dx) + srcPixels[p11 + ch] * dx;
            outPixels[outIdx + ch] = Math.round(v0 * (1 - dy) + v1 * dy);
          }
        } else {
          // Transparent or fill
          outPixels[outIdx + 3] = 0;
        }
      }
    }

    this.warpedCanvas.width = targetW;
    this.warpedCanvas.height = targetH;
    this.warpedCtx.putImageData(outImgData, 0, 0);

    this.resetMask();
    this.perspectiveTool.active = false;

    // Reset rotation transforms so image is not double rotated!
    this.transforms.fineRotation = 0;
    this.transforms.fixedRotation = 0;
    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const fineRotSlider = this.container.querySelector(`#${prefix}-fine-rotation`);
    const fineRotVal = this.container.querySelector(`#${prefix}-fine-rot-val`);
    if (fineRotSlider) fineRotSlider.value = 0;
    if (fineRotVal) fineRotVal.textContent = '0.0°';

    const btnToggle = this.container.querySelector(`#${prefix}-btn-toggle-perspective`);
    const box = this.container.querySelector(`#${prefix}-perspective-controls`);
    if (btnToggle) btnToggle.classList.remove('active');
    if (box) box.style.display = 'none';

    this.resetPosition(true);
    this.recordHistory('Applied Perspective Rectification');
    this.render();

    if (typeof showToast === 'function') {
      showToast('Perspective corrected and straightened successfully!', 'success');
    }
  }

  /**
   * Automatically detects and straightens tilted portrait photos or signatures.
   */
  autoStraighten() {
    if (!this.warpedCanvas.width) {
      alert('Please load an image first.');
      return;
    }

    const w = this.warpedCanvas.width;
    const h = this.warpedCanvas.height;
    const ctx = this.warpedCtx;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Sample central zone (15% to 85% horizontally, 20% to 80% vertically)
    const minX = Math.floor(w * 0.15);
    const maxX = Math.floor(w * 0.85);
    const minY = Math.floor(h * 0.20);
    const maxY = Math.floor(h * 0.80);

    // Compute edge histogram for candidate angles from -20.0° to +20.0° in 0.5° steps
    const anglesCount = 81; // -20° to +20°
    const scores = new Float32Array(anglesCount);

    for (let y = minY; y < maxY; y += 2) {
      const row = y * w;
      for (let x = minX; x < maxX; x += 2) {
        const i = (row + x) * 4;
        const lumL = 0.299 * d[i - 4] + 0.587 * d[i - 3] + 0.114 * d[i - 2];
        const lumR = 0.299 * d[i + 4] + 0.587 * d[i + 5] + 0.114 * d[i + 6];
        const lumU = 0.299 * d[i - w * 4] + 0.587 * d[i - w * 4 + 1] + 0.114 * d[i - w * 4 + 2];
        const lumD = 0.299 * d[i + w * 4] + 0.587 * d[i + w * 4 + 1] + 0.114 * d[i + w * 4 + 2];

        const gx = lumR - lumL;
        const gy = lumD - lumU;
        const mag = Math.hypot(gx, gy);

        if (mag > 28) {
          // Deviation from horizontal
          const angleRad = Math.atan2(gx, Math.abs(gy));
          const angleDeg = (angleRad * 180) / Math.PI;

          if (angleDeg >= -20 && angleDeg <= 20) {
            const idx = Math.round((angleDeg + 20) / 0.5);
            if (idx >= 0 && idx < anglesCount) {
              scores[idx] += mag;
            }
          }
        }
      }
    }

    let maxScore = 0;
    let bestIdx = 40; // 0.0° default
    for (let a = 0; a < anglesCount; a++) {
      if (scores[a] > maxScore) {
        maxScore = scores[a];
        bestIdx = a;
      }
    }

    const detectedTilt = parseFloat((-20 + bestIdx * 0.5).toFixed(1));
    const correctionAngle = parseFloat((-detectedTilt).toFixed(1));

    if (Math.abs(correctionAngle) >= 0.3 && Math.abs(correctionAngle) <= 25) {
      this.transforms.fineRotation = correctionAngle;
    } else {
      this.transforms.fineRotation = 0;
    }

    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const fineRotSlider = this.container.querySelector(`#${prefix}-fine-rotation`);
    const fineRotVal = this.container.querySelector(`#${prefix}-fine-rot-val`);
    if (fineRotSlider) fineRotSlider.value = this.transforms.fineRotation;
    if (fineRotVal) fineRotVal.textContent = `${this.transforms.fineRotation > 0 ? '+' : ''}${this.transforms.fineRotation.toFixed(1)}°`;

    this.render();
    this.recordHistory(`Auto-Straighten (${this.transforms.fineRotation}°)`);

    if (typeof showToast === 'function') {
      showToast(`Straightened photo by ${this.transforms.fineRotation > 0 ? '+' : ''}${this.transforms.fineRotation}°`, 'success');
    }
  }

  /* -------------------------------------------------------------
     MANUAL BRUSHES & AI BACKGROUND REMOVAL
     ------------------------------------------------------------- */
  applyBrushStroke(screenX, screenY) {
    if (!this.maskCanvas.width) return;
    const inv = this.getScreenToImageTransform();
    const imgPos = inv(screenX, screenY);

    const radius = (this.brushTool.size / 2) / this.viewport.zoom;
    const featherRatio = this.brushTool.feather / 100;

    this.maskCtx.save();
    this.maskCtx.beginPath();
    this.maskCtx.arc(imgPos.x, imgPos.y, radius, 0, Math.PI * 2);

    const grad = this.maskCtx.createRadialGradient(
      imgPos.x, imgPos.y, radius * (1 - featherRatio),
      imgPos.x, imgPos.y, radius
    );

    if (this.brushTool.mode === 'erase') {
      // Erase foreground: black in mask
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.maskCtx.globalCompositeOperation = 'destination-out';
    } else {
      // Restore foreground: white in mask
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.maskCtx.globalCompositeOperation = 'source-over';
    }

    this.maskCtx.fillStyle = grad;
    this.maskCtx.fill();
    this.maskCtx.restore();

    this.hasCustomMask = true;
    this.render();
  }

  async executeAiBackgroundRemoval(recordHist = true) {
    if (!this.warpedCanvas.width) {
      if (recordHist) alert('Please upload or load an image first.');
      return;
    }

    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const spinner = this.container.querySelector(`#${prefix}-loading-overlay`);
    if (spinner && recordHist) spinner.style.display = 'flex';

    if (recordHist) {
      await new Promise(r => setTimeout(r, 40));
    }

    try {
      const w = this.warpedCanvas.width;
      const h = this.warpedCanvas.height;
      const imgData = this.warpedCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // 1. Sample Background Color Clusters from border perimeters (top row & upper corners)
      const sampleColors = [];
      const topH = Math.max(4, Math.floor(h * 0.12));
      const cornerW = Math.max(4, Math.floor(w * 0.22));

      for (let y = 0; y < topH; y += 2) {
        for (let x = 0; x < w; x += 3) {
          const idx = (y * w + x) * 4;
          sampleColors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
        }
      }
      for (let y = topH; y < Math.floor(h * 0.45); y += 2) {
        for (let x = 0; x < cornerW; x += 3) {
          const idxL = (y * w + x) * 4;
          const idxR = (y * w + (w - 1 - x)) * 4;
          sampleColors.push({ r: data[idxL], g: data[idxL + 1], b: data[idxL + 2] });
          sampleColors.push({ r: data[idxR], g: data[idxR + 1], b: data[idxR + 2] });
        }
      }

      if (sampleColors.length === 0) return;

      let rSum = 0, gSum = 0, bSum = 0;
      for (let i = 0; i < sampleColors.length; i++) {
        rSum += sampleColors[i].r;
        gSum += sampleColors[i].g;
        bSum += sampleColors[i].b;
      }
      const bgMeanR = rSum / sampleColors.length;
      const bgMeanG = gSum / sampleColors.length;
      const bgMeanB = bSum / sampleColors.length;

      // 2. Build Edge Gradient Magnitude Map (Sobel filter)
      const edgeMap = new Uint8Array(w * h);
      for (let y = 1; y < h - 1; y++) {
        const row = y * w;
        for (let x = 1; x < w - 1; x++) {
          const i = (row + x) * 4;
          const lumL = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
          const lumR = 0.299 * data[i + 4] + 0.587 * data[i + 5] + 0.114 * data[i + 6];
          const lumU = 0.299 * data[i - w * 4] + 0.587 * data[i - w * 4 + 1] + 0.114 * data[i - w * 4 + 2];
          const lumD = 0.299 * data[i + w * 4] + 0.587 * data[i + w * 4 + 1] + 0.114 * data[i + w * 4 + 2];
          edgeMap[row + x] = Math.min(255, Math.hypot(lumR - lumL, lumD - lumU));
        }
      }

      // 3. Flood Fill from Perimeter
      const baseTol = this.bg.tolerance * 2.2;
      const visited = new Uint8Array(w * h); // 1 = background, 0 = foreground
      const queue = new Int32Array(w * h);
      let head = 0, tail = 0;

      const isBgColor = (r, g, b, isNearBorder = false) => {
        const dr = r - bgMeanR;
        const dg = g - bgMeanG;
        const db = b - bgMeanB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        const effTol = isNearBorder ? baseTol * 1.25 : baseTol;
        if (dist > effTol) return false;

        // Skin Tone Protection: In YCbCr space
        const cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
        const cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;
        const isSkin = (cr >= 133 && cr <= 178 && cb >= 77 && cb <= 130 && r > g && g > b && (r - g) > 10);
        if (isSkin && dist > effTol * 0.3) {
          return false;
        }

        return true;
      };

      // Seed top boundary pixels
      for (let x = 0; x < w; x++) {
        const idx = x * 4;
        if (isBgColor(data[idx], data[idx + 1], data[idx + 2], true)) {
          visited[x] = 1;
          queue[tail++] = x;
        }
      }
      // Seed left and right upper edges
      for (let y = 1; y < Math.floor(h * 0.65); y++) {
        const leftIdx = y * w;
        const rightIdx = y * w + (w - 1);
        if (!visited[leftIdx] && isBgColor(data[leftIdx * 4], data[leftIdx * 4 + 1], data[leftIdx * 4 + 2], true)) {
          visited[leftIdx] = 1;
          queue[tail++] = leftIdx;
        }
        if (!visited[rightIdx] && isBgColor(data[rightIdx * 4], data[rightIdx * 4 + 1], data[rightIdx * 4 + 2], true)) {
          visited[rightIdx] = 1;
          queue[tail++] = rightIdx;
        }
      }

      // BFS Frontier Expansion
      const edgeBarrier = Math.max(22, 50 - this.bg.tolerance * 0.3);
      while (head < tail) {
        const curr = queue[head++];
        const cx = curr % w;
        const cy = Math.floor(curr / w);

        const neighbors = [
          cx > 0 ? curr - 1 : -1,
          cx < w - 1 ? curr + 1 : -1,
          cy > 0 ? curr - w : -1,
          cy < h - 1 ? curr + w : -1
        ];

        for (let n = 0; n < 4; n++) {
          const nIdx = neighbors[n];
          if (nIdx < 0 || visited[nIdx]) continue;

          // Stop at strong contrast boundaries (silhouette of head/hair/shoulders)
          if (edgeMap[nIdx] > edgeBarrier && edgeMap[curr] > edgeBarrier) continue;

          const pIdx = nIdx * 4;
          if (isBgColor(data[pIdx], data[pIdx + 1], data[pIdx + 2], cy < h * 0.15)) {
            visited[nIdx] = 1;
            queue[tail++] = nIdx;
          }
        }
      }

      // 4. Generate Mask with Soft Antialiased Edges
      this.maskCanvas.width = w;
      this.maskCanvas.height = h;
      const maskData = this.maskCtx.createImageData(w, h);
      const mPix = maskData.data;

      const rawAlpha = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        rawAlpha[i] = visited[i] ? 0 : 255;
      }

      // Feathering (separable box blur on alpha mask)
      const feather = Math.max(1, this.bg.feather || 2);
      const featheredAlpha = this.fastBoxBlur(rawAlpha, w, h, feather);

      for (let i = 0; i < w * h; i++) {
        const p = i * 4;
        mPix[p] = 255;
        mPix[p + 1] = 255;
        mPix[p + 2] = 255;
        mPix[p + 3] = featheredAlpha[i];
      }

      this.maskCtx.putImageData(maskData, 0, 0);
      this.hasCustomMask = true;
      this.bg.aiActive = true;

      if (recordHist) {
        this.recordHistory('AI Background Removal');
      }
      this.render();

      if (recordHist && typeof showToast === 'function') {
        showToast('Background cleanly separated! Choose a background color below.', 'success');
      }
    } catch (err) {
      console.error('[AI Background Removal Error]', err);
      if (recordHist) alert('Background removal failed: ' + err.message);
    } finally {
      if (spinner && recordHist) spinner.style.display = 'none';
    }
  }

  fastBoxBlur(src, w, h, radius) {
    const dst = new Uint8Array(w * h);
    const temp = new Float32Array(w * h);

    // Horizontal pass
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      let count = 0;

      for (let x = -radius; x <= radius; x++) {
        const px = Math.min(w - 1, Math.max(0, x));
        sum += src[row + px];
        count++;
      }
      temp[row] = sum / count;

      for (let x = 1; x < w; x++) {
        const addX = Math.min(w - 1, x + radius);
        const remX = Math.max(0, x - radius - 1);
        sum += src[row + addX] - src[row + remX];
        temp[row + x] = sum / count;
      }
    }

    // Vertical pass
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;

      for (let y = -radius; y <= radius; y++) {
        const py = Math.min(h - 1, Math.max(0, y));
        sum += temp[py * w + x];
        count++;
      }
      dst[x] = Math.round(sum / count);

      for (let y = 1; y < h; y++) {
        const addY = Math.min(h - 1, y + radius);
        const remY = Math.max(0, y - radius - 1);
        sum += temp[addY * w + x] - temp[remY * w + x];
        dst[y * w + x] = Math.round(sum / count);
      }
    }

    return dst;
  }

  /* -------------------------------------------------------------
     RENDERING PIPELINE (Non-destructive Canvas Pipeline)
     ------------------------------------------------------------- */
  render() {
    if (this.renderPending) return;
    this.renderPending = true;

    requestAnimationFrame(() => {
      this.renderPending = false;
      this.executeRender();
    });
  }

  executeRender() {
    const ctx = this.mainCtx;
    const w = this.targetWidth;
    const h = this.targetHeight;

    ctx.clearRect(0, 0, w, h);

    // Empty state
    if (!this.originalImage && !this.warpedCanvas.width) {
      this.drawEmptyState();
      this.drawOverlay();
      this.updateEstFileSize();
      return;
    }

    // 1. Draw Background
    if (this.bg.type === 'image' && this.customBgImage) {
      ctx.drawImage(this.customBgImage, 0, 0, w, h);
    } else if (this.bg.type === 'color') {
      ctx.fillStyle = this.bg.color;
      ctx.fillRect(0, 0, w, h);
    } // if 'transparent', checkerboard CSS shines through

    // 2. Draw Transformed Subject
    ctx.save();
    ctx.translate(w / 2 + this.viewport.panX, h / 2 + this.viewport.panY);

    const totalAngle = ((this.transforms.fixedRotation + this.transforms.fineRotation) * Math.PI) / 180;
    ctx.rotate(totalAngle);
    ctx.scale(
      (this.transforms.flipH ? -1 : 1) * this.viewport.zoom,
      (this.transforms.flipV ? -1 : 1) * this.viewport.zoom
    );

    const imgW = this.warpedCanvas.width;
    const imgH = this.warpedCanvas.height;

    // Build intermediate processed frame (filters, adjustments, alpha mask)
    const processedFrame = this.buildProcessedFrame();

    ctx.drawImage(processedFrame, -imgW / 2, -imgH / 2);
    ctx.restore();

    // 3. Draw Overlays (Crop box, perspective pins, face guides, brush loupe)
    this.drawOverlay();

    // 4. Update file size estimate
    this.updateEstFileSize();
  }

  buildProcessedFrame() {
    const w = this.warpedCanvas.width;
    const h = this.warpedCanvas.height;

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = w;
    frameCanvas.height = h;
    const fCtx = frameCanvas.getContext('2d', { willReadFrequently: true });

    // Compare Mode: if user holds compare, draw unedited original image
    if (this.isComparing && this.originalImage) {
      fCtx.drawImage(this.originalImage, 0, 0, w, h);
      return frameCanvas;
    }

    // 1. Base warped image
    fCtx.drawImage(this.warpedCanvas, 0, 0);

    // 2. Pixel-level color & tone matrix + ink threshold
    try {
      const imgData = fCtx.getImageData(0, 0, w, h);
      const d = imgData.data;

      // Precompute adjustment variables
      const bFactor = (this.adjustments.brightness / 100) * 80;
      const cFactor = (this.adjustments.contrast + 100) / 100;
      const sFactor = this.adjustments.saturation / 100;
      const expFactor = 2 ** (this.adjustments.exposure / 50);
      const tempR = (this.adjustments.temperature / 100) * 35;
      const tempB = -(this.adjustments.temperature / 100) * 35;
      const tintG = -(this.adjustments.tint / 100) * 35;
      const tintM = (this.adjustments.tint / 100) * 35;
      const gammaInv = 1.0 / Math.max(0.1, this.adjustments.gamma);
      const isGray = this.adjustments.grayscale > 0;
      const grayFactor = this.adjustments.grayscale / 100;

      // Signature Paper Threshold Filter
      const isSig = this.options.mode === 'signature';
      const cleanPaper = isSig && this.adjustments.cleanPaper;
      const threshold = this.adjustments.paperThreshold;
      const inkBoost = this.adjustments.inkBoost / 100;
      const invertInk = isSig && this.adjustments.invertInk;

      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue; // transparent pixel

        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // Exposure & Brightness
        r = r * expFactor + bFactor;
        g = g * expFactor + bFactor;
        b = b * expFactor + bFactor;

        // Contrast
        r = (r - 128) * cFactor + 128;
        g = (g - 128) * cFactor + 128;
        b = (b - 128) * cFactor + 128;

        // Color Temperature & Tint
        r += tempR;
        b += tempB;
        g += tintG;
        r += tintM * 0.5;
        b += tintM * 0.5;

        // Gamma Correction
        if (this.adjustments.gamma !== 1.0) {
          r = 255 * ((Math.max(0, r) / 255) ** gammaInv);
          g = 255 * ((Math.max(0, g) / 255) ** gammaInv);
          b = 255 * ((Math.max(0, b) / 255) ** gammaInv);
        }

        // Saturation & Grayscale
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r = lum + (r - lum) * sFactor;
        g = lum + (g - lum) * sFactor;
        b = lum + (b - lum) * sFactor;

        if (isGray) {
          r = r * (1 - grayFactor) + lum * grayFactor;
          g = g * (1 - grayFactor) + lum * grayFactor;
          b = b * (1 - grayFactor) + lum * grayFactor;
        }

        // Signature Paper Clean & Ink Boost
        if (cleanPaper) {
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luma > threshold) {
            // Paper background: push to pure white or transparent
            if (this.bg.type === 'transparent') {
              d[i + 3] = 0;
            } else {
              r = 255; g = 255; b = 255;
            }
          } else {
            // Ink: deepen black / pen contrast
            r = Math.max(0, (r - 40) * inkBoost);
            g = Math.max(0, (g - 40) * inkBoost);
            b = Math.max(0, (b - 40) * inkBoost);
            if (invertInk) {
              r = 255 - r;
              g = 255 - g;
              b = 255 - b;
            }
          }
        }

        d[i] = Math.max(0, Math.min(255, r));
        d[i + 1] = Math.max(0, Math.min(255, g));
        d[i + 2] = Math.max(0, Math.min(255, b));
      }

      // Sharpness Convolution (Unsharp Mask)
      if (this.adjustments.sharpness > 0) {
        this.applySharpness(imgData, this.adjustments.sharpness / 100);
      }

      fCtx.putImageData(imgData, 0, 0);

      // 3. Apply Alpha Mask (Background Removal / Brushes)
      if (this.hasCustomMask && this.maskCanvas.width === w) {
        fCtx.save();
        fCtx.globalCompositeOperation = 'destination-in';
        fCtx.drawImage(this.maskCanvas, 0, 0);
        fCtx.restore();
      }
    } catch (e) {
      console.warn('Pixel processing error:', e);
    }

    return frameCanvas;
  }

  applySharpness(imgData, amount) {
    const w = imgData.width;
    const h = imgData.height;
    const src = new Uint8ClampedArray(imgData.data);
    const dst = imgData.data;
    const k = amount * 0.8;

    for (let y = 1; y < h - 1; y++) {
      const row = y * w;
      for (let x = 1; x < w - 1; x++) {
        const i = (row + x) * 4;
        for (let c = 0; c < 3; c++) {
          const val = (1 + 4 * k) * src[i + c]
            - k * src[i - 4 + c]
            - k * src[i + 4 + c]
            - k * src[((y - 1) * w + x) * 4 + c]
            - k * src[((y + 1) * w + x) * 4 + c];
          dst[i + c] = Math.max(0, Math.min(255, val));
        }
      }
    }
  }

  autoEnhanceColors() {
    if (!this.warpedCanvas.width) return;
    this.adjustments.contrast = 15;
    this.adjustments.saturation = 110;
    this.adjustments.exposure = 8;
    this.adjustments.sharpness = 25;
    this.adjustments.highlights = -5;
    this.adjustments.shadows = 8;

    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const c = this.container;
    const setSlider = (id, val, txt) => {
      const el = c.querySelector(`#${id}`);
      const txtEl = c.querySelector(`#${id}-val`);
      if (el) el.value = val;
      if (txtEl) txtEl.textContent = txt;
    };

    setSlider(`${prefix}-contrast`, 15, '+15');
    setSlider(`${prefix}-saturation`, 110, '110%');
    setSlider(`${prefix}-exposure`, 8, '+8');
    setSlider(`${prefix}-sharpness`, 25, '25%');

    this.recordHistory('Auto-Enhanced Colors');
    this.render();

    if (typeof showToast === 'function') {
      showToast('Auto-enhanced image levels and clarity!', 'success');
    }
  }

  /* -------------------------------------------------------------
     OVERLAY RENDERING (Crop Box, Perspective Pins, Face Guides, Magnifier Loupe)
     ------------------------------------------------------------- */
  drawOverlay(currentPointerPos = null) {
    const ctx = this.overlayCtx;
    const w = this.targetWidth;
    const h = this.targetHeight;

    ctx.clearRect(0, 0, w, h);

    if (!this.originalImage && !this.warpedCanvas.width) return;

    // 1. Draw Rectangular Crop Box
    if (this.cropTool.active) {
      const { x, y, w: cw, h: ch } = this.cropTool.rect;

      // Dark translucent mask outside crop box
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, 0, w, y);
      ctx.fillRect(0, y + ch, w, h - (y + ch));
      ctx.fillRect(0, y, x, ch);
      ctx.fillRect(x + cw, y, w - (x + cw), ch);

      // Crop border & Rule of Thirds
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cw, ch);

      // Thirds grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + cw / 3, y); ctx.lineTo(x + cw / 3, y + ch);
      ctx.moveTo(x + (cw * 2) / 3, y); ctx.lineTo(x + (cw * 2) / 3, y + ch);
      ctx.moveTo(x, y + ch / 3); ctx.lineTo(x + cw, y + ch / 3);
      ctx.moveTo(x, y + (ch * 2) / 3); ctx.lineTo(x + cw, y + (ch * 2) / 3);
      ctx.stroke();

      // Handles (Corners and Midpoints)
      const handles = [
        [x, y], [x + cw / 2, y], [x + cw, y],
        [x + cw, y + ch / 2], [x + cw, y + ch],
        [x + cw / 2, y + ch], [x, y + ch], [x, y + ch / 2]
      ];
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      handles.forEach(([hx, hy]) => {
        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    }

    // 2. Draw Perspective Quadrilateral & 4 Corner Pins
    if (this.perspectiveTool.active) {
      const corners = this.perspectiveTool.corners;
      ctx.save();

      // Connecting quad lines
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
      ctx.stroke();

      // Perspective grid subdivisions (4x4)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 1;
      for (let step = 1; step < 4; step++) {
        const t = step / 4;
        // Top to bottom
        const topX = corners[0].x + (corners[1].x - corners[0].x) * t;
        const topY = corners[0].y + (corners[1].y - corners[0].y) * t;
        const botX = corners[3].x + (corners[2].x - corners[3].x) * t;
        const botY = corners[3].y + (corners[2].y - corners[3].y) * t;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.lineTo(botX, botY);
        ctx.stroke();

        // Left to right
        const leftX = corners[0].x + (corners[3].x - corners[0].x) * t;
        const leftY = corners[0].y + (corners[3].y - corners[0].y) * t;
        const rightX = corners[1].x + (corners[2].x - corners[1].x) * t;
        const rightY = corners[1].y + (corners[2].y - corners[1].y) * t;
        ctx.beginPath();
        ctx.moveTo(leftX, leftY);
        ctx.lineTo(rightX, rightY);
        ctx.stroke();
      }

      // Draw Corner Pins with Glowing Crosshairs
      const cornerLabels = ['TL', 'TR', 'BR', 'BL'];
      corners.forEach((pt, i) => {
        const isHovered = this.perspectiveTool.activeCorner === i;
        ctx.fillStyle = isHovered ? '#f59e0b' : '#10b981';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isHovered ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Label tag
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(cornerLabels[i], pt.x + 10, pt.y - 6);
      });

      // Magnifier Loupe when dragging a pin
      if (this.perspectiveTool.activeCorner !== null && currentPointerPos) {
        this.drawMagnifierLoupe(currentPointerPos.x, currentPointerPos.y);
      }
      ctx.restore();
    }

    // 3. Draw Passport Face Guidelines Overlay (ICAO / BD Standard)
    if (this.guides.showFaceGuide && this.options.mode === 'photo' && !this.cropTool.active && !this.perspectiveTool.active) {
      this.drawFaceGuidelines();
    }

    // 4. Draw Alignment Grid or Straighten Leveling Guides
    if (this.isAdjustingStraighten) {
      this.drawStraightenLevelGuide();
    } else if (this.guides.showGrid && !this.cropTool.active && !this.perspectiveTool.active) {
      this.drawRuleOfThirdsGrid();
    }

    // 5. Draw Brush Preview Ring
    if (this.brushTool.active && currentPointerPos) {
      ctx.save();
      ctx.strokeStyle = this.brushTool.mode === 'erase' ? '#ef4444' : '#10b981';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(currentPointerPos.x, currentPointerPos.y, this.brushTool.size / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawFaceGuidelines() {
    const ctx = this.overlayCtx;
    const w = this.targetWidth;
    const h = this.targetHeight;

    ctx.save();
    ctx.setLineDash([4, 4]);

    // Center Vertical Line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Top of Head Guideline
    const topY = (this.guides.headMarginTop / 100) * h;
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(w, topY);
    ctx.stroke();

    // Eye Level Guideline
    const eyeY = (this.guides.eyeLevel / 100) * h;
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, eyeY);
    ctx.lineTo(w, eyeY);
    ctx.stroke();

    // Chin Level Guideline
    const chinY = (this.guides.chinLevel / 100) * h;
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, chinY);
    ctx.lineTo(w, chinY);
    ctx.stroke();

    // Oval Head Outline (ICAO 60-70% height)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    const headHeight = chinY - topY;
    const headWidth = headHeight * 0.72;
    const centerY = topY + headHeight / 2;

    ctx.beginPath();
    ctx.ellipse(w / 2, centerY, headWidth / 2, headHeight / 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Shoulder Arc Guides
    if (this.guides.showShoulders) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.beginPath();
      ctx.arc(w * 0.22, h * 0.95, w * 0.25, Math.PI, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.95, w * 0.25, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();
    }

    // Label tags
    ctx.setLineDash([]);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('Crown / Top Head', 8, topY - 3);
    ctx.fillStyle = '#eab308';
    ctx.fillText('Eye Level', 8, eyeY - 3);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('Chin Level', 8, chinY - 3);

    ctx.restore();
  }

  drawRuleOfThirdsGrid() {
    const ctx = this.overlayCtx;
    const w = this.targetWidth;
    const h = this.targetHeight;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    ctx.beginPath();
    ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h);
    ctx.moveTo((w * 2) / 3, 0); ctx.lineTo((w * 2) / 3, h);
    ctx.moveTo(0, h / 3); ctx.lineTo(w, h / 3);
    ctx.moveTo(0, (h * 2) / 3); ctx.lineTo(w, (h * 2) / 3);
    ctx.stroke();

    ctx.restore();
  }

  drawStraightenLevelGuide() {
    const ctx = this.overlayCtx;
    const w = this.targetWidth;
    const h = this.targetHeight;

    ctx.save();
    // Semi-transparent leveling grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let x = w / 6; x < w; x += w / 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = h / 6; y < h; y += h / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Bold center horizontal horizon line
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Center vertical line
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Badge showing current angle
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(w / 2 - 38, h / 2 - 24, 76, 20);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.transforms.fineRotation > 0 ? '+' : ''}${this.transforms.fineRotation.toFixed(1)}°`, w / 2, h / 2 - 10);

    ctx.restore();
  }

  drawMagnifierLoupe(centerX, centerY) {
    const ctx = this.overlayCtx;
    const loupeRadius = 38;
    const loupeX = Math.max(loupeRadius + 5, Math.min(this.targetWidth - loupeRadius - 5, centerX));
    const loupeY = Math.max(loupeRadius + 5, centerY - 65);

    ctx.save();
    // Circle clipping
    ctx.beginPath();
    ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
    ctx.clip();

    // 2.5x zoomed view of main canvas
    ctx.drawImage(
      this.mainCanvas,
      centerX - loupeRadius / 2.5, centerY - loupeRadius / 2.5, loupeRadius * 2 / 2.5, loupeRadius * 2 / 2.5,
      loupeX - loupeRadius, loupeY - loupeRadius, loupeRadius * 2, loupeRadius * 2
    );

    // Reticle crosshair
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(loupeX - 10, loupeY); ctx.lineTo(loupeX + 10, loupeY);
    ctx.moveTo(loupeX, loupeY - 10); ctx.lineTo(loupeX, loupeY + 10);
    ctx.stroke();

    ctx.restore();

    // Loupe Border
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  drawEmptyState() {
    const ctx = this.mainCtx;
    const w = this.targetWidth;
    const h = this.targetHeight;

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`No ${this.options.mode === 'photo' ? 'Photo' : 'Signature'} Loaded`, w / 2, h / 2 - 10);
    ctx.font = '11px sans-serif';
    ctx.fillText('Upload or Drag & Drop Above', w / 2, h / 2 + 12);
  }

  getScreenToImageTransform() {
    const w = this.targetWidth;
    const h = this.targetHeight;
    const panX = this.viewport.panX;
    const panY = this.viewport.panY;
    const zoom = this.viewport.zoom;
    const totalAngle = ((this.transforms.fixedRotation + this.transforms.fineRotation) * Math.PI) / 180;
    const flipH = this.transforms.flipH ? -1 : 1;
    const flipV = this.transforms.flipV ? -1 : 1;
    const imgW = this.warpedCanvas.width;
    const imgH = this.warpedCanvas.height;

    return (screenX, screenY) => {
      // 1. Invert translate
      let x = screenX - (w / 2 + panX);
      let y = screenY - (h / 2 + panY);

      // 2. Invert rotation
      const cos = Math.cos(-totalAngle);
      const sin = Math.sin(-totalAngle);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;

      // 3. Invert scale & flips
      const sx = (rx / (zoom * flipH)) + imgW / 2;
      const sy = (ry / (zoom * flipV)) + imgH / 2;

      return { x: sx, y: sy };
    };
  }

  /* -------------------------------------------------------------
     HISTORY & STATE MANAGEMENT (Undo / Redo)
     ------------------------------------------------------------- */
  recordHistory(actionDescription = 'Edit') {
    // Truncate redo stack
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Save snapshot
    const snapshot = {
      action: actionDescription,
      warpedCanvasData: this.warpedCanvas.width ? this.warpedCtx.getImageData(0, 0, this.warpedCanvas.width, this.warpedCanvas.height) : null,
      maskCanvasData: this.hasCustomMask ? this.maskCtx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height) : null,
      hasCustomMask: this.hasCustomMask,
      viewport: Object.assign({}, this.viewport),
      transforms: Object.assign({}, this.transforms),
      adjustments: Object.assign({}, this.adjustments),
      bg: Object.assign({}, this.bg),
      targetWidth: this.targetWidth,
      targetHeight: this.targetHeight
    };

    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreSnapshot(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreSnapshot(this.history[this.historyIndex]);
    }
  }

  restoreSnapshot(snapshot) {
    if (!snapshot) return;

    if (snapshot.warpedCanvasData) {
      this.warpedCanvas.width = snapshot.warpedCanvasData.width;
      this.warpedCanvas.height = snapshot.warpedCanvasData.height;
      this.warpedCtx.putImageData(snapshot.warpedCanvasData, 0, 0);
    }

    this.hasCustomMask = snapshot.hasCustomMask;
    if (snapshot.maskCanvasData) {
      this.maskCanvas.width = snapshot.maskCanvasData.width;
      this.maskCanvas.height = snapshot.maskCanvasData.height;
      this.maskCtx.putImageData(snapshot.maskCanvasData, 0, 0);
    }

    this.viewport = Object.assign({}, snapshot.viewport);
    this.transforms = Object.assign({}, snapshot.transforms);
    this.adjustments = Object.assign({}, snapshot.adjustments);
    this.bg = Object.assign({}, snapshot.bg);
    this.targetWidth = snapshot.targetWidth;
    this.targetHeight = snapshot.targetHeight;

    this.syncCanvasDimensions();
    this.syncDOMControls();
    this.updateUndoRedoButtons();
    this.render();
  }

  syncDOMControls() {
    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const c = this.container;

    const setSlider = (id, val, txt) => {
      const el = c.querySelector(`#${id}`);
      const txtEl = c.querySelector(`#${id}-val`);
      if (el) el.value = val;
      if (txtEl) txtEl.textContent = txt;
    };

    setSlider(`${prefix}-brightness`, this.adjustments.brightness, `${this.adjustments.brightness}`);
    setSlider(`${prefix}-contrast`, this.adjustments.contrast, `${this.adjustments.contrast}`);
    setSlider(`${prefix}-saturation`, this.adjustments.saturation, `${this.adjustments.saturation}%`);
    setSlider(`${prefix}-fine-rotation`, this.transforms.fineRotation, `${this.transforms.fineRotation.toFixed(1)}°`);
    setSlider(`${prefix}-zoom`, Math.round(this.viewport.zoom * 100), `${Math.round(this.viewport.zoom * 100)}%`);
  }

  updateUndoRedoButtons() {
    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const btnUndo = this.container.querySelector(`#${prefix}-btn-undo`);
    const btnRedo = this.container.querySelector(`#${prefix}-btn-redo`);
    if (btnUndo) btnUndo.disabled = this.historyIndex <= 0;
    if (btnRedo) btnRedo.disabled = this.historyIndex >= this.history.length - 1;
  }

  /* -------------------------------------------------------------
     EXPORT & LOCAL STORAGE INTEGRATION
     ------------------------------------------------------------- */
  updateEstFileSize() {
    if (!this.estSizeBadge || !this.originalImage) {
      if (this.estSizeBadge) this.estSizeBadge.textContent = '~0 KB';
      return;
    }

    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const formatSelect = this.container.querySelector(`#${prefix}-export-format`);
    const qualitySlider = this.container.querySelector(`#${prefix}-export-quality`);

    const format = formatSelect ? formatSelect.value : 'image/jpeg';
    const qual = format === 'image/jpeg' || format === 'image/webp'
      ? (qualitySlider ? parseInt(qualitySlider.value, 10) / 100 : 0.9)
      : undefined;

    this.mainCanvas.toBlob((blob) => {
      if (blob) {
        const kb = (blob.size / 1024).toFixed(1);
        const maxKb = (this.options.maxFileSizeBytes / 1024).toFixed(0);
        const isValid = blob.size <= this.options.maxFileSizeBytes;
        this.estSizeBadge.textContent = `~${kb} KB (${isValid ? 'Valid' : 'Exceeds'} ≤ ${maxKb} KB)`;
        this.estSizeBadge.style.color = isValid ? '#15803d' : '#b91c1c';
      }
    }, format, qual);
  }

  downloadImage() {
    if (!this.originalImage && !this.warpedCanvas.width) {
      alert('Please upload or edit an image before downloading.');
      return;
    }

    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const formatSelect = this.container.querySelector(`#${prefix}-export-format`);
    const qualitySlider = this.container.querySelector(`#${prefix}-export-quality`);

    const format = formatSelect ? formatSelect.value : 'image/jpeg';
    const ext = format === 'image/png' ? 'png' : (format === 'image/webp' ? 'webp' : 'jpg');
    const qual = format === 'image/jpeg' || format === 'image/webp'
      ? (qualitySlider ? parseInt(qualitySlider.value, 10) / 100 : 0.9)
      : undefined;

    // Export Canvas with exact target resolution
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.targetWidth;
    exportCanvas.height = this.targetHeight;
    const expCtx = exportCanvas.getContext('2d');

    // Fill background for formats without transparency support
    if (format === 'image/jpeg' && this.bg.type === 'transparent') {
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, this.targetWidth, this.targetHeight);
    }
    expCtx.drawImage(this.mainCanvas, 0, 0);

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.originalFileName || 'passport_photo'}_${this.targetWidth}x${this.targetHeight}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      if (typeof showToast === 'function') {
        showToast(`Downloaded ${a.download}!`, 'success');
      }
    }, format, qual);
  }

  async saveToStorage() {
    if (!this.originalImage && !this.warpedCanvas.width) {
      alert('Please upload or edit an image before saving.');
      return;
    }

    const prefix = this.options.mode === 'signature' ? 'sig' : 'photo';
    const formatSelect = this.container.querySelector(`#${prefix}-export-format`);
    const qualitySlider = this.container.querySelector(`#${prefix}-export-quality`);

    const format = formatSelect ? formatSelect.value : 'image/jpeg';
    const qual = format === 'image/jpeg' || format === 'image/webp'
      ? (qualitySlider ? parseInt(qualitySlider.value, 10) / 100 : 0.9)
      : undefined;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.targetWidth;
    exportCanvas.height = this.targetHeight;
    const expCtx = exportCanvas.getContext('2d');

    if (format === 'image/jpeg' && this.bg.type === 'transparent') {
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, this.targetWidth, this.targetHeight);
    }
    expCtx.drawImage(this.mainCanvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL(format, qual);
    const estKb = (dataUrl.length * 0.75 / 1024).toFixed(1);

    const metadata = {
      width: this.targetWidth,
      height: this.targetHeight,
      format: format,
      sizeKb: estKb,
      originalName: this.originalFileName
    };

    if (typeof this.options.onSave === 'function') {
      try {
        await this.options.onSave(dataUrl, metadata);
        if (typeof showToast === 'function') {
          showToast(`Saved to Candidate Profile in local storage!`, 'success');
        }
      } catch (err) {
        alert('Failed to save to local storage: ' + err.message);
      }
    }
  }

  /**
   * Loads an existing DataURL (e.g. from Saved Media storage) into this editor.
   */
  loadDataUrl(dataUrl, metadata = {}) {
    const img = new Image();
    img.onload = () => {
      this.originalImage = img;
      this.originalFileName = metadata.originalName || (this.options.mode === 'photo' ? 'saved_photo' : 'saved_signature');
      this.resetWorkingCanvasFromOriginal();
      this.resetMask();
      this.resetPosition(true);

      if (this.fileInfo) {
        this.fileInfo.style.display = 'inline-block';
        this.fileInfo.textContent = `Loaded from Storage (${img.naturalWidth}×${img.naturalHeight}px)`;
      }

      this.history = [];
      this.historyIndex = -1;
      this.recordHistory('Loaded from Storage');
      this.render();
    };
    img.src = dataUrl;
  }
}

// Global export for extension scripts
window.PassportPhotoEditor = PassportPhotoEditor;

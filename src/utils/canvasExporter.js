import QRCode from 'qrcode';

// ============================================================
//  Life4Cuts Photobooth — High-Res Canvas Strip Exporter
//  Renders every frame theme identically to the browser preview
// ============================================================

/**
 * Word-wrap text to fit within maxWidth pixels.
 * Handles explicit \n newlines and auto-wraps long words.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]} array of lines
 */
function wrapText(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [''];
}

export function drawPhotoStripToCanvas(canvas, options) {
  const {
    photos = [],
    layout = 'strip1x4',
    frameTheme = 'haru_white',
    frameColor = '#FFFFFF',
    textColor = '#121212',
    filter = 'normal',
    showGrain = true,
    showLedDate = true,
    showQrCode = false,
    titleText = 'LIFE 4 CUTS 📸',
    subtitleText = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.'),
    fontStyle = 'default',
    sticker = null,
    doodlePaths = [],
    resolutionScale = 1.0, // 1.0 = 300 DPI, 2.0 = 600 DPI, 4.0 = 1200 DPI
    customBgDataUrl = null, // Custom background image uploaded by user
    customFrameColor = null,
    placedStickers = [],
    placedCaptions = [],
    placedImages = [],
    watermarkText = null,
    watermarkOpacity = 0.4,
  } = options;

  return new Promise((resolve, reject) => {
    const realPhotos = photos.filter(Boolean);
    if (!photos || realPhotos.length === 0) {
      return reject(new Error('No photos provided'));
    }

    const ctx = canvas.getContext('2d');
    const scale = Number(resolutionScale) || 1.0;

    // ── Canvas Layout Dimensions ────────────────────────────────
    let stripWidth = 600;
    let padding = 32;
    let photoSpacing = 16;
    let headerHeight = 110;   // room for deco + title
    let footerHeight = showQrCode ? 190 : 140;

    let photoWidth, photoHeight, totalHeight;

    if (layout === 'grid2x2') {
      stripWidth = 640;
      photoWidth = Math.round((stripWidth - (padding * 2) - photoSpacing) / 2);
      photoHeight = Math.round(photoWidth * (3 / 4));
      totalHeight = headerHeight + padding + (2 * photoHeight) + photoSpacing + footerHeight;
    } else if (layout === 'strip1x3') {
      stripWidth = 560;
      photoWidth = stripWidth - (padding * 2);
      photoHeight = Math.round(photoWidth * (3 / 4));
      totalHeight = headerHeight + padding + (3 * photoHeight) + (2 * photoSpacing) + footerHeight;
    } else if (layout === 'duo1x2') {
      stripWidth = 580;
      photoWidth = stripWidth - (padding * 2);
      photoHeight = Math.round(photoWidth * (3 / 4));
      totalHeight = headerHeight + padding + (2 * photoHeight) + photoSpacing + footerHeight;
    } else if (layout === 'hero1plus3') {
      stripWidth = 620;
      photoWidth = stripWidth - (padding * 2);
      photoHeight = Math.round(photoWidth * (3 / 4));
      const miniWidth = Math.round((photoWidth - (2 * photoSpacing)) / 3);
      const miniHeight = Math.round(miniWidth * (4 / 3));
      totalHeight = headerHeight + padding + photoHeight + photoSpacing + miniHeight + footerHeight;
    } else if (layout === 'photocard') {
      // K-Pop photocard: 55mm × 85mm ratio (portrait card)
      stripWidth = 420;
      padding = 20;
      headerHeight = 70;
      footerHeight = 80;
      photoWidth = stripWidth - (padding * 2);
      photoHeight = Math.round(photoWidth * (4 / 3));
      totalHeight = headerHeight + padding + photoHeight + footerHeight;
    } else {
      // strip1x4 / filmroll
      stripWidth = 560;
      photoWidth = stripWidth - (padding * 2);
      photoHeight = Math.round(photoWidth * (3 / 4));
      totalHeight = headerHeight + padding + (4 * photoHeight) + (3 * photoSpacing) + footerHeight;
    }

    canvas.width = Math.round(stripWidth * scale);
    canvas.height = Math.round(totalHeight * scale);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = scale >= 2.0 ? 'high' : 'medium';

    ctx.save();
    ctx.scale(scale, scale);

    // ── Slot Geometry ───────────────────────────────────────────
    const getSlotBounds = (i) => {
      let x, y, w = photoWidth, h = photoHeight;
      if (layout === 'grid2x2') {
        const col = i % 2, row = Math.floor(i / 2);
        x = padding + col * (photoWidth + photoSpacing);
        y = headerHeight + row * (photoHeight + photoSpacing);
      } else if (layout === 'hero1plus3') {
        if (i === 0) {
          x = padding; y = headerHeight; w = photoWidth; h = photoHeight;
        } else {
          const mW = Math.round((photoWidth - (2 * photoSpacing)) / 3);
          const mH = Math.round(mW * (4 / 3));
          x = padding + (i - 1) * (mW + photoSpacing);
          y = headerHeight + photoHeight + photoSpacing;
          w = mW; h = mH;
        }
      } else if (layout === 'photocard') {
        x = padding;
        y = headerHeight + padding;
        w = photoWidth;
        h = photoHeight;
      } else {
        x = padding;
        y = headerHeight + (i * (photoHeight + photoSpacing));
      }
      return { x, y, w, h };
    };

    const totalSlots = layout === 'duo1x2' ? 2 : (layout === 'strip1x3' ? 3 : layout === 'photocard' ? 1 : 4);
    const cfg = THEME_CONFIG[frameTheme] || THEME_CONFIG.haru_white;

    const drawCroppedImage = (img, dx, dy, dw, dh, crop = {}) => {
      const cropZoom = Math.max(0.6, Math.min(2.5, Number(crop.cropZoom) || 1));
      const cropX = Math.max(0, Math.min(100, Number.isFinite(Number(crop.cropX)) ? Number(crop.cropX) : 50));
      const cropY = Math.max(0, Math.min(100, Number.isFinite(Number(crop.cropY)) ? Number(crop.cropY) : 50));
      const sourceW = img.width;
      const sourceH = img.height;
      const zoomedW = sourceW / cropZoom;
      const zoomedH = sourceH / cropZoom;
      const srcX = Math.min(sourceW - zoomedW, Math.max(0, (cropX / 100) * sourceW - zoomedW / 2));
      const srcY = Math.min(sourceH - zoomedH, Math.max(0, (cropY / 100) * sourceH - zoomedH / 2));

      ctx.drawImage(
        img,
        srcX, srcY, zoomedW, zoomedH,
        dx, dy, dw, dh
      );
    };

    // ── 1. Draw Frame Background ────────────────────────────────
    drawFrameBackground(ctx, stripWidth, totalHeight, frameTheme, cfg, customFrameColor);

    // ── 2. Draw Header Decoration ───────────────────────────────
    drawHeaderDecoration(ctx, stripWidth, frameTheme, cfg);

    // ── 3. Draw Title ───────────────────────────────────────────
    ctx.save();
    ctx.fillStyle = cfg.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleY = headerHeight - 30;
    if (fontStyle === 'handwritten') {
      ctx.font = `bold 30px "Pacifico", cursive`;
    } else if (fontStyle === 'grotesk') {
      ctx.font = `800 26px "Space Grotesk", sans-serif`;
    } else {
      ctx.font = `800 26px "Outfit", "Plus Jakarta Sans", sans-serif`;
    }
    ctx.fillText(titleText, stripWidth / 2, titleY);
    ctx.restore();

    // ── 4. Sprocket holes for film layout ──────────────────────
    if (layout === 'filmroll' || frameTheme === 'film_roll') {
      drawSprocketHoles(ctx, stripWidth, totalHeight);
    }

    // ── 5. Load & Render Photos ─────────────────────────────────
    let loadedCount = 0;
    const imgElements = [];
    const totalToLoad = realPhotos.length;

    // Load custom background image (if set)
    let customBgImgEl = null;
    let customBgReady = false;

    function tryRender() {
      if (loadedCount === totalToLoad && customBgReady) renderAllAndResolve();
    }

    // Load custom BG image first
    if (customBgDataUrl) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => { customBgImgEl = bgImg; customBgReady = true; tryRender(); };
      bgImg.onerror = () => { customBgReady = true; tryRender(); };
      bgImg.src = customBgDataUrl;
    } else {
      customBgReady = true;
    }

    if (totalToLoad === 0) { tryRender(); return; }

    photos.slice(0, totalSlots).forEach((src, index) => {
      if (!src) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedCount++;
        imgElements[index] = img;
        tryRender();
      };
      img.onerror = () => {
        loadedCount++;
        tryRender();
      };
      img.src = src;
    });

    async function renderAllAndResolve() {
      // Draw each photo slot
      for (let i = 0; i < totalSlots; i++) {
        const { x, y, w, h } = getSlotBounds(i);
        const img = imgElements[i];
        const r = cfg.photoRadius || 2;

        // Clip region shared by BG + photo
        ctx.save();
        ctx.beginPath();
        roundedRect(ctx, x, y, w, h, r);
        ctx.clip();

        // ── Draw custom background (cover-fit) behind each photo ──
        if (customBgImgEl) {
          ctx.save();
          drawCoverImage(ctx, customBgImgEl, x, y, w, h);
          ctx.restore();
        }

        if (img) {
          applyCanvasFilter(ctx, filter, scale);
          drawCoverImage(ctx, img, x, y, w, h);
        } else if (!customBgImgEl) {
          // Empty placeholder only if no custom BG
          ctx.fillStyle = cfg.emptySlot || 'rgba(0,0,0,0.07)';
          ctx.beginPath();
          roundedRect(ctx, x, y, w, h, r);
          ctx.fill();
        }

        ctx.restore();

        if (img) {
          if (showGrain) drawFilmGrain(ctx, x, y, w, h);
          if (showLedDate) drawLedTimestamp(ctx, x, y, w, h);
        }

        // Photo border
        ctx.save();
        ctx.strokeStyle = cfg.photoBorder || 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundedRect(ctx, x, y, w, h, r);
        ctx.stroke();
        ctx.restore();
      }

      // ── 6. Corner Emoji Motifs ──────────────────────────────
      if (cfg.corners) {
        drawCornerMotifs(ctx, stripWidth, totalHeight, cfg.corners);
      }

      // ── 7. Footer Decoration ────────────────────────────────
      drawFooterDecoration(ctx, stripWidth, totalHeight, frameTheme, cfg);

      // ── 8. Footer Text ──────────────────────────────────────
      const footerY = totalHeight - footerHeight + 20;

      ctx.save();
      ctx.fillStyle = cfg.textColor;
      ctx.textAlign = 'center';
      ctx.font = '700 18px "Outfit", sans-serif';
      ctx.fillText(subtitleText, stripWidth / 2, footerY + 24);

      ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
      ctx.globalAlpha = 0.7;
      ctx.fillText(cfg.footerBrand || 'LIFE 4 CUTS • STUDIO EDITION', stripWidth / 2, footerY + 46);
      ctx.globalAlpha = 1.0;
      ctx.restore();

      // Sticker
      if (sticker) {
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sticker, stripWidth / 2, footerY + 86);
      }

      // ── 9. QR Code ─────────────────────────────────────────
      if (showQrCode) {
        try {
          const qrDataUrl = await QRCode.toDataURL(window.location.href, {
            margin: 1,
            color: { dark: cfg.textColor === '#FFFFFF' ? '#FFFFFF' : '#121212', light: '#00000000' }
          });
          const qrImg = new Image();
          await new Promise(res => { qrImg.onload = res; qrImg.src = qrDataUrl; });
          const qrSize = 56;
          ctx.drawImage(qrImg, (stripWidth - qrSize) / 2, footerY + 106, qrSize, qrSize);
        } catch (e) { console.warn('QR skipped', e); }
      }

      // ── 10. Doodle Paths ────────────────────────────────────
      if (doodlePaths && doodlePaths.length > 0) {
        drawDoodlePaths(ctx, doodlePaths);
      }

      // ── 11. Draggable Placed Stickers ───────────────────────
      if (placedStickers && placedStickers.length > 0) {
        const stickerTasks = placedStickers.map(async (stk) => {
          const sx = (stk.xPercent / 100) * stripWidth;
          const sy = (stk.yPercent / 100) * totalHeight;
          if (stk.imageSrc) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise(res => {
              img.onload = res;
              img.onerror = res;
              img.src = stk.imageSrc;
            });
            const size = Math.round((stk.size || 36) * 1.8);
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(((stk.rotation || 0) * Math.PI) / 180);
            drawCroppedImage(img, -size / 2, -size / 2, size, size, {
              cropZoom: stk.cropZoom || 1,
              cropX: stk.cropX ?? 50,
              cropY: stk.cropY ?? 50,
            });
            ctx.restore();
            return;
          }
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const fontSize = Math.round((stk.size || 32) * 1.5);
          ctx.font = `${fontSize}px sans-serif`;
          ctx.fillText(stk.emoji || '☆', sx, sy);
          ctx.restore();
        });
        await Promise.all(stickerTasks);
      }

      // ── 12. Draggable Custom Captions ───────────────────────
      if (placedCaptions && placedCaptions.length > 0) {
        ctx.save();
        placedCaptions.forEach(cap => {
          const cx = (cap.xPercent / 100) * stripWidth;
          const cy = (cap.yPercent / 100) * totalHeight;
          const fontSize = Math.round((cap.fontSize || 18) * 1.5);
          const fontFamily = cap.fontFamily || '"Outfit", sans-serif';
          const fontWeight = cap.fontWeight || 800;
          const align = cap.align || 'center';
          const shadowEnabled = cap.shadow !== false;
          const strokeEnabled = !!cap.stroke;

          ctx.textBaseline = 'middle';
          ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

          const captionLines = wrapText(ctx, cap.text || '', stripWidth * 0.85);
          const lineHeight = (cap.fontSize || 14) * scale * 1.3;

          const padX = 12, padY = 6;
          // Measure the widest line for the background rect
          const maxLineWidth = captionLines.reduce((max, line) => {
            const w = ctx.measureText(line).width;
            return w > max ? w : max;
          }, 0);
          const rectW = Math.max(maxLineWidth + padX * 2, 20);
          const rectH = (lineHeight * captionLines.length) + padY * 2;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          roundedRect(ctx, cx - rectW / 2, cy - rectH / 2, rectW, rectH, 6);
          ctx.fill();

          ctx.fillStyle = cap.color || '#FFFFFF';
          ctx.shadowColor = shadowEnabled ? 'rgba(0, 0, 0, 0.8)' : 'transparent';
          ctx.shadowBlur = shadowEnabled ? 6 : 0;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = strokeEnabled ? 'rgba(15, 23, 42, 0.8)' : 'transparent';
          ctx.lineWidth = strokeEnabled ? Math.max(2, fontSize * 0.1) : 0;

          // Top of text block, vertically centred around cy
          const textBlockTop = cy - (lineHeight * captionLines.length) / 2 + lineHeight / 2;

          captionLines.forEach((line, lineIndex) => {
            const x = align === 'left'
              ? cx - rectW / 2 + padX
              : align === 'right'
                ? cx + rectW / 2 - padX
                : cx;
            const y = textBlockTop + lineIndex * lineHeight;

            ctx.textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
            ctx.fillText(line, x, y);
            if (strokeEnabled) ctx.strokeText(line, x, y);
          });

          ctx.shadowBlur = 0;
        });
        ctx.restore();
      }

      // ── 13. Uploaded Image Layers ───────────────────────────
      if (placedImages && placedImages.length > 0) {
        const imageTasks = placedImages.map(async (imgItem) => {
          if (!imgItem?.src) return null;
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = imgItem.src;
          });
          if (!img.width || !img.height) return null;
          const cx = (imgItem.xPercent / 100) * stripWidth;
          const cy = (imgItem.yPercent / 100) * totalHeight;
          const width = Math.max(24, (imgItem.widthPercent || 28) / 100 * stripWidth);
          const height = width * (img.height / img.width);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(((imgItem.rotation || 0) * Math.PI) / 180);
          ctx.globalAlpha = imgItem.opacity ?? 1;
          drawCroppedImage(img, -width / 2, -height / 2, width, height, {
            cropZoom: imgItem.cropZoom || 1,
            cropX: imgItem.cropX ?? 50,
            cropY: imgItem.cropY ?? 50,
          });
          ctx.restore();
          return true;
        });
        await Promise.all(imageTasks);
      }

      // ── 11. Custom PNG Overlay Frame (Canva / Photoshop Desain) ──
      if ((frameTheme === 'custom_png' || options.customFrameUrl) && (options.customFrameUrl || typeof window !== 'undefined' && window.customFramePngUrl)) {
        try {
          const overlaySrc = options.customFrameUrl || window.customFramePngUrl;
          const overlayImg = new Image();
          overlayImg.crossOrigin = 'anonymous';
          await new Promise(res => { overlayImg.onload = res; overlayImg.onerror = res; overlayImg.src = overlaySrc; });
          if (overlayImg.width > 0) {
            ctx.drawImage(overlayImg, 0, 0, stripWidth, totalHeight);
          }
        } catch (e) {
          console.warn('Custom overlay frame skipped:', e);
        }
      }

      // ── 14. Watermark ───────────────────────────────────────
      if (watermarkText && watermarkOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = watermarkOpacity;
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(watermarkText, stripWidth - 10, totalHeight - 6);
        ctx.restore();
      }

      ctx.restore(); // restore scale transform
      resolve(canvas.toDataURL('image/png', 1.0));
    }
  });
}

// ============================================================
//  THEME CONFIG  — text color, photo border, decorations
// ============================================================
const THEME_CONFIG = {
  anime_sakura: {
    textColor: '#7A1C43',
    photoBorder: 'rgba(255,183,197,0.7)',
    photoRadius: 5,
    emptySlot: 'rgba(255,183,197,0.15)',
    corners: { tl: '🌸', tr: '🌙', bl: '🌺', br: '✨' },
    footerBrand: '✿ 桜 STUDIO ✿',
    headerStripe: { colors: ['#FFB7C5', '#FF94B2', '#FFB7C5'], height: 5 },
    footerStripe: { colors: ['#FFB7C5', '#FF94B2', '#FFB7C5'], height: 3 },
    headerEmojis: ['🌸', '🌺', '🌸', '🌺', '🌸', '🌺', '🌸'],
  },
  anime_chibi: {
    textColor: '#C71585',
    photoBorder: 'rgba(255,145,164,0.7)',
    photoRadius: 6,
    emptySlot: 'rgba(255,145,164,0.15)',
    corners: { tl: '🍡', tr: '✨', bl: '🎀', br: '🌸' },
    footerBrand: '✦ OTAKU ANIME STUDIO ✦',
    headerStripe: { colors: ['#FF91A4', '#FFB7C5', '#FF91A4'], height: 5 },
    footerStripe: { colors: ['#FF91A4', '#FFB7C5', '#FF91A4'], height: 3 },
    headerEmojis: ['🍡', '⛩️', '🎀', '🌸', '✨'],
  },
  hari_guru: {
    textColor: '#1B365D',
    photoBorder: 'rgba(74,144,226,0.6)',
    photoRadius: 4,
    emptySlot: 'rgba(74,144,226,0.12)',
    corners: { tl: '🎓', tr: '📚', bl: '✏️', br: '🌟' },
    footerBrand: '🎓 SELAMAT HARI GURU & DIES NATALIS 🎓',
    headerStripe: { colors: ['#4A90E2', '#1B365D', '#4A90E2'], height: 5 },
    footerStripe: { colors: ['#4A90E2', '#1B365D', '#4A90E2'], height: 3 },
    headerEmojis: ['🎓', '📚', '✏️', '🏫', '🌟'],
  },
  birthday_bash: {
    textColor: '#E65100',
    photoBorder: 'rgba(255,179,0,0.7)',
    photoRadius: 6,
    emptySlot: 'rgba(255,179,0,0.15)',
    corners: { tl: '🎂', tr: '🎈', bl: '🎉', br: '🎁' },
    footerBrand: '🎉 HAPPY BIRTHDAY PARTY 🎂',
    headerStripe: { colors: ['#FFB300', '#E65100', '#FFB300'], height: 5 },
    footerStripe: { colors: ['#FFB300', '#E65100', '#FFB300'], height: 3 },
    headerEmojis: ['🎂', '🎈', '🎉', '🎁', '🥳'],
  },
  anime_cyber: {
    textColor: '#00FFFF',
    photoBorder: 'rgba(0,255,255,0.4)',
    photoRadius: 2,
    emptySlot: 'rgba(0,255,255,0.05)',
    corners: { tl: '⚡', tr: '🔮', bl: '🍥', br: '⚡' },
    footerBrand: '■ CYBER_STUDIO v2.0 ■',
    innerBorder: { color: '#00FFFF', lineWidth: 3 },
    headerBar: { text: '▸▸ CYBER_STUDIO v2.0 ◂◂', color: '#00FFFF', font: '700 13px monospace' },
    scanlines: true,
  },
  anime_neko: {
    textColor: '#8C3D2B',
    photoBorder: 'rgba(255,181,160,0.6)',
    photoRadius: 8,
    emptySlot: 'rgba(255,181,160,0.15)',
    corners: { tl: '🐾', tr: '🐱', bl: '🐾', br: '🐱' },
    footerBrand: '🐾 NEKO PHOTO STUDIO 🐱',
    headerEmojis: ['🐾', '🐱', '🐾', '🐱', '🐾'],
    headerStripe: { striped: true, c1: '#FFB5A0', c2: '#FFF5EB', height: 4 },
  },
  anime_goth: {
    textColor: '#DDA0DD',
    photoBorder: 'rgba(221,160,221,0.35)',
    photoRadius: 2,
    emptySlot: 'rgba(221,160,221,0.05)',
    corners: { tl: '🖤', tr: '🔮', bl: '✝️', br: '🦋' },
    footerBrand: '◆◇ DARK LOLITA ◇◆',
    headerLace: true,
    footerLace: true,
    headerChars: '✦✧✦✧✦✧✦✧✦',
    footerChars: '◆◇◆◇◆◇◆',
  },
  citypop_90s: {
    textColor: '#FFFFFF',
    photoBorder: 'rgba(0,191,255,0.5)',
    photoRadius: 2,
    emptySlot: 'rgba(255,255,255,0.08)',
    corners: { tl: '🌊', tr: '🎧', bl: '🌴', br: '🎵' },
    footerBrand: '🌊 CITY POP 90s 🎧',
    headerStripe: { multicolor: ['#FF006E', '#00B4D8', '#FFBE0B', '#8338EC'], height: 6 },
    headerYear: '1988',
  },
  boba_taro: {
    textColor: '#4A255B',
    photoBorder: 'rgba(205,180,219,0.7)',
    photoRadius: 10,
    emptySlot: 'rgba(205,180,219,0.2)',
    corners: { tl: '🧋', tr: '🍡', bl: '🍮', br: '💜' },
    footerBrand: '♡ BOBA & CHILL ♡',
    headerBoba: true,
  },
  coquette_pink: {
    textColor: '#9B2335',
    photoBorder: 'rgba(255,182,193,0.7)',
    photoRadius: 4,
    emptySlot: 'rgba(255,182,193,0.15)',
    corners: { tl: '🎀', tr: '💖', bl: '🎀', br: '🌹' },
    footerBrand: 'with love & ribbons 🎀',
    headerEmojis: ['🎀', '🌹', '💖', '🌹', '🎀'],
    headerLacePink: true,
    footerLacePink: true,
  },
  cloud_dream: {
    textColor: '#4A5568',
    photoBorder: 'rgba(184,200,255,0.6)',
    photoRadius: 7,
    emptySlot: 'rgba(184,200,255,0.15)',
    corners: { tl: '☁️', tr: '🌈', bl: '✨', br: '🌟' },
    footerBrand: '☁️ CLOUD DREAM 🌈',
    headerEmojis: ['☁️', '🌈', '☁️', '✨', '☁️', '🌟', '☁️'],
    headerStripe: { colors: ['#B8C8FF', '#E0C3FC', '#8EC5FC', '#E0C3FC', '#B8C8FF'], height: 3 },
  },
  gothic_star: {
    textColor: '#C8A2C8',
    photoBorder: 'rgba(200,162,200,0.3)',
    photoRadius: 2,
    emptySlot: 'rgba(200,162,200,0.07)',
    corners: { tl: '✦', tr: '✧', bl: '✧', br: '✦' },
    footerBrand: '✦ MIDNIGHT STUDIO ✦',
    headerStars: ['✦', '✧', '★', '✦', '✧', '★', '✦', '✧'],
    headerDivider: { color: '#C8A2C8', accent: '#FFD700' },
  },
  y2k_silver: {
    textColor: '#1A2332',
    photoBorder: 'rgba(192,192,192,0.8)',
    photoRadius: 2,
    emptySlot: 'rgba(0,0,0,0.06)',
    corners: { tl: '💿', tr: '⭐', bl: '💎', br: '🔥' },
    footerBrand: '💿 Y2K CHROME 2000 🔥',
    headerChrome: true,
  },
  matcha_cream: {
    textColor: '#2D5016',
    photoBorder: 'rgba(91,138,60,0.5)',
    photoRadius: 3,
    emptySlot: 'rgba(91,138,60,0.08)',
    corners: { tl: '🍵', tr: '🌿', bl: '🍃', br: '🌱' },
    footerBrand: '🍵 MATCHA CAFÉ 🌿',
    headerEmojis: ['🍵', '🌿', '🍃', '🌱', '🍵'],
    headerWave: { color: '#5B8A3C' },
  },
  butter_bear: {
    textColor: '#6B4E2D',
    photoBorder: 'rgba(244,196,48,0.5)',
    photoRadius: 7,
    emptySlot: 'rgba(244,196,48,0.1)',
    corners: { tl: '🧸', tr: '🌼', bl: '🍯', br: '🌻' },
    footerBrand: '🧸 BUTTER BEAR 🌼',
    headerEmojis: ['🧸', '🌼', '🍯', '🌻', '🧸'],
    headerStripe: { striped: true, c1: '#F4C430', c2: '#FFF1C5', height: 5 },
  },
  haru_white: {
    textColor: '#121212',
    photoBorder: 'rgba(0,0,0,0.12)',
    photoRadius: 2,
    emptySlot: 'rgba(0,0,0,0.05)',
    corners: null,
    footerBrand: 'LIFE 4 CUTS • STUDIO EDITION',
    headerClean: true,
  },
  photomatic_black: {
    textColor: '#FFFFFF',
    photoBorder: 'rgba(255,255,255,0.12)',
    photoRadius: 2,
    emptySlot: 'rgba(255,255,255,0.06)',
    corners: null,
    footerBrand: '📸 PHOTOMATIC STUDIO',
  },
  film_roll: {
    textColor: '#FFFFFF',
    photoBorder: 'rgba(255,204,0,0.25)',
    photoRadius: 1,
    emptySlot: 'rgba(255,255,255,0.05)',
    corners: null,
    footerBrand: '🎞️ LIFE 4 CUTS FILM',
  },
};

// ============================================================
//  BACKGROUND DRAWING
// ============================================================
function drawFrameBackground(ctx, w, h, theme, cfg, customFrameColor = null) {
  if (theme === 'custom_color' && customFrameColor) {
    ctx.fillStyle = customFrameColor;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const BACKGROUNDS = {
    anime_sakura:    () => fillLinear(ctx, w, h, 160, ['#FFF0F5', '#FFE4EC', '#FFD6E7', '#FFBCD9']),
    anime_cyber:     () => {
      fillLinear(ctx, w, h, 160, ['#0A001F', '#160830', '#01111D']);
      // Scanline overlay
      ctx.save();
      for (let y = 0; y < h; y += 4) {
        ctx.fillStyle = 'rgba(0,255,255,0.025)';
        ctx.fillRect(0, y + 3, w, 1);
      }
      ctx.restore();
      // Inner cyan border
      ctx.save();
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.restore();
    },
    anime_neko:      () => fillLinear(ctx, w, h, 160, ['#FFF9F5', '#FFF0E8', '#FFE5D8']),
    anime_goth:      () => fillLinear(ctx, w, h, 160, ['#1A0B2E', '#0F0620', '#090312']),
    citypop_90s:     () => {
      fillLinear(ctx, w, h, 160, ['#005F73', '#0A9396', '#1D4E89']);
      // Diagonal hatching overlay
      ctx.save();
      ctx.strokeStyle = 'rgba(0,180,216,0.06)';
      ctx.lineWidth = 1;
      for (let i = -h; i < w + h; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i + h, h);
        ctx.stroke();
      }
      ctx.restore();
    },
    boba_taro:       () => fillLinear(ctx, w, h, 160, ['#E6D7FF', '#CDB4DB', '#BFAED4']),
    coquette_pink:   () => fillLinear(ctx, w, h, 160, ['#FFF0F3', '#FFD6E0', '#FFBDD1']),
    cloud_dream:     () => fillLinear(ctx, w, h, 160, ['#E8F4FD', '#D4E8FC', '#C8D8F8', '#D4C8F8']),
    gothic_star:     () => fillLinear(ctx, w, h, 160, ['#0D1117', '#141A26', '#0F172A']),
    y2k_silver:      () => {
      fillLinear(ctx, w, h, 160, ['#E8EDF2', '#D0D8E4', '#C0CBD8']);
      // Diagonal shimmer lines
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      for (let i = -h; i < w + h; i += 7) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i + h, h);
        ctx.stroke();
      }
      ctx.restore();
    },
    matcha_cream:    () => fillLinear(ctx, w, h, 160, ['#E8F0E0', '#D4E2C8', '#C4D4B0']),
    butter_bear:     () => fillLinear(ctx, w, h, 160, ['#FFFDE7', '#FFF8C5', '#FFF1C5']),
    haru_white:      () => fillLinear(ctx, w, h, 160, ['#FDFDFD', '#F8F8F8', '#F5F5F5']),
    photomatic_black: () => fillLinear(ctx, w, h, 160, ['#1A1A1A', '#111111', '#0A0A0A']),
    film_roll:       () => {
      fillLinear(ctx, w, h, 160, ['#1C1C1C', '#141414', '#0E0E0E']);
      // Vertical scan lines
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.018)';
      for (let x = 0; x < w; x += 4) { ctx.fillRect(x, 0, 1, h); }
      ctx.restore();
    },
  };
  const fn = BACKGROUNDS[theme];
  if (fn) fn();
  else { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h); }
}

function fillLinear(ctx, w, h, angle, stops) {
  const rad = (angle * Math.PI) / 180;
  const len = Math.sqrt(w * w + h * h);
  const cx = w / 2, cy = h / 2;
  const x0 = cx - Math.cos(rad) * len / 2;
  const y0 = cy - Math.sin(rad) * len / 2;
  const x1 = cx + Math.cos(rad) * len / 2;
  const y1 = cy + Math.sin(rad) * len / 2;
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ============================================================
//  HEADER DECORATION
// ============================================================
function drawHeaderDecoration(ctx, stripWidth, theme, cfg) {
  const decoH = 70;  // total header deco area height (above title)
  const cx = stripWidth / 2;

  // ─ Emoji row
  if (cfg.headerEmojis) {
    const emojis = cfg.headerEmojis;
    const totalW = (emojis.length - 1) * 30;
    const startX = cx - totalW / 2;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    emojis.forEach((e, i) => ctx.fillText(e, startX + i * 30, 24));
  }

  // ─ Stripe (gradient or striped)
  if (cfg.headerStripe) {
    const s = cfg.headerStripe;
    const y = cfg.headerEmojis ? 40 : 20;
    if (s.multicolor) {
      const segW = stripWidth / s.multicolor.length;
      s.multicolor.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(i * segW, y, segW, s.height);
      });
    } else if (s.striped) {
      const stripeW = 16;
      for (let x = 0; x < stripWidth; x += stripeW * 2) {
        ctx.fillStyle = s.c1; ctx.fillRect(x, y, stripeW, s.height);
        ctx.fillStyle = s.c2; ctx.fillRect(x + stripeW, y, stripeW, s.height);
      }
    } else {
      const sGrad = ctx.createLinearGradient(0, 0, stripWidth, 0);
      s.colors.forEach((c, i) => sGrad.addColorStop(i / (s.colors.length - 1), c));
      ctx.fillStyle = sGrad;
      ctx.fillRect(0, y, stripWidth, s.height);
    }
  }

  // ─ Cyber header bar
  if (cfg.headerBar) {
    const bar = cfg.headerBar;
    // Glowing lines
    drawGlowLine(ctx, 0, 14, stripWidth, 14, '#00FFFF', 2, 0.8);
    drawGlowLine(ctx, 0, 18, stripWidth, 18, '#7B2FBE', 1, 0.6);
    // Text
    ctx.save();
    ctx.fillStyle = bar.color;
    ctx.font = bar.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bar.text, stripWidth / 2, 32);
    // Corner brackets
    drawBracket(ctx, 6, 6, 16, 16, '#00FFFF', 2);
    drawBracket(ctx, stripWidth - 6, 6, -16, 16, '#00FFFF', 2);
    ctx.restore();
  }

  // ─ Lace decorations (goth)
  if (cfg.headerLace) {
    drawLace(ctx, 0, 0, stripWidth, 10, 'rgba(221,160,221,0.6)');
    ctx.save();
    ctx.fillStyle = '#DDA0DD';
    ctx.font = '700 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.headerChars || '✦✧✦✧✦✧✦✧✦', cx, 28);
    ctx.restore();
  }

  // ─ Pink lace (coquette)
  if (cfg.headerLacePink) {
    drawLace(ctx, 0, 0, stripWidth, 8, '#FFB6C1');
    if (cfg.headerEmojis) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      const emojis = cfg.headerEmojis;
      const totalW = (emojis.length - 1) * 32;
      const startX = cx - totalW / 2;
      emojis.forEach((e, i) => ctx.fillText(e, startX + i * 32, 26));
    }
  }

  // ─ Star scatter (gothic_star)
  if (cfg.headerStars) {
    const stars = cfg.headerStars;
    const starColors = ['#C8A2C8', '#E8D5E8', '#FFD700', '#DDA0DD'];
    const sizes = [0.7, 0.6, 0.9, 0.7, 0.6, 0.8, 0.7, 0.6];
    ctx.textBaseline = 'middle';
    stars.forEach((s, i) => {
      const x = 20 + i * ((stripWidth - 40) / (stars.length - 1));
      ctx.font = `${Math.round(14 * sizes[i % sizes.length])}px sans-serif`;
      ctx.fillStyle = starColors[i % starColors.length];
      ctx.textAlign = 'center';
      ctx.fillText(s, x, 22);
    });
    // Divider line
    const dGrad = ctx.createLinearGradient(0, 36, stripWidth, 36);
    dGrad.addColorStop(0, 'transparent');
    dGrad.addColorStop(0.3, '#C8A2C8');
    dGrad.addColorStop(0.7, '#FFD700');
    dGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = dGrad;
    ctx.fillRect(0, 36, stripWidth, 1);
  }

  // ─ Y2K Chrome bar
  if (cfg.headerChrome) {
    // Chrome gradient bar
    const chromGrad = ctx.createLinearGradient(0, 0, 0, 8);
    chromGrad.addColorStop(0, '#E8E8E8');
    chromGrad.addColorStop(0.4, '#C0C0C0');
    chromGrad.addColorStop(0.6, '#888888');
    chromGrad.addColorStop(1, '#D8D8D8');
    ctx.fillStyle = chromGrad;
    ctx.fillRect(0, 0, stripWidth, 8);
    // Chrome dots row
    const dotCount = 5;
    const dotR = 5;
    const dotSpacing = 20;
    const dotsStartX = cx - ((dotCount - 1) * dotSpacing) / 2;
    for (let i = 0; i < dotCount; i++) {
      const dx = dotsStartX + i * dotSpacing;
      const radGrad = ctx.createRadialGradient(dx - 2, 22, 1, dx, 24, dotR);
      radGrad.addColorStop(0, '#F0F0F0');
      radGrad.addColorStop(1, '#888');
      ctx.fillStyle = radGrad;
      ctx.beginPath(); ctx.arc(dx, 24, dotR, 0, Math.PI * 2); ctx.fill();
    }
    // Y2K and 2000 labels
    ctx.save();
    ctx.fillStyle = '#1A2332';
    ctx.font = '800 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Y2K', 12, 28);
    ctx.textAlign = 'right';
    ctx.fillText('2000', stripWidth - 12, 28);
    ctx.restore();
  }

  // ─ Matcha wave
  if (cfg.headerWave) {
    drawWave(ctx, 0, 0, stripWidth, cfg.headerWave.color);
    if (cfg.headerEmojis) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      const emojis = cfg.headerEmojis;
      const totalW = (emojis.length - 1) * 30;
      const startX = cx - totalW / 2;
      emojis.forEach((e, i) => ctx.fillText(e, startX + i * 30, 24));
    }
  }

  // ─ Boba dots row
  if (cfg.headerBoba) {
    const bobaColors = ['#CDB4DB', '#FFAFCC', '#BDE0FE', '#A2D2FF', '#CDB4DB', '#FFAFCC', '#BDE0FE', '#A2D2FF', '#CDB4DB'];
    const dotR = 7;
    const spacing = stripWidth / (bobaColors.length + 1);
    bobaColors.forEach((c, i) => {
      const dx = spacing * (i + 1);
      ctx.fillStyle = c;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(dx, 20, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.save();
    ctx.fillStyle = '#9B59B6';
    ctx.font = '700 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♡ BOBA & CHILL ♡', cx, 40);
    ctx.restore();
  }

  // ─ Clean Haru separator line
  if (cfg.headerClean) {
    const lineGrad = ctx.createLinearGradient(0, 0, stripWidth, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, '#DDDDDD');
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, 14, stripWidth, 1);
    ctx.save();
    ctx.fillStyle = '#999';
    ctx.font = '600 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('─ PREMIUM STUDIO ─', cx, 28);
    ctx.restore();
  }
}

// ============================================================
//  FOOTER DECORATION
// ============================================================
function drawFooterDecoration(ctx, stripWidth, totalHeight, theme, cfg) {
  const footerTopY = totalHeight - (cfg.showQrCode ? 190 : 140);

  if (cfg.footerStripe) {
    const s = cfg.footerStripe;
    const sGrad = ctx.createLinearGradient(0, 0, stripWidth, 0);
    s.colors.forEach((c, i) => sGrad.addColorStop(i / (s.colors.length - 1), c));
    ctx.fillStyle = sGrad;
    ctx.fillRect(0, footerTopY + 4, stripWidth, s.height);
  }

  if (cfg.footerLace) {
    drawLace(ctx, 0, footerTopY + 2, stripWidth, 10, 'rgba(221,160,221,0.6)');
    ctx.save();
    ctx.fillStyle = '#DDA0DD';
    ctx.font = '700 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.footerChars || '◆◇◆◇◆◇◆', stripWidth / 2, footerTopY + 20);
    ctx.restore();
  }

  if (cfg.footerLacePink) {
    drawLace(ctx, 0, footerTopY + 2, stripWidth, 8, '#FFB6C1');
    ctx.save();
    ctx.fillStyle = '#9B2335';
    ctx.font = `italic 500 11px "Pacifico", cursive`;
    ctx.textAlign = 'center';
    ctx.fillText('with love & ribbons 🎀', stripWidth / 2, footerTopY + 18);
    ctx.restore();
  }
}

// ============================================================
//  CORNER EMOJI MOTIFS
// ============================================================
function drawCornerMotifs(ctx, w, h, corners) {
  ctx.save();
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.88;
  ctx.fillText(corners.tl, 28, 70);
  ctx.fillText(corners.tr, w - 28, 70);
  ctx.fillText(corners.bl, 28, h - 36);
  ctx.fillText(corners.br, w - 28, h - 36);
  ctx.restore();
}

// ============================================================
//  HELPER DRAWING UTILITIES
// ============================================================
function drawGlowLine(ctx, x1, y1, x2, y2, color, width, alpha) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawBracket(ctx, x, y, dw, dh, color, lw) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x + dw, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dh);
  ctx.stroke();
  ctx.restore();
}

function drawLace(ctx, x, y, width, height, color) {
  const segW = 8;
  ctx.save();
  ctx.fillStyle = color;
  for (let i = x; i < x + width; i += segW) {
    ctx.fillRect(i, y, segW * 0.4, height);
    ctx.fillRect(i + segW * 0.6, y, segW * 0.2, height);
  }
  ctx.restore();
}

function drawWave(ctx, x, y, width, color) {
  const segments = 20;
  const segW = width / segments;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  for (let i = 0; i < segments; i++) {
    const px = x + i * segW;
    if (i % 2 === 0) {
      ctx.lineTo(px + segW * 0.5, y);
      ctx.lineTo(px + segW, y + 6);
    } else {
      ctx.lineTo(px + segW * 0.5, y + 6);
      ctx.lineTo(px + segW, y);
    }
  }
  ctx.lineTo(x + width, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================================
//  SPROCKET HOLES  (film_roll layout / theme)
// ============================================================
function drawSprocketHoles(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = '#050505';
  const hW = 12, hH = 18, gap = 28;
  for (let y = 20; y < height - 20; y += gap) {
    ctx.beginPath(); roundedRect(ctx, 10, y, hW, hH, 3); ctx.fill();
    ctx.beginPath(); roundedRect(ctx, width - 10 - hW, y, hW, hH, 3); ctx.fill();
  }
  ctx.restore();
}

// ============================================================
//  LED TIMESTAMP
// ============================================================
function drawLedTimestamp(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#FF9D00';
  ctx.shadowColor = '#FF6B00'; ctx.shadowBlur = 8;
  ctx.font = 'bold 15px "Space Grotesk", monospace';
  ctx.textAlign = 'right';
  const now = new Date();
  const ts = `'${String(now.getFullYear()).slice(-2)} ${String(now.getMonth()+1).padStart(2,'0')} ${String(now.getDate()).padStart(2,'0')}`;
  ctx.fillText(ts, x + w - 14, y + h - 14);
  ctx.restore();
}

// ============================================================
//  FILM GRAIN
// ============================================================
function drawFilmGrain(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let gx = x; gx < x + w; gx += 4) {
    for (let gy = y; gy < y + h; gy += 4) {
      if (Math.random() > 0.5) ctx.fillRect(gx, gy, 2, 2);
    }
  }
  ctx.restore();
}

// ============================================================
//  CANVAS PHOTO FILTERS
// ============================================================
function applyCanvasFilter(ctx, filterName, scale = 1.0) {
  const FILTERS = {
    haru_soft:       'brightness(108%) contrast(98%) saturate(110%) hue-rotate(5deg)',
    photomatic_mono: 'grayscale(100%) contrast(135%) brightness(102%)',
    retro35mm:       'sepia(35%) contrast(110%) saturate(115%) hue-rotate(-12deg) brightness(98%)',
    pastel_glow:     'saturate(125%) contrast(102%) hue-rotate(335deg) brightness(106%)',
    cinematic_mood:  'contrast(120%) saturate(115%) hue-rotate(10deg) brightness(96%)',
    y2k_flash:       'contrast(130%) saturate(140%) brightness(110%)',
  };
  let filterStr = FILTERS[filterName] || '';

  // Apply crispness & edge contrast boost for high DPI rendering (600 DPI / 1200 DPI)
  if (scale >= 4.0) {
    filterStr = (filterStr ? filterStr + ' ' : '') + 'contrast(106%) saturate(104%) brightness(101%)';
  } else if (scale >= 2.0) {
    filterStr = (filterStr ? filterStr + ' ' : '') + 'contrast(103%) saturate(102%)';
  }

  ctx.filter = filterStr || 'none';
}

// ============================================================
//  COVER-FIT IMAGE DRAW
// ============================================================
function drawCoverImage(ctx, img, x, y, tw, th) {
  const ir = img.width / img.height;
  const tr = tw / th;
  let sw, sh, sx, sy;
  if (ir > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw)/2; sy = 0; }
  else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh)/2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, tw, th);
}

// ============================================================
//  DOODLE PATHS
// ============================================================
function drawDoodlePaths(ctx, paths) {
  ctx.save();
  paths.forEach(path => {
    if (!path.points || path.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.size * 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
  });
  ctx.restore();
}

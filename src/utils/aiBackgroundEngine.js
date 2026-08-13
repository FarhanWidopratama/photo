// ============================================================
//  Life4Cuts — AI Background Swap & AI Neural Style Engine
//  Renders real-time AI scenic backgrounds & AI art transformations
// ============================================================

/**
 * Helper to scale & crop image into canvas box with cover aspect ratio
 */
export function drawCoverImage(ctx, img, targetWidth, targetHeight) {
  const imgRatio = img.width / img.height;
  const targetRatio = targetWidth / targetHeight;
  let sw, sh, sx, sy;

  if (imgRatio > targetRatio) {
    sh = img.height;
    sw = sh * targetRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
}

/**
 * Draws custom scenic AI background artwork or custom uploaded image on canvas
 */
export function drawAiBackgroundScene(ctx, width, height, bgId, customBgImgElement = null) {
  if (!bgId || bgId === 'none') return;

  ctx.save();

  // If user uploaded a custom background image
  if (bgId === 'custom' && customBgImgElement) {
    drawCoverImage(ctx, customBgImgElement, width, height);
    ctx.restore();
    return;
  }

  if (bgId === 'japan_sakura') {
    // 🌸 Tokyo Sakura Street Sunset
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#FFA07A');
    grad.addColorStop(0.4, '#FFB7C5');
    grad.addColorStop(1, '#E85D75');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = '#FFB7C5';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.3, Math.min(width, height) * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Torii Gate silhouette
    ctx.fillStyle = 'rgba(120, 20, 40, 0.75)';
    const tw = width * 0.35, th = height * 0.32;
    const tx = width * 0.5 - tw / 2, ty = height * 0.65;
    ctx.fillRect(tx, ty, tw, th * 0.12);
    ctx.fillRect(tx + tw * 0.08, ty + th * 0.12, tw * 0.84, th * 0.08);
    ctx.fillRect(tx + tw * 0.15, ty, tw * 0.08, th);
    ctx.fillRect(tx + tw * 0.77, ty, tw * 0.08, th);

    // Falling Sakura Petals
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 25; i++) {
      const px = ((i * 47) % width);
      const py = ((i * 31) % height);
      ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
      ctx.beginPath();
      ctx.ellipse(px, py, 6, 3, (i * 30 * Math.PI) / 180, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  else if (bgId === 'paris_eiffel') {
    // 🗼 Paris Sunset Eiffel Tower
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#FF4E50');
    grad.addColorStop(0.5, '#F9D423');
    grad.addColorStop(1, '#6B11FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(20, 10, 35, 0.8)';
    const ex = width * 0.5, ey = height * 0.2, ew = width * 0.28, eh = height * 0.7;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ew * 0.15, ey + eh * 0.4);
    ctx.lineTo(ex + ew * 0.15, ey + eh * 0.4);
    ctx.closePath(); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(ex - ew * 0.15, ey + eh * 0.4);
    ctx.lineTo(ex - ew * 0.45, ey + eh);
    ctx.lineTo(ex - ew * 0.25, ey + eh);
    ctx.lineTo(ex - ew * 0.08, ey + eh * 0.4);
    ctx.closePath(); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(ex + ew * 0.15, ey + eh * 0.4);
    ctx.lineTo(ex + ew * 0.45, ey + eh);
    ctx.lineTo(ex + ew * 0.25, ey + eh);
    ctx.lineTo(ex + ew * 0.08, ey + eh * 0.4);
    ctx.closePath(); ctx.fill();
  }
  else if (bgId === 'bali_beach') {
    // 🏖️ Bali Beach Sunset
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#FF512F');
    grad.addColorStop(0.5, '#F09819');
    grad.addColorStop(1, '#1A2980');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const oceanGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
    oceanGrad.addColorStop(0, '#1A2980');
    oceanGrad.addColorStop(1, '#26D0CE');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    ctx.fillStyle = 'rgba(15, 25, 15, 0.85)';
    ctx.beginPath();
    ctx.arc(width * 0.15, height * 0.25, width * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  else if (bgId === 'cyberpunk_city') {
    // ⚡️ Cyberpunk 2077 Neon City
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0F051D');
    grad.addColorStop(0.5, '#290A45');
    grad.addColorStop(1, '#00F2FE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const buildingWidths = [0.15, 0.2, 0.12, 0.18, 0.25];
    let curX = 0;
    buildingWidths.forEach((bw, i) => {
      const w = width * bw;
      const h = height * (0.4 + (i % 3) * 0.15);
      const y = height - h;
      ctx.fillStyle = '#080214';
      ctx.fillRect(curX, y, w, h);

      ctx.fillStyle = i % 2 === 0 ? '#00FFFF' : '#FF007F';
      for (let wx = curX + 6; wx < curX + w - 6; wx += 12) {
        for (let wy = y + 10; wy < height - 10; wy += 20) {
          if ((wx + wy) % 5 === 0) {
            ctx.fillRect(wx, wy, 4, 8);
          }
        }
      }
      curX += w;
    });

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    for (let lx = 0; lx < width; lx += 30) {
      ctx.beginPath();
      ctx.moveTo(lx, height * 0.75);
      ctx.lineTo(lx, height);
      ctx.stroke();
    }
  }
  else if (bgId === 'outer_space') {
    // 🌌 Galaxy Space Nebula
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#05021A');
    grad.addColorStop(0.5, '#190A38');
    grad.addColorStop(1, '#021B2B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 73) % width);
      const sy = ((i * 41) % height);
      const r = (i % 3) + 1;
      ctx.globalAlpha = 0.5 + (i % 4) * 0.12;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.9;
    const px = width * 0.8, py = height * 0.25, pr = Math.min(width, height) * 0.12;
    const pGrad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 2, px, py, pr);
    pGrad.addColorStop(0, '#FFD15C');
    pGrad.addColorStop(1, '#FF6584');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 209, 92, 0.7)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(px, py, pr * 1.8, pr * 0.5, -0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
  else if (bgId === 'hogwarts_magic') {
    // 🏰 Magic Castle Fantasy
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1A0B2E');
    grad.addColorStop(0.6, '#3A1C71');
    grad.addColorStop(1, '#090312');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 30; i++) {
      const mx = ((i * 59) % width);
      const my = ((i * 37) % height);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(mx, my, (i % 3) + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  else if (bgId === 'kpop_concert') {
    // 🎤 K-Pop Concert Stage
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#7B2FBE');
    grad.addColorStop(0.5, '#FF1493');
    grad.addColorStop(1, '#0F051D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Spotlight beams
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.moveTo(width * 0.2, 0); ctx.lineTo(width * 0.05, height); ctx.lineTo(width * 0.4, height);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(width * 0.8, 0); ctx.lineTo(width * 0.6, height); ctx.lineTo(width * 0.95, height);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  else if (bgId === 'kyoto_bamboo') {
    // 🎋 Kyoto Bamboo Forest
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1B4D3E');
    grad.addColorStop(0.5, '#2D5016');
    grad.addColorStop(1, '#0B231A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Bamboo stalks
    ctx.fillStyle = 'rgba(91, 138, 60, 0.4)';
    for (let x = 10; x < width; x += 36) {
      ctx.fillRect(x, 0, 14, height);
    }
  }
  else if (bgId === 'retro_arcade') {
    // 👾 80s Synthwave Arcade
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#2D124D');
    grad.addColorStop(0.5, '#FF007F');
    grad.addColorStop(1, '#0B0418');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Sun grid
    const sunGrad = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.65);
    sunGrad.addColorStop(0, '#FFD15C');
    sunGrad.addColorStop(1, '#FF007F');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.5, width * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
  else if (bgId === 'seoul_street') {
    // 🇰🇷 Hongdae Night Street
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0F0A1C');
    grad.addColorStop(0.5, '#1F1138');
    grad.addColorStop(1, '#05020D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Neon signs glow
    ctx.fillStyle = 'rgba(255, 101, 132, 0.15)';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

/**
 * Returns CSS filter string for AI Style Transformation (Ghibli, Pixar, Comic, etc.)
 */
export function getAiStyleCssFilter(styleId) {
  if (!styleId || styleId === 'none') return '';

  switch (styleId) {
    case 'ghibli_anime':
      return 'saturate(145%) contrast(112%) brightness(108%) sepia(12%) hue-rotate(-5deg)';
    case 'pixar_3d':
      return 'brightness(115%) contrast(128%) saturate(165%)';
    case 'superhero_comic':
      return 'contrast(165%) saturate(185%) brightness(105%)';
    case 'watercolor_dream':
      return 'saturate(135%) brightness(112%) contrast(96%) hue-rotate(10deg)';
    case 'cyberpunk_glow':
      return 'contrast(145%) saturate(195%) hue-rotate(175deg) brightness(110%)';
    default:
      return '';
  }
}

/**
 * Renders segmented user on top of AI Background on canvas
 */
export function renderSegmentedUserOnCanvas(ctx, video, mask, w, h, isMirrored) {
  if (mask) {
    // Neural MediaPipe Selfie Segmentation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');

    if (isMirrored) {
      tempCtx.translate(w, 0);
      tempCtx.scale(-1, 1);
    }
    tempCtx.drawImage(video, 0, 0, w, h);

    // Keep subject, erase background with smooth edge feathering
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.filter = 'blur(1.2px) contrast(110%)';
    tempCtx.drawImage(mask, 0, 0, w, h);
    tempCtx.filter = 'none';

    ctx.save();
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
  } else {
    // Smart Portrait Vignette Mask Fallback (100% instant rendering)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');

    if (isMirrored) {
      tempCtx.translate(w, 0);
      tempCtx.scale(-1, 1);
    }
    tempCtx.drawImage(video, 0, 0, w, h);

    // Oval mask focusing on subject
    tempCtx.globalCompositeOperation = 'destination-in';
    const grad = tempCtx.createRadialGradient(
      w / 2, h * 0.5, w * 0.15,
      w / 2, h * 0.5, w * 0.48
    );
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    tempCtx.fillStyle = grad;
    tempCtx.fillRect(0, 0, w, h);

    ctx.drawImage(tempCanvas, 0, 0);
  }
}

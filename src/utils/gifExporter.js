import gifshot from 'gifshot';
import { drawPhotoStripToCanvas } from './canvasExporter';
import { getLayoutSlotCount } from '../config/layouts';

/**
 * Generate an Animated GIF where each frame shows the full photo strip
 * progressively revealing photos 1→2→3→…N, then all together.
 * Frame count follows the layout's slot count (2/3/4 slots).
 */
export function generateAnimatedGif(options) {
  const {
    photos = [],
    layout = 'strip1x4',
    frameTheme = 'haru_white',
    filter = 'haru_soft',
    showGrain = true,
    showLedDate = true,
    titleText = 'LIFE 4 CUTS 📸',
    fontStyle = 'default',
    sticker = null,
    doodlePaths = [],
    watermarkText = null,
    watermarkOpacity = 0.4,
    customBgDataUrl = null,
    customFrameUrl = null,
    customFrameColor = null,
    placedStickers = [],
    placedCaptions = [],
    placedImages = [],
  } = options;

  return new Promise(async (resolve, reject) => {
    const realPhotos = (photos || []).filter(Boolean);
    if (realPhotos.length === 0) {
      return reject(new Error('Tidak ada foto untuk membuat GIF.'));
    }

    const slots = getLayoutSlotCount(layout);

    try {
      const canvas = document.createElement('canvas');
      const frameDataUrls = [];

      // Progressive reveal: photo 1, photos 1-2, … all slots filled.
      // Missing slots are rendered as empty placeholders by the exporter.
      for (let i = 0; i < slots; i++) {
        const progressivePhotos = Array.from({ length: slots }, (_, idx) =>
          idx <= i ? realPhotos[idx] : null
        );

        const frameUrl = await drawPhotoStripToCanvas(canvas, {
          photos: progressivePhotos,
          layout,
          frameTheme,
          filter,
          showGrain,
          showLedDate,
          titleText,
          fontStyle,
          sticker: null, // Skip sticker in GIF frames for cleaner look
          doodlePaths: [], // Skip doodles in GIF for performance
          watermarkText,
          watermarkOpacity,
          customBgDataUrl,
          customFrameUrl,
          customFrameColor,
          placedStickers,
          placedCaptions,
          placedImages,
        });
        frameDataUrls.push(frameUrl);
      }

      // Pause on the final strip (duplicate last frame twice)
      frameDataUrls.push(frameDataUrls[frameDataUrls.length - 1]);
      frameDataUrls.push(frameDataUrls[frameDataUrls.length - 1]);

      // Determine output dimensions from canvas
      const gifWidth = canvas.width > 800 ? Math.round(canvas.width / 2) : canvas.width;
      const gifHeight = canvas.height > 1600 ? Math.round(canvas.height / 2) : canvas.height;

      gifshot.createGIF(
        {
          images: frameDataUrls,
          gifWidth,
          gifHeight,
          interval: 0.55,    // 550ms per frame — reveal effect feels natural
          numFrames: frameDataUrls.length,
          sampleInterval: 10,
          numWorkers: 2
        },
        function (obj) {
          if (!obj.error) {
            resolve(obj.image);
          } else {
            console.error('GIF generation error:', obj.error);
            reject(new Error('Gagal membuat file GIF animasi.'));
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
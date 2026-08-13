import gifshot from 'gifshot';
import { drawPhotoStripToCanvas } from './canvasExporter';

/**
 * Generate an Animated GIF where each frame shows the full photo strip
 * progressively revealing photos 1→2→3→4, then all 4 together.
 * This makes the GIF look like a real studio photobooth result.
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
    doodlePaths = []
  } = options;

  return new Promise(async (resolve, reject) => {
    if (!photos || photos.length < 4) {
      return reject(new Error('Minimal 4 foto diperlukan untuk membuat GIF.'));
    }

    try {
      const canvas = document.createElement('canvas');
      const frameDataUrls = [];

      // Frame 1–4: Progressive reveal — photo 1, photos 1-2, photos 1-3, all 4
      for (let i = 0; i < 4; i++) {
        // Fill slots: show real photos up to index i, empty (gray placeholder) for the rest
        const progressivePhotos = Array.from({ length: 4 }, (_, idx) =>
          idx <= i ? photos[idx] : null
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
          doodlePaths: [] // Skip doodles in GIF for performance
        });
        frameDataUrls.push(frameUrl);
      }

      // Frame 5–6: Show all 4 photos twice (pause on final strip)
      frameDataUrls.push(frameDataUrls[3]);
      frameDataUrls.push(frameDataUrls[3]);

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

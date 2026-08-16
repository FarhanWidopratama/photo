import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Camera, FlipHorizontal, RefreshCw, Zap, Sparkles, Maximize, Minimize } from 'lucide-react';
import { playBeep, playShutterSound, speakCountdown, setSoundGlobal } from '../utils/soundEffects';
import { drawArPropToCanvas } from '../utils/aiFilters';
import { drawAiBackgroundScene, getAiStyleCssFilter, renderSegmentedUserOnCanvas } from '../utils/aiBackgroundEngine';
import { getLayoutSlotCount } from '../config/layouts';

const AI_BACKGROUND_LABELS = {
  japan_sakura: '🌸 Tokyo Sakura',
  paris_eiffel: '🗼 Paris Sunset',
  bali_beach: '🏖️ Bali Sunset',
  cyberpunk_city: '⚡ Cyberpunk 2077',
  outer_space: '🌌 Outer Space',
  hogwarts_magic: '🏰 Magic Castle',
};

const CameraView = forwardRef(function CameraView({
  photos,
  setPhotos,
  layout = 'strip1x4',
  activeFilter,
  activeOverlay,
  aiBackground = 'none',
  customBgDataUrl = null,
  aiStyle = 'none',
  aiOutfit = 'none',
  arProp = 'none',
  countdownDuration = 3,
  poseGapSeconds = 3,
  soundEnabled = true,
  onSessionComplete,
  stripPreviewNode
}, ref) {
  const videoRef = useRef(null);
  const liveCanvasRef = useRef(null);
  const maskRef = useRef(null);
  const customBgImgRef = useRef(null);
  const streamRef = useRef(null);
  const flashTimerRef = useRef(null);

  // Cleanup flash timer on unmount
  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  // Sync soundEnabled prop → global sound flag
  useEffect(() => {
    setSoundGlobal(soundEnabled);
  }, [soundEnabled]);

  // Load custom background image when customBgDataUrl changes
  useEffect(() => {
    if (customBgDataUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { customBgImgRef.current = img; };
      img.src = customBgDataUrl;
    } else {
      customBgImgRef.current = null;
    }
  }, [customBgDataUrl]);

  const [isMirrored, setIsMirrored] = useState(true);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Session capture states
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const [activeShotIndex, setActiveShotIndex] = useState(null);
  const [isPoseGap, setIsPoseGap] = useState(false);
  const [poseGapProgress, setPoseGapProgress] = useState(100);

  // ── Initialize webcam ─────────────────────────────────────
  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Browser kamu tidak mendukung akses kamera. Coba gunakan Chrome atau Edge terbaru.');
        return;
      }

      try {
        let userStream;
        try {
          userStream = await navigator.mediaDevices.getUserMedia({
            video: {
              aspectRatio: { ideal: 4 / 3 },
              width: { min: 1280, ideal: 1920, max: 2560 },
              height: { min: 960, ideal: 1440, max: 1920 },
              facingMode: 'user'
            },
            audio: false
          });
        } catch (e) {
          if (['OverconstrainedError', 'NotFoundError', 'NotReadableError'].includes(e.name)) {
            try {
              userStream = await navigator.mediaDevices.getUserMedia({
                video: {
                  aspectRatio: { ideal: 4 / 3 },
                  width: { ideal: 1280 },
                  height: { ideal: 960 },
                  facingMode: 'user'
                },
                audio: false
              });
            } catch {
              userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
          } else {
            throw e;
          }
        }

        streamRef.current = userStream;
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
          videoRef.current.muted = true;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          };
          await videoRef.current.play().catch((e) => {
            console.warn('Video play warning:', e);
          });
        }
        setCameraError(null);
      } catch (err) {
        console.error('Webcam error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Akses kamera ditolak. Izinkan kamera di ikon gembok / izin situs pada browser.');
        } else {
          setCameraError('Gagal mengakses kamera. Pastikan browser diizinkan mengakses webcam.');
        }
      }
    }

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ── MediaPipe Selfie Segmentation for AI Background Swap ─
  useEffect(() => {
    let animId;
    let selfieSegmentation = null;

    if (window.SelfieSegmentation && aiBackground && aiBackground !== 'none') {
      setIsAiProcessing(true);
      try {
        selfieSegmentation = new window.SelfieSegmentation({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        selfieSegmentation.setOptions({ modelSelection: 1 });
        selfieSegmentation.onResults((results) => {
          maskRef.current = results.segmentationMask;
          setIsAiProcessing(false);
        });

        const processFrame = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              await selfieSegmentation.send({ image: videoRef.current });
            } catch (e) {}
          }
          animId = requestAnimationFrame(processFrame);
        };
        processFrame();
      } catch (e) {
        console.warn('SelfieSegmentation init failed', e);
        setIsAiProcessing(false);
      }
    } else {
      maskRef.current = null;
      setIsAiProcessing(false);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (selfieSegmentation) {
        try { selfieSegmentation.close(); } catch (e) {}
      }
    };
  }, [aiBackground]);

  // ── Continuous Live Canvas Render Loop (30-60 FPS) ────────
  useEffect(() => {
    let animId;

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = liveCanvasRef.current;

      if (video && canvas) {
        // Wait until video has actual frame data
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          const w = video.videoWidth;
          const h = video.videoHeight;

          // Sync canvas size to video
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) {
            console.error('Failed to get canvas 2d context');
            animId = requestAnimationFrame(renderLoop);
            return;
          }

          // Draw video frame
          try {
            if (aiBackground && aiBackground !== 'none') {
              drawAiBackgroundScene(ctx, w, h, aiBackground, customBgImgRef.current);
              renderSegmentedUserOnCanvas(ctx, video, maskRef.current, w, h, isMirrored);
            } else {
              ctx.save();
              if (isMirrored) {
                ctx.translate(w, 0);
                ctx.scale(-1, 1);
              }
              ctx.drawImage(video, 0, 0, w, h);
              ctx.restore();
            }

            const activeProp = arProp !== 'none' ? arProp : activeOverlay;
            if (activeProp && activeProp !== 'none') {
              drawArPropToCanvas(ctx, w, h, activeProp);
            }
          } catch (e) {
            console.warn('Canvas draw error:', e);
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [aiBackground, activeOverlay, arProp, isMirrored]);

  const captureSingleFrame = () => {
    const liveCanvas = liveCanvasRef.current;
    if (!liveCanvas) return null;

    const styleFilterString = getAiStyleCssFilter(aiStyle);
    if (styleFilterString && styleFilterString !== '') {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = liveCanvas.width;
      exportCanvas.height = liveCanvas.height;
      const ctx = exportCanvas.getContext('2d');
      ctx.filter = styleFilterString;
      ctx.drawImage(liveCanvas, 0, 0);
      return exportCanvas.toDataURL('image/jpeg', 0.95);
    }

    return liveCanvas.toDataURL('image/jpeg', 0.95);
  };

  const startStudioSession = async () => {
    if (isCapturing || cameraError) return;
    setIsCapturing(true);
    document.dispatchEvent(new CustomEvent('photobooth:sessionStart'));
    const newPhotos = [...photos];
    const slots = getLayoutSlotCount(layout);

    const cheerWords = ['Senyum! 😊', 'Cakep! ✨', 'Mantap! 🔥', 'Keren! 💖'];

    speakCountdown('Siap? Yuk mulai!');
    await new Promise(res => setTimeout(res, 1200));

    for (let shotIdx = 0; shotIdx < slots; shotIdx++) {
      setActiveShotIndex(shotIdx);

      const totalSecs = parseInt(countdownDuration) || 3;
      for (let sec = totalSecs; sec > 0; sec--) {
        setCountdown(sec);
        playBeep(880, 0.12);
        speakCountdown(String(sec));
        await new Promise(res => setTimeout(res, 1000));
      }

      const cheer = cheerWords[shotIdx] || 'Keren!';
      setCountdown('📸');
      speakCountdown(cheer);
      setFlashActive(true);
      playShutterSound();

      const photoData = captureSingleFrame();
      if (photoData) {
        newPhotos[shotIdx] = photoData;
        setPhotos([...newPhotos]);
      }

      flashTimerRef.current = setTimeout(() => setFlashActive(false), 150);
      await new Promise(res => setTimeout(res, 900));

      // Pose gap jeda
      if (shotIdx < slots - 1) {
        setCountdown(null);
        setIsPoseGap(true);
        setPoseGapProgress(100);
        const gapMs = (poseGapSeconds || 3) * 1000;
        const interval = 50;
        const steps = gapMs / interval;
        for (let i = 0; i < steps; i++) {
          setPoseGapProgress(Math.round(100 - ((i + 1) / steps) * 100));
          await new Promise(res => setTimeout(res, interval));
        }
        setIsPoseGap(false);
        setPoseGapProgress(100);
      }
    }

    setCountdown(null);
    setIsCapturing(false);
    setActiveShotIndex(null);
    speakCountdown('Semua selesai! Cek strip foto kamu ya.');
    document.dispatchEvent(new CustomEvent('photobooth:sessionEnd'));
    if (onSessionComplete) onSessionComplete(newPhotos);
  };

  const retakeSingleShot = async (index) => {
    if (isCapturing) return false;
    try {
      setIsCapturing(true);
      setActiveShotIndex(index);

      const cheerWords = ['Senyum! 😊', 'Cakep! ✨', 'Mantap! 🔥', 'Keren! 💖'];

      const totalSecs = parseInt(countdownDuration) || 3;
      for (let sec = totalSecs; sec > 0; sec--) {
        setCountdown(sec);
        playBeep(880, 0.12);
        speakCountdown(String(sec));
        await new Promise(res => setTimeout(res, 1000));
      }

      const cheer = cheerWords[index] || 'Keren!';
      setCountdown('📸');
      speakCountdown(cheer);
      setFlashActive(true);
      playShutterSound();

      const photoData = captureSingleFrame();
      if (photoData) {
        const updated = [...photos];
        updated[index] = photoData;
        setPhotos(updated);
      }

      flashTimerRef.current = setTimeout(() => setFlashActive(false), 150);
      await new Promise(res => setTimeout(res, 500));

      setCountdown(null);
      setIsCapturing(false);
      setActiveShotIndex(null);
      return true;
    } catch (e) {
      console.error('Retake error:', e);
      setIsCapturing(false);
      setActiveShotIndex(null);
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    retakeSingleShot
  }));

  const combinedFilterClass = `filter-${activeFilter}`;
  const styleFilterString = getAiStyleCssFilter(aiStyle);
  const activeProp = arProp !== 'none' ? arProp : activeOverlay;

  return (
    <div className={`glass-panel ${isKioskMode ? 'camera-kiosk-mode' : ''}`}>
      {/* Top Camera Controls */}
      <div className="camera-panel-header">
        <h3 className="camera-panel-title">
          <span className="cv2-icon-pink"><Camera size={20} /></span>
          <span>Live Studio Feed</span>
        </h3>

        <div className="camera-panel-actions">
          {aiBackground !== 'none' && (
            <span className="badge-ai-active">
              <Sparkles size={12} />
              <span>{AI_BACKGROUND_LABELS[aiBackground] || 'AI Bg'}</span>
            </span>
          )}

          <button
            className="btn-secondary btn-sm"
            onClick={() => setIsMirrored(!isMirrored)}
            title="Toggle Mirror Camera"
          >
            <FlipHorizontal size={14} />
            <span>{isMirrored ? 'Cermin ON' : 'Cermin OFF'}</span>
          </button>

          <button
            className={`btn-secondary btn-sm ${isKioskMode ? 'btn-kiosk-active' : ''}`}
            onClick={() => setIsKioskMode(!isKioskMode)}
            title={isKioskMode ? 'Keluar Mode Zoom / Kiosk' : 'Zoom Live Studio Fullscreen'}
          >
            {isKioskMode ? <Minimize size={14} /> : <Maximize size={14} />}
            <span>{isKioskMode ? 'Tutup Zoom' : 'Zoom Studio 🔍'}</span>
          </button>
        </div>
      </div>

      <div className={isKioskMode ? 'kiosk-grid-container' : ''}>
        {/* Main Live Camera Column */}
        <div className={isKioskMode ? 'kiosk-left-col' : ''}>
          {/* Camera Preview Box */}
          <div className={`camera-wrapper ${activeProp === 'fisheye' ? 'fisheye-effect' : ''}`}>
            <div className={`flash-overlay ${flashActive ? 'active' : ''}`} />

            {aiBackground !== 'none' && (
              <div className="ai-bg-banner">
                <span>✨ AI Background Swap: {AI_BACKGROUND_LABELS[aiBackground]}</span>
                {isAiProcessing && <span className="ai-pulse-dot" />}
              </div>
            )}

            {countdown !== null && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
                <div className="countdown-badge">
                  Jepretan ke-{activeShotIndex !== null ? activeShotIndex + 1 : 1} dari {getLayoutSlotCount(layout)}
                </div>
              </div>
            )}

            {isPoseGap && (
              <div className="pose-gap-overlay">
                <div className="pose-gap-text">Siap pose berikutnya! ✨</div>
                <div className="pose-gap-bar-container">
                  <div className="pose-gap-bar" style={{ width: `${poseGapProgress}%` }} />
                </div>
              </div>
            )}

            <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

            {cameraError ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#FF6584' }}>
                <p>{cameraError}</p>
              </div>
            ) : (
              <canvas
                ref={liveCanvasRef}
                style={styleFilterString ? { filter: styleFilterString } : undefined}
                className={`webcam-feed ${combinedFilterClass}`}
              />
            )}
          </div>

          {/* 4 Shots Thumbnail Bar — with always-visible retake + active slot highlight */}
          <div className="shots-row">
            {Array.from({ length: getLayoutSlotCount(layout) }, (_, idx) => (
              <div
                key={idx}
                className={`shot-slot ${activeShotIndex === idx ? 'active-target' : ''} ${isCapturing && activeShotIndex === idx ? 'capturing-pulse' : ''}`}
              >
                {/* Active slot indicator during countdown */}
                {isCapturing && activeShotIndex === idx && (
                  <div className="shot-active-ring" aria-hidden="true" />
                )}

                {photos[idx] ? (
                  <>
                    <img src={photos[idx]} alt={`Shot ${idx + 1}`} className={`filter-${activeFilter}`} />
                    {/* Always-visible retake button at bottom */}
                    <button
                      className="shot-retake-btn shot-retake-always"
                      onClick={() => retakeSingleShot(idx)}
                      disabled={isCapturing}
                      title={`Foto ulang jepretan #${idx + 1}`}
                    >
                      <RefreshCw size={11} />
                      <span>Ulang</span>
                    </button>
                  </>
                ) : (
                  <div className="shot-empty-content">
                    <span className="shot-number">#{idx + 1}</span>
                    {/* Highlight empty next slot during countdown */}
                    {isCapturing && activeShotIndex === idx && (
                      <span className="shot-next-label">📸 Sekarang!</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Session progress bar during capture */}
          {isCapturing && activeShotIndex !== null && (
            <div className="session-progress-bar" role="progressbar" aria-valuenow={activeShotIndex + 1} aria-valuemax={getLayoutSlotCount(layout)}>
              {Array.from({ length: getLayoutSlotCount(layout) }, (_, i) => (
                <div
                  key={i}
                  className={`progress-pip ${i < activeShotIndex ? 'done' : i === activeShotIndex ? 'active' : 'pending'}`}
                />
              ))}
              <span className="progress-label">Foto {activeShotIndex + 1} / {getLayoutSlotCount(layout)}</span>
            </div>
          )}

          {/* Start Session Button */}
          <button
            className="btn-primary"
            onClick={startStudioSession}
            disabled={isCapturing || !!cameraError}
          >
            <Zap size={20} />
            <span>{isCapturing ? `Merekam... (${activeShotIndex + 1}/${getLayoutSlotCount(layout)})` : `Mulai ${getLayoutSlotCount(layout)}-Snap Studio! 🚀`}</span>
          </button>
        </div>

        {/* Live Photo Strip Preview (right side column when in Zoom Studio Mode) */}
        {isKioskMode && stripPreviewNode && (
          <div className="kiosk-right-col">
            <div className="kiosk-strip-header">🎞️ Live Photo Strip Preview</div>
            {stripPreviewNode}
          </div>
        )}
      </div>
    </div>
  );
});

export default CameraView;

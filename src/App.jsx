import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import WelcomeScreen from './components/WelcomeScreen';
import CameraView from './components/CameraView';
import PhotoStripPreview from './components/PhotoStripPreview';
import Controls from './components/Controls';
import MobileControlsTabs from './components/MobileControlsTabs';
import PrintModal from './components/PrintModal';
import MusicPlayer from './components/MusicPlayer';
import GalleryModal from './components/GalleryModal';
import CelebrationScreen from './components/CelebrationScreen';
import { saveSession, saveSettings, loadSettings, loadAdminConfig, saveLead } from './utils/db';
import { drawPhotoStripToCanvas } from './utils/canvasExporter';
import { generateAnimatedGif } from './utils/gifExporter';
import KioskIdleTimer from './components/KioskIdleTimer';

const DEFAULT_SETTINGS = {
  layout: 'strip1x4',
  frameTheme: 'haru_white',
  filter: 'haru_soft',
  showGrain: true,
  showLedDate: true,
  showQrCode: false,
  titleText: 'LIFE 4 CUTS 📸',
  sticker: '♡',
  aiBackground: 'none',
  countdownDuration: 3,
};

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [settingsLoaded, setSettingsLoaded] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStripUrl, setCelebrationStripUrl] = useState(null);
  const [adminConfig, setAdminConfig] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [kioskMode, setKioskMode] = useState(false);
  const [kioskIdleMinutes, setKioskIdleMinutes] = useState(3);

  // Studio state
  const [layout, setLayout] = useState(DEFAULT_SETTINGS.layout);
  const [frameTheme, setFrameTheme] = useState(DEFAULT_SETTINGS.frameTheme);
  const [filter, setFilter] = useState(DEFAULT_SETTINGS.filter);
  const [showGrain, setShowGrain] = useState(DEFAULT_SETTINGS.showGrain);
  const [showLedDate, setShowLedDate] = useState(DEFAULT_SETTINGS.showLedDate);
  const [showQrCode] = useState(DEFAULT_SETTINGS.showQrCode); // always off
  const [titleText, setTitleText] = useState(DEFAULT_SETTINGS.titleText);
  const [sticker, setSticker] = useState(DEFAULT_SETTINGS.sticker);
  const [aiBackground, setAiBackground] = useState(DEFAULT_SETTINGS.aiBackground);
  const [customFrameDataUrl, setCustomFrameDataUrl] = useState(null);
  const [customBgDataUrl, setCustomBgDataUrl] = useState(null);
  const [customFrameColor, setCustomFrameColor] = useState('#FFB7C5');
  const [placedStickers, setPlacedStickers] = useState([]);
  const [placedCaptions, setPlacedCaptions] = useState([]);
  const [placedImages, setPlacedImages] = useState([]);
  const [doodlePaths, setDoodlePaths] = useState([]);
  const [isDoodling, setIsDoodling] = useState(false);
  const [brushColor, setBrushColor] = useState('#FF6584');
  const [brushSize, setBrushSize] = useState(5);
  const [arProp, setArProp] = useState('none');
  const [countdownDuration, setCountdownDuration] = useState(DEFAULT_SETTINGS.countdownDuration);
  const [poseGapSeconds, setPoseGapSeconds] = useState(3);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.4);
  const [selectedLayer, setSelectedLayer] = useState(null);

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const exportCanvasRef = useRef(null);
  const cameraRef = useRef(null);

  // ── Load settings ───────────────────────────────────────────
  useEffect(() => {
    loadAdminConfig().then(cfg => {
      setAdminConfig(cfg);
      if (cfg?.kioskMode) setKioskMode(true);
      if (cfg?.idleMinutes) setKioskIdleMinutes(cfg.idleMinutes);
    }).catch(() => {});
    loadSettings().then(saved => {
      if (saved) {
        if (saved.layout)      setLayout(saved.layout);
        if (saved.frameTheme)  setFrameTheme(saved.frameTheme);
        if (saved.filter)      setFilter(saved.filter);
        if (saved.showGrain    !== undefined) setShowGrain(saved.showGrain);
        if (saved.showLedDate  !== undefined) setShowLedDate(saved.showLedDate);
        if (saved.titleText)   setTitleText(saved.titleText);
        if (saved.sticker      !== undefined) setSticker(saved.sticker);
        if (saved.aiBackground) setAiBackground(saved.aiBackground);
        if (saved.customBgDataUrl) setCustomBgDataUrl(saved.customBgDataUrl);
        if (saved.customFrameDataUrl) setCustomFrameDataUrl(saved.customFrameDataUrl);
        if (saved.countdownDuration) setCountdownDuration(saved.countdownDuration);
        if (saved.poseGapSeconds    !== undefined) setPoseGapSeconds(saved.poseGapSeconds);
        if (saved.watermarkText     !== undefined) setWatermarkText(saved.watermarkText);
        if (saved.watermarkOpacity  !== undefined) setWatermarkOpacity(saved.watermarkOpacity);
      }
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, []);

  // ── Auto-save settings ──────────────────────────────────────
  const saveTimer = useRef(null);
  const debouncedSave = useCallback(() => {
    if (!settingsLoaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveSettings({ layout, frameTheme, filter, showGrain, showLedDate, titleText, sticker, aiBackground, customBgDataUrl, customFrameDataUrl, countdownDuration, poseGapSeconds, watermarkText, watermarkOpacity }).catch(() => {});
    }, 1500);
  }, [settingsLoaded, layout, frameTheme, filter, showGrain, showLedDate, titleText, sticker, aiBackground, countdownDuration, poseGapSeconds, watermarkText, watermarkOpacity]);

  useEffect(() => { debouncedSave(); return () => clearTimeout(saveTimer.current); }, [debouncedSave]);

  // ── Handlers ────────────────────────────────────────────────
  const resetUserData = () => {
    setPhotos([]);
    setShowCelebration(false);
    setCelebrationStripUrl(null);
    setPlacedStickers([]);
    setPlacedCaptions([]);
    setPlacedImages([]);
    setDoodlePaths([]);
    setIsDoodling(false);
    setSelectedLayer(null);
    setLeadData(null);
    setTitleText(DEFAULT_SETTINGS.titleText);
    try { sessionStorage.removeItem('pendingStrip'); } catch (e) { /* noop */ }
  };

  const handleReset = () => {
    if (photos.length > 0) {
      if (window.confirm('Mulai sesi foto baru? Foto saat ini akan terhapus.')) {
        resetUserData();
      }
    } else {
      resetUserData();
      setScreen('welcome');
    }
  };

  const generateCelebrationStrip = useCallback(async (photosForStrip = null) => {
    try {
      const canvas = exportCanvasRef.current || document.createElement('canvas');
      const url = await drawPhotoStripToCanvas(canvas, {
        photos: photosForStrip || photos, layout, frameTheme, filter,
        showGrain, showLedDate, showQrCode: false,
        titleText: titleText || 'LIFE 4 CUTS 📸',
        fontStyle: 'default', sticker, doodlePaths: [],
        customBgDataUrl, customFrameColor, watermarkText, watermarkOpacity,
        resolutionScale: 1.0,
      });
      setCelebrationStripUrl(url);
    } catch (e) {
      setCelebrationStripUrl(null);
    }
  }, [photos, layout, frameTheme, filter, showGrain, showLedDate, titleText, sticker, customBgDataUrl, customFrameColor, watermarkText, watermarkOpacity]);

  const handleSessionComplete = async (completedPhotos) => {
    // Save lead data if available (deduped by db layer)
    if (leadData?.name) {
      try {
        await saveLead({ name: leadData.name, phone: leadData.phone || '' });
      } catch (e) {
        console.warn('Lead save error:', e);
      }
    }

    await generateCelebrationStrip(completedPhotos);
    setTimeout(() => setShowCelebration(true), 600);
  };

  const handleSaveToGallery = async () => {
    if (!photos || photos.filter(Boolean).length === 0) {
      setSaveToast('error');
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }
    setIsSaving(true);
    try {
      const canvas = exportCanvasRef.current || document.createElement('canvas');
      const stripPng = await drawPhotoStripToCanvas(canvas, {
        photos, layout, frameTheme, filter,
        showGrain, showLedDate, showQrCode: false,
        titleText: titleText || 'LIFE 4 CUTS 📸',
        fontStyle: 'default', sticker, doodlePaths,
        customBgDataUrl, customFrameColor, placedStickers, placedCaptions, placedImages,
        watermarkText, watermarkOpacity,
      });
      const sessionId = await saveSession({ stripPng, theme: frameTheme, layout, filter, titleText, sticker });
      if (leadData?.name) {
        try { await saveLead({ name: leadData.name, phone: leadData.phone || '', sessionId }); } catch (e) { /* noop */ }
      }
      setSaveToast('success');
      setTimeout(() => setSaveToast(null), 3500);
    } catch (e) {
      console.error('Save error:', e);
      setSaveToast('error');
      setTimeout(() => setSaveToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Share handler (passed to CelebrationScreen) ─────────────
  const handleShare = async (target) => {
    if (!photos || photos.filter(Boolean).length < 4) return;
    try {
      const canvas = exportCanvasRef.current || document.createElement('canvas');
      const dataUrl = await drawPhotoStripToCanvas(canvas, {
        photos, layout, frameTheme, filter,
        showGrain, showLedDate, showQrCode: false,
        titleText: titleText || 'LIFE 4 CUTS 📸',
        fontStyle: 'default', sticker, doodlePaths, resolutionScale: 1.0,
        customBgDataUrl, customFrameColor, placedStickers, placedCaptions, placedImages,
        watermarkText, watermarkOpacity,
      });

      if (target === 'native' && navigator.canShare) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'life4cuts.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Life 4 Cuts 📸', text: 'Strip foto ku! 🎞️✨' });
          return;
        }
      }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (target === 'whatsapp') {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          window.open('https://web.whatsapp.com', '_blank');
          alert('✅ Foto di-copy! Paste (Ctrl+V) di chat WhatsApp Web.');
        } catch {
          const link = document.createElement('a');
          link.download = 'life4cuts.png'; link.href = dataUrl; link.click();
          window.open('https://web.whatsapp.com', '_blank');
        }
      } else if (target === 'instagram') {
        try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); } catch {}
        const link = document.createElement('a');
        link.download = 'life4cuts-ig.png'; link.href = dataUrl; link.click();
        setTimeout(() => window.open('https://www.instagram.com', '_blank'), 400);
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  };

  const handleDownloadFromCelebration = async () => {
    try {
      const canvas = exportCanvasRef.current || document.createElement('canvas');
      const dataUrl = await drawPhotoStripToCanvas(canvas, {
        photos, layout, frameTheme, filter,
        showGrain, showLedDate, showQrCode: false,
        titleText: titleText || 'LIFE 4 CUTS 📸',
        fontStyle: 'default', sticker, doodlePaths, resolutionScale: 2.0,
        customBgDataUrl, customFrameColor, placedStickers, placedCaptions, placedImages,
        watermarkText, watermarkOpacity,
      });
      const link = document.createElement('a');
      link.download = `life4cuts-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadGifFromCelebration = async () => {
    try {
      const gifUrl = await generateAnimatedGif({
        photos, layout, frameTheme, filter,
        showGrain, showLedDate,
        titleText: titleText || 'LIFE 4 CUTS 📸',
        fontStyle: 'default', sticker, doodlePaths: [],
        customBgDataUrl, customFrameUrl: customFrameDataUrl, customFrameColor, placedStickers, placedCaptions, placedImages,
        watermarkText, watermarkOpacity,
      });
      const link = document.createElement('a');
      link.download = `life4cuts-animation-${Date.now()}.gif`;
      link.href = gifUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert('Gagal membuat file GIF animasi.');
    }
  };

  if (screen === 'admin') return <AdminPanel onClose={() => setScreen('welcome')} />;

  if (screen === 'welcome') return <WelcomeScreen
    onStart={({ eventName }) => {
      const baseName = eventName || (leadData?.name ? leadData.name : '');
      if (baseName) setTitleText(baseName);
      setScreen('studio');
    }}
    adminConfig={adminConfig}
    onAdminAccess={() => setScreen('admin')}
    leadCaptureEnabled={adminConfig?.leadCapture || false}
    onLeadSubmit={(lead) => setLeadData(lead)}
    onLeadSkip={() => setLeadData(null)}
  />;

  if (!settingsLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FF6584', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className={`app-container${kioskMode ? ' kiosk-active' : ''}`}>
      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />

      <KioskIdleTimer
        enabled={kioskMode}
        idleMinutes={kioskIdleMinutes}
        onIdle={() => { resetUserData(); setScreen('welcome'); }}
      />

      {!kioskMode && <Header onReset={handleReset} hasPhotos={photos.length > 0} onOpenGallery={() => setShowGallery(true)} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} onOpenAdmin={() => setScreen('admin')} />}
      <MusicPlayer />

      {/* ── CELEBRATION SCREEN overlay ─────────────────────── */}
      {showCelebration && (
        <CelebrationScreen
          photos={photos}
          onDownload={handleDownloadFromCelebration}
          onDownloadGif={handleDownloadGifFromCelebration}
          onShare={handleShare}
          onPrint={() => { setShowCelebration(false); setShowPrintModal(true); }}
          onReset={() => resetUserData()}
          onRetakePhoto={async (idx) => {
            setShowCelebration(false);
            setTimeout(async () => {
              const ok = await cameraRef.current?.retakeSingleShot(idx);
              if (ok) {
                await generateCelebrationStrip();
                setShowCelebration(true);
              }
            }, 300);
          }}
          kioskMode={kioskMode}
          stripDataUrl={celebrationStripUrl}
        />
      )}

      <main className="studio-layout">
        {/* ── LEFT: Camera (HERO) + Controls ──────────────── */}
        <div className="studio-left">
          {/* Countdown selector — compact, above camera */}
          <div className="countdown-selector-row">
            <span className="countdown-selector-label">⏱️ Timer</span>
            {[3, 5, 10].map(s => (
              <button
                key={s}
                className={`countdown-chip ${countdownDuration === s ? 'active' : ''}`}
                onClick={() => setCountdownDuration(s)}
              >
                {s}s
              </button>
            ))}
          </div>

          <CameraView
            ref={cameraRef}
            photos={photos}
            setPhotos={setPhotos}
            layout={layout}
            activeFilter={filter}
            activeOverlay="none"
            aiBackground={aiBackground}
            customBgDataUrl={customBgDataUrl}
            aiStyle="none"
            aiOutfit="none"
            arProp={arProp}
            countdownDuration={countdownDuration}
            poseGapSeconds={poseGapSeconds}
            soundEnabled={soundEnabled}
            onSessionComplete={handleSessionComplete}
            stripPreviewNode={
              <PhotoStripPreview
                photos={photos}
                layout={layout}
                frameTheme={frameTheme}
                customFrameColor={customFrameColor}
                filter={filter}
                showGrain={showGrain}
                showLedDate={showLedDate}
                showQrCode={showQrCode}
                titleText={titleText}
                fontStyle="default"
                sticker={sticker}
                customFrameDataUrl={customFrameDataUrl}
                customBgDataUrl={customBgDataUrl}
                onRetakePhoto={(idx) => cameraRef.current?.retakeSingleShot(idx)}
                placedStickers={placedStickers}
                setPlacedStickers={setPlacedStickers}
                placedCaptions={placedCaptions}
                setPlacedCaptions={setPlacedCaptions}
                placedImages={placedImages}
                setPlacedImages={setPlacedImages}
                doodlePaths={doodlePaths}
                setDoodlePaths={setDoodlePaths}
                isDoodling={isDoodling}
                brushColor={brushColor}
                brushSize={brushSize}
                selectedLayer={selectedLayer}
                setSelectedLayer={setSelectedLayer}
                watermarkText={watermarkText}
                watermarkOpacity={watermarkOpacity}
              />
            }
          />

          <div className="controls-desktop-only">
            <Controls
              photos={photos}
              layout={layout}               setLayout={setLayout}
              frameTheme={frameTheme}       setFrameTheme={setFrameTheme}
              customFrameColor={customFrameColor} setCustomFrameColor={setCustomFrameColor}
              filter={filter}               setFilter={setFilter}
              showGrain={showGrain}         setShowGrain={setShowGrain}
              showLedDate={showLedDate}     setShowLedDate={setShowLedDate}
              aiBackground={aiBackground}   setAiBackground={setAiBackground}
              customBgDataUrl={customBgDataUrl} setCustomBgDataUrl={setCustomBgDataUrl}
              customFrameDataUrl={customFrameDataUrl} setCustomFrameDataUrl={setCustomFrameDataUrl}
              sticker={sticker}             setSticker={setSticker}
              titleText={titleText}         setTitleText={setTitleText}
              placedStickers={placedStickers} setPlacedStickers={setPlacedStickers}
              placedCaptions={placedCaptions} setPlacedCaptions={setPlacedCaptions}
              placedImages={placedImages}     setPlacedImages={setPlacedImages}
              doodlePaths={doodlePaths}     setDoodlePaths={setDoodlePaths}
              isDoodling={isDoodling}       setIsDoodling={setIsDoodling}
              brushColor={brushColor}       setBrushColor={setBrushColor}
              brushSize={brushSize}         setBrushSize={setBrushSize}
              arProp={arProp}               setArProp={setArProp}
              showQrCode={showQrCode}
              onOpenPrint={() => setShowPrintModal(true)}
              onSaveToGallery={handleSaveToGallery}
              isSaving={isSaving}
              selectedLayer={selectedLayer}
              setSelectedLayer={setSelectedLayer}
              poseGapSeconds={poseGapSeconds}
              setPoseGapSeconds={setPoseGapSeconds}
              watermarkText={watermarkText}
              setWatermarkText={setWatermarkText}
              watermarkOpacity={watermarkOpacity}
              setWatermarkOpacity={setWatermarkOpacity}
              kioskMode={kioskMode}
            />
          </div>
          <MobileControlsTabs
            photos={photos}
            layout={layout}               setLayout={setLayout}
            frameTheme={frameTheme}       setFrameTheme={setFrameTheme}
            customFrameColor={customFrameColor} setCustomFrameColor={setCustomFrameColor}
            filter={filter}               setFilter={setFilter}
            showGrain={showGrain}         setShowGrain={setShowGrain}
            showLedDate={showLedDate}     setShowLedDate={setShowLedDate}
            aiBackground={aiBackground}   setAiBackground={setAiBackground}
            customBgDataUrl={customBgDataUrl} setCustomBgDataUrl={setCustomBgDataUrl}
            customFrameDataUrl={customFrameDataUrl} setCustomFrameDataUrl={setCustomFrameDataUrl}
            sticker={sticker}             setSticker={setSticker}
            titleText={titleText}         setTitleText={setTitleText}
            placedStickers={placedStickers} setPlacedStickers={setPlacedStickers}
            placedCaptions={placedCaptions} setPlacedCaptions={setPlacedCaptions}
            placedImages={placedImages}     setPlacedImages={setPlacedImages}
            doodlePaths={doodlePaths}     setDoodlePaths={setDoodlePaths}
            isDoodling={isDoodling}       setIsDoodling={setIsDoodling}
            brushColor={brushColor}       setBrushColor={setBrushColor}
            brushSize={brushSize}         setBrushSize={setBrushSize}
            arProp={arProp}               setArProp={setArProp}
            showQrCode={showQrCode}
            onOpenPrint={() => setShowPrintModal(true)}
            onSaveToGallery={handleSaveToGallery}
            isSaving={isSaving}
            selectedLayer={selectedLayer}
            setSelectedLayer={setSelectedLayer}
            countdownDuration={countdownDuration}
            setCountdownDuration={setCountdownDuration}
            poseGapSeconds={poseGapSeconds}
            setPoseGapSeconds={setPoseGapSeconds}
            watermarkText={watermarkText}
            setWatermarkText={setWatermarkText}
            watermarkOpacity={watermarkOpacity}
            setWatermarkOpacity={setWatermarkOpacity}
            kioskMode={kioskMode}
          />
        </div>

        {/* ── RIGHT: Strip Preview (LARGE) ─────────────────── */}
        <div className="studio-right" id="strip-preview-section">
          <PhotoStripPreview
            photos={photos}
            layout={layout}
            frameTheme={frameTheme}
            customFrameColor={customFrameColor}
            filter={filter}
            showGrain={showGrain}
            showLedDate={showLedDate}
            showQrCode={showQrCode}
            titleText={titleText}
            fontStyle="default"
            sticker={sticker}
            customFrameDataUrl={customFrameDataUrl}
            customBgDataUrl={customBgDataUrl}
            onRetakePhoto={(idx) => cameraRef.current?.retakeSingleShot(idx)}
            placedStickers={placedStickers}
            setPlacedStickers={setPlacedStickers}
            placedCaptions={placedCaptions}
            setPlacedCaptions={setPlacedCaptions}
            placedImages={placedImages}
            setPlacedImages={setPlacedImages}
            doodlePaths={doodlePaths}
            setDoodlePaths={setDoodlePaths}
            isDoodling={isDoodling}
            brushColor={brushColor}
            brushSize={brushSize}
            selectedLayer={selectedLayer}
            setSelectedLayer={setSelectedLayer}
            watermarkText={watermarkText}
            watermarkOpacity={watermarkOpacity}
          />
        </div>
      </main>

      {!kioskMode && (
        <footer style={{ marginTop: 'auto', paddingTop: '32px', textAlign: 'center', fontSize: '0.78rem', color: '#4B5563' }}>
          <p>© 2026 LIFE 4 CUTS • Korean Photobooth Studio</p>
        </footer>
      )}

      {showPrintModal && (
        <PrintModal
          photos={photos} filter={filter} frameTheme={frameTheme} layout={layout}
          showGrain={showGrain} showLedDate={showLedDate} showQrCode={false}
          titleText={titleText} sticker={sticker} fontStyle="default" doodlePaths={doodlePaths}
          customFrameDataUrl={customFrameDataUrl}
          customBgDataUrl={customBgDataUrl}
          watermarkText={watermarkText}
          watermarkOpacity={watermarkOpacity}
          placedImages={placedImages}
          placedStickers={placedStickers}
          placedCaptions={placedCaptions}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showGallery && <GalleryModal onClose={() => setShowGallery(false)} />}

      {saveToast && (
        <div className={`save-toast ${saveToast}`}>
          {saveToast === 'success'
            ? <>💾 Tersimpan ke galeri! <span style={{ opacity: 0.7 }}>Lihat di 🖼️ Galeri</span></>
            : <>⚠️ Gagal menyimpan. Pastikan foto sudah diambil!</>}
        </div>
      )}
    </div>
  );
}

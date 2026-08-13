import React, { useRef, useState } from 'react';
import { Download, Sliders, Palette, Printer, Share2, Sparkles, Upload, Heart, Bookmark, Film, Edit3, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { drawPhotoStripToCanvas } from '../utils/canvasExporter';
import { generateAnimatedGif } from '../utils/gifExporter';
import { playSuccessChime } from '../utils/soundEffects';
import { AI_BACKGROUNDS, AR_PROPS } from '../utils/aiFilters';

// ── 8 curated frame themes with rich preview colors & badges ──────
const LAYOUTS = [
  { id: 'strip1x4',    name: '4-Cut Strip',   icon: '🎞️' },
  { id: 'grid2x2',     name: 'Grid 2×2',      icon: '▦' },
  { id: 'hero1plus3',  name: '1+3 Hero',      icon: '🖼️' },
  { id: 'strip1x3',    name: '3-Cut',         icon: '📋' },
  { id: 'duo1x2',      name: '2-Cut Duo',     icon: '⬜' },
  { id: 'filmroll',    name: 'Film Roll',      icon: '📽️' },
  { id: 'photocard',   name: 'K-Pop Card',    icon: '💌', badge: 'NEW' },
];
const FRAME_THEMES = [
  { id: 'haru_white',       name: 'Clean White',  badge: 'MINIMAL', bg: '#FFFFFF', border: '#E2E8F0', text: '#1E293B' },
  { id: 'anime_sakura',     name: 'Korean Pink',  badge: 'POPULAR', bg: 'linear-gradient(135deg, #FFE4EC, #FFB7C5)', border: '#FF94B2', text: '#D81B60' },
  { id: 'anime_chibi',      name: 'Anime Chibi',  badge: 'ANIME',   bg: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)', border: '#FF91A4', text: '#C71585' },
  { id: 'hari_guru',        name: 'Hari Guru / Fest', badge: 'SCHOOL', bg: 'linear-gradient(135deg, #E6F3FF, #CCE5FF)', border: '#4A90E2', text: '#1B365D' },
  { id: 'birthday_bash',    name: 'Happy Birthday', badge: 'PARTY', bg: 'linear-gradient(135deg, #FFF9C4, #FFE082)', border: '#F57F17', text: '#E65100' },
  { id: 'photomatic_black', name: 'Studio Matte', badge: 'MATTE',   bg: '#121212', border: '#333333', text: '#FFFFFF' },
  { id: 'anime_cyber',      name: 'Cyber Neon',   badge: 'NEON',    bg: 'linear-gradient(135deg, #0A001F, #1E0048)', border: '#00FFFF', text: '#00FFFF' },
  { id: 'y2k_silver',       name: 'Y2K Chrome',   badge: 'CHROME',  bg: 'linear-gradient(135deg, #E8EDF2, #B0B0B0)', border: '#94A3B8', text: '#0F172A' },
  { id: 'film_roll',        name: 'Vintage 35mm', badge: '35mm',    bg: '#1A1815', border: '#D97706', text: '#F59E0B' },
  { id: 'boba_taro',        name: 'Boba Taro',    badge: 'CAFÉ',    bg: 'linear-gradient(135deg, #E6D7FF, #CDB4DB)', border: '#A855F7', text: '#6B21A8' },
  { id: 'citypop_90s',      name: 'CityPop 90s',  badge: '90s',     bg: 'linear-gradient(135deg, #005F73, #0A9396)', border: '#EE9B00', text: '#F4A261' },
];

const FILTERS = [
  { id: 'normal',          name: 'Original 📸' },
  { id: 'haru_soft',       name: '🩵 Haru Soft' },
  { id: 'photomatic_mono', name: '🖤 Mono' },
  { id: 'retro35mm',       name: '🎞️ 35mm Film' },
  { id: 'pastel_glow',     name: '🌸 Pastel' },
  { id: 'cinematic_mood',  name: '🌆 Cinematic' },
  { id: 'y2k_flash',       name: '⚡️ Y2K Flash' },
];

const STICKERS = ['♡', '★', '✧', '🌸', '🐾', '🧋', '🎀', '💖', '⚡️', '🌙'];
const FONT_OPTIONS = [
  { label: 'Outfit', value: '"Outfit", sans-serif' },
  { label: 'Pacifico', value: '"Pacifico", cursive' },
  { label: 'Space Grotesk', value: '"Space Grotesk", sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
];

export default function Controls({
  photos,
  layout, setLayout,
  frameTheme, setFrameTheme,
  customFrameColor, setCustomFrameColor,
  filter, setFilter,
  showGrain, setShowGrain,
  showLedDate, setShowLedDate,
  aiBackground, setAiBackground,
  customBgDataUrl, setCustomBgDataUrl,
  customFrameDataUrl, setCustomFrameDataUrl,
  sticker, setSticker,
  titleText, setTitleText,
  placedStickers = [], setPlacedStickers,
  placedCaptions = [], setPlacedCaptions,
  placedImages = [], setPlacedImages,
  doodlePaths, setDoodlePaths,
  isDoodling, setIsDoodling,
  brushColor, setBrushColor,
  brushSize, setBrushSize,
  arProp, setArProp,
  showQrCode,
  onOpenPrint,
  onSaveToGallery,
  isSaving,
  selectedLayer,
  setSelectedLayer,
}) {
  const exportCanvasRef = useRef(null);
  const customBgInputRef = useRef(null);
  const customFrameInputRef = useRef(null);
  const customColorInputRef = useRef(null);
  const customImageInputRef = useRef(null);
  const customStickerInputRef = useRef(null);
  const [newCaptionText, setNewCaptionText] = useState('');
  const [newCaptionColor, setNewCaptionColor] = useState('#FFFFFF');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const selectedTheme = FRAME_THEMES.find(t => t.id === frameTheme) || FRAME_THEMES[0];
  const selectedCaption = selectedLayer?.type === 'caption' ? placedCaptions.find(item => item.id === selectedLayer.id) : null;
  const selectedSticker = selectedLayer?.type === 'sticker' ? placedStickers.find(item => item.id === selectedLayer.id) : null;
  const selectedImage = selectedLayer?.type === 'image' ? placedImages.find(item => item.id === selectedLayer.id) : null;
  const activeImageCrop = selectedImage || (selectedSticker && selectedSticker.imageSrc ? selectedSticker : null);

  const updateSelectedLayer = (patch) => {
    if (!selectedLayer) return;
    if (selectedLayer.type === 'caption') {
      setPlacedCaptions(prev => prev.map(item => item.id === selectedLayer.id ? { ...item, ...patch } : item));
    }
    if (selectedLayer.type === 'sticker') {
      setPlacedStickers(prev => prev.map(item => item.id === selectedLayer.id ? { ...item, ...patch } : item));
    }
    if (selectedLayer.type === 'image') {
      setPlacedImages(prev => prev.map(item => item.id === selectedLayer.id ? { ...item, ...patch } : item));
    }
  };

  const removeSelectedLayer = () => {
    if (!selectedLayer) return;
    if (selectedLayer.type === 'caption') {
      setPlacedCaptions(prev => prev.filter(item => item.id !== selectedLayer.id));
    }
    if (selectedLayer.type === 'sticker') {
      setPlacedStickers(prev => prev.filter(item => item.id !== selectedLayer.id));
    }
    if (selectedLayer.type === 'image') {
      setPlacedImages(prev => prev.filter(item => item.id !== selectedLayer.id));
    }
    if (typeof setSelectedLayer === 'function') setSelectedLayer(null);
  };

  const buildStrip = async (scale = 1.0) => {
    const canvas = exportCanvasRef.current;
    return drawPhotoStripToCanvas(canvas, {
      photos, layout, frameTheme,
      customFrameColor,
      textColor: selectedTheme.text,
      filter, showGrain, showLedDate,
      titleText: titleText || 'LIFE 4 CUTS 📸',
      fontStyle: 'default',
      sticker,
      placedStickers,
      placedCaptions,
      placedImages,
      doodlePaths: doodlePaths || [],
      showQrCode: false,
      resolutionScale: scale,
      customFrameUrl: customFrameDataUrl,
      customBgDataUrl,
    });
  };

  const handleDownloadPng = async () => {
    if (!photos || photos.filter(Boolean).length < 4) {
      alert('Lengkapi 4 foto terlebih dahulu!'); return;
    }
    try {
      setIsExporting(true);
      const dataUrl = await buildStrip(2.0);
      playSuccessChime();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const link = document.createElement('a');
      link.download = `life4cuts-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Gagal membuat gambar strip foto.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadGif = async () => {
    if (!photos || photos.filter(Boolean).length < 4) {
      alert('Lengkapi 4 foto terlebih dahulu!'); return;
    }
    try {
      setIsExportingGif(true);
      const gifUrl = await generateAnimatedGif({
        photos,
        layout,
        frameTheme,
        customFrameColor,
        filter,
        showGrain,
        showLedDate,
        titleText: titleText || 'LIFE 4 CUTS 📸',
        fontStyle: 'default',
        sticker,
        placedStickers,
        placedCaptions,
        doodlePaths: doodlePaths || [],
        customBgDataUrl,
        customFrameUrl: customFrameDataUrl,
      });
      playSuccessChime();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      const link = document.createElement('a');
      link.download = `life4cuts-animation-${Date.now()}.gif`;
      link.href = gifUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Gagal membuat GIF animasi.');
    } finally {
      setIsExportingGif(false);
    }
  };

  const handleShare = async (target) => {
    if (!photos || photos.filter(Boolean).length < 4) {
      alert('Lengkapi 4 foto terlebih dahulu!'); return;
    }
    try {
      setIsSharing(true);
      const dataUrl = await buildStrip(1.0);

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
          link.download = 'life4cuts-wa.png'; link.href = dataUrl; link.click();
          window.open('https://web.whatsapp.com', '_blank');
        }
      } else if (target === 'instagram') {
        try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); } catch {}
        const link = document.createElement('a');
        link.download = 'life4cuts-ig.png'; link.href = dataUrl; link.click();
        setTimeout(() => window.open('https://www.instagram.com', '_blank'), 400);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="controls-v2">
      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />

      {/* 🎞️ 0. LAYOUT SELECTOR */}
      <div className="cv2-section">
        <div className="cv2-label">
          <span className="cv2-label-icon cv2-icon-cyan"><Film size={15} /></span>
          <span>Layout Strip</span>
        </div>
        <div className="cv2-pills">
          {LAYOUTS.map(l => (
            <button
              key={l.id}
              className={`cv2-pill ${layout === l.id ? 'active' : ''}`}
              onClick={() => setLayout(l.id)}
              style={{ position: 'relative' }}
            >
              {l.icon} {l.name}
              {l.badge && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-4px',
                  fontSize: '0.52rem', fontWeight: '800', background: 'linear-gradient(135deg,#7C5CFC,#FF6584)',
                  color: '#fff', borderRadius: '4px', padding: '1px 4px', letterSpacing: '0.3px'
                }}>{l.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 🎨 1. FRAME THEMES */}
      <div className="cv2-section">
        <div className="cv2-label">
          <span className="cv2-label-icon cv2-icon-pink"><Palette size={15} /></span>
          <span>Pilih Frame Studio</span>
        </div>
        <div className="cv2-theme-grid">
          {FRAME_THEMES.map(t => (
            <button
              key={t.id}
              className={`cv2-theme-card-v2 ${frameTheme === t.id && !customFrameDataUrl ? 'active' : ''}`}
              onClick={() => {
                setFrameTheme(t.id);
                // Clear custom frame when switching to a preset
                if (typeof setCustomFrameDataUrl === 'function') setCustomFrameDataUrl(null);
                if (typeof window !== 'undefined') window.customFramePngUrl = null;
                if (customFrameInputRef.current) customFrameInputRef.current.value = '';
              }}
            >
              {/* Mini Strip Mockup */}
              <div className="mini-strip-frame" style={{ background: t.bg, borderColor: t.border }}>
                <div className="mini-strip-dot" style={{ background: t.text }} />
                <div className="mini-strip-dot" style={{ background: t.text }} />
                <div className="mini-strip-dot" style={{ background: t.text }} />
              </div>
              <span className="cv2-theme-title">{t.name}</span>
              {t.badge && <span className="cv2-theme-badge">{t.badge}</span>}
            </button>
          ))}

          {/* Custom Color Picker Card */}
          <input
            type="color"
            ref={customColorInputRef}
            value={customFrameColor || '#FFB7C5'}
            style={{ display: 'none' }}
            onChange={e => {
              if (typeof setCustomFrameColor === 'function') setCustomFrameColor(e.target.value);
              setFrameTheme('custom_color');
              if (typeof setCustomFrameDataUrl === 'function') setCustomFrameDataUrl(null);
            }}
          />
          <button
            className={`cv2-theme-card-v2 ${frameTheme === 'custom_color' ? 'active' : ''}`}
            onClick={() => customColorInputRef.current?.click()}
            title="Pilih warna frame bebas dengan Color Picker"
          >
            <div className="mini-strip-frame" style={{ background: customFrameColor || '#FFB7C5', borderColor: '#FFFFFF' }}>
              <Palette size={14} color="#FFFFFF" />
            </div>
            <span className="cv2-theme-title">Custom Warna</span>
            <span className="cv2-theme-badge" style={{ color: '#FFD15C', background: 'rgba(255, 209, 92, 0.15)' }}>
              PICKER 🎨
            </span>
          </button>

          {/* Upload Custom Overlay Frame PNG (Canva / Photoshop / Event Logo) */}
          <input
            type="file"
            ref={customFrameInputRef}
            accept="image/png,image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = evt => {
                const dataUrl = evt.target.result;
                if (typeof setCustomFrameDataUrl === 'function') setCustomFrameDataUrl(dataUrl);
                if (typeof setFrameTheme === 'function') setFrameTheme('custom_png');
                if (typeof window !== 'undefined') window.customFramePngUrl = dataUrl;
              };
              reader.readAsDataURL(file);
            }}
          />
          <button
            className={`cv2-theme-card-v2 ${customFrameDataUrl ? 'active' : ''}`}
            onClick={() => customFrameInputRef.current?.click()}
            title="Unggah Desain Frame PNG Sendiri (dari Canva/Photoshop)"
          >
            <div className="mini-strip-frame" style={{ background: customFrameDataUrl ? `url(${customFrameDataUrl}) center/cover` : 'linear-gradient(135deg, #7C5CFC, #FF6584)', borderColor: '#FFFFFF', backgroundSize: 'cover' }}>
              {!customFrameDataUrl && <Upload size={14} color="#FFFFFF" />}
            </div>
            <span className="cv2-theme-title">{customFrameDataUrl ? 'Frame Custom' : 'Upload PNG'}</span>
            <span className="cv2-theme-badge" style={{ color: customFrameDataUrl ? '#38EF7D' : '#FF6584', background: customFrameDataUrl ? 'rgba(56, 239, 125, 0.18)' : 'rgba(255, 101, 132, 0.15)' }}>
              {customFrameDataUrl ? 'AKTIF ✓' : 'CANVA'}
            </span>
          </button>

          {/* Clear custom frame button — only shows when active */}
          {customFrameDataUrl && (
            <button
              className="cv2-theme-card-v2"
              onClick={() => {
                if (typeof setCustomFrameDataUrl === 'function') setCustomFrameDataUrl(null);
                if (typeof setFrameTheme === 'function') setFrameTheme('haru_white');
                if (typeof window !== 'undefined') window.customFramePngUrl = null;
                if (customFrameInputRef.current) customFrameInputRef.current.value = '';
              }}
              title="Hapus Custom Frame — kembali ke tema default"
              style={{ borderColor: 'rgba(255,101,132,0.4)' }}
            >
              <div className="mini-strip-frame" style={{ background: '#1E0A0A', borderColor: '#FF6584' }}>
                <span style={{ fontSize: '1.1rem' }}>✕</span>
              </div>
              <span className="cv2-theme-title" style={{ color: '#FF6584' }}>Hapus Frame</span>
              <span className="cv2-theme-badge" style={{ color: '#FF6584', background: 'rgba(255,101,132,0.1)' }}>RESET</span>
            </button>
          )}
        </div>
      </div>

      {/* 🩵 2. FILTERS */}
      <div className="cv2-section">
        <div className="cv2-label">
          <span className="cv2-label-icon cv2-icon-cyan"><Sliders size={15} /></span>
          <span>Color Grading Filter</span>
        </div>
        <div className="cv2-pills">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`cv2-pill ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* 🌸 3. AI BACKGROUND SWAP */}
      <div className="cv2-section">
        <div className="cv2-label">
          <span className="cv2-label-icon cv2-icon-purple"><Sparkles size={15} /></span>
          <span>AI Background Swap</span>
        </div>
        <div className="cv2-pills">
          {AI_BACKGROUNDS.map(bg => (
            <button
              key={bg.id}
              className={`cv2-pill ${aiBackground === bg.id ? 'active' : ''}`}
              onClick={() => setAiBackground(bg.id)}
            >
              {bg.name}
            </button>
          ))}

          <input
            type="file" ref={customBgInputRef} accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = evt => {
                setCustomBgDataUrl(evt.target.result);
                setAiBackground('custom');
              };
              reader.readAsDataURL(file);
              // reset input so same file can be re-uploaded
              e.target.value = '';
            }}
          />
          <button
            className={`cv2-pill ${aiBackground === 'custom' && customBgDataUrl ? 'active' : ''}`}
            onClick={() => customBgInputRef.current?.click()}
            title="Upload gambar sebagai background foto"
          >
            <Upload size={12} /> {customBgDataUrl ? '🖼️ Ganti BG' : '🖼️ Upload Custom BG'}
          </button>

          {/* Tombol Hapus Custom BG — muncul saat custom BG aktif */}
          {customBgDataUrl && (
            <button
              className="cv2-pill"
              style={{ borderColor: 'rgba(255,101,132,0.5)', color: '#FF6584', background: 'rgba(255,101,132,0.08)' }}
              onClick={() => {
                setCustomBgDataUrl(null);
                setAiBackground('none');
                if (customBgInputRef.current) customBgInputRef.current.value = '';
              }}
              title="Hapus custom background"
            >
              ✕ Hapus BG
            </button>
          )}
        </div>
      </div>

      {/* 🎭 3b. AR LIVE PROPS */}
      <div className="cv2-section">
        <div className="cv2-label">
          <span className="cv2-label-icon cv2-icon-gold"><Zap size={15} /></span>
          <span>AR Live Props (Live Camera)</span>
        </div>
        <div className="cv2-pills">
          {AR_PROPS.map(p => (
            <button
              key={p.id}
              className={`cv2-pill ${arProp === p.id ? 'active' : ''}`}
              onClick={() => setArProp(p.id)}
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* ⚙️ 4. CUSTOMIZATION & STICKERS */}
      <div className="cv2-section">
        <div className="cv2-label">
          <span className="cv2-label-icon cv2-icon-gold"><Bookmark size={15} /></span>
          <span>Teks Studio &amp; Aksesoris</span>
        </div>

        <input
          type="text"
          className="cv2-title-input"
          value={titleText}
          onChange={e => setTitleText(e.target.value)}
          placeholder="Judul / Nama Studio kamu..."
        />

        <div className="cv2-extras-row">
          <button
            className={`cv2-toggle ${showGrain ? 'on' : ''}`}
            onClick={() => setShowGrain(!showGrain)}
          >
            🎞️ Grain {showGrain ? 'ON' : 'OFF'}
          </button>
          <button
            className={`cv2-toggle ${showLedDate ? 'on' : ''}`}
            onClick={() => setShowLedDate(!showLedDate)}
          >
            📟 Timestamp {showLedDate ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="cv2-sticker-row">
          <span style={{ fontSize: '0.72rem', color: '#9CA3AF', width: '100%', marginBottom: '4px' }}>
            Klik stiker untuk menambah ke strip (bisa digeser/drag):
          </span>
          {STICKERS.map(s => (
            <button
              key={s}
              className="cv2-sticker"
              onClick={() => {
                const newSticker = {
                  id: `stk-${Date.now()}-${Math.random()}`,
                  emoji: s,
                  xPercent: 50 + (Math.random() * 20 - 10),
                  yPercent: 50 + (Math.random() * 20 - 10),
                  size: 32,
                };
                if (typeof setPlacedStickers === 'function') {
                  setPlacedStickers(prev => [...prev, newSticker]);
                }
                if (typeof setSelectedLayer === 'function') setSelectedLayer({ type: 'sticker', id: newSticker.id });
              }}
              title="Klik untuk pasang stiker & drag ke foto"
            >
              {s}
            </button>
          ))}
        </div>

        <input
          type="file"
          ref={customStickerInputRef}
          accept="image/png,image/jpeg,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = evt => {
              const src = evt.target?.result;
              if (!src) return;
              const newSticker = {
                id: `stkimg-${Date.now()}-${Math.random()}`,
                imageSrc: src,
                xPercent: 50,
                yPercent: 50,
                size: 36,
                rotation: 0,
                cropZoom: 1,
                cropX: 50,
                cropY: 50,
              };
              if (typeof setPlacedStickers === 'function') {
                setPlacedStickers(prev => [...prev, newSticker]);
              }
              if (typeof setSelectedLayer === 'function') setSelectedLayer({ type: 'sticker', id: newSticker.id });
            };
            reader.readAsDataURL(file);
            e.target.value = '';
          }}
        />
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="cv2-pill"
            onClick={() => customStickerInputRef.current?.click()}
            title="Upload stiker PNG atau gambar sendiri"
          >
            🖼️ Upload Stiker PNG
          </button>
        </div>

        {/* Custom Uploaded Image Layers */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="file"
            ref={customImageInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = evt => {
                const src = evt.target?.result;
                if (!src) return;
                const newImage = {
                  id: `img-${Date.now()}-${Math.random()}`,
                  src,
                  xPercent: 50,
                  yPercent: 50,
                  widthPercent: 28,
                  rotation: 0,
                  opacity: 1,
                  cropZoom: 1,
                  cropX: 50,
                  cropY: 50,
                };
                setPlacedImages(prev => [...prev, newImage]);
                if (typeof setSelectedLayer === 'function') setSelectedLayer({ type: 'image', id: newImage.id });
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="cv2-pill"
              onClick={() => customImageInputRef.current?.click()}
              title="Unggah gambar untuk dipasang di strip foto"
            >
              🖼️ Upload Gambar
            </button>
            {placedImages.length > 0 && (
              <button
                className="cv2-pill"
                style={{ borderColor: 'rgba(255,71,87,0.4)', color: '#FF4757', background: 'rgba(255,71,87,0.08)' }}
                onClick={() => setPlacedImages([])}
              >
                🗑️ Hapus Gambar
              </button>
            )}
          </div>
        </div>

        {(selectedCaption || selectedSticker || selectedImage) && (
          <div style={{ marginTop: '12px', border: '1px solid rgba(124, 92, 252, 0.28)', background: 'rgba(15, 23, 42, 0.55)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                Layer Inspector
              </div>
              <button
                className="cv2-pill"
                style={{ padding: '4px 8px', minWidth: 'unset', borderColor: 'rgba(255,71,87,0.5)', color: '#FF9AA5', background: 'rgba(255,71,87,0.08)' }}
                onClick={removeSelectedLayer}
              >
                Hapus
              </button>
            </div>

            {selectedCaption && (
              <>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', color: '#9CA3AF' }}>
                  Font
                  <select
                    value={selectedCaption.fontFamily || '"Outfit", sans-serif'}
                    onChange={e => updateSelectedLayer({ fontFamily: e.target.value })}
                    style={{ background: '#0F172A', color: '#E5E7EB', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '8px', padding: '6px 8px' }}
                  >
                    {FONT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', color: '#9CA3AF' }}>
                  Ukuran Teks
                  <input
                    type="range"
                    min={12}
                    max={48}
                    value={selectedCaption.fontSize || 14}
                    onChange={e => updateSelectedLayer({ fontSize: Number(e.target.value) })}
                  />
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Warna:</span>
                  <input
                    type="color"
                    value={selectedCaption.color || '#FFFFFF'}
                    onChange={e => updateSelectedLayer({ color: e.target.value })}
                    style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className={`cv2-pill ${selectedCaption.shadow === false ? '' : 'active'}` } onClick={() => updateSelectedLayer({ shadow: !(selectedCaption.shadow === false) })}>Shadow {selectedCaption.shadow === false ? 'OFF' : 'ON'}</button>
                  <button className={`cv2-pill ${selectedCaption.stroke ? 'active' : ''}`} onClick={() => updateSelectedLayer({ stroke: !selectedCaption.stroke })}>Stroke {selectedCaption.stroke ? 'ON' : 'OFF'}</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['left', 'center', 'right'].map(alignment => (
                    <button
                      key={alignment}
                      className={`cv2-pill ${((selectedCaption.align || 'center') === alignment) ? 'active' : ''}`}
                      onClick={() => updateSelectedLayer({ align: alignment })}
                    >
                      {alignment === 'left' ? 'Kiri' : alignment === 'center' ? 'Tengah' : 'Kanan'}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(selectedSticker || selectedImage) && (
              <>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', color: '#9CA3AF' }}>
                  Ukuran
                  <input
                    type="range"
                    min={12}
                    max={120}
                    value={selectedSticker ? (selectedSticker.size || 36) : (selectedImage ? (selectedImage.widthPercent || 28) : 28)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (selectedSticker) updateSelectedLayer({ size: val });
                      if (selectedImage) updateSelectedLayer({ widthPercent: val });
                    }}
                  />
                </label>

                {activeImageCrop && (
                  <>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', color: '#9CA3AF' }}>
                      Zoom Crop
                      <input
                        type="range"
                        min={0.6}
                        max={2.5}
                        step={0.05}
                        value={activeImageCrop.cropZoom ?? 1}
                        onChange={e => updateSelectedLayer({ cropZoom: Number(e.target.value) })}
                      />
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', color: '#9CA3AF', flex: 1 }}>
                        Posisi X
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={activeImageCrop.cropX ?? 50}
                          onChange={e => updateSelectedLayer({ cropX: Number(e.target.value) })}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', color: '#9CA3AF', flex: 1 }}>
                        Posisi Y
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={activeImageCrop.cropY ?? 50}
                          onChange={e => updateSelectedLayer({ cropY: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </>
                )}

                {(selectedImage || selectedSticker) && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="cv2-pill" onClick={() => {
                      if (selectedImage) updateSelectedLayer({ rotation: (selectedImage.rotation || 0) - 15 });
                      if (selectedSticker) updateSelectedLayer({ rotation: (selectedSticker.rotation || 0) - 15 });
                    }}>↺ Putar</button>
                    <button className="cv2-pill" onClick={() => {
                      if (selectedImage) updateSelectedLayer({ rotation: (selectedImage.rotation || 0) + 15 });
                      if (selectedSticker) updateSelectedLayer({ rotation: (selectedSticker.rotation || 0) + 15 });
                    }}>↻ Putar</button>
                  </div>
                )}

                {selectedImage && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem', color: '#9CA3AF' }}>
                    Transparansi
                    <input
                      type="range"
                      min={0.2}
                      max={1}
                      step={0.05}
                      value={selectedImage.opacity ?? 1}
                      onChange={e => updateSelectedLayer({ opacity: Number(e.target.value) })}
                    />
                  </label>
                )}
              </>
            )}
          </div>
        )}

        {/* Floating Custom Captions Input */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className="cv2-title-input"
            style={{ marginBottom: 0, flex: 1, fontSize: '0.8rem' }}
            placeholder="Tambah Teks Bebas (mis: Happy Birthday! 💖)..."
            value={newCaptionText}
            onChange={e => setNewCaptionText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newCaptionText.trim()) {
                const newCap = {
                  id: `cap-${Date.now()}`,
                  text: newCaptionText.trim(),
                  color: newCaptionColor,
                  xPercent: 50,
                  yPercent: 50,
                  fontSize: 18,
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 800,
                  shadow: true,
                  stroke: false,
                  align: 'center',
                };
                if (typeof setPlacedCaptions === 'function') setPlacedCaptions(prev => [...prev, newCap]);
                if (typeof setSelectedLayer === 'function') setSelectedLayer({ type: 'caption', id: newCap.id });
                setNewCaptionText('');
              }
            }}
          />
          <input
            type="color"
            value={newCaptionColor}
            onChange={e => setNewCaptionColor(e.target.value)}
            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
            title="Warna Teks"
          />
          <button
            className="cv2-pill"
            style={{ background: 'var(--accent-gradient)', color: '#FFF', fontWeight: '700', padding: '8px 12px' }}
            onClick={() => {
              if (!newCaptionText.trim()) return;
              const newCap = {
                id: `cap-${Date.now()}`,
                text: newCaptionText.trim(),
                color: newCaptionColor,
                xPercent: 50,
                yPercent: 50,
                fontSize: 18,
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                shadow: true,
                stroke: false,
                align: 'center',
              };
              if (typeof setPlacedCaptions === 'function') setPlacedCaptions(prev => [...prev, newCap]);
              if (typeof setSelectedLayer === 'function') setSelectedLayer({ type: 'caption', id: newCap.id });
              setNewCaptionText('');
            }}
          >
            Tambah Teks ✍️
          </button>
        </div>

        {/* Clear Overlays Button if any placed */}
        {(placedStickers.length > 0 || placedCaptions.length > 0 || placedImages.length > 0) && (
          <button
            className="cv2-pill"
            style={{ marginTop: '10px', width: '100%', borderColor: 'rgba(255,71,87,0.4)', color: '#FF4757', background: 'rgba(255,71,87,0.08)' }}
            onClick={() => {
              if (typeof setPlacedStickers === 'function') setPlacedStickers([]);
              if (typeof setPlacedCaptions === 'function') setPlacedCaptions([]);
              if (typeof setPlacedImages === 'function') setPlacedImages([]);
              if (typeof setSelectedLayer === 'function') setSelectedLayer(null);
            }}
          >
            🗑️ Hapus Semua Layer ({placedStickers.length + placedCaptions.length + placedImages.length})
          </button>
        )}
      </div>

      {/* ✏️ 4b. DOODLE / CORAT-CORET */}
      <div className="cv2-section">
        <div className="cv2-label">
          <span className="cv2-label-icon cv2-icon-pink"><Edit3 size={15} /></span>
          <span>Doodle / Corat-Coret Strip</span>
        </div>
        <div className="cv2-extras-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button
            className={`cv2-toggle ${isDoodling ? 'on' : ''}`}
            onClick={() => setIsDoodling(!isDoodling)}
            style={isDoodling ? { background: 'linear-gradient(135deg,#FF6584,#7C5CFC)', color: '#fff', border: 'none' } : {}}
          >
            ✏️ {isDoodling ? 'Mode Coret AKTIF' : 'Aktifkan Coret'}
          </button>

          {isDoodling && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Warna:</span>
                <input
                  type="color"
                  value={brushColor}
                  onChange={e => setBrushColor(e.target.value)}
                  style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
                  title="Warna Kuas"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Ukuran:</span>
                {[3, 5, 10, 18].map(s => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    className={`cv2-pill ${brushSize === s ? 'active' : ''}`}
                    style={{ padding: '4px 8px', minWidth: 'unset' }}
                    title={`Ukuran kuas ${s}px`}
                  >
                    <span style={{ display: 'block', width: `${Math.min(s, 14)}px`, height: `${Math.min(s, 14)}px`, borderRadius: '50%', background: brushColor || '#FF6584', margin: '0 auto' }} />
                  </button>
                ))}
              </div>
              <button
                className="cv2-pill"
                style={{ borderColor: 'rgba(255,71,87,0.4)', color: '#FF4757', background: 'rgba(255,71,87,0.08)' }}
                onClick={() => setDoodlePaths([])}
              >
                🗑️ Hapus Coretan
              </button>
            </>
          )}
        </div>
      </div>

      {/* 🚀 5. ACTION TOOLBAR */}
      <div className="cv2-actions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
          <button
            className="cv2-btn-download"
            onClick={handleDownloadPng}
            disabled={isExporting || isExportingGif || isSharing || photos.filter(Boolean).length < 4}
          >
            <Download size={18} />
            <span>{isExporting ? 'Rendering...' : 'Unduh PNG 📸'}</span>
          </button>

          <button
            className="cv2-btn-download"
            style={{ background: 'linear-gradient(135deg, #7C5CFC, #FF6584)' }}
            onClick={handleDownloadGif}
            disabled={isExporting || isExportingGif || isSharing || photos.filter(Boolean).length < 4}
          >
            <Film size={18} />
            <span>{isExportingGif ? 'Bikin GIF...' : 'Unduh GIF 🎬'}</span>
          </button>
        </div>

        <div className="cv2-share-row">
          {typeof navigator !== 'undefined' && navigator.canShare && (
            <button
              className="cv2-btn-share cv2-btn-native"
              onClick={() => handleShare('native')}
              disabled={isSharing || photos.filter(Boolean).length < 4}
            >
              <Share2 size={14} /> <span>Share 📱</span>
            </button>
          )}
          <button
            className="cv2-btn-share cv2-btn-wa"
            onClick={() => handleShare('whatsapp')}
            disabled={isSharing || photos.filter(Boolean).length < 4}
          >
            💬 WhatsApp
          </button>
          <button
            className="cv2-btn-share cv2-btn-ig"
            onClick={() => handleShare('instagram')}
            disabled={isSharing || photos.filter(Boolean).length < 4}
          >
            📸 Instagram
          </button>
        </div>

        <div className="cv2-sec-row">
          <button
            className="cv2-btn-print"
            onClick={onOpenPrint}
            disabled={photos.filter(Boolean).length < 4}
          >
            <Printer size={15} /> <span>Cetak / Print 🖨️</span>
          </button>

          <button
            className="cv2-btn-gallery"
            onClick={onSaveToGallery}
            disabled={isSaving || photos.filter(Boolean).length === 0}
          >
            {isSaving ? <><span className="save-spinner" /> Menyimpan...</> : <>💾 Simpan Galeri</>}
          </button>
        </div>
      </div>
    </div>
  );
}

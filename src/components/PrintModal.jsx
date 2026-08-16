import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Printer, Download, Image } from 'lucide-react';
import { drawPhotoStripToCanvas } from '../utils/canvasExporter';

const DPI_OPTIONS = [
  { label: '📷 Standard 300 DPI', value: 1.0, badge: '560×1400px (300 DPI)', desc: 'Ukuran standar untuk layar HP & sosmed' },
  { label: '🖨️ High Studio 600 DPI', value: 2.0, badge: '1120×2800px (600 DPI)', desc: 'Cetak tajam standar studio 4R (3.1 MP)' },
  { label: '💎 Ultra HD 1200 DPI', value: 4.0, badge: '2240×5600px (1200 DPI)', desc: 'Super tajam 12.5 MP + Sub-Pixel Sharpness Filter' },
];

const LAYOUT_OPTIONS = [
  { label: '📄 Single Strip (4R)', value: 'single', desc: 'Satu strip di tengah halaman' },
  { label: '✂️ Dual 2-Up (Cut Sheet)', value: 'dual', desc: 'Dua strip berdampingan, potong setelah cetak' },
];

export default function PrintModal({
  photos,
  filter,
  frameTheme,
  layout,
  showGrain,
  showLedDate,
  titleText,
  sticker,
  fontStyle,
  doodlePaths,
  showQrCode,
  customFrameDataUrl,
  customBgDataUrl,
  placedStickers = [],
  placedCaptions = [],
  placedImages = [],
  watermarkText = null,
  watermarkOpacity = 0.4,
  onClose
}) {
  const printImgRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const [resolutionScale, setResolutionScale] = useState(2.0);   // default 600 DPI
  const [printLayout, setPrintLayout] = useState('single');
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isRendering, setIsRendering] = useState(false);

  // ── Render canvas whenever settings change ───────────────────
  const renderStrip = useCallback(async () => {
    if (!photos || photos.filter(Boolean).length === 0) return;

    try {
      setIsRendering(true);
      const canvas = hiddenCanvasRef.current;
      const selectedTheme = frameTheme;

      const dataUrl = await drawPhotoStripToCanvas(canvas, {
        photos,
        layout,
        frameTheme: selectedTheme,
        filter,
        showGrain,
        showLedDate,
        titleText: titleText || 'LIFE 4 CUTS 📸',
        fontStyle,
        sticker,
        doodlePaths: doodlePaths || [],
        showQrCode: showQrCode || false,
        customFrameUrl: customFrameDataUrl || null,
        customBgDataUrl: customBgDataUrl || null,
        placedStickers,
        placedCaptions,
        placedImages,
        watermarkText,
        watermarkOpacity,
        resolutionScale,
      });

      setPreviewDataUrl(dataUrl);
    } catch (err) {
      console.error('PrintModal render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [photos, layout, frameTheme, filter, showGrain, showLedDate, titleText, fontStyle, sticker, doodlePaths, showQrCode, resolutionScale, customFrameDataUrl, customBgDataUrl, placedStickers, placedCaptions, placedImages, watermarkText, watermarkOpacity]);

  useEffect(() => {
    renderStrip();
  }, [renderStrip]);

  // ── Print: inject image into hidden print DOM then window.print() ──
  const handlePrint = () => {
    if (!previewDataUrl) return;

    // Create a hidden iframe for clean print output
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const stripImgHtml = `<img src="${previewDataUrl}" style="display:block;width:100%;height:auto;" />`;
    const dualImgHtml = `
      <div style="display:flex;gap:4mm;align-items:flex-start;justify-content:center;">
        <img src="${previewDataUrl}" style="width:49%;height:auto;display:block;" />
        <img src="${previewDataUrl}" style="width:49%;height:auto;display:block;" />
      </div>`;

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Life 4 Cuts — Print</title>
  <style>
    @page {
      size: 4in 6in portrait;
      margin: 0mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 4in;
      height: 6in;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      overflow: hidden;
    }
    .print-wrap {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${printLayout === 'dual' ? '2mm' : '3mm'};
    }
    img {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  </style>
</head>
<body>
  <div class="print-wrap">
    ${printLayout === 'dual' ? dualImgHtml : stripImgHtml}
  </div>
</body>
</html>`);
    iframeDoc.close();

    iframe.contentWindow.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 300);
    };
  };

  // ── Save high-res PNG directly ──────────────────────────────
  const handleSavePng = () => {
    if (!previewDataUrl) return;
    const dpiLabel = DPI_OPTIONS.find(d => d.value === resolutionScale)?.badge || '';
    const link = document.createElement('a');
    link.download = `life4cuts-print-${dpiLabel}-${Date.now()}.png`;
    link.href = previewDataUrl;
    link.click();
  };

  const currentDpi = DPI_OPTIONS.find(d => d.value === resolutionScale);

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      <div className="print-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="print-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Printer size={20} color="#38EF7D" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Cetak / Print Studio 🖨️</h2>
          </div>
          <button className="btn-secondary print-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* DPI Resolution Selector */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.06em' }}>
            💎 RESOLUSI CETAK
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DPI_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setResolutionScale(opt.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: resolutionScale === opt.value ? '2px solid #38EF7D' : '1.5px solid rgba(255,255,255,0.12)',
                  background: resolutionScale === opt.value ? 'rgba(56,239,125,0.12)' : 'rgba(255,255,255,0.04)',
                  color: resolutionScale === opt.value ? '#38EF7D' : '#9CA3AF',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Print Layout Selector */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.06em' }}>
            📄 TATA LETAK CETAK
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {LAYOUT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPrintLayout(opt.value)}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: printLayout === opt.value ? '2px solid #7C5CFC' : '1.5px solid rgba(255,255,255,0.12)',
                  background: printLayout === opt.value ? 'rgba(124,92,252,0.12)' : 'rgba(255,255,255,0.04)',
                  color: printLayout === opt.value ? '#A78BFA' : '#9CA3AF',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                <div>{opt.label}</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.7 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="print-preview-wrapper" style={{ position: 'relative', minHeight: '180px' }}>
          {isRendering && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
              background: 'rgba(0,0,0,0.6)', borderRadius: '12px', zIndex: 10
            }}>
              <div className="save-spinner" style={{ width: '28px', height: '28px' }} />
              <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
                Rendering {currentDpi?.badge}...
              </span>
            </div>
          )}

          {printLayout === 'dual' && previewDataUrl ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <img
                ref={printImgRef}
                src={previewDataUrl}
                alt="Strip preview 1"
                style={{ flex: 1, maxWidth: '50%', height: 'auto', borderRadius: '8px', display: 'block' }}
              />
              <img
                src={previewDataUrl}
                alt="Strip preview 2"
                style={{ flex: 1, maxWidth: '50%', height: 'auto', borderRadius: '8px', display: 'block' }}
              />
            </div>
          ) : previewDataUrl ? (
            <img
              ref={printImgRef}
              src={previewDataUrl}
              alt="Strip preview"
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', display: 'block', margin: '0 auto' }}
            />
          ) : null}
        </div>

        {/* Info Bar */}
        <div style={{
          marginTop: '12px', padding: '8px 12px', background: 'rgba(56,239,125,0.06)',
          borderRadius: '8px', fontSize: '0.74rem', color: '#6B7280', lineHeight: 1.5
        }}>
          💡 <strong style={{ color: '#9CA3AF' }}>Tips Epson L3250:</strong> Pilih <em>Photo Paper / Glossy</em> di dialog printer, ukuran kertas <em>4x6" (4R)</em>, tanpa margin (borderless). Resolusi 600–1200 DPI menghasilkan cetakan tajam dan warna vivid.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            className="btn-primary"
            onClick={handlePrint}
            disabled={!previewDataUrl || isRendering}
            style={{ flex: 1, background: 'linear-gradient(135deg, #38EF7D 0%, #11998E 100%)' }}
          >
            <Printer size={18} />
            <span>Cetak / Print 🖨️</span>
          </button>
          <button
            className="btn-secondary"
            onClick={handleSavePng}
            disabled={!previewDataUrl || isRendering}
            style={{ flex: 1 }}
          >
            <Download size={18} />
            <span>Simpan PNG {currentDpi?.badge}</span>
          </button>
        </div>
      </div>

      {/* Global print CSS — clean 1-page, no browser headers */}
      <style>{`
        @page {
          size: 4in 6in portrait;
          margin: 0mm !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * { visibility: hidden !important; }
        }
      `}</style>
    </div>
  );
}

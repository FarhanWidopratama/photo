import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Download, Share2, Printer, RefreshCw, QrCode, Film } from 'lucide-react';

export default function CelebrationScreen({ photos, onDownload, onDownloadGif, onShare, onPrint, onReset }) {
  const [qrCodeData, setQrCodeData] = useState(null);

  useEffect(() => {
    // Generate QR Code linking to current app URL for instant mobile scan
    QRCode.toDataURL(window.location.href, {
      width: 100,
      margin: 1,
      color: { dark: '#FF6584', light: '#00000000' }
    }).then(setQrCodeData).catch(() => {});

    // Confetti burst
    const burst = () => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.55 },
        colors: ['#FF6584', '#38EF7D', '#7C5CFC', '#FFD15C', '#00FFFF'],
      });
    };

    burst();
    const t1 = setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.6 } });
      confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.6 } });
    }, 400);
    const t2 = setTimeout(burst, 900);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="celebration-screen">
      {/* Animated background */}
      <div className="celebration-bg" />

      <div className="celebration-content">
        {/* Header */}
        <div className="celebration-header">
          <div className="celebration-emoji">🎉</div>
          <h1 className="celebration-title">Foto Selesai!</h1>
          <p className="celebration-subtitle">Strip foto kamu sudah siap, bestie ✨</p>
        </div>

        {/* Photo Strip Preview (4 thumbnails) */}
        <div className="celebration-photos">
          {photos.map((photo, idx) => (
            photo ? (
              <div key={idx} className="celebration-photo-item">
                <img src={photo} alt={`Foto ${idx + 1}`} />
                <div className="celebration-photo-num">#{idx + 1}</div>
              </div>
            ) : null
          ))}
        </div>

        {/* Action Buttons */}
        <div className="celebration-actions">
          <div className="cel-btn-row">
            <button className="cel-btn cel-btn-primary" onClick={onDownload}>
              <Download size={18} />
              <span>Unduh PNG</span>
            </button>
            <button className="cel-btn cel-btn-primary" style={{ background: 'linear-gradient(135deg, #7C5CFC, #FF6584)' }} onClick={onDownloadGif}>
              <Film size={18} />
              <span>Unduh GIF 🎬</span>
            </button>
          </div>

          <div className="cel-btn-row">
            <button className="cel-btn cel-btn-wa" onClick={() => onShare('whatsapp')}>
              <span>💬</span>
              <span>WhatsApp</span>
            </button>
            <button className="cel-btn cel-btn-ig" onClick={() => onShare('instagram')}>
              <span>📸</span>
              <span>Instagram</span>
            </button>
          </div>

          <div className="cel-btn-row">
            <button className="cel-btn cel-btn-secondary" onClick={onPrint}>
              <Printer size={16} />
              <span>Cetak Foto</span>
            </button>
            <button className="cel-btn cel-btn-secondary" onClick={onReset}>
              <RefreshCw size={16} />
              <span>Sesi Baru</span>
            </button>
          </div>
        </div>

        {/* Mobile Instant Scan QR Badge */}
        {qrCodeData && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '8px 14px', width: '100%', marginTop: '4px'
          }}>
            <img src={qrCodeData} alt="QR Code Scan" style={{ width: '48px', height: '48px', borderRadius: '6px' }} />
            <div style={{ textAlign: 'left', fontSize: '0.74rem', color: '#9CA3AF' }}>
              <div style={{ fontWeight: '700', color: '#FF6584', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <QrCode size={13} /> Scan Kamera HP
              </div>
              <span>Scan QR ini untuk buka studio di HP teman kamu!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

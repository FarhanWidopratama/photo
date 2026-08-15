import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Download, Share2, Printer, RefreshCw, QrCode, Film } from 'lucide-react';

export default function CelebrationScreen({ photos, onDownload, onDownloadGif, onShare, onPrint, onReset, onRetakePhoto, kioskMode = false, stripDataUrl = null }) {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrTooBig, setQrTooBig] = useState(false);

  // Task 19.1: Reminder & timer states
  const [showSecondReminder, setShowSecondReminder] = useState(false);
  const hasDownloadedRef = useRef(false);

  // Task 19.2: Web Notifications states
  const [notifPermission, setNotifPermission] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifShown, setNotifShown] = useState(false);

  // Generate QR for strip delivery when stripDataUrl changes
  useEffect(() => {
    if (!stripDataUrl) return;

    // ~2MB base64 check: raw bytes × 1.37 overhead ≈ base64 length
    const isTooBig = stripDataUrl.length > 2 * 1024 * 1024 * 1.37;

    if (isTooBig) {
      setQrTooBig(true);
      return;
    }

    try {
      sessionStorage.setItem('pendingStrip', stripDataUrl);
    } catch (e) {
      // sessionStorage full or unavailable — fall back to fallback message
      setQrTooBig(true);
      return;
    }

    const shareUrl = `${window.location.origin}/share`;
    QRCode.toDataURL(shareUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#FF6584', light: '#00000000' }
    }).then(url => {
      setQrCodeData(url);
      setQrTooBig(false);
    }).catch(() => {
      setQrTooBig(true);
    });
  }, [stripDataUrl]);

  useEffect(() => {
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

    // Task 19.1: 30-second reminder timer
    const reminderTimer = setTimeout(() => {
      if (!hasDownloadedRef.current) setShowSecondReminder(true);
    }, 30000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(reminderTimer);
    };
  }, []);

  // Task 19.1: Wrapped download handlers that track download status
  const handleDownload = () => {
    hasDownloadedRef.current = true;
    setShowSecondReminder(false);
    if (onDownload) onDownload();
  };

  const handleDownloadGif = () => {
    hasDownloadedRef.current = true;
    setShowSecondReminder(false);
    if (onDownloadGif) onDownloadGif();
  };

  return (
    <div className="celebration-screen">
      {/* Animated background */}
      <div className="celebration-bg" />

      <div className="celebration-content">
        {/* Task 19.1: Inline save reminder - always visible at top */}
        <div className="save-reminder-inline">💾 Jangan lupa simpan foto ke galeri!</div>

        {/* Task 19.1: Urgent second reminder after 30s without downloading */}
        {showSecondReminder && (
          <div className="save-reminder-urgent pulse-animation">
            ⚠️ Hei! Jangan lupa unduh atau simpan foto kamu! 📸
          </div>
        )}

        {/* Header */}
        <div className="celebration-header">
          <div className="celebration-emoji">🎉</div>
          <h1 className="celebration-title">Foto Selesai!</h1>
          <p className="celebration-subtitle">Strip foto kamu sudah siap, bestie ✨</p>
        </div>

        {/* Photo Strip Preview (4 thumbnails) — Task 18.1: with retake button overlay */}
        <div className="celebration-photos">
          {photos.map((photo, idx) => (
            photo ? (
              <div key={idx} className="celebration-photo-item" style={{ position: 'relative' }}>
                <img src={photo} alt={`Foto ${idx + 1}`} />
                <div className="celebration-photo-num">#{idx + 1}</div>
                {onRetakePhoto && (
                  <button
                    className="celebration-retake-btn"
                    onClick={() => onRetakePhoto(idx)}
                    aria-label={`Ulang foto ${idx + 1}`}
                  >
                    🔄
                  </button>
                )}
              </div>
            ) : null
          ))}
        </div>

        {/* Action Buttons */}
        <div className="celebration-actions">
          <div className="cel-btn-row">
            <button className="cel-btn cel-btn-primary" onClick={handleDownload}>
              <Download size={18} />
              <span>Unduh PNG</span>
            </button>
            <button className="cel-btn cel-btn-primary" style={{ background: 'linear-gradient(135deg, #7C5CFC, #FF6584)' }} onClick={handleDownloadGif}>
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

          {kioskMode && (
            <button
              className="cel-btn cel-btn-primary"
              style={{
                width: '100%',
                fontSize: '1.2rem',
                padding: '18px 32px',
                marginTop: '8px',
                background: 'linear-gradient(135deg, #FF6584 0%, #7C5CFC 100%)',
                boxShadow: '0 8px 32px rgba(255, 101, 132, 0.45)',
                borderRadius: '16px',
                fontWeight: 800,
                letterSpacing: '0.01em',
              }}
              onClick={onReset}
            >
              🚀 Mulai Sesi Baru
            </button>
          )}

          {/* Task 19.2: Web Notifications toggle */}
          {typeof Notification !== 'undefined' && notifPermission !== 'denied' && !notifShown && (
            <div style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <span>🔔 Aktifkan notifikasi browser</span>
              <button
                onClick={async () => {
                  const perm = await Notification.requestPermission();
                  setNotifPermission(perm);
                  setNotifShown(true);
                  if (perm === 'granted') {
                    setNotifEnabled(true);
                    new Notification('Foto kamu sudah siap!', {
                      body: 'Tap untuk menyimpan foto Life 4 Cuts kamu.',
                      icon: '/favicon.ico',
                    });
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#D1D5DB',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                Aktifkan
              </button>
            </div>
          )}
        </div>

        {/* Mobile Strip Delivery QR Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '8px 14px', width: '100%', marginTop: '4px'
        }}>
          {qrTooBig ? (
            <div style={{ textAlign: 'left', fontSize: '0.74rem', color: '#9CA3AF', width: '100%' }}>
              📁 File foto terlalu besar untuk QR. Gunakan tombol Unduh PNG di atas.
            </div>
          ) : qrCodeData ? (
            <>
              <img src={qrCodeData} alt="QR Code Strip" style={{ width: '120px', height: '120px', borderRadius: '6px', flexShrink: 0 }} />
              <div style={{ textAlign: 'left', fontSize: '0.74rem', color: '#9CA3AF' }}>
                <div style={{ fontWeight: '700', color: '#FF6584', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <QrCode size={13} /> Ambil Foto di HP
                </div>
                <span>📱 Scan QR ini dengan kamera HP kamu untuk mendapatkan foto</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

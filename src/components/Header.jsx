import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, Images, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { getSessionCount } from '../utils/db';

export default function Header({ onReset, hasPhotos, onOpenGallery, soundEnabled, setSoundEnabled }) {
  const [galleryCount, setGalleryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    getSessionCount().then(setGalleryCount).catch(() => {});

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="app-header">
      <div className="brand-logo">
        <div className="logo-badge">📸</div>
        <div>
          <h1 className="brand-title">SEOUL SNAP</h1>
          <p className="brand-subtitle">Korean Photobooth Studio</p>
        </div>
      </div>

      <div className="header-status">
        <div className="badge-live">
          <span className="dot-pulse"></span>
          <span>STUDIO READY</span>
        </div>

        {/* Sound Toggle */}
        <button
          className={`btn-secondary header-sound-btn ${soundEnabled ? '' : 'sound-off'}`}
          onClick={() => setSoundEnabled(v => !v)}
          title={soundEnabled ? 'Matikan Suara & TTS Countdown' : 'Nyalakan Suara & TTS Countdown'}
          aria-label={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{soundEnabled ? 'Suara ON' : 'Suara OFF'}</span>
        </button>

        {/* Kiosk Fullscreen Toggle */}
        <button
          className="btn-secondary"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar Mode Kiosk / Fullscreen' : 'Layar Penuh (Kiosk Mode)'}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          <span>{isFullscreen ? 'Normal' : 'Kiosk Mode'}</span>
        </button>

        {/* Gallery Button */}
        <button
          className="btn-secondary header-gallery-btn"
          onClick={onOpenGallery}
          title="Buka Galeri Foto Tersimpan"
        >
          <Images size={16} />
          <span>Galeri</span>
          {galleryCount > 0 && (
            <span className="gallery-count-badge">{galleryCount}</span>
          )}
        </button>

        {hasPhotos && (
          <button className="btn-secondary" onClick={onReset} title="Mulai Sesi Baru">
            <RefreshCw size={16} />
            <span>Sesi Baru</span>
          </button>
        )}
      </div>
    </header>
  );
}

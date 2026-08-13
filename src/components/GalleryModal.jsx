import React, { useEffect, useState, useRef } from 'react';
import { X, Download, Trash2, Image, Calendar, Clock, Palette } from 'lucide-react';
import { getSessions, deleteSession } from '../utils/db';

const THEME_LABELS = {
  anime_sakura: '🌸 Sakura', anime_cyber: '⚡ Cyber', anime_neko: '🐾 Neko',
  anime_goth: '🖤 Goth', citypop_90s: '🌊 CityPop', boba_taro: '🧋 Boba',
  coquette_pink: '🎀 Coquette', cloud_dream: '☁️ Cloud', gothic_star: '✦ Stars',
  y2k_silver: '💿 Y2K', matcha_cream: '🍵 Matcha', butter_bear: '🧸 Butter',
  haru_white: '🤍 Haru', photomatic_black: '🖤 Matte', film_roll: '🎞️ Film',
};

const LAYOUT_LABELS = {
  strip1x4: '4-Cut Strip', grid2x2: 'Grid 2x2', hero1plus3: '1+3 Hero',
  strip1x3: '3-Cut', duo1x2: '2-Cut Duo', filmroll: 'Film Roll',
};

export default function GalleryModal({ onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [lightbox, setLightbox] = useState(null); // full-size view
  const overlayRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (e) {
      console.error('Gallery load error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    setDeleting(id);
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setDeleting(null);
    }
  }

  function handleDownload(session, e) {
    e.stopPropagation();
    if (!session.stripPng) return;
    const link = document.createElement('a');
    link.href = session.stripPng;
    link.download = `life4cuts-${session.id}.png`;
    link.click();
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div className="gallery-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="gallery-modal">
        {/* Header */}
        <div className="gallery-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="gallery-icon-badge">🖼️</div>
            <div>
              <h2 className="gallery-title">Galeri Foto Saya</h2>
              <p className="gallery-subtitle">
                {loading ? 'Memuat...' : `${sessions.length} strip foto tersimpan`}
              </p>
            </div>
          </div>
          <button className="gallery-close-btn" onClick={onClose} aria-label="Tutup Galeri">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="gallery-body">
          {loading ? (
            <div className="gallery-empty">
              <div className="gallery-loading-spinner" />
              <p>Memuat galeri...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="gallery-empty">
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📷</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: '#F3F4F6' }}>
                Galeri Masih Kosong
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#9CA3AF', maxWidth: '280px', textAlign: 'center', lineHeight: 1.6 }}>
                Selesaikan sesi foto (4 jepretan), lalu klik tombol{' '}
                <strong style={{ color: '#FF6584' }}>💾 Simpan ke Galeri</strong> untuk menyimpan strip fotomu!
              </p>
            </div>
          ) : (
            <div className="gallery-grid">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="gallery-card"
                  onClick={() => setLightbox(session)}
                  title="Klik untuk lihat penuh"
                >
                  {/* Thumbnail */}
                  <div className="gallery-card-thumb">
                    {session.stripPng ? (
                      <img src={session.stripPng} alt="Strip Foto" className="gallery-thumb-img" />
                    ) : (
                      <div className="gallery-thumb-placeholder">
                        <Image size={28} />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="gallery-card-overlay">
                      <span className="gallery-view-hint">👁️ Lihat</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="gallery-card-info">
                    <div className="gallery-card-theme">
                      {THEME_LABELS[session.theme] || session.theme}
                    </div>
                    <div className="gallery-card-meta">
                      <span className="gallery-card-layout">{LAYOUT_LABELS[session.layout] || session.layout}</span>
                    </div>
                    <div className="gallery-card-date">
                      <Calendar size={10} style={{ flexShrink: 0 }} />
                      <span>{session.dateFormatted || session.date?.slice(0, 10)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="gallery-card-actions">
                    <button
                      className="gallery-action-btn gallery-btn-download"
                      onClick={(e) => handleDownload(session, e)}
                      title="Download PNG"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      className={`gallery-action-btn gallery-btn-delete ${deleting === session.id ? 'deleting' : ''}`}
                      onClick={(e) => handleDelete(session.id, e)}
                      title="Hapus foto"
                      disabled={deleting === session.id}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer stats */}
        {!loading && sessions.length > 0 && (
          <div className="gallery-footer">
            <span>📸 {sessions.length} foto</span>
            <span style={{ color: '#6B7280' }}>•</span>
            <span>💾 Disimpan di browser kamu</span>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="gallery-lightbox" onClick={() => setLightbox(null)}>
          <div className="gallery-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="gallery-lightbox-close" onClick={() => setLightbox(null)}>
              <X size={18} />
            </button>
            {lightbox.stripPng && (
              <img src={lightbox.stripPng} alt="Strip Foto Penuh" className="gallery-lightbox-img" />
            )}
            <div className="gallery-lightbox-meta">
              <span>{THEME_LABELS[lightbox.theme]}</span>
              <span>•</span>
              <span>{LAYOUT_LABELS[lightbox.layout]}</span>
              <span>•</span>
              <span>{lightbox.dateFormatted}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={() => handleDownload(lightbox, { stopPropagation: () => {} })}
              >
                <Download size={16} /> Download PNG
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '10px 18px' }}
                onClick={(e) => { handleDelete(lightbox.id, e); setLightbox(null); }}
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, Upload, Disc, Heart, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { saveToPlaylist, getPlaylist, deleteFromPlaylist, saveSettings, loadSettings } from '../utils/db';

const PRESET_TRACKS = [
  {
    id: 'lofi_korean',
    title: '🌸 K-Vibe Lo-Fi Chill',
    artist: 'Seoul Studio BGM',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  },
  {
    id: 'kpop_upbeat',
    title: '✨ Idol Pop Upbeat',
    artist: 'Haru Photobooth Hits',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a7315b.mp3?filename=pop-dance-10920.mp3'
  },
  {
    id: 'citypop_90s',
    title: '🌊 90s City Pop Beat',
    artist: 'Tokyo Studio Wave',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=synthwave-80s-110045.mp3'
  },
  {
    id: 'aesthetic_cafe',
    title: '☕️ Cafe Piano & Acoustic',
    artist: 'Hongdae Cafe Session',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=chill-abstract-intention-12099.mp3'
  }
];

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const [currentTrack, setCurrentTrack] = useState(PRESET_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [savedPlaylist, setSavedPlaylist] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0); // track how many files being processed

  // ── Load music prefs + saved playlist from IndexedDB on mount ──
  useEffect(() => {
    loadSettings().then(saved => {
      if (saved?.musicVolume !== undefined) setVolume(saved.musicVolume);
      if (saved?.musicMuted  !== undefined) setIsMuted(saved.musicMuted);
      if (saved?.lastTrackId) {
        const found = PRESET_TRACKS.find(t => t.id === saved.lastTrackId);
        if (found) setCurrentTrack(found);
      }
    }).catch(() => {});

    getPlaylist().then(setSavedPlaylist).catch(() => {});
  }, []);

  // ── Sync volume & mute to audio element ──────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // ── Persist music prefs whenever they change ─────────────────
  useEffect(() => {
    saveSettings({ musicVolume: volume, musicMuted: isMuted, lastTrackId: currentTrack.id }).catch(() => {});
  }, [volume, isMuted, currentTrack.id]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        console.warn('Audio autoplay blocked:', err);
      });
    }
  };

  const handleSelectPreset = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleSelectSaved = (track) => {
    const src = track.audioDataUrl || track.youtubeUrl;

    if (!src || src.startsWith('blob:')) {
      // Auto cleanup expired blob tracks
      deleteFromPlaylist(track.id).catch(() => {});
      setSavedPlaylist(prev => prev.filter(s => s.id !== track.id));
      alert(`Lagu "${track.title}" adalah versi lama (expired). Sudah otomatis dibersihkan. Silakan upload ulang MP3-nya ya!`);
      return;
    }

    const t = { id: `saved_${track.id}`, title: `🎵 ${track.title}`, artist: 'Playlist Tersimpan', url: src };
    setCurrentTrack(t);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.load();
      audioRef.current.play().catch((err) => {
        console.warn('Playback failed:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleDeleteSaved = async (id, e) => {
    e.stopPropagation();
    await deleteFromPlaylist(id).catch(() => {});
    setSavedPlaylist(prev => prev.filter(s => s.id !== id));
  };

  // ── Upload multiple MP3 files at once ────────────────────────
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingCount(files.length);
    let firstTrack = null;

    files.forEach((file, idx) => {
      const name = file.name.replace(/\.[^/.]+$/, '');
      const reader = new FileReader();
      reader.onload = (evt) => {
        const audioDataUrl = evt.target.result;

        // Play first uploaded file immediately
        if (idx === 0) {
          firstTrack = { id: 'custom', title: `🎵 ${file.name}`, artist: 'Lagu Pilihan Kamu', url: audioDataUrl };
          setCurrentTrack(firstTrack);
          setIsPlaying(true);
          if (audioRef.current) {
            audioRef.current.src = audioDataUrl;
            audioRef.current.load();
            audioRef.current.play().catch(() => {});
          }
        }

        // Save all files to IndexedDB
        saveToPlaylist({ title: name, youtubeUrl: audioDataUrl, audioDataUrl }).then(id => {
          setSavedPlaylist(prev => [
            { id, title: name, youtubeUrl: audioDataUrl, audioDataUrl, addedAt: new Date().toISOString() },
            ...prev
          ]);
        }).catch(() => {});

        setUploadingCount(prev => Math.max(0, prev - 1));
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same files can be re-selected & new uploads always work
    e.target.value = '';
  };

  return (
    <div className="music-player-wrap">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        loop
        onEnded={() => setIsPlaying(false)}
      />

      {/* ── Main bar: track info + controls ─────────────── */}
      <div className="music-player-bar">
        {/* Track Info */}
        <div className="music-track-info">
          <div className={`music-disc ${isPlaying ? 'spinning' : ''}`}>
            <Disc size={18} color="#FF6584" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="music-title">{currentTrack.title}</span>
            <span className="music-artist">{currentTrack.artist}</span>
          </div>
        </div>

        {/* Main Play Controls */}
        <div className="music-controls">
          <button
            className="music-play-btn"
            onClick={togglePlay}
            title={isPlaying ? 'Pause Musik' : 'Putar Musik'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
          </button>

          <div className="music-volume-box">
            <button className="music-icon-btn" onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isMuted) setIsMuted(false); }}
              className="volume-slider"
            />
          </div>
        </div>
      </div>

      {/* ── Playlist chip row ────────────────────────────── */}
      <div className="music-playlist-row">
        {PRESET_TRACKS.map(t => (
          <button
            key={t.id}
            className={`music-track-chip ${currentTrack.id === t.id ? 'active' : ''}`}
            onClick={() => handleSelectPreset(t)}
          >
            {t.title}
          </button>
        ))}

        {/* Saved playlist toggle */}
        {savedPlaylist.length > 0 && (
          <button
            className={`music-track-chip ${showSaved ? 'active' : ''}`}
            onClick={() => setShowSaved(!showSaved)}
            style={{ borderColor: showSaved ? '#FF6584' : undefined }}
          >
            <Heart size={11} />
            <span>Favorit ({savedPlaylist.length})</span>
            {showSaved ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}

        {/* Custom MP3 Upload — multiple files supported */}
        <input
          type="file" ref={fileInputRef}
          accept="audio/mp3,audio/wav,audio/m4a,audio/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          className="music-track-chip upload-chip"
          onClick={() => fileInputRef.current?.click()}
          title="Upload MP3 — bisa pilih banyak sekaligus, tersimpan ke Favorit"
          disabled={uploadingCount > 0}
        >
          <Upload size={12} />
          <span>{uploadingCount > 0 ? `Menyimpan ${uploadingCount} lagu...` : '+ Upload MP3'}</span>
        </button>
      </div>

      {/* ── Saved playlist — INLINE, tidak overlay ───────── */}
      {showSaved && savedPlaylist.length > 0 && (
        <div className="music-saved-playlist">
          <div className="music-saved-header">
            ❤️ Playlist Tersimpan ({savedPlaylist.length} lagu)
          </div>
          {savedPlaylist.map(s => (
            <div
              key={s.id}
              className={`music-saved-item ${currentTrack.id === `saved_${s.id}` ? 'playing' : ''}`}
              onClick={() => handleSelectSaved(s)}
            >
              <div className="music-saved-icon">🎵</div>
              <span className="music-saved-title">{s.title}</span>
              <button
                className="music-saved-delete"
                onClick={(e) => handleDeleteSaved(s.id, e)}
                title="Hapus dari Favorit"
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

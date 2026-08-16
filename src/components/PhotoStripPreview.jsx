import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import DoodleCanvas from './DoodleCanvas';
import DraggableOverlayLayer from './DraggableOverlayLayer';
import { getQrColor } from '../config/frameThemes';

export default function PhotoStripPreview({
  photos,
  layout,
  frameTheme,
  customFrameColor,
  filter,
  showGrain,
  showLedDate,
  showQrCode,
  titleText,
  fontStyle,
  sticker,
  customFrameDataUrl,
  customBgDataUrl,
  onRetakePhoto,
  placedStickers = [],
  setPlacedStickers,
  placedCaptions = [],
  setPlacedCaptions,
  placedImages = [],
  setPlacedImages,
  doodlePaths,
  setDoodlePaths,
  isDoodling,
  brushColor,
  brushSize,
  selectedLayer,
  setSelectedLayer,
  watermarkText = null,
  watermarkOpacity = 0.4,
}) {
  const frameRef = useRef(null);
  const [frameDimensions, setFrameDimensions] = useState({ width: 280, height: 620 });
  const [qrDataUrl, setQrDataUrl] = useState(null);

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const update = () => {
      setFrameDimensions({
        width: node.offsetWidth,
        height: node.offsetHeight
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [layout, frameTheme, photos]);

  // Generate QR Code
  useEffect(() => {
    if (!showQrCode) { setQrDataUrl(null); return; }
    const darkColor = getQrColor(frameTheme);
    QRCode.toDataURL(window.location.href, {
      width: 60,
      margin: 1,
      color: { dark: darkColor, light: '#00000000' }
    }).then(setQrDataUrl).catch(() => {});
  }, [showQrCode, frameTheme]);

  const getFontFamily = () => {
    if (fontStyle === 'handwritten') return '"Pacifico", cursive';
    if (fontStyle === 'grotesk') return '"Space Grotesk", sans-serif';
    return '"Outfit", sans-serif';
  };

  // ─── Theme Configuration ───────────────────────────────────────────────────
  const THEMES = {
    anime_sakura: {
      wrapperClass: 'theme-anime-sakura',
      headerColor: '#7A1C43',
      footerColor: '#7A1C43',
      topDeco: <SakuraTopBorder />,
      bottomDeco: <SakuraBottomDeco />,
      cornerEmoji: { tl: '🌸', tr: '🌙', bl: '🌺', br: '✨' },
      titleDefault: '桜 SAKURA STUDIO 🌸',
      borderStyle: '3px solid #FFB7C5',
    },
    anime_chibi: {
      wrapperClass: 'theme-anime-chibi',
      headerColor: '#C71585',
      footerColor: '#C71585',
      topDeco: <AnimeTopBorder />,
      bottomDeco: <AnimeChibiBottomDeco />,
      cornerEmoji: { tl: '🍡', tr: '✨', bl: '🎀', br: '🌸' },
      titleDefault: '🍡 ANIME CHIBI FEST 🌸',
      borderStyle: '3px solid #FF91A4',
    },
    hari_guru: {
      wrapperClass: 'theme-hari-guru',
      headerColor: '#1B365D',
      footerColor: '#1B365D',
      topDeco: <SchoolTopBorder />,
      bottomDeco: <HariGuruBottomDeco />,
      cornerEmoji: { tl: '🎓', tr: '📚', bl: '✏️', br: '🌟' },
      titleDefault: '🏫 HARI GURU & DIES NATALIS 🎓',
      borderStyle: '3px solid #4A90E2',
    },
    birthday_bash: {
      wrapperClass: 'theme-birthday',
      headerColor: '#E65100',
      footerColor: '#E65100',
      topDeco: <BirthdayTopBorder />,
      bottomDeco: <BirthdayBottomDeco />,
      cornerEmoji: { tl: '🎂', tr: '🎈', bl: '🎉', br: '🎁' },
      titleDefault: '🎉 HAPPY BIRTHDAY PARTY 🎂',
      borderStyle: '3px solid #F57F17',
    },
    anime_cyber: {
      wrapperClass: 'theme-anime-cyber',
      headerColor: '#00FFFF',
      footerColor: '#00FFFF',
      topDeco: <CyberTopBorder />,
      bottomDeco: <CyberBottomDeco />,
      cornerEmoji: { tl: '⚡', tr: '🔮', bl: '🍥', br: '⚡' },
      titleDefault: '⚡ CYBER OTAKU ⚡',
      borderStyle: '2px solid #00FFFF',
    },
    anime_neko: {
      wrapperClass: 'theme-anime-neko',
      headerColor: '#8C3D2B',
      footerColor: '#8C3D2B',
      topDeco: <NekoPawBorder />,
      bottomDeco: null,
      cornerEmoji: { tl: '🐾', tr: '🐱', bl: '🐾', br: '🐱' },
      titleDefault: '🐾 NEKO PHOTO 🐱',
      borderStyle: '3px solid #FFB5A0',
    },
    anime_goth: {
      wrapperClass: 'theme-anime-goth',
      headerColor: '#DDA0DD',
      footerColor: '#DDA0DD',
      topDeco: <GothBorder />,
      bottomDeco: <GothBottomDeco />,
      cornerEmoji: { tl: '🖤', tr: '🔮', bl: '✝️', br: '🦋' },
      titleDefault: '🖤 DARK LOLITA 🔮',
      borderStyle: '2px solid rgba(221,160,221,0.5)',
    },
    citypop_90s: {
      wrapperClass: 'theme-citypop',
      headerColor: '#FFFFFF',
      footerColor: '#FFFF00',
      topDeco: <CityPopBorder />,
      bottomDeco: null,
      cornerEmoji: { tl: '🌊', tr: '🎧', bl: '🌴', br: '🎵' },
      titleDefault: '🌊 CITY POP 90s 🎧',
      borderStyle: '3px solid #00BFFF',
    },
    boba_taro: {
      wrapperClass: 'theme-boba',
      headerColor: '#4A255B',
      footerColor: '#4A255B',
      topDeco: <BobaBorder />,
      bottomDeco: null,
      cornerEmoji: { tl: '🧋', tr: '🍡', bl: '🍮', br: '💜' },
      titleDefault: '🧋 BOBA CAFÉ 🍡',
      borderStyle: '3px solid #CDB4DB',
    },
    coquette_pink: {
      wrapperClass: 'theme-coquette',
      headerColor: '#9B2335',
      footerColor: '#9B2335',
      topDeco: <CoquetteBorder />,
      bottomDeco: <CoquetteBottomDeco />,
      cornerEmoji: { tl: '🎀', tr: '💖', bl: '🎀', br: '🌹' },
      titleDefault: '🎀 COQUETTE STUDIO 🌹',
      borderStyle: '3px solid #FFB6C1',
    },
    cloud_dream: {
      wrapperClass: 'theme-cloud',
      headerColor: '#4A5568',
      footerColor: '#4A5568',
      topDeco: <CloudBorder />,
      bottomDeco: null,
      cornerEmoji: { tl: '☁️', tr: '🌈', bl: '✨', br: '🌟' },
      titleDefault: '☁️ CLOUD DREAM 🌈',
      borderStyle: '3px solid #B8C8FF',
    },
    gothic_star: {
      wrapperClass: 'theme-gothic-star',
      headerColor: '#C8A2C8',
      footerColor: '#C8A2C8',
      topDeco: <StarBorder />,
      bottomDeco: <StarBottomDeco />,
      cornerEmoji: { tl: '✦', tr: '✧', bl: '✧', br: '✦' },
      titleDefault: '✦ MIDNIGHT STAR ✧',
      borderStyle: '1px solid rgba(200,162,200,0.4)',
    },
    y2k_silver: {
      wrapperClass: 'theme-y2k',
      headerColor: '#1A2332',
      footerColor: '#1A2332',
      topDeco: <Y2KBorder />,
      bottomDeco: null,
      cornerEmoji: { tl: '💿', tr: '⭐', bl: '💎', br: '🔥' },
      titleDefault: '💿 Y2K CHROME 🔥',
      borderStyle: '3px solid #C0C0C0',
    },
    matcha_cream: {
      wrapperClass: 'theme-matcha',
      headerColor: '#2D5016',
      footerColor: '#2D5016',
      topDeco: <MatchaBorder />,
      bottomDeco: null,
      cornerEmoji: { tl: '🍵', tr: '🌿', bl: '🍃', br: '🌱' },
      titleDefault: '🍵 MATCHA CAFÉ 🌿',
      borderStyle: '3px solid #5B8A3C',
    },
    butter_bear: {
      wrapperClass: 'theme-butter',
      headerColor: '#6B4E2D',
      footerColor: '#6B4E2D',
      topDeco: <ButterBorder />,
      bottomDeco: null,
      cornerEmoji: { tl: '🧸', tr: '🌼', bl: '🍯', br: '🌻' },
      titleDefault: '🧸 BUTTER BEAR 🌼',
      borderStyle: '3px solid #F4C430',
    },
    haru_white: {
      wrapperClass: 'theme-haru',
      headerColor: '#121212',
      footerColor: '#888',
      topDeco: <HaruBorder />,
      bottomDeco: null,
      cornerEmoji: null,
      titleDefault: 'LIFE 4 CUTS 📸',
      borderStyle: '2px solid #E5E5E5',
    },
    photomatic_black: {
      wrapperClass: 'theme-photomatic',
      headerColor: '#FFFFFF',
      footerColor: '#AAAAAA',
      topDeco: null,
      bottomDeco: null,
      cornerEmoji: null,
      titleDefault: '📸 PHOTOMATIC',
      borderStyle: 'none',
    },
    custom_png: {
      wrapperClass: 'theme-custom-png',
      headerColor: '#121212',
      footerColor: '#121212',
      topDeco: null,
      bottomDeco: null,
      cornerEmoji: null,
      titleDefault: 'LIFE 4 CUTS 📸',
      borderStyle: 'none',
    },
    custom_color: {
      wrapperClass: 'theme-custom-color',
      headerColor: '#FFFFFF',
      footerColor: '#FFFFFF',
      topDeco: null,
      bottomDeco: null,
      cornerEmoji: null,
      titleDefault: 'LIFE 4 CUTS 📸',
      borderStyle: 'none',
    },
    film_roll: {
      wrapperClass: 'theme-film',
      headerColor: '#FFFFFF',
      footerColor: '#FFCC00',
      topDeco: null,
      bottomDeco: null,
      cornerEmoji: null,
      titleDefault: '🎞️ LIFE 4 CUTS FILM',
      borderStyle: 'none',
    },
  };

  const theme = THEMES[frameTheme] || THEMES.haru_white;
  const photoCount = layout === 'duo1x2' ? 2 : layout === 'strip1x3' ? 3 : layout === 'photocard' ? 1 : 4;

  return (
    <div className="glass-panel strip-preview-card">
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px' }}>
          👁️ Live Life4Cuts Pratinjau
        </h3>
        {isDoodling && (
          <span className="doodle-active-badge">✏️ Mode Corat-Coret ON</span>
        )}
      </div>

      {/* Interactive Photo Strip Container */}
      <div
        ref={frameRef}
        className={`strip-frame-wrapper ${theme.wrapperClass} layout-${layout}`}
        style={{
          width: (layout === 'grid2x2' || layout === 'hero1plus3') ? '310px' : layout === 'photocard' ? '220px' : '270px',
          position: 'relative',
          border: theme.borderStyle,
          ...(frameTheme === 'custom_color' && customFrameColor ? { background: customFrameColor } : {}),
        }}
      >
        {/* Draggable Stickers & Floating Text Captions */}
        <DraggableOverlayLayer
          containerWidth={frameDimensions.width}
          containerHeight={frameDimensions.height}
          placedStickers={placedStickers}
          setPlacedStickers={setPlacedStickers}
          placedCaptions={placedCaptions}
          setPlacedCaptions={setPlacedCaptions}
          placedImages={placedImages}
          setPlacedImages={setPlacedImages}
          selectedLayer={selectedLayer}
          setSelectedLayer={setSelectedLayer}
        />

        {/* Custom Uploaded PNG Frame Overlay */}
        {customFrameDataUrl && (
          <img
            src={customFrameDataUrl}
            alt="Custom Overlay Frame"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />
        )}

        {/* Top Decoration */}
        {theme.topDeco}

        {/* Doodle Drawing Layer */}
        <DoodleCanvas
          width={frameDimensions.width}
          height={frameDimensions.height}
          brushColor={brushColor}
          brushSize={brushSize}
          doodlePaths={doodlePaths}
          setDoodlePaths={setDoodlePaths}
          isDoodling={isDoodling}
        />

        {/* Film Roll Sprocket Holes */}
        {(layout === 'filmroll' || frameTheme === 'film_roll') && (
          <div className="sprocket-holes-overlay">
            <div className="sprocket-column left" />
            <div className="sprocket-column right" />
          </div>
        )}

        {/* Corner Emojis */}
        {theme.cornerEmoji && (
          <>
            <div className="theme-motif motif-top-left">{theme.cornerEmoji.tl}</div>
            <div className="theme-motif motif-top-right">{theme.cornerEmoji.tr}</div>
            <div className="theme-motif motif-bottom-left">{theme.cornerEmoji.bl}</div>
            <div className="theme-motif motif-bottom-right">{theme.cornerEmoji.br}</div>
          </>
        )}

        {/* Studio Title Header */}
        <div
          className="strip-header-title"
          style={{ fontFamily: getFontFamily(), color: theme.headerColor }}
        >
          {titleText || theme.titleDefault}
        </div>

        {/* Photos Grid Layout */}
        <div className={`strip-photos-container layout-${layout}`}>
          {Array.from({ length: photoCount }).map((_, idx) => (
            <div
              key={idx}
              className={`strip-photo-item slot-${idx} ${onRetakePhoto ? 'interactive-slot' : ''}`}
              style={{
                cursor: onRetakePhoto ? 'pointer' : 'default',
                position: 'relative',
                ...(customBgDataUrl ? {
                  backgroundImage: `url(${customBgDataUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                } : {})
              }}
              onClick={() => {
                if (onRetakePhoto) onRetakePhoto(idx);
              }}
              title={onRetakePhoto ? `Klik untuk Retake / Foto Ulang #${idx + 1}` : undefined}
            >
              {photos[idx] ? (
                <>
                  <img
                    src={photos[idx]}
                    alt={`Strip Photo ${idx + 1}`}
                    className={`filter-${filter}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Hover Retake Badge */}
                  {onRetakePhoto && (
                    <div className="preview-retake-overlay">
                      <span>📸 Retake #{idx + 1}</span>
                    </div>
                  )}
                  {/* LED Date Stamp */}
                  {showLedDate && (
                    <div className="led-timestamp">
                      '{String(new Date().getFullYear()).slice(-2)} {String(new Date().getMonth() + 1).padStart(2, '0')} {String(new Date().getDate()).padStart(2, '0')}
                    </div>
                  )}
                  {/* Film Grain Noise */}
                  {showGrain && <div className="film-grain-overlay" />}
                </>
              ) : (
                <div className="empty-photo-slot">
                  <span style={{ fontSize: '1.4rem', opacity: 0.4 }}>📷</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.35, marginTop: '4px' }}>
                    {onRetakePhoto ? `Klik utk foto #${idx + 1}` : `Shot #${idx + 1}`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Decoration */}
        {theme.bottomDeco}

        {/* Strip Footer */}
        <div className="strip-footer" style={{ color: theme.footerColor }}>
          <div className="strip-date">{formattedDate}</div>
          <div className="strip-tag">LIFE 4 CUTS • STUDIO EDITION</div>
          {sticker && <div className="strip-sticker">{sticker}</div>}

          {/* QR Code */}
          {showQrCode && qrDataUrl && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <img src={qrDataUrl} alt="QR Code" style={{ width: '44px', height: '44px' }} />
              <span style={{ fontSize: '0.55rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                scan & share
              </span>
            </div>
          )}
        </div>

        {/* Watermark Overlay — CSS only, purely visual preview */}
        {watermarkText && watermarkOpacity > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '10px',
            fontSize: '0.6rem',
            fontWeight: 'bold',
            color: '#888',
            opacity: watermarkOpacity,
            pointerEvents: 'none',
            zIndex: 10,
            letterSpacing: '0.3px',
          }}>
            {watermarkText}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Decorative Border Components ──────────────────────────────────────────

function SakuraTopBorder() {
  return (
    <div className="frame-deco frame-deco-sakura-top">
      <div className="sakura-petals-row">
        {['🌸','🌺','🌸','🌺','🌸','🌺','🌸'].map((p, i) => (
          <span key={i} className="sakura-petal" style={{ animationDelay: `${i * 0.15}s` }}>{p}</span>
        ))}
      </div>
      <div className="sakura-vine" />
    </div>
  );
}

function SakuraBottomDeco() {
  return (
    <div className="frame-deco frame-deco-sakura-bottom">
      <div className="sakura-vine" />
      <div style={{ fontSize: '0.7rem', color: '#C75480', letterSpacing: '3px', textAlign: 'center', marginTop: '4px', fontWeight: '700' }}>
        ✿ 桜 STUDIO ✿
      </div>
    </div>
  );
}

function CyberTopBorder() {
  return (
    <div className="frame-deco frame-deco-cyber-top">
      <div className="cyber-line-top" />
      <div className="cyber-scanlines" />
      <div className="cyber-corner-tl" />
      <div className="cyber-corner-tr" />
      <div style={{ fontSize: '0.6rem', color: '#00FFFF', fontFamily: 'monospace', letterSpacing: '2px', textAlign: 'center', padding: '4px 0' }}>
        ▸▸ CYBER_STUDIO v2.0 ◂◂
      </div>
    </div>
  );
}

function CyberBottomDeco() {
  return (
    <div className="frame-deco frame-deco-cyber-bottom">
      <div className="cyber-line-bottom" />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '4px' }}>
        <span style={{ fontSize: '0.55rem', color: '#7B2FBE', fontFamily: 'monospace' }}>SYS:OK</span>
        <span style={{ fontSize: '0.55rem', color: '#00FFFF', fontFamily: 'monospace' }}>■■■■■</span>
        <span style={{ fontSize: '0.55rem', color: '#7B2FBE', fontFamily: 'monospace' }}>FPS:60</span>
      </div>
    </div>
  );
}

function NekoPawBorder() {
  return (
    <div className="frame-deco frame-deco-neko">
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', padding: '4px 8px' }}>
        {['🐾','🐱','🐾','🐱','🐾'].map((e, i) => (
          <span key={i} style={{ fontSize: '1rem', animation: `bouncePaw 0.8s ${i * 0.12}s ease-in-out infinite alternate` }}>{e}</span>
        ))}
      </div>
      <div className="neko-stripe" />
    </div>
  );
}

function GothBorder() {
  return (
    <div className="frame-deco frame-deco-goth">
      <div className="goth-lace-top" />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '4px 0' }}>
        {'✦✧✦✧✦✧✦✧✦'.split('').map((c, i) => (
          <span key={i} style={{ fontSize: '0.75rem', color: '#DDA0DD', opacity: 0.8 }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

function GothBottomDeco() {
  return (
    <div className="frame-deco frame-deco-goth-bottom">
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', padding: '4px 0' }}>
        {'◆◇◆◇◆◇◆'.split('').map((c, i) => (
          <span key={i} style={{ fontSize: '0.7rem', color: '#DDA0DD', opacity: 0.7 }}>{c}</span>
        ))}
      </div>
      <div className="goth-lace-bottom" />
    </div>
  );
}

function CityPopBorder() {
  return (
    <div className="frame-deco frame-deco-citypop">
      <div className="citypop-stripe-top" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 10px' }}>
        <span style={{ fontSize: '0.6rem', color: '#FFFF00', fontFamily: 'monospace', fontWeight: '900', letterSpacing: '1px' }}>1988</span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {['#FF006E','#00B4D8','#FFBE0B','#FF006E'].map((c, i) => (
            <div key={i} style={{ width: '14px', height: '6px', background: c, borderRadius: '2px' }} />
          ))}
        </div>
        <span style={{ fontSize: '0.6rem', color: '#FFFF00', fontFamily: 'monospace', fontWeight: '900', letterSpacing: '1px' }}>CITY</span>
      </div>
    </div>
  );
}

function BobaBorder() {
  return (
    <div className="frame-deco frame-deco-boba">
      <div className="boba-dots-row">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="boba-dot" style={{ background: ['#CDB4DB','#FFAFCC','#BDE0FE','#A2D2FF'][i % 4] }} />
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#9B59B6', fontWeight: '700', letterSpacing: '2px', padding: '3px 0' }}>
        ♡ BOBA & CHILL ♡
      </div>
    </div>
  );
}

function CoquetteBorder() {
  return (
    <div className="frame-deco frame-deco-coquette">
      <div className="coquette-lace" />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', padding: '4px 0' }}>
        {['🎀','🌹','💖','🌹','🎀'].map((e, i) => (
          <span key={i} style={{ fontSize: '0.9rem', animation: `swayRibbon 1.2s ${i * 0.2}s ease-in-out infinite alternate` }}>{e}</span>
        ))}
      </div>
    </div>
  );
}

function CoquetteBottomDeco() {
  return (
    <div className="frame-deco frame-deco-coquette-bottom">
      <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#9B2335', fontFamily: '"Pacifico", cursive', letterSpacing: '1px', padding: '4px 0' }}>
        with love & ribbons 🎀
      </div>
      <div className="coquette-lace" style={{ transform: 'scaleY(-1)' }} />
    </div>
  );
}

function CloudBorder() {
  return (
    <div className="frame-deco frame-deco-cloud">
      <div className="cloud-row">
        {['☁️','🌈','☁️','✨','☁️','🌟','☁️'].map((e, i) => (
          <span key={i} style={{ fontSize: '0.85rem', animation: `floatCloud 2s ${i * 0.3}s ease-in-out infinite alternate` }}>{e}</span>
        ))}
      </div>
      <div className="cloud-stripe" />
    </div>
  );
}

function StarBorder() {
  return (
    <div className="frame-deco frame-deco-star">
      <div className="star-scatter">
        {['✦','✧','★','✦','✧','★','✦','✧'].map((s, i) => (
          <span key={i} className="star-sparkle" style={{
            fontSize: `${0.5 + (i % 3) * 0.2}rem`,
            animationDelay: `${i * 0.15}s`,
            color: ['#C8A2C8','#E8D5E8','#FFD700','#DDA0DD'][i % 4]
          }}>{s}</span>
        ))}
      </div>
      <div className="star-divider" />
    </div>
  );
}

function StarBottomDeco() {
  return (
    <div className="frame-deco frame-deco-star-bottom">
      <div className="star-divider" />
      <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#C8A2C8', letterSpacing: '3px', padding: '4px 0', fontWeight: '700' }}>
        ✦ MIDNIGHT STUDIO ✦
      </div>
    </div>
  );
}

function Y2KBorder() {
  return (
    <div className="frame-deco frame-deco-y2k">
      <div className="y2k-chrome-bar" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 8px' }}>
        <span style={{ fontSize: '0.55rem', color: '#1A2332', fontFamily: 'monospace', fontWeight: '900', background: '#C0C0C0', padding: '1px 4px', borderRadius: '2px' }}>Y2K</span>
        <div className="y2k-chrome-dots">
          {[0,1,2,3,4].map(i => <div key={i} className="chrome-dot" />)}
        </div>
        <span style={{ fontSize: '0.55rem', color: '#1A2332', fontFamily: 'monospace', fontWeight: '900', background: '#C0C0C0', padding: '1px 4px', borderRadius: '2px' }}>2000</span>
      </div>
    </div>
  );
}

function MatchaBorder() {
  return (
    <div className="frame-deco frame-deco-matcha">
      <div className="matcha-wave" />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '4px 0' }}>
        {['🍵','🌿','🍃','🌱','🍵'].map((e, i) => (
          <span key={i} style={{ fontSize: '0.85rem' }}>{e}</span>
        ))}
      </div>
    </div>
  );
}

function ButterBorder() {
  return (
    <div className="frame-deco frame-deco-butter">
      <div className="butter-stripe" />
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '4px 0' }}>
        {['🧸','🌼','🍯','🌻','🧸'].map((e, i) => (
          <span key={i} style={{ fontSize: '0.9rem', animation: `bounceBear 1s ${i * 0.15}s ease-in-out infinite alternate` }}>{e}</span>
        ))}
      </div>
    </div>
  );
}

function HaruBorder() {
  return (
    <div className="frame-deco frame-deco-haru">
      <div className="haru-clean-line" />
      <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#999', letterSpacing: '3px', padding: '3px 0', fontWeight: '600' }}>
        ─ PREMIUM STUDIO ─
      </div>
    </div>
  );
}

// ── 🌟 NEW EVENT & ANIME DECORATION COMPONENTS ─────────────────
function AnimeTopBorder() {
  return (
    <div className="frame-deco" style={{ background: 'linear-gradient(90deg, #FFB7C5, #FF69B4, #FFB7C5)', height: '4px', margin: '4px 0' }} />
  );
}

function AnimeChibiBottomDeco() {
  return (
    <div className="frame-deco" style={{ textAlign: 'center', padding: '6px 0', background: 'rgba(255, 145, 164, 0.15)', borderRadius: '8px', margin: '6px' }}>
      <div style={{ fontSize: '1.2rem', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        <span>🍡</span><span>⛩️</span><span>🎀</span><span>🌸</span><span>✨</span>
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: '800', color: '#C71585', letterSpacing: '1px', marginTop: '2px' }}>
        ✦ OTAKU ANIME STUDIO ✦
      </div>
    </div>
  );
}

function SchoolTopBorder() {
  return (
    <div className="frame-deco" style={{ background: 'linear-gradient(90deg, #4A90E2, #1B365D, #4A90E2)', height: '4px', margin: '4px 0' }} />
  );
}

function HariGuruBottomDeco() {
  return (
    <div className="frame-deco" style={{ textAlign: 'center', padding: '6px 0', background: 'rgba(74, 144, 226, 0.15)', borderRadius: '8px', margin: '6px' }}>
      <div style={{ fontSize: '1.2rem', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        <span>🎓</span><span>📚</span><span>✏️</span><span>🏫</span><span>🌟</span>
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: '800', color: '#1B365D', letterSpacing: '1px', marginTop: '2px' }}>
        🎓 SELAMAT HARI GURU & DIES NATALIS 🎓
      </div>
    </div>
  );
}

function BirthdayTopBorder() {
  return (
    <div className="frame-deco" style={{ background: 'linear-gradient(90deg, #FFD54F, #FF9800, #FFD54F)', height: '4px', margin: '4px 0' }} />
  );
}

function BirthdayBottomDeco() {
  return (
    <div className="frame-deco" style={{ textAlign: 'center', padding: '6px 0', background: 'rgba(255, 179, 0, 0.18)', borderRadius: '8px', margin: '6px' }}>
      <div style={{ fontSize: '1.3rem', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        <span>🎂</span><span>🎈</span><span>🎉</span><span>🎁</span><span>🥳</span>
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: '800', color: '#E65100', letterSpacing: '1px', marginTop: '2px' }}>
        🎉 CELEBRATE SPECIAL MOMENT 🎂
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

export default function DraggableOverlayLayer({
  containerWidth,
  containerHeight,
  placedStickers = [],
  setPlacedStickers,
  placedCaptions = [],
  setPlacedCaptions,
  placedImages = [],
  setPlacedImages,
  selectedLayer,
  setSelectedLayer,
}) {
  const selectedItemId = selectedLayer?.id ?? null;
  const draggingRef = useRef(null);

  const setSelection = (type, id) => {
    if (typeof setSelectedLayer === 'function') {
      setSelectedLayer({ type, id });
    }
  };

  const moveLayer = (arr, id, direction) => {
    const idx = arr.findIndex(item => item.id === id);
    if (idx < 0) return arr;
    const targetIndex = idx + direction;
    if (targetIndex < 0 || targetIndex >= arr.length) return arr;
    const next = [...arr];
    [next[idx], next[targetIndex]] = [next[targetIndex], next[idx]];
    return next;
  };

  const reorderSelectedLayer = (direction) => {
    if (!selectedItemId) return;

    const selectedSticker = placedStickers.find(item => item.id === selectedItemId);
    if (selectedSticker) {
      setPlacedStickers(prev => moveLayer(prev, selectedItemId, direction));
      return;
    }

    const selectedCaption = placedCaptions.find(item => item.id === selectedItemId);
    if (selectedCaption) {
      setPlacedCaptions(prev => moveLayer(prev, selectedItemId, direction));
      return;
    }

    const selectedImage = placedImages.find(item => item.id === selectedItemId);
    if (selectedImage) {
      setPlacedImages(prev => moveLayer(prev, selectedItemId, direction));
    }
  };

  const getClientPoint = (e) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    return { clientX, clientY };
  };

  const handlePointerDown = (e, item, type, mode = 'move') => {
    e.stopPropagation();
    setSelection(type, item.id);

    const { clientX, clientY } = getClientPoint(e);
    if (clientX === undefined || clientY === undefined) return;

    draggingRef.current = {
      id: item.id,
      type,
      mode,
      startClientX: clientX,
      startClientY: clientY,
      startXPercent: item.xPercent,
      startYPercent: item.yPercent,
      startWidthPercent: item.widthPercent ?? 28,
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const { id, type, mode, startClientX, startClientY, startXPercent, startYPercent, startWidthPercent } = draggingRef.current;
    const { clientX, clientY } = getClientPoint(e);
    if (clientX === undefined || clientY === undefined) return;

    const deltaX = clientX - startClientX;
    const deltaY = clientY - startClientY;

    const deltaXPercent = (deltaX / (containerWidth || 280)) * 100;
    const deltaYPercent = (deltaY / (containerHeight || 620)) * 100;

    if (mode === 'resize' && type === 'image') {
      const nextWidth = Math.max(10, Math.min(60, startWidthPercent + (deltaX / (containerWidth || 280)) * 100));
      setPlacedImages(prev => prev.map(img => img.id === id ? { ...img, widthPercent: nextWidth } : img));
      return;
    }

    const newX = Math.max(2, Math.min(98, startXPercent + deltaXPercent));
    const newY = Math.max(2, Math.min(98, startYPercent + deltaYPercent));

    if (type === 'sticker') {
      setPlacedStickers(prev => prev.map(s => s.id === id ? { ...s, xPercent: newX, yPercent: newY } : s));
    } else if (type === 'caption') {
      setPlacedCaptions(prev => prev.map(c => c.id === id ? { ...c, xPercent: newX, yPercent: newY } : c));
    } else if (type === 'image') {
      setPlacedImages(prev => prev.map(img => img.id === id ? { ...img, xPercent: newX, yPercent: newY } : img));
    }
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('touchmove', handlePointerMove);
    window.removeEventListener('touchend', handlePointerUp);
  };

  const removeItem = (id, type, e) => {
    e.stopPropagation();
    if (type === 'sticker') {
      setPlacedStickers(prev => prev.filter(s => s.id !== id));
    } else if (type === 'caption') {
      setPlacedCaptions(prev => prev.filter(c => c.id !== id));
    } else if (type === 'image') {
      setPlacedImages(prev => prev.filter(img => img.id !== id));
    }
    if (selectedItemId === id) {
      if (typeof setSelectedLayer === 'function') setSelectedLayer(null);
    }
  };

  const updateImageTransform = (id, deltaRotation, deltaScale, deltaZoom = 0) => {
    setPlacedImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      const nextRotation = (img.rotation || 0) + deltaRotation;
      const nextWidth = Math.max(10, Math.min(60, (img.widthPercent || 28) + deltaScale));
      const nextZoom = Math.min(2.6, Math.max(0.6, (img.cropZoom || 1) + deltaZoom));
      return { ...img, rotation: nextRotation, widthPercent: nextWidth, cropZoom: nextZoom };
    }));
  };

  return (
    <div
      className="draggable-overlay-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 30,
        overflow: 'hidden',
      }}
      onClick={() => {
        if (typeof setSelectedLayer === 'function') setSelectedLayer(null);
      }}
    >
      {/* Placed Stickers */}
      {placedStickers.map(stk => (
        <div
          key={stk.id}
          className={`draggable-item ${selectedItemId === stk.id ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: `${stk.xPercent}%`,
            top: `${stk.yPercent}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
            cursor: 'grab',
            userSelect: 'none',
            fontSize: `${stk.size || 28}px`,
            lineHeight: 1,
            touchAction: 'none',
          }}
          onPointerDown={e => handlePointerDown(e, stk, 'sticker')}
          onClick={e => e.stopPropagation()}
        >
          {stk.imageSrc ? (
            <img src={stk.imageSrc} alt="Custom sticker" style={{ width: `${(stk.size || 36) * 1.5}px`, height: `${(stk.size || 36) * 1.5}px`, objectFit: 'contain', display: 'block', borderRadius: '8px' }} />
          ) : (
            <span>{stk.emoji}</span>
          )}
          {selectedItemId === stk.id && (
            <>
              <button
                className="draggable-delete-btn"
                onClick={e => removeItem(stk.id, 'sticker', e)}
                title="Hapus Stiker"
              >
                <X size={10} />
              </button>
              <div className="draggable-layer-controls">
                <button type="button" onClick={() => reorderSelectedLayer(-1)} title="Bawa ke belakang">↓</button>
                <button type="button" onClick={() => reorderSelectedLayer(1)} title="Bawa ke depan">↑</button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Placed Custom Captions */}
      {placedCaptions.map(cap => (
        <div
          key={cap.id}
          className={`draggable-item ${selectedItemId === cap.id ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: `${cap.xPercent}%`,
            top: `${cap.yPercent}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
            cursor: 'grab',
            userSelect: 'none',
            color: cap.color || '#FFFFFF',
            fontSize: `${cap.fontSize || 14}px`,
            fontWeight: '800',
            fontFamily: cap.fontFamily || '"Outfit", sans-serif',
            textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 2px #000',
            whiteSpace: 'nowrap',
            touchAction: 'none',
            background: 'rgba(0,0,0,0.25)',
            padding: '2px 8px',
            borderRadius: '6px',
            backdropFilter: 'blur(2px)',
          }}
          onPointerDown={e => handlePointerDown(e, cap, 'caption')}
          onClick={e => e.stopPropagation()}
        >
          <span>{cap.text}</span>
          {selectedItemId === cap.id && (
            <>
              <button
                className="draggable-delete-btn"
                onClick={e => removeItem(cap.id, 'caption', e)}
                title="Hapus Teks"
              >
                <X size={10} />
              </button>
              <div className="draggable-layer-controls">
                <button type="button" onClick={() => reorderSelectedLayer(-1)} title="Bawa ke belakang">↓</button>
                <button type="button" onClick={() => reorderSelectedLayer(1)} title="Bawa ke depan">↑</button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Uploaded custom images */}
      {placedImages.map(img => (
        <div
          key={img.id}
          className={`draggable-item image-layer ${selectedItemId === img.id ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: `${img.xPercent ?? 50}%`,
            top: `${img.yPercent ?? 50}%`,
            width: `${img.widthPercent ?? 28}%`,
            transform: `translate(-50%, -50%) rotate(${img.rotation || 0}deg)`,
            opacity: img.opacity ?? 1,
            pointerEvents: 'auto',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            zIndex: 35,
          }}
          onPointerDown={e => handlePointerDown(e, img, 'image')}
          onClick={e => e.stopPropagation()}
        >
          <img
            src={img.src}
            alt="Custom uploaded layer"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              borderRadius: '10px',
              boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
              border: selectedItemId === img.id ? '2px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.04)',
              objectFit: 'cover',
              objectPosition: `${img.cropX ?? 50}% ${img.cropY ?? 50}%`,
              transform: `scale(${img.cropZoom || 1})`,
              transformOrigin: 'center center',
            }}
          />
          {selectedItemId === img.id && (
            <>
              <button
                className="draggable-delete-btn"
                onClick={e => removeItem(img.id, 'image', e)}
                title="Hapus Gambar"
              >
                <X size={10} />
              </button>
              <div
                className="draggable-resize-handle"
                onPointerDown={e => handlePointerDown(e, img, 'image', 'resize')}
                title="Ubah ukuran gambar"
              />
              <div className="draggable-layer-controls">
                <button type="button" onClick={() => reorderSelectedLayer(-1)} title="Bawa ke belakang">↓</button>
                <button type="button" onClick={() => reorderSelectedLayer(1)} title="Bawa ke depan">↑</button>
              </div>
              <div style={{ position: 'absolute', left: '50%', top: 'calc(100% + 8px)', transform: 'translateX(-50%)', display: 'flex', gap: '4px', background: 'rgba(15,23,42,0.7)', borderRadius: '999px', padding: '3px 5px' }}>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); updateImageTransform(img.id, -15, 0); }}
                  style={{ width: '18px', height: '18px', border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}
                  title="Putar kiri"
                >
                  ↺
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); updateImageTransform(img.id, 15, 0); }}
                  style={{ width: '18px', height: '18px', border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}
                  title="Putar kanan"
                >
                  ↻
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); updateImageTransform(img.id, 0, 4, 0.12); }}
                  style={{ width: '18px', height: '18px', border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}
                  title="Perbesar"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); updateImageTransform(img.id, 0, -4, -0.12); }}
                  style={{ width: '18px', height: '18px', border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}
                  title="Kecilkan"
                >
                  −
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

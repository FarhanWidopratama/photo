import React, { useState, useEffect, useRef } from 'react';
import { Film, Sliders, Palette, Sparkles } from 'lucide-react';

/**
 * BottomSheet — wraps Controls in a mobile-friendly slide-up bottom sheet
 * with tab navigation on mobile (< 768px).
 *
 * On desktop the children are rendered inline unchanged.
 *
 * Tabs:
 *   Layout  → shows sections: Layout Strip, Teks Studio & Aksesoris
 *   Filter  → shows sections: Color Grading Filter, AI Background, AR Props
 *   Frame   → shows sections: Pilih Frame Studio
 *   Extras  → shows sections: remaining (share, download, etc.)
 *
 * The component achieves tab-filtering by injecting a `activeTab` prop into
 * Controls and relying on CSS data attributes, so we render Controls once and
 * hide/show sections via CSS class toggling managed here.
 */

const TABS = [
  { id: 'layout', label: 'Layout', icon: Film },
  { id: 'filter', label: 'Filter', icon: Sliders },
  { id: 'frame',  label: 'Frame',  icon: Palette },
  { id: 'extras', label: 'Extras', icon: Sparkles },
];

export default function BottomSheet({ children, isMobile }) {
  const [activeTab, setActiveTab] = useState('layout');
  const [isOpen, setIsOpen] = useState(false);
  const sheetRef = useRef(null);

  // Close sheet when tapping backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };

  // On desktop render children inline without any wrapping
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {/* ── Floating trigger bar that shows current active tab ── */}
      <div className="bottom-sheet-trigger" onClick={() => setIsOpen(true)}>
        <div className="bottom-sheet-trigger-tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`bottom-sheet-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab(tab.id);
                  setIsOpen(true);
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="bottom-sheet-trigger-hint">
          <span>⬆ Tap untuk buka pengaturan</span>
        </div>
      </div>

      {/* ── Bottom Sheet overlay ── */}
      {isOpen && (
        <div
          className="bottom-sheet-backdrop"
          onClick={handleBackdropClick}
        >
          <div className="bottom-sheet-panel" ref={sheetRef}>
            {/* Drag handle */}
            <div className="bottom-sheet-handle" onClick={() => setIsOpen(false)} />

            {/* Tab navigation bar */}
            <div className="bottom-sheet-tabs">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`bottom-sheet-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable content area — renders Controls with tab filter */}
            <div className="bottom-sheet-content" data-active-tab={activeTab}>
              {React.cloneElement(children, { activeTab })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

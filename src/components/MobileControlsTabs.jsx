import React, { useState, useEffect } from 'react';
import Controls from './Controls';

/**
 * MobileControlsTabs — sticky bottom tab bar for mobile (<768px).
 *
 * Accepts all the same props as Controls. On mobile it renders a 4-tab
 * sticky bar at the bottom of the viewport; tapping a tab slides up a
 * panel that renders <Controls activeTab={tab} .../> so only the relevant
 * section is shown. On desktop this component renders nothing — the
 * .controls-desktop-only wrapper in App.jsx shows the full Controls instead.
 *
 * Requirements: 1.2, 1.5
 */

const TABS = [
  { id: 'layout', emoji: '🎞️', label: 'Layout'  },
  { id: 'filter', emoji: '🎨', label: 'Filter'  },
  { id: 'frame',  emoji: '🖼️', label: 'Frame'   },
  { id: 'extras', emoji: '✨', label: 'Extras'  },
];

export default function MobileControlsTabs(props) {
  const [activeTab, setActiveTab] = useState('layout');
  const [isOpen, setIsOpen]       = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll while panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleTabClick = (tabId) => {
    if (activeTab === tabId && isOpen) {
      // Tap active tab again → close panel
      setIsOpen(false);
    } else {
      setActiveTab(tabId);
      setIsOpen(true);
    }
  };

  return (
    <div className="mobile-controls-sheet">
      {/* ── Sticky bottom tab bar ── */}
      <div className="mobile-tab-bar" role="tablist" aria-label="Studio Controls">
        {TABS.map(({ id, emoji, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id && isOpen}
            className={`mobile-tab-btn${activeTab === id && isOpen ? ' active' : ''}`}
            onClick={() => handleTabClick(id)}
            aria-label={label}
          >
            <span className="mobile-tab-emoji" aria-hidden="true">{emoji}</span>
            <span className="mobile-tab-label">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Semi-transparent backdrop ── */}
      {isOpen && (
        <div
          className="mobile-sheet-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-up sheet panel ── */}
      <div
        className={`mobile-sheet-panel${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Pengaturan Studio"
      >
        {/* Drag handle row — tap to close */}
        <div
          className="mobile-sheet-handle-row"
          onClick={() => setIsOpen(false)}
          aria-label="Tutup panel"
        >
          <div className="mobile-sheet-handle" />
        </div>

        {/* In-panel tab switcher */}
        <div className="mobile-sheet-tabs" role="tablist">
          {TABS.map(({ id, emoji, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              className={`mobile-sheet-tab${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Controls content — filtered by activeTab */}
        <div className="mobile-sheet-content">
          <Controls {...props} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}

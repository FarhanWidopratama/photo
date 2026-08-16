import React, { useState } from 'react';
import { Camera, Zap, Film, Download, Sparkles, PartyPopper } from 'lucide-react';
import PinGateScreen from './PinGateScreen';
import LeadCaptureModal from './LeadCaptureModal';

export default function WelcomeScreen({
  onStart,
  adminConfig = null,
  onAdminAccess,
  leadCaptureEnabled = false,
  onLeadSubmit,
  onLeadSkip,
}) {
  const [eventName, setEventName] = useState('');
  const [pinPassed, setPinPassed] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);

  const pinEnabled =
    adminConfig?.pinEvent && adminConfig?.pinCode;

  // Show PIN gate if PIN is active and not yet passed
  if (pinEnabled && !pinPassed) {
    return (
      <PinGateScreen
        pinValue={adminConfig.pinCode}
        onSuccess={() => setPinPassed(true)}
        onAdminAccess={onAdminAccess}
      />
    );
  }

  // Show lead capture modal when the CTA was clicked
  if (showLeadCapture) {
    return (
      <LeadCaptureModal
        onSubmit={(lead) => {
          setShowLeadCapture(false);
          onLeadSubmit?.(lead);
          onStart({ eventName: eventName.trim() });
        }}
        onSkip={() => {
          setShowLeadCapture(false);
          onLeadSkip?.();
          onStart({ eventName: eventName.trim() });
        }}
      />
    );
  }

  const handleStart = () => {
    if (leadCaptureEnabled) {
      setShowLeadCapture(true);
    } else {
      onStart({ eventName: eventName.trim() });
    }
  };

  return (
    <div className="welcome-screen">
      {/* Animated background blobs */}
      <div className="welcome-blob blob-1" />
      <div className="welcome-blob blob-2" />
      <div className="welcome-blob blob-3" />

      <div className="welcome-content">
        {/* Badge */}
        <div className="welcome-badge">
          <Sparkles size={14} />
          <span>Korean Photobooth Studio</span>
        </div>

        {/* Main Title */}
        <h1 className="welcome-title">
          <span className="title-life" style={{ fontSize: '0.65em', display: 'block', letterSpacing: '0.1em', opacity: 0.9 }}>SEOUL SNAP</span>
          <span className="title-life">LIFE</span>
          <span className="title-4">4</span>
          <span className="title-cuts">CUTS</span>
        </h1>

        <p className="welcome-tagline">
          Studio photobooth viral ala Korea langsung dari browser kamu.<br />
          Jepret 4 foto, pilih filter, unduh strip foto estetik! 📸
        </p>

        {/* Event Name Input */}
        <div className="welcome-event-box">
          <label className="welcome-event-label">
            <PartyPopper size={14} />
            <span>Nama Event / Acara <span style={{ opacity: 0.55, fontWeight: 400 }}>(opsional)</span></span>
          </label>
          <input
            type="text"
            className="welcome-event-input"
            placeholder="mis: Prom Night 2026 🎓, Ultah Reza 🎂, Reuni SMA..."
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            maxLength={50}
            aria-label="Nama event atau acara"
          />
          {eventName.trim() && (
            <p className="welcome-event-preview">
              ✨ Strip foto akan bertuliskan: <strong>"{eventName.trim()}"</strong>
            </p>
          )}
        </div>

        {/* Feature Pills */}
        <div className="welcome-features">
          <div className="feature-pill">
            <Camera size={14} />
            <span>4-Snap Auto</span>
          </div>
          <div className="feature-pill">
            <Film size={14} />
            <span>Studio Filters</span>
          </div>
          <div className="feature-pill">
            <Download size={14} />
            <span>PNG + GIF</span>
          </div>
          <div className="feature-pill">
            <Zap size={14} />
            <span>Print Ready</span>
          </div>
        </div>

        <div className="welcome-stats" aria-label="Studio highlights">
          <div className="stat-card accent-pink">
            <span className="stat-kicker">Auto</span>
            <strong>4-shot</strong>
            <small>Countdown & pose</small>
          </div>
          <div className="stat-card accent-purple">
            <span className="stat-kicker">Style</span>
            <strong>AI Filter</strong>
            <small>Korea vibes</small>
          </div>
          <div className="stat-card accent-cyan">
            <span className="stat-kicker">Export</span>
            <strong>PNG/GIF</strong>
            <small>Share langsung</small>
          </div>
        </div>

        {/* CTA Button */}
        <button className="welcome-cta-btn" onClick={handleStart}>
          <Camera size={22} />
          <span>Mulai Studio Session 🚀</span>
        </button>

        <p className="welcome-hint">
          Browser siap • kamera aktif • hasil print-ready ✨
        </p>
      </div>

      {/* Animated strip preview on right (decorative) */}
      <div className="welcome-strip-preview" aria-hidden="true">
        <div className="deco-strip">
          <div className="deco-strip-header">
            {eventName.trim() ? eventName.trim() : 'LIFE 4 CUTS 📸'}
          </div>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`deco-photo-slot deco-slot-${i}`} />
          ))}
          <div className="deco-strip-footer">
            <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</span>
            <span className="deco-tag">STUDIO EDITION</span>
          </div>
        </div>
      </div>
    </div>
  );
}

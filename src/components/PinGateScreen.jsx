import React, { useState, useRef } from 'react';

/**
 * PinGateScreen — full-screen overlay that blocks access until
 * the correct PIN is entered.
 *
 * Props:
 *   onSuccess       () => void          — called when the correct PIN is entered
 *   pinValue        string              — the configured PIN (4–6 digits)
 *   onAdminAccess?  () => void          — called when logo is tapped 5 times
 *
 * Requirements: 5.3, 5.4, 5.5
 */
export default function PinGateScreen({ onSuccess, pinValue, onAdminAccess }) {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);

  const MAX_ATTEMPTS = 5;
  const isLocked = attempts >= MAX_ATTEMPTS;

  // Handle logo tap — 5 taps within 2s triggers onAdminAccess
  function handleLogoTap() {
    if (!onAdminAccess) return;

    logoTapCount.current += 1;

    clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 2000);

    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      clearTimeout(logoTapTimer.current);
      onAdminAccess();
    }
  }

  function handleInputChange(e) {
    // Strip non-numeric chars, cap at 6 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPinInput(value);
    if (error) setError(null);
  }

  function handleSubmit(e) {
    e?.preventDefault();
    if (isLocked || !pinInput) return;

    if (pinInput === pinValue) {
      setError(null);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPinInput('');
      if (newAttempts >= MAX_ATTEMPTS) {
        setError(null); // locked message takes over
      } else {
        setError('PIN salah, coba lagi');
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div
      className="pin-gate-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Masukkan PIN untuk melanjutkan"
    >
      <div className="pin-gate-card">
        {/* Logo — tap 5× to trigger admin access */}
        <div
          className="pin-gate-logo"
          onClick={handleLogoTap}
          role="button"
          aria-label="Logo studio"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleLogoTap()}
        >
          LIFE 4 CUTS 📸
        </div>

        {/* Subtitle */}
        <p className="pin-gate-subtitle">Masukkan PIN untuk mulai 🔒</p>

        {/* PIN input */}
        <input
          id="pin-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          className="pin-input"
          value={pinInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={6}
          placeholder="••••"
          disabled={isLocked}
          aria-label="PIN"
          aria-invalid={!!error}
          autoFocus
        />

        {/* Error message (Req 5.5) */}
        {error && !isLocked && (
          <p className="pin-error" role="alert">
            {error}
          </p>
        )}

        {/* Too many attempts (Req 5.5) */}
        {isLocked && (
          <p className="pin-attempts-warning" role="alert">
            Terlalu banyak percobaan. Hubungi penyelenggara.
          </p>
        )}

        {/* Submit button (Req 5.4) */}
        <button
          type="button"
          className="pin-submit-btn"
          onClick={handleSubmit}
          disabled={isLocked || !pinInput}
          aria-label="Masuk ke studio"
        >
          Masuk
        </button>
      </div>
    </div>
  );
}

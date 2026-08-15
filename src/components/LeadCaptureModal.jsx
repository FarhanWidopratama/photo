import React, { useState } from 'react';

/**
 * LeadCaptureModal
 *
 * Props:
 *   onSubmit: ({ name, phone }) => void  — called when form is submitted
 *   onSkip:   () => void                 — called when user skips
 */
export default function LeadCaptureModal({ onSubmit, onSkip }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const isNameValid = name.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isNameValid) return;
    onSubmit({ name: name.trim(), phone: phone.trim() });
  };

  return (
    <div className="lead-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
      <div className="lead-modal-card">
        <h2 id="lead-modal-title" className="lead-title">
          Daftarkan Nama Kamu 📋
        </h2>
        <p className="lead-subtitle">
          Biar nama kamu bisa tampil di strip foto! 🌟
        </p>

        <form className="lead-form" onSubmit={handleSubmit} noValidate>
          {/* Name field — required */}
          <div>
            <label htmlFor="lead-name" className="lead-label">
              Nama
            </label>
            <input
              id="lead-name"
              type="text"
              className="lead-input"
              placeholder="Nama kamu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
              autoFocus
              autoComplete="given-name"
              aria-required="true"
            />
          </div>

          {/* Phone field — optional */}
          <div>
            <label htmlFor="lead-phone" className="lead-label">
              Nomor HP
            </label>
            <input
              id="lead-phone"
              type="tel"
              className="lead-input"
              placeholder="Nomor HP (opsional)..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={15}
              autoComplete="tel"
              aria-required="false"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="lead-submit-btn"
            disabled={!isNameValid}
            aria-disabled={!isNameValid}
          >
            Lanjutkan 🚀
          </button>
        </form>

        {/* Skip */}
        <button
          type="button"
          className="lead-skip-btn"
          onClick={onSkip}
          aria-label="Lewati pengisian data, langsung ke sesi foto"
        >
          Lewati →
        </button>
      </div>
    </div>
  );
}

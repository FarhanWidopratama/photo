import { useEffect } from 'react';

/**
 * KioskIdleTimer — pure behavior component (renders null)
 *
 * Props:
 * - idleMinutes: 1 | 3 | 5 — idle duration before reset
 * - enabled: boolean — whether idle timer is active
 * - onIdle: () => void — called when idle timeout reached
 *
 * Requirements: 7.4
 */
export default function KioskIdleTimer({ idleMinutes = 3, enabled = false, onIdle }) {
  useEffect(() => {
    if (!enabled) return;

    let timer = null;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (onIdle) onIdle();
      }, idleMinutes * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start initial timer

    return () => {
      clearTimeout(timer);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [enabled, idleMinutes, onIdle]);

  return null; // no UI, pure behavior
}

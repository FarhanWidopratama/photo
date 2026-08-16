const PBKDF2_ITERATIONS = 150000;
const encoder = new TextEncoder();

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function toHex(buf) {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

// Legacy SHA-256 (no salt) — kept only to verify hashes created by older versions.
export async function hashString(value) {
  if (typeof value !== 'string') return '';
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHex(hashBuffer);
}

/**
 * Hash a password with salted PBKDF2-SHA256.
 * Returns a portable JSON string: {"alg":"pbkdf2-sha256","salt":b64,"iterations":n,"hash":b64}
 */
export async function hashPassword(password) {
  const salt = randomSalt();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return JSON.stringify({
    alg: 'pbkdf2-sha256',
    salt: toBase64(salt),
    iterations: PBKDF2_ITERATIONS,
    hash: toBase64(bits),
  });
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify a password against a stored hash. Accepts the new PBKDF2 JSON format
 * and the legacy plain SHA-256 hex string, so old installs keep working.
 */
export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || stored.length === 0) return false;
  if (stored.startsWith('{')) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.alg !== 'pbkdf2-sha256' || !parsed.salt || !parsed.hash || !parsed.iterations) return false;
      const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: fromBase64(parsed.salt), iterations: parsed.iterations, hash: 'SHA-256' },
        keyMaterial,
        256
      );
      const storedBytes = fromBase64(parsed.hash);
      const derivedBytes = new Uint8Array(bits);
      if (storedBytes.length !== derivedBytes.length) return false;
      let diff = 0;
      for (let i = 0; i < derivedBytes.length; i++) diff |= derivedBytes[i] ^ storedBytes[i];
      return diff === 0;
    } catch (e) {
      return false;
    }
  }
  // Legacy: plain SHA-256 hex
  const inputHash = await hashString(password);
  return timingSafeEqualHex(inputHash, stored);
}

export function isAdminConfigured(config = {}) {
  const h = config?.passwordHash;
  return Boolean(h && typeof h === 'string' && (h.length >= 64 || h.startsWith('{')));
}

export function isStrongAdminPassword(value) {
  return typeof value === 'string' && value.trim().length >= 6;
}
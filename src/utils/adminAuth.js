export async function hashString(value) {
  if (typeof value !== 'string') return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isAdminConfigured(config = {}) {
  return Boolean(config?.passwordHash && typeof config.passwordHash === 'string' && config.passwordHash.length >= 64);
}

export function isStrongAdminPassword(value) {
  return typeof value === 'string' && value.trim().length >= 6;
}

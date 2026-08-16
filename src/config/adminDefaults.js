// ============================================================
//  Admin Config — single source of truth for keys & defaults
// ============================================================

export const CONFIG_VERSION = 3;

export const DEFAULT_ADMIN_CONFIG = {
  leadCapture: false,
  pinEvent: false,
  pinCode: '',
  kioskMode: false,
  idleMinutes: 3,
  watermark: false,
  qrDelivery: false,
  defaultTheme: 'haru_white',
  defaultFilter: 'normal',
};

// Keys written by older versions of the app → canonical keys
const LEGACY_KEY_MAP = {
  leadCaptureEnabled: 'leadCapture',
  pinEventEnabled: 'pinEvent',
  pinEventValue: 'pinCode',
  kioskModeEnabled: 'kioskMode',
  kioskIdleMinutes: 'idleMinutes',
  watermarkEnabled: 'watermark',
};

/**
 * Normalize a raw admin config: fills defaults, migrates legacy keys
 * to canonical names, and stamps the current schema version.
 * Canonical keys always win over legacy ones.
 * @param {Object|null} cfg
 * @returns {Object}
 */
export function normalizeAdminConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return { ...DEFAULT_ADMIN_CONFIG, configVersion: CONFIG_VERSION };

  const out = { ...DEFAULT_ADMIN_CONFIG };
  for (const [key, value] of Object.entries(cfg)) {
    const canonical = LEGACY_KEY_MAP[key];
    if (canonical) {
      // Only migrate legacy value if the canonical key is not explicitly set
      if (cfg[canonical] === undefined) out[canonical] = value;
    } else {
      out[key] = value;
    }
  }
  out.configVersion = CONFIG_VERSION;
  return out;
}

// ============================================================
//  Life4Cuts — IndexedDB Persistence Layer
//  Stores: photo sessions, music playlist, user settings,
//          lead captures (NEW), admin config (NEW)
// ============================================================

import { normalizeAdminConfig } from '../config/adminDefaults';

const DB_NAME = 'Life4CutsDB';
const DB_VERSION = 2;  // bumped from 1 → 2

const STORES = {
  sessions:    'photoSessions',   // existing — saved photo strips
  playlist:    'musicPlaylist',   // existing — saved songs
  settings:    'userSettings',    // existing — default preferences
  leads:       'leadCaptures',    // NEW — customer lead data
  adminConfig: 'adminConfig',     // NEW — owner configuration
};

// ── Open / Init DB ──────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // ── Existing stores (idempotent — only create if not present) ──

      // Photo Sessions store
      if (!db.objectStoreNames.contains(STORES.sessions)) {
        const store = db.createObjectStore(STORES.sessions, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }

      // Music Playlist store
      if (!db.objectStoreNames.contains(STORES.playlist)) {
        db.createObjectStore(STORES.playlist, { keyPath: 'id' });
      }

      // User Settings store
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }

      // ── New stores (v2) ────────────────────────────────────

      // Lead Captures store
      if (!db.objectStoreNames.contains(STORES.leads)) {
        const leadStore = db.createObjectStore(STORES.leads, { keyPath: 'id' });
        leadStore.createIndex('sessionId', 'sessionId', { unique: false });
        leadStore.createIndex('date', 'date', { unique: false });
      }

      // Admin Config store
      if (!db.objectStoreNames.contains(STORES.adminConfig)) {
        db.createObjectStore(STORES.adminConfig, { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

// ── Generic Helpers ─────────────────────────────────────────
function txGet(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txGetAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txPut(db, storeName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDelete(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ============================================================
//  PHOTO SESSIONS
// ============================================================

/**
 * Save a completed photo strip session.
 * @param {Object} data - { stripPng, gifBlob?, theme, layout, filter, titleText, sticker }
 * @returns {string} id of the saved session
 */
export async function saveSession(data) {
  const db = await openDB();
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const session = {
    id,
    date: new Date().toISOString(),
    dateFormatted: new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    stripPng: data.stripPng || null,
    theme: data.theme || 'haru_white',
    layout: data.layout || 'strip1x4',
    filter: data.filter || 'normal',
    titleText: data.titleText || 'LIFE 4 CUTS 📸',
    sticker: data.sticker || null,
  };
  await txPut(db, STORES.sessions, session);
  return id;
}

/**
 * Get all saved sessions, sorted newest first.
 */
export async function getSessions() {
  const db = await openDB();
  const all = await txGetAll(db, STORES.sessions);
  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Delete a session by id.
 */
export async function deleteSession(id) {
  const db = await openDB();
  await txDelete(db, STORES.sessions, id);
}

/**
 * Count total saved sessions.
 */
export async function getSessionCount() {
  const db = await openDB();
  const all = await txGetAll(db, STORES.sessions);
  return all.length;
}

// ============================================================
//  MUSIC PLAYLIST
// ============================================================

/**
 * Add a song to the saved playlist.
 * @param {Object} song - { title, youtubeUrl, thumbnailUrl? }
 */
export async function saveToPlaylist(song) {
  const db = await openDB();
  const id = `song_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
  await txPut(db, STORES.playlist, {
    id,
    title: song.title,
    youtubeUrl: song.youtubeUrl,
    audioDataUrl: song.audioDataUrl || null,  // base64 data URL — persisted permanently
    thumbnailUrl: song.thumbnailUrl || null,
    addedAt: new Date().toISOString(),
  });
  return id;
}

/**
 * Get all saved playlist songs.
 */
export async function getPlaylist() {
  const db = await openDB();
  const all = await txGetAll(db, STORES.playlist);
  return all.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
}

/**
 * Remove a song from playlist.
 */
export async function deleteFromPlaylist(id) {
  const db = await openDB();
  await txDelete(db, STORES.playlist, id);
}

// ============================================================
//  USER SETTINGS
// ============================================================

/**
 * Save user preferences as default settings.
 * @param {Object} settings - Any key-value preferences
 */
export async function saveSettings(settings) {
  try {
    const db = await openDB();
    await txPut(db, STORES.settings, { key: 'default', ...settings, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.warn('saveSettings error:', e);
    return false;
  }
}

/**
 * Load saved user preferences.
 * @returns {Object|null}
 */
export async function loadSettings() {
  try {
    const db = await openDB();
    const result = await txGet(db, STORES.settings, 'default');
    return result || null;
  } catch (e) {
    console.warn('loadSettings error:', e);
    return null;
  }
}

/**
 * Save a single setting value by key into the 'default' settings record.
 * Performs a read-merge-write so existing fields are preserved.
 * @param {string} key
 * @param {*} value
 */
export async function saveSetting(key, value) {
  try {
    const db = await openDB();
    const existing = await txGet(db, STORES.settings, 'default') || {};
    await txPut(db, STORES.settings, {
      ...existing,
      key: 'default',
      [key]: value,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.warn('saveSetting error:', e);
    return false;
  }
}

/**
 * Load a single setting value by key from the 'default' settings record.
 * @param {string} key
 * @returns {*} the value, or undefined if not set
 */
export async function loadSetting(key) {
  try {
    const db = await openDB();
    const record = await txGet(db, STORES.settings, 'default');
    return record ? record[key] : undefined;
  } catch (e) {
    console.warn('loadSetting error:', e);
    return undefined;
  }
}

// ============================================================
//  LEAD CAPTURES  (Requirements 4.4)
// ============================================================

/**
 * Save a customer lead capture record.
 * Dedupes by (name + phone): if a lead with the same contact already
 * exists, its sessionId is updated (keeps the original capture date).
 * @param {Object} lead - { name, phone, sessionId }
 * @returns {string|null} id of the saved lead, or null on failure
 */
export async function saveLead(lead) {
  try {
    const db = await openDB();
    const name = (lead.name || '').trim();
    const phone = (lead.phone || '').trim();
    const all = await txGetAll(db, STORES.leads);
    const existing = all.find(l =>
      (l.name || '').trim() === name &&
      (l.phone || '').trim() === phone &&
      (name || phone)
    );

    if (existing) {
      if (lead.sessionId && existing.sessionId !== lead.sessionId) {
        await txPut(db, STORES.leads, { ...existing, sessionId: lead.sessionId });
      }
      return existing.id;
    }

    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const record = {
      id,
      sessionId: lead.sessionId || '',
      name,
      phone,
      date: now.toISOString(),
      dateFormatted: now.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    };
    await txPut(db, STORES.leads, record);
    return id;
  } catch (e) {
    console.warn('saveLead error:', e);
    return null;
  }
}

/**
 * Get all saved lead capture records, sorted newest first.
 * @returns {Array}
 */
export async function getLeads() {
  try {
    const db = await openDB();
    const all = await txGetAll(db, STORES.leads);
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    console.warn('getLeads error:', e);
    return [];
  }
}

/**
 * Delete a lead capture record by id.
 * @param {string} id
 */
export async function deleteLead(id) {
  try {
    const db = await openDB();
    await txDelete(db, STORES.leads, id);
  } catch (e) {
    console.warn('deleteLead error:', e);
  }
}

// ============================================================
//  ADMIN CONFIG  (Requirements 5.6, 7.7, 8.1, 9.8)
// ============================================================

/**
 * Save admin configuration. Always stored under key 'default'.
 * Performs a read-merge-write so unset fields retain their last value.
 * @param {Object} config - Partial or full AdminConfig fields
 * @returns {boolean} success
 */
export async function saveAdminConfig(config) {
  try {
    const db = await openDB();
    const existing = await txGet(db, STORES.adminConfig, 'default') || {};
    const merged = normalizeAdminConfig({ ...existing, ...config });
    await txPut(db, STORES.adminConfig, {
      ...merged,
      key: 'default',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.warn('saveAdminConfig error:', e);
    return false;
  }
}

/**
 * Load admin configuration.
 * Legacy keys are migrated to canonical names (see config/adminDefaults).
 * Returns defaults if no config has been saved yet.
 * @returns {Object}
 */
export async function loadAdminConfig() {
  try {
    const db = await openDB();
    const result = await txGet(db, STORES.adminConfig, 'default');
    if (!result) return null;
    return normalizeAdminConfig(result);
  } catch (e) {
    console.warn('loadAdminConfig error:', e);
    return null;
  }
}

// ============================================================
//  BACKUP RESTORE (used by backupExporter + AdminPanel)
// ============================================================

/**
 * Restore a full backup: replaces sessions, leads, settings and
 * admin config with the records from the backup payload.
 * @param {Object} backup - { sessions: [], leads: [], settings: {}, adminConfig: {} }
 * @returns {Promise<{sessions: number, leads: number}>}
 */
export async function restoreBackup(backup) {
  const db = await openDB();
  const clearAll = async (storeName) => {
    const all = await txGetAll(db, storeName);
    for (const record of all) {
      await txDelete(db, storeName, record.id ?? record.key);
    }
  };

  await clearAll(STORES.sessions);
  await clearAll(STORES.leads);
  await clearAll(STORES.settings);
  await clearAll(STORES.adminConfig);

  const sessions = Array.isArray(backup.sessions) ? backup.sessions : [];
  for (const s of sessions) {
    if (s && s.id) await txPut(db, STORES.sessions, s);
  }

  const leads = Array.isArray(backup.leads) ? backup.leads : [];
  for (const l of leads) {
    if (l && l.id) await txPut(db, STORES.leads, l);
  }

  if (backup.settings && typeof backup.settings === 'object') {
    await txPut(db, STORES.settings, {
      key: 'default',
      ...backup.settings,
      updatedAt: new Date().toISOString(),
    });
  }

  if (backup.adminConfig && typeof backup.adminConfig === 'object') {
    const merged = normalizeAdminConfig(backup.adminConfig);
    await txPut(db, STORES.adminConfig, {
      ...merged,
      key: 'default',
      updatedAt: new Date().toISOString(),
    });
  }

  return { sessions: sessions.length, leads: leads.length };
}

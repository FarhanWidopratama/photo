// ============================================================
//  Life4Cuts — IndexedDB Persistence Layer
//  Stores: photo sessions, music playlist, user settings
// ============================================================

const DB_NAME = 'Life4CutsDB';
const DB_VERSION = 1;

const STORES = {
  sessions: 'photoSessions',   // saved photo strips
  playlist: 'musicPlaylist',   // saved songs
  settings: 'userSettings',    // default preferences
};

// ── Open / Init DB ──────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

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
  } catch (e) {
    console.warn('saveSettings error:', e);
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

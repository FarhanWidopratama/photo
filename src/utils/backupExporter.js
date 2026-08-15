import JSZip from 'jszip';

/**
 * Export all sessions as a ZIP file containing PNG photos.
 * @param {Array} sessions - array from getSessions()
 */
export async function exportPhotosAsZip(sessions) {
  const zip = new JSZip();
  let failed = 0;
  let success = 0;
  
  for (const session of sessions) {
    if (!session.stripPng) { failed++; continue; }
    try {
      // Convert base64 data URL to binary
      const base64Data = session.stripPng.split(',')[1];
      if (!base64Data) { failed++; continue; }
      const date = session.date ? session.date.slice(0, 10) : 'unknown';
      const filename = `life4cuts-${session.id}-${date}.png`;
      zip.file(filename, base64Data, { base64: true });
      success++;
    } catch (e) {
      failed++;
    }
  }
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `life4cuts-photos-${Date.now()}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  
  return { success, failed };
}

/**
 * Export sessions + settings as a JSON backup file.
 */
export function exportBackupJson(sessions, settings) {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: sessions.map(s => ({
      id: s.id,
      date: s.date,
      dateFormatted: s.dateFormatted,
      theme: s.theme,
      layout: s.layout,
      filter: s.filter,
      titleText: s.titleText,
      sticker: s.sticker,
      // Exclude stripPng (binary data) to keep file small
    })),
    settings: settings || {},
  };
  
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `life4cuts-backup-${Date.now()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Import and restore backup from a JSON file.
 * Returns parsed backup object after basic validation.
 */
export async function importBackupJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Basic validation
        if (!data.version || !Array.isArray(data.sessions)) {
          reject(new Error('File backup tidak valid atau rusak'));
          return;
        }
        resolve(data);
      } catch (err) {
        reject(new Error('File backup tidak valid atau rusak'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
}

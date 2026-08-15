// Unit tests for the upgraded db.js (v2)
// Tests cover: saveLead, getLeads, deleteLead,
//              saveAdminConfig, loadAdminConfig,
//              saveSetting, loadSetting,
//              and DB-upgrade idempotency

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

// Re-import after fake-indexeddb is installed so openDB uses the fake
import {
  saveLead,
  getLeads,
  deleteLead,
  saveAdminConfig,
  loadAdminConfig,
  saveSetting,
  loadSetting,
  saveSettings,
  loadSettings,
} from '../../utils/db.js';

// Reset indexedDB between tests so state doesn't leak
import { IDBFactory } from 'fake-indexeddb';

beforeEach(() => {
  // Replace global indexedDB with a fresh instance
  (globalThis as any).indexedDB = new IDBFactory();
});

// ──────────────────────────────────────────────
//  LEAD CAPTURES
// ──────────────────────────────────────────────

describe('saveLead / getLeads / deleteLead', () => {
  it('saves a lead and retrieves it back with all fields', async () => {
    const leadId = await saveLead({ name: 'Budi', phone: '081234567890', sessionId: 'sess_001' });
    expect(leadId).toBeTruthy();
    expect(typeof leadId).toBe('string');
    expect(leadId!.startsWith('lead_')).toBe(true);

    const leads = await getLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0].name).toBe('Budi');
    expect(leads[0].phone).toBe('081234567890');
    expect(leads[0].sessionId).toBe('sess_001');
    expect(leads[0].date).toBeTruthy();
    expect(leads[0].dateFormatted).toBeTruthy();
  });

  it('saves multiple leads and returns them sorted newest first', async () => {
    await saveLead({ name: 'Alice', phone: '0811', sessionId: 's1' });
    // Small delay to ensure different timestamps
    await new Promise(r => setTimeout(r, 5));
    await saveLead({ name: 'Bob', phone: '0812', sessionId: 's2' });

    const leads = await getLeads();
    expect(leads).toHaveLength(2);
    expect(leads[0].name).toBe('Bob');   // newest first
    expect(leads[1].name).toBe('Alice');
  });

  it('returns an empty array when no leads exist', async () => {
    const leads = await getLeads();
    expect(leads).toEqual([]);
  });

  it('deletes a lead by id', async () => {
    const id = await saveLead({ name: 'Cici', phone: '0813', sessionId: 's3' });
    expect(id).toBeTruthy();

    await deleteLead(id!);
    const leads = await getLeads();
    expect(leads).toHaveLength(0);
  });

  it('saves leads with optional fields defaulting to empty strings', async () => {
    // name only, no phone, no sessionId
    await saveLead({ name: 'Dewi' } as any);
    const leads = await getLeads();
    expect(leads[0].phone).toBe('');
    expect(leads[0].sessionId).toBe('');
  });
});

// ──────────────────────────────────────────────
//  ADMIN CONFIG
// ──────────────────────────────────────────────

describe('saveAdminConfig / loadAdminConfig', () => {
  it('returns null when no config has been saved', async () => {
    const config = await loadAdminConfig();
    expect(config).toBeNull();
  });

  it('saves config and loads it back', async () => {
    await saveAdminConfig({
      passwordHash: 'abc123',
      leadCaptureEnabled: true,
      pinEventEnabled: false,
      pinEventValue: '1234',
      kioskModeEnabled: false,
      kioskIdleMinutes: 3,
    });

    const config = await loadAdminConfig();
    expect(config).not.toBeNull();
    expect(config!.key).toBe('default');
    expect(config!.passwordHash).toBe('abc123');
    expect(config!.leadCaptureEnabled).toBe(true);
    expect(config!.pinEventEnabled).toBe(false);
    expect(config!.pinEventValue).toBe('1234');
    expect(config!.kioskModeEnabled).toBe(false);
    expect(config!.kioskIdleMinutes).toBe(3);
    expect(config!.updatedAt).toBeTruthy();
  });

  it('merges partial updates without losing existing fields', async () => {
    await saveAdminConfig({ passwordHash: 'hash1', pinEventEnabled: false });
    await saveAdminConfig({ pinEventEnabled: true, kioskModeEnabled: true });

    const config = await loadAdminConfig();
    // Original field preserved
    expect(config!.passwordHash).toBe('hash1');
    // Updated field
    expect(config!.pinEventEnabled).toBe(true);
    // New field
    expect(config!.kioskModeEnabled).toBe(true);
  });

  it('always stores under key "default"', async () => {
    await saveAdminConfig({ watermarkEnabled: true });
    const config = await loadAdminConfig();
    expect(config!.key).toBe('default');
  });
});

// ──────────────────────────────────────────────
//  SAVE / LOAD SINGLE SETTING
// ──────────────────────────────────────────────

describe('saveSetting / loadSetting', () => {
  it('returns undefined when the key has never been set', async () => {
    const val = await loadSetting('nonExistentKey');
    expect(val).toBeUndefined();
  });

  it('saves a single setting and loads it back', async () => {
    await saveSetting('poseGapSeconds', 3);
    const val = await loadSetting('poseGapSeconds');
    expect(val).toBe(3);
  });

  it('updating one key does not clobber other keys', async () => {
    await saveSetting('poseGapSeconds', 2);
    await saveSetting('watermarkText', 'Life4Cuts');

    const gap = await loadSetting('poseGapSeconds');
    const wmText = await loadSetting('watermarkText');
    expect(gap).toBe(2);
    expect(wmText).toBe('Life4Cuts');
  });

  it('overwrites an existing key with the new value', async () => {
    await saveSetting('poseGapSeconds', 2);
    await saveSetting('poseGapSeconds', 5);
    const val = await loadSetting('poseGapSeconds');
    expect(val).toBe(5);
  });

  it('coexists with saveSettings / loadSettings (same underlying record)', async () => {
    await saveSettings({ theme: 'haru_white', filter: 'normal' });
    await saveSetting('poseGapSeconds', 3);

    const all = await loadSettings();
    expect(all!.theme).toBe('haru_white');
    expect(all!.poseGapSeconds).toBe(3);

    const single = await loadSetting('theme');
    expect(single).toBe('haru_white');
  });
});

// ──────────────────────────────────────────────
//  DB UPGRADE IDEMPOTENCY
// ──────────────────────────────────────────────

describe('DB upgrade idempotency', () => {
  it('existing stores survive an upgrade — can still save and load sessions', async () => {
    // Trigger openDB (which runs onupgradeneeded for version 2)
    // and verify the existing session store is intact via saveSettings
    await saveSettings({ theme: 'blossom_pink' });
    const settings = await loadSettings();
    expect(settings!.theme).toBe('blossom_pink');
  });

  it('new stores are accessible immediately after upgrade', async () => {
    // Both new stores should be functional right away
    await saveLead({ name: 'Test', phone: '000', sessionId: 'x' });
    await saveAdminConfig({ kioskModeEnabled: false });

    const leads = await getLeads();
    const config = await loadAdminConfig();

    expect(leads).toHaveLength(1);
    expect(config).not.toBeNull();
  });
});

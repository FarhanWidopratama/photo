import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Settings, BarChart2, Users, Archive } from 'lucide-react';
import { loadAdminConfig, saveAdminConfig, getLeads, getSessions, loadSettings, restoreBackup } from '../utils/db';
import { exportLeadsAsCsv } from '../utils/csvExporter';
import { exportPhotosAsZip, exportBackupJson, importBackupJson } from '../utils/backupExporter';
import AnalyticsDashboard from './AnalyticsDashboard';
import { hashString, isAdminConfigured, isStrongAdminPassword } from '../utils/adminAuth';
import { FRAME_THEME_DEFS } from '../config/frameThemes';

const ADMIN_AUTH_KEY = 'adminAuth';

export default function AdminPanel({ onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [activeTab, setActiveTab] = useState('config');
  const [adminConfig, setAdminConfig] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [leads, setLeads] = useState([]);
  const [configSaved, setConfigSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupError, setSetupError] = useState(null);
  const [passwordChangeMsg, setPasswordChangeMsg] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState(null);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const backupFileInputRef = useRef(null);

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
      setIsAuthenticated(true);
    }

    loadAdminConfig().then(cfg => {
      const loaded = cfg || {};
      setAdminConfig(loaded);
      setNeedsSetup(!isAdminConfigured(loaded));
      setFormConfig(buildDefaultFormConfig(loaded));
    }).catch(() => {
      setAdminConfig({});
      setNeedsSetup(true);
      setFormConfig(buildDefaultFormConfig({}));
    });
    getLeads().then(setLeads).catch(() => setLeads([]));
  }, []);

  function buildDefaultFormConfig(cfg) {
    return {
      leadCapture:    cfg.leadCapture    ?? false,
      pinEvent:       cfg.pinEvent       ?? false,
      pinCode:        cfg.pinCode        ?? '',
      kioskMode:      cfg.kioskMode      ?? false,
      idleMinutes:    cfg.idleMinutes    ?? 3,
      watermark:      cfg.watermark      ?? false,
      qrDelivery:     cfg.qrDelivery     ?? false,
      defaultTheme:   cfg.defaultTheme   ?? 'haru_white',
      defaultFilter:  cfg.defaultFilter  ?? 'normal',
    };
  }

  const setFC = (key, value) => setFormConfig(prev => ({ ...prev, [key]: value }));

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const cfg = await loadAdminConfig().catch(() => ({}));
    const storedHash = cfg?.passwordHash;

    if (!storedHash) {
      if (!isStrongAdminPassword(passwordInput)) {
        setPasswordError('Password minimal 6 karakter.');
        setPasswordInput('');
        return;
      }
      const hash = await hashString(passwordInput);
      await saveAdminConfig({ passwordHash: hash });
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      setAdminConfig({ ...(cfg || {}), passwordHash: hash });
      setIsAuthenticated(true);
      setNeedsSetup(false);
      setPasswordError(null);
      return;
    }

    const inputHash = await hashString(passwordInput);
    if (inputHash === storedHash) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setPasswordError(null);
    } else {
      setPasswordError('Password salah');
      setPasswordInput('');
    }
  };

  const handleSetupPassword = async (e) => {
    e.preventDefault();
    if (!isStrongAdminPassword(setupPassword)) {
      setSetupError('Password minimal 6 karakter.');
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      setSetupError('Konfirmasi password tidak cocok.');
      return;
    }

    const hash = await hashString(setupPassword);
    await saveAdminConfig({ passwordHash: hash });
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    setNeedsSetup(false);
    setIsAuthenticated(true);
    setSetupError(null);
    setSetupPassword('');
    setSetupConfirmPassword('');
  };

  const handleSaveConfig = async () => {
    const ok = await saveAdminConfig(formConfig);
    if (!ok) {
      setConfigSaveError(true);
      setConfigSaved(false);
      return;
    }
    setConfigSaveError(false);
    setConfigSaved(true);
    setTimeout(() => { window.location.reload(); }, 800);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeMsg(null);
    const cfg = await loadAdminConfig().catch(() => ({})) || {};
    const storedHash = cfg.passwordHash;

    if (!storedHash) {
      setPasswordChangeMsg({ ok: false, text: 'Silakan set up password admin terlebih dahulu.' });
      return;
    }

    const inputHash = await hashString(currentPassword);
    if (inputHash !== storedHash) {
      setPasswordChangeMsg({ ok: false, text: 'Password lama salah.' });
      return;
    }
    if (!isStrongAdminPassword(newPassword)) {
      setPasswordChangeMsg({ ok: false, text: 'Password baru minimal 6 karakter.' });
      return;
    }
    const newHash = await hashString(newPassword);
    await saveAdminConfig({ passwordHash: newHash });
    setPasswordChangeMsg({ ok: true, text: 'Password berhasil diubah.' });
    setCurrentPassword('');
    setNewPassword('');
  };

  if (!isAuthenticated && !needsSetup && !needsSetup) {
    return (
      <div style={{ position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px' }}>
        <div style={{ background:'rgba(18,22,36,0.98)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'24px',padding:'40px 32px',maxWidth:'380px',width:'100%',display:'flex',flexDirection:'column',gap:'20px',textAlign:'center' }}>
          <div style={{ fontSize:'2rem' }}>🔐</div>
          <h2 style={{ fontSize:'1.3rem',fontWeight:900,color:'#F3F4F6' }}>Admin Panel</h2>
          <p style={{ fontSize:'0.85rem',color:'#9CA3AF' }}>Masukkan password untuk mengakses pengaturan</p>
          <form onSubmit={handlePasswordSubmit} style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
            <input
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(null); }}
              placeholder="Password admin..."
              autoFocus
              style={{ background:'rgba(0,0,0,0.3)',border:'1.5px solid rgba(255,255,255,0.12)',borderRadius:'10px',color:'#F3F4F6',fontSize:'1rem',padding:'12px 14px',outline:'none',width:'100%' }}
            />
            {passwordError && <p style={{ color:'#FF6584',fontSize:'0.85rem' }}>{passwordError}</p>}
            <button type="submit" style={{ background:'linear-gradient(135deg,#FF6584,#7C5CFC)',color:'#fff',border:'none',borderRadius:'10px',padding:'13px',fontSize:'0.95rem',fontWeight:800,cursor:'pointer' }}>
              Masuk
            </button>
            <button type="button" onClick={onClose} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer',fontSize:'0.85rem' }}>
              Batalkan
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (needsSetup && !isAuthenticated) {
    return (
      <div style={{ position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px' }}>
        <div style={{ background:'rgba(18,22,36,0.98)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'24px',padding:'40px 32px',maxWidth:'420px',width:'100%',display:'flex',flexDirection:'column',gap:'20px',textAlign:'center' }}>
          <div style={{ fontSize:'2rem' }}>🛡️</div>
          <h2 style={{ fontSize:'1.3rem',fontWeight:900,color:'#F3F4F6' }}>Setup Admin</h2>
          <p style={{ fontSize:'0.85rem',color:'#9CA3AF',margin:0 }}>Belum ada password admin yang diset. Buat password baru untuk mengamankan panel admin.</p>
          <form onSubmit={handleSetupPassword} style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
            <input
              type="password"
              value={setupPassword}
              onChange={e => { setSetupPassword(e.target.value); setSetupError(null); }}
              placeholder="Password admin baru"
              autoFocus
              style={{ background:'rgba(0,0,0,0.3)',border:'1.5px solid rgba(255,255,255,0.12)',borderRadius:'10px',color:'#F3F4F6',fontSize:'1rem',padding:'12px 14px',outline:'none',width:'100%' }}
            />
            <input
              type="password"
              value={setupConfirmPassword}
              onChange={e => { setSetupConfirmPassword(e.target.value); setSetupError(null); }}
              placeholder="Ulangi password"
              style={{ background:'rgba(0,0,0,0.3)',border:'1.5px solid rgba(255,255,255,0.12)',borderRadius:'10px',color:'#F3F4F6',fontSize:'1rem',padding:'12px 14px',outline:'none',width:'100%' }}
            />
            {setupError && <p style={{ color:'#FF6584',fontSize:'0.85rem',margin:0 }}>{setupError}</p>}
            <button type="submit" style={{ background:'linear-gradient(135deg,#FF6584,#7C5CFC)',color:'#fff',border:'none',borderRadius:'10px',padding:'13px',fontSize:'0.95rem',fontWeight:800,cursor:'pointer' }}>
              Simpan Password Admin
            </button>
            <button type="button" onClick={onClose} style={{ background:'none',border:'none',color:'#6B7280',cursor:'pointer',fontSize:'0.85rem' }}>
              Batalkan
            </button>
          </form>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'config', label: 'Config', icon: <Settings size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
    { id: 'leads', label: 'Leads', icon: <Users size={16} /> },
    { id: 'backup', label: 'Backup', icon: <Archive size={16} /> },
  ];

  return (
    <div style={{ position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',overflow:'auto',padding:'20px' }}>
      <div style={{ background:'rgba(14,18,30,0.98)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'24px',maxWidth:'720px',margin:'0 auto',minHeight:'500px',display:'flex',flexDirection:'column' }}>
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize:'1.2rem',fontWeight:900,color:'#F3F4F6',display:'flex',alignItems:'center',gap:'8px' }}>
            <Lock size={20} color="#FF6584" /> Admin Panel
          </h2>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#9CA3AF',borderRadius:'8px',width:'34px',height:'34px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display:'flex',gap:'4px',padding:'12px 24px 0',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'8px 8px 0 0',border:'none',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,
              background: activeTab === tab.id ? 'rgba(255,101,132,0.15)' : 'transparent',
              color: activeTab === tab.id ? '#FF6584' : '#6B7280',
              borderBottom: activeTab === tab.id ? '2px solid #FF6584' : '2px solid transparent',
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex:1,padding:'24px',overflowY:'auto' }}>
          {activeTab === 'config' && formConfig && (
            <div style={{ display:'flex',flexDirection:'column',gap:'24px' }}>

              {/* ── Feature Toggles ── */}
              <section>
                <h3 style={{ color:'#F3F4F6',fontSize:'0.95rem',fontWeight:800,marginBottom:'14px',textTransform:'uppercase',letterSpacing:'0.06em' }}>⚙️ Feature Toggles</h3>
                <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>

                  {/* Lead Capture */}
                  <ToggleRow label="Lead Capture" checked={formConfig.leadCapture} onChange={v => setFC('leadCapture', v)} />

                  {/* PIN Event */}
                  <ToggleRow label="PIN Event" checked={formConfig.pinEvent} onChange={v => setFC('pinEvent', v)}>
                    {formConfig.pinEvent && (
                      <input
                        type="text" inputMode="numeric" maxLength={6} pattern="[0-9]{4,6}"
                        value={formConfig.pinCode}
                        onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) setFC('pinCode', e.target.value); }}
                        placeholder="4–6 digit PIN"
                        style={inputStyle}
                      />
                    )}
                  </ToggleRow>

                  {/* Kiosk Mode */}
                  <ToggleRow label="Kiosk Mode" checked={formConfig.kioskMode} onChange={v => setFC('kioskMode', v)}>
                    {formConfig.kioskMode && (
                      <select value={formConfig.idleMinutes} onChange={e => setFC('idleMinutes', Number(e.target.value))} style={inputStyle}>
                        <option value={1}>1 menit idle</option>
                        <option value={3}>3 menit idle</option>
                        <option value={5}>5 menit idle</option>
                      </select>
                    )}
                  </ToggleRow>

                  {/* Watermark */}
                  <ToggleRow label="Watermark" checked={formConfig.watermark} onChange={v => setFC('watermark', v)} />

                  {/* QR Delivery */}
                  <ToggleRow label="QR Delivery" checked={formConfig.qrDelivery} onChange={v => setFC('qrDelivery', v)} />
                </div>
              </section>

              {/* ── Default Settings ── */}
              <section>
                <h3 style={{ color:'#F3F4F6',fontSize:'0.95rem',fontWeight:800,marginBottom:'14px',textTransform:'uppercase',letterSpacing:'0.06em' }}>🎨 Default Settings</h3>
                <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>Default Theme</span>
                    <select value={formConfig.defaultTheme} onChange={e => setFC('defaultTheme', e.target.value)} style={inputStyle}>
                      {FRAME_THEME_DEFS.filter(t => !t.id.startsWith('custom_')).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>Filter Default</span>
                    <select value={formConfig.defaultFilter} onChange={e => setFC('defaultFilter', e.target.value)} style={inputStyle}>
                      <option value="normal">Asli</option>
                      <option value="haru_soft">Haru Soft</option>
                      <option value="photomatic_mono">Hitam Putih</option>
                      <option value="vivid">Vivid</option>
                      <option value="vintage">Vintage</option>
                    </select>
                  </label>
                </div>
              </section>

              {/* ── Change Password ── */}
              <section>
                <h3 style={{ color:'#F3F4F6',fontSize:'0.95rem',fontWeight:800,marginBottom:'14px',textTransform:'uppercase',letterSpacing:'0.06em' }}>🔐 Ganti Password</h3>
                <form onSubmit={handleChangePassword} style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Password saat ini" style={inputStyle} />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password baru" style={inputStyle} />
                  {passwordChangeMsg && (
                    <p style={{ fontSize:'0.82rem',color: passwordChangeMsg.ok ? '#34D399' : '#FF6584',margin:0 }}>{passwordChangeMsg.text}</p>
                  )}
                  <button type="submit" style={{ ...btnSecondaryStyle, alignSelf:'flex-start' }}>Simpan Password</button>
                </form>
              </section>

              {/* ── Save Config ── */}
              <div style={{ paddingTop:'8px',borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={handleSaveConfig} style={btnPrimaryStyle} disabled={configSaved}>
                  {configSaved ? '✅ Tersimpan, memuat ulang...' : '💾 Simpan Konfigurasi'}
                </button>
                {configSaveError && (
                  <p style={{ fontSize:'0.82rem',color:'#FF6584',margin:'10px 0 0',textAlign:'center' }}>
                    ⚠️ Gagal menyimpan konfigurasi (kemungkinan penyimpanan browser penuh atau mode private). Coba lagi.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <AnalyticsDashboard />}

          {activeTab === 'leads' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px' }}>
                <h3 style={{ color:'#F3F4F6',fontSize:'0.95rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em',margin:0 }}>
                  👥 Lead Captures ({leads.length})
                </h3>
                <button
                  onClick={() => exportLeadsAsCsv(leads)}
                  disabled={leads.length === 0}
                  style={{ ...btnSecondaryStyle, opacity: leads.length === 0 ? 0.45 : 1 }}
                >
                  📥 Export CSV
                </button>
              </div>

              {leads.length === 0 ? (
                <div style={{ textAlign:'center',padding:'40px 20px',color:'#6B7280',fontSize:'0.9rem' }}>
                  <div style={{ fontSize:'2rem',marginBottom:'8px' }}>📭</div>
                  <p style={{ margin:0 }}>Belum ada lead yang tercatat.</p>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'0.83rem',color:'#D1D5DB' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                        {['Nama','Nomor HP','Tanggal','ID Sesi'].map(h => (
                          <th key={h} style={{ textAlign:'left',padding:'8px 10px',color:'#9CA3AF',fontWeight:700,whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => (
                        <tr key={lead.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding:'8px 10px' }}>{lead.name || '—'}</td>
                          <td style={{ padding:'8px 10px' }}>{lead.phone || '—'}</td>
                          <td style={{ padding:'8px 10px',whiteSpace:'nowrap' }}>{lead.dateFormatted || lead.date?.slice(0,10) || '—'}</td>
                          <td style={{ padding:'8px 10px',fontFamily:'monospace',fontSize:'0.75rem',color:'#6B7280' }}>{lead.sessionId || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div style={{ display:'flex',flexDirection:'column',gap:'20px' }}>
              <h3 style={{ color:'#F3F4F6',fontSize:'0.95rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em',margin:0 }}>
                🗄️ Backup & Restore
              </h3>

              {/* Status message */}
              {backupMsg && (
                <div style={{ padding:'10px 14px',borderRadius:'8px',fontSize:'0.85rem',fontWeight:600,
                  background: backupMsg.ok ? 'rgba(52,211,153,0.1)' : 'rgba(255,101,132,0.1)',
                  border: `1px solid ${backupMsg.ok ? 'rgba(52,211,153,0.3)' : 'rgba(255,101,132,0.3)'}`,
                  color: backupMsg.ok ? '#34D399' : '#FF6584',
                }}>
                  {backupMsg.text}
                </div>
              )}

              {/* Loading indicator */}
              {backupLoading && (
                <div style={{ display:'flex',alignItems:'center',gap:'10px',color:'#9CA3AF',fontSize:'0.85rem' }}>
                  <div style={{ width:'16px',height:'16px',border:'2px solid rgba(255,255,255,0.15)',borderTopColor:'#FF6584',borderRadius:'50%',animation:'spin 0.8s linear infinite',flexShrink:0 }} />
                  Memproses, harap tunggu...
                </div>
              )}

              {/* Export section */}
              <section style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                <p style={{ color:'#9CA3AF',fontSize:'0.8rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:0 }}>Export</p>

                <button
                  disabled={backupLoading}
                  onClick={async () => {
                    setBackupLoading(true);
                    setBackupMsg(null);
                    try {
                      const sessions = await getSessions();
                      const result = await exportPhotosAsZip(sessions);
                      setBackupMsg({ ok:true, text:`✅ ZIP berhasil diunduh (${result.success} foto${result.failed > 0 ? `, ${result.failed} gagal` : ''})` });
                    } catch (e) {
                      setBackupMsg({ ok:false, text:'❌ Gagal mengekspor ZIP: ' + e.message });
                    } finally {
                      setBackupLoading(false);
                    }
                  }}
                  style={{ ...btnSecondaryStyle, opacity: backupLoading ? 0.5 : 1, textAlign:'left' }}
                >
                  📦 Export Foto (ZIP)
                </button>

                <button
                  disabled={backupLoading || leads.length === 0}
                  onClick={() => {
                    setBackupMsg(null);
                    exportLeadsAsCsv(leads);
                    setBackupMsg({ ok:true, text:'✅ CSV leads berhasil diunduh.' });
                  }}
                  style={{ ...btnSecondaryStyle, opacity: (backupLoading || leads.length === 0) ? 0.5 : 1, textAlign:'left' }}
                >
                  📊 Export Data Lead (CSV)
                  {leads.length === 0 && <span style={{ color:'#6B7280',fontWeight:400,marginLeft:'6px',fontSize:'0.78rem' }}>(belum ada data)</span>}
                </button>

                <button
                  disabled={backupLoading}
                  onClick={async () => {
                    setBackupLoading(true);
                    setBackupMsg(null);
                    try {
                      const [sessions, settings, adminConfig] = await Promise.all([getSessions(), loadSettings(), loadAdminConfig()]);
                      exportBackupJson({ sessions, settings, leads, adminConfig, includePhotos });
                      setBackupMsg({ ok:true, text:'✅ Backup JSON berhasil diunduh.' });
                    } catch (e) {
                      setBackupMsg({ ok:false, text:'❌ Gagal mengekspor backup: ' + e.message });
                    } finally {
                      setBackupLoading(false);
                    }
                  }}
                  style={{ ...btnSecondaryStyle, opacity: backupLoading ? 0.5 : 1, textAlign:'left' }}
                >
                  💾 Export Backup Lengkap (JSON)
                </button>

                <label style={{ display:'flex',alignItems:'center',gap:'8px',fontSize:'0.82rem',color:'#9CA3AF',cursor:'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includePhotos}
                    onChange={e => setIncludePhotos(e.target.checked)}
                    style={{ accentColor:'#FF6584',width:'16px',height:'16px' }}
                  />
                  Sertakan foto strip (PNG) dalam backup — file jadi lebih besar
                </label>
              </section>

              {/* Import / Restore section */}
              <section style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                <p style={{ color:'#9CA3AF',fontSize:'0.8rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',margin:0 }}>Import / Restore</p>

                {/* Hidden file input */}
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display:'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // Reset input so the same file can be re-selected
                    e.target.value = '';
                    setBackupLoading(true);
                    setBackupMsg(null);
                    try {
                      const data = await importBackupJson(file);
                      const sessionCount = data.sessions?.length ?? 0;
                      const leadCount = data.leads?.length ?? 0;
                      const confirmText = `Backup ini berisi ${sessionCount} sesi ${data.settings || data.adminConfig ? ', pengaturan, dan data lead (' + leadCount + ')' : ''}. ` +
                        'Semua data saat ini (galeri, lead, pengaturan) AKAN DIGANTI. Lanjutkan restore?';
                      if (!window.confirm(confirmText)) {
                        setBackupMsg({ ok:false, text:'Restore dibatalkan.' });
                        return;
                      }
                      const result = await restoreBackup(data);
                      setBackupMsg({ ok:true, text:`✅ Restore selesai: ${result.sessions} sesi, ${result.leads} lead dipulihkan. Memuat ulang...` });
                      setTimeout(() => { window.location.reload(); }, 1200);
                    } catch (e) {
                      setBackupMsg({ ok:false, text:'❌ ' + e.message });
                    } finally {
                      setBackupLoading(false);
                    }
                  }}
                />

                <button
                  disabled={backupLoading}
                  onClick={() => { setBackupMsg(null); backupFileInputRef.current?.click(); }}
                  style={{ ...btnSecondaryStyle, opacity: backupLoading ? 0.5 : 1, textAlign:'left' }}
                >
                  📥 Import / Restore Backup
                </button>

                <p style={{ color:'#6B7280',fontSize:'0.78rem',margin:0,lineHeight:1.5 }}>
                  Pilih file <code style={{ background:'rgba(255,255,255,0.07)',borderRadius:'4px',padding:'1px 5px' }}>.json</code> yang sebelumnya diekspor melalui "Export Backup Lengkap".
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared style objects ────────────────────────────────────

const inputStyle = {
  background: 'rgba(0,0,0,0.3)',
  border: '1.5px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  color: '#F3F4F6',
  fontSize: '0.88rem',
  padding: '9px 12px',
  outline: 'none',
  width: '100%',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelTextStyle = {
  color: '#9CA3AF',
  fontSize: '0.82rem',
  fontWeight: 600,
};

const btnPrimaryStyle = {
  background: 'linear-gradient(135deg,#FF6584,#7C5CFC)',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 22px',
  fontSize: '0.92rem',
  fontWeight: 800,
  cursor: 'pointer',
  width: '100%',
};

const btnSecondaryStyle = {
  background: 'rgba(255,255,255,0.07)',
  color: '#D1D5DB',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
};

// ── ToggleRow sub-component ─────────────────────────────────

function ToggleRow({ label, checked, onChange, children }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
      <label style={{ display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',gap:'12px' }}>
        <span style={{ color:'#D1D5DB',fontSize:'0.9rem',fontWeight:600 }}>{label}</span>
        <span
          onClick={() => onChange(!checked)}
          role="checkbox"
          aria-checked={checked}
          tabIndex={0}
          onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange(!checked)}
          style={{
            display:'inline-flex',alignItems:'center',
            width:'42px',height:'24px',borderRadius:'12px',
            background: checked ? 'linear-gradient(135deg,#FF6584,#7C5CFC)' : 'rgba(255,255,255,0.12)',
            position:'relative',transition:'background 0.2s',flexShrink:0,cursor:'pointer',
          }}
        >
          <span style={{
            position:'absolute',
            left: checked ? '20px' : '3px',
            width:'18px',height:'18px',borderRadius:'50%',
            background:'#fff',transition:'left 0.2s',
            boxShadow:'0 1px 4px rgba(0,0,0,0.4)',
          }} />
        </span>
      </label>
      {children && (
        <div style={{ paddingLeft:'8px' }}>{children}</div>
      )}
    </div>
  );
}

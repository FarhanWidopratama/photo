import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Settings, BarChart2, Users, Archive } from 'lucide-react';
import { loadAdminConfig, saveAdminConfig, getLeads, getSessions, loadSettings } from '../utils/db';
import { exportLeadsAsCsv } from '../utils/csvExporter';
import { exportPhotosAsZip, exportBackupJson, importBackupJson } from '../utils/backupExporter';
import AnalyticsDashboard from './AnalyticsDashboard';

const ADMIN_AUTH_KEY = 'adminAuth';
const DEFAULT_PASSWORD = 'admin1234';

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
  const [passwordChangeMsg, setPasswordChangeMsg] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState(null);
  const backupFileInputRef = useRef(null);

  useEffect(() => {
    // Check sessionStorage for existing auth
    if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
      setIsAuthenticated(true);
    }
    loadAdminConfig().then(cfg => {
      const loaded = cfg || {};
      setAdminConfig(loaded);
      setFormConfig(buildDefaultFormConfig(loaded));
    }).catch(() => {
      setAdminConfig({});
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
    
    // Hash the input using SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(passwordInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // If no password has been set yet, use default
    const defaultHash = await hashString(DEFAULT_PASSWORD);
    const correctHash = storedHash || defaultHash;
    
    if (inputHash === correctHash) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setPasswordError(null);
    } else {
      setPasswordError('Password salah');
      setPasswordInput('');
    }
  };

  const hashString = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSaveConfig = async () => {
    await saveAdminConfig(formConfig);
    setConfigSaved(true);
    setTimeout(() => { window.location.reload(); }, 800);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeMsg(null);
    const cfg = await loadAdminConfig().catch(() => ({})) || {};
    const defaultHash = await hashString(DEFAULT_PASSWORD);
    const storedHash = cfg.passwordHash || defaultHash;
    const inputHash = await hashString(currentPassword);
    if (inputHash !== storedHash) {
      setPasswordChangeMsg({ ok: false, text: 'Password lama salah.' });
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPasswordChangeMsg({ ok: false, text: 'Password baru minimal 4 karakter.' });
      return;
    }
    const newHash = await hashString(newPassword);
    await saveAdminConfig({ passwordHash: newHash });
    setPasswordChangeMsg({ ok: true, text: 'Password berhasil diubah.' });
    setCurrentPassword('');
    setNewPassword('');
  };

  if (!isAuthenticated) {
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
                      <option value="haru_white">Haru White</option>
                      <option value="anime_sakura">Anime Sakura</option>
                      <option value="anime_chibi">Anime Chibi</option>
                      <option value="dark_neon">Dark Neon</option>
                      <option value="pastel_dream">Pastel Dream</option>
                    </select>
                  </label>
                  <label style={labelStyle}>
                    <span style={labelTextStyle}>Default Filter</span>
                    <select value={formConfig.defaultFilter} onChange={e => setFC('defaultFilter', e.target.value)} style={inputStyle}>
                      <option value="normal">Normal</option>
                      <option value="haru_soft">Haru Soft</option>
                      <option value="photomatic_mono">Photomatic Mono</option>
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
                      const [sessions, settings] = await Promise.all([getSessions(), loadSettings()]);
                      exportBackupJson(sessions, settings);
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
                      setBackupMsg({ ok:true, text:`✅ Backup berhasil diimpor: ${data.sessions?.length ?? 0} sesi dari ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString('id-ID') : 'tanggal tidak diketahui'}.` });
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

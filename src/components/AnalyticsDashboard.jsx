import React, { useEffect, useState } from 'react';
import { getSessions } from '../utils/db';
import { computePeriodCounts, computeTopUsed, computeHourlyDistribution, computeWeeklyDistribution } from '../utils/analytics';

export default function AnalyticsDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSessions()
      .then(data => { setSessions(data); setLoading(false); })
      .catch(e => { setError('Gagal memuat data. ' + e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ color:'#9CA3AF', textAlign:'center', padding:'40px' }}>Memuat data...</div>;
  if (error) return <div style={{ color:'#FF6584', textAlign:'center', padding:'40px' }}>{error}</div>;

  const periodCounts = computePeriodCounts(sessions);
  const topTheme = computeTopUsed(sessions, 'theme');
  const topFilter = computeTopUsed(sessions, 'filter');
  const hourlyDist = computeHourlyDistribution(sessions);
  const weeklyDist = computeWeeklyDistribution(sessions);
  const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const maxHourly = Math.max(...hourlyDist, 1);
  const maxWeekly = Math.max(...weeklyDist, 1);
  const noData = sessions.length === 0;

  const cardStyle = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'16px', display:'flex', flexDirection:'column', gap:'4px' };
  const labelStyle = { fontSize:'0.72rem', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 };
  const valueStyle = { fontSize:'1.6rem', fontWeight:900, color:'#F3F4F6' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#F3F4F6' }}>📊 Dashboard Analytics</h3>

      {noData ? (
        <p style={{ color:'#9CA3AF', textAlign:'center', padding:'32px 0' }}>Belum ada data sesi untuk periode ini</p>
      ) : (
        <>
          {/* Period counts */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px' }}>
            <div style={cardStyle}><span style={labelStyle}>Hari Ini</span><span style={valueStyle}>{periodCounts.today}</span></div>
            <div style={cardStyle}><span style={labelStyle}>7 Hari</span><span style={valueStyle}>{periodCounts.last7}</span></div>
            <div style={cardStyle}><span style={labelStyle}>30 Hari</span><span style={valueStyle}>{periodCounts.last30}</span></div>
          </div>

          {/* Top theme and filter */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div style={cardStyle}><span style={labelStyle}>Frame Populer</span><span style={{ fontSize:'0.9rem', fontWeight:700, color:'#FF6584' }}>{topTheme || '-'}</span></div>
            <div style={cardStyle}><span style={labelStyle}>Filter Populer</span><span style={{ fontSize:'0.9rem', fontWeight:700, color:'#7C5CFC' }}>{topFilter || '-'}</span></div>
          </div>

          {/* Weekly bar chart */}
          <div style={cardStyle}>
            <span style={labelStyle}>Sesi per Hari (Minggu ini)</span>
            <div style={{ display:'flex', gap:'6px', alignItems:'flex-end', height:'60px', marginTop:'8px' }}>
              {weeklyDist.map((count, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'100%', background:'linear-gradient(180deg,#7C5CFC,#FF6584)', borderRadius:'3px 3px 0 0', height:`${Math.max((count / maxWeekly) * 50, count > 0 ? 4 : 0)}px`, transition:'height 0.3s' }} />
                  <span style={{ fontSize:'0.62rem', color:'#9CA3AF' }}>{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly bar chart */}
          <div style={cardStyle}>
            <span style={labelStyle}>Sesi per Jam (0–23)</span>
            <div style={{ display:'flex', gap:'2px', alignItems:'flex-end', height:'50px', marginTop:'8px' }}>
              {hourlyDist.map((count, h) => (
                <div key={h} title={`${h}:00 — ${count} sesi`} style={{ flex:1, background:'rgba(56,239,125,0.7)', borderRadius:'2px 2px 0 0', height:`${Math.max((count / maxHourly) * 44, count > 0 ? 3 : 0)}px`, cursor:'default', transition:'height 0.3s' }} />
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
              <span style={{ fontSize:'0.6rem', color:'#6B7280' }}>00:00</span>
              <span style={{ fontSize:'0.6rem', color:'#6B7280' }}>23:00</span>
            </div>
          </div>

          <p style={{ fontSize:'0.75rem', color:'#6B7280', textAlign:'center' }}>Total: {sessions.length} sesi tersimpan</p>
        </>
      )}
    </div>
  );
}

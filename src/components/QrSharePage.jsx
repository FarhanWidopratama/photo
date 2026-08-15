import React, { useState, useEffect } from 'react';

export default function QrSharePage() {
  const [stripUrl, setStripUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('pendingStrip');
    if (data) {
      setStripUrl(data);
    } else {
      setError(true);
    }
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = stripUrl;
    link.download = `life4cuts-${Date.now()}.png`;
    link.click();
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0B0F17', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', gap:'24px' }}>
      <h1 style={{ color:'#FF6584', fontFamily:'Outfit', fontWeight:900, fontSize:'1.8rem' }}>LIFE 4 CUTS 📸</h1>
      {error ? (
        <>
          <p style={{ color:'#9CA3AF', textAlign:'center' }}>Foto tidak ditemukan. Minta foto ulang di booth.</p>
          <a href="/" style={{ color:'#7C5CFC', textDecoration:'underline' }}>Kembali ke Studio</a>
        </>
      ) : stripUrl ? (
        <>
          <img src={stripUrl} alt="Strip Foto" style={{ maxWidth:'300px', width:'100%', borderRadius:'12px', boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }} />
          <button onClick={handleDownload} style={{ background:'linear-gradient(135deg,#FF6584,#7C5CFC)', color:'white', border:'none', borderRadius:'12px', padding:'14px 32px', fontSize:'1rem', fontWeight:800, cursor:'pointer' }}>
            📥 Unduh Foto
          </button>
          <p style={{ color:'#6B7280', fontSize:'0.82rem', textAlign:'center' }}>Tap tombol di atas untuk menyimpan foto ke HP kamu</p>
        </>
      ) : (
        <div style={{ color:'#9CA3AF' }}>Memuat foto...</div>
      )}
    </div>
  );
}

// src/components/ui/AnnouncementBanner.jsx
// Dismissible site-wide announcement banner
import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';

const ANNOUNCEMENT_KEY = 'attanovel_banner_dismissed_v2';
const ANNOUNCEMENT_TEXT = '🎉 AttaNovel kini hadir dengan fitur Chat Langsung, Leaderboard, Dashboard Penulis Premium, dan lebih dari 37 genre! Selamat menulis dan membaca!';

const AnnouncementBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(ANNOUNCEMENT_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(109,40,217,0.95), rgba(139,92,246,0.95))',
        color: '#fff',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '0.85rem',
        fontWeight: '500',
        zIndex: 9998,
        position: 'relative',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        animation: 'slideDown 0.4s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <Megaphone size={16} style={{ flexShrink: 0 }} />
        <span>{ANNOUNCEMENT_TEXT}</span>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          borderRadius: '50%',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        title="Tutup"
      >
        <X size={13} />
      </button>
    </div>
  );
};

export default AnnouncementBanner;

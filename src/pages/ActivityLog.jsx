// src/pages/ActivityLog.jsx — Riwayat Aktivitas Pengguna
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Heart, Bookmark, MessageCircle, BookOpen,
  UserPlus, LogIn, Send, Star, Clock, Filter
} from 'lucide-react';
import { getUserActivity } from '../firebase/activity';
import { useAuth } from '../context/AuthContext';
import './StaticPage.css';

const TYPE_CONFIG = {
  login:   { icon: <LogIn size={16} />,         color: '#10b981', label: 'Masuk' },
  like:    { icon: <Heart size={16} />,          color: '#ef4444', label: 'Menyukai Novel' },
  unlike:  { icon: <Heart size={16} />,          color: '#6b7280', label: 'Batal Menyukai' },
  bookmark:  { icon: <Bookmark size={16} />,     color: '#f59e0b', label: 'Menyimpan Novel' },
  unbookmark:{ icon: <Bookmark size={16} />,     color: '#6b7280', label: 'Hapus Simpan' },
  comment: { icon: <MessageCircle size={16} />,  color: '#8b5cf6', label: 'Berkomentar' },
  publish: { icon: <BookOpen size={16} />,       color: '#06b6d4', label: 'Menerbitkan Novel' },
  chapter: { icon: <Star size={16} />,           color: '#a78bfa', label: 'Menerbitkan Bab' },
  follow:  { icon: <UserPlus size={16} />,       color: '#f97316', label: 'Mengikuti Pengguna' },
  chat:    { icon: <Send size={16} />,           color: '#3b82f6', label: 'Pesan Terkirim' },
};

const formatTs = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ActivityLog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const load = async () => {
      const data = await getUserActivity(user.uid, 100);
      setActivities(data);
      setLoading(false);
    };
    load();
  }, [user, navigate]);

  const filterOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'like', label: 'Likes' },
    { value: 'bookmark', label: 'Bookmark' },
    { value: 'comment', label: 'Komentar' },
    { value: 'publish', label: 'Penerbitan' },
    { value: 'chat', label: 'Chat' },
  ];

  const filtered = filter === 'all'
    ? activities
    : activities.filter(a => a.type.startsWith(filter));

  return (
    <div className="static-page">
      <div className="static-page__hero">
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', marginBottom: 'var(--space-lg)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Activity size={30} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <h1>Riwayat <span className="text-gradient">Aktivitas</span></h1>
          <p>Rekam jejak semua aktivitasmu di AttaNovel.</p>
        </div>
      </div>

      <div className="container">
        <div style={{ maxWidth: '760px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
          {filterOptions.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '5px 14px', borderRadius: '20px', border: '1px solid',
                borderColor: filter === f.value ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.1)',
                background: filter === f.value ? 'rgba(139,92,246,0.2)' : 'transparent',
                color: filter === f.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                transition: 'all 0.15s',
              }}
            >{f.label}</button>
          ))}
        </div>

        <div style={{ maxWidth: '760px', margin: '0 auto', paddingBottom: 'var(--space-3xl)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
              <Clock size={40} style={{ marginBottom: 16, opacity: 0.4 }} />
              <h3>Belum Ada Aktivitas</h3>
              <p style={{ fontSize: '0.9rem', marginTop: 8 }}>Aktivitasmu akan muncul di sini saat kamu mulai berinteraksi di AttaNovel.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.map(act => {
                const cfg = TYPE_CONFIG[act.type] || { icon: <Activity size={16} />, color: '#6b7280', label: act.type };
                return (
                  <div key={act.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: cfg.color,
                    }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-text)' }}>
                        {cfg.label}
                        {act.detail?.novelTitle && (
                          <span style={{ color: 'var(--color-gold)', fontWeight: '500' }}> — {act.detail.novelTitle}</span>
                        )}
                        {act.detail?.message && (
                          <span style={{ color: 'var(--color-text-muted)', fontWeight: '400' }}> &quot;{act.detail.message}&quot;</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {formatTs(act.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;

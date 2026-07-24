// src/pages/ActivityLog.jsx — Full activity history with filtering
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Heart, MessageCircle, Bookmark, BookOpen,
  UserPlus, LogIn, Send, Bell, Filter, RefreshCw, Trash2, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserActivity } from '../firebase/activity';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import './StaticPage.css';

const ACTIVITY_ICONS = {
  like:      { icon: <Heart size={15} />,         label: 'Menyukai Novel',       color: '#ef4444' },
  bookmark:  { icon: <Bookmark size={15} />,      label: 'Menyimpan Novel',      color: '#f59e0b' },
  comment:   { icon: <MessageCircle size={15} />, label: 'Mengomentari Bab',     color: '#8b5cf6' },
  publish:   { icon: <BookOpen size={15} />,      label: 'Menerbitkan Novel',    color: '#10b981' },
  chapter:   { icon: <BookOpen size={15} />,      label: 'Menerbitkan Bab',      color: '#06b6d4' },
  follow:    { icon: <UserPlus size={15} />,      label: 'Mengikuti Pengguna',   color: '#3b82f6' },
  chat:      { icon: <Send size={15} />,          label: 'Mengirim Pesan',       color: '#a78bfa' },
  login:     { icon: <LogIn size={15} />,         label: 'Masuk ke Akun',        color: '#6b7280' },
  read:      { icon: <BookOpen size={15} />,      label: 'Membaca Bab',          color: '#14b8a6' },
};

const FILTER_TYPES = ['Semua', 'like', 'bookmark', 'comment', 'publish', 'chapter', 'follow', 'chat', 'read'];

const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffH < 24) return `${diffH} jam lalu`;
  if (diffD === 1) return 'Kemarin';
  if (diffD < 7) return `${diffD} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ActivityLog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadActivities();
  }, [user]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await getUserActivity(user.uid, 100);
      setActivities(data);
    } catch (e) {
      console.error('Failed to load activities:', e);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const filtered = filter === 'Semua'
    ? activities
    : activities.filter(a => a.type === filter);

  const getActivityText = (a) => {
    const info = ACTIVITY_ICONS[a.type] || { label: a.type, color: '#888' };
    const detail = a.detail || {};
    switch (a.type) {
      case 'like':     return `Menyukai "${detail.novelTitle || 'novel'}"`;
      case 'bookmark': return `Menyimpan "${detail.novelTitle || 'novel'}"`;
      case 'comment':  return `Mengomentari bab "${detail.chapterTitle || 'bab'}" di "${detail.novelTitle || 'novel'}"`;
      case 'publish':  return `Menerbitkan novel "${detail.novelTitle || ''}"`;
      case 'chapter':  return `Menambahkan bab "${detail.chapterTitle || ''}" di "${detail.novelTitle || ''}"`;
      case 'follow':   return `Mengikuti ${detail.targetName || 'pengguna'}`;
      case 'chat':     return `Mengirim pesan kepada ${detail.targetName || 'seseorang'}`;
      case 'login':    return `Masuk ke akun`;
      case 'read':     return `Membaca "${detail.chapterTitle || 'bab'}" di "${detail.novelTitle || 'novel'}"`;
      default:         return info.label;
    }
  };

  return (
    <div className="static-page">
      <div className="container">
        <div className="static-page__header">
          <Activity size={28} className="static-page__icon" style={{ color: 'var(--color-primary-light)' }} />
          <h1>Riwayat Aktivitas</h1>
          <p>Semua aktivitasmu di AttaNovel tercatat di sini</p>
        </div>

        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', maxWidth: '780px', margin: '0 auto' }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
              {FILTER_TYPES.map(t => {
                const info = ACTIVITY_ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem',
                      border: '1px solid',
                      borderColor: filter === t ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.08)',
                      background: filter === t ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                      color: filter === t ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {info ? info.icon : <Filter size={12} />}
                    {t === 'Semua' ? 'Semua' : (info?.label || t)}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px', color: 'var(--color-text-muted)', cursor: 'pointer',
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
          </div>

          {/* Activity Count */}
          {!loading && (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Menampilkan <strong>{filtered.length}</strong> aktivitas
              {filter !== 'Semua' && ` (filter: ${ACTIVITY_ICONS[filter]?.label || filter})`}
            </p>
          )}

          {/* List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner spinner-lg" />
              <p style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Memuat riwayat...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
              <Clock size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: '1rem' }}>
                {filter === 'Semua'
                  ? 'Belum ada aktivitas tercatat. Mulai beraktivitas di AttaNovel!'
                  : `Belum ada aktivitas dengan kategori "${ACTIVITY_ICONS[filter]?.label || filter}"`
                }
              </p>
              {filter !== 'Semua' && (
                <button
                  onClick={() => setFilter('Semua')}
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 12 }}
                >
                  Lihat Semua
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map(a => {
                const info = ACTIVITY_ICONS[a.type] || { icon: <Bell size={15} />, color: '#888', label: a.type };
                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      padding: '13px 16px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      borderLeft: `3px solid ${info.color}`,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: `${info.color}20`, color: info.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {info.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.4 }}>
                        {getActivityText(a)}
                      </p>
                      {a.detail?.novelId && (
                        <Link
                          to={`/novel/${a.detail.novelId}`}
                          style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textDecoration: 'none', marginTop: 2, display: 'inline-block' }}
                          onClick={e => e.stopPropagation()}
                        >
                          Lihat Novel →
                        </Link>
                      )}
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatTime(a.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info note */}
        <div style={{ maxWidth: '780px', margin: '20px auto 0', padding: '12px 18px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.15)' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            💡 <strong>Catatan:</strong> Riwayat aktivitas dicatat sejak fitur ini diaktifkan. Aktivitas lama mungkin tidak muncul.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;

// src/pages/AdminPanel.jsx — Full admin control panel for athenas1337@gmail.com
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Trash2, BookOpen, Users, MessageSquare,
  BarChart2, AlertTriangle, RefreshCw, Search, Eye,
  Lock, Globe, ChevronRight, Crown
} from 'lucide-react';
import {
  collection, getDocs, query, where, orderBy, deleteDoc, doc,
  updateDoc, limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../firebase/admin';
import { deleteNovel } from '../firebase/novels';
import { deleteChapter } from '../firebase/chapters';
import { deleteComment } from '../firebase/comments';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [novels, setNovels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ totalNovels: 0, totalUsers: 0, publishedNovels: 0, draftNovels: 0 });

  // Guard: only admin can access
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (!isAdmin(user)) {
      toast.error('Akses ditolak. Halaman ini hanya untuk admin.');
      navigate('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [novelsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'novels')),
        getDocs(collection(db, 'users')),
      ]);

      const allNovels = novelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const allUsers = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

      setNovels(allNovels);
      setUsers(allUsers);
      setStats({
        totalNovels: allNovels.length,
        totalUsers: allUsers.length,
        publishedNovels: allNovels.filter(n => n.status === 'published').length,
        draftNovels: allNovels.filter(n => n.status === 'draft').length,
      });
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNovel = async (novelId, title) => {
    if (!window.confirm(`Hapus novel "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteNovel(novelId);
      setNovels(prev => prev.filter(n => n.id !== novelId));
      toast.success(`Novel "${title}" berhasil dihapus.`);
    } catch (e) {
      toast.error('Gagal menghapus novel.');
    }
  };

  const handleToggleNovelStatus = async (novel) => {
    const newStatus = novel.status === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'novels', novel.id), { status: newStatus });
      setNovels(prev => prev.map(n => n.id === novel.id ? { ...n, status: newStatus } : n));
      toast.success(`Status novel diubah ke "${newStatus}".`);
    } catch (e) {
      toast.error('Gagal mengubah status novel.');
    }
  };

  const filteredNovels = novels.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.authorName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin(user)) return null;

  return (
    <div className="admin-panel">
      <div className="container">
        {/* Header */}
        <div className="admin-panel__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={26} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }}>Panel Admin</h1>
              <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
                Logged in as <strong style={{ color: '#ef4444' }}>{user?.email}</strong>
              </p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="admin-panel__stats">
          {[
            { label: 'Total Novel', value: stats.totalNovels, icon: <BookOpen size={20} />, color: '#8b5cf6' },
            { label: 'Diterbitkan', value: stats.publishedNovels, icon: <Globe size={20} />, color: '#10b981' },
            { label: 'Draft', value: stats.draftNovels, icon: <Lock size={20} />, color: '#f59e0b' },
            { label: 'Total Pengguna', value: stats.totalUsers, icon: <Users size={20} />, color: '#3b82f6' },
          ].map(s => (
            <div key={s.label} className="admin-panel__stat-card glass-card">
              <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="admin-panel__tabs">
          {[
            { id: 'novels', label: '📚 Novel', icon: <BookOpen size={15} /> },
            { id: 'users', label: '👥 Pengguna', icon: <Users size={15} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="admin-panel__search">
          <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            className="form-input"
            placeholder={tab === 'novels' ? 'Cari judul atau nama penulis...' : 'Cari nama atau email...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'none', padding: '8px 0', outline: 'none', flex: 1, color: 'var(--color-text)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner spinner-lg" />
            <p style={{ color: 'var(--color-text-muted)', marginTop: 12 }}>Memuat data...</p>
          </div>
        ) : (
          <>
            {/* NOVELS TAB */}
            {tab === 'novels' && (
              <div className="admin-panel__list">
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.83rem', marginBottom: 12 }}>
                  {filteredNovels.length} novel ditemukan
                </p>
                {filteredNovels.map(novel => (
                  <div key={novel.id} className="admin-panel__row glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      {novel.cover
                        ? <img src={novel.cover} alt="" style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                        : <div style={{ width: 44, height: 60, background: 'rgba(139,92,246,0.15)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📖</div>
                      }
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{novel.title}</h4>
                        <p style={{ margin: '2px 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          oleh {novel.authorName || 'Anonim'} · 👁 {novel.views || 0} · ❤️ {novel.likes || 0}
                        </p>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, fontWeight: '600',
                          background: novel.status === 'published' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: novel.status === 'published' ? '#10b981' : '#f59e0b',
                        }}>
                          {novel.status === 'published' ? 'Diterbitkan' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Link to={`/novel/${novel.id}`} className="btn btn-sm btn-outline" style={{ padding: '6px 10px' }} title="Lihat">
                        <Eye size={13} />
                      </Link>
                      <button
                        onClick={() => handleToggleNovelStatus(novel)}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '6px 10px' }}
                        title={novel.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
                      >
                        {novel.status === 'published' ? <Lock size={13} /> : <Globe size={13} />}
                      </button>
                      <button
                        onClick={() => handleDeleteNovel(novel.id, novel.title)}
                        className="btn btn-sm btn-danger"
                        style={{ padding: '6px 10px' }}
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* USERS TAB */}
            {tab === 'users' && (
              <div className="admin-panel__list">
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.83rem', marginBottom: 12 }}>
                  {filteredUsers.length} pengguna ditemukan
                </p>
                {filteredUsers.map(u => (
                  <div key={u.uid} className="admin-panel__row glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      {u.avatar
                        ? <img src={u.avatar} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, background: 'rgba(139,92,246,0.2)', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>👤</div>
                      }
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.displayName || 'Anonim'}
                          {u.email === 'athenas1337@gmail.com' && (
                            <span style={{ marginLeft: 6, fontSize: '0.65rem', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', padding: '1px 6px', borderRadius: 20 }}>ADMIN</span>
                          )}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
                          {(u.followers || []).length} followers · {(u.following || []).length} following
                        </p>
                      </div>
                    </div>
                    <Link to={`/profile/${u.uid}`} className="btn btn-sm btn-outline" style={{ padding: '6px 10px', flexShrink: 0 }} title="Lihat Profil">
                      <Eye size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

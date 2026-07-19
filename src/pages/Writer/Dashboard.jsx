// src/pages/Writer/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, BookOpen, Eye, Heart, Edit, Trash2,
  PenLine, TrendingUp, Crown, Globe, Lock
} from 'lucide-react';
import { getNovelsByAuthor, deleteNovel, updateNovel } from '../../firebase/novels';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [chartTab, setChartTab] = useState('views');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const load = async () => {
      try {
        const data = await getNovelsByAuthor(user.uid);
        setNovels(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleDelete = async (novelId) => {
    if (!window.confirm('Yakin ingin menghapus novel ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setDeletingId(novelId);
    try {
      await deleteNovel(novelId);
      setNovels(n => n.filter(v => v.id !== novelId));
      toast.success('Novel berhasil dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus novel.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (novel) => {
    const newStatus = novel.status === 'published' ? 'draft' : 'published';
    try {
      await updateNovel(novel.id, { status: newStatus });
      setNovels(n => n.map(v => v.id === novel.id ? { ...v, status: newStatus } : v));
      toast.success(newStatus === 'published' ? 'Novel diterbitkan! 🎉' : 'Novel disimpan sebagai draft.');
    } catch (e) {
      toast.error('Gagal mengubah status novel.');
    }
  };

  const totalViews = novels.reduce((acc, n) => acc + (n.views || 0), 0);
  const totalLikes = novels.reduce((acc, n) => acc + (n.likes || 0), 0);
  const publishedCount = novels.filter(n => n.status === 'published').length;

  return (
    <div className="dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard__header">
          <div className="dashboard__welcome">
            <div className="dashboard__avatar">
              <Crown size={24} />
            </div>
            <div>
              <h1>Selamat Datang, <span className="text-gradient">{userProfile?.displayName || user?.displayName || 'Penulis'}!</span></h1>
              <p>Kelola novel-novel Anda dari sini</p>
            </div>
          </div>
          <Link to="/writer/create" className="btn btn-gold btn-lg">
            <Plus size={18} /> Novel Baru
          </Link>
        </div>

        {/* Stats */}
        <div className="dashboard__stats">
          {[
            { icon: <BookOpen size={22} />, label: 'Total Novel', value: novels.length },
            { icon: <Globe size={22} />, label: 'Diterbitkan', value: publishedCount },
            { icon: <Eye size={22} />, label: 'Total Views', value: totalViews.toLocaleString() },
            { icon: <Heart size={22} />, label: 'Total Suka', value: totalLikes.toLocaleString() },
          ].map((s, i) => (
            <div key={i} className="dashboard__stat-card glass-card">
              <div className="dashboard__stat-icon">{s.icon}</div>
              <div className="dashboard__stat-val">{s.value}</div>
              <div className="dashboard__stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Performance Chart & Tips Section */}
        {!loading && novels.length > 0 && (
          <div className="dashboard__insights" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Chart */}
            <div className="dashboard__chart-card glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>📊 Grafik Performa Novel</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${chartTab === 'views' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setChartTab('views')}
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                  >
                    Views
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${chartTab === 'likes' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setChartTab('likes')}
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                  >
                    Likes
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {novels.map(n => {
                  const maxViews = Math.max(...novels.map(x => x.views || 0), 1);
                  const maxLikes = Math.max(...novels.map(x => x.likes || 0), 1);
                  const value = chartTab === 'views' ? (n.views || 0) : (n.likes || 0);
                  const maxVal = chartTab === 'views' ? maxViews : maxLikes;
                  const percentage = Math.min(100, Math.round((value / maxVal) * 100));

                  return (
                    <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>{n.title}</span>
                        <span style={{ color: 'var(--color-gold)' }}>{value.toLocaleString()}</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: chartTab === 'views' ? 'var(--gradient-violet)' : 'var(--gradient-gold)',
                          borderRadius: '4px',
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Premium Tips */}
            <div className="dashboard__tips-card glass-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-gold)' }}>💡 Tips Menulis Premium</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p>✍️ <strong>Update Teratur:</strong> Algoritma AttaNovel menyukai novel yang aktif di-update setidaknya 2-3 kali seminggu.</p>
                <p>🎭 <strong>Pilih Multi-genre:</strong> Kaitkan novel Anda dengan kombinasi genre yang relevan (seperti Fantasy + Cultivation) agar menjangkau audiens lebih luas.</p>
                <p>🎨 <strong>Sampul Menarik:</strong> Pasang sampul novel visual berkualitas tinggi agar memikat pembaca pada pandangan pertama.</p>
              </div>
            </div>
          </div>
        )}

        {/* Novel List */}
        <div className="dashboard__novels-section">
          <h2 className="dashboard__section-title">
            <PenLine size={20} /> Novel Saya
          </h2>

          {loading ? (
            <div className="home__loading">
              <div className="spinner spinner-lg" />
              <p>Memuat novel...</p>
            </div>
          ) : novels.length === 0 ? (
            <div className="dashboard__empty glass-card">
              <span>📖</span>
              <h3>Belum Ada Novel</h3>
              <p>Mulai petualangan menulis Anda sekarang!</p>
              <Link to="/writer/create" className="btn btn-gold">
                <Plus size={16} /> Buat Novel Pertama
              </Link>
            </div>
          ) : (
            <div className="dashboard__novels-list">
              {novels.map(novel => (
                <div key={novel.id} className="dashboard__novel-card glass-card">
                  <div className="dashboard__novel-cover">
                    {novel.cover
                      ? <img src={novel.cover} alt={novel.title} />
                      : <div className="dashboard__novel-cover-placeholder">📖</div>
                    }
                  </div>
                  <div className="dashboard__novel-info">
                    <h3>{novel.title}</h3>
                    <p className="dashboard__novel-desc">{novel.description?.substring(0, 100)}...</p>
                    <div className="dashboard__novel-meta">
                      <span className={`badge ${novel.status === 'published' ? 'badge-green' : 'badge-gold'}`}>
                        {novel.status === 'published' ? <Globe size={11} /> : <Lock size={11} />}
                        {novel.status === 'published' ? 'Diterbitkan' : 'Draft'}
                      </span>
                      {novel.genre && <span className="badge badge-primary">{novel.genre}</span>}
                      <span className="dashboard__novel-stat"><Eye size={12} /> {(novel.views || 0).toLocaleString()}</span>
                      <span className="dashboard__novel-stat"><Heart size={12} /> {(novel.likes || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="dashboard__novel-actions">
                    <Link
                      to={`/writer/novel/${novel.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      <Edit size={14} /> Kelola
                    </Link>
                    <button
                      className={`btn btn-sm ${novel.status === 'published' ? 'btn-ghost' : 'btn-primary'}`}
                      onClick={() => handleTogglePublish(novel)}
                    >
                      {novel.status === 'published' ? <><Lock size={14} /> Draft</> : <><Globe size={14} /> Terbitkan</>}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(novel.id)}
                      disabled={deletingId === novel.id}
                    >
                      {deletingId === novel.id ? <div className="spinner" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer credit */}
        <div className="dashboard__credit">
          AttaNovel Dashboard — Dibuat oleh <strong>Atha</strong>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

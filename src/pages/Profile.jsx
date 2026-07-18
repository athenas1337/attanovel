// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, BookOpen, Eye, Heart, Calendar, Edit3, Crown } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getNovelsByAuthor } from '../firebase/novels';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const { user, userProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '' });
  const [saving, setSaving] = useState(false);

  const targetId = userId || user?.uid;
  const isOwn = user && user.uid === targetId;

  useEffect(() => {
    const load = async () => {
      if (!targetId) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, 'users', targetId));
        if (snap.exists()) {
          const p = snap.data();
          setProfile(p);
          setEditForm({ displayName: p.displayName || '', bio: p.bio || '' });
        }
        const nvls = await getNovelsByAuthor(targetId);
        setNovels(nvls.filter(n => isOwn || n.status === 'published'));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetId, isOwn]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editForm.displayName,
        bio: editForm.bio,
      });
      setProfile(p => ({ ...p, displayName: editForm.displayName, bio: editForm.bio }));
      setEditMode(false);
      toast.success('Profil berhasil diperbarui!');
    } catch (e) {
      toast.error('Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const totalViews = novels.reduce((a, n) => a + (n.views || 0), 0);
  const totalLikes = novels.reduce((a, n) => a + (n.likes || 0), 0);
  const publishedNovels = novels.filter(n => n.status === 'published');

  if (loading) return (
    <div className="home__loading" style={{ minHeight: '80vh' }}>
      <div className="spinner spinner-lg" />
      <p>Memuat profil...</p>
    </div>
  );

  if (!profile) return (
    <div className="home__empty" style={{ minHeight: '80vh' }}>
      <span>👤</span>
      <h3>Profil tidak ditemukan</h3>
    </div>
  );

  return (
    <div className="profile">
      <div className="profile__banner">
        <div className="profile__banner-bg" />
        <div className="profile__banner-overlay" />
        <div className="container profile__banner-inner">
          <div className="profile__avatar-wrap">
            <div className="profile__avatar">
              {profile.avatar
                ? <img src={profile.avatar} alt="" />
                : <User size={40} />
              }
            </div>
            {isOwn && (
              <button
                className="profile__edit-btn"
                onClick={() => setEditMode(!editMode)}
                title="Edit profil"
              >
                <Edit3 size={14} />
              </button>
            )}
          </div>
          <div className="profile__info">
            {editMode ? (
              <div className="profile__edit-form">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama Anda"
                  value={editForm.displayName}
                  onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                />
                <textarea
                  className="form-input form-textarea"
                  placeholder="Tulis bio Anda..."
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                />
                <div className="profile__edit-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <div className="spinner" /> : 'Simpan'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Batal</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="profile__name">{profile.displayName || 'Pengguna AttaNovel'}</h1>
                {profile.bio && <p className="profile__bio">{profile.bio}</p>}
                <div className="profile__joined">
                  <Calendar size={14} />
                  Bergabung sejak {profile.createdAt?.toDate?.()?.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) || 'baru-baru ini'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container profile__body">
        <div className="profile__stats">
          {[
            { label: 'Novel Diterbitkan', value: publishedNovels.length, icon: <BookOpen size={18} /> },
            { label: 'Total Views', value: totalViews.toLocaleString(), icon: <Eye size={18} /> },
            { label: 'Total Suka', value: totalLikes.toLocaleString(), icon: <Heart size={18} /> },
          ].map((s, i) => (
            <div key={i} className="profile__stat-card glass-card">
              <div className="profile__stat-icon">{s.icon}</div>
              <div className="profile__stat-val">{s.value}</div>
              <div className="profile__stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Novels */}
        <h2 className="profile__section-title">
          <Crown size={18} /> Novel oleh {profile.displayName || 'Pengguna ini'}
        </h2>
        {novels.length === 0 ? (
          <div className="home__empty">
            <span>📖</span>
            <h3>{isOwn ? 'Anda belum memiliki novel' : 'Pengguna ini belum memiliki novel'}</h3>
            {isOwn && (
              <Link to="/writer/create" className="btn btn-gold">
                Buat Novel Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="profile__novels-grid">
            {novels.map(novel => (
              <Link key={novel.id} to={`/novel/${novel.id}`} className="novel-card">
                {novel.cover
                  ? <img src={novel.cover} alt={novel.title} className="novel-card__cover" />
                  : <div className="novel-card__cover-placeholder"><span>📖</span></div>
                }
                <div className="novel-card__body">
                  <h3 className="novel-card__title">{novel.title}</h3>
                  <div className="novel-card__stats">
                    <span><Eye size={11} /> {(novel.views || 0).toLocaleString()}</span>
                    <span><Heart size={11} /> {(novel.likes || 0).toLocaleString()}</span>
                  </div>
                  {novel.genre && <span className="badge badge-primary" style={{ marginTop: 6, display: 'inline-block' }}>{novel.genre}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="profile__credit">
          <Crown size={14} />
          AttaNovel — Platform Menulis oleh <strong>Atha</strong>
        </div>
      </div>
    </div>
  );
};

export default Profile;

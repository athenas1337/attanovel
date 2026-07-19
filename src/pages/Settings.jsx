// src/pages/Settings.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Globe, Camera, Save, LogOut } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { logoutUser } from '../firebase/auth';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
  const { user, userProfile } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setDisplayName(data.displayName || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar || '');
          setAvatarPreview(data.avatar || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size cannot exceed 2MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      let finalAvatar = avatarUrl || profile.avatar || '';

      if (avatarFile) {
        try {
          const { uploadAvatar } = await import('../firebase/auth');
          finalAvatar = await uploadAvatar(avatarFile, user.uid);
        } catch (err) {
          console.error(err);
          toast.error('Gagal mengupload avatar, menggunakan URL backup.');
        }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: finalAvatar,
      });

      if (userProfile) {
        userProfile.displayName = displayName.trim();
        userProfile.bio = bio.trim();
        userProfile.avatar = finalAvatar;
      }

      toast.success(lang === 'id' ? 'Pengaturan disimpan! ✅' : 'Settings saved! ✅');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Berhasil keluar / Logged out');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="home__loading">
        <div className="spinner spinner-lg" />
        <p>Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="container settings-page__container">
        <h1 className="settings-page__title">
          ⚙️ {t('settings')}
        </h1>

        <div className="settings-page__layout">
          {/* Sidebar */}
          <aside className="settings-page__sidebar glass-card">
            <div className="settings-page__user-info">
              <div className="settings-page__avatar-container">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="settings-page__avatar" />
                ) : (
                  <div className="settings-page__avatar-placeholder">
                    <User size={32} />
                  </div>
                )}
                <button
                  type="button"
                  className="settings-page__camera-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile picture"
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              <h3>{displayName || 'Pengguna AttaNovel'}</h3>
              <p>{user.email}</p>
            </div>
            
            <div className="settings-page__side-actions">
              <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ width: '100%' }}>
                <LogOut size={14} /> {t('logout')}
              </button>
            </div>
          </aside>

          {/* Form */}
          <form onSubmit={handleSave} className="settings-page__form glass-card">
            <div className="settings-page__section">
              <h2>👤 Profil Publik</h2>
              
              <div className="form-group">
                <label className="form-label">Nama Pengguna (Display Name)</label>
                <input
                  type="text"
                  className="form-input"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Masukkan nama pengguna..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio Singkat</label>
                <textarea
                  className="form-input form-textarea"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Ceritakan tentang diri Anda..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('avatarUrlLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={avatarUrl}
                  onChange={e => {
                    setAvatarUrl(e.target.value);
                    setAvatarPreview(e.target.value);
                  }}
                  placeholder="https://contoh.com/avatar.png"
                />
              </div>
            </div>

            <div className="settings-page__section-divider" />

            <div className="settings-page__section">
              <h2>🌐 Bahasa & Tampilan (Language)</h2>
              <div className="form-group">
                <label className="form-label">Bahasa Aplikasi (App Language)</label>
                <div className="settings-page__lang-buttons">
                  <button
                    type="button"
                    className={`settings-page__lang-btn ${lang === 'id' ? 'active' : ''}`}
                    onClick={() => setLang('id')}
                  >
                    🇮🇩 Bahasa Indonesia
                  </button>
                  <button
                    type="button"
                    className={`settings-page__lang-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => setLang('en')}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-page__actions">
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? <div className="spinner" /> : <><Save size={16} /> {t('save')}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;

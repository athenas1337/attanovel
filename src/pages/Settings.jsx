// src/pages/Settings.jsx — Premium Settings Page
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Camera, Save, LogOut, Globe, Bell, Shield,
  Eye, EyeOff, Moon, Sun, BookOpen, Gift, Lock,
  Trash2, AlertTriangle, Check, X, RefreshCw, Activity,
  Key, Palette, Type
} from 'lucide-react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { logoutUser } from '../firebase/auth';
import { redeemCode, isDeveloper, deactivateDeveloper } from '../firebase/redeem';
import toast from 'react-hot-toast';
import './Settings.css';

const SECTION_IDS = [
  { id: 'profile',        label: 'Profil',              icon: <User size={15} /> },
  { id: 'appearance',     label: 'Tampilan Membaca',     icon: <Palette size={15} /> },
  { id: 'notifications',  label: 'Notifikasi',           icon: <Bell size={15} /> },
  { id: 'privacy',        label: 'Privasi',              icon: <Shield size={15} /> },
  { id: 'language',       label: 'Bahasa',               icon: <Globe size={15} /> },
  { id: 'redeem',         label: 'Kode Redeem',          icon: <Gift size={15} /> },
  { id: 'account',        label: 'Akun',                 icon: <Key size={15} /> },
];

const Settings = () => {
  const { user, userProfile } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  // Reading / Appearance
  const [defaultTheme, setDefaultTheme] = useState(() => localStorage.getItem('attanovel_read_theme') || 'dark');
  const [defaultFont, setDefaultFont] = useState(() => localStorage.getItem('attanovel_read_font') || 'serif');
  const [defaultFontSize, setDefaultFontSize] = useState(() => parseInt(localStorage.getItem('attanovel_read_size') || '18'));
  const [showParticles, setShowParticles] = useState(() => localStorage.getItem('attanovel_read_particles') !== 'false');

  // Notification preferences (stored in Firestore on user doc)
  const [notifComment, setNotifComment] = useState(true);
  const [notifLike, setNotifLike] = useState(true);
  const [notifFollow, setNotifFollow] = useState(true);
  const [notifChat, setNotifChat] = useState(true);

  // Privacy
  const [profilePublic, setProfilePublic] = useState(true);
  const [showActivity, setShowActivity] = useState(true);

  // Redeem
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [devModeOn, setDevModeOn] = useState(isDeveloper());

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setProfile(d);
          setDisplayName(d.displayName || '');
          setBio(d.bio || '');
          setAvatarUrl(d.avatar || '');
          setAvatarPreview(d.avatar || '');
          // Load notification prefs
          setNotifComment(d.notif_comment !== false);
          setNotifLike(d.notif_like !== false);
          setNotifFollow(d.notif_follow !== false);
          setNotifChat(d.notif_chat !== false);
          // Load privacy prefs
          setProfilePublic(d.profilePublic !== false);
          setShowActivity(d.showActivity !== false);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran file maksimal 2MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { toast.error('Nama tidak boleh kosong.'); return; }
    setSaving(true);
    try {
      let finalAvatar = avatarUrl || profile?.avatar || '';
      if (avatarFile) {
        try {
          const { uploadAvatar } = await import('../firebase/auth');
          finalAvatar = await uploadAvatar(avatarFile, user.uid);
        } catch (err) {
          toast.error('Gagal upload avatar, menggunakan URL.');
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
      toast.success('Profil disimpan! ✅');
    } catch (err) {
      toast.error('Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearance = () => {
    localStorage.setItem('attanovel_read_theme', defaultTheme);
    localStorage.setItem('attanovel_read_font', defaultFont);
    localStorage.setItem('attanovel_read_size', defaultFontSize);
    localStorage.setItem('attanovel_read_particles', showParticles);
    toast.success('Preferensi membaca disimpan!');
  };

  const handleSaveNotifications = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notif_comment: notifComment,
        notif_like: notifLike,
        notif_follow: notifFollow,
        notif_chat: notifChat,
      });
      toast.success('Pengaturan notifikasi disimpan!');
    } catch { toast.error('Gagal menyimpan.'); }
  };

  const handleSavePrivacy = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), { profilePublic, showActivity });
      toast.success('Pengaturan privasi disimpan!');
    } catch { toast.error('Gagal menyimpan.'); }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!redeemInput.trim()) return;
    setRedeemLoading(true);
    // Small artificial delay for UX
    await new Promise(r => setTimeout(r, 600));
    const result = redeemCode(redeemInput.trim());
    if (result.success) {
      toast.success(result.message);
      if (result.type === 'dev') setDevModeOn(true);
    } else {
      toast.error(result.message);
    }
    setRedeemInput('');
    setRedeemLoading(false);
  };

  const handleDeactivateDev = () => {
    deactivateDeveloper();
    setDevModeOn(false);
    toast.success('Mode Developer dinonaktifkan.');
  };

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Berhasil keluar!');
    navigate('/');
  };

  if (loading) return (
    <div className="home__loading">
      <div className="spinner spinner-lg" />
      <p>Memuat pengaturan...</p>
    </div>
  );

  // Toggle switch component inline
  const Toggle = ({ checked, onChange, label }) => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-2)' }}>{label}</span>
      <div
        onClick={onChange}
        style={{
          width: 42, height: 24, borderRadius: 12,
          background: checked ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.12)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </label>
  );

  return (
    <div className="settings-page">
      <div className="container settings-page__container">
        <h1 className="settings-page__title">⚙️ Pengaturan</h1>

        <div className="settings-page__layout">
          {/* ── Sidebar ──────────────────────────────────────── */}
          <aside className="settings-page__sidebar glass-card">
            <div className="settings-page__user-info">
              <div className="settings-page__avatar-container">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" className="settings-page__avatar" />
                  : <div className="settings-page__avatar-placeholder"><User size={32} /></div>
                }
                <button type="button" className="settings-page__camera-btn" onClick={() => fileInputRef.current?.click()} title="Ganti foto profil">
                  <Camera size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
              <h3>{displayName || 'Pengguna'}</h3>
              <p>{user?.email}</p>
              {devModeOn && (
                <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', marginTop: 6 }}>
                  🔧 Mode Developer Aktif
                </span>
              )}
            </div>

            {/* Section nav */}
            <nav style={{ marginTop: 16 }}>
              {SECTION_IDS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`settings-page__nav-btn ${activeSection === s.id ? 'active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    background: activeSection === s.id ? 'rgba(139,92,246,0.2)' : 'none',
                    border: 'none', cursor: 'pointer',
                    color: activeSection === s.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                    fontSize: '0.88rem', fontWeight: activeSection === s.id ? '600' : '400',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </nav>

            <div style={{ marginTop: 16 }}>
              <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ width: '100%' }}>
                <LogOut size={14} /> Keluar
              </button>
            </div>
          </aside>

          {/* ── Main Panel ─────────────────────────────────── */}
          <div className="settings-page__form glass-card">

            {/* ── PROFILE ── */}
            {activeSection === 'profile' && (
              <form onSubmit={handleSaveProfile}>
                <div className="settings-page__section">
                  <h2>👤 Profil Publik</h2>
                  <div className="form-group">
                    <label className="form-label">Nama Pengguna</label>
                    <input type="text" className="form-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nama pengguna..." required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio Singkat</label>
                    <textarea className="form-input form-textarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Ceritakan tentang diri Anda..." rows={4} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL Foto Profil (opsional)</label>
                    <input type="text" className="form-input" value={avatarUrl} onChange={e => { setAvatarUrl(e.target.value); setAvatarPreview(e.target.value); }} placeholder="https://..." />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                    Atau upload gambar langsung menggunakan tombol kamera di samping kiri.
                  </p>
                </div>
                <div className="settings-page__actions">
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? <div className="spinner" /> : <><Save size={16} /> Simpan Profil</>}
                  </button>
                  <Link to="/profile" className="btn btn-outline btn-sm">Lihat Profil Saya</Link>
                </div>
              </form>
            )}

            {/* ── APPEARANCE / READING ── */}
            {activeSection === 'appearance' && (
              <div className="settings-page__section">
                <h2>🎨 Preferensi Membaca</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  Pengaturan ini digunakan sebagai default saat membaca bab novel.
                </p>

                <div className="form-group">
                  <label className="form-label">Tema Default</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[
                      { value: 'dark', label: '🌌 Gelap', bg: '#0b0817', color: '#d4c9f0' },
                      { value: 'light', label: '📄 Terang', bg: '#f8f5ff', color: '#1a0a3d' },
                      { value: 'sepia', label: '📜 Sepia', bg: '#f4ecd8', color: '#4b3621' },
                    ].map(th => (
                      <button
                        key={th.value}
                        type="button"
                        onClick={() => setDefaultTheme(th.value)}
                        style={{
                          padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                          background: th.bg, color: th.color, fontSize: '0.85rem',
                          border: `2px solid ${defaultTheme === th.value ? 'var(--color-primary-light)' : 'transparent'}`,
                          transition: 'border 0.15s', fontWeight: defaultTheme === th.value ? '700' : '400',
                        }}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gaya Font Default</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[{ value: 'serif', label: 'Serif (Aa)' }, { value: 'sans-serif', label: 'Sans-Serif (Ag)' }].map(f => (
                      <button key={f.value} type="button" onClick={() => setDefaultFont(f.value)}
                        className={`btn btn-sm ${defaultFont === f.value ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontFamily: f.value === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif' }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ukuran Font Default: {defaultFontSize}px</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setDefaultFontSize(s => Math.max(14, s - 1))}>−</button>
                    <input type="range" min={14} max={26} value={defaultFontSize} onChange={e => setDefaultFontSize(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--color-primary-light)' }} />
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setDefaultFontSize(s => Math.min(26, s + 1))}>+</button>
                  </div>
                </div>

                <Toggle
                  checked={showParticles}
                  onChange={() => setShowParticles(v => !v)}
                  label="Tampilkan efek partikel bintang saat membaca"
                />

                <div className="settings-page__actions" style={{ marginTop: 20 }}>
                  <button type="button" className="btn btn-gold" onClick={handleSaveAppearance}>
                    <Save size={16} /> Simpan Preferensi
                  </button>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeSection === 'notifications' && (
              <div className="settings-page__section">
                <h2>🔔 Pengaturan Notifikasi</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  Kelola jenis notifikasi yang ingin Anda terima.
                </p>
                <Toggle checked={notifComment} onChange={() => setNotifComment(v => !v)} label="Notifikasi komentar baru pada novel saya" />
                <Toggle checked={notifLike} onChange={() => setNotifLike(v => !v)} label="Notifikasi ketika novel saya disukai" />
                <Toggle checked={notifFollow} onChange={() => setNotifFollow(v => !v)} label="Notifikasi ketika ada pengguna baru yang follow" />
                <Toggle checked={notifChat} onChange={() => setNotifChat(v => !v)} label="Notifikasi pesan chat masuk" />
                <div className="settings-page__actions" style={{ marginTop: 20 }}>
                  <button className="btn btn-gold" onClick={handleSaveNotifications}>
                    <Save size={16} /> Simpan Notifikasi
                  </button>
                </div>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {activeSection === 'privacy' && (
              <div className="settings-page__section">
                <h2>🛡️ Pengaturan Privasi</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  Kendalikan siapa yang bisa melihat informasimu.
                </p>
                <Toggle checked={profilePublic} onChange={() => setProfilePublic(v => !v)} label="Profil terlihat oleh pengguna lain" />
                <Toggle checked={showActivity} onChange={() => setShowActivity(v => !v)} label="Riwayat aktivitas terlihat di profil publik" />

                <div style={{ marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    <strong>📝 Catatan:</strong> Data Anda disimpan dengan aman di Firebase dan tidak dibagikan kepada pihak ketiga.
                    Lihat <Link to="/privacy" style={{ color: 'var(--color-primary-light)' }}>Kebijakan Privasi</Link> kami.
                  </p>
                </div>

                <div className="settings-page__actions" style={{ marginTop: 20 }}>
                  <button className="btn btn-gold" onClick={handleSavePrivacy}>
                    <Save size={16} /> Simpan Privasi
                  </button>
                </div>
              </div>
            )}

            {/* ── LANGUAGE ── */}
            {activeSection === 'language' && (
              <div className="settings-page__section">
                <h2>🌐 Bahasa & Lokalisasi</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  Pilih bahasa tampilan aplikasi AttaNovel.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { code: 'id', label: '🇮🇩 Bahasa Indonesia' },
                    { code: 'en', label: '🇬🇧 English' },
                  ].map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => { setLang(l.code); toast.success(`Bahasa diubah ke ${l.label}`); }}
                      className={`btn ${lang === l.code ? 'btn-primary' : 'btn-outline'}`}
                      style={{ minWidth: 180 }}
                    >
                      {lang === l.code && <Check size={14} />} {l.label}
                    </button>
                  ))}
                </div>
                <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Perubahan bahasa langsung berlaku tanpa perlu refresh halaman.
                </p>
              </div>
            )}

            {/* ── REDEEM CODE ── */}
            {activeSection === 'redeem' && (
              <div className="settings-page__section">
                <h2>🎁 Kode Redeem</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  Masukkan kode redeem untuk mengaktifkan fitur premium, VIP, atau mode khusus.
                </p>

                {devModeOn && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#ef4444', fontSize: '0.88rem' }}>🔧 Mode Developer Aktif</strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                        Kamu memiliki hak penuh atas semua konten platform.
                      </p>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={handleDeactivateDev}>
                      Nonaktifkan
                    </button>
                  </div>
                )}

                <form onSubmit={handleRedeem} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={redeemInput}
                    onChange={e => setRedeemInput(e.target.value)}
                    placeholder="Masukkan kode redeem..."
                    className="form-input"
                    style={{ flex: 1, minWidth: 200 }}
                    spellCheck={false}
                    autoCorrect="off"
                  />
                  <button type="submit" className="btn btn-gold" disabled={redeemLoading || !redeemInput.trim()}>
                    {redeemLoading ? <div className="spinner" /> : <><Gift size={15} /> Tukarkan</>}
                  </button>
                </form>

                <div style={{ marginTop: 20, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    💡 Kode redeem bersifat rahasia dan tidak bisa dibagikan ulang. Kode VIP akan tersedia di masa mendatang.
                  </p>
                </div>
              </div>
            )}

            {/* ── ACCOUNT / DANGER ZONE ── */}
            {activeSection === 'account' && (
              <div className="settings-page__section">
                <h2>🔑 Manajemen Akun</h2>

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--color-text)' }}>Informasi Akun</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Email', value: user?.email },
                      { label: 'User ID', value: user?.uid?.slice(0, 16) + '...' },
                      { label: 'Bergabung', value: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontFamily: 'monospace' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link to="/activity" className="btn btn-outline btn-sm" style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={14} /> Lihat Riwayat Aktivitas
                </Link>

                {/* Danger Zone */}
                <div style={{ marginTop: 24, padding: '20px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, background: 'rgba(239,68,68,0.04)' }}>
                  <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertTriangle size={16} /> Zona Bahaya
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
                    Tindakan berikut bersifat permanen dan tidak bisa dibatalkan.
                  </p>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={handleLogout}
                    style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <LogOut size={14} /> Keluar dari Semua Perangkat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

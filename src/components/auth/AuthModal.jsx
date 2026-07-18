// src/components/auth/AuthModal.jsx
import { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Crown } from 'lucide-react';
import { registerUser, loginUser, loginWithGoogle } from '../../firebase/auth';
import toast from 'react-hot-toast';
import './AuthModal.css';

const AuthModal = ({ mode: initialMode, onClose }) => {
  const [mode, setMode] = useState(initialMode || 'login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        await registerUser(form.email, form.password, form.displayName);
        toast.success('Akun berhasil dibuat! Selamat datang di AttaNovel! 🎉');
      } else {
        await loginUser(form.email, form.password);
        toast.success('Berhasil masuk! Selamat datang kembali! ✨');
      }
      onClose();
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Email sudah terdaftar.',
        'auth/wrong-password': 'Kata sandi salah.',
        'auth/user-not-found': 'Akun tidak ditemukan.',
        'auth/weak-password': 'Kata sandi minimal 6 karakter.',
        'auth/invalid-email': 'Format email tidak valid.',
      };
      toast.error(msgs[err.code] || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Berhasil masuk dengan Google! ✨');
      onClose();
    } catch (err) {
      toast.error('Gagal masuk dengan Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>

        {/* Header */}
        <div className="auth-modal__header">
          <div className="auth-modal__icon">
            <Crown size={28} />
          </div>
          <h2>{mode === 'login' ? 'Selamat Datang Kembali' : 'Bergabung dengan AttaNovel'}</h2>
          <p>{mode === 'login' ? 'Masuk ke akun Anda untuk melanjutkan' : 'Buat akun dan mulai petualangan menulis Anda'}</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Masuk</button>
          <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Daftar</button>
        </div>

        {/* Google Button */}
        <button className="auth-modal__google" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16.1 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 45c4.9 0 9.3-1.9 12.7-4.9l-5.9-5c-1.9 1.4-4.2 2.2-6.8 2.2-5.3 0-9.7-2.9-11.3-7l-6.5 5c3.3 6.1 9.9 10.4 17.8 10.4z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.5 5.9l5.9 5c-.4.4 6.3-4.6 6.3-13.9 0-1.3-.1-2.7-.4-3.9z"/>
          </svg>
          {loading ? 'Memproses...' : 'Lanjutkan dengan Google'}
        </button>

        <div className="auth-modal__divider">
          <span>atau</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-modal__form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Nama Pengguna</label>
              <div className="auth-modal__input-wrap">
                <User size={16} className="auth-modal__input-icon" />
                <input
                  type="text"
                  name="displayName"
                  className="form-input"
                  placeholder="Nama Anda"
                  value={form.displayName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <div className="auth-modal__input-wrap">
              <Mail size={16} className="auth-modal__input-icon" />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="contoh@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <div className="auth-modal__input-wrap">
              <Lock size={16} className="auth-modal__input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-modal__toggle-pass"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Memproses...</> : (mode === 'login' ? 'Masuk' : 'Buat Akun')}
          </button>
        </form>

        <p className="auth-modal__switch">
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
          {' '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

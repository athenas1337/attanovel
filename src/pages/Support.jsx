// src/pages/Support.jsx
import { useState } from 'react';
import { Mail, HelpCircle, MessageSquare, ChevronRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const ISSUES = [
  {
    icon: '🔐',
    title: 'Masalah Login / Akun',
    desc: 'Tidak bisa masuk, lupa password, atau akun terblokir.',
  },
  {
    icon: '📖',
    title: 'Novel Tidak Tampil',
    desc: 'Novel hilang, chapter error, atau konten tidak bisa dibuka.',
  },
  {
    icon: '✍️',
    title: 'Masalah Penulisan',
    desc: 'Gagal upload cover, chapter tidak tersimpan, atau editor bermasalah.',
  },
  {
    icon: '⚡',
    title: 'Performa & Bug',
    desc: 'Halaman lambat, error 500, atau tampilan rusak.',
  },
];

const Support = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[AttaNovel Support] Pesan dari ${form.name}`);
    const body = encodeURIComponent(
      `Nama: ${form.name}\nEmail: ${form.email}\n\nPesan:\n${form.message}`
    );
    window.location.href = `mailto:attanovel.help@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0820 0%, #12082e 50%, #0a0618 100%)',
      padding: '60px 20px 80px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(245,158,11,0.2))',
            border: '1px solid rgba(139,92,246,0.4)',
            marginBottom: 20,
            boxShadow: '0 0 40px rgba(139,92,246,0.2)',
          }}>
            <Shield size={32} color="#a78bfa" />
          </div>
          <h1 style={{
            margin: 0, fontSize: '2.4rem', fontWeight: 800,
            background: 'linear-gradient(90deg, #a78bfa, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}>
            Pusat Bantuan
          </h1>
          <p style={{ color: '#9ca3af', marginTop: 12, fontSize: '1rem', maxWidth: 520, margin: '12px auto 0' }}>
            Kami siap membantu kamu. Pilih topik masalah atau kirimkan pesan langsung kepada tim kami.
          </p>
        </div>

        {/* Common Issues Grid */}
        <div style={{ marginBottom: 52 }}>
          <h2 style={{ color: '#ede9fe', fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, marginTop: 0 }}>
            Masalah Umum
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 16,
          }}>
            {ISSUES.map((issue, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '20px 18px',
                backdropFilter: 'blur(12px)',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,92,246,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{issue.icon}</div>
                <h3 style={{ margin: '0 0 6px', fontSize: '0.88rem', fontWeight: 700, color: '#ede9fe' }}>
                  {issue.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5 }}>
                  {issue.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form + Info split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

          {/* Contact Form */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: '32px 28px',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <MessageSquare size={20} color="#a78bfa" />
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ede9fe' }}>
                Kirim Pesan
              </h2>
            </div>

            {sent ? (
              <div style={{
                textAlign: 'center', padding: '32px 16px',
                background: 'rgba(16,185,129,0.08)', borderRadius: 12,
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
                <p style={{ color: '#34d399', fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>
                  Email client dibuka!
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: 6 }}>
                  Selesaikan pengiriman di aplikasi email kamu.
                </p>
                <button
                  onClick={() => setSent(false)}
                  style={{
                    marginTop: 16, padding: '8px 20px', borderRadius: 8,
                    background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)',
                    color: '#a78bfa', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  }}
                >
                  Kirim lagi
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>
                    Nama
                  </label>
                  <input
                    id="support-name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nama kamu"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ede9fe', fontSize: '0.88rem', outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>
                    Email
                  </label>
                  <input
                    id="support-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@kamu.com"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ede9fe', fontSize: '0.88rem', outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>
                    Pesan
                  </label>
                  <textarea
                    id="support-message"
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Jelaskan masalah kamu secara detail..."
                    rows={5}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ede9fe', fontSize: '0.88rem', outline: 'none',
                      resize: 'vertical', fontFamily: 'inherit',
                    }}
                  />
                </div>
                <button
                  id="support-submit"
                  type="submit"
                  style={{
                    padding: '12px 20px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                    border: 'none', color: '#fff', fontWeight: 700,
                    fontSize: '0.9rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'opacity 0.2s, transform 0.2s',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Mail size={16} /> Kirim via Email
                </button>
              </form>
            )}
          </div>

          {/* Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Contact info */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18, padding: '28px 24px',
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <Mail size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ede9fe' }}>
                  Kontak Langsung
                </h3>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>
                Tim support kami aktif setiap hari dan akan membalas dalam 1×24 jam.
              </p>
              <a
                href="mailto:attanovel.help@gmail.com"
                style={{
                  display: 'inline-block', color: '#a78bfa', fontWeight: 600,
                  fontSize: '0.88rem', textDecoration: 'none',
                  padding: '8px 16px', borderRadius: 8,
                  background: 'rgba(139,92,246,0.12)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.12)'}
              >
                attanovel.help@gmail.com
              </a>
            </div>

            {/* FAQ Link */}
            <div style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 18, padding: '28px 24px',
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <HelpCircle size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ede9fe' }}>
                  Cek FAQ Dulu
                </h3>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>
                Mungkin pertanyaanmu sudah terjawab di halaman FAQ kami.
              </p>
              <Link
                to="/faq"
                id="support-faq-link"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: '#f59e0b', fontWeight: 700, fontSize: '0.88rem',
                  textDecoration: 'none',
                  padding: '10px 18px', borderRadius: 10,
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  transition: 'background 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.22)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                Lihat FAQ <ChevronRight size={15} />
              </Link>
            </div>

            {/* Response time badge */}
            <div style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.18)',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                flexShrink: 0,
              }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>Support Online</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>Waktu respons rata-rata: &lt;24 jam</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Support;

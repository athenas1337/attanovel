// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, PenLine, ChevronRight, Crown, Flame, Sparkles,
  Star, Heart, Eye, Clock, Zap
} from 'lucide-react';
import { getPublishedNovels, getNovelsByIds } from '../firebase/novels';
import { getRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const GENRES = ['Semua', 'Fantasy', 'Romance', 'Action', 'Mystery', 'Horror', 'Sci-Fi', 'Drama'];

const writingStatusBadge = (status) => {
  const map = {
    'Completed': { label: 'Tamat', color: '#10b981', bg: 'rgba(16,185,129,0.85)' },
    'Hiatus': { label: 'Hiatus', color: '#fff', bg: 'rgba(245,158,11,0.85)' },
    'Dropped': { label: 'Dropped', color: '#fff', bg: 'rgba(239,68,68,0.85)' },
    'Planning': { label: 'Rencana', color: '#fff', bg: 'rgba(99,102,241,0.85)' },
    'Ongoing': { label: 'Ongoing', color: '#fff', bg: 'rgba(109,40,217,0.85)' },
  };
  return map[status] || map['Ongoing'];
};

const NovelCard = ({ novel }) => {
  const navigate = useNavigate();
  const sc = writingStatusBadge(novel.writingStatus || 'Ongoing');
  return (
    <div className="novel-card" onClick={() => navigate(`/novel/${novel.id}`)}
      style={{ transition: 'all 0.25s ease', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(109,40,217,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ position: 'relative' }}>
        {novel.cover
          ? <img src={novel.cover} alt={novel.title} className="novel-card__cover" />
          : <div className="novel-card__cover-placeholder"><span>📖</span></div>
        }
        <div style={{
          position: 'absolute', top: '7px', left: '7px',
          background: sc.bg, color: sc.color,
          fontSize: '0.62rem', fontWeight: '700', padding: '2px 7px',
          borderRadius: '20px', backdropFilter: 'blur(4px)', letterSpacing: '0.04em',
          textTransform: 'uppercase', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}>{sc.label}</div>
      </div>
      <div className="novel-card__body">
        <h3 className="novel-card__title">{novel.title}</h3>
        <p className="novel-card__author">oleh {novel.authorName || 'Anonim'}</p>
        <div className="novel-card__stats">
          <span><Eye size={11} /> {(novel.views || 0).toLocaleString()}</span>
          <span><Heart size={11} /> {(novel.likes || 0).toLocaleString()}</span>
          {novel.genre && <span className="badge badge-primary">{novel.genre.split(',')[0].trim()}</span>}
        </div>
      </div>
    </div>
  );
};

const Home = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [novels, setNovels] = useState([]);
  const [activeGenre, setActiveGenre] = useState('Semua');
  const [loading, setLoading] = useState(true);
  // Recently viewed: IDs from localStorage, but data fetched fresh from Firestore
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPublishedNovels(30);
        setNovels(data);

        // Fetch fresh recently viewed novels from Firestore
        const rvIds = getRecentlyViewed().map(n => n.id).filter(Boolean);
        if (rvIds.length > 0) {
          // Match fresh data from already-fetched novels first
          const freshRecent = rvIds
            .map(id => data.find(n => n.id === id))
            .filter(Boolean);
          setRecentlyViewed(freshRecent);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = activeGenre === 'Semua'
    ? novels
    : novels.filter(n => n.genre?.toLowerCase().split(',').map(g => g.trim()).includes(activeGenre.toLowerCase()));

  // Trending: top 5 by likes
  const trending = [...novels].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);

  return (
    <div className="home">
      {/* ===================== HERO ===================== */}
      <section className="home__hero">
        <div className="home__hero-bg">
          <div className="home__hero-orb home__hero-orb--1" />
          <div className="home__hero-orb home__hero-orb--2" />
          <div className="home__hero-orb home__hero-orb--3" />
        </div>
        <div className="container home__hero-inner">
          <div className="home__hero-badge animate-fadeInUp">
            <Crown size={14} />
            Tulis. Terbitkan. Mendunia.
          </div>
          <h1 className="home__hero-title animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Tuliskan Dunia
            <br />
            <span className="text-gradient">Imajinasi Anda</span>
          </h1>
          <p className="home__hero-subtitle animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            AttaNovel adalah tempat terbaik untuk menulis, menerbitkan, dan membaca novel.
            Bergabunglah dengan ribuan penulis berbakat dan sampaikan kisah Anda kepada dunia.
          </p>
          <div className="home__hero-actions animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            {user ? (
              <Link to="/writer/dashboard" className="btn btn-gold btn-lg">
                <PenLine size={18} /> Mulai Menulis
              </Link>
            ) : (
              <button className="btn btn-gold btn-lg" onClick={() => onOpenAuth('register')}>
                <PenLine size={18} /> Mulai Menulis Gratis
              </button>
            )}
            <Link to="/discover" className="btn btn-outline btn-lg">
              <BookOpen size={18} /> Jelajahi Novel
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="home__hero-stats animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            {[
              { label: 'Genre Tersedia', value: '37+' },
              { label: 'Fitur Premium', value: 'Gratis' },
              { label: 'Baca & Tulis', value: '24/7' },
            ].map(s => (
              <div key={s.label} className="home__stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating books decoration */}
        <div className="home__floating-books">
          <div className="home__floating-book animate-float" style={{ animationDelay: '0s' }}>📚</div>
          <div className="home__floating-book animate-float" style={{ animationDelay: '1s' }}>✨</div>
          <div className="home__floating-book animate-float" style={{ animationDelay: '2s' }}>🔮</div>
          <div className="home__floating-book animate-float" style={{ animationDelay: '0.5s' }}>⭐</div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="home__features">
        <div className="container">
          <div className="home__section-header">
            <Sparkles size={20} className="home__section-icon" />
            <h2 className="section-title">Mengapa Memilih <span className="text-gradient">AttaNovel?</span></h2>
            <p className="section-subtitle">Platform yang dirancang untuk para penulis sejati</p>
          </div>
          <div className="home__features-grid">
            {[
              {
                icon: '✍️',
                title: 'Editor Canggih',
                desc: 'Editor teks kaya fitur dengan kemampuan menyisipkan gambar, format teks, dan simpan otomatis.',
              },
              {
                icon: '🖼️',
                title: 'Sampul & Gambar',
                desc: 'Upload sampul novel kustom dan sisipkan gambar langsung di dalam cerita Anda.',
              },
              {
                icon: '💬',
                title: 'Komentar & Interaksi',
                desc: 'Bangun komunitas pembaca dengan sistem komentar dan balasan per bab.',
              },
              {
                icon: '🌙',
                title: 'Mode Baca Nyaman',
                desc: 'Tampilan membaca yang elegan dengan mode gelap, ukuran font dapat disesuaikan.',
              },
              {
                icon: '📊',
                title: 'Analitik Penulis',
                desc: 'Pantau pembaca, likes, dan views novel Anda dari dashboard personal.',
              },
              {
                icon: '🔒',
                title: 'Draft & Privat',
                desc: 'Simpan novel sebagai draft hingga Anda siap menerbitkannya ke publik.',
              },
            ].map((f, i) => (
              <div key={i} className="home__feature-card glass-card animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="home__feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== NOVEL LIST ===================== */}
      <section className="home__novels">
        <div className="container">
          <div className="home__section-header">
            <TrendingUp size={20} className="home__section-icon" />
            <h2 className="section-title">Novel <span className="text-gradient">Terbaru</span></h2>
            <p className="section-subtitle">Temukan cerita-cerita menarik yang baru diterbitkan</p>
          </div>

          {/* Genre Filter */}
          <div className="home__genre-filter">
            {GENRES.map(g => (
              <button
                key={g}
                className={`home__genre-btn ${activeGenre === g ? 'active' : ''}`}
                onClick={() => setActiveGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="home__loading">
              <div className="spinner spinner-lg" />
              <p>Memuat novel...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="home__novels-grid">
              {filtered.map(novel => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            <div className="home__empty">
              <span>📖</span>
              <h3>Belum Ada Novel</h3>
              <p>Jadilah yang pertama menerbitkan novel di AttaNovel!</p>
              {user ? (
                <Link to="/writer/create" className="btn btn-gold">
                  <PenLine size={16} /> Tulis Sekarang
                </Link>
              ) : (
                <button className="btn btn-gold" onClick={() => onOpenAuth('register')}>
                  <PenLine size={16} /> Mulai Menulis
                </button>
              )}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="home__view-all">
              <Link to="/discover" className="btn btn-outline">
                Lihat Semua Novel <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===================== RECENTLY VIEWED ===================== */}
      {recentlyViewed.length > 0 && (
        <section className="home__novels" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="home__section-header">
              <Clock size={20} className="home__section-icon" />
              <h2 className="section-title">Terakhir <span className="text-gradient">Dilihat</span></h2>
              <p className="section-subtitle">Lanjutkan membaca dari mana kamu berhenti</p>
            </div>
            <div className="home__novels-grid">
              {recentlyViewed.slice(0, 6).map(novel => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== TRENDING ===================== */}
      {trending.some(n => (n.likes || 0) > 0) && (
        <section className="home__novels" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="home__section-header">
              <Flame size={20} className="home__section-icon" style={{ color: '#f59e0b' }} />
              <h2 className="section-title">Sedang <span className="text-gradient">Trending</span></h2>
              <p className="section-subtitle">Novel yang paling banyak disukai saat ini</p>
            </div>
            <div className="home__novels-grid">
              {trending.filter(n => (n.likes || 0) > 0).map((novel, idx) => (
                <div key={novel.id} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: '-8px', left: '-8px', zIndex: 2,
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: '900', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}>#{idx + 1}</div>
                  <NovelCard novel={novel} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* placeholder to prevent double section close */}
      <section style={{ display: 'none' }}>
        <div className="container">
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="home__cta">
        <div className="container">
          <div className="home__cta-card glass-card">
            <div className="home__cta-orb" />
            <Crown size={48} className="home__cta-icon" />
            <h2>Siap Memulai Petualangan Menulis?</h2>
            <p>
              Bergabunglah dengan komunitas penulis AttaNovel dan bagikan kisah Anda kepada dunia.
              Dibuat dengan ❤️ oleh <strong className="home__cta-creator">Atha</strong>.
            </p>
            {!user && (
              <button className="btn btn-gold btn-lg" onClick={() => onOpenAuth('register')}>
                Daftar Gratis Sekarang
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

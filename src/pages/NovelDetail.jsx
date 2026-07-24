// src/pages/NovelDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Eye, Heart, Bookmark, Share2, User,
  Calendar, Tag, ChevronRight, Lock, Clock, Edit,
  FileText, TrendingUp, Star, Zap, BarChart2
} from 'lucide-react';
import { getNovel, incrementViews, toggleNovelLike, toggleNovelBookmark } from '../firebase/novels';
import { getChapters } from '../firebase/chapters';
import { useAuth } from '../context/AuthContext';
import { addRecentlyViewed } from '../hooks/useRecentlyViewed';
import { logActivity } from '../firebase/activity';
import { isDeveloper } from '../firebase/redeem';
import { deleteNovel } from '../firebase/novels';
import ShareDropdown from '../components/ui/ShareDropdown';
import toast from 'react-hot-toast';
import './NovelDetail.css';

// Estimate reading time per chapter (words / 200 wpm)
const estimateReadingTime = (text = '') => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
};

const NovelDetail = ({ onOpenAuth }) => {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const likeProcessing = useRef(false);
  const bookmarkProcessing = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [n, chs] = await Promise.all([
          getNovel(novelId),
          getChapters(novelId)
        ]);
        const isAuthor = n && user && n.authorId === user.uid;

        // Block if novel is draft and visitor is not the author
        if (n && n.status === 'draft' && !isAuthor) {
          toast.error('Novel ini masih berupa draft.');
          navigate('/');
          return;
        }

        setNovel(n);
        setChapters(isAuthor ? chs : chs.filter(ch => ch.status === 'published'));

        if (n) {
          const viewed = sessionStorage.getItem(`viewed_${novelId}`);
          if (!viewed) {
            await incrementViews(novelId);
            sessionStorage.setItem(`viewed_${novelId}`, 'true');
            n.views = (n.views || 0) + 1;
          }
          // Track recently viewed
          addRecentlyViewed(n);
        }

        if (userProfile && userProfile.likedNovels?.includes(novelId)) {
          setLiked(true);
        } else {
          setLiked(false);
        }

        if (userProfile && userProfile.bookmarkedNovels?.includes(novelId)) {
          setBookmarked(true);
        } else {
          setBookmarked(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [novelId, userProfile, user]);

  const handleLike = async () => {
    if (!user) { onOpenAuth('login'); return; }
    // Debounce: prevent double-click
    if (likeProcessing.current) return;
    likeProcessing.current = true;
    const wasLiked = liked;
    try {
      await toggleNovelLike(novelId, user.uid, wasLiked);
      setNovel(n => ({
        ...n,
        likes: (n.likes || 0) + (wasLiked ? -1 : 1)
      }));
      setLiked(!wasLiked);

      if (userProfile) {
        if (wasLiked) {
          userProfile.likedNovels = (userProfile.likedNovels || []).filter(id => id !== novelId);
        } else {
          userProfile.likedNovels = [...(userProfile.likedNovels || []), novelId];
          // Log activity
          logActivity(user.uid, 'like', { novelId, novelTitle: novel?.title });
        }
      }

      toast.success(wasLiked ? 'Batal menyukai novel' : 'Novel disukai! ❤️');
    } catch (e) {
      toast.error('Gagal memproses likes.');
    } finally {
      // Release lock after 800ms — prevents very fast double-click
      setTimeout(() => { likeProcessing.current = false; }, 800);
    }
  };

  const handleBookmark = async () => {
    if (!user) { onOpenAuth('login'); return; }
    // Debounce: prevent double-click
    if (bookmarkProcessing.current) return;
    bookmarkProcessing.current = true;
    const wasBookmarked = bookmarked;
    try {
      await toggleNovelBookmark(novelId, user.uid, wasBookmarked);
      setBookmarked(!wasBookmarked);

      if (userProfile) {
        if (wasBookmarked) {
          userProfile.bookmarkedNovels = (userProfile.bookmarkedNovels || []).filter(id => id !== novelId);
        } else {
          userProfile.bookmarkedNovels = [...(userProfile.bookmarkedNovels || []), novelId];
          logActivity(user.uid, 'bookmark', { novelId, novelTitle: novel?.title });
        }
      }

      toast.success(wasBookmarked ? 'Bookmark dihapus' : 'Novel di-bookmark! 🔖');
    } catch (e) {
      toast.error('Gagal memproses bookmark.');
    } finally {
      setTimeout(() => { bookmarkProcessing.current = false; }, 800);
    }
  };

  if (loading) return (
    <div className="novel-detail__loading">
      <div className="spinner spinner-lg" />
      <p>Memuat novel...</p>
    </div>
  );

  if (!novel) return (
    <div className="novel-detail__not-found">
      <span>📚</span>
      <h2>Novel tidak ditemukan</h2>
      <Link to="/" className="btn btn-primary">Kembali ke Beranda</Link>
    </div>
  );

  const isAuthor = user && user.uid === novel.authorId;
  const publishedChapters = chapters.filter(c => c.status !== 'draft' || isAuthor);

  // Estimate total words from all chapters that have content field
  const totalWords = chapters.reduce((sum, ch) => {
    const { words } = estimateReadingTime(ch.content || '');
    return sum + words;
  }, 0);
  const totalReadingMinutes = Math.max(1, Math.round(totalWords / 200));

  // Writing status config
  const writingStatusMap = {
    'Completed': { label: '✅ Tamat', color: '#10b981' },
    'Hiatus': { label: '💤 Hiatus', color: '#f59e0b' },
    'Dropped': { label: '❌ Dropped', color: '#ef4444' },
    'Planning': { label: '📅 Rencana', color: '#6366f1' },
    'Ongoing': { label: '✍️ Ongoing', color: '#8b5cf6' },
  };
  const wsConfig = writingStatusMap[novel.writingStatus || 'Ongoing'] || writingStatusMap['Ongoing'];

  const synopsis = novel.description || 'Tidak ada sinopsis tersedia.';
  const synopsisLong = synopsis.length > 300;

  return (
    <div className="novel-detail">
      {/* Hero Banner */}
      <div className="novel-detail__banner">
        {novel.cover && (
          <div
            className="novel-detail__banner-bg"
            style={{ backgroundImage: `url(${novel.cover})` }}
          />
        )}
        <div className="novel-detail__banner-overlay" />

        <div className="container novel-detail__banner-inner">
          {/* Cover */}
          <div className="novel-detail__cover-wrap">
            {novel.cover
              ? <img src={novel.cover} alt={novel.title} className="novel-detail__cover" />
              : <div className="novel-detail__cover-placeholder">📖</div>
            }
            {/* Writing status badge on cover */}
            <div style={{
              position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.75)', color: wsConfig.color,
              fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px',
              borderRadius: '20px', backdropFilter: 'blur(4px)',
              border: `1px solid ${wsConfig.color}40`, whiteSpace: 'nowrap',
            }}>
              {wsConfig.label}
            </div>
          </div>

          {/* Info */}
          <div className="novel-detail__info">
            <div className="novel-detail__badges">
              {novel.genre && <span className="badge badge-primary">{novel.genre}</span>}
              <span className={`badge ${novel.status === 'published' ? 'badge-green' : 'badge-gold'}`}>
                {novel.status === 'published' ? 'Diterbitkan' : 'Draft'}
              </span>
            </div>

            <h1 className="novel-detail__title">{novel.title}</h1>

            <div className="novel-detail__author-row">
              <div className="novel-detail__author-avatar">
                <User size={16} />
              </div>
              <span>oleh <Link to={`/profile/${novel.authorId}`} style={{ color: 'var(--color-gold)', textDecoration: 'none', fontWeight: '600' }}>{novel.authorName || 'Anonim'}</Link></span>
            </div>

            <div className="novel-detail__stats">
              <span><Eye size={14} /> {(novel.views || 0).toLocaleString()} views</span>
              <span><Heart size={14} /> {(novel.likes || 0).toLocaleString()} suka</span>
              <span><BookOpen size={14} /> {chapters.length} bab</span>
              <span><Calendar size={14} /> {novel.createdAt?.toDate?.()?.toLocaleDateString('id-ID') || 'Baru'}</span>
              {totalWords > 0 && (
                <span><FileText size={14} /> ~{totalWords.toLocaleString()} kata</span>
              )}
              {totalReadingMinutes > 0 && totalWords > 0 && (
                <span><Clock size={14} /> ~{totalReadingMinutes} mnt baca</span>
              )}
            </div>

            {/* Tags */}
            {novel.tags?.length > 0 && (
              <div className="novel-detail__tags">
                {novel.tags.map(t => (
                  <span key={t} className="badge badge-primary">
                    <Tag size={10} /> {t}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="novel-detail__actions">
              {publishedChapters.length > 0 && (
                <button
                  className="btn btn-gold btn-lg"
                  onClick={() => navigate(`/novel/${novelId}/chapter/${publishedChapters[0].id}`)}
                >
                  <BookOpen size={18} /> Mulai Baca
                </button>
              )}
              <button
                className={`btn btn-outline ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                title="Sukai Novel"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Disukai' : 'Suka'} {novel.likes > 0 && `(${novel.likes})`}
              </button>
              <button
                className={`btn btn-outline ${bookmarked ? 'bookmarked' : ''}`}
                onClick={handleBookmark}
                title="Bookmark"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? 'Disimpan' : 'Simpan'}
              </button>
              <ShareDropdown title={novel.title} url={window.location.href} />
              {isAuthor && (
                <Link to={`/writer/novel/${novelId}`} className="btn btn-outline">
                  <Edit size={16} /> Edit Novel
                </Link>
              )}
              {/* Developer Mode: Force Delete any novel */}
              {isDeveloper() && !isAuthor && (
                <button
                  className="btn btn-sm"
                  style={{ background: '#ef4444', color: '#fff', border: 'none', opacity: 0.85 }}
                  onClick={async () => {
                    if (!confirm(`[DEV] Hapus paksa novel "${novel.title}"?`)) return;
                    try {
                      await deleteNovel(novelId);
                      toast.success('[DEV] Novel berhasil dihapus secara paksa.');
                      navigate('/');
                    } catch (e) {
                      toast.error('Gagal menghapus: ' + e.message);
                    }
                  }}
                  title="[Developer] Force Delete Novel"
                >
                  🔧 DEV DELETE
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container novel-detail__body">
        <div className="novel-detail__main">
          {/* Synopsis */}
          <section className="novel-detail__section glass-card">
            <h2>Sinopsis</h2>
            <div className="novel-detail__synopsis" style={{ position: 'relative' }}>
              <div style={{
                maxHeight: synopsisExpanded || !synopsisLong ? 'none' : '120px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {synopsis}
                {!synopsisExpanded && synopsisLong && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                    background: 'linear-gradient(transparent, rgba(20,16,36,0.95))',
                  }} />
                )}
              </div>
              {synopsisLong && (
                <button
                  onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--color-gold)',
                    cursor: 'pointer', padding: '6px 0', fontSize: '0.85rem',
                    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
                    marginTop: '6px',
                  }}
                >
                  {synopsisExpanded ? '▲ Tampilkan lebih sedikit' : '▼ Tampilkan selengkapnya'}
                </button>
              )}
            </div>
          </section>

          {/* Novel Stats Card */}
          <section className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
              <BarChart2 size={18} style={{ color: 'var(--color-gold)' }} /> Statistik Novel
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
              {[
                { icon: <Eye size={20} />, value: (novel.views || 0).toLocaleString(), label: 'Ditampilkan' },
                { icon: <Heart size={20} />, value: (novel.likes || 0).toLocaleString(), label: 'Disukai' },
                { icon: <Bookmark size={20} />, value: (novel.bookmarks || 0).toLocaleString(), label: 'Disimpan' },
                { icon: <BookOpen size={20} />, value: chapters.length, label: 'Bab' },
              ].map(s => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '12px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ color: 'var(--color-gold)', marginBottom: '6px' }}>{s.icon}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Chapters */}
          <section className="novel-detail__section glass-card">
            <div className="novel-detail__chapters-header">
              <h2><BookOpen size={20} /> Daftar Bab</h2>
              <span className="badge badge-primary">{chapters.length} Bab</span>
            </div>
            {chapters.length === 0 ? (
              <div className="novel-detail__no-chapters">
                <Clock size={32} />
                <p>Belum ada bab yang tersedia</p>
              </div>
            ) : (
              <div className="novel-detail__chapters-list">
                {chapters.map((ch, idx) => {
                  const { minutes } = estimateReadingTime(ch.content || '');
                  return (
                    <div
                      key={ch.id}
                      className={`novel-detail__chapter-item ${ch.status === 'draft' ? 'draft' : ''}`}
                      onClick={() => navigate(`/novel/${novelId}/chapter/${ch.id}`)}
                    >
                      <div className="novel-detail__chapter-num">
                        {ch.status === 'draft' ? <Lock size={14} /> : idx + 1}
                      </div>
                      <div className="novel-detail__chapter-info">
                        <span className="novel-detail__chapter-title">{ch.title}</span>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '3px' }}>
                          {ch.updatedAt && (
                            <span className="novel-detail__chapter-date">
                              {ch.updatedAt?.toDate?.()?.toLocaleDateString('id-ID') || ''}
                            </span>
                          )}
                          {ch.content && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={10} /> ~{minutes} mnt
                            </span>
                          )}
                        </div>
                      </div>
                      {ch.status !== 'draft' && <ChevronRight size={16} className="novel-detail__chapter-arrow" />}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="novel-detail__sidebar">
          <div className="glass-card novel-detail__sidebar-card">
            <h3>Detail Novel</h3>
            <dl className="novel-detail__dl">
              <dt>Genre</dt>
              <dd>{novel.genre || '-'}</dd>
              <dt>Status Karya</dt>
              <dd style={{ color: wsConfig.color, fontWeight: '600' }}>{wsConfig.label}</dd>
              <dt>Visibilitas</dt>
              <dd>{novel.status === 'published' ? '🌍 Diterbitkan' : '🔒 Draft'}</dd>
              <dt>Jumlah Bab</dt>
              <dd>{chapters.length} bab</dd>
              <dt>Total Views</dt>
              <dd>{(novel.views || 0).toLocaleString()}</dd>
              {totalWords > 0 && (
                <>
                  <dt>Estimasi Kata</dt>
                  <dd>~{totalWords.toLocaleString()} kata</dd>
                  <dt>Waktu Baca</dt>
                  <dd>~{totalReadingMinutes} menit</dd>
                </>
              )}
            </dl>
          </div>

          {/* Quick Read CTA */}
          {publishedChapters.length > 0 && (
            <div className="glass-card novel-detail__sidebar-card" style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.2), rgba(139,92,246,0.1))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Zap size={18} style={{ color: 'var(--color-gold)' }} />
                <h3 style={{ margin: 0 }}>Mulai Sekarang</h3>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                Bab 1 sudah tersedia — mulai petualanganmu!
              </p>
              <button
                className="btn btn-gold"
                style={{ width: '100%' }}
                onClick={() => navigate(`/novel/${novelId}/chapter/${publishedChapters[0].id}`)}
              >
                <BookOpen size={16} /> Baca Bab 1
              </button>
              {publishedChapters.length > 1 && (
                <button
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '8px', fontSize: '0.82rem' }}
                  onClick={() => navigate(`/novel/${novelId}/chapter/${publishedChapters[publishedChapters.length - 1].id}`)}
                >
                  Bab Terbaru →
                </button>
              )}
            </div>
          )}

          {novel.tags?.length > 0 && (
            <div className="glass-card novel-detail__sidebar-card">
              <h3>Tag</h3>
              <div className="novel-detail__tags">
                {novel.tags.map(t => (
                  <span key={t} className="badge badge-primary"><Tag size={10} /> {t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Made by Atha watermark */}
          <div className="novel-detail__credit">
            <span>Powered by <strong>AttaNovel</strong></span>
            <span>Made with ❤️ by <strong>Atha</strong></span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NovelDetail;

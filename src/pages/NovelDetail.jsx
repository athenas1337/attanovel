// src/pages/NovelDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Eye, Heart, Bookmark, Share2, User,
  Calendar, Tag, ChevronRight, Lock, Clock, Edit
} from 'lucide-react';
import { getNovel, incrementViews, toggleNovelLike } from '../firebase/novels';
import { getChapters } from '../firebase/chapters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './NovelDetail.css';

const NovelDetail = ({ onOpenAuth }) => {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [n, chs] = await Promise.all([
          getNovel(novelId),
          getChapters(novelId)
        ]);
        setNovel(n);
        setChapters(chs);
        
        if (n) {
          const viewed = sessionStorage.getItem(`viewed_${novelId}`);
          if (!viewed) {
            await incrementViews(novelId);
            sessionStorage.setItem(`viewed_${novelId}`, 'true');
            n.views = (n.views || 0) + 1;
          }
        }

        if (userProfile && userProfile.likedNovels?.includes(novelId)) {
          setLiked(true);
        } else {
          setLiked(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [novelId, userProfile]);

  const handleLike = async () => {
    if (!user) { onOpenAuth('login'); return; }
    try {
      await toggleNovelLike(novelId, user.uid, liked);
      setNovel(n => ({
        ...n,
        likes: (n.likes || 0) + (liked ? -1 : 1)
      }));
      setLiked(!liked);

      if (userProfile) {
        if (liked) {
          userProfile.likedNovels = (userProfile.likedNovels || []).filter(id => id !== novelId);
        } else {
          userProfile.likedNovels = [...(userProfile.likedNovels || []), novelId];
        }
      }

      toast.success(liked ? 'Batal menyukai novel' : 'Novel disukai! ❤️');
    } catch (e) {
      toast.error('Gagal memproses likes.');
    }
  };

  const handleBookmark = () => {
    if (!user) { onOpenAuth('login'); return; }
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? 'Bookmark dihapus' : 'Novel di-bookmark! 🔖');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link disalin ke clipboard!');
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
              <span>oleh <strong>{novel.authorName || 'Anonim'}</strong></span>
            </div>

            <div className="novel-detail__stats">
              <span><Eye size={14} /> {(novel.views || 0).toLocaleString()} views</span>
              <span><Heart size={14} /> {(novel.likes || 0).toLocaleString()} suka</span>
              <span><BookOpen size={14} /> {chapters.length} bab</span>
              <span><Calendar size={14} /> {novel.createdAt?.toDate?.()?.toLocaleDateString('id-ID') || 'Baru'}</span>
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
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Disukai' : 'Suka'}
              </button>
              <button
                className={`btn btn-outline ${bookmarked ? 'bookmarked' : ''}`}
                onClick={handleBookmark}
                title="Bookmark"
              >
                <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
              <button className="btn btn-ghost" onClick={handleShare} title="Bagikan">
                <Share2 size={16} />
              </button>
              {isAuthor && (
                <Link to={`/writer/novel/${novelId}`} className="btn btn-outline">
                  <Edit size={16} /> Edit Novel
                </Link>
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
            <div className="novel-detail__synopsis">
              {novel.description || 'Tidak ada sinopsis tersedia.'}
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
                {chapters.map((ch, idx) => (
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
                      {ch.updatedAt && (
                        <span className="novel-detail__chapter-date">
                          {ch.updatedAt?.toDate?.()?.toLocaleDateString('id-ID') || ''}
                        </span>
                      )}
                    </div>
                    {ch.status !== 'draft' && <ChevronRight size={16} className="novel-detail__chapter-arrow" />}
                  </div>
                ))}
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
              <dt>Status</dt>
              <dd>{novel.status === 'published' ? 'Tamat/On-going' : 'Draft'}</dd>
              <dt>Jumlah Bab</dt>
              <dd>{chapters.length}</dd>
              <dt>Total Tampilan</dt>
              <dd>{(novel.views || 0).toLocaleString()}</dd>
            </dl>
          </div>

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

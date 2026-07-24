// src/pages/ReadChapter.jsx — Premium Reading Experience
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, BookOpen, MessageCircle,
  Minus, Plus, Menu, X, Send, Heart, Reply,
  Trash2, User, Sparkles, Flag, EyeOff, AlertTriangle,
  ThumbsUp, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { getNovel } from '../firebase/novels';
import { getChapters } from '../firebase/chapters';
import {
  getComments, addComment, deleteComment,
  addReply, toggleCommentLike, reportComment
} from '../firebase/comments';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../firebase/activity';
import { isDeveloper } from '../firebase/redeem';
import toast from 'react-hot-toast';
import './ReadChapter.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate?.() || new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  if (diffH < 24) return `${diffH} jam lalu`;
  if (diffD === 1) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

// ─── Report Modal Component ──────────────────────────────────────────────────
const REPORT_REASONS = [
  'Konten tidak pantas',
  'Spam atau iklan',
  'Ujaran kebencian',
  'Informasi palsu',
  'Lainnya',
];

const ReportModal = ({ onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Flag size={18} style={{ color: '#ef4444' }} /> Laporkan Komentar
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
          Pilih alasan pelaporan:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {REPORT_REASONS.map(r => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                style={{ accentColor: 'var(--color-primary-light)' }}
              />
              {r}
            </label>
          ))}
        </div>
        {reason === 'Lainnya' && (
          <textarea
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Jelaskan alasan..."
            className="form-input form-textarea"
            rows={3}
            style={{ marginBottom: 14 }}
          />
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Batal</button>
          <button
            className="btn btn-sm"
            style={{ background: '#ef4444', color: '#fff', border: 'none' }}
            disabled={!reason}
            onClick={() => onSubmit(reason === 'Lainnya' ? custom || reason : reason)}
          >
            <Flag size={13} /> Laporkan
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Comment Item Component ──────────────────────────────────────────────────
const CommentItem = ({
  comment, novelAuthorId, currentUser, userProfile,
  novelId, chapterId,
  onDelete, onReplyAdded, onLikeToggle,
}) => {
  const isOwner = currentUser?.uid === comment.userId;
  const isNovelAuthor = novelAuthorId && comment.userId === novelAuthorId;
  const isViewerAuthor = currentUser?.uid === novelAuthorId;
  const isDev = isDeveloper();

  const [showReplies, setShowReplies] = useState(false);
  const [replyingTo, setReplyingTo] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [hidden, setHidden] = useState(false);

  const hasLiked = (comment.likes || []).includes(currentUser?.uid);
  const likeCount = (comment.likes || []).length;
  const replyCount = (comment.replies || []).length;

  const handleLike = async () => {
    if (!currentUser) return;
    await onLikeToggle(comment.id, hasLiked, comment.replies);
  };

  const handleSendReply = async () => {
    if (!currentUser || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await addReply(novelId, chapterId, comment.id, {
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.displayName || 'Pengguna',
        userAvatar: userProfile?.avatar || '',
        text: replyText.trim(),
      });
      setReplyText('');
      setReplyingTo(false);
      setShowReplies(true);
      onReplyAdded();
      toast.success('Balasan dikirim!');
    } catch (e) {
      toast.error('Gagal mengirim balasan.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleReport = async (reason) => {
    if (!currentUser) return;
    try {
      await reportComment(novelId, chapterId, comment.id, currentUser.uid, reason);
      setShowReport(false);
      toast.success('Komentar dilaporkan. Terima kasih!');
    } catch (e) {
      toast.error('Gagal melaporkan komentar.');
    }
  };

  if (hidden) return (
    <div className="read__comment" style={{ opacity: 0.45 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        Komentar disembunyikan.{' '}
        <button onClick={() => setHidden(false)} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', cursor: 'pointer', fontSize: 'inherit' }}>
          Tampilkan
        </button>
      </p>
    </div>
  );

  return (
    <div className="read__comment">
      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          onSubmit={handleReport}
        />
      )}

      {/* Header */}
      <div className="read__comment-header">
        <div className="read__comment-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {comment.userAvatar
            ? <img src={comment.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <User size={12} />
          }
        </div>
        <div className="read__comment-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <strong>{comment.userName}</strong>
            {/* Author Badge */}
            {isNovelAuthor && (
              <span style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000', fontSize: '0.6rem', fontWeight: '700',
                padding: '1px 6px', borderRadius: '10px', letterSpacing: '0.04em',
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                <Shield size={8} /> PENULIS
              </span>
            )}
            {isDev && (
              <span style={{
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: '#fff', fontSize: '0.6rem', fontWeight: '700',
                padding: '1px 6px', borderRadius: '10px',
              }}>
                DEV
              </span>
            )}
          </div>
          <span>{formatDate(comment.createdAt)}</span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          {/* Delete: owner, novel author, or dev */}
          {(isOwner || isViewerAuthor || isDev) && (
            <button
              className="read__comment-delete"
              onClick={() => {
                if (window.confirm('Hapus komentar ini?')) onDelete(comment.id);
              }}
              title="Hapus komentar"
            >
              <Trash2 size={12} />
            </button>
          )}
          {/* Report & Hide: for regular readers (not owner, not author) */}
          {currentUser && !isOwner && !isViewerAuthor && !isDev && (
            <>
              <button
                onClick={() => setShowReport(true)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                title="Laporkan komentar"
              >
                <Flag size={11} />
              </button>
              <button
                onClick={() => setHidden(true)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                title="Sembunyikan komentar"
              >
                <EyeOff size={11} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Comment text */}
      <p className="read__comment-text">{comment.text}</p>

      {/* Footer actions */}
      <div className="read__comment-actions">
        {/* Like button */}
        <button
          onClick={currentUser ? handleLike : undefined}
          className={`read__comment-like-btn ${hasLiked ? 'liked' : ''}`}
          title={currentUser ? (hasLiked ? 'Batalkan suka' : 'Suka komentar') : 'Login untuk menyukai'}
        >
          <ThumbsUp size={12} fill={hasLiked ? 'currentColor' : 'none'} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Reply button */}
        <button
          className="read__comment-reply-btn"
          onClick={() => {
            if (!currentUser) return;
            setReplyingTo(!replyingTo);
          }}
        >
          <Reply size={12} /> Balas
        </button>

        {/* Collapse/expand replies (YouTube-style) */}
        {replyCount > 0 && (
          <button
            onClick={() => setShowReplies(v => !v)}
            className="read__replies-toggle"
          >
            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {replyCount} balasan
          </button>
        )}
      </div>

      {/* Reply input */}
      {replyingTo && currentUser && (
        <div className="read__reply-form">
          <input
            type="text"
            placeholder={`Balas @${comment.userName}...`}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendReply()}
            className="read__comment-input"
            autoFocus
          />
          <div className="read__reply-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSendReply}
              disabled={sendingReply || !replyText.trim()}
            >
              {sendingReply ? <div className="spinner" style={{ width: 12, height: 12 }} /> : 'Kirim'}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => { setReplyingTo(false); setReplyText(''); }}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Replies list (collapsible, YouTube-style) */}
      {showReplies && replyCount > 0 && (
        <div className="read__replies">
          {(comment.replies || []).map(r => (
            <div key={r.id} className="read__reply">
              <div className="read__comment-avatar sm" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {r.userAvatar
                  ? <img src={r.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={10} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.82rem' }}>{r.userName}</strong>
                  {r.userId === novelAuthorId && (
                    <span style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#000', fontSize: '0.55rem', fontWeight: '700',
                      padding: '1px 5px', borderRadius: '8px',
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                    }}>
                      <Shield size={7} /> PENULIS
                    </span>
                  )}
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main ReadChapter Component ──────────────────────────────────────────────
const ReadChapter = ({ onOpenAuth }) => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapter, setChapter] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('attanovel_read_theme') || 'dark');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('attanovel_read_font') || 'serif');
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('attanovel_read_size') || '18'));
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const contentRef = useRef(null);

  // Particle toggle
  const [showParticles, setShowParticles] = useState(() => {
    const s = localStorage.getItem('attanovel_read_particles');
    return s === null ? true : s === 'true';
  });

  useEffect(() => {
    const el = document.querySelector('.particle-canvas');
    if (el) el.style.display = showParticles ? '' : 'none';
    localStorage.setItem('attanovel_read_particles', showParticles);
    return () => {
      const el2 = document.querySelector('.particle-canvas');
      if (el2) el2.style.display = '';
    };
  }, [showParticles]);

  // Load novel data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [n, chs] = await Promise.all([getNovel(novelId), getChapters(novelId)]);
        const isAuthor = n && user && n.authorId === user.uid;
        if (n && n.status === 'draft' && !isAuthor) {
          toast.error('Novel ini masih berupa draft.');
          navigate('/');
          return;
        }
        setNovel(n);
        setChapters(isAuthor ? chs : chs.filter(ch => ch.status === 'published'));
        const ch = chs.find(c => c.id === chapterId);
        if (ch && ch.status === 'draft' && !isAuthor) {
          toast.error('Bab ini belum diterbitkan.');
          navigate(`/novel/${novelId}`);
          return;
        }
        setChapter(ch || null);
        const cmts = await getComments(novelId, chapterId);
        setComments(cmts);
        // Log read activity
        if (user && ch) {
          logActivity(user.uid, 'read', {
            novelId, novelTitle: n?.title, chapterId, chapterTitle: ch?.title,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [novelId, chapterId, user]);

  useEffect(() => {
    if (contentRef.current) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chapterId]);

  // Persist reading preferences
  useEffect(() => { localStorage.setItem('attanovel_read_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('attanovel_read_font', fontFamily); }, [fontFamily]);
  useEffect(() => { localStorage.setItem('attanovel_read_size', fontSize); }, [fontSize]);

  const currentIdx = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && prevChapter) navigate(`/novel/${novelId}/chapter/${prevChapter.id}`);
      if (e.key === 'ArrowRight' && nextChapter) navigate(`/novel/${novelId}/chapter/${nextChapter.id}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prevChapter, nextChapter, novelId, navigate]);

  const refreshComments = async () => {
    const cmts = await getComments(novelId, chapterId);
    setComments(cmts);
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!user) { onOpenAuth('login'); return; }
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      await addComment(novelId, chapterId, {
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || 'Pengguna',
        userAvatar: userProfile?.avatar || '',
        text: newComment.trim(),
      });
      setNewComment('');
      await refreshComments();
      logActivity(user.uid, 'comment', {
        novelId, novelTitle: novel?.title, chapterId, chapterTitle: chapter?.title,
      });
      toast.success('Komentar berhasil dikirim!');
    } catch (e) {
      toast.error('Gagal mengirim komentar.');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(novelId, chapterId, commentId);
      setComments(c => c.filter(cm => cm.id !== commentId));
      toast.success('Komentar dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus komentar.');
    }
  };

  const handleCommentLike = async (commentId, hasLiked) => {
    if (!user) { onOpenAuth('login'); return; }
    try {
      await toggleCommentLike(novelId, chapterId, commentId, user.uid, hasLiked);
      // Optimistic update
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        const likes = c.likes || [];
        return {
          ...c,
          likes: hasLiked ? likes.filter(uid => uid !== user.uid) : [...likes, user.uid],
        };
      }));
    } catch (e) {
      toast.error('Gagal memproses suka.');
    }
  };

  if (loading) return (
    <div className="read__loading">
      <div className="spinner spinner-lg" />
      <p>Memuat bab...</p>
    </div>
  );

  if (!chapter) return (
    <div className="read__not-found">
      <span>📖</span>
      <h2>Bab tidak ditemukan</h2>
      <Link to={`/novel/${novelId}`} className="btn btn-primary">Kembali ke Novel</Link>
    </div>
  );

  return (
    <div className={`read read--${theme} read--font-${fontFamily}`}>
      {/* ═══ TOP BAR ═══════════════════════════════════════════════ */}
      <div className="read__topbar">
        <div className="read__topbar-left">
          <Link to={`/novel/${novelId}`} className="read__back-btn">
            <ChevronLeft size={18} /> <span className="read__back-title">{novel?.title}</span>
          </Link>
        </div>
        <div className="read__topbar-center">
          <button className="read__toc-btn" onClick={() => setShowToc(true)}>
            <Menu size={16} />
            <span>Bab {currentIdx + 1}: {chapter.title}</span>
          </button>
        </div>
        <div className="read__topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="read__tool-btn" onClick={() => setFontSize(f => Math.max(14, f - 1))} title="Perkecil Font">
            <Minus size={16} />
          </button>
          <span className="read__font-size" style={{ minWidth: '36px', textAlign: 'center' }}>{fontSize}px</span>
          <button className="read__tool-btn" onClick={() => setFontSize(f => Math.min(26, f + 1))} title="Perbesar Font">
            <Plus size={16} />
          </button>
          <button
            className="read__tool-btn"
            onClick={() => setFontFamily(f => f === 'serif' ? 'sans-serif' : 'serif')}
            title="Ganti Font"
            style={{ fontWeight: 'bold', minWidth: '32px' }}
          >
            {fontFamily === 'serif' ? 'Aa' : 'Ag'}
          </button>
          <select
            className="read__theme-select"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            title="Tema"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-2)', padding: '6px 8px', borderRadius: '6px',
              fontSize: '0.75rem', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="dark">🌌 Gelap</option>
            <option value="light">📄 Terang</option>
            <option value="sepia">📜 Sepia</option>
          </select>
          <button className="read__comment-toggle" onClick={() => setShowComments(!showComments)}>
            <MessageCircle size={16} />
            <span>{comments.length}</span>
          </button>
          <button
            className="read__tool-btn"
            onClick={() => setShowParticles(p => !p)}
            title={showParticles ? 'Sembunyikan bintang' : 'Tampilkan bintang'}
            style={{ color: showParticles ? 'var(--color-gold)' : 'var(--color-text-muted)' }}
          >
            <Sparkles size={14} />
          </button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══════════════════════════════════════════ */}
      <div className="read__layout">
        <main className="read__main" ref={contentRef}>
          <div className="read__chapter-header">
            <div className="read__chapter-meta">Bab {currentIdx + 1} dari {chapters.length}</div>
            <h1 className="read__chapter-title">{chapter.title}</h1>
            <div className="read__chapter-date" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span>{formatDate(chapter.updatedAt)}</span>
              {chapter.content && (() => {
                const words = chapter.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
                const mins = Math.max(1, Math.round(words / 200));
                return (
                  <>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📖 ~{words.toLocaleString()} kata</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>⏱ ~{mins} menit baca</span>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="read__content" style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: chapter.content || '<p>Konten bab belum tersedia.</p>' }}
          />

          <div className="read__nav">
            {prevChapter ? (
              <button className="btn btn-outline" onClick={() => navigate(`/novel/${novelId}/chapter/${prevChapter.id}`)}>
                <ChevronLeft size={16} /> Bab Sebelumnya
              </button>
            ) : <div />}
            {nextChapter ? (
              <button className="btn btn-primary" onClick={() => navigate(`/novel/${novelId}/chapter/${nextChapter.id}`)}>
                Bab Berikutnya <ChevronRight size={16} />
              </button>
            ) : (
              <Link to={`/novel/${novelId}`} className="btn btn-gold">
                <BookOpen size={16} /> Selesai Membaca
              </Link>
            )}
          </div>

          <div className="read__credit">
            Dibaca di <strong>AttaNovel</strong> · Made by <strong>Atha</strong>
          </div>
        </main>

        {/* ═══ COMMENTS PANEL ═════════════════════════════════════════ */}
        {showComments && (
          <aside className="read__comments-panel animate-slideInRight">
            <div className="read__comments-header">
              <h3><MessageCircle size={18} /> Komentar ({comments.length})</h3>
              <button className="read__tool-btn" onClick={() => setShowComments(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSendComment} className="read__comment-form">
              <div className="read__comment-input-wrap">
                <div className="read__comment-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user ? (
                    userProfile?.avatar
                      ? <img src={userProfile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <User size={14} />
                  ) : '?'}
                </div>
                <input
                  type="text"
                  placeholder={user ? 'Tulis komentar...' : 'Login untuk berkomentar'}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="read__comment-input"
                  onClick={() => !user && onOpenAuth('login')}
                  readOnly={!user}
                />
                <button type="submit" className="read__comment-send" disabled={sendingComment || !newComment.trim()}>
                  {sendingComment ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="read__comments-list">
              {comments.length === 0 ? (
                <div className="read__comments-empty">
                  <MessageCircle size={32} />
                  <p>Belum ada komentar. Jadilah yang pertama!</p>
                </div>
              ) : (
                comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    novelAuthorId={novel?.authorId}
                    currentUser={user}
                    userProfile={userProfile}
                    novelId={novelId}
                    chapterId={chapterId}
                    onDelete={handleDeleteComment}
                    onReplyAdded={refreshComments}
                    onLikeToggle={handleCommentLike}
                  />
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ═══ TABLE OF CONTENTS MODAL ═══════════════════════════════ */}
      {showToc && (
        <div className="modal-overlay" onClick={() => setShowToc(false)}>
          <div className="modal read__toc-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowToc(false)}><X size={16} /></button>
            <h3 className="read__toc-title">
              <BookOpen size={18} /> Daftar Bab — {novel?.title}
            </h3>
            <div className="read__toc-list">
              {chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  className={`read__toc-item ${ch.id === chapterId ? 'active' : ''}`}
                  onClick={() => { navigate(`/novel/${novelId}/chapter/${ch.id}`); setShowToc(false); }}
                >
                  <span className="read__toc-num">{idx + 1}</span>
                  <span className="read__toc-name">{ch.title}</span>
                  {ch.id === chapterId && <span className="badge badge-primary">Dibaca</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadChapter;

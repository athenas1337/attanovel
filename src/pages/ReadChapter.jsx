// src/pages/ReadChapter.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, BookOpen, MessageCircle,
  Sun, Moon, Minus, Plus, Menu, X, Send, Heart, Reply, Trash2, User
} from 'lucide-react';
import { getNovel } from '../firebase/novels';
import { getChapters } from '../firebase/chapters';
import { getComments, addComment, deleteComment, addReply } from '../firebase/comments';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ReadChapter.css';

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
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
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
        
        const ch = chs.find(c => c.id === chapterId);
        
        // Block if chapter is draft and visitor is not the author
        if (ch && ch.status === 'draft' && !isAuthor) {
          toast.error('Bab ini masih berupa draft dan belum diterbitkan.');
          navigate(`/novel/${novelId}`);
          return;
        }

        setChapter(ch || null);
        // Load comments
        const cmts = await getComments(novelId, chapterId);
        setComments(cmts);
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

  // Keyboard shortcuts: Left/Right arrow for prev/next chapter
  const currentIdx = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' && prevChapter) navigate(`/novel/${novelId}/chapter/${prevChapter.id}`);
      if (e.key === 'ArrowRight' && nextChapter) navigate(`/novel/${novelId}/chapter/${nextChapter.id}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prevChapter, nextChapter, novelId, navigate]);

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
      const cmts = await getComments(novelId, chapterId);
      setComments(cmts);
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

  const handleSendReply = async (commentId) => {
    if (!user || !replyText.trim()) return;
    try {
      await addReply(novelId, chapterId, commentId, {
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || 'Pengguna',
        userAvatar: userProfile?.avatar || '',
        text: replyText.trim(),
      });
      setReplyingTo(null);
      setReplyText('');
      const cmts = await getComments(novelId, chapterId);
      setComments(cmts);
      toast.success('Balasan dikirim!');
    } catch (e) {
      toast.error('Gagal mengirim balasan.');
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate?.() || new Date(ts);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
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
      {/* ===================== TOP BAR ===================== */}
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
          <button className="read__tool-btn" onClick={() => setFontSize(f => Math.min(24, f + 1))} title="Perbesar Font">
            <Plus size={16} />
          </button>

          {/* Font Family Toggle */}
          <button
            className="read__tool-btn"
            onClick={() => setFontFamily(f => f === 'serif' ? 'sans-serif' : 'serif')}
            title="Ganti Font (Serif / Sans)"
            style={{ fontWeight: 'bold', minWidth: '32px' }}
          >
            {fontFamily === 'serif' ? 'Aa' : 'Ag'}
          </button>

          {/* Theme Selector */}
          <select
            className="read__theme-select"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            title="Ubah Tema Latar"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-2)',
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: 'pointer'
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
        </div>
      </div>

      {/* ===================== MAIN CONTENT ===================== */}
      <div className="read__layout">
        <main className="read__main" ref={contentRef}>
          {/* Chapter Header */}
          <div className="read__chapter-header">
            <div className="read__chapter-meta">
              Bab {currentIdx + 1} dari {chapters.length}
            </div>
            <h1 className="read__chapter-title">{chapter.title}</h1>
            <div className="read__chapter-date" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span>{formatDate(chapter.updatedAt)}</span>
              {chapter.content && (() => {
                const words = chapter.content.replace(/<[^>]*>/g,'').trim().split(/\s+/).filter(Boolean).length;
                const mins = Math.max(1, Math.round(words / 200));
                return (
                  <>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📖 ~{words.toLocaleString()} kata
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ⏱ ~{mins} menit baca
                    </span>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Content */}
          <div
            className="read__content"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: chapter.content || '<p>Konten bab belum tersedia.</p>' }}
          />

          {/* Navigation */}
          <div className="read__nav">
            {prevChapter ? (
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/novel/${novelId}/chapter/${prevChapter.id}`)}
              >
                <ChevronLeft size={16} /> Bab Sebelumnya
              </button>
            ) : <div />}
            {nextChapter ? (
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/novel/${novelId}/chapter/${nextChapter.id}`)}
              >
                Bab Berikutnya <ChevronRight size={16} />
              </button>
            ) : (
              <Link to={`/novel/${novelId}`} className="btn btn-gold">
                <BookOpen size={16} /> Selesai Membaca
              </Link>
            )}
          </div>

          {/* Bottom credit */}
          <div className="read__credit">
            Dibaca di <strong>AttaNovel</strong> · Made by <strong>Atha</strong>
          </div>
        </main>

        {/* ===================== COMMENTS PANEL ===================== */}
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
                    userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={14} />
                    )
                  ) : (
                    '?'
                  )}
                </div>
                <input
                  type="text"
                  placeholder={user ? "Tulis komentar..." : "Login untuk berkomentar"}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="read__comment-input"
                  onClick={() => !user && onOpenAuth('login')}
                  readOnly={!user}
                />
                <button
                  type="submit"
                  className="read__comment-send"
                  disabled={sendingComment || !newComment.trim()}
                >
                  {sendingComment ? <div className="spinner" /> : <Send size={14} />}
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
                  <div key={comment.id} className="read__comment">
                    <div className="read__comment-header">
                      <div className="read__comment-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {comment.userAvatar ? (
                          <img src={comment.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={12} />
                        )}
                      </div>
                      <div className="read__comment-meta">
                        <strong>{comment.userName}</strong>
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                      {user && user.uid === comment.userId && (
                        <button
                          className="read__comment-delete"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="read__comment-text">{comment.text}</p>

                    {/* Replies */}
                    {comment.replies?.length > 0 && (
                      <div className="read__replies">
                        {comment.replies.map(r => (
                          <div key={r.id} className="read__reply">
                            <div className="read__comment-avatar sm" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {r.userAvatar ? (
                                <img src={r.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <User size={10} />
                              )}
                            </div>
                            <div>
                              <strong>{r.userName}</strong>
                              <p>{r.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply action */}
                    {replyingTo === comment.id ? (
                      <div className="read__reply-form">
                        <input
                          type="text"
                          placeholder="Tulis balasan..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          className="read__comment-input"
                          autoFocus
                        />
                        <div className="read__reply-actions">
                          <button className="btn btn-sm btn-primary" onClick={() => handleSendReply(comment.id)}>
                            Kirim
                          </button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setReplyingTo(null)}>
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="read__comment-reply-btn"
                        onClick={() => user ? setReplyingTo(comment.id) : onOpenAuth('login')}
                      >
                        <Reply size={12} /> Balas
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ===================== TABLE OF CONTENTS MODAL ===================== */}
      {showToc && (
        <div className="modal-overlay" onClick={() => setShowToc(false)}>
          <div className="modal read__toc-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowToc(false)}><X size={16} /></button>
            <h3 className="read__toc-title">
              <BookOpen size={18} />
              Daftar Bab — {novel?.title}
            </h3>
            <div className="read__toc-list">
              {chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  className={`read__toc-item ${ch.id === chapterId ? 'active' : ''}`}
                  onClick={() => {
                    navigate(`/novel/${novelId}/chapter/${ch.id}`);
                    setShowToc(false);
                  }}
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

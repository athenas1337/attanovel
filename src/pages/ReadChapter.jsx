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
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState(18);
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
        setNovel(n);
        setChapters(chs);
        const ch = chs.find(c => c.id === chapterId);
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
  }, [novelId, chapterId]);

  useEffect(() => {
    if (contentRef.current) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chapterId]);

  const currentIdx = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

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
    <div className={`read ${darkMode ? 'read--dark' : 'read--light'}`}>
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
        <div className="read__topbar-right">
          <button className="read__tool-btn" onClick={() => setFontSize(f => Math.max(14, f - 1))}>
            <Minus size={16} />
          </button>
          <span className="read__font-size">{fontSize}px</span>
          <button className="read__tool-btn" onClick={() => setFontSize(f => Math.min(24, f + 1))}>
            <Plus size={16} />
          </button>
          <button className="read__tool-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
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
              Bab {currentIdx + 1}
            </div>
            <h1 className="read__chapter-title">{chapter.title}</h1>
            <div className="read__chapter-date">
              {formatDate(chapter.updatedAt)}
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
                <div className="read__comment-avatar">
                  {user ? <User size={14} /> : '?'}
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
                      <div className="read__comment-avatar">
                        <User size={12} />
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
                            <div className="read__comment-avatar sm">
                              <User size={10} />
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

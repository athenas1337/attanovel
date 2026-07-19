// src/pages/Writer/NovelManager.jsx
// Halaman untuk mengelola bab-bab sebuah novel
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, ArrowUp, ArrowDown, Globe, Lock,
  BookOpen, ChevronLeft, Eye
} from 'lucide-react';
import { getNovel, updateNovel } from '../../firebase/novels';
import { getChapters, addChapter, deleteChapter, updateChapter } from '../../firebase/chapters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './NovelManager.css';

const NovelManager = () => {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const load = async () => {
      try {
        const [n, chs] = await Promise.all([
          getNovel(novelId),
          getChapters(novelId)
        ]);
        if (!n || n.authorId !== user.uid) {
          toast.error('Akses ditolak.');
          navigate('/writer/dashboard');
          return;
        }
        setNovel(n);
        setChapters(chs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [novelId, user]);

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) { toast.error('Judul bab harus diisi'); return; }
    setAddingChapter(true);
    try {
      const chapterId = await addChapter(novelId, {
        title: newChapterTitle.trim(),
        content: '',
        order: chapters.length + 1,
        status: 'draft',
      });
      const newCh = {
        id: chapterId,
        title: newChapterTitle.trim(),
        content: '',
        order: chapters.length + 1,
        status: 'draft',
      };
      setChapters(c => [...c, newCh]);
      setNewChapterTitle('');
      toast.success('Bab baru ditambahkan!');
      navigate(`/writer/novel/${novelId}/chapter/${chapterId}`);
    } catch (e) {
      toast.error('Gagal menambah bab.');
    } finally {
      setAddingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm('Hapus bab ini?')) return;
    try {
      await deleteChapter(novelId, chapterId);
      setChapters(c => c.filter(ch => ch.id !== chapterId));
      toast.success('Bab dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus bab.');
    }
  };

  const handleToggleChapterStatus = async (chapter) => {
    const newStatus = chapter.status === 'published' ? 'draft' : 'published';
    try {
      await updateChapter(novelId, chapter.id, { status: newStatus });
      setChapters(c => c.map(ch => ch.id === chapter.id ? { ...ch, status: newStatus } : ch));
      toast.success(newStatus === 'published' ? 'Bab diterbitkan!' : 'Bab disimpan sebagai draft.');
    } catch (e) {
      toast.error('Gagal mengubah status bab.');
    }
  };

  const handleToggleNovel = async () => {
    const newStatus = novel.status === 'published' ? 'draft' : 'published';
    try {
      await updateNovel(novelId, { status: newStatus });
      setNovel(n => ({ ...n, status: newStatus }));
      toast.success(newStatus === 'published' ? 'Novel diterbitkan ke publik! 🎉' : 'Novel disimpan sebagai draft.');
    } catch (e) {
      toast.error('Gagal mengubah status novel.');
    }
  };

  const handleMoveChapter = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === chapters.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newChapters = [...chapters];
    
    // Swap positions
    const temp = newChapters[index];
    newChapters[index] = newChapters[newIndex];
    newChapters[newIndex] = temp;

    // Set locally first
    setChapters(newChapters);

    try {
      await Promise.all(
        newChapters.map((ch, idx) =>
          updateChapter(novelId, ch.id, { order: idx + 1 })
        )
      );
      toast.success('Urutan bab disimpan! ↕️');
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan urutan bab.');
    }
  };

  if (loading) return (
    <div className="home__loading" style={{ minHeight: '80vh' }}>
      <div className="spinner spinner-lg" />
      <p>Memuat...</p>
    </div>
  );

  return (
    <div className="novel-manager">
      <div className="container">
        {/* Back button */}
        <Link to="/writer/dashboard" className="novel-manager__back">
          <ChevronLeft size={18} /> Kembali ke Dashboard
        </Link>

        {/* Novel Header */}
        <div className="novel-manager__header glass-card">
          <div className="novel-manager__cover">
            {novel?.cover
              ? <img src={novel.cover} alt={novel.title} />
              : <div className="novel-manager__cover-placeholder">📖</div>
            }
          </div>
          <div className="novel-manager__info">
            <div className="novel-manager__badges">
              <span className={`badge ${novel?.status === 'published' ? 'badge-green' : 'badge-gold'}`}>
                {novel?.status === 'published' ? <Globe size={11} /> : <Lock size={11} />}
                {novel?.status === 'published' ? 'Diterbitkan' : 'Draft'}
              </span>
              {novel?.genre && <span className="badge badge-primary">{novel.genre}</span>}
            </div>
            <h1>{novel?.title}</h1>
            <p className="novel-manager__desc">{novel?.description}</p>
            <div className="novel-manager__actions">
              <Link to={`/novel/${novelId}`} className="btn btn-outline btn-sm">
                <Eye size={14} /> Lihat Novel
              </Link>
              <button
                className={`btn btn-sm ${novel?.status === 'published' ? 'btn-ghost' : 'btn-primary'}`}
                onClick={handleToggleNovel}
              >
                {novel?.status === 'published'
                  ? <><Lock size={14} /> Jadikan Draft</>
                  : <><Globe size={14} /> Terbitkan Novel</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Add Chapter */}
        <form onSubmit={handleAddChapter} className="novel-manager__add-chapter glass-card">
          <h3><Plus size={18} /> Tambah Bab Baru</h3>
          <div className="novel-manager__add-chapter-form">
            <input
              type="text"
              placeholder="Judul bab baru..."
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              className="form-input"
            />
            <button type="submit" className="btn btn-primary" disabled={addingChapter}>
              {addingChapter ? <><div className="spinner" /> Menambah...</> : <><Plus size={16} /> Tambah & Edit</>}
            </button>
          </div>
        </form>

        {/* Chapters List */}
        <div className="novel-manager__chapters">
          <h3 className="novel-manager__chapter-title">
            <BookOpen size={18} /> Daftar Bab ({chapters.length})
          </h3>
          {chapters.length === 0 ? (
            <div className="novel-manager__empty">
              <p>Belum ada bab. Tambahkan bab pertama Anda!</p>
            </div>
          ) : (
            <div className="novel-manager__chapter-list">
              {chapters.map((ch, idx) => (
                <div key={ch.id} className="novel-manager__chapter-item glass-card">
                  <div className="novel-manager__chapter-num">{idx + 1}</div>
                  <div className="novel-manager__chapter-info">
                    <span className="novel-manager__chapter-name">{ch.title}</span>
                    <span className={`badge ${ch.status === 'published' ? 'badge-green' : 'badge-gold'}`}>
                      {ch.status === 'published' ? 'Diterbitkan' : 'Draft'}
                    </span>
                  </div>
                  <div className="novel-manager__chapter-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleMoveChapter(idx, 'up')}
                      disabled={idx === 0}
                      title="Pindahkan ke atas"
                      style={{ padding: '6px' }}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleMoveChapter(idx, 'down')}
                      disabled={idx === chapters.length - 1}
                      title="Pindahkan ke bawah"
                      style={{ padding: '6px' }}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      className={`btn btn-sm ${ch.status === 'published' ? 'btn-ghost' : 'btn-outline'}`}
                      onClick={() => handleToggleChapterStatus(ch)}
                      title={ch.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
                    >
                      {ch.status === 'published' ? <Lock size={13} /> : <Globe size={13} />}
                    </button>
                    <Link
                      to={`/writer/novel/${novelId}/chapter/${ch.id}`}
                      className="btn btn-outline btn-sm"
                      title="Edit bab"
                    >
                      <Edit size={13} /> Edit
                    </Link>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteChapter(ch.id)}
                      title="Hapus bab"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovelManager;

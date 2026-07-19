// src/pages/Writer/NovelManager.jsx
// Halaman untuk mengelola bab-bab sebuah novel
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, ArrowUp, ArrowDown, Globe, Lock,
  BookOpen, ChevronLeft, Eye, Tag, X
} from 'lucide-react';
import { getNovel, updateNovel } from '../../firebase/novels';
import { getChapters, addChapter, deleteChapter, updateChapter } from '../../firebase/chapters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './NovelManager.css';

const GENRES = [
  'Fantasy', 'Romance', 'Action', 'Adventure', 'Mystery', 
  'Wuxia', 'Xianxia', 'Sci-Fi', 'Urban', 'History', 
  'Horror', 'Comedy', 'Drama', 'Thriller', 'Isekai', 
  'Slice of Life', 'Game', 'Psychological', 'School Life',
  'Harem', 'Reverse Harem', 'Cultivation', 'Supernatural',
  'System', 'Mecha', 'Tragedy', 'Magic', 'Reincarnation',
  'Kingdom Building', 'Leveling', 'Overpowered', 'Dark Fantasy',
  'LitRPG', 'Xuanhuan', 'Josei', 'Seinen', 'Shounen'
];

const NovelManager = () => {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    genres: [],
    tags: [],
    writingStatus: 'Ongoing',
    coverUrl: '',
  });

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
        setEditForm({
          title: n.title || '',
          description: n.description || '',
          genres: n.genre ? n.genre.split(', ') : [],
          tags: n.tags || [],
          writingStatus: n.writingStatus || 'Ongoing',
          coverUrl: n.cover || '',
        });
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

  const handleEditFormChange = e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleEditToggleGenre = g => {
    setEditForm(f => {
      const exists = f.genres.includes(g);
      if (exists) {
        return { ...f, genres: f.genres.filter(x => x !== g) };
      } else {
        if (f.genres.length >= 3) {
          toast.error('Maksimal 3 genre');
          return f;
        }
        return { ...f, genres: [...f.genres, g] };
      }
    });
  };

  const handleEditAddTag = e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const val = e.target.value.trim();
      if (editForm.tags.length >= 10) { toast.error('Maksimal 10 tag'); return; }
      if (!editForm.tags.includes(val)) {
        setEditForm(f => ({ ...f, tags: [...f.tags, val] }));
      }
      e.target.value = '';
    }
  };

  const handleEditRemoveTag = t => {
    setEditForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) { toast.error('Judul novel harus diisi'); return; }
    if (editForm.genres.length === 0) { toast.error('Pilih minimal 1 genre'); return; }
    try {
      const updatedData = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        genre: editForm.genres.join(', '),
        tags: editForm.tags,
        writingStatus: editForm.writingStatus,
        cover: editForm.coverUrl.trim(),
      };
      await updateNovel(novelId, updatedData);
      setNovel(prev => ({
        ...prev,
        ...updatedData
      }));
      setIsEditingDetails(false);
      toast.success('Detail novel berhasil diperbarui! 📝');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui detail novel.');
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

        {/* Novel Header / Edit Details Form */}
        {isEditingDetails ? (
          <form onSubmit={handleSaveDetails} className="novel-manager__header glass-card" style={{ flexDirection: 'column', gap: '20px', alignItems: 'stretch' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-gold)', marginBottom: '10px' }}>📝 Edit Detail Novel</h2>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Judul Novel *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={editForm.title}
                onChange={handleEditFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Sinopsis / Deskripsi *</label>
              <textarea
                name="description"
                className="form-input form-textarea"
                value={editForm.description}
                onChange={handleEditFormChange}
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Status Karya *</label>
              <select
                name="writingStatus"
                value={editForm.writingStatus}
                onChange={handleEditFormChange}
                className="form-input form-select"
                style={{ width: '100%' }}
              >
                <option value="Ongoing">✍️ Ongoing (Sedang Berjalan)</option>
                <option value="Completed">✅ Tamat (Completed)</option>
                <option value="Hiatus">💤 Hiatus (Ditangguhkan)</option>
                <option value="Dropped">❌ Dropped (Dibatalkan)</option>
                <option value="Planning">📅 Rencana (Planning)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>URL Gambar Sampul (Cover URL)</label>
              <input
                type="text"
                name="coverUrl"
                className="form-input"
                value={editForm.coverUrl}
                onChange={handleEditFormChange}
                placeholder="https://contoh.com/sampul.jpg"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Genre * (Pilih 1 sampai 3 genre)</label>
              <div className="create-novel__genre-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {GENRES.map(g => {
                  const isSelected = editForm.genres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      className={`create-novel__genre-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => handleEditToggleGenre(g)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--color-gold)' : 'rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? 'var(--color-gold)' : 'var(--color-text-muted)',
                        borderRadius: '20px',
                        cursor: 'pointer'
                      }}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}><Tag size={13} /> Tag (tekan Enter untuk menambah)</label>
              <div className="create-novel__tags-input" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                {editForm.tags.map(t => (
                  <span key={t} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t}
                    <button type="button" onClick={() => handleEditRemoveTag(t)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Tambah tag..."
                  onKeyDown={handleEditAddTag}
                  className="create-novel__tag-input"
                  style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditingDetails(false)}>
                Batal
              </button>
              <button type="submit" className="btn btn-gold btn-sm">
                Simpan Perubahan
              </button>
            </div>
          </form>
        ) : (
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
                {novel?.writingStatus && (
                  <span className="badge badge-violet">
                    {novel.writingStatus === 'Completed' && '✅ Tamat'}
                    {novel.writingStatus === 'Hiatus' && '💤 Hiatus'}
                    {novel.writingStatus === 'Dropped' && '❌ Dropped'}
                    {novel.writingStatus === 'Planning' && '📅 Rencana'}
                    {novel.writingStatus === 'Ongoing' && '✍️ Ongoing'}
                  </span>
                )}
                {novel?.genre && <span className="badge badge-primary">{novel.genre}</span>}
              </div>
              <h1>{novel?.title}</h1>
              <p className="novel-manager__desc">{novel?.description}</p>
              <div className="novel-manager__actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link to={`/novel/${novelId}`} className="btn btn-outline btn-sm">
                  <Eye size={14} /> Lihat Novel
                </Link>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsEditingDetails(true)}
                >
                  <Edit size={14} /> Edit Detail Novel
                </button>
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
        )}

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

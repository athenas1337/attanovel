// src/pages/Writer/CreateNovel.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Crown, BookOpen, Tag } from 'lucide-react';
import { createNovel, uploadCover } from '../../firebase/novels';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './CreateNovel.css';

const GENRES = [
  'Fantasy', 'Romance', 'Action', 'Adventure', 'Mystery', 
  'Wuxia', 'Xianxia', 'Sci-Fi', 'Urban', 'History', 
  'Horror', 'Comedy', 'Drama', 'Thriller', 'Isekai', 
  'Slice of Life', 'Game', 'Psychological', 'School Life'
];

const CreateNovel = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    genres: [],
    tags: [],
    status: 'draft',
  });
  const coverInputRef = useRef(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleToggleGenre = (g) => {
    setForm(f => {
      const isSelected = f.genres.includes(g);
      if (isSelected) {
        return { ...f, genres: f.genres.filter(item => item !== g) };
      } else {
        if (f.genres.length >= 3) {
          toast.error('Maksimal pilih 3 genre');
          return f;
        }
        return { ...f, genres: [...f.genres, g] };
      }
    });
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (form.tags.length >= 10) { toast.error('Maksimal 10 tag'); return; }
      if (!form.tags.includes(tagInput.trim())) {
        setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Judul novel harus diisi'); return; }
    if (form.genres.length === 0) { toast.error('Genre harus dipilih (minimal 1)'); return; }
    setLoading(true);
    try {
      const { genres, ...submitForm } = form;
      // Create novel first to get ID
      const novelId = await createNovel({
        ...submitForm,
        genre: genres.join(', '),
        authorName: userProfile?.displayName || user.displayName || 'Anonim',
        cover: '',
      }, user.uid);

      // Upload cover if exists
      if (coverFile) {
        const coverUrl = await uploadCover(coverFile, novelId);
        const { updateNovel } = await import('../../firebase/novels');
        await updateNovel(novelId, { cover: coverUrl });
      }

      toast.success('Novel berhasil dibuat! 🎉');
      navigate(`/writer/novel/${novelId}`);
    } catch (e) {
      console.error(e);
      toast.error('Gagal membuat novel. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-novel">
      <div className="container">
        <div className="create-novel__header">
          <div className="create-novel__icon">
            <Crown size={24} />
          </div>
          <div>
            <h1>Buat Novel Baru</h1>
            <p>Isi informasi dasar novel Anda</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-novel__form">
          <div className="create-novel__layout">
            {/* Cover Upload */}
            <div className="create-novel__cover-section">
              <div
                className={`create-novel__cover-upload ${coverPreview ? 'has-cover' : ''}`}
                onClick={() => coverInputRef.current.click()}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Preview sampul" />
                    <div className="create-novel__cover-overlay">
                      <Upload size={24} />
                      <span>Ganti Sampul</span>
                    </div>
                  </>
                ) : (
                  <div className="create-novel__cover-placeholder">
                    <Upload size={32} />
                    <span>Upload Sampul</span>
                    <small>JPG, PNG · Maks 5MB</small>
                    <small>Rasio ideal: 2:3</small>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                style={{ display: 'none' }}
              />
              {coverPreview && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <X size={14} /> Hapus Sampul
                </button>
              )}
            </div>

            {/* Form Fields */}
            <div className="create-novel__fields">
              <div className="form-group">
                <label className="form-label">Judul Novel *</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  placeholder="Masukkan judul novel..."
                  value={form.title}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sinopsis / Deskripsi *</label>
                <textarea
                  name="description"
                  className="form-input form-textarea"
                  placeholder="Ceritakan secara singkat tentang novel Anda..."
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={2000}
                />
                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {form.description.length}/2000
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Genre * (Pilih 1 sampai 3 genre)</label>
                <div className="create-novel__genre-grid">
                  {GENRES.map(g => {
                    const isSelected = form.genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        className={`create-novel__genre-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleGenre(g)}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Tag size={13} /> Tag (tekan Enter untuk menambah)
                </label>
                <div className="create-novel__tags-input">
                  {form.tags.map(t => (
                    <span key={t} className="create-novel__tag badge badge-primary">
                      {t}
                      <button type="button" onClick={() => handleRemoveTag(t)}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Tambah tag..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="create-novel__tag-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status Awal</label>
                <div className="create-novel__status-opts">
                  {[
                    { val: 'draft', label: '📝 Draft', desc: 'Hanya Anda yang bisa melihat' },
                    { val: 'published', label: '🌍 Terbitkan', desc: 'Dapat dilihat semua orang' },
                  ].map(s => (
                    <label key={s.val} className={`create-novel__status-opt ${form.status === s.val ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="status"
                        value={s.val}
                        checked={form.status === s.val}
                        onChange={handleChange}
                      />
                      <span>{s.label}</span>
                      <small>{s.desc}</small>
                    </label>
                  ))}
                </div>
              </div>

              <div className="create-novel__submit-row">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate('/writer/dashboard')}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-gold btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner" /> Membuat...</> : <><BookOpen size={18} /> Buat Novel</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNovel;

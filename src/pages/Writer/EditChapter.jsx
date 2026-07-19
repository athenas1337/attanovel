// src/pages/Writer/EditChapter.jsx
// Editor bab dengan rich text editor menggunakan contentEditable + custom toolbar
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save, ChevronLeft, Image, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, List, Heading2,
  Globe, Lock, Check, Loader
} from 'lucide-react';
import { getChapters, updateChapter, uploadChapterImage } from '../../firebase/chapters';
import { getNovel } from '../../firebase/novels';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './EditChapter.css';

const EditChapter = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState('draft');
  const [stats, setStats] = useState({ words: 0, chars: 0, readTime: 0 });
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const autoSaveTimer = useRef(null);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const cleanText = text.trim();
    const words = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
    const chars = text.length;
    const readTime = Math.ceil(words / 200); // 200 words/minute
    setStats({ words, chars, readTime });
  };

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
        const ch = chs.find(c => c.id === chapterId);
        if (ch) {
          setChapter(ch);
          setTitle(ch.title || '');
          setStatus(ch.status || 'draft');
          if (editorRef.current) {
            editorRef.current.innerHTML = ch.content || '';
          }
        }
      } catch (e) {
        console.error(e);
        toast.error('Gagal memuat bab.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [novelId, chapterId, user]);

  // Set content after loading
  useEffect(() => {
    if (!loading && chapter && editorRef.current) {
      editorRef.current.innerHTML = chapter.content || '';
      updateStats();
    }
  }, [loading, chapter]);

  const handleSave = useCallback(async (autoSave = false) => {
    if (!editorRef.current) return;
    setSaving(true);
    try {
      const content = editorRef.current.innerHTML;
      await updateChapter(novelId, chapterId, {
        title,
        content,
        status,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (!autoSave) toast.success('Bab berhasil disimpan! ✅');
    } catch (e) {
      toast.error('Gagal menyimpan bab.');
    } finally {
      setSaving(false);
    }
  }, [novelId, chapterId, title, status]);

  // Auto save every 30 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (!loading) handleSave(true);
    }, 30000);
    return () => clearInterval(autoSaveTimer.current);
  }, [handleSave, loading]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSave]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleImageInsert = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB');
      return;
    }
    const loadingToast = toast.loading('Mengupload gambar...');
    try {
      const url = await uploadChapterImage(file, novelId, chapterId);
      const img = `<figure style="text-align:center;margin:2em 0;"><img src="${url}" alt="Gambar cerita" style="max-width:100%;border-radius:8px;"/><figcaption style="color:#7c6fa0;font-size:0.85em;margin-top:0.5em;">${file.name}</figcaption></figure>`;
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, img);
      toast.dismiss(loadingToast);
      toast.success('Gambar berhasil dimasukkan!');
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error('Gagal mengupload gambar (Upgrade Firebase Storage diperlukan).');
    }
    e.target.value = '';
  };

  const handleImageUrlInsert = () => {
    const url = window.prompt("Masukkan URL Gambar (Contoh: https://link-gambar.com/gambar.jpg):");
    if (!url) return;
    const img = `<figure style="text-align:center;margin:2em 0;"><img src="${url}" alt="Gambar cerita" style="max-width:100%;border-radius:8px;"/><figcaption style="color:#7c6fa0;font-size:0.85em;margin-top:0.5em;">Gambar Cerita</figcaption></figure>`;
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, img);
    toast.success('Gambar berhasil dimasukkan!');
  };

  if (loading) return (
    <div className="home__loading" style={{ minHeight: '100vh' }}>
      <div className="spinner spinner-lg" />
      <p>Memuat editor...</p>
    </div>
  );

  return (
    <div className="edit-chapter">
      {/* Top Bar */}
      <div className="edit-chapter__topbar">
        <div className="edit-chapter__topbar-left">
          <Link to={`/writer/novel/${novelId}`} className="edit-chapter__back">
            <ChevronLeft size={18} />
          </Link>
          <div className="edit-chapter__novel-name">{novel?.title}</div>
        </div>

        <div className="edit-chapter__topbar-center">
          <input
            type="text"
            className="edit-chapter__title-input"
            placeholder="Judul Bab..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="edit-chapter__topbar-right">
          {/* Auto save indicator */}
          {saved && (
            <div className="edit-chapter__saved">
              <Check size={14} /> Tersimpan
            </div>
          )}

          {/* Status toggle */}
          <button
            className={`btn btn-sm ${status === 'published' ? 'btn-ghost' : 'btn-outline'}`}
            onClick={() => setStatus(s => s === 'published' ? 'draft' : 'published')}
          >
            {status === 'published' ? <><Globe size={13} /> Diterbitkan</> : <><Lock size={13} /> Draft</>}
          </button>

          {/* Save button */}
          <button className="btn btn-gold btn-sm" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <><Loader size={14} className="spin" /> Menyimpan...</> : <><Save size={14} /> Simpan</>}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="edit-chapter__toolbar">
        <div className="edit-chapter__toolbar-group">
          <button className="edit-chapter__tool" onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
            <Bold size={15} />
          </button>
          <button className="edit-chapter__tool" onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
            <Italic size={15} />
          </button>
          <button className="edit-chapter__tool" onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
            <Underline size={15} />
          </button>
        </div>
        <div className="edit-chapter__toolbar-sep" />
        <div className="edit-chapter__toolbar-group">
          <button className="edit-chapter__tool" onClick={() => execCommand('formatBlock', 'h2')} title="Judul">
            <Heading2 size={15} />
          </button>
          <button className="edit-chapter__tool" onClick={() => execCommand('insertUnorderedList')} title="List">
            <List size={15} />
          </button>
        </div>
        <div className="edit-chapter__toolbar-sep" />
        <div className="edit-chapter__toolbar-group">
          <button className="edit-chapter__tool" onClick={() => execCommand('justifyLeft')} title="Rata Kiri">
            <AlignLeft size={15} />
          </button>
          <button className="edit-chapter__tool" onClick={() => execCommand('justifyCenter')} title="Rata Tengah">
            <AlignCenter size={15} />
          </button>
          <button className="edit-chapter__tool" onClick={() => execCommand('justifyRight')} title="Rata Kanan">
            <AlignRight size={15} />
          </button>
        </div>
        <div className="edit-chapter__toolbar-sep" />
        <div className="edit-chapter__toolbar-group">
          <select
            className="edit-chapter__font-size"
            onChange={e => execCommand('fontSize', e.target.value)}
            defaultValue="3"
          >
            <option value="2">Kecil</option>
            <option value="3">Normal</option>
            <option value="4">Besar</option>
            <option value="5">Lebih Besar</option>
          </select>
        </div>
        <div className="edit-chapter__toolbar-sep" />
        <div className="edit-chapter__toolbar-group">
          <button
            className="edit-chapter__tool edit-chapter__tool--image"
            onClick={() => imageInputRef.current?.click()}
            title="Sisipkan File Gambar"
          >
            <Image size={15} /> Sisipkan File
          </button>
          <button
            className="edit-chapter__tool edit-chapter__tool--image"
            onClick={handleImageUrlInsert}
            title="Sisipkan URL Gambar (Gratis)"
            style={{ marginLeft: '4px', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-gold)' }}
          >
            <Image size={15} /> Sisipkan URL Gambar
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageInsert}
            style={{ display: 'none' }}
          />
        </div>
        <div className="edit-chapter__shortcut">Ctrl+S untuk simpan · Auto-save setiap 30 detik</div>
      </div>

      {/* Editor */}
      <div className="edit-chapter__body">
        <div
          ref={editorRef}
          className="edit-chapter__editor"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          data-placeholder="Mulai menulis cerita Anda di sini..."
          onInput={updateStats}
        />
      </div>

      {/* Footer */}
      <div className="edit-chapter__footer">
        <span>AttaNovel Editor · Made by <strong>Atha</strong></span>
        <span className="edit-chapter__stats" style={{ color: 'var(--color-gold)', display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
          <span>📝 <strong>{stats.words}</strong> kata</span>
          <span>🔤 <strong>{stats.chars}</strong> karakter</span>
          <span>⏱️ Est. <strong>{stats.readTime}</strong> mnt baca</span>
        </span>
        <span>Ctrl+S untuk simpan cepat</span>
      </div>
    </div>
  );
};

export default EditChapter;

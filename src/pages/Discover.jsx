// src/pages/Discover.jsx — Fixed: search only on submit, added search button, proper empty state
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Eye, Heart, BookOpen, Filter, SlidersHorizontal } from 'lucide-react';
import { getPublishedNovels, searchNovels } from '../firebase/novels';
import './Discover.css';

const GENRES = [
  'Fantasy', 'Romance', 'Action', 'Adventure', 'Mystery',
  'Wuxia', 'Xianxia', 'Sci-Fi', 'Urban', 'History',
  'Horror', 'Comedy', 'Drama', 'Thriller', 'Isekai',
  'Slice of Life', 'Game', 'Psychological', 'School Life',
  'Harem', 'Reverse Harem', 'Cultivation', 'Supernatural',
  'System', 'Mecha', 'Tragedy', 'Magic', 'Reincarnation',
  'Kingdom Building', 'Leveling', 'Overpowered', 'Dark Fantasy',
  'LitRPG', 'Xuanhuan', 'Josei', 'Seinen', 'Shounen',
];

const SORT_OPTIONS = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terpopuler (Likes)', value: 'popular' },
  { label: 'Terbanyak Dibaca', value: 'views' },
];

const WRITING_STATUS_OPTIONS = ['Semua', 'Ongoing', 'Completed', 'Hiatus', 'Dropped'];

const Discover = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Separate "input value" from "active search query"
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [activeQuery, setActiveQuery] = useState(searchParams.get('q') || '');

  const [selectedGenres, setSelectedGenres] = useState(
    searchParams.get('genre') ? [searchParams.get('genre')] : []
  );
  const [writingStatus, setWritingStatus] = useState('Semua');
  const [sort, setSort] = useState('newest');
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(!!searchParams.get('q'));

  // Load novels based on activeQuery (not inputVal — avoids triggering on every keystroke)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let data;
        if (activeQuery.trim()) {
          data = await searchNovels(activeQuery.trim());
        } else {
          data = await getPublishedNovels(60);
        }
        setNovels(data);
      } catch (e) {
        console.error(e);
        setNovels([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeQuery]);

  // Sync from URL params when landing via navbar search
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const genre = searchParams.get('genre') || '';
    if (q !== activeQuery) {
      setInputVal(q);
      setActiveQuery(q);
      setHasSearched(!!q);
    }
    if (genre && !selectedGenres.includes(genre)) {
      setSelectedGenres([genre]);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = inputVal.trim();
    setActiveQuery(trimmed);
    setHasSearched(true);
    // Update URL params without navigating
    const params = {};
    if (trimmed) params.q = trimmed;
    setSearchParams(params, { replace: true });
  };

  const handleClearSearch = () => {
    setInputVal('');
    setActiveQuery('');
    setHasSearched(false);
    setSearchParams({}, { replace: true });
  };

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleResetFilters = () => {
    setInputVal('');
    setActiveQuery('');
    setSelectedGenres([]);
    setWritingStatus('Semua');
    setSort('newest');
    setHasSearched(false);
    setSearchParams({}, { replace: true });
  };

  // Client-side filter + sort on top of fetched novels
  const filtered = novels
    .filter(n => {
      if (selectedGenres.length === 0) return true;
      const novelGenres = (n.genre || '').toLowerCase().split(',').map(g => g.trim());
      return selectedGenres.some(sg => novelGenres.some(ng => ng.includes(sg.toLowerCase())));
    })
    .filter(n => {
      if (writingStatus === 'Semua') return true;
      const ws = (n.writingStatus || 'Ongoing').toLowerCase();
      return ws === writingStatus.toLowerCase();
    })
    .sort((a, b) => {
      if (sort === 'popular') return (b.likes || 0) - (a.likes || 0);
      if (sort === 'views') return (b.views || 0) - (a.views || 0);
      // newest: sort by createdAt desc
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

  const writingStatusConfig = {
    'Completed': { label: 'Tamat', bg: 'rgba(16,185,129,0.88)', color: '#fff' },
    'Ongoing': { label: 'Ongoing', bg: 'rgba(109,40,217,0.88)', color: '#fff' },
    'Hiatus': { label: 'Hiatus', bg: 'rgba(245,158,11,0.88)', color: '#fff' },
    'Dropped': { label: 'Dropped', bg: 'rgba(239,68,68,0.88)', color: '#fff' },
    'Planning': { label: 'Rencana', bg: 'rgba(99,102,241,0.88)', color: '#fff' },
  };

  return (
    <div className="discover">
      <div className="container">
        {/* Header */}
        <div className="discover__header">
          <h1 className="discover__title">
            Jelajahi <span className="text-gradient">Novel</span>
          </h1>
          <p className="discover__subtitle">
            Temukan ribuan cerita menakjubkan dari penulis berbakat
          </p>
        </div>

        {/* Search & Filter Panel */}
        <div className="discover__controls-panel glass-card" style={{ padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Search Row */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="discover__search-wrap" style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={18} className="discover__search-icon" />
              <input
                type="text"
                placeholder="Cari judul novel, penulis, atau genre..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
                className="discover__search-input"
                style={{ paddingRight: inputVal ? '36px' : undefined }}
              />
              {inputVal && (
                <button type="button" onClick={handleClearSearch} style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Search Button */}
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', flexShrink: 0 }}>
              <Search size={16} /> Cari
            </button>
          </form>

          {/* Filters Row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Writing Status */}
            <select
              value={writingStatus}
              onChange={e => setWritingStatus(e.target.value)}
              className="form-input form-select discover__sort"
              style={{ minWidth: '140px' }}
            >
              {WRITING_STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s === 'Semua' ? '🔍 Semua Status'
                   : s === 'Ongoing' ? '✍️ Ongoing'
                   : s === 'Completed' ? '✅ Tamat'
                   : s === 'Hiatus' ? '💤 Hiatus'
                   : '❌ Dropped'}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="form-input form-select discover__sort"
              style={{ minWidth: '140px' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button onClick={handleResetFilters} className="btn btn-outline btn-sm" style={{ padding: '9px 14px', fontSize: '0.82rem' }}>
              <X size={13} /> Reset
            </button>

            {(selectedGenres.length > 0 || writingStatus !== 'Semua' || activeQuery) && (
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {filtered.length} hasil ditemukan
              </span>
            )}
          </div>

          {/* Genre Chips */}
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '10px', fontWeight: '600' }}>
              <Filter size={13} /> Filter Genre
            </span>
            <div className="discover__genres" style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {GENRES.map(g => {
                const isActive = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGenreToggle(g)}
                    style={{
                      padding: '5px 12px', fontSize: '0.78rem', borderRadius: '20px',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.08)',
                      background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? 'var(--color-gold)' : 'var(--color-text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontWeight: isActive ? '600' : '400',
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active search indicator */}
        {activeQuery && !loading && (
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              Hasil pencarian untuk: <strong style={{ color: 'var(--color-text)' }}>"{activeQuery}"</strong>
            </span>
            <button onClick={handleClearSearch} style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '20px',
              color: 'var(--color-text-muted)', cursor: 'pointer', padding: '3px 10px',
              fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <X size={11} /> Hapus
            </button>
          </div>
        )}

        {/* Novel Grid */}
        {loading ? (
          <div className="home__loading">
            <div className="spinner spinner-lg" />
            <p>Memuat novel...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="discover__grid">
            {filtered.map(novel => {
              const ws = novel.writingStatus || 'Ongoing';
              const sc = writingStatusConfig[ws] || writingStatusConfig['Ongoing'];
              return (
                <div
                  key={novel.id}
                  className="novel-card"
                  onClick={() => navigate(`/novel/${novel.id}`)}
                >
                  <div style={{ position: 'relative' }}>
                    {novel.cover
                      ? <img src={novel.cover} alt={novel.title} className="novel-card__cover" />
                      : <div className="novel-card__cover-placeholder"><span>📖</span></div>
                    }
                    <div style={{
                      position: 'absolute', top: '8px', left: '8px',
                      background: sc.bg, color: sc.color,
                      fontSize: '0.62rem', fontWeight: '700', padding: '3px 8px',
                      borderRadius: '20px', backdropFilter: 'blur(4px)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}>
                      {sc.label}
                    </div>
                  </div>
                  <div className="novel-card__body">
                    <h3 className="novel-card__title">{novel.title}</h3>
                    <p className="novel-card__author">oleh {novel.authorName || 'Anonim'}</p>
                    <div className="novel-card__stats">
                      <span><Eye size={11} /> {(novel.views || 0).toLocaleString()}</span>
                      <span><Heart size={11} /> {(novel.likes || 0).toLocaleString()}</span>
                    </div>
                    {novel.genre && (
                      <div style={{ marginTop: 6 }}>
                        <span className="badge badge-primary">{novel.genre.split(',')[0].trim()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="home__empty">
            <span>🔍</span>
            <h3>
              {activeQuery ? `Tidak ada novel untuk "${activeQuery}"` : 'Belum Ada Novel'}
            </h3>
            <p>
              {activeQuery
                ? 'Coba kata kunci yang berbeda atau hapus filter genre.'
                : 'Jadilah yang pertama menerbitkan novel di AttaNovel!'
              }
            </p>
            {activeQuery && (
              <button className="btn btn-outline" onClick={handleClearSearch} style={{ marginTop: 8 }}>
                Lihat Semua Novel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;

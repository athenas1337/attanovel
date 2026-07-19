// src/pages/Discover.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Heart, BookOpen } from 'lucide-react';
import { getPublishedNovels, searchNovels } from '../firebase/novels';
import './Discover.css';

const GENRES = [
  'Fantasy', 'Romance', 'Action', 'Adventure', 'Mystery', 
  'Wuxia', 'Xianxia', 'Sci-Fi', 'Urban', 'History', 
  'Horror', 'Comedy', 'Drama', 'Thriller', 'Isekai', 
  'Slice of Life', 'Game', 'Psychological', 'School Life',
  'Harem', 'Reverse Harem', 'Cultivation', 'Supernatural',
  'System', 'Mecha', 'Tragedy', 'Magic', 'Reincarnation',
  'Kingdom Building', 'Leveling', 'Overpowered', 'Dark Fantasy'
];

const SORT_OPTIONS = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terpopuler (Likes)', value: 'popular' },
  { label: 'Terbanyak Dibaca (Views)', value: 'views' },
];

const Discover = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState(searchParams.get('q') || '');
  const [selectedGenres, setSelectedGenres] = useState(
    searchParams.get('genre') ? [searchParams.get('genre')] : []
  );
  const [statusFilter, setStatusFilter] = useState('Semua'); // 'Semua' | 'Ongoing' | 'Completed'
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let data;
        if (searchVal) {
          data = await searchNovels(searchVal);
        } else {
          data = await getPublishedNovels(50);
        }
        setNovels(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchVal]);

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleResetFilters = () => {
    setSelectedGenres([]);
    setStatusFilter('Semua');
    setSearchVal('');
    setSort('newest');
  };

  const filtered = novels
    .filter(n => {
      if (selectedGenres.length === 0) return true;
      const novelGenres = n.genre?.toLowerCase().split(',').map(g => g.trim()) || [];
      return selectedGenres.some(sg => novelGenres.includes(sg.toLowerCase()));
    })
    .filter(n => {
      if (statusFilter === 'Semua') return true;
      return n.status?.toLowerCase() === statusFilter.toLowerCase();
    })
    .sort((a, b) => {
      if (sort === 'popular') return (b.likes || 0) - (a.likes || 0);
      if (sort === 'views') return (b.views || 0) - (a.views || 0);
      return 0;
    });

  return (
    <div className="discover">
      <div className="container">
        {/* Header */}
        <div className="discover__header">
          <h1 className="discover__title">
            Jelajahi <span className="text-gradient">Novel</span>
          </h1>
          <p className="discover__subtitle">Temukan ribuan cerita menakjubkan dari penulis berbakat</p>
        </div>

        {/* Search & Filter Panel */}
        <div className="discover__controls-panel glass-card" style={{ padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="discover__controls" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div className="discover__search-wrap" style={{ flex: 1, minWidth: '250px' }}>
              <Search size={18} className="discover__search-icon" />
              <input
                type="text"
                placeholder="Cari judul novel, penulis, atau genre..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                className="discover__search-input"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input form-select discover__sort"
              style={{ minWidth: '150px' }}
            >
              <option value="Semua">🔍 Semua Status</option>
              <option value="Ongoing">✍️ Ongoing</option>
              <option value="Completed">✅ Tamat</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="form-input form-select discover__sort"
              style={{ minWidth: '150px' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button
              onClick={handleResetFilters}
              className="btn btn-outline"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              Reset
            </button>
          </div>

          {/* Genre Chips Multi-Select */}
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              FILTER GENRE (PILIH MULTI-GENRE):
            </span>
            <div className="discover__genres" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {GENRES.map(g => {
                const isActive = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    className={`home__genre-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleGenreToggle(g)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.08)',
                      background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? 'var(--color-gold)' : 'var(--color-text-muted)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results info */}
        {!loading && (
          <p className="discover__count">
            Menampilkan <strong>{filtered.length}</strong> novel
            {selectedGenres.length > 0 && ` dalam genre ${selectedGenres.join(', ')}`}
            {searchVal && ` untuk "${searchVal}"`}
          </p>
        )}

        {/* Novel Grid */}
        {loading ? (
          <div className="home__loading">
            <div className="spinner spinner-lg" />
            <p>Memuat novel...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="discover__grid">
            {filtered.map(novel => (
              <div
                key={novel.id}
                className="novel-card"
                onClick={() => navigate(`/novel/${novel.id}`)}
              >
                {novel.cover
                  ? <img src={novel.cover} alt={novel.title} className="novel-card__cover" />
                  : <div className="novel-card__cover-placeholder"><span>📖</span></div>
                }
                <div className="novel-card__body">
                  <h3 className="novel-card__title">{novel.title}</h3>
                  <p className="novel-card__author">oleh {novel.authorName || 'Anonim'}</p>
                  <div className="novel-card__stats">
                    <span><Eye size={11} /> {(novel.views || 0).toLocaleString()}</span>
                    <span><Heart size={11} /> {(novel.likes || 0).toLocaleString()}</span>
                  </div>
                  {novel.genre && (
                    <div style={{ marginTop: 6 }}>
                      <span className="badge badge-primary">{novel.genre}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="home__empty">
            <span>🔍</span>
            <h3>Tidak Ada Hasil</h3>
            <p>Coba kata kunci atau genre yang berbeda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;

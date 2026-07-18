// src/pages/Discover.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Heart, BookOpen } from 'lucide-react';
import { getPublishedNovels, searchNovels } from '../firebase/novels';
import './Discover.css';

const GENRES = ['Semua', 'Fantasy', 'Romance', 'Action', 'Mystery', 'Horror', 'Sci-Fi', 'Drama', 'Comedy', 'Thriller'];
const SORT_OPTIONS = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terpopuler', value: 'popular' },
  { label: 'Terbanyak Dibaca', value: 'views' },
];

const Discover = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState(searchParams.get('q') || '');
  const [activeGenre, setActiveGenre] = useState(searchParams.get('genre') || 'Semua');
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

  const filtered = novels
    .filter(n => activeGenre === 'Semua' || n.genre?.toLowerCase().split(', ').map(g => g.trim()).includes(activeGenre.toLowerCase()))
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

        {/* Search & Filter */}
        <div className="discover__controls">
          <div className="discover__search-wrap">
            <Search size={18} className="discover__search-icon" />
            <input
              type="text"
              placeholder="Cari judul novel, penulis, atau genre..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="discover__search-input"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="form-input form-select discover__sort"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Genre Filter */}
        <div className="discover__genres">
          {GENRES.map(g => (
            <button
              key={g}
              className={`home__genre-btn ${activeGenre === g ? 'active' : ''}`}
              onClick={() => setActiveGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Results info */}
        {!loading && (
          <p className="discover__count">
            Menampilkan <strong>{filtered.length}</strong> novel
            {activeGenre !== 'Semua' && ` dalam genre ${activeGenre}`}
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

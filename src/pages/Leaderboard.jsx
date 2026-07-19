// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Eye, Heart, Bookmark, Crown } from 'lucide-react';
import { getLeaderboardNovels } from '../firebase/novels';
import { useLanguage } from '../context/LanguageContext';
import './Leaderboard.css';

const Leaderboard = () => {
  const { lang, t } = useLanguage();
  const [novels, setNovels] = useState([]);
  const [tab, setTab] = useState('views'); // 'views' | 'likes' | 'bookmarks'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboardNovels(tab, 20);
        setNovels(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  return (
    <div className="leaderboard">
      <div className="container">
        {/* Header */}
        <div className="leaderboard__header text-center">
          <div className="leaderboard__trophy">
            <Trophy size={36} className="text-gradient" />
          </div>
          <h1>{t('leaderboard')}</h1>
          <p>Novel-novel terbaik yang menduduki peringkat teratas saat ini</p>
        </div>

        {/* Tab Controls */}
        <div className="leaderboard__tabs glass-card">
          <button
            className={`leaderboard__tab ${tab === 'views' ? 'active' : ''}`}
            onClick={() => setTab('views')}
          >
            👁️ Paling Populer (Views)
          </button>
          <button
            className={`leaderboard__tab ${tab === 'likes' ? 'active' : ''}`}
            onClick={() => setTab('likes')}
          >
            ❤️ Paling Disukai (Likes)
          </button>
          <button
            className={`leaderboard__tab ${tab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setTab('bookmarks')}
          >
            🔖 Ter-bookmark (Bookmarks)
          </button>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="home__loading">
            <div className="spinner spinner-lg" />
            <p>Memuat peringkat...</p>
          </div>
        ) : novels.length === 0 ? (
          <div className="leaderboard__empty glass-card">
            <span>🏆</span>
            <h3>Belum Ada Peringkat</h3>
            <p>Belum ada data novel yang mencukupi untuk membuat peringkat.</p>
          </div>
        ) : (
          <div className="leaderboard__list">
            {novels.map((novel, index) => {
              const rank = index + 1;
              let rankClass = '';
              if (rank === 1) rankClass = 'rank-1';
              else if (rank === 2) rankClass = 'rank-2';
              else if (rank === 3) rankClass = 'rank-3';

              return (
                <Link key={novel.id} to={`/novel/${novel.id}`} className={`leaderboard__item glass-card ${rankClass} animate-fadeIn`}>
                  {/* Rank Badge */}
                  <div className="leaderboard__rank-badge">
                    {rank <= 3 ? <Crown size={18} /> : rank}
                  </div>

                  {/* Cover */}
                  <div className="leaderboard__cover-container">
                    {novel.cover ? (
                      <img src={novel.cover} alt={novel.title} className="leaderboard__cover" />
                    ) : (
                      <div className="leaderboard__cover-placeholder">📖</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="leaderboard__info">
                    <h3 className="leaderboard__novel-title">{novel.title}</h3>
                    <p className="leaderboard__novel-author">Oleh {novel.authorName}</p>
                    <span className="badge badge-primary">{novel.genre?.split(', ')[0]}</span>
                  </div>

                  {/* Stats */}
                  <div className="leaderboard__stats">
                    {tab === 'views' && (
                      <span className="leaderboard__stat-val">
                        <Eye size={14} /> {(novel.views || 0).toLocaleString()}
                      </span>
                    )}
                    {tab === 'likes' && (
                      <span className="leaderboard__stat-val text-red">
                        <Heart size={14} /> {(novel.likes || 0).toLocaleString()}
                      </span>
                    )}
                    {tab === 'bookmarks' && (
                      <span className="leaderboard__stat-val text-gold">
                        <Bookmark size={14} /> {(novel.bookmarks || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

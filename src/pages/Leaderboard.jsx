// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Eye, Heart, Bookmark, Crown, Users, Award, BookOpen, User } from 'lucide-react';
import { getLeaderboardNovels } from '../firebase/novels';
import { getUserLeaderboardData } from '../firebase/social';
import { useLanguage } from '../context/LanguageContext';
import './Leaderboard.css';

const Leaderboard = () => {
  const { lang, t } = useLanguage();
  const [mainTab, setMainTab] = useState('novel'); // 'novel' | 'user'
  
  // Sub-tabs
  const [novelTab, setNovelTab] = useState('views'); // 'views' | 'likes' | 'bookmarks'
  const [userTab, setUserTab] = useState('followers'); // 'followers' | 'likedBy' | 'novelsCount'
  
  const [novels, setNovels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Novels
  useEffect(() => {
    if (mainTab !== 'novel') return;
    const loadNovels = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboardNovels(novelTab, 20);
        setNovels(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadNovels();
  }, [mainTab, novelTab]);

  // Load Users
  useEffect(() => {
    if (mainTab !== 'user') return;
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await getUserLeaderboardData();
        // Sort in memory based on selected sub-tab, then filter 0-values
        const sortKey = userTab === 'followers' ? 'followersCount'
          : userTab === 'likedBy' ? 'likedByCount'
          : 'novelsCount';
        const sorted = [...data]
          .filter(u => (u[sortKey] || 0) > 0)
          .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
        setUsers(sorted.slice(0, 10));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [mainTab, userTab]);

  return (
    <div className="leaderboard">
      <div className="container">
        {/* Header */}
        <div className="leaderboard__header text-center">
          <div className="leaderboard__trophy">
            <Trophy size={36} className="text-gradient" />
          </div>
          <h1>{t('leaderboard')} AttaNovel</h1>
          <p>Papan peringkat karya terpopuler dan penulis teraktif di komunitas</p>
        </div>

        {/* Main Tabs */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
          <button
            onClick={() => { setMainTab('novel'); setLoading(true); }}
            className={`btn ${mainTab === 'novel' ? 'btn-gold' : 'btn-outline'}`}
            style={{ padding: '10px 24px' }}
          >
            📖 Peringkat Novel
          </button>
          <button
            onClick={() => { setMainTab('user') ; setLoading(true); }}
            className={`btn ${mainTab === 'user' ? 'btn-gold' : 'btn-outline'}`}
            style={{ padding: '10px 24px' }}
          >
            👥 Peringkat Pengguna
          </button>
        </div>

        {/* Sub Tabs for Novels */}
        {mainTab === 'novel' && (
          <div className="leaderboard__tabs glass-card">
            <button
              className={`leaderboard__tab ${novelTab === 'views' ? 'active' : ''}`}
              onClick={() => setNovelTab('views')}
            >
              👁️ Paling Populer (Views)
            </button>
            <button
              className={`leaderboard__tab ${novelTab === 'likes' ? 'active' : ''}`}
              onClick={() => setNovelTab('likes')}
            >
              ❤️ Paling Disukai (Likes)
            </button>
            <button
              className={`leaderboard__tab ${novelTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setNovelTab('bookmarks')}
            >
              🔖 Ter-bookmark (Bookmarks)
            </button>
          </div>
        )}

        {/* Sub Tabs for Users */}
        {mainTab === 'user' && (
          <div className="leaderboard__tabs glass-card">
            <button
              className={`leaderboard__tab ${userTab === 'followers' ? 'active' : ''}`}
              onClick={() => setUserTab('followers')}
            >
              👥 Follower Terbanyak
            </button>
            <button
              className={`leaderboard__tab ${userTab === 'likedBy' ? 'active' : ''}`}
              onClick={() => setUserTab('likedBy')}
            >
              ❤️ Like Profil Terbanyak
            </button>
            <button
              className={`leaderboard__tab ${userTab === 'novelsCount' ? 'active' : ''}`}
              onClick={() => setUserTab('novelsCount')}
            >
              ✍️ Penulis Teraktif
            </button>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="home__loading">
            <div className="spinner spinner-lg" />
            <p>Memuat peringkat...</p>
          </div>
        ) : mainTab === 'novel' ? (
          novels.length === 0 ? (
            <div className="leaderboard__empty glass-card">
              <span>🏆</span>
              <h3>Belum Ada Peringkat</h3>
              <p>Belum ada data novel yang diterbitkan untuk membuat peringkat.</p>
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
                      {novelTab === 'views' && (
                        <span className="leaderboard__stat-val">
                          <Eye size={14} /> {(novel.views || 0).toLocaleString()}
                        </span>
                      )}
                      {novelTab === 'likes' && (
                        <span className="leaderboard__stat-val text-red">
                          <Heart size={14} /> {(novel.likes || 0).toLocaleString()}
                        </span>
                      )}
                      {novelTab === 'bookmarks' && (
                        <span className="leaderboard__stat-val text-gold">
                          <Bookmark size={14} /> {(novel.bookmarks || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          users.length === 0 ? (
            <div className="leaderboard__empty glass-card">
              <span>👥</span>
              <h3>Belum Ada Peringkat</h3>
              <p>Belum ada data pengguna yang mencukupi untuk peringkat.</p>
            </div>
          ) : (
            <div className="leaderboard__list">
              {users.map((u, index) => {
                const rank = index + 1;
                let rankClass = '';
                if (rank === 1) rankClass = 'rank-1';
                else if (rank === 2) rankClass = 'rank-2';
                else if (rank === 3) rankClass = 'rank-3';

                return (
                  <Link key={u.uid} to={`/profile/${u.uid}`} className={`leaderboard__item glass-card ${rankClass} animate-fadeIn`}>
                    {/* Rank Badge */}
                    <div className="leaderboard__rank-badge">
                      {rank <= 3 ? <Crown size={18} /> : rank}
                    </div>

                    {/* Avatar */}
                    <div className="leaderboard__cover-container" style={{ borderRadius: '50%', width: '50px', height: '50px' }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.displayName} className="leaderboard__cover" style={{ borderRadius: '50%' }} />
                      ) : (
                        <div className="leaderboard__cover-placeholder" style={{ fontSize: '1.2rem' }}><User size={16} /></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="leaderboard__info">
                      <h3 className="leaderboard__novel-title">{u.displayName || 'Pengguna'}</h3>
                      <p className="leaderboard__novel-author" style={{ color: 'var(--color-text-faint)' }}>{u.bio || 'Tidak ada deskripsi.'}</p>
                    </div>

                    {/* Stats */}
                    <div className="leaderboard__stats">
                      {userTab === 'followers' && (
                        <span className="leaderboard__stat-val text-violet">
                          <Users size={14} /> {u.followersCount.toLocaleString()}
                        </span>
                      )}
                      {userTab === 'likedBy' && (
                        <span className="leaderboard__stat-val text-red">
                          <Heart size={14} fill="currentColor" /> {u.likedByCount.toLocaleString()}
                        </span>
                      )}
                      {userTab === 'novelsCount' && (
                        <span className="leaderboard__stat-val text-gold">
                          <BookOpen size={14} /> {u.novelsCount.toLocaleString()} karya
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

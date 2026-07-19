// src/pages/Library.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Bookmark, Eye, Heart } from 'lucide-react';
import { getNovelsByIds } from '../firebase/novels';
import { useAuth } from '../context/AuthContext';
import './Library.css';

const Library = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const bookmarkedIds = userProfile?.bookmarkedNovels || [];
        if (bookmarkedIds.length > 0) {
          const data = await getNovelsByIds(bookmarkedIds);
          setNovels(data);
        } else {
          setNovels([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, userProfile]);

  if (!user) {
    return (
      <div className="library library--empty">
        <div className="container">
          <div className="library__empty-card glass-card">
            <span>🔖</span>
            <h2>Perpustakaan Saya</h2>
            <p>Silakan masuk ke akun Anda untuk melihat koleksi novel yang Anda simpan.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="library">
      <div className="container">
        {/* Header */}
        <div className="library__header">
          <div>
            <h1>Perpustakaan <span className="text-gradient">Saya</span></h1>
            <p>Kumpulan novel-novel favorit yang Anda bookmark</p>
          </div>
          <span className="badge badge-gold">
            <Bookmark size={12} fill="currentColor" /> {novels.length} Novel
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="home__loading">
            <div className="spinner spinner-lg" />
            <p>Memuat perpustakaan...</p>
          </div>
        ) : novels.length === 0 ? (
          <div className="library__empty glass-card animate-fadeIn">
            <span>📖</span>
            <h3>Perpustakaan Anda Kosong</h3>
            <p>Jelajahi ribuan novel fantasy indah dan tandai novel favorit Anda!</p>
            <Link to="/discover" className="btn btn-gold">
              Temukan Novel Menarik
            </Link>
          </div>
        ) : (
          <div className="library__grid">
            {novels.map(novel => (
              <Link key={novel.id} to={`/novel/${novel.id}`} className="library__card glass-card animate-fadeIn">
                <div className="library__cover-wrap">
                  {novel.cover ? (
                    <img src={novel.cover} alt={novel.title} className="library__cover" />
                  ) : (
                    <div className="library__cover-placeholder">📖</div>
                  )}
                  <span className="library__genre-badge">{novel.genre?.split(', ')[0]}</span>
                </div>
                <div className="library__body">
                  <h3 className="library__title">{novel.title}</h3>
                  <p className="library__author">Oleh {novel.authorName}</p>
                  <p className="library__desc">{novel.description?.substring(0, 80)}...</p>
                  <div className="library__stats">
                    <span><Eye size={12} /> {(novel.views || 0).toLocaleString()}</span>
                    <span><Heart size={12} /> {(novel.likes || 0).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;

// src/pages/Social.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, MessageSquare, UserMinus, UserPlus, User } from 'lucide-react';
import { getAllUsers, toggleFollow } from '../firebase/social';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import './Social.css';

const Social = () => {
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  const load = async () => {
    try {
      const data = await getAllUsers();
      // Filter out current user from listing
      const filtered = user ? data.filter(u => u.uid !== user.uid) : data;
      setUsersList(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleFollowToggle = async (targetUser) => {
    if (!user) {
      toast.error('Silakan masuk untuk mengikuti pengguna.');
      return;
    }
    const isFollowing = userProfile?.following?.includes(targetUser.uid) || false;
    try {
      await toggleFollow(user.uid, targetUser.uid, isFollowing);

      // Update local cache
      if (userProfile) {
        if (isFollowing) {
          userProfile.following = (userProfile.following || []).filter(id => id !== targetUser.uid);
        } else {
          userProfile.following = [...(userProfile.following || []), targetUser.uid];
        }
      }

      // Reload users list
      await load();
      toast.success(isFollowing ? 'Batal mengikuti' : 'Mengikuti!');
    } catch (e) {
      console.error(e);
      toast.error('Gagal memproses follow.');
    }
  };

  const handleStartChat = (targetUser) => {
    if (!user) {
      toast.error('Silakan masuk untuk mengirim pesan.');
      return;
    }
    navigate(`/chat?uid=${targetUser.uid}`);
  };

  const filteredUsers = usersList.filter(u =>
    u.displayName?.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="social">
      <div className="container">
        {/* Header */}
        <div className="social__header">
          <div>
            <h1>{t('social')} & Komunitas</h1>
            <p>Temukan penulis dan pembaca novel fantasi lainnya</p>
          </div>
          <span className="badge badge-violet">
            <Users size={12} /> {filteredUsers.length} Pengguna
          </span>
        </div>

        {/* Search */}
        <div className="social__search-wrap glass-card">
          <Search size={18} className="social__search-icon" />
          <input
            type="text"
            placeholder="Cari nama pengguna..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            className="social__search-input"
          />
        </div>

        {/* List Grid */}
        {loading ? (
          <div className="home__loading">
            <div className="spinner spinner-lg" />
            <p>Memuat pengguna...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="social__empty glass-card">
            <span>👥</span>
            <h3>Tidak Ada Pengguna</h3>
            <p>Tidak ada pengguna lain yang terdaftar saat ini.</p>
          </div>
        ) : (
          <div className="social__grid">
            {filteredUsers.map(u => {
              const isFollowing = userProfile?.following?.includes(u.uid) || false;
              const followersCount = u.followers?.length || 0;
              const followingCount = u.following?.length || 0;

              return (
                <div key={u.uid} className="social__card glass-card animate-fadeIn">
                  <div className="social__card-avatar">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.displayName} />
                    ) : (
                      <div className="social__card-avatar-placeholder">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <h3 className="social__card-name">{u.displayName || 'Pengguna'}</h3>
                  <p className="social__card-bio">{u.bio || 'Tidak ada deskripsi bio.'}</p>
                  
                  {/* Stats counts */}
                  <div className="social__card-stats">
                    <div>
                      <strong>{followersCount}</strong>
                      <span>Pengikut</span>
                    </div>
                    <div>
                      <strong>{followingCount}</strong>
                      <span>Diikuti</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="social__card-actions">
                    <button
                      onClick={() => handleFollowToggle(u)}
                      className={`btn btn-sm ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                    >
                      {isFollowing ? (
                        <><UserMinus size={14} /> Unfollow</>
                      ) : (
                        <><UserPlus size={14} /> Follow</>
                      )}
                    </button>
                    <button
                      onClick={() => handleStartChat(u)}
                      className="btn btn-gold btn-sm"
                    >
                      <MessageSquare size={14} /> Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Social;

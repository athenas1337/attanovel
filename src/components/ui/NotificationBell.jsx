// src/components/ui/NotificationBell.jsx
// Real-time notification bell component for Navbar
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Heart, MessageCircle, UserPlus, BookOpen, Send, Zap } from 'lucide-react';
import {
  subscribeToNotifications, markNotificationRead,
  markAllNotificationsRead, getNotifText, getNotifLink
} from '../../firebase/notifications';
import { useAuth } from '../../context/AuthContext';
import './NotificationBell.css';

const NOTIF_ICONS = {
  like:    <Heart size={14} style={{ color: '#ef4444' }} />,
  comment: <MessageCircle size={14} style={{ color: '#8b5cf6' }} />,
  reply:   <MessageCircle size={14} style={{ color: '#a78bfa' }} />,
  follow:  <UserPlus size={14} style={{ color: '#3b82f6' }} />,
  chat:    <Send size={14} style={{ color: '#10b981' }} />,
  chapter: <BookOpen size={14} style={{ color: '#f59e0b' }} />,
  system:  <Zap size={14} style={{ color: '#6b7280' }} />,
};

const formatNotifTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} jam`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifs.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, setNotifs);
    return unsub;
  }, [user]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = async (notif) => {
    if (!notif.read) await markNotificationRead(notif.id);
    setOpen(false);
    navigate(getNotifLink(notif));
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    if (user) await markAllNotificationsRead(user.uid);
  };

  if (!user) return null;

  return (
    <div className="notif-bell" ref={dropdownRef}>
      <button
        className={`notif-bell__btn ${open ? 'active' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={`${unreadCount} notifikasi belum dibaca`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-bell__dropdown glass-card">
          <div className="notif-bell__header">
            <h4>Notifikasi</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="notif-bell__mark-all"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck size={13} /> Baca semua
              </button>
            )}
          </div>

          <div className="notif-bell__list">
            {notifs.length === 0 ? (
              <div className="notif-bell__empty">
                <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>Belum ada notifikasi</p>
              </div>
            ) : (
              notifs.map(notif => (
                <button
                  key={notif.id}
                  className={`notif-bell__item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleClick(notif)}
                >
                  <div className="notif-bell__item-icon">
                    {notif.fromUserAvatar
                      ? <img src={notif.fromUserAvatar} alt="" className="notif-bell__avatar" />
                      : <span className="notif-bell__icon-circle">{NOTIF_ICONS[notif.type] || <Bell size={14} />}</span>
                    }
                    {!notif.read && <span className="notif-bell__dot" />}
                  </div>
                  <div className="notif-bell__item-content">
                    <p>{getNotifText(notif)}</p>
                    <span>{formatNotifTime(notif.createdAt)}</span>
                  </div>
                  {!notif.read && <div className="notif-bell__unread-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

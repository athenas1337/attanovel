// src/pages/Chat.jsx — Premium Chat UI (Fixed: scroll, presence, last seen, unread badge)
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Send, User, MessageSquare, ArrowLeft, Trash2,
  Smile, CheckCheck, Bell, Search, X, Circle
} from 'lucide-react';
import {
  collection, query, where, onSnapshot, orderBy, getDoc, doc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  getOrCreateChat, sendChatMessage, deleteChatMessage,
  clearChatMessages, markChatAsRead
} from '../firebase/chat';
import { subscribeToPresence, formatLastSeen } from '../firebase/presence';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import './Chat.css';

// Quick emoji list
const EMOJI_LIST = ['😊','😂','❤️','👍','🔥','✨','😍','🥺','👏','😭','🎉','💯','🙏','😅','🤔','💬','📖','✍️'];

// Format timestamp
const formatMsgTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatRoomTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffH = diffMs / 3600000;
  if (diffH < 24) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (diffH < 168) return d.toLocaleDateString('id-ID', { weekday: 'short' });
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const Chat = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');

  const [activeChatId, setActiveChatId] = useState(null);
  const [activeParticipants, setActiveParticipants] = useState([]);
  const [targetProfile, setTargetProfile] = useState(null);
  const [targetPresence, setTargetPresence] = useState({ online: false, lastSeen: null });
  const [chatRooms, setChatRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  const messagesBodyRef = useRef(null);
  const messagesEndRef = useRef(null);
  // Track if we are near bottom BEFORE messages update
  const wasNearBottom = useRef(true);
  const prevMsgCount = useRef(0);
  const prevLastMsgId = useRef(null);
  const inputRef = useRef(null);
  const presenceUnsubRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Silakan masuk untuk menggunakan fitur obrolan.');
      navigate('/');
    }
  }, [user, navigate]);

  // Load chat rooms in real-time, newest message first
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const roomsData = [];
      let totalUnreadCount = 0;

      for (const d of snap.docs) {
        const data = d.data();
        const recipientUid = data.participants.find(p => p !== user.uid);

        let recipientName = 'Pengguna';
        let recipientAvatar = '';
        if (recipientUid) {
          const uSnap = await getDoc(doc(db, 'users', recipientUid));
          if (uSnap.exists()) {
            recipientName = uSnap.data().displayName || 'Pengguna';
            recipientAvatar = uSnap.data().avatar || '';
          }
        }

        // Unread count for current user
        const unreadCount = data.unreadCount?.[user.uid] || 0;
        totalUnreadCount += unreadCount;

        roomsData.push({
          id: d.id,
          recipientUid,
          recipientName,
          recipientAvatar,
          unreadCount,
          participants: data.participants,
          ...data,
        });
      }
      setChatRooms(roomsData);
      setTotalUnread(totalUnreadCount);
      setLoadingRooms(false);
    }, (error) => {
      console.error('Error loading chat rooms:', error);
      setLoadingRooms(false);
    });

    return unsubscribe;
  }, [user]);

  // Auto-open chat if uid param is provided
  useEffect(() => {
    if (!user || !targetUid) return;
    const initRoom = async () => {
      try {
        const cId = await getOrCreateChat(user.uid, targetUid);
        const uSnap = await getDoc(doc(db, 'users', targetUid));
        if (uSnap.exists()) {
          setTargetProfile({ uid: targetUid, ...uSnap.data() });
          setActiveParticipants([user.uid, targetUid]);
        }
        setActiveChatId(cId);
        setSidebarVisible(false);
        if (user) markChatAsRead(cId, user.uid);
      } catch (e) {
        console.error(e);
        toast.error('Gagal memuat ruang obrolan.');
      }
    };
    initRoom();
  }, [user, targetUid]);

  // Subscribe to target user's REAL presence
  useEffect(() => {
    // Cleanup previous subscription
    if (presenceUnsubRef.current) {
      presenceUnsubRef.current();
      presenceUnsubRef.current = null;
    }
    if (!targetProfile?.uid) {
      setTargetPresence({ online: false, lastSeen: null });
      return;
    }
    presenceUnsubRef.current = subscribeToPresence(targetProfile.uid, (presence) => {
      setTargetPresence(presence);
    });
    return () => {
      if (presenceUnsubRef.current) presenceUnsubRef.current();
    };
  }, [targetProfile?.uid]);

  // Listen to messages in active chat
  useEffect(() => {
    if (!activeChatId) { setMessages([]); prevMsgCount.current = 0; prevLastMsgId.current = null; return; }

    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (user) markChatAsRead(activeChatId, user.uid);
    return unsubscribe;
  }, [activeChatId, user]);

  // Track scroll position — update BEFORE re-render
  const handleScroll = useCallback(() => {
    const el = messagesBodyRef.current;
    if (!el) return;
    wasNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // Smart auto-scroll — ONLY on new messages from self or when near bottom
  useEffect(() => {
    const currentLength = messages.length;
    const prevLength = prevMsgCount.current;
    const currentLastId = messages[messages.length - 1]?.id;
    const prevLastId = prevLastMsgId.current;

    // A new message was added (not just an update or deletion)
    const newMessageAdded = currentLength > prevLength;

    if (newMessageAdded) {
      const lastMsg = messages[messages.length - 1];
      const isOwnMsg = lastMsg?.senderId === user?.uid;

      // Scroll only if: it's own message OR user is near bottom
      if (isOwnMsg || wasNearBottom.current) {
        // Use requestAnimationFrame to avoid layout thrash
        requestAnimationFrame(() => {
          const el = messagesBodyRef.current;
          if (el) {
            el.scrollTop = el.scrollHeight;
          }
        });
      }
      // Mark as read on new arrival
      if (activeChatId && user) markChatAsRead(activeChatId, user.uid);
    }

    prevMsgCount.current = currentLength;
    prevLastMsgId.current = currentLastId;
  }, [messages, user, activeChatId]);

  const handleDeleteMessage = async (messageId) => {
    if (!activeChatId) return;
    try {
      await deleteChatMessage(activeChatId, messageId);
    } catch (e) {
      toast.error('Gagal menghapus pesan.');
    }
  };

  const handleClearChat = async () => {
    if (!activeChatId) return;
    try {
      await clearChatMessages(activeChatId);
      setShowClearConfirm(false);
      toast.success('Semua pesan dihapus.');
    } catch (e) {
      toast.error('Gagal membersihkan obrolan.');
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!activeChatId || !inputText.trim() || !user) return;
    const textToSend = inputText.trim();
    setInputText('');
    setShowEmoji(false);
    inputRef.current?.focus();
    try {
      await sendChatMessage(activeChatId, user.uid, textToSend, activeParticipants);
    } catch (e) {
      toast.error('Gagal mengirim pesan.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectRoom = async (room) => {
    // Prevent scroll flash: mark near bottom so it will scroll to bottom on open
    wasNearBottom.current = true;
    prevMsgCount.current = 0;

    setActiveChatId(room.id);
    setActiveParticipants(room.participants || [user.uid, room.recipientUid]);
    setTargetProfile({
      uid: room.recipientUid,
      displayName: room.recipientName,
      avatar: room.recipientAvatar,
    });
    navigate(`/chat?uid=${room.recipientUid}`, { replace: true });
    setSidebarVisible(false);
    if (user) markChatAsRead(room.id, user.uid);
  };

  // Filter rooms by search
  const filteredRooms = chatRooms.filter(r =>
    r.recipientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Online status display
  const statusText = targetPresence.online
    ? 'Online'
    : targetPresence.lastSeen
      ? `Terakhir online: ${formatLastSeen(targetPresence.lastSeen)}`
      : 'Offline';

  return (
    <div className="chat-page">
      <div className="container chat-page__container glass-card">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className={`chat-page__sidebar ${sidebarVisible ? 'visible' : ''}`}>
          <div className="chat-page__sidebar-header">
            <h3>
              <MessageSquare size={18} /> Pesan
              {totalUnread > 0 && (
                <span className="chat-unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
              )}
            </h3>
          </div>

          {/* Search */}
          <div className="chat-search-wrap">
            <Search size={14} className="chat-search-icon" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="chat-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="chat-search-clear">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="chat-page__rooms-list">
            {loadingRooms ? (
              <div className="chat-page__rooms-loading"><div className="spinner" /></div>
            ) : filteredRooms.length === 0 ? (
              <div className="chat-page__rooms-empty">
                <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>{searchQuery ? 'Tidak ditemukan.' : 'Belum ada obrolan. Mulai dari halaman Sosial!'}</p>
              </div>
            ) : (
              filteredRooms.map(room => {
                const isActive = activeChatId === room.id;
                const unread = room.unreadCount || 0;
                const isLastMsgMine = room.lastSenderId === user?.uid;
                return (
                  <button
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    className={`chat-page__room-btn ${isActive ? 'active' : ''} ${unread > 0 && !isLastMsgMine ? 'has-unread' : ''}`}
                  >
                    <div className="chat-page__room-avatar">
                      {room.recipientAvatar
                        ? <img src={room.recipientAvatar} alt="" />
                        : <User size={16} />
                      }
                      {/* Unread dot — only when RECIPIENT sent unread messages */}
                      {unread > 0 && !isLastMsgMine && <span className="chat-room-unread-dot" />}
                    </div>
                    <div className="chat-page__room-info">
                      <div className="chat-room-name-row">
                        <strong style={{ color: (unread > 0 && !isLastMsgMine) ? 'var(--color-text)' : undefined }}>
                          {room.recipientName}
                        </strong>
                        <span className="chat-room-time">{formatRoomTime(room.updatedAt)}</span>
                      </div>
                      <div className="chat-room-preview-row">
                        <p className={(unread > 0 && !isLastMsgMine) ? 'unread-preview' : ''}>
                          {isLastMsgMine ? `Kamu: ${room.lastMessage}` : (room.lastMessage || 'Kirim pesan pertama...')}
                        </p>
                        {/* Badge kuantitas pesan di kolom pengirim (recipient side) */}
                        {unread > 0 && !isLastMsgMine && (
                          <span className="chat-room-count">{unread > 9 ? '9+' : unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat Window ──────────────────────────────────── */}
        <main className="chat-page__window">
          {activeChatId && targetProfile ? (
            <>
              {/* Header */}
              <div className="chat-page__window-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    className="chat-page__back-btn"
                    onClick={() => {
                      setSidebarVisible(true);
                      setActiveChatId(null);
                      setTargetProfile(null);
                      navigate('/chat', { replace: true });
                    }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="chat-page__window-avatar">
                    {targetProfile.avatar
                      ? <img src={targetProfile.avatar} alt="" />
                      : <User size={18} />
                    }
                  </div>
                  <div>
                    <h4>{targetProfile.displayName || 'Pengguna'}</h4>
                    <p className={`chat-page__user-status ${targetPresence.online ? 'online' : 'offline'}`}>
                      <span className={`chat-status-dot ${targetPresence.online ? 'online' : 'offline'}`} />
                      {statusText}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="chat-header-btn danger"
                    onClick={() => setShowClearConfirm(true)}
                    title="Hapus Semua Pesan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Clear Confirm Dialog */}
              {showClearConfirm && (
                <div className="chat-confirm-overlay">
                  <div className="chat-confirm-box glass-card">
                    <Trash2 size={28} style={{ color: '#ef4444', marginBottom: 8 }} />
                    <h4>Hapus Semua Pesan?</h4>
                    <p>Tindakan ini tidak bisa dibatalkan.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowClearConfirm(false)}>Batal</button>
                      <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={handleClearChat}>
                        Hapus Semua
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Body */}
              <div
                className="chat-page__messages-body"
                ref={messagesBodyRef}
                onScroll={handleScroll}
              >
                {messages.length === 0 && (
                  <div className="chat-empty-messages">
                    <MessageSquare size={36} style={{ opacity: 0.3 }} />
                    <p>Belum ada pesan. Kirim yang pertama! 👋</p>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isOwn = msg.senderId === user.uid;
                  const prevMsg = messages[idx - 1];
                  const showTimeDivider = !prevMsg || (
                    msg.createdAt && prevMsg.createdAt &&
                    Math.abs((msg.createdAt?.seconds || 0) - (prevMsg.createdAt?.seconds || 0)) > 300
                  );
                  return (
                    <div key={msg.id}>
                      {showTimeDivider && msg.createdAt && (
                        <div className="chat-time-divider">
                          {formatMsgTime(msg.createdAt)}
                        </div>
                      )}
                      <div className={`chat-page__msg-bubble ${isOwn ? 'own' : ''}`}>
                        <div className="chat-page__msg-text">{msg.text}</div>
                        <div className="chat-msg-meta">
                          {isOwn && <CheckCheck size={12} style={{ color: 'rgba(255,255,255,0.6)' }} />}
                        </div>
                        {isOwn && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="chat-page__msg-delete-btn"
                            title="Hapus pesan"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} style={{ height: 1 }} />
              </div>

              {/* Emoji Picker */}
              {showEmoji && (
                <div className="chat-emoji-picker">
                  {EMOJI_LIST.map(e => (
                    <button key={e} className="chat-emoji-btn" onClick={() => setInputText(t => t + e)}>
                      {e}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSend} className="chat-page__input-form">
                <button
                  type="button"
                  className={`chat-emoji-toggle ${showEmoji ? 'active' : ''}`}
                  onClick={() => setShowEmoji(!showEmoji)}
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ketik pesan... (Enter untuk kirim)"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="chat-page__input-field"
                  maxLength={1000}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="chat-page__send-btn"
                  disabled={!inputText.trim()}
                  title="Kirim (Enter)"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="chat-page__window-empty">
              <div className="chat-empty-icon">
                <MessageSquare size={48} />
              </div>
              <h3>Obrolan Pribadi</h3>
              <p>Pilih percakapan di samping atau mulai obrolan baru dari halaman <strong>Sosial</strong>.</p>
              {totalUnread > 0 && (
                <div className="chat-notification-hint">
                  <Bell size={14} /> Kamu punya <strong>{totalUnread}</strong> pesan belum dibaca
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;

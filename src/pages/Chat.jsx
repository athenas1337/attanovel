// src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, User, MessageSquare, ArrowLeft } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getOrCreateChat, sendChatMessage } from '../firebase/chat';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import './Chat.css';

const Chat = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');

  const [activeChatId, setActiveChatId] = useState(null);
  const [targetProfile, setTargetProfile] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const messagesEndRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Silakan masuk untuk menggunakan fitur obrolan.');
      navigate('/');
    }
  }, [user, navigate]);

  // Load chat rooms for the current user
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const roomsData = [];
      for (const d of snap.docs) {
        const data = d.data();
        // Find recipient UID
        const recipientUid = data.participants.find(p => p !== user.uid);
        
        // Fetch recipient user details
        let recipientName = 'Pengguna';
        let recipientAvatar = '';
        if (recipientUid) {
          const uSnap = await getDoc(doc(db, 'users', recipientUid));
          if (uSnap.exists()) {
            recipientName = uSnap.data().displayName || 'Pengguna';
            recipientAvatar = uSnap.data().avatar || '';
          }
        }

        roomsData.push({
          id: d.id,
          recipientUid,
          recipientName,
          recipientAvatar,
          ...data
        });
      }
      setChatRooms(roomsData);
      setLoadingRooms(false);
    }, (error) => {
      console.error("Error loading chat rooms:", error);
      setLoadingRooms(false);
    });

    return unsubscribe;
  }, [user]);

  // If a targetUid parameter is specified, open/create the room
  useEffect(() => {
    if (!user || !targetUid) return;
    const initRoom = async () => {
      try {
        const cId = await getOrCreateChat(user.uid, targetUid);
        setActiveChatId(cId);

        // Load recipient details
        const uSnap = await getDoc(doc(db, 'users', targetUid));
        if (uSnap.exists()) {
          setTargetProfile(uSnap.data());
        }
      } catch (e) {
        console.error(e);
        toast.error('Gagal memuat ruang obrolan.');
      }
    };
    initRoom();
  }, [user, targetUid]);

  // Listen to messages in the active chat room
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsubscribe;
  }, [activeChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeChatId || !inputText.trim() || !user) return;
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await sendChatMessage(activeChatId, user.uid, textToSend);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengirim pesan.');
    }
  };

  const selectRoom = async (room) => {
    setActiveChatId(room.id);
    setTargetProfile({
      displayName: room.recipientName,
      avatar: room.recipientAvatar,
      uid: room.recipientUid
    });
    // Update URL query
    navigate(`/chat?uid=${room.recipientUid}`, { replace: true });
  };

  return (
    <div className="chat-page">
      <div className="container chat-page__container glass-card">
        {/* Sidebar Rooms */}
        <aside className="chat-page__sidebar">
          <div className="chat-page__sidebar-header">
            <h3><MessageSquare size={18} /> {t('chat')}</h3>
          </div>
          <div className="chat-page__rooms-list">
            {loadingRooms ? (
              <div className="chat-page__rooms-loading">
                <div className="spinner" />
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="chat-page__rooms-empty">
                <p>Belum ada obrolan aktif. Buka halaman sosial untuk memulai.</p>
              </div>
            ) : (
              chatRooms.map(room => {
                const isActive = activeChatId === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    className={`chat-page__room-btn ${isActive ? 'active' : ''}`}
                  >
                    <div className="chat-page__room-avatar">
                      {room.recipientAvatar ? (
                        <img src={room.recipientAvatar} alt="" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className="chat-page__room-info">
                      <strong>{room.recipientName}</strong>
                      <p>{room.lastMessage || 'Kirim pesan pertama...'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat Window */}
        <main className="chat-page__window">
          {activeChatId && targetProfile ? (
            <>
              {/* Header */}
              <div className="chat-page__window-header">
                <button className="chat-page__back-btn" onClick={() => navigate('/social')}>
                  <ArrowLeft size={16} />
                </button>
                <div className="chat-page__window-avatar">
                  {targetProfile.avatar ? (
                    <img src={targetProfile.avatar} alt="" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div>
                  <h4>{targetProfile.displayName || 'Pengguna'}</h4>
                  <p className="chat-page__user-status">Online</p>
                </div>
              </div>

              {/* Messages Body */}
              <div className="chat-page__messages-body">
                {messages.map(msg => {
                  const isOwn = msg.senderId === user.uid;
                  return (
                    <div key={msg.id} className={`chat-page__msg-bubble ${isOwn ? 'own' : ''}`}>
                      <div className="chat-page__msg-text">{msg.text}</div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="chat-page__input-form">
                <input
                  type="text"
                  placeholder="Ketik pesan..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="chat-page__input-field"
                  required
                />
                <button type="submit" className="chat-page__send-btn">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="chat-page__window-empty">
              <MessageSquare size={48} className="text-gradient" />
              <h3>Obrolan Pribadi</h3>
              <p>Pilih salah satu kontak di samping untuk memulai pesan langsung secara real-time.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;

// src/firebase/notifications.js
// In-app notification system for AttaNovel
import {
  collection, addDoc, query, where, orderBy, limit,
  getDocs, updateDoc, doc, onSnapshot, serverTimestamp,
  writeBatch, getDoc
} from 'firebase/firestore';
import { db } from './config';

/**
 * Create a notification for a user.
 * type: 'like' | 'comment' | 'follow' | 'chat' | 'chapter' | 'reply' | 'system'
 */
export const createNotification = async (targetUserId, type, data = {}) => {
  if (!targetUserId) return;
  try {
    await addDoc(collection(db, 'notifications'), {
      targetUserId,
      type,
      read: false,
      createdAt: serverTimestamp(),
      ...data,
      // data shape examples:
      // like: { fromUserId, fromUserName, fromUserAvatar, novelId, novelTitle }
      // comment: { fromUserId, fromUserName, novelId, novelTitle, chapterId, chapterTitle, commentText }
      // follow: { fromUserId, fromUserName, fromUserAvatar }
      // chat: { fromUserId, fromUserName, fromUserAvatar, chatId }
      // chapter: { novelId, novelTitle, chapterTitle, authorId }
    });
  } catch (e) {
    console.warn('Notification failed:', e.message);
  }
};

/**
 * Subscribe to notifications for a user in real-time.
 * Returns an unsubscribe function.
 */
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'notifications'),
    where('targetUserId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notifs);
  }, (err) => {
    // fallback without orderBy if index missing
    const q2 = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', userId),
      limit(50)
    );
    return onSnapshot(q2, (snap) => {
      const notifs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(notifs);
    });
  });
};

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = async (notifId) => {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch {}
};

/**
 * Mark ALL unread notifications for a user as read.
 */
export const markAllNotificationsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', userId),
      where('read', '==', false),
      limit(100)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch {}
};

/**
 * Get notification text for display.
 */
export const getNotifText = (notif) => {
  const name = notif.fromUserName || 'Seseorang';
  switch (notif.type) {
    case 'like':    return `${name} menyukai novelmu "${notif.novelTitle || ''}"`;
    case 'comment': return `${name} mengomentari "${notif.chapterTitle || notif.novelTitle || 'bab'}"`;
    case 'reply':   return `${name} membalas komentarmu`;
    case 'follow':  return `${name} mulai mengikutimu`;
    case 'chat':    return `${name} mengirimmu pesan baru`;
    case 'chapter': return `Bab baru tersedia: "${notif.chapterTitle}" di "${notif.novelTitle}"`;
    case 'system':  return notif.message || 'Pemberitahuan sistem';
    default:        return 'Pemberitahuan baru';
  }
};

export const getNotifLink = (notif) => {
  switch (notif.type) {
    case 'like':
    case 'comment':
    case 'chapter':  return notif.novelId ? `/novel/${notif.novelId}` : '/';
    case 'follow':   return notif.fromUserId ? `/profile/${notif.fromUserId}` : '/social';
    case 'chat':     return notif.fromUserId ? `/chat?uid=${notif.fromUserId}` : '/chat';
    default:         return '/';
  }
};

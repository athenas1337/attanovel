// src/firebase/activity.js
// Tracks user activity/history log in Firestore
import { db } from './config';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Log an activity for a user.
 * type: 'login' | 'like' | 'comment' | 'bookmark' | 'publish' | 'chapter' | 'follow' | 'chat'
 */
export const logActivity = async (userId, type, detail = {}) => {
  if (!userId) return;
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId,
      type,
      detail, // { novelId, novelTitle, message, targetUser, etc. }
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // silently fail — activity log is non-critical
    console.warn('Activity log failed:', e.message);
  }
};

/**
 * Get the activity log for a user, newest first, limited to last N entries.
 */
export const getUserActivity = async (userId, limitCount = 50) => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, 'activity_logs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Failed to get activity:', e.message);
    return [];
  }
};

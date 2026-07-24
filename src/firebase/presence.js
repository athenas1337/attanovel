// src/firebase/presence.js
// Real-time online/offline presence using Firestore + window events
import { db } from './config';
import { doc, setDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * Initialize presence tracking for a user.
 * Call this once when user logs in.
 * Returns a cleanup function to call on logout/unmount.
 */
export const initPresence = (userId) => {
  if (!userId) return () => {};

  const presenceRef = doc(db, 'presence', userId);

  const setOnline = () => {
    setDoc(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
    }, { merge: true }).catch(() => {});
  };

  const setOffline = () => {
    setDoc(presenceRef, {
      online: false,
      lastSeen: serverTimestamp(),
    }, { merge: true }).catch(() => {});
  };

  // Set online immediately
  setOnline();

  // Listen for page visibility changes
  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      setOffline();
    } else {
      setOnline();
    }
  };

  // Listen for window close/navigate away
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliable offline marking on tab close
    // Fallback to regular setDoc
    setOffline();
  };

  // Heartbeat: update lastSeen every 60s while page is open
  const heartbeat = setInterval(() => {
    if (document.visibilityState !== 'hidden') {
      setOnline();
    }
  }, 60000);

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handleBeforeUnload);

  // Cleanup function
  return () => {
    setOffline();
    clearInterval(heartbeat);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handleBeforeUnload);
  };
};

/**
 * Subscribe to a user's presence. Returns unsubscribe fn.
 * Calls callback with { online: boolean, lastSeen: Timestamp }
 */
export const subscribeToPresence = (userId, callback) => {
  if (!userId) return () => {};
  const presenceRef = doc(db, 'presence', userId);
  return onSnapshot(presenceRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback({ online: false, lastSeen: null });
    }
  }, () => callback({ online: false, lastSeen: null }));
};

/**
 * Format lastSeen into human-readable string
 */
export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Belum pernah aktif';
  const d = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'Baru saja aktif';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffH < 24) return `${diffH} jam lalu`;
  if (diffD === 1) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

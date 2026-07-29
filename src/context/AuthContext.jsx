// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToAuthChanges } from '../firebase/auth';
import { initPresence } from '../firebase/presence';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  // Start as false — render children immediately with null user
  // This prevents white screen while Firebase initializes
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cleanupPresence = () => {};

    // Safety timeout — if Firebase auth doesn't respond in 8s,
    // just show the app (unauthenticated) rather than blank screen
    const safetyTimer = setTimeout(() => {
      console.warn('[AttaNovel] Auth init timeout — showing app without auth');
      setLoading(false);
    }, 8000);

    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      clearTimeout(safetyTimer);

      // Cleanup previous presence
      cleanupPresence();

      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) setUserProfile(snap.data());
        } catch (err) {
          console.error('[AttaNovel] Failed to load user profile:', err);
        }

        // Initialize real-time presence tracking
        try {
          cleanupPresence = initPresence(firebaseUser.uid);
        } catch (err) {
          console.error('[AttaNovel] Presence init failed:', err);
          cleanupPresence = () => {};
        }
      } else {
        setUserProfile(null);
        cleanupPresence = () => {};
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
      cleanupPresence();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {/* Always render children — loading state handled per-page */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

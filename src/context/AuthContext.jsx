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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cleanupPresence = () => {};

    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      // Cleanup previous presence
      cleanupPresence();

      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setUserProfile(snap.data());

        // Initialize real-time presence tracking
        cleanupPresence = initPresence(firebaseUser.uid);
      } else {
        setUserProfile(null);
        cleanupPresence = () => {};
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      cleanupPresence();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

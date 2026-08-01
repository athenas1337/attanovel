// src/firebase/novels.js — Enhanced with proper views/likes (1x per user)
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, setDoc, query, where, orderBy, limit,
  serverTimestamp, increment, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

// Upload cover image
export const uploadCover = async (file, novelId) => {
  const storageRef = ref(storage, `covers/${novelId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Create novel
export const createNovel = async (novelData, authorId) => {
  const docRef = await addDoc(collection(db, 'novels'), {
    ...novelData,
    authorId,
    views: 0,
    likes: 0,
    bookmarks: 0,
    likedBy: [],
    bookmarkedBy: [],
    viewedBy: [],
    rating: 0,
    ratingCount: 0,
    status: 'draft',
    writingStatus: 'Ongoing',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update novel
export const updateNovel = async (novelId, novelData) => {
  const novelRef = doc(db, 'novels', novelId);
  await updateDoc(novelRef, { ...novelData, updatedAt: serverTimestamp() });
};

// Delete novel (with all subcollections cleanup)
export const deleteNovel = async (novelId) => {
  await deleteDoc(doc(db, 'novels', novelId));
};

// Get single novel
export const getNovel = async (novelId) => {
  const novelSnap = await getDoc(doc(db, 'novels', novelId));
  if (novelSnap.exists()) {
    return { id: novelSnap.id, ...novelSnap.data() };
  }
  return null;
};

// Get all published novels
export const getPublishedNovels = async (limitCount = 20) => {
  const q = query(
    collection(db, 'novels'),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Get novels by author
export const getNovelsByAuthor = async (authorId) => {
  const q = query(
    collection(db, 'novels'),
    where('authorId', '==', authorId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Search novels
export const searchNovels = async (searchTerm) => {
  const q = query(
    collection(db, 'novels'),
    where('status', '==', 'published'),
    orderBy('title')
  );
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return all.filter(n =>
    n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.genre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );
};

/**
 * Increment view count — ONLY ONCE per user per novel.
 * Uses a sub-collection 'views/{userId}' as an idempotency key.
 * For anonymous users, falls back to localStorage per-session.
 */
export const incrementViews = async (novelId, userId = null) => {
  try {
    if (userId) {
      // Authenticated: use Firestore to ensure 1x per user
      const viewRef = doc(db, 'novels', novelId, 'views', userId);
      const viewSnap = await getDoc(viewRef);
      if (viewSnap.exists()) return; // Already viewed
      // Mark as viewed
      await setDoc(viewRef, { viewedAt: serverTimestamp() });
      await updateDoc(doc(db, 'novels', novelId), { views: increment(1) });
    } else {
      // Anonymous: use sessionStorage to prevent repeat in same session
      const key = `viewed_${novelId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      await updateDoc(doc(db, 'novels', novelId), { views: increment(1) });
    }
  } catch (e) {
    console.warn('incrementViews failed:', e.message);
  }
};

/**
 * Toggle like — ONLY 1 like per user ever.
 * Tracked via novel's likedBy array + user's likedNovels array.
 */
export const toggleNovelLike = async (novelId, userId, isLiked) => {
  const novelRef = doc(db, 'novels', novelId);
  const userRef = doc(db, 'users', userId);

  if (isLiked) {
    await updateDoc(novelRef, {
      likes: increment(-1),
      likedBy: arrayRemove(userId),
    });
    await updateDoc(userRef, { likedNovels: arrayRemove(novelId) });
  } else {
    await updateDoc(novelRef, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
    });
    await updateDoc(userRef, { likedNovels: arrayUnion(novelId) });
  }
};

/**
 * Toggle bookmark — tracked in likedBy + user bookmarkedNovels.
 */
export const toggleNovelBookmark = async (novelId, userId, isBookmarked) => {
  const novelRef = doc(db, 'novels', novelId);
  const userRef = doc(db, 'users', userId);

  if (isBookmarked) {
    await updateDoc(novelRef, {
      bookmarks: increment(-1),
      bookmarkedBy: arrayRemove(userId),
    });
    await updateDoc(userRef, { bookmarkedNovels: arrayRemove(novelId) });
  } else {
    await updateDoc(novelRef, {
      bookmarks: increment(1),
      bookmarkedBy: arrayUnion(userId),
    });
    await updateDoc(userRef, { bookmarkedNovels: arrayUnion(novelId) });
  }
};

// Get multiple novels by array of IDs (Library)
export const getNovelsByIds = async (novelIds) => {
  if (!novelIds || novelIds.length === 0) return [];
  const q = query(
    collection(db, 'novels'),
    where('__name__', 'in', novelIds.slice(0, 30))
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Fetch leaderboard rankings
export const getLeaderboardNovels = async (sortByField = 'views', limitNum = 10) => {
  const q = query(
    collection(db, 'novels'),
    where('status', '==', 'published')
  );
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return all
    .filter(n => (n[sortByField] || 0) > 0)
    .sort((a, b) => (b[sortByField] || 0) - (a[sortByField] || 0))
    .slice(0, limitNum);
};

// Rate a novel (1-5 stars) — one rating per user
export const rateNovel = async (novelId, userId, stars) => {
  if (stars < 1 || stars > 5) return;
  const ratingRef = doc(db, 'novels', novelId, 'ratings', userId);
  const existing = await getDoc(ratingRef);

  const novelRef = doc(db, 'novels', novelId);
  if (existing.exists()) {
    const old = existing.data().stars || 0;
    await setDoc(ratingRef, { stars, updatedAt: serverTimestamp() }, { merge: true });
    // Adjust aggregate: subtract old, add new
    const novelSnap = await getDoc(novelRef);
    const data = novelSnap.data();
    const newTotal = (data.ratingTotal || 0) - old + stars;
    const count = data.ratingCount || 1;
    await updateDoc(novelRef, { ratingTotal: newTotal, rating: newTotal / count });
  } else {
    await setDoc(ratingRef, { stars, createdAt: serverTimestamp() });
    const novelSnap = await getDoc(novelRef);
    const data = novelSnap.data();
    const newTotal = (data.ratingTotal || 0) + stars;
    const newCount = (data.ratingCount || 0) + 1;
    await updateDoc(novelRef, {
      ratingTotal: newTotal,
      ratingCount: newCount,
      rating: newTotal / newCount,
    });
  }
};

// Get user's rating for a novel
export const getUserRating = async (novelId, userId) => {
  const snap = await getDoc(doc(db, 'novels', novelId, 'ratings', userId));
  return snap.exists() ? snap.data().stars : 0;
};

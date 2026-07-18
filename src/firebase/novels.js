// src/firebase/novels.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, increment
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
    status: 'draft',
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

// Delete novel
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
    n.genre?.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Increment view count
export const incrementViews = async (novelId) => {
  await updateDoc(doc(db, 'novels', novelId), { views: increment(1) });
};

// Toggle like
export const toggleLike = async (novelId) => {
  await updateDoc(doc(db, 'novels', novelId), { likes: increment(1) });
};

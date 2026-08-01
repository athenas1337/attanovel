// src/firebase/chapters.js
// Chapters with proper draft/published visibility enforcement
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

// Upload image inside chapter
export const uploadChapterImage = async (file, novelId, chapterId) => {
  const storageRef = ref(storage, `chapters/${novelId}/${chapterId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Add chapter
export const addChapter = async (novelId, chapterData) => {
  const docRef = await addDoc(collection(db, 'novels', novelId, 'chapters'), {
    ...chapterData,
    status: chapterData.status || 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update chapter
export const updateChapter = async (novelId, chapterId, chapterData) => {
  const chapterRef = doc(db, 'novels', novelId, 'chapters', chapterId);
  await updateDoc(chapterRef, { ...chapterData, updatedAt: serverTimestamp() });
};

// Delete chapter
export const deleteChapter = async (novelId, chapterId) => {
  await deleteDoc(doc(db, 'novels', novelId, 'chapters', chapterId));
};

/**
 * Get ALL chapters — for the novel author or admin.
 * Returns both draft and published chapters.
 */
export const getChapters = async (novelId) => {
  const q = query(
    collection(db, 'novels', novelId, 'chapters'),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Get ONLY published chapters — for regular readers.
 * Draft chapters are hidden from non-authors and non-admins.
 */
export const getPublishedChapters = async (novelId) => {
  const q = query(
    collection(db, 'novels', novelId, 'chapters'),
    where('status', '==', 'published'),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

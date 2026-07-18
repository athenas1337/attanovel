// src/firebase/chapters.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp
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

// Get all chapters for a novel
export const getChapters = async (novelId) => {
  const q = query(
    collection(db, 'novels', novelId, 'chapters'),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

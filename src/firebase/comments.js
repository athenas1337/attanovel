// src/firebase/comments.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from './config';

// Add comment
export const addComment = async (novelId, chapterId, commentData) => {
  const ref = await addDoc(
    collection(db, 'novels', novelId, 'chapters', chapterId, 'comments'),
    {
      ...commentData,
      likes: [],
      replies: [],
      createdAt: serverTimestamp(),
    }
  );
  return ref.id;
};

// Get comments for a chapter
export const getComments = async (novelId, chapterId) => {
  const q = query(
    collection(db, 'novels', novelId, 'chapters', chapterId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Delete comment
export const deleteComment = async (novelId, chapterId, commentId) => {
  await deleteDoc(
    doc(db, 'novels', novelId, 'chapters', chapterId, 'comments', commentId)
  );
};

// Like / unlike comment
export const toggleCommentLike = async (novelId, chapterId, commentId, userId) => {
  const commentRef = doc(db, 'novels', novelId, 'chapters', chapterId, 'comments', commentId);
  // We'll check on frontend whether to add or remove
  return commentRef;
};

// Add reply
export const addReply = async (novelId, chapterId, commentId, replyData) => {
  const commentRef = doc(db, 'novels', novelId, 'chapters', chapterId, 'comments', commentId);
  await updateDoc(commentRef, {
    replies: arrayUnion({
      ...replyData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    })
  });
};

// src/firebase/comments.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp, arrayUnion, arrayRemove,
  getDoc
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
      reports: [],
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

// Delete comment (by owner OR novel author)
export const deleteComment = async (novelId, chapterId, commentId) => {
  await deleteDoc(
    doc(db, 'novels', novelId, 'chapters', chapterId, 'comments', commentId)
  );
};

// Toggle like on a comment (add/remove userId from likes array)
export const toggleCommentLike = async (novelId, chapterId, commentId, userId, hasLiked) => {
  const commentRef = doc(db, 'novels', novelId, 'chapters', chapterId, 'comments', commentId);
  if (hasLiked) {
    await updateDoc(commentRef, { likes: arrayRemove(userId) });
  } else {
    await updateDoc(commentRef, { likes: arrayUnion(userId) });
  }
};

// Report a comment (add userId to reports array)
export const reportComment = async (novelId, chapterId, commentId, userId, reason = '') => {
  const commentRef = doc(db, 'novels', novelId, 'chapters', chapterId, 'comments', commentId);
  await updateDoc(commentRef, {
    reports: arrayUnion({ userId, reason, reportedAt: new Date().toISOString() }),
  });
};

// Add reply
export const addReply = async (novelId, chapterId, commentId, replyData) => {
  const commentRef = doc(db, 'novels', novelId, 'chapters', chapterId, 'comments', commentId);
  await updateDoc(commentRef, {
    replies: arrayUnion({
      ...replyData,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      likes: [],
      createdAt: new Date().toISOString(),
    })
  });
};

// Toggle like on a reply
export const toggleReplyLike = async (novelId, chapterId, commentId, replyId, userId, currentReplies) => {
  const commentRef = doc(db, 'novels', novelId, 'chapters', chapterId, 'comments', commentId);
  const updatedReplies = currentReplies.map(r => {
    if (r.id !== replyId) return r;
    const hasLiked = (r.likes || []).includes(userId);
    return {
      ...r,
      likes: hasLiked
        ? (r.likes || []).filter(uid => uid !== userId)
        : [...(r.likes || []), userId],
    };
  });
  await updateDoc(commentRef, { replies: updatedReplies });
};

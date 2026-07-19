import { db } from './config';
import { collection, doc, query, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Get all users
export const getAllUsers = async () => {
  const q = query(collection(db, 'users'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
};

// Toggle follow/unfollow
export const toggleFollow = async (currentUserId, targetUserId, isFollowing) => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  if (isFollowing) {
    await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
    await updateDoc(targetUserRef, { followers: arrayRemove(currentUserId) });
  } else {
    await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
    await updateDoc(targetUserRef, { followers: arrayUnion(currentUserId) });
  }
};

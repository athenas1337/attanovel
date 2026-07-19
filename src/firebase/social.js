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

// Toggle user profile like
export const toggleUserLike = async (currentUserId, targetUserId, isLiked) => {
  const targetUserRef = doc(db, 'users', targetUserId);

  if (isLiked) {
    await updateDoc(targetUserRef, { likedBy: arrayRemove(currentUserId) });
  } else {
    await updateDoc(targetUserRef, { likedBy: arrayUnion(currentUserId) });
  }
};

// Fetch user leaderboard stats dynamically
export const getUserLeaderboardData = async () => {
  const usersSnap = await getDocs(collection(db, 'users'));
  const novelsSnap = await getDocs(collection(db, 'novels'));

  const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
  const novels = novelsSnap.docs.map(d => d.data());

  const authorStats = {};
  novels.forEach(n => {
    if (!n.authorId) return;
    if (!authorStats[n.authorId]) {
      authorStats[n.authorId] = { novelsCount: 0, totalLikes: 0 };
    }
    authorStats[n.authorId].novelsCount += 1;
    authorStats[n.authorId].totalLikes += (n.likes || 0);
  });

  return users.map(u => ({
    ...u,
    followersCount: u.followers?.length || 0,
    likedByCount: u.likedBy?.length || 0,
    novelsCount: authorStats[u.uid]?.novelsCount || 0,
    totalLikesReceived: authorStats[u.uid]?.totalLikes || 0,
  }));
};

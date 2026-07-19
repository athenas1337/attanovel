// src/firebase/chat.js
import { db } from './config';
import {
  collection, doc, query, getDocs, addDoc, updateDoc, getDoc,
  serverTimestamp, where, deleteDoc, writeBatch, increment
} from 'firebase/firestore';

// Get or Create a chat between two users
export const getOrCreateChat = async (user1, user2) => {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', user1)
  );
  const snap = await getDocs(q);
  
  let existingChat = snap.docs.find(d => d.data().participants.includes(user2));
  
  if (existingChat) {
    return existingChat.id;
  }
  
  const newChatRef = await addDoc(collection(db, 'chats'), {
    participants: [user1, user2],
    lastMessage: '',
    updatedAt: serverTimestamp(),
    unreadCount: { [user1]: 0, [user2]: 0 },
  });
  
  return newChatRef.id;
};

// Send message inside a chat — increments unread count for recipient
export const sendChatMessage = async (chatId, senderId, text, participants) => {
  const chatRef = doc(db, 'chats', chatId);
  
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text,
    createdAt: serverTimestamp(),
    read: false,
  });

  // Build unread increment for the OTHER participant
  const unreadUpdate = {};
  if (participants) {
    participants.forEach(uid => {
      if (uid !== senderId) {
        unreadUpdate[`unreadCount.${uid}`] = increment(1);
      }
    });
  }
  
  await updateDoc(chatRef, {
    lastMessage: text,
    lastSenderId: senderId,
    updatedAt: serverTimestamp(),
    ...unreadUpdate,
  });
};

// Mark messages as read for a user (reset their unread count)
export const markChatAsRead = async (chatId, userId) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (e) {
    // silently fail - not critical
  }
};

// Delete a specific message
export const deleteChatMessage = async (chatId, messageId) => {
  await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
};

// Clear all messages in a chat room
export const clearChatMessages = async (chatId) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const snap = await getDocs(messagesRef);
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    batch.delete(d.ref);
  });
  await batch.commit();

  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: '',
    updatedAt: serverTimestamp(),
  });
};

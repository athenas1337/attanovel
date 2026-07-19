import { db } from './config';
import {
  collection, doc, query, getDocs, addDoc, updateDoc,
  serverTimestamp, where
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
  });
  
  return newChatRef.id;
};

// Send message inside a chat
export const sendChatMessage = async (chatId, senderId, text) => {
  const chatRef = doc(db, 'chats', chatId);
  
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text,
    createdAt: serverTimestamp()
  });
  
  await updateDoc(chatRef, {
    lastMessage: text,
    updatedAt: serverTimestamp()
  });
};

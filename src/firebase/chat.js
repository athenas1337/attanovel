import { db } from './config';
import {
  collection, doc, query, getDocs, addDoc, updateDoc,
  serverTimestamp, where, deleteDoc, writeBatch
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

  // Reset lastMessage
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: 'Pesan telah dihapus',
    updatedAt: serverTimestamp()
  });
};

// src/hooks/useRecentlyViewed.js
// Custom hook to track and retrieve recently viewed novels (stored in localStorage)

const KEY = 'attanovel_recently_viewed';
const MAX_ITEMS = 12;

export const addRecentlyViewed = (novel) => {
  if (!novel?.id) return;
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
    const filtered = existing.filter(n => n.id !== novel.id);
    const updated = [{ id: novel.id, title: novel.title, cover: novel.cover, authorName: novel.authorName, genre: novel.genre }, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch (e) {}
};

export const getRecentlyViewed = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const clearRecentlyViewed = () => {
  localStorage.removeItem(KEY);
};

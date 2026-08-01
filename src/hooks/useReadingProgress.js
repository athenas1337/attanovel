// src/hooks/useReadingProgress.js
// Tracks reading progress per novel using localStorage
// Stores: { [novelId]: { lastChapterId, lastChapterIndex, totalChapters, percent, updatedAt } }

const KEY = 'attanovel_reading_progress';

export const getReadingProgress = (novelId) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    return all[novelId] || null;
  } catch { return null; }
};

export const setReadingProgress = (novelId, chapterId, chapterIndex, totalChapters) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    all[novelId] = {
      lastChapterId: chapterId,
      lastChapterIndex: chapterIndex,
      totalChapters,
      percent: totalChapters > 0 ? Math.round(((chapterIndex + 1) / totalChapters) * 100) : 0,
      updatedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
};

export const getAllReadingProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch { return {}; }
};

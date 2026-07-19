// src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const translations = {
  id: {
    home: 'Beranda',
    discover: 'Jelajahi',
    library: 'Perpustakaan',
    leaderboard: 'Peringkat',
    write: 'Tulis',
    settings: 'Pengaturan',
    login: 'Masuk',
    register: 'Daftar',
    logout: 'Keluar',
    searchPlaceholder: 'Cari novel...',
    popularNovels: 'Novel Populer',
    viewAll: 'Lihat Semua',
    synopsis: 'Sinopsis',
    chapters: 'Daftar Bab',
    writeNovel: 'Buat Novel',
    status: 'Status',
    genre: 'Genre',
    views: 'Dilihat',
    likes: 'Disukai',
    bookmarks: 'Bookmarks',
    comments: 'Komentar',
    noChapters: 'Belum ada bab yang tersedia',
    readChapter: 'Baca Bab',
    profile: 'Profil Saya',
    avatarUrlLabel: 'Atau gunakan URL Foto Profil:',
    save: 'Simpan',
    cancel: 'Batal',
    social: 'Sosial',
    chat: 'Obrolan',
  },
  en: {
    home: 'Home',
    discover: 'Discover',
    library: 'Library',
    leaderboard: 'Leaderboard',
    write: 'Write',
    settings: 'Settings',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    searchPlaceholder: 'Search novels...',
    popularNovels: 'Popular Novels',
    viewAll: 'View All',
    synopsis: 'Synopsis',
    chapters: 'Chapters List',
    writeNovel: 'Create Novel',
    status: 'Status',
    genre: 'Genre',
    views: 'Views',
    likes: 'Likes',
    bookmarks: 'Bookmarks',
    comments: 'Comments',
    noChapters: 'No chapters available yet',
    readChapter: 'Read Chapter',
    profile: 'My Profile',
    avatarUrlLabel: 'Or use Profile Picture URL:',
    save: 'Save',
    cancel: 'Cancel',
    social: 'Social',
    chat: 'Chat',
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('atta_lang') || 'id');

  useEffect(() => {
    localStorage.setItem('atta_lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

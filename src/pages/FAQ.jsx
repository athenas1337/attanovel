// src/pages/FAQ.jsx
import { useState } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import './FAQ.css';

const FAQ_DATA = [
  {
    q: 'Apakah AttaNovel gratis digunakan?',
    a: 'Ya! AttaNovel sepenuhnya gratis untuk membaca maupun menulis novel. Kamu bisa mendaftar, menulis, dan menerbitkan karya tanpa biaya apapun. Fitur dasar seperti membaca, like, bookmark, dan komentar semuanya tersedia gratis untuk semua pengguna.',
  },
  {
    q: 'Bagaimana cara menerbitkan novel di AttaNovel?',
    a: 'Setelah mendaftar dan masuk, klik tombol "Tulis" di sudut kanan atas navbar. Kamu akan diarahkan ke Dashboard Penulis. Pilih "Buat Novel Baru", isi judul, sinopsis, genre, dan unggah sampul. Setelah itu, tambahkan bab-bab novelmu lewat halaman manajemen novel. Klik "Terbitkan" saat siap untuk membagikan karyamu ke publik.',
  },
  {
    q: 'Apakah saya bisa mengubah atau menghapus novel yang sudah diterbitkan?',
    a: 'Tentu saja. Kamu selalu bisa mengedit detail novel (judul, sinopsis, cover, genre, status karya) kapan saja dari Dashboard Penulis atau halaman Manajemen Novel. Kamu juga bisa menambah, mengedit, atau menghapus bab secara individual, serta mengubah status novel dari Draft ke Diterbitkan ataupun sebaliknya.',
  },
  {
    q: 'Apakah data pribadi saya aman di AttaNovel?',
    a: 'Keamanan data pengguna adalah prioritas kami. AttaNovel menggunakan Firebase Authentication dan Firestore dari Google, yang dilengkapi enkripsi data standar industri. Kami tidak menjual atau membagikan data pribadimu kepada pihak ketiga. Kata sandi kamu tidak disimpan dalam bentuk teks biasa — semuanya dienkripsi oleh Firebase Auth.',
  },
  {
    q: 'Bagaimana cara mengubah foto profil dan informasi akun?',
    a: 'Buka halaman Profil dengan mengklik foto profilmu di pojok kanan atas, lalu pilih opsi "Edit Profil". Kamu bisa mengunggah foto profil (dari perangkat atau URL), mengubah nama tampilan, dan info lainnya. Untuk pengaturan akun lebih lanjut seperti email dan password, gunakan halaman Pengaturan yang tersedia di menu dropdown akun.',
  },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <span className="faq-question__icon"><Plus size={16} /></span>
      </button>
      <div className="faq-answer">{a}</div>
    </div>
  );
};

const FAQ = () => (
  <div className="faq-page">
    <div className="faq-page__hero">
      <div className="container">
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', marginBottom: 'var(--space-lg)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <HelpCircle size={30} style={{ color: 'var(--color-primary-light)' }} />
        </div>
        <h1>Pertanyaan yang Sering <span className="text-gradient">Ditanyakan</span></h1>
        <p>Temukan jawaban untuk pertanyaan umum seputar platform AttaNovel.</p>
      </div>
    </div>
    <div className="container">
      <div className="faq-list">
        {FAQ_DATA.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} />
        ))}
      </div>
    </div>
  </div>
);

export default FAQ;

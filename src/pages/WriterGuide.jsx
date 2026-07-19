// src/pages/WriterGuide.jsx — Panduan Penulis
import { BookOpen, PenLine, Star, Upload, BarChart2, Zap } from 'lucide-react';
import './StaticPage.css';

const SECTIONS = [
  {
    icon: <PenLine size={18} />,
    title: '1. Mulai Menulis',
    content: [
      'Daftarkan akun AttaNovel secara gratis — tidak ada biaya apapun.',
      'Klik tombol "Tulis" di navbar atau buka Dashboard Penulis dari menu profil.',
      'Pilih "Buat Novel Baru" dan isi formulir: judul, sinopsis, genre, dan cover.',
      'Novel baru secara otomatis berstatus Draft — aman dari publik hingga kamu siap.',
    ],
  },
  {
    icon: <BookOpen size={18} />,
    title: '2. Mengelola Bab',
    content: [
      'Di halaman Manajemen Novel, klik "Tambah Bab" untuk membuat bab baru.',
      'Setiap bab baru otomatis berstatus Draft — kamu bisa mengeditnya kapan saja.',
      'Gunakan editor teks kaya (rich text) untuk memformat isi bab.',
      'Klik "Simpan" untuk menyimpan draft, atau "Terbitkan" agar bab dapat dibaca publik.',
    ],
  },
  {
    icon: <Upload size={18} />,
    title: '3. Menerbitkan Novel',
    content: [
      'Setelah minimal satu bab diterbitkan, ubah status novel dari Draft ke Diterbitkan.',
      'Novel yang diterbitkan akan muncul di halaman Jelajahi dan dapat ditemukan oleh pembaca.',
      'Kamu tetap bisa mengedit bab-bab yang sudah diterbitkan kapan saja.',
      'Status karya dapat diubah: Ongoing, Tamat, Hiatus, Dropped, atau Rencana.',
    ],
  },
  {
    icon: <Star size={18} />,
    title: '4. Berinteraksi dengan Pembaca',
    content: [
      'Pembaca bisa menyukai, menyimpan, dan mengomentari novel dan bab kamu.',
      'Balas komentar pembaca melalui halaman baca — bangun komunitas yang aktif!',
      'Pantau statistik novel dari Dashboard Penulis: views, likes, dan bookmark.',
      'Leaderboard menampilkan novel terpopuler — jadikan karyamu masuk top 10!',
    ],
  },
  {
    icon: <BarChart2 size={18} />,
    title: '5. Tips untuk Penulis Sukses',
    content: [
      'Update secara rutin: pembaca setia datang kembali jika bab baru konsisten.',
      'Gunakan cover yang menarik — gambar pertama yang dilihat calon pembaca.',
      'Tulis sinopsis yang intriguing dan singkat — buat pembaca penasaran.',
      'Pilih genre yang tepat agar novelmu mudah ditemukan oleh target pembaca.',
      'Interaksi dengan komunitas penulis lain di halaman Sosial untuk saling mendukung.',
    ],
  },
  {
    icon: <Zap size={18} />,
    title: '6. Fitur Premium',
    content: [
      'AttaNovel terus berkembang dengan fitur-fitur baru yang memperkaya pengalaman menulis.',
      'Dashboard Penulis memberikan statistik lengkap tentang perkembangan karyamu.',
      'Manajemen bab yang canggih: ubah urutan, status, dan konten kapan saja.',
      'Semua fitur dasar AttaNovel sepenuhnya gratis untuk semua penulis.',
    ],
  },
];

const WriterGuide = () => (
  <div className="static-page">
    <div className="static-page__hero">
      <div className="container">
        <h1>Panduan <span className="text-gradient">Penulis</span></h1>
        <p>Semua yang perlu kamu tahu untuk mulai menulis dan menerbitkan karya di AttaNovel.</p>
      </div>
    </div>
    <div className="container">
      <div className="static-page__body">
        {SECTIONS.map((s, i) => (
          <div key={i} className="static-page__section">
            <h2>{s.icon} {s.title}</h2>
            <ul>
              {s.content.map((c, j) => <li key={j}>{c}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default WriterGuide;

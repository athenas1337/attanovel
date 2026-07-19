// src/pages/Privacy.jsx — Kebijakan Privasi
import { Lock, Eye, Database, Trash2, Mail } from 'lucide-react';
import './StaticPage.css';

const Privacy = () => (
  <div className="static-page">
    <div className="static-page__hero">
      <div className="container">
        <h1>Kebijakan <span className="text-gradient">Privasi</span></h1>
        <p>Terakhir diperbarui: Juli 2026. Kami berkomitmen melindungi privasi dan data pribadimu.</p>
      </div>
    </div>
    <div className="container">
      <div className="static-page__body">
        <div className="static-page__section">
          <h2><Database size={18} /> 1. Data yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan data yang kamu berikan secara langsung saat mendaftar dan menggunakan platform:</p>
          <ul>
            <li><strong>Informasi Akun:</strong> email, nama tampilan, dan foto profil.</li>
            <li><strong>Konten:</strong> novel, bab, komentar, dan pesan yang kamu buat.</li>
            <li><strong>Aktivitas:</strong> novel yang disukai, disimpan, dibaca, dan diikuti.</li>
            <li><strong>Data Teknis:</strong> data browser dan perangkat untuk keamanan dan peningkatan layanan.</li>
          </ul>
        </div>
        <div className="static-page__section">
          <h2><Eye size={18} /> 2. Bagaimana Kami Menggunakan Data</h2>
          <ul>
            <li>Menyediakan dan meningkatkan layanan AttaNovel.</li>
            <li>Menampilkan rekomendasi novel yang relevan buatmu.</li>
            <li>Memproses otentikasi dan menjaga keamanan akun.</li>
            <li>Menampilkan riwayat aktivitas di halaman profilmu.</li>
            <li>Kami <strong>tidak menjual</strong> data pribadimu kepada pihak ketiga.</li>
          </ul>
        </div>
        <div className="static-page__section">
          <h2><Lock size={18} /> 3. Keamanan Data</h2>
          <p>AttaNovel menggunakan Firebase dari Google sebagai infrastruktur backend, yang dilengkapi enkripsi data standar industri. Semua data ditransfer melalui koneksi HTTPS yang aman. Kata sandi tidak pernah disimpan dalam bentuk teks biasa.</p>
        </div>
        <div className="static-page__section">
          <h2><Trash2 size={18} /> 4. Hak Pengguna</h2>
          <ul>
            <li>Kamu berhak mengakses, memperbarui, atau menghapus data pribadimu.</li>
            <li>Kamu bisa menghapus akun dan semua data terkait kapan saja melalui halaman Pengaturan.</li>
            <li>Kamu bisa menarik konsen penggunaan data dengan menghubungi kami.</li>
          </ul>
        </div>
        <div className="static-page__section">
          <h2><Mail size={18} /> 5. Hubungi Kami</h2>
          <p>Jika ada pertanyaan atau kekhawatiran tentang privasi, hubungi kami di:</p>
          <p><strong>Email:</strong> privacy@attanovel.com</p>
          <p>Kami akan merespons dalam waktu 7 hari kerja.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Privacy;

// src/pages/Terms.jsx — Syarat & Ketentuan
import { FileText, Shield, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import './StaticPage.css';

const Terms = () => (
  <div className="static-page">
    <div className="static-page__hero">
      <div className="container">
        <h1>Syarat <span className="text-gradient">&amp; Ketentuan</span></h1>
        <p>Terakhir diperbarui: Juli 2026. Dengan menggunakan AttaNovel, kamu menyetujui ketentuan berikut.</p>
      </div>
    </div>
    <div className="container">
      <div className="static-page__body">
        <div className="static-page__section">
          <h2><FileText size={18} /> 1. Penggunaan Platform</h2>
          <p>AttaNovel adalah platform menulis dan membaca novel berbasis web. Kamu boleh menggunakan layanan ini untuk tujuan pribadi dan non-komersial selama mematuhi ketentuan ini. Kamu harus berusia minimal 13 tahun untuk menggunakan AttaNovel.</p>
          <ul>
            <li>Dilarang mengunggah konten yang melanggar hak cipta orang lain.</li>
            <li>Dilarang menyebarkan konten yang bersifat SARA, kekerasan ekstrem, atau pornografi.</li>
            <li>Satu akun per pengguna — dilarang membuat akun palsu atau menyamar sebagai orang lain.</li>
          </ul>
        </div>
        <div className="static-page__section">
          <h2><Shield size={18} /> 2. Konten dan Hak Kekayaan Intelektual</h2>
          <p>Semua konten yang kamu terbitkan di AttaNovel tetap menjadi hak milikmu. Dengan menerbitkan karya, kamu memberikan AttaNovel lisensi terbatas dan non-eksklusif untuk menampilkan, mendistribusikan, dan mempromosikan karyamu dalam platform ini.</p>
          <ul>
            <li>Jangan publikasikan karya yang bukan milikmu tanpa izin penulis asli.</li>
            <li>AttaNovel berhak menghapus konten yang melanggar ketentuan ini.</li>
          </ul>
        </div>
        <div className="static-page__section">
          <h2><AlertTriangle size={18} /> 3. Larangan</h2>
          <ul>
            <li>Tidak diizinkan melakukan scraping, crawling, atau mengambil data secara otomatis dari platform.</li>
            <li>Tidak diizinkan menggunakan platform untuk spam, phishing, atau aktivitas penipuan.</li>
            <li>Tidak diizinkan mengunggah malware, virus, atau kode berbahaya dalam bentuk apapun.</li>
            <li>Tidak diizinkan mengganggu, mengancam, atau melecehkan pengguna lain.</li>
          </ul>
        </div>
        <div className="static-page__section">
          <h2><Scale size={18} /> 4. Penafian</h2>
          <p>AttaNovel disediakan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan platform, termasuk kehilangan data, gangguan layanan, atau kesalahan konten yang diunggah pengguna.</p>
        </div>
        <div className="static-page__section">
          <h2><RefreshCw size={18} /> 5. Perubahan Ketentuan</h2>
          <p>AttaNovel berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui pengumuman di platform. Penggunaan berkelanjutan setelah perubahan berlaku dianggap sebagai persetujuan terhadap ketentuan baru.</p>
          <p>Jika ada pertanyaan, hubungi kami melalui email: <strong>support@attanovel.com</strong></p>
        </div>
      </div>
    </div>
  </div>
);

export default Terms;

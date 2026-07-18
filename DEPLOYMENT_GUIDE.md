# 🏰 Panduan Langkah-demi-Langkah: Deploy AttaNovel ke GitHub Pages & Firebase

Panduan ini menjelaskan secara sangat detail mulai dari **Langkah 3 (Deploy ke GitHub Pages)** hingga konfigurasi akhir Firebase agar website Anda dapat online secara penuh dan aman.

---

## 🚀 LANGKAH 3: Membuat Repository & Upload ke GitHub

Di langkah ini, kita akan membuat tempat penyimpanan kode (Repository) di GitHub dan mengunggah kode website dari komputer Anda ke sana.

### A. Persiapan Awal
1. **Pastikan Anda memiliki akun GitHub.** Jika belum, daftar gratis di [github.com](https://github.com).
2. **Pastikan Git terinstall di komputer Anda.**
   - Jika belum, unduh dan install dari [git-scm.com](https://git-scm.com).
   - Setelah install, buka PowerShell/Terminal dan jalankan perintah ini untuk mendaftarkan identitas Anda (ganti dengan nama/email Anda):
     ```powershell
     git config --global user.name "Nama Anda"
     git config --global user.email "emailanda@example.com"
     ```

### B. Membuat Repository di GitHub (Lewat Web browser)
1. Buka [github.com](https://github.com) dan login.
2. Di pojok kanan atas, klik tombol **"+"** lalu pilih **"New repository"**.
3. Isi kolom sebagai berikut:
   - **Repository name**: `attanovel` *(Gunakan huruf kecil semua. Nama ini harus sama persis dengan nama subfolder proyek agar link web berfungsi).*
   - **Description**: `Website AttaNovel oleh Atha` (opsional).
   - **Public/Private**: Pilih **Public** *(GitHub Pages gratis memerlukan repository berstatus Public).*
   - **Initialize this repository with**: **JANGAN** centang apapun (jangan centang README, .gitignore, atau license). Biarkan kosong.
4. Klik tombol hijau **"Create repository"** di bagian paling bawah.
5. Anda akan diarahkan ke halaman petunjuk. Biarkan halaman tersebut terbuka.

### C. Menghubungkan & Upload Kode (Lewat PowerShell)
1. Buka **PowerShell** di Windows Anda.
2. Masuk ke folder proyek AttaNovel dengan menjalankan perintah ini:
   ```powershell
   cd "C:\Users\User\.gemini\antigravity\scratch\attanovel"
   ```
3. Jalankan perintah Git berikut satu per satu:
   - **Inisialisasi Git lokal:**
     ```powershell
     git init
     ```
   - **Tambahkan semua file ke Git:**
     ```powershell
     git add .
     ```
   - **Buat catatan penyimpanan pertama (Commit):**
     ```powershell
     git commit -m "Commit pertama: Fitur lengkap AttaNovel oleh Atha"
     ```
   - **Ubah nama branch utama menjadi main:**
     ```powershell
     git branch -M main
     ```
   - **Hubungkan folder komputer dengan GitHub** *(Ganti `USERNAME` dengan username GitHub asli Anda):*
     ```powershell
     git remote add origin https://github.com/USERNAME/attanovel.git
     ```
   - **Upload (Push) kode ke GitHub:**
     ```powershell
     git push -u origin main
     ```
     *Catatan: Jika muncul jendela pop-up meminta login ke GitHub, silakan klik "Sign in with your browser" dan izinkan otorisasi.*

---

## 🔐 LANGKAH 4: Mengatur GitHub Secrets (Keamanan Konfigurasi Firebase)

Karena kita mengunggah kode ke repository **Public**, kita tidak boleh menuliskan API Key Firebase secara langsung di dalam kode GitHub. Kita akan menggunakan **GitHub Secrets** untuk menyimpannya dengan aman.

1. Buka halaman repository **attanovel** Anda di GitHub.
2. Klik tab **"Settings"** (ikon gerigi di baris menu atas).
3. Di sidebar menu sebelah kiri, cari bagian **"Security"**, lalu klik **"Secrets and variables"** -> **"Actions"**.
4. Klik tombol abu-abu **"New repository secret"** di kanan atas.
5. Masukkan nama secret dan nilainya satu per satu berdasarkan data Firebase Anda:

| Buat Secret Baru (Name) | Isi Nilai Secret (Value) | Contoh Bentuk Nilai |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Isi dengan API Key Anda | `AIzaSyA1b2C3d4E5f6G7...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Isi dengan Auth Domain | `attanovel-xxxxx.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Isi dengan Project ID | `attanovel-xxxxx` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Isi dengan Storage Bucket | `attanovel-xxxxx.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Isi dengan Messaging Sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Isi dengan App ID | `1:1234:web:abcd1234ef` |

*Pastikan tidak ada spasi di awal atau akhir nilai saat Anda menyalinnya.*

---

## 🌐 LANGKAH 5: Mengaktifkan GitHub Actions & GitHub Pages

Kita akan memerintahkan GitHub untuk memproses file `.github/workflows/deploy.yml` yang sudah kita buat agar otomatis melakukan build dan hosting.

1. Masih di menu **"Settings"** repository GitHub Anda.
2. Di sidebar menu sebelah kiri, klik menu **"Pages"** (di bawah bagian *Code and automation*).
3. Di bagian **"Build and deployment"** -> **"Source"**, klik menu dropdown yang awalnya bertuliskan *"Deploy from a branch"*, lalu ubah menjadi **"GitHub Actions"**.
4. Selesai! Proses deploy otomatis akan langsung berjalan.

### Cara Memantau Proses Deploy:
1. Klik tab **"Actions"** (di baris menu atas repository).
2. Anda akan melihat alur kerja (workflow) bernama *Deploy AttaNovel to GitHub Pages* sedang berjalan (ditandai dengan lingkaran kuning berputar).
3. Klik pada nama workflow tersebut untuk melihat detailnya.
4. Jika lingkaran berubah menjadi **centang hijau**, berarti website Anda sudah sukses online!
5. Alamat website Anda akan berformat:
   **`https://USERNAME.github.io/attanovel/`**
   *(Ganti USERNAME dengan username GitHub Anda).*

---

## 🔑 LANGKAH 6: Mengizinkan Login Google (Authorized Domains)

Agar fitur **Login dengan Google** berfungsi saat website diakses secara online, Firebase perlu mengenali domain GitHub Pages Anda sebagai domain yang aman.

1. Buka [Firebase Console](https://console.firebase.google.com) dan pilih proyek Anda.
2. Di sidebar kiri, klik **"Build"** -> **"Authentication"**.
3. Klik tab **"Settings"** di bagian atas halaman Authentication.
4. Di menu sebelah kiri tab Settings, klik **"Authorized domains"**.
5. Klik tombol **"Add domain"**.
6. Masukkan domain GitHub Pages Anda:
   `USERNAME.github.io`
   *(Ganti `USERNAME` dengan nama akun GitHub Anda. Jangan masukkan "https://" atau "/attanovel" di sini. Cukup nama domain dasarnya saja).*
7. Klik **"Add"**.

---

## 🛡️ LANGKAH 7: Mengonfigurasi Aturan Keamanan (Rules) Firebase

Aturan ini wajib dipasang agar orang asing tidak bisa merusak, menghapus, atau membajak database novel milik pengguna lain.

### A. Mengatur Aturan Database (Firestore Rules)
1. Di Firebase Console, klik **"Build"** -> **"Firestore Database"**.
2. Klik tab **"Rules"** di bagian atas.
3. Hapus kode bawaan yang ada di kotak editor, lalu tempelkan (paste) aturan keamanan berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Aturan untuk Profil User
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Aturan untuk Novel
    match /novels/{novelId} {
      // Siapapun bisa membaca novel yang statusnya 'published'
      // Draft hanya bisa dibaca oleh penulisnya sendiri
      allow read: if resource.data.status == 'published' || 
                     (request.auth != null && request.auth.uid == resource.data.authorId);
      
      // Membuat novel baru wajib login
      allow create: if request.auth != null;
      
      // Update dan delete novel hanya bisa dilakukan oleh pembuat/penulisnya
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.authorId;
      
      // Aturan untuk Bab (Chapters) di dalam Novel
      match /chapters/{chapterId} {
        allow read: if get(/databases/$(database)/documents/novels/$(novelId)).data.status == 'published' ||
                       (request.auth != null && request.auth.uid == 
                        get(/databases/$(database)/documents/novels/$(novelId)).data.authorId);
        allow write: if request.auth != null && 
                        request.auth.uid == get(/databases/$(database)/documents/novels/$(novelId)).data.authorId;
        
        // Aturan untuk Komentar
        match /comments/{commentId} {
          allow read: if true;
          allow create: if request.auth != null;
          allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
        }
      }
    }
  }
}
```
4. Klik tombol **"Publish"** di kanan atas untuk menyimpan.

### B. Mengatur Aturan Gambar (Storage Rules)
1. Di Firebase Console, klik **"Build"** -> **"Storage"**.
2. Klik tab **"Rules"** di bagian atas.
3. Ganti kode aturan bawaan dengan kode berikut:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Aturan untuk gambar sampul novel (maksimal 5MB)
    match /covers/{novelId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
    
    // Aturan untuk gambar di dalam bab cerita (maksimal 10MB)
    match /chapters/{novelId}/{chapterId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```
4. Klik tombol **"Publish"** untuk mengaktifkan aturan keamanan gambar.

---

## 🎉 SELESAI!
Website **AttaNovel** Anda sekarang telah ter-deploy dengan sempurna secara gratis di GitHub Pages, lengkap dengan database cloud Firebase yang aman dan fitur login interaktif. Anda dapat membagikan link website Anda ke teman-teman Anda untuk mulai menulis dan saling berkomentar!

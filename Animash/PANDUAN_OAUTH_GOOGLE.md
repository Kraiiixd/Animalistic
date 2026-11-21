# Panduan Langkah-demi-Langkah Membuat Google OAuth Client untuk Animash

Panduan ini membantu Anda mendapatkan **Google Client ID** dan **Google Client Secret** agar fitur **"Masuk dengan Google"** aktif dan akun `wmungkin@gmail.com` otomatis menjadi **OWNER**.

---

## Langkah 1: Buka Google Cloud Console & Buat Project
1. Buka [Google Cloud Console](https://console.cloud.google.com/) dan login dengan akun Google Anda (`wmungkin@gmail.com`).
2. Di pojok kiri atas (sebelah logo Google Cloud), klik pemilih project lalu klik **New Project** (Project Baru).
3. Beri nama project, misalnya: `Animash Streaming`, lalu klik **Create**.
4. Pastikan project yang baru dibuat telah dipilih di bilah atas.

---

## Langkah 2: Konfigurasi Layar Persetujuan (OAuth Consent Screen)
1. Buka menu navigasi kiri: **APIs & Services** > **OAuth consent screen** (atau cari "OAuth consent screen" di search bar atas).
2. Pilih User Type: **External**, lalu klik **Create**.
3. Isi data aplikasi:
   - **App name**: `Animash`
   - **User support email**: pilih email Anda (`wmungkin@gmail.com`)
   - **Developer contact information**: masukkan `wmungkin@gmail.com`
4. Klik **Save and Continue**.
5. Pada bagian **Scopes**, klik **Add or Remove Scopes**, centang 3 scope dasar:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
   Lalu klik **Update** dan **Save and Continue**.
6. Pada bagian **Test users** (jika masih berstatus Testing):
   - Klik **Add Users** dan masukkan `wmungkin@gmail.com` agar akun Anda bisa langsung login.
   - Atau klik **Publish App** agar semua akun Google bisa login ke Animash.
7. Klik **Save and Continue** sampai selesai.

---

## Langkah 3: Buat OAuth 2.0 Client ID
1. Masuk ke menu **APIs & Services** > **Credentials**.
2. Klik tombol **+ CREATE CREDENTIALS** di bagian atas, pilih **OAuth client ID**.
3. Pilih Application type: **Web application**.
4. Beri nama, misalnya: `Animash Web Client`.
5. Di bagian **Authorized JavaScript origins**, tambahkan URL domain Anda:
   - Untuk testing lokal / pod: `http://localhost:3000`
   - Untuk production (jika ada): `https://domainanda.com`
6. Di bagian **Authorized redirect URIs** (Sangat Penting):
   - Untuk testing lokal / pod: `http://localhost:3000/auth/google/callback`
   - Untuk production (jika ada): `https://domainanda.com/auth/google/callback`
7. Klik **Create**.
8. Dialog pop-up akan menampilkan:
   - **Your Client ID** (misal: `123456789-abcdef.apps.googleusercontent.com`)
   - **Your Client Secret** (misal: `GOCSPX-abc123xyz...`)

---

## Langkah 4: Masukkan Kredensial ke File `.env`
Buka file `.env` di folder project Animash dan tempelkan nilai yang Anda dapatkan:

```env
GOOGLE_CLIENT_ID=masukkan_client_id_disini
GOOGLE_CLIENT_SECRET=masukkan_client_secret_disini
```

---

## Langkah 5: Jalankan Animash & Uji Coba Login
1. Jalankan aplikasi:
   ```bash
   npm start
   # atau jika di pod/container:
   ./start.sh
   ```
2. Buka browser ke `http://localhost:3000/login`.
3. Klik tombol **"Masuk dengan Google"**.
4. Login menggunakan akun `wmungkin@gmail.com`.
5. Sistem akan otomatis mendeteksi email Anda dan mengangkat akun Anda menjadi **OWNER** dengan badge mahkota 👑 dan akses penuh ke panel admin di `http://localhost:3000/admin`.

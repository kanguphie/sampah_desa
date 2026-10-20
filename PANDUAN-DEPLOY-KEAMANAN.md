# Panduan Deploy Pembaruan Keamanan SapaDesa

Dokumen ini adalah urutan langkah untuk menerapkan pembaruan keamanan
(branch `security-hardening`) ke server produksi **dan** mengganti
(rotasi) password database yang lama.

> **Kenapa password harus diganti?**
> Password database lama pernah tertulis langsung di `docker-compose.yml`
> dan ter-commit di repo GitHub yang public. Walaupun file-nya sekarang
> sudah bersih, password lama itu tetap bisa dibaca dari riwayat Git,
> jadi harus dianggap **bocor**. Mengganti kodenya saja tanpa mengganti
> password = tidak ada gunanya.

> **Kenapa urutan langkah penting?**
> Setelah versi baru aktif, API mewajibkan token login. Frontend lama
> tidak mengirim token, jadi **backend baru + frontend lama = aplikasi
> rusak** (semua panggilan API ditolak 401). Pada stack docker-compose
> di repo ini, frontend dan backend terbangun dalam satu image yang
> sama, jadi satu kali redeploy memperbarui keduanya bersamaan.
> Jika di servermu frontend dan backend ternyata terpisah, deploy
> **frontend dulu, baru backend** — jangan sebaliknya.

---

## Persiapan (sebelum menyentuh server)

### 1. Buat password & secret BARU

Jalankan di komputer mana saja yang punya openssl (atau di server):

```bash
openssl rand -hex 24   # untuk DB_PASSWORD baru
openssl rand -hex 24   # untuk DB_ROOT_PASSWORD baru
openssl rand -hex 32   # untuk AUTH_SECRET
```

Catatan:

- Hasil `openssl rand -hex` hanya berisi huruf dan angka, aman dipakai
  di file `.env`. Hindari password berisi karakter `$`, `#`, atau spasi
  karena bisa merusak pembacaan file `.env` oleh docker compose.
- Simpan ketiga nilai baru ini di password manager / catatan aman.
  **Jangan kirim lewat chat dalam bentuk apa pun ke siapa pun.**

### 2. Cadangkan dulu (wajib)

1. Login ke aplikasi sebagai admin → menu **Pengaturan** → unduh
   **Backup** data.
2. Kalau bisa akses server: buat juga snapshot/backup volume database
   `sapadesa_db_data` dari Proxmox/Portainer.

### 3. Pilih waktu sepi

Ada jeda mati (downtime) beberapa menit saat password database diganti.
Lakukan di luar jam pengambilan sampah / jam kerja petugas.

---

## Langkah Deploy

### Langkah 1 — Hentikan container aplikasi saja (database tetap jalan)

Lewat **Portainer**: buka container `sapadesa_app` → **Stop**.
Atau lewat terminal server:

```bash
docker stop sapadesa_app
```

### Langkah 2 — Ganti password DI DALAM MySQL

Mengubah variabel di docker-compose **tidak** mengubah password user
yang sudah ada di dalam database — itu hanya berlaku saat volume
database pertama kali dibuat. Jadi password harus diganti dari dalam
MySQL dengan perintah `ALTER USER`, memakai password root yang **lama**
untuk login:

```bash
docker exec -it sapadesa_db mysql -uroot -p
# masukkan password root LAMA saat diminta

ALTER USER 'sapadesa_user'@'%' IDENTIFIED WITH mysql_native_password BY '<DB_PASSWORD_BARU>';
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '<DB_ROOT_PASSWORD_BARU>';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '<DB_ROOT_PASSWORD_BARU>';
FLUSH PRIVILEGES;
EXIT;
```

Jika salah satu perintah `ALTER USER ... 'root'@'%'` menampilkan error
"user does not exist", abaikan saja — artinya host itu memang tidak ada,
yang penting user aplikasi (`sapadesa_user`) dan `root@localhost`
berhasil diganti.

Verifikasi cepat (harus berhasil masuk dengan password baru):

```bash
docker exec -it sapadesa_db mysql -usapadesa_user -p -e "SELECT 1"
```

### Langkah 3 — Perbarui kode & isi variabel lingkungan di stack

1. Pastikan branch `security-hardening` sudah ter-push dan (disarankan)
   di-merge ke branch utama, lalu arahkan stack ke kode terbaru itu.
2. Di **Portainer** → Stack `sapadesa` → **Environment variables**
   (atau file `.env` di sebelah `docker-compose.yml` bila stack dijalankan
   manual) isi:

   ```
   DB_PASSWORD=<DB_PASSWORD_BARU>
   DB_ROOT_PASSWORD=<DB_ROOT_PASSWORD_BARU>
   AUTH_SECRET=<AUTH_SECRET_BARU>
   ```

   `DB_NAME` dan `DB_USER` boleh dikosongkan (nilainya tetap
   `sapadesa` dan `sapadesa_user`).
3. `AUTH_SECRET` jangan pernah diganti-ganti setelah ini, kecuali
   memang ingin memaksa **semua** pengguna logout dan login ulang.

> Peringatan: bila variabel di atas kosong, versi baru memang sengaja
> **gagal start** (pengaman dari compose) supaya tidak diam-diam jalan
> tanpa password / tanpa secret.

### Langkah 4 — Redeploy stack

Di Portainer: **Stacks → sapadesa → Update the stack** (aktifkan
*Re-pull image and redeploy* bila stack mengambil image dari registry;
bila stack me-build dari repo, lakukan *pull* kode terbaru lalu deploy
ulang).

Pantau log container `sapadesa_app` sampai muncul:

```
Server SapaDesa running on http://localhost:3000
Database Schema Verified & Migrated.
```

Tidak boleh ada peringatan `[SECURITY] AUTH_SECRET belum di-set` di log.
Bila peringatan itu muncul, variabel `AUTH_SECRET` belum terbaca —
perbaiki dulu sebelum lanjut.

---

## Pemeriksaan Setelah Deploy (checklist)

Ganti `https://sapadesa.rowosari.my.id` dengan alamat produksimu bila beda.

- [ ] Health check publik menjawab:
      `curl https://sapadesa.rowosari.my.id/api/health` → `{"status":"ok",...}`
- [ ] API privat kini menolak tanpa login:
      `curl https://sapadesa.rowosari.my.id/api/backup` → **401**
      (sebelum pembaruan ini perintah tsb. mengunduh seluruh database!)
- [ ] Halaman publik terbuka normal (statistik, pengumuman, jadwal tampil)
- [ ] Cek mandiri warga dengan ID kartu QR tampil seperti biasa
- [ ] Login **admin** berhasil → dashboard, laporan, keuangan, backup terbuka
- [ ] Login **petugas** berhasil → scan QR dan catat pembayaran bisa
- [ ] Petugas membuka menu admin (mis. keuangan) → ditolak / tidak bisa
- [ ] Semua pengguna lama diminta login ulang **sekali** — ini normal,
      karena sesi sekarang memakai token baru

## Jika Ada Masalah (rollback)

1. Kembalikan kode stack ke commit sebelum `security-hardening`.
2. Kembalikan password di dalam MySQL ke nilai **lama** dengan cara yang
   sama seperti Langkah 2 (login memakai password root **baru**,
   `ALTER USER` ke password lama) — atau pulihkan volume database dari
   backup/snapshot Langkah Persiapan bila keadaannya lebih parah.
3. Kembalikan variabel stack ke nilai lama, redeploy.
4. Catat error-nya dari log `sapadesa_app`, lalu perbaiki di lingkungan
   uji dulu sebelum mencoba deploy lagi.

## Setelah Selesai

- [ ] Password lama resmi pensiun: tidak dipakai lagi di mana pun.
- [ ] Nilai baru tersimpan aman (password manager), bukan di chat / kertas.
- [ ] Pertimbangkan sekalian mengganti **PIN admin utama** dari menu
      Profil, karena PIN itu juga pernah menjadi bagian dari data contoh
      awal aplikasi.
- [ ] Riwayat Git lama masih menyimpan password lama — itu sudah tidak
      masalah **karena password-nya sudah diganti**. Menulis ulang
      riwayat Git (force-push) bersifat opsional dan berisiko, tidak
      wajib dilakukan.

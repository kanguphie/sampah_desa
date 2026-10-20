# Panduan Final Deploy SapaDesa — SATU Urutan Lengkap
### Pembaruan keamanan + desain baru + password database baru (jalur backup → hapus volume → restore)

Dokumen ini adalah **satu-satunya urutan yang perlu diikuti** untuk
deploy kali ini. Ia menggabungkan dan menggantikan peran dua panduan
sebelumnya (`PANDUAN-DEPLOY-KEAMANAN.md` dan
`PANDUAN-ROTASI-PASSWORD-PORTAINER.md`) untuk jalur yang dipilih:
**tanpa perintah SQL**, password diganti dengan cara menghapus
volume database dan me-restore dari file backup JSON.

Pembagian tugas:

- **[SAYA]** = Lutfi, dikerjakan di Portainer / aplikasi.
- **[CLAUDE]** = dikerjakan Muse (push kode ke GitHub). Lutfi cukup
  bilang "mulai" dan login GitHub saat diminta (lewat halaman aman,
  bukan lewat chat).

> **Kenapa urutannya seperti ini?**
> 1. Env diisi **sebelum** kode baru masuk → saat kode baru ter-deploy,
>     penampung `${DB_PASSWORD}` dll. sudah ada isinya. Kalau kode
>     baru masuk duluan tanpa env, deploy **gagal** (memang disengaja,
>     sebagai pengaman).
> 2. Volume dihapus **saat stack berhenti dan sebelum kode baru
>     ter-deploy** → database baru lahir dari kode baru + env baru.
>     Kalau volumenya dihapus saat kode masih lama, database lahir
>     kembali dengan password lama yang bocor — sia-sia.
> 3. Restore dilakukan **segera** setelah situs menyala → selama
>     tabel admin masih kosong, pintu login darurat PIN `123456`
>     terbuka. Restore menutupnya. Jangan tinggalkan situs dalam
>     keadaan ini.

Waktu total: ±30–45 menit. Situs tidak bisa diakses sejak Fase 2
sampai Fase 5 (±15–25 menit). **Lakukan di waktu sepi.**

---

## Fase 0 — Persiapan (situs masih menyala normal)

- [ ] **[SAYA]** Buat 3 nilai baru (huruf+angka saja, min. 24 karakter —
      cara buatnya ada di `PANDUAN-ROTASI-PASSWORD-PORTAINER.md`
      bagian P1): `DB_PASSWORD` baru, `DB_ROOT_PASSWORD` baru,
      `AUTH_SECRET` baru. Simpan di catatan aman, beri label jelas.
      **Jangan kirim ke siapa pun lewat chat.**
- [ ] **[SAYA]** Unduh backup terbaru dari aplikasi:
      login admin → **Pengaturan → Backup** → simpan file JSON-nya.
- [ ] **[SAYA]** Simpan file JSON itu di **2 tempat** berbeda
      (mis. laptop + flashdisk/Google Drive pribadi).
- [x] **[CLAUDE]** Sudah memeriksa file backup 2026-10-20:
      **lengkap & valid** — 645 warga (ID utuh mulai 100001),
      4 dukuh, 5 RT, 1 admin, 1 petugas, 6 jadwal, profil desa +
      logo; tabel transaksi/pengeluaran/pengumuman memang masih
      kosong karena aplikasi baru berjalan. *(Ulangi unduh backup
      di hari eksekusi bila setelah tanggal ini sudah ada data baru
      yang masuk.)*

**Berhenti & kabari Muse dulu bila:** file backup tidak terunduh,
atau isinya tidak seperti ringkasan di atas.

---

## Fase 1 — Isi Environment Variables di stack (situs MASIH menyala)

Mengisi ini sekarang **tidak berpengaruh apa pun** ke situs yang
sedang berjalan (kode lama tidak memakai variabel ini), jadi fase
ini aman dikerjakan kapan saja, bahkan sehari sebelumnya.

- [ ] **[SAYA]** Portainer → **Stacks** → klik stack **`sapadesa-app`**
- [ ] **[SAYA]** Gulir ke bagian **Environment variables**, klik
      untuk membukanya
- [ ] **[SAYA]** Klik **Add environment variable**, tambahkan 3 baris
      (nama harus persis, termasuk huruf besar & garis bawah):

      | name | value |
      |---|---|
      | `DB_PASSWORD` | nilai baru #1 |
      | `DB_ROOT_PASSWORD` | nilai baru #2 |
      | `AUTH_SECRET` | nilai baru #3 |

- [ ] **[SAYA]** Klik **Save settings**
- [ ] **[SAYA]** Periksa sekali lagi ejaan namanya sebelum lanjut.
      Salah satu huruf saja = deploy gagal nanti.

> Setelah fase ini, jangan screenshot bagian Environment variables
> untuk dibagikan ke siapa pun.

---

## Fase 2 — Berhenti & hapus volume database

Mulai fase ini situs **mati** sampai Fase 5. Pastikan Fase 0–1
sudah beres semua.

- [ ] **[SAYA]** Portainer → **Containers** → beri centang pada
      **kedua** baris (`sapadesa_app` dan `sapadesa_db`) → klik
      **Stop**. Tunggu keduanya berstatus `exited`.
- [ ] **[SAYA]** Masih di **Containers**: centang baris
      **`sapadesa_db`** saja → klik **Remove** → konfirmasi.
      (Hanya container databasenya yang dihapus; container aplikasi
      biarkan ada.)
- [ ] **[SAYA]** Portainer → menu **Volumes** → cari volume bernama
      **`sapadesa_db_data`** (mungkin tampil dengan awalan
      `sapadesa-app_`, menjadi `sapadesa-app_sapadesa_db_data`)
      → centang → **Remove** → konfirmasi.

      ⚠️ **JANGAN** menghapus volume `sapadesa_uploads` — isinya
      file logo & unggahan yang **tidak** ada di file backup JSON.

- [ ] **[SAYA]** Pastikan volume database benar-benar hilang dari
      daftar sebelum lanjut.

**Berhenti & kabari Muse dulu bila:** volume tidak mau terhapus
(biasanya karena masih ada container yang memakainya — cek lagi
langkah hapus container di atas).

---

## Fase 3 — Push kode baru ke GitHub

- [ ] **[CLAUDE]** Menggabungkan branch `security-hardening` +
      `redesign-landing` ke `main` lalu push ke
      `github.com/kanguphie/sampah_desa`.
- [ ] **[SAYA]** Login ke GitHub saat Muse meminta (lewat halaman
      login aman di browser — Muse tidak pernah meminta
      password/token lewat chat).

Begitu push selesai, stack Portainer-mu (Polling tiap 5 menit) akan
**mulai men-deploy sendiri** — itu memang yang kita mau, lanjut
langsung ke Fase 4 tanpa menunggu lama.

---

## Fase 4 — Deploy & pantau

- [ ] **[SAYA]** Portainer → **Stacks** → `sapadesa-app`. Bila
      dalam ±5 menit belum mulai men-deploy, klik
      **Pull and redeploy**.
- [ ] **[SAYA]** Tunggu container dibuat ulang (±2–5 menit, ada
      proses build). Lalu cek **Containers**: `sapadesa_db` dan
      `sapadesa_app` keduanya harus kembali `running`.
- [ ] **[SAYA]** Klik ikon **Logs** pada `sapadesa_app`, cari dua
      baris ini:

      ```
      Database Schema Verified & Migrated.
      Server SapaDesa running on http://localhost:3000
      ```

- [ ] **[SAYA]** Buka `https://sapadesa.rowosari.my.id` — halaman
      depan dengan **desain baru** harus sudah tampil (itu tanda
      kode baru aktif). Statistik mungkin masih 0/kosong — wajar,
      database masih kosong, diisi di Fase 5.

**Berhenti & kabari Muse dulu bila:** log berisi `Access denied`,
atau tulisan `[SECURITY] AUTH_SECRET belum di-set`, atau container
`restart` berulang-ulang. Jangan mengutak-atik volume lagi.

---

## Fase 5 — Restore data dari file JSON (segera, jangan ditunda)

- [ ] **[SAYA]** Di situs, klik **Login Sistem** → login sebagai
      admin dengan PIN darurat **`123456`**.
      (PIN ini hanya berfungsi selama database masih kosong —
      justru karena itu fase ini tidak boleh ditunda.)
- [ ] **[SAYA]** Masuk menu **Pengaturan → Restore** → unggah file
      JSON backup dari Fase 0 → jalankan restore → tunggu sampai
      selesai dan semua tabel dilaporkan berhasil.
- [ ] **[SAYA]** **Logout**, lalu login lagi dengan **PIN admin
      aslimu** (yang dari data lama). Harus bisa masuk — dan PIN
      `123456` sekarang harus **sudah tidak bisa** dipakai lagi.
- [ ] **[SAYA]** Login sebagai **petugas** dengan PIN petugas lama —
      harus bisa masuk juga.

---

## Fase 6 — Pemeriksaan akhir

- [ ] Jumlah warga kembali **645** dan data dukuh/RT sesuai
      (sesuaikan dengan backup terakhir bila berbeda)
- [ ] Jadwal pengambilan tampil seperti semula
- [ ] Cek iuran mandiri: masukkan ID warga contoh (mis. `100001`)
      di halaman depan → data warga tampil
- [ ] Profil desa & logo tampil benar
- [ ] Uji keamanan: buka `https://sapadesa.rowosari.my.id/api/backup`
      langsung di browser → harus menjawab **`401`** / ditolak
      (sebelum pembaruan, alamat ini mengunduh seluruh database
      tanpa login!)
- [ ] Beri tahu petugas bahwa situs sudah aktif lagi; semua pengguna
      akan diminta login ulang sekali — itu normal

**Selesai.** Password lama resmi mati: database yang sekarang hidup
lahir dari password baru di Environment variables, dan password lama
yang bocor di riwayat GitHub sudah tidak berlaku di mana pun.

---

## Jika harus batal di tengah jalan

- **Batal sebelum Fase 2:** tidak ada yang berubah. Hapus saja isian
  env bila mau; situs tetap versi lama dan menyala normal.
- **Batal di Fase 2 (volume sudah terhapus, kode baru belum masuk):**
  nyalakan lagi stack versi lama (**Pull and redeploy**) → database
  akan lahir kosong dari kode lama → login PIN `123456` → restore
  file JSON yang sama → situs kembali hidup seperti sebelum mulai
  (dengan password lama; ulangi proses ini lain waktu).
- **Batal di Fase 4–5:** jangan menghapus volume lagi dan jangan
  mengubah env. Kabari Muse dengan menyalin isi log terakhir dari
  `sapadesa_app` (log tidak berisi password, aman dibagikan).

## Yang TIDAK boleh dilakukan kapan pun

- Menulis password/`AUTH_SECRET` ke file `docker-compose.yml` atau
  file apa pun di GitHub.
- Mengirim 3 nilai baru itu lewat chat/WhatsApp/screenshot.
- Menghapus volume `sapadesa_uploads`.
- Menekan **Remove** pada stack `sapadesa-app` (menghapus stack
  akan membuang juga isian Environment variables yang sudah
  susah-payah diisi; untuk proses ini stack **cukup di-Stop**,
  bukan dihapus).

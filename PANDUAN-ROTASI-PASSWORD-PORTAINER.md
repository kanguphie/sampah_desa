# Panduan Ganti Password Database SapaDesa lewat Portainer
### (Versi pelan-pelan, klik demi klik — untuk stack `sapadesa-app`)

Panduan ini menemani `PANDUAN-DEPLOY-KEAMANAN.md`. Bedanya: panduan ini
menjelaskan **setiap klik di Portainer** secara detail, khusus untuk
bagian yang paling sering membingungkan: mengganti password database
dari dalam MySQL.

---

## Gambaran besarnya dulu (baca ini, penting)

Ada **3 hal** yang akan kamu lakukan, berurutan, dalam satu sesi
(jangan ditinggal di tengah-tengah):

1. **Ganti password di dalam database** — lewat terminal (Console)
   milik container database di Portainer, memakai perintah SQL.
2. **Tulis password baru itu di pengaturan stack** — di bagian
   *Environment variables* pada halaman stack (bagian yang terlihat
   di screenshot Portainer-mu).
3. **Deploy ulang** — supaya aplikasi memakai password baru.

Kenapa tidak cukup langkah 2 saja? Karena daftar *Environment
variables* itu hanya dibaca database **saat database pertama kali
dibuat**. Database-mu sudah berjalan berbulan-bulan, jadi password
aslinya tersimpan di dalam database itu sendiri, dan hanya bisa
diganti dari dalam (langkah 1). Langkah 2 tetap wajib: supaya
aplikasi tahu password barunya.

Kenapa harus satu sesi berurutan? Setelah password database diganti
(langkah 1), aplikasi lama **tidak bisa lagi masuk ke database**
sampai langkah 2–3 selesai. Jadi siapkan waktu sepi (misalnya malam
hari), kira-kira 15–30 menit, situs akan mati sementara.

Istilah yang akan muncul:

| Istilah | Artinya |
|---|---|
| `sapadesa_app` | Container aplikasi web-mu |
| `sapadesa_db` | Container database MySQL |
| `sapadesa_user` | Akun database yang dipakai aplikasi sehari-hari |
| `root` | Akun database tertinggi (seperti "super admin"-nya MySQL) |
| Console | Terminal hitam di dalam Portainer untuk mengetik perintah di dalam container |

---

## Persiapan

### P1. Siapkan 3 nilai BARU

Kamu butuh tiga nilai baru yang acak:

- `DB_PASSWORD` baru — untuk akun `sapadesa_user`
- `DB_ROOT_PASSWORD` baru — untuk akun `root`
- `AUTH_SECRET` baru — kunci rahasia untuk token login aplikasi

Syaratnya: **huruf dan angka saja, minimal 24 karakter**, jangan
pakai spasi, tanda `$`, atau `#`.

Cara membuatnya di Windows (PowerShell) — klik Start, ketik
"PowerShell", buka, lalu jalankan perintah ini 3 kali (tiap kali
hasilnya beda):

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
```

Simpan ketiga hasilnya di tempat aman (aplikasi catatan terkunci /
password manager). Untuk sementara, beri label yang jelas mana yang
DB_PASSWORD, mana yang DB_ROOT_PASSWORD, mana yang AUTH_SECRET —
nanti ketiganya dipakai di tempat berbeda dan **tidak boleh tertukar**.

> ⚠️ Jangan pernah mengirim ketiga nilai ini lewat chat/WhatsApp,
> termasuk ke Muse. Kamu yang mengetikkannya langsung di Portainer.

### P2. Ketahui password root LAMA

Perintah SQL nanti meminta password root yang **sekarang** (yang
lama). Kalau kamu lupa, ini cara melihatnya di Portainer:

1. Menu kiri Portainer → **Containers**
2. Pada baris `sapadesa_db`, klik ikon **Inspect** (ikon kaca
   pembesar / huruf "i" di kolom *Quick Actions*)
3. Gulir ke bawah ke bagian **Env** — di sana ada baris
   `MYSQL_ROOT_PASSWORD=...`, itulah password root lamamu.
   Ada juga `MYSQL_PASSWORD=...`, itu password lama `sapadesa_user`.
4. Catat di tempat pribadi. **Jangan di-screenshot / dibagikan** —
   halaman Inspect itu berisi semua rahasia container.

> Cara lain: password lama juga tertulis di file `docker-compose.yml`
> versi lama di repo GitHub-mu (baris `MYSQL_ROOT_PASSWORD`).

### P3. Backup dulu

1. Buka situs SapaDesa, login sebagai **admin**.
2. Masuk menu **Pengaturan** → **Backup** → unduh file backup,
   simpan di komputermu.

Ini jaring pengaman: kalau ada yang salah di tengah jalan, data bisa
dikembalikan.

---

## Langkah 1 — Matikan aplikasi (database tetap menyala!)

1. Portainer → menu kiri **Containers**.
2. Beri centang pada kotak di baris **`sapadesa_app`** saja.
   ⚠️ Baris `sapadesa_db` **jangan** dicentang.
3. Klik tombol **Stop** di bagian atas daftar.
4. Tunggu sampai kolom *State* pada `sapadesa_app` berubah dari
   hijau `running` menjadi `exited`. Container `sapadesa_db` harus
   tetap `running`.

Mulai titik ini situs tidak bisa diakses — memang disengaja, dan
akan menyala lagi di Langkah 5.

---

## Langkah 2 — Buka terminal (Console) database

1. Masih di halaman **Containers**, pada baris **`sapadesa_db`**
   lihat kolom *Quick Actions* (deretan ikon kecil).
2. Klik ikon **Console** — bentuknya seperti `>_` (tanda lebih-besar
   dan garis bawah). Kamu akan dibawa ke halaman berjudul
   *Console* / *Exec into container*.
3. Ada pilihan **Command**. Isi (atau biarkan) dengan:

   ```
   /bin/bash
   ```

   Kolom *User* biarkan kosong (atau isi `root`).
4. Klik tombol **Connect**.
5. Kalau berhasil, muncul kotak hitam besar dengan tulisan seperti:

   ```
   root@xxxx:/#
   ```

   Itu artinya kamu sudah "masuk" ke dalam container database.
   Semua perintah berikutnya diketik di kotak hitam ini, dan setiap
   perintah diakhiri tombol **Enter**.

> Kalau Connect gagal / halaman kosong: coba lagi dengan Command
> `/bin/sh`. Kalau masih gagal, pastikan `sapadesa_db` berstatus
> `running` (Langkah 1), lalu ulangi.

---

## Langkah 3 — Masuk ke MySQL sebagai root

Di kotak hitam tadi, ketik persis seperti ini lalu Enter:

```bash
mysql -uroot -p
```

Muncul tulisan `Enter password:` — ketik **password root LAMA**
(dari Persiapan P2), lalu Enter.

**Penting untuk pemula:** saat kamu mengetik password di sini,
layar **tidak menampilkan apa-apa** — tidak ada bintang `*****`,
tidak ada titik. Itu normal dan memang begitu desainnya (supaya
tidak bisa diintip). Ketik saja dengan benar lalu Enter.

Hasil yang diharapkan: muncul sambutan MySQL dan tulisan prompt
berubah menjadi:

```
mysql>
```

Semua perintah berikutnya diketik setelah `mysql>` itu.

> Kalau muncul `ERROR 1045 ... Access denied` — artinya password
> lama yang kamu ketik salah. Ulangi Langkah 3 ini, periksa lagi
> password dari halaman Inspect (P2). Tidak ada batas percobaan,
> jadi tenang saja.

---

## Langkah 4 — Jalankan perintah ganti password (SQL)

Sekarang jalankan **satu per satu**. Untuk setiap perintah:

1. Salin perintahnya,
2. Tempel di console (klik dulu di dalam kotak hitam, lalu
   `Ctrl+V`. Kalau tidak bisa, coba klik kanan → *Paste*, atau
   `Shift+Insert` — console Portainer kadang pilih-pilih),
3. **Ganti dulu** bagian dalam tanda kutip tunggal dengan password
   barumu (dari Persiapan P1) sebelum menekan Enter,
4. Tekan Enter,
5. Pastikan hasilnya berbunyi **`Query OK, 0 rows affected`** —
   itu tanda perintah berhasil.

Perintah 1 — ganti password akun aplikasi:

```sql
ALTER USER 'sapadesa_user'@'%' IDENTIFIED WITH mysql_native_password BY 'TULIS_DB_PASSWORD_BARU_DI_SINI';
```

Perintah 2 — ganti password root (versi yang bisa diakses dari
container lain):

```sql
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'TULIS_DB_ROOT_PASSWORD_BARU_DI_SINI';
```

Perintah 3 — ganti password root (versi lokal di dalam container):

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'TULIS_DB_ROOT_PASSWORD_BARU_DI_SINI';
```

> **Catatan soal Perintah 2:** kalau perintah ini membalas error
> berbunyi `ERROR 1396 ... Operation ALTER USER failed` (artinya
> user `root`@`%` memang tidak ada di database-mu), **abaikan saja**
> — itu bukan masalah. Yang wajib berhasil adalah Perintah 1 dan 3.

Perintah 4 — terapkan & keluar:

```sql
FLUSH PRIVILEGES;
EXIT;
```

Setelah `EXIT`, kamu kembali ke prompt `root@xxxx:/#`.

### Uji cepat (sangat disarankan)

Masih di console yang sama, ketik:

```bash
mysql -usapadesa_user -p -e "SELECT 1"
```

Masukkan **DB_PASSWORD baru** saat diminta. Kalau muncul tabel
kecil berisi angka `1`, password baru untuk akun aplikasi **sudah
aktif**. 

Setelah itu, tutup console: ketik `exit` lalu Enter, atau klik
tombol **Disconnect**.

---

## Langkah 5 — Tulis password baru di pengaturan stack

1. Portainer → menu kiri **Stacks** → klik stack **`sapadesa-app`**.
2. Gulir ke bawah sampai bagian **Environment variables** (persis
   bagian yang ada di screenshot-mu), klik judul/tanda panahnya
   untuk membuka.
3. Tambahkan 3 variabel dengan tombol **+ Add environment variable**
   (nama di kolom kiri, nilai di kolom kanan):

   | name | value |
   |---|---|
   | `DB_PASSWORD` | DB_PASSWORD baru — **harus sama persis** dengan yang kamu tulis di Perintah 1 Langkah 4 |
   | `DB_ROOT_PASSWORD` | DB_ROOT_PASSWORD baru — sama persis dengan Perintah 2 & 3 |
   | `AUTH_SECRET` | AUTH_SECRET baru dari Persiapan P1 |

   Kolom *name* peka huruf besar/kecil — ketik persis seperti di
   tabel, termasuk garis bawahnya.
4. Klik **Save settings** (tombol di bagian *Actions*, di sebelah
   "Pull and redeploy" pada screenshot-mu).

---

## Langkah 6 — Deploy kode terbaru

Stack-mu diatur dari **Git repository** dengan mekanisme **Polling**
tiap 5 menit (terlihat di screenshot). Artinya setelah kode versi
baru masuk ke branch yang dilacak stack (biasanya `main`):

- Portainer akan menarik & men-deploy ulang **otomatis** dalam
  waktu ≤ 5 menit, **atau**
- Kamu bisa klik tombol **Pull and redeploy** di halaman stack
  untuk melakukannya **sekarang juga**. Gunakan cara ini supaya
  urutannya pasti.

> Prasyaratnya: pembaruan keamanan + desain baru harus sudah
> ter-push dan ter-merge ke branch tersebut. Kalau belum, langkah
> ini men-deploy kode lama — dan kode lama tidak membaca
> *Environment variables* di atas. Jadi pastikan urusan push/merge
> selesai dulu sebelum menekan tombol ini.

---

## Langkah 7 — Periksa hasilnya

1. **Log aplikasi:** Portainer → **Containers** → baris
   `sapadesa_app` → ikon **Logs** (ikon dokumen di *Quick Actions*).
   Cari tulisan:

   ```
   Server SapaDesa running on http://localhost:3000
   Database Schema Verified & Migrated.
   ```

   Tidak boleh ada tulisan `Access denied` atau
   `[SECURITY] AUTH_SECRET belum di-set`. Kalau ada, lihat tabel
   masalah di bawah.
2. **Situs:** buka `https://sapadesa.rowosari.my.id`
   - Halaman depan tampil dengan desain baru.
   - Cek iuran warga dengan ID contoh → hasil tampil normal.
   - Login **admin** → bisa masuk dashboard. (Semua orang akan
     diminta login ulang sekali — itu wajar, karena sistem sesi
     berganti token baru.)
   - Login **petugas** → bisa masuk dan scan QR.
3. Selesai. Password lama sekarang resmi tidak berlaku di mana
   pun. Simpan nilai-nilai baru hanya di tempat amanmu.

---

## Kalau ada masalah

| Gejala | Penyebab paling mungkin | Yang dilakukan |
|---|---|---|
| `Access denied` saat Langkah 3 | Password root lama salah ketik | Cek lagi dari halaman Inspect (P2), ulangi |
| Console tidak mau Connect | Container db berhenti, atau command salah | Pastikan `sapadesa_db` `running`; coba Command `/bin/sh` |
| Setelah deploy, situs tidak bisa dibuka & log app penuh `Access denied` | Password di *Environment variables* tidak sama dengan yang di-ALTER (beda 1 huruf saja gagal) | Samakan nilai `DB_PASSWORD` di stack dengan yang diketik di Perintah 1 — cara paling aman: ulangi Langkah 4 dengan nilai yang **persis** sama seperti yang sudah terlanjur tersimpan di stack, lalu restart `sapadesa_app` |
| Stack gagal start, log menyebut `DB_PASSWORD` / `AUTH_SECRET` "missing" atau variabel wajib kosong | Salah satu dari 3 variabel belum terisi / salah ketik namanya | Periksa lagi Langkah 5, perbaiki, **Save settings**, deploy ulang |
| Semua pengguna ter-logout | Itu **normal** setelah ganti AUTH_SECRET | Minta mereka login ulang seperti biasa |
| Terlanjur berantakan di tengah jalan | — | Nyalakan kembali kode lama: arahkan stack ke commit lama & redeploy, lalu kembalikan password database ke nilai **lama** dengan cara yang sama seperti Langkah 3–4 (masuk memakai password root **baru**, ALTER ke password lama). Atau pulihkan backup dari Persiapan P3 |

---

## Ringkasan 1 halaman (tempel di dekat monitor saat eksekusi)

1. Siapkan 3 nilai baru + ketahui password root lama (Inspect →
   Env `sapadesa_db`) + backup data dari aplikasi.
2. **Containers** → Stop `sapadesa_app` saja.
3. **Containers** → `sapadesa_db` → ikon Console `>_` → Command
   `/bin/bash` → **Connect**.
4. `mysql -uroot -p` → masukkan password root **lama** (layar
   memang blank saat mengetik — normal).
5. Jalankan 3× `ALTER USER ...` (ganti isi kutip dengan password
   baru) → tiap perintah harus menjawab `Query OK`.
6. `FLUSH PRIVILEGES;` → `EXIT;` → uji
   `mysql -usapadesa_user -p -e "SELECT 1"` dengan password baru.
7. **Stacks** → `sapadesa-app` → **Environment variables** → isi
   `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `AUTH_SECRET` → **Save
   settings**.
8. **Pull and redeploy**.
9. Cek log `sapadesa_app` + buka situs + login admin & petugas.

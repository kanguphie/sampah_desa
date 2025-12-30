# Panduan Integrasi Supabase - SapaDesa

Dokumen ini berisi langkah-langkah detail untuk menghubungkan aplikasi **SapaDesa** ke database cloud menggunakan **Supabase**.

---

## Langkah 1: Persiapan Akun & Proyek
1. Buka [Supabase.com](https://supabase.com/) dan buat akun (gratis).
2. Klik tombol **"New Project"**.
3. Isi data:
   - **Name**: SapaDesa
   - **Database Password**: Buat kata sandi yang kuat (simpan baik-baik).
   - **Region**: Pilih yang terdekat (misal: Singapore).
4. Klik **"Create New Project"** dan tunggu hingga proses inisialisasi selesai (sekitar 1-2 menit).

---

## Langkah 2: Membuat Tabel Database (SQL Editor)
Agar database siap digunakan, kita perlu membuat tabel yang sesuai dengan kebutuhan aplikasi.
1. Di dashboard Supabase, klik menu **"SQL Editor"** (ikon `>_` di sisi kiri).
2. Klik **"New Query"**.
3. Salin dan tempel (copy-paste) skrip SQL di bawah ini:

```sql
-- 1. Tabel Wilayah
CREATE TABLE dukuhs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE rts (
    id SERIAL PRIMARY KEY,
    number TEXT NOT NULL
);

-- 2. Tabel Pengguna (PIN Login)
CREATE TABLE petugases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    pin TEXT NOT NULL
);

CREATE TABLE admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    pin TEXT NOT NULL
);

-- 3. Tabel Warga
CREATE TABLE wargas (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    "rtId" INTEGER REFERENCES rts(id),
    "dukuhId" INTEGER REFERENCES dukuhs(id),
    "dailyFee" INTEGER DEFAULT 2000,
    "totalDebt" INTEGER DEFAULT 0
);

-- 4. Tabel Transaksi
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    "wargaId" TEXT REFERENCES wargas(id),
    "petugasId" TEXT, -- Bisa ID petugas atau 'SYSTEM'
    amount INTEGER NOT NULL,
    status TEXT CHECK (status IN ('LUNAS', 'HUTANG')),
    category TEXT DEFAULT 'IURAN'
);

-- 5. Tabel Keuangan (Pengeluaran)
CREATE TABLE pengeluarans (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL
);

-- 6. Tabel Pesan & Pengumuman
CREATE TABLE contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    "isRead" BOOLEAN DEFAULT FALSE
);

CREATE TABLE announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Jadwal Operasional
CREATE TABLE schedules (
    day TEXT PRIMARY KEY, -- Senin, Selasa, dst
    "dukuhIds" JSONB -- Menyimpan array ID dukuh [1, 2, 3] atau 'libur'
);

-- ISI DATA AWAL (Contoh)
INSERT INTO admins (id, username, name, pin) VALUES ('adm01', 'admin', 'Admin Utama', '123456');
INSERT INTO petugases (id, name, phone, pin) VALUES ('pt01', 'Budi Petugas', '08123', '1111');
INSERT INTO dukuhs (name) VALUES ('Rowosari'), ('Pencar');
INSERT INTO rts (number) VALUES ('01'), ('02'), ('03');
```
4. Klik tombol **"Run"**. Jika berhasil, Anda akan melihat pesan "Success".

---

## Langkah 3: Menghubungkan Aplikasi ke Supabase
1. Di dashboard Supabase, klik menu **"Project Settings"** (ikon roda gigi ⚙️) -> pilih **"API"**.
2. Cari bagian **"Project API keys"**:
   - Salin **Project URL**.
   - Salin **anon public Key**.
3. Buka file `lib/supabase.ts` di folder proyek Anda.
4. Ganti nilai `YOUR_SUPABASE_PROJECT_URL` dan `YOUR_SUPABASE_ANON_KEY` dengan hasil salinan tadi.

```typescript
const supabaseUrl = 'https://abcde.supabase.co';
const supabaseAnonKey = 'eyJhbG...';
```

---

## Langkah 4: Keamanan (Opsional tapi Penting)
Secara default, database Supabase dapat dibaca/ditulis oleh siapa saja yang punya API Key. Untuk tahap awal pengembangan, kita membiarkan ini. Namun, di menu **"Database" -> "Policies"**, Anda dapat mengaktifkan **Row Level Security (RLS)** untuk membatasi akses hanya bagi user tertentu di masa depan.

Selesai! Sekarang aplikasi Anda sudah menggunakan database cloud real-time.

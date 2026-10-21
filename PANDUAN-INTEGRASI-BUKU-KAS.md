# Panduan Integrasi Buku Kas SapaDesa

Dokumen ini menjelaskan cara platform lain (misalnya **web desa**) mengambil data
keuangan dari SapaDesa secara otomatis dalam format **buku kas**, sehingga tidak
perlu lagi input pemasukan/pengeluaran secara manual.

Format yang dihasilkan persis seperti buku kas:

| No | Tanggal | Uraian | Masuk | Keluar | Saldo |
|----|---------|--------|-------|--------|-------|

Datanya digabungkan dari tiga sumber di SapaDesa:

- **Pembayaran iuran warga** (yang statusnya lunas/`paid`) → kolom **Masuk**, uraian: `Iuran Sampah — <nama warga>`
- **Pemasukan lain** → kolom **Masuk**, uraian dari keterangan pemasukan
- **Pengeluaran** → kolom **Keluar**, uraian dari keterangan pengeluaran

Kolom **Saldo** dihitung berjalan (saldo sebelumnya + Masuk − Keluar), dan
**saldo awal** periode sudah memperhitungkan seluruh mutasi sebelum tanggal mulai.

---

## 1. Aktivasi (dilakukan admin SapaDesa, satu kali)

Endpoint ini **nonaktif secara bawaan**. Untuk mengaktifkannya:

1. Pastikan kode terbaru sudah ter-deploy (stack Portainer `sapadesa-app` menarik
   commit terbaru dari GitHub secara otomatis ±5 menit).
2. Buka **Portainer → Stacks → sapadesa-app**.
3. Di bagian **Environment variables**, tambahkan variabel baru:
   - Name: `INTEGRATION_API_KEY`
   - Value: kunci rahasia yang panjang dan acak (contoh pembuatan:
     `openssl rand -hex 32`, atau generator password apa pun, minimal 32 karakter).
4. Klik **Update the stack** agar container membaca variabel baru.
5. Berikan kunci tersebut **hanya** kepada pengelola platform yang akan
   mengonsumsi API ini, lewat jalur pribadi (bukan di grup publik).

Untuk menonaktifkan integrasi: kosongkan/hapus variabel itu lalu Update the stack.

---

## 2. Spesifikasi Endpoint

```
GET https://sapadesa.rowosari.my.id/api/integration/buku-kas
```

### Otentikasi

Wajib membawa API key. Cara utama (disarankan, untuk pemakaian server-ke-server):

```
X-API-Key: <INTEGRATION_API_KEY>
```

Cara alternatif (praktis untuk pengujian lewat browser):

```
https://sapadesa.rowosari.my.id/api/integration/buku-kas?api_key=<INTEGRATION_API_KEY>&from=2026-10-01&to=2026-10-31
```

> Catatan: cara query-string membuat kunci tercatat di log akses server.
> Untuk pemakaian rutin gunakan header `X-API-Key`.

### Parameter

| Nama | Wajib | Keterangan |
|------|-------|------------|
| `from` | Tidak | Tanggal mulai `YYYY-MM-DD`. Bawaan: tanggal 1 bulan berjalan. |
| `to` | Tidak | Tanggal akhir `YYYY-MM-DD`. Bawaan: hari ini. |

Tanggal mengikuti zona waktu **WIB (Asia/Jakarta)**.

### Contoh Respons

```json
{
  "periode": { "from": "2026-10-01", "to": "2026-10-31" },
  "saldoAwal": 25000,
  "data": [
    { "no": 1, "tanggal": "2026-10-05", "uraian": "Iuran Sampah — Budi Santoso", "masuk": 15000, "keluar": 0, "saldo": 40000 },
    { "no": 2, "tanggal": "2026-10-07", "uraian": "Bensin Operasional", "masuk": 0, "keluar": 10000, "saldo": 30000 },
    { "no": 3, "tanggal": "2026-10-09", "uraian": "Sumbangan Hamba Allah", "masuk": 50000, "keluar": 0, "saldo": 80000 }
  ],
  "totalMasuk": 65000,
  "totalKeluar": 10000,
  "saldoAkhir": 80000
}
```

Keterangan field:

- `saldoAwal` — akumulasi semua mutasi **sebelum** tanggal `from`.
- `data` — baris buku kas urut tanggal menaik; `saldo` adalah saldo berjalan setelah baris itu.
- `totalMasuk` / `totalKeluar` — total khusus periode yang diminta.
- `saldoAkhir` — `saldoAwal + totalMasuk − totalKeluar` (sama dengan saldo baris terakhir).

### Kode Respons Error

| Kode | Arti |
|------|------|
| `400` | Parameter `from`/`to` tidak valid (format salah atau `from` > `to`). |
| `401` | API key tidak dikirim atau salah. |
| `503` | Integrasi belum diaktifkan di server (`INTEGRATION_API_KEY` belum diatur). |

Endpoint ini **hanya-baca (GET)** — tidak ada cara mengubah data SapaDesa lewat endpoint ini.

---

## 3. Contoh Pemakaian dari Platform Lain

### curl

```bash
curl -H "X-API-Key: <KUNCI>" \
  "https://sapadesa.rowosari.my.id/api/integration/buku-kas?from=2026-10-01&to=2026-10-31"
```

### PHP (umum dipakai web desa)

```php
<?php
$apiKey = getenv('SAPADESA_API_KEY'); // simpan kunci di environment server, JANGAN di kode
$from = date('Y-m-01');
$to   = date('Y-m-d');

$ch = curl_init("https://sapadesa.rowosari.my.id/api/integration/buku-kas?from=$from&to=$to");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["X-API-Key: $apiKey"],
]);
$hasil = json_decode(curl_exec($ch), true);
curl_close($ch);

// $hasil['data'] siap ditampilkan sebagai tabel buku kas,
// atau disimpan ke database web desa untuk diarsipkan.
foreach ($hasil['data'] as $baris) {
    echo $baris['no'] . ' | ' . $baris['tanggal'] . ' | ' . $baris['uraian']
       . ' | ' . $baris['masuk'] . ' | ' . $baris['keluar'] . ' | ' . $baris['saldo'] . PHP_EOL;
}
```

### Pola sinkronisasi yang disarankan

- Tarik data **berkala** (mis. cron tiap malam, atau saat halaman laporan dibuka
  dengan cache beberapa jam) — tidak perlu real-time.
- Untuk arsip per bulan, panggil dengan `from` = tanggal 1 dan `to` = akhir bulan
  yang bersangkutan; simpan apa adanya.
- Kunci API **hanya boleh ada di server** platform pemanggil (file env / konfigurasi
  server). Jangan pernah menaruh kunci di JavaScript yang dikirim ke browser pengunjung.

---

## 4. Keamanan & Rotasi Kunci

- Kunci ini setara password khusus baca-data-keuangan: jangan dibagikan ke pihak
  yang tidak berkepentingan, jangan ditulis di repo publik.
- Bila kunci diduga bocor: buat kunci baru, ganti nilai `INTEGRATION_API_KEY`
  di Portainer, **Update the stack**, lalu berikan kunci baru ke pengelola
  platform pemanggil. Kunci lama langsung berhenti berlaku.
- Endpoint tidak menerima penulisan apa pun; risiko terburuk dari kunci yang bocor
  adalah data laporan keuangan terbaca pihak lain.

## 5. Pemecahan Masalah

| Gejala | Penyebab & tindakan |
|--------|----------------------|
| `503` terus-menerus | Variabel `INTEGRATION_API_KEY` belum terisi di stack Portainer, atau stack belum di-Update setelah variabel ditambah. |
| `401` padahal kunci merasa benar | Cek tidak ada spasi ekstra saat menyalin kunci; pastikan kunci di platform pemanggil sama persis dengan di Portainer. |
| Data kosong (`data: []`) | Belum ada mutasi pada periode itu — normal bila belum ada pembayaran/pengeluaran tercatat. Coba rentang tanggal yang lebih lebar. |
| Saldo awal tidak nol | Itu memang benar: saldo awal adalah akumulasi mutasi sebelum tanggal `from`. |

# Koneksi Muse ↔ GitHub

Sejak **20 Oktober 2026**, Muse (asisten AI Lutfi) memiliki akses push langsung
ke repo ini melalui konektor GitHub resmi (login OAuth + GitHub App `meta-muse-ai`,
akses dibatasi hanya pada repo `sampah_desa`).

## Alur kerja

1. Muse mengubah kode pada salinan lokal repo.
2. Muse mem-push perubahan ke branch `main` lewat konektor.
3. Portainer mendeteksi perubahan (polling) dan men-deploy ulang stack `sapadesa-app`.

Tidak diperlukan lagi file bundle atau GitHub Codespaces untuk mem-push perubahan.

## Catatan

- Push lewat konektor berbentuk *snapshot commit* (isi file saat itu), bukan
  riwayat commit lokal. File biner tidak bisa dikirim lewat jalur ini.
- Kunci SSH "Deploy Key" lama di pengaturan repo tidak lagi diperlukan dan
  boleh dicabut.

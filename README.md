# Judol Detector 

Chromium browser extension untuk mendeteksi konten judi online (judol) pada halaman web menggunakan algoritma string matching.

---

## Algoritma yang Diimplementasikan

### Knuth-Morris-Pratt (KMP)
KMP melakukan pencocokan string dengan memanfaatkan informasi dari kegagalan pencocokan sebelumnya sehingga tidak perlu mengulang perbandingan dari awal. Kuncinya adalah **Longest Proper Prefix Suffix (LPS) array** (failure function) yang dibangun dari pattern sebelum pencarian dimulai. Saat terjadi mismatch pada posisi `i` di pattern, pointer pattern tidak dikembalikan ke 0 melainkan ke `lps[i-1]`, sehingga kompleksitas pencarian menjadi O(n + m).

### Boyer-Moore (BM)
BM melakukan pencocokan dari kanan ke kiri pada pattern, dengan memanfaatkan **Last Occurrence Table** (bad character heuristic). Tabel ini menyimpan posisi kemunculan terakhir setiap karakter dalam pattern. Saat terjadi mismatch, pattern digeser sebesar nilai yang dihitung dari tabel tersebut, sehingga pada praktiknya lebih cepat dari KMP untuk teks berukuran besar.

### Regex
Digunakan untuk mendeteksi pola `<kata><angka>` khas nama situs judol. Pattern: `/\b([a-zA-Z]+)(\d{2,})\b/g` mendeteksi kata yang diikuti minimal 2 angka tanpa spasi (contoh: `SLOT99`, `MAXWIN234`).

### Weighted Levenshtein Distance (Fuzzy Matching)
Digunakan sebagai fallback jika exact matching tidak menemukan hasil. Memberikan bobot penalti lebih kecil untuk substitusi karakter yang mirip secara visual (misalnya `o↔0`, `a↔4`, `i↔1`, `α↔a`), sehingga variasi penulisan seperti `G4C0R` tetap terdeteksi.

### Aho-Corasick (Bonus)
Membangun automaton dari seluruh keyword sekaligus menggunakan **failure links**, sehingga semua keyword dapat dicari dalam satu kali traversal teks. Kompleksitas O(n + m + z) dengan z adalah jumlah total match.

### Rabin-Karp (Bonus)
Menggunakan **polynomial rolling hash** untuk membandingkan hash window teks dengan hash pattern. Saat hash cocok, dilakukan verifikasi karakter untuk menghindari false positive akibat hash collision.

---

## Requirements

- Node.js >= 18
- npm >= 9
- Chromium-based browser (Google Chrome, Edge, Brave, dll.)

---

## Instalasi

Clone repository
```bash
git clone https://github.com/<username>/Tubes3_LastBangetNih.git
cd Tubes3_LastBangetNih
```

Install dependencies
```bash
npm install
```

---

## Build

```bash
npm run build
```

Hasil build akan tersimpan di folder `dist/`.

---

## Load Extension di Chrome

1. Buka browser Chrome dan navigasi ke `chrome://extensions/`
2. Aktifkan **Developer Mode** (pojok kanan atas)
3. Klik tombol **Load unpacked**
4. Pilih folder `dist/` hasil build
5. Extension **Judol Detector** akan muncul di toolbar browser

---

## Cara Penggunaan

1. Buka halaman web yang ingin diperiksa
2. Klik ikon extension di toolbar
3. Klik tombol **Scan Page** untuk memulai deteksi
4. Kata kunci yang terdeteksi akan di-highlight pada halaman
5. Hover pada teks yang di-highlight untuk melihat detail (keyword, algoritma, jumlah kemunculan, waktu eksekusi)
6. Popup menampilkan statistik lengkap: total match, perbandingan antar algoritma, dan waktu eksekusi
7. Tombol **Clear** menghapus semua highlight
8. Toggle **Blur** mengaktifkan/menonaktifkan fitur blur pada elemen yang terdeteksi

---

## Checklist

| No | Poin | Ya | Tidak |
|----|------|----|-------|
| 1 | Extension berhasil di-build dan di-load tanpa kesalahan pada chromium browser dan dikembangkan dengan TypeScript | ✓ | |
| 2 | KMP dan Boyer-Moore diimplementasikan from scratch | ✓ | |
| 3 | Regex menghandle format <kata><angka> dan berbagai edge case | ✓ | |
| 4 | Pencarian KMP & BM membaca keyword.txt secara iteratif dan tidak menggunakan built-in search function atau library eksternal | ✓ | |
| 5 | Exact matching dan fuzzy matching berjalan benar | ✓ | |
| 6 | Elemen DOM terdeteksi diberi highlight dan terhapus saat rescanning | ✓ | |
| 7 | Tooltip muncul saat hover dengan informasi keyword, algoritma, kemunculan, dan waktu eksekusi | ✓ | |
| 8 | Popup menampilkan statistik realtime (total keyword, perbandingan, waktu eksekusi, jumlah match) | ✓ | |
| 9 | [Bonus] Membuat Video | ✓ | |
| 10 | [Bonus] Implementasi Algoritma Aho-Corasick dan Rabin-Karp | ✓ | |
| 11 | [Bonus] Implementasi Censorship / Blur Teks | ✓ | |
| 12 | [Bonus] Implementasi Optical Character Recognition pada Gambar | ✓ | |

---

## Author

| Nama | NIM |
|------|-----|
| Gabriella Botimada Lubis | 13524006 |
| Suryani Mulia Utami | 13524042 |
| Keisha Rizka Syofyani | 13524073 |
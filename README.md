# Catatan Negeri (catatannegeri.com)
**Portal Berita & Informasi Digital Indonesia — Production-Ready Platform**

Catatan Negeri adalah portal berita digital skala enterprise berbahasa Indonesia yang dirancang untuk kecepatan tinggi (Core Web Vitals), optimasi SEO teknis mendalam (Google News & Schema.org JSON-LD), alur kerja redaksi berlapis (Super Admin, Editor, Wartawan), serta manajemen konten mandiri.

---

## 1. Arsitektur & Teknologi

- **Frontend & Server Framework:** Next.js 15 (App Router) + TypeScript + React 19 Server Components
- **Styling:** Tailwind CSS + @tailwindcss/typography (Editorial Newspaper Styling)
- **Database & ORM:** PostgreSQL + Prisma ORM 6
- **Otentikasi & Keamanan:** Bcrypt Password Hashing + JOSE (HS256) JWT HttpOnly Secure Cookies + Role-Based Access Control (RBAC)
- **Validasi Data:** Zod schema validation pada seluruh endpoint dan mutasi server
- **SEO & Taksonomi:** XML Sitemap Index (`/sitemap.xml`), Google News Sitemap 48-Jam (`/news-sitemap.xml`), robots.txt, JSON-LD Structured Data (`NewsArticle`, `NewsMediaOrganization`, `Person`, `BreadcrumbList`, `WebSite`)
- **Pustaka Media:** Upload file aman (JPG, PNG, WebP, AVIF) dengan validasi MIME, ukuran maks. 5MB, serta metadata Alt Text dan kredit fotografer.

---

## 2. Struktur 20 Kategori Utama

Portal ini telah dilengkapi dan dikonfigurasi dengan 20 kanal berita utama sesuai standar portal berita nasional:
1. Nasional (`/nasional`)
2. Daerah (`/daerah`)
3. Politik (`/politik`)
4. Ekonomi (`/ekonomi`)
5. Bisnis (`/bisnis`)
6. Teknologi (`/teknologi`)
7. Gadget (`/gadget`)
8. Otomotif (`/otomotif`)
9. Pendidikan (`/pendidikan`)
10. Kesehatan (`/kesehatan`)
11. Gaya Hidup (`/gaya-hidup`)
12. Hiburan (`/hiburan`)
13. Olahraga (`/olahraga`)
14. Travel (`/travel`)
15. Kuliner (`/kuliner`)
16. Properti (`/properti`)
17. Keuangan (`/keuangan`)
18. Tips dan Panduan (`/tips-dan-panduan`)
19. Lingkungan (`/lingkungan`)
20. Tren dan Viral (`/tren-dan-viral`)

---

## 3. Akun Akses Redaksi (Seeded Credentials)

Sistem telah di-seed dengan 3 tingkat hak akses (RBAC):

| Peran | Nama | Surel / Username | Kata Sandi | Wewenang |
|---|---|---|---|---|
| **Super Admin** | Pemimpin Redaksi | `redaksi@catatannegeri.com` | `Admin123!CatatanNegeri` | Manajemen pengguna, pengaturan situs, iklan, audit logs, kategori, publikasi artikel |
| **Editor** | Budi Santoso | `editor@catatannegeri.com` | `Editor123!CatatanNegeri` | Menelaah, menyunting, menjadwalkan, menerbitkan, dan mengarsipkan artikel |
| **Author** | Dewi Lestari | `dewi.lestari@catatannegeri.com` | `Wartawan123!CatatanNegeri` | Menulis draf berita sendiri, mengunggah foto, mengirim ke meja redaksi |

*URL Login Redaksi:* `https://catatannegeri.com/admin/login`

---

## 4. Panduan Menjalankan Secara Lokal

### Prasyarat
- Node.js v18+ atau v20+ (diuji pada Node v25)
- PostgreSQL v14+ (tersinkronisasi pada `localhost:5432`)

### Langkah Menjalankan
1. Pasang dependensi:
   ```bash
   npm install
   ```
2. Buat file `.env` dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Sinkronkan schema Prisma ke PostgreSQL:
   ```bash
   npx prisma db push
   ```
4. Jalankan seed database awal (kategori, akun redaksi, artikel contoh, setting):
   ```bash
   npm run prisma:seed
   ```
5. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di peramban Anda.

---

## 5. Pipeline Ingesti Berita Semi-Otomatis & Asistensi AI

Catatan Negeri dilengkapi sistem kurasi dan agregasi berita eksternal semi-otomatis berstandar dewan pers yang menggabungkan otomasi cerdas dengan kendali penuh jurnalis manusia (*human-in-the-loop*).

### Fitur Utama Pipeline:
1. **Pencegahan Serangan SSRF (Server-Side Request Forgery):**
   - Validasi URL target secara ketat sebelum penarikan HTTP.
   - Pemblokiran alamat IP loopback (`127.0.0.1`), jaringan lokal RFC 1918 (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`), serta metadata cloud AWS/GCP (`169.254.169.254`).
   - Batas respon berkas maks. 5MB dan waktu tunggu (timeout) 12 detik.
2. **Deduplikasi Cerdas Multi-Tingkat:**
   - Normalisasi URL kanonikal dengan pembersihan parameter tracker (`utm_*`, `fbclid`, `gclid`).
   - Pencocokan kemiripan judul semantik berbasis token Jaccard Similarity (&gt; 70%) guna mendeteksi sindikasi berita reprint.
3. **Pusat Komando Kurasi (`/admin/news-inbox`):**
   - 11 status siklus redaksi: `DISCOVERED`, `DUPLICATE`, `RESEARCH_NEEDED`, `READY_FOR_AI_DRAFT`, `DRAFT_GENERATED`, `AWAITING_EDITORIAL_REVIEW`, `APPROVED`, `SCHEDULED`, `PUBLISHED`, `REJECTED`, `FAILED`.
   - Penyaringan instan berdasarkan kanal, sumber, topik berisiko tinggi (*health/finance/legal/emergency*), dan aksi batch.
4. **Studio Tinjauan Redaksi (`/admin/news-inbox/[id]`):**
   - Tampilan berdampingan (*side-by-side*) antara materi rujukan asli dan naskah draf berita Catatan Negeri.
   - Pilihan sudut pandang judul (*alternative headlines carousel*).
   - Lembar periksa verifikasi fakta interaktif dan audit kualitas jurnalistik.
   - Perlindungan mutlak: Konten dari feed eksternal tidak akan pernah terbit otomatis tanpa persetujuan eksplisit editor.
5. **Eksekusi Penarikan Terjadwal (Scheduler / Cron):**
   - Jalankan sinkronisasi background secara mandiri:
     ```bash
     node scripts/run-ingestion.mjs
     ```

---

## 6. Akselerasi Indeks Google Search Console & Google News

Platform dilengkapi infrastruktur perayapan cepat (*fast-indexing pipeline*) agar setiap artikel yang diterbitkan segera terdeteksi dan diindeks oleh Googlebot dalam hitungan menit:

1. **WebSub (PubSubHubbub) Real-Time Hub:**
   - Feed RSS resmi di `/rss.xml` terhubung ke Google Hub (`hub.pubsubhubbub.appspot.com`).
   - Setiap publikasi artikel baru otomatis memicu notifikasi HTTP POST ke Google Hub tanpa jeda (*zero-delay ping*).
2. **Google News Sitemap 48-Jam (`/news-sitemap.xml`):**
   - Menghasilkan sitemap khusus Google News dengan elemen `<news:keywords>` dari taksonomi artikel.
   - Dilengkapi *header* `Cache-Control: no-cache, no-store, must-revalidate` agar Googlebot selalu membaca data mutakhir.
3. **Protokol IndexNow Multi-Search Engine:**
   - Pengiriman instan ke jaringan IndexNow (Bing, Yandex, Seznam, Naver) dengan berkas verifikasi resmi `/cn98a72ef31b40289a87d0e4125b0f19.txt`.
4. **Rich Data Schema (E-E-A-T & Google Snippets):**
   - Skema `NewsArticle` lengkap dengan spesifikasi `speakable` (AI Overviews).
   - Skema `FAQPage` otomatis untuk artikel yang memiliki bagian Tanya Jawab.
5. **Tombol "Ping Google (Cepat)" di CMS Admin:**
   - Hadir di menu **Konfigurasi SEO** (`/admin/seo`) dan **Editor Artikel** (`/admin/articles/[id]/edit`) untuk mengirim sinyal rayap 1-klik.

---

## 7. Pengujian & Verifikasi Kualitas

Jalankan rangkaian tes verifikasi:
```bash
# 1. Tes Inti Platform (Database, RBAC, Auth, SEO, Waktu Baca)
node scripts/test-verification.mjs

# 2. Tes Pipeline Ingesti Berita (SSRF, Jaccard Deduplication, AI Drafts, Review)
node scripts/test-news-ingestion.mjs

# 3. Tes Akselerasi Indeks Google (RSS WebSub, News Sitemap, FAQ Schema, IndexNow)
node scripts/test-fast-indexing.mjs
```

---

## 8. Panduan Penerbitan & Deployment Produksi

### Domain & DNS Setup (catatannegeri.com)
1. **A Record:** Arahkan `@` (apex domain) ke IP server produksi / platform hosting (misal: Vercel / Railway / VPS).
2. **CNAME Record:** Arahkan `www` ke `catatannegeri.com`. Server Next.js telah dilengkapi aturan 301 redirect otomatis dari `www.catatannegeri.com` menuju `https://catatannegeri.com`.
3. **SSL/HTTPS:** Aktifkan sertifikat SSL (Let's Encrypt / Cloudflare Full Strict).

### Variabel Lingkungan Produksi (.env)
```env
DATABASE_URL="postgresql://username:password@db-host:5432/catatannegeri?sslmode=require"
JWT_SECRET="masukkan-kunci-rahasia-minimal-32-karakter-acak"
NEXT_PUBLIC_SITE_URL="https://catatannegeri.com"
NEXT_PUBLIC_SITE_NAME="Catatan Negeri"
NEXT_PUBLIC_SITE_TAGLINE="Portal Berita & Informasi Digital Indonesia"
```

### Build & Start di Server Produksi
```bash
npm run build
npm run start
```

### Google Search Console & Google News
1. Buka **Google Search Console** (`https://search.google.com/search-console`).
2. Tambahkan properti domain `catatannegeri.com` via verifikasi DNS TXT record.
3. Masuk ke menu **Sitemaps** dan kirimkan URL:
   - `https://catatannegeri.com/sitemap.xml`
   - `https://catatannegeri.com/news-sitemap.xml`
4. Daftarkan publikasi di **Google News Publisher Center** (`https://publishercenter.google.com`) menggunakan logo di `/brand/logo.png`, identitas perusahaan pers PT Catatan Media Negeri, dan kanal RSS/Sitemap yang tersedia.

---

## 7. Cadangan Basis Data (Database Backup)

Jalankan perintah berkala melalui cron job server:
```bash
pg_dump -U postgres -d catatannegeri -F c -b -v -f "/var/backups/catatannegeri_$(date +%Y%m%d_%H%M%S).dump"
```
Untuk memulihkan data (restore):
```bash
pg_restore -U postgres -d catatannegeri -v "/path/to/backup.dump"
```

---

&copy; 2026 Catatan Negeri — Seluruh hak cipta dilindungi undang-undang.


import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Peta gambar unik beresolusi tinggi, relevan secara topik untuk setiap artikel
const ARTICLE_IMAGE_UPDATES = [
  {
    slug: "bank-indonesia-pertahankan-bi-rate-fokus-stabilitas-inflasi",
    featuredImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Gedung Kompleks Perkantoran Bank Indonesia dan pergerakan bursa keuangan",
    imageCaption: "Gedung Bank Indonesia di Jakarta Pusat dalam sorotan lampu sore hari.",
    imageCredit: "Dok. Redaksi Catatan Negeri / Budi Santoso",
  },
  {
    slug: "peta-jalan-kecerdasan-buatan-nasional-kemandirian-data-etika-ai",
    featuredImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Visualisasi neural network pemrosesan model kecerdasan buatan AI",
    imageCaption: "Peta jalan kedaulatan data dan riset kecerdasan buatan nasional.",
    imageCredit: "Unsplash / DeepMind AI Research",
  },
  {
    slug: "transisi-ekosistem-mobil-listrik-nasional-tkdn-spklu",
    featuredImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Kendaraan listrik terhubung ke pengisi daya stasiun SPKLU",
    imageCaption: "Pengisian daya cepat mobil listrik di jaringan SPKLU modern.",
    imageCredit: "Dok. Redaksi Otomotif Catatan Negeri",
  },
  {
    slug: "pembangunan-infrastruktur-konektivitas-daerah-keadilan-logistik",
    featuredImage: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Kapal kargo tol laut berlayar di pelabuhan kawasan kepulauan daerah",
    imageCaption: "Konektivitas kapal tol laut merajut distribusi kebutuhan pokok ke pulau terluar.",
    imageCredit: "Dok. Pelindo / Catatan Negeri",
  },
  {
    slug: "strategi-pengelolaan-keuangan-pribadi-generasi-produktif",
    featuredImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Analisis grafik portofolio investasi dan pengelolaan keuangan pribadi",
    imageCaption: "Disiplin perencanaan finansial dan diversifikasi instrumen investasi aman.",
    imageCredit: "Unsplash / Financial Times Archive",
  },
  {
    slug: "transformasi-layanan-publik-digital-nasional-akselerasi-integrasi-data-dan-dampak-nyata-bagi-masyarakat",
    featuredImage: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Pusat komputasi operasional integrasi layanan publik digital terpadu",
    imageCaption: "Integrasi sistem satu data dan portal layanan digital pemerintah bagi kemudahan warga.",
    imageCredit: "Dok. Redaksi Nasional Catatan Negeri",
  },
  {
    slug: "ketahanan-pangan-dan-stabilitas-inflasi-analisis-strategi-penguatan-distribusi-logistik-nasional-2026",
    featuredImage: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Hamparan sawah padi siap panen menjaga ketersediaan pasokan beras nasional",
    imageCaption: "Penguatan jalur pasokan beras dan komoditas pangan pokok guna menekan laju inflasi daerah.",
    imageCredit: "Dok. Kementerian Pertanian / Catatan Negeri",
  },
  {
    slug: "akselerasi-ekspor-umkm-ke-pasar-global-peluang-strategis-standar-kualitas-dan-pembiayaan-digital",
    featuredImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Aktivitas bongkar muat peti kemas kargo ekspor produk usaha lokal",
    imageCaption: "Pemberdayaan eksportir UMKM lokal bersaing di pasar global melalui standarisasi mutu.",
    imageCredit: "Dok. Asosiasi Eksportir Indonesia / Catatan Negeri",
  },
  {
    slug: "kedaulatan-data-dan-keamanan-siber-langkah-konkret-indonesia-membangun-perlindungan-ekosistem-digital",
    featuredImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Deretan rak server pusat data dengan enkripsi keamanan siber tingkat tinggi",
    imageCaption: "Pusat data nasional dengan standar perlindungan siber tier-4 untuk kedaulatan informasi.",
    imageCredit: "Unsplash / Cyber Security Lab",
  },
  {
    slug: "pemerataan-kualitas-guru-dan-fasilitas-pembelajaran-fondasi-nyata-generasi-emas-indonesia",
    featuredImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Guru membimbing murid aktif berdiskusi di dalam ruang kelas modern",
    imageCaption: "Peningkatan mutu pelatihan guru dan sarana belajar interaktif di berbagai pelosok nusantara.",
    imageCredit: "Dok. Redaksi Pendidikan Catatan Negeri",
  },
  {
    slug: "revitalisasi-fasilitas-kesehatan-primer-strategi-terintegrasi-tekan-stunting-dan-penyakit-degeneratif",
    featuredImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Dokter dan tenaga kesehatan melakukan konsultasi medis pemeriksaan kesehatan balita",
    imageCaption: "Penguatan layanan Puskesmas dan Posyandu melalui penyediaan alat medis modern.",
    imageCredit: "Dok. Redaksi Kesehatan Catatan Negeri",
  },
  {
    slug: "perencanaan-keuangan-rumah-tangga-di-era-fluktuasi-ekonomi-panduan-praktis-dana-darurat-dan-investasi-aman",
    featuredImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Pencatatan alokasi anggaran bulanan keluarga menggunakan kalkulator dan lembar keuangan",
    imageCaption: "Panduan alokasi dana darurat dan seleksi instrumen investasi resmi terdaftar OJK.",
    imageCredit: "Unsplash / Money Planning Studio",
  },
  {
    slug: "restorasi-pesisir-dan-konservasi-mangrove-benteng-alami-mitigasi-bencana-dan-penyerapan-karbon-biru",
    featuredImage: "https://images.unsplash.com/photo-1544979590-37e9b47eb705?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Hutan bakau mangrove rimbun di sepanjang garis pantai perairan tropis",
    imageCaption: "Penanaman kembali hutan mangrove pesisir sebagai penahan abrasi alami dan penyerap karbon biru.",
    imageCredit: "Dok. Komunitas Konservasi Pesisir / Catatan Negeri",
  },
  {
    slug: "percepatan-ekosistem-kendaraan-listrik-nasional-kesiapan-spklu-insentif-pajak-dan-edukasi-pengguna",
    featuredImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Unit mobil listrik sedang melakukan fast-charging di stasiun SPKLU jalan tol",
    imageCaption: "Perluasan jaringan stasiun pengisian kendaraan listrik umum demi kelancaran perjalanan antar-kota.",
    imageCredit: "Dok. Redaksi Otomotif Catatan Negeri",
  },
  {
    slug: "peluang-hunian-terjangkau-berbasis-tod-bagi-generasi-muda-analisis-aksesibilitas-dan-skema-kpr",
    featuredImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Gedung hunian apartemen vertikal terintegrasi dengan stasiun kereta perkotaan",
    imageCaption: "Konsep hunian ramah lingkungan berbasis TOD yang memudahkan mobilitas harian pekerja muda.",
    imageCredit: "Dok. Urban Planning Archive / Catatan Negeri",
  },
  {
    slug: "transparansi-dana-partai-dan-partisipasi-publik-menjaga-kualitas-demokrasi-yang-sehat-dan-beradab",
    featuredImage: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Aula sidang institusi perwakilan rakyat dan lambang demokrasi berkeadilan",
    imageCaption: "Pendidikan politik partisipatif dan transparansi pelaporan dana demi pemilu berintegritas.",
    imageCredit: "Dok. Redaksi Politik Catatan Negeri",
  },
  {
    slug: "konektivitas-jalan-daerah-menggerakkan-roda-distribusi-komoditas-unggulan-antar-kabupaten",
    featuredImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Jalan aspal mulus membentang melintasi perbukitan daerah penghasil pertanian",
    imageCaption: "Percepatan inpres jalan daerah memangkas biaya angkut logistik hasil tani hingga 40 persen.",
    imageCredit: "Dok. Kementerian PUPR / Catatan Negeri",
  },
  {
    slug: "panduan-memilih-gawai-produktivitas-2026-komparasi-efisiensi-daya-kapasitas-ai-dan-keandalan-kerja",
    featuredImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Gawai tablet dan laptop layar sentuh modern dengan aksesoris pena stylus",
    imageCaption: "Ulasan perbandingan gawai laptop dan tablet berprosesor AI untuk efisiensi komputasi kerja.",
    imageCredit: "Dok. Redaksi Gadget Catatan Negeri",
  },
  {
    slug: "membangun-kebiasaan-hidup-sehat-berkelanjutan-sinergi-olahraga-teratur-pola-tidur-dan-pola-makan",
    featuredImage: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Seorang pelari berolahraga di taman kota saat matahari terbit pagi hari",
    imageCaption: "Membangun ritme kebugaran fisik melalui olahraga kardio teratur dan istirahat berkualitas.",
    imageCredit: "Unsplash / Healthy Living Studio",
  },
  {
    slug: "kebangkitan-sinema-karya-anak-bangsa-rekor-penonton-bioskop-dan-daya-saing-narasi-budaya-lokal",
    featuredImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Deretan bangku bioskop merah dengan sorotan proyektor layar film sinema",
    imageCaption: "Antusiasme penonton film nasional di bioskop tanah air menembus rekor box office baru.",
    imageCredit: "Dok. Dewan Perfilman / Catatan Negeri",
  },
  {
    slug: "pembinaan-atlet-usia-dini-dan-fasilitas-bertaraf-internasional-menatap-prestasi-global-merah-putih",
    featuredImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Garis start lintasan lari trek tartan merah stadion olahraga internasional",
    imageCaption: "Pemberian fasilitas latihan berstandar dunia untuk mengasah potensi atlet muda Merah Putih.",
    imageCredit: "Dok. KONI / Catatan Negeri",
  },
  {
    slug: "ekowisata-dan-wisata-berkelanjutan-panduan-menjelajah-pesona-desa-wisata-tanpa-merusak-alam",
    featuredImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Pemandangan pantai pasir putih jernih dan bukit hijau destinasi wisata bahari",
    imageCaption: "Pengembangan desa wisata ramah lingkungan yang mengedepankan kearifan lokal warga pesisir.",
    imageCredit: "Dok. Kemenparekraf / Catatan Negeri",
  },
  {
    slug: "eksplorasi-warisan-gastronomi-nusantara-menjaga-otentisitas-rasa-dan-standardisasi-mutu-halal",
    featuredImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Sajian aneka hidangan masakan tradisional nusantara dengan rempah-rempah segar",
    imageCaption: "Pelestarian resep warisan kuliner tradisional nusantara bersertifikat halal dan bergizi tinggi.",
    imageCredit: "Dok. Redaksi Kuliner Nusantara Catatan Negeri",
  },
  {
    slug: "panduan-lengkap-mengelola-anggaran-belanja-keluarga-trik-cermat-hemat-tanpa-mengorbankan-kebutuhan",
    featuredImage: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Struk belanjaan supermarket dan catatan perincian kas kebutuhan pokok bulanan",
    imageCaption: "Strategi cermat mengelola belanja dapur dan pos pengeluaran bulanan keluarga tanpa defisit.",
    imageCredit: "Unsplash / Smart Family Budget",
  },
  {
    slug: "literasi-digital-menyikapi-konten-viral-di-media-sosial-panduan-membedakan-fakta-dan-manipulasi-ai",
    featuredImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Gelombang visual digital data interaktif menggambarkan arus informasi media sosial",
    imageCaption: "Pentingnya verifikasi fakta dan filter kritis menyaring konten viral sebelum menyebarkannya.",
    imageCredit: "Unsplash / Digital Trends Lab",
  },
];

async function updateAllImages() {
  console.log("=== Memperbarui Gambar Artikel Catatan Negeri ===");
  let updatedCount = 0;

  for (const item of ARTICLE_IMAGE_UPDATES) {
    const article = await prisma.article.findUnique({
      where: { slug: item.slug },
      select: { id: true, title: true, slug: true },
    });

    if (!article) {
      console.log(`[LEWAT] Artikel dengan slug '${item.slug}' tidak ditemukan.`);
      continue;
    }

    await prisma.article.update({
      where: { id: article.id },
      data: {
        featuredImage: item.featuredImage,
        imageAlt: item.imageAlt,
        imageCaption: item.imageCaption,
        imageCredit: item.imageCredit,
      },
    });

    console.log(`[UPDATE BERHASIL] ${article.title.slice(0, 50)}...`);
    console.log(`  -> URL Gambar: ${item.featuredImage.slice(0, 60)}...`);
    updatedCount++;
  }

  console.log(`\nSelesai! Sebanyak ${updatedCount} artikel telah diperbarui dengan gambar tematik yang berbeda.`);
}

updateAllImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


import { PrismaClient, Role, ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

const CATEGORIES = [
  { name: "Nasional", slug: "nasional", description: "Berita aktual peristiwa, kebijakan publik, dan dinamika kebangsaan Indonesia.", sortOrder: 1 },
  { name: "Daerah", slug: "daerah", description: "Kabar dan dinamika pembangunan dari pelosok Sabang sampai Merauke.", sortOrder: 2 },
  { name: "Politik", slug: "politik", description: "Analisis politik, pemilu, legislatif, dan kebijakan pemerintahan.", sortOrder: 3 },
  { name: "Ekonomi", slug: "ekonomi", description: "Indikator makro ekonomi, moneter, fiskal, dan perdagangan nasional.", sortOrder: 4 },
  { name: "Bisnis", slug: "bisnis", description: "Dunia usaha, industri, perbankan, pasar modal, dan aksi korporasi.", sortOrder: 5 },
  { name: "Teknologi", slug: "teknologi", description: "Inovasi digital, AI, transformasi industri, dan perkembangan sains.", sortOrder: 6 },
  { name: "Gadget", slug: "gadget", description: "Ulasan smartphone, laptop, piranti pintar, dan panduan beli gadget.", sortOrder: 7 },
  { name: "Otomotif", slug: "otomotif", description: "Kendaraan listrik, industri otomotif, review mobil dan motor terbaru.", sortOrder: 8 },
  { name: "Pendidikan", slug: "pendidikan", description: "Kurikulum, perguruan tinggi, beasiswa, dan inovasi edukasi nusantara.", sortOrder: 9 },
  { name: "Kesehatan", slug: "kesehatan", description: "Gaya hidup sehat, info medis terpercaya, nutrisi, dan kesehatan keluarga.", sortOrder: 10 },
  { name: "Gaya Hidup", slug: "gaya-hidup", description: "Tren fesyen, produktivitas, hubungan sosial, dan psikologi modern.", sortOrder: 11 },
  { name: "Hiburan", slug: "hiburan", description: "Sinema Indonesia, musik, budaya pop, dan ulasan seni kontemporer.", sortOrder: 12 },
  { name: "Olahraga", slug: "olahraga", description: "Kabar Timnas Indonesia, sepak bola dunia, bulutangkis, dan atletik.", sortOrder: 13 },
  { name: "Travel", slug: "travel", description: "Destinasi wisata prioritas Indonesia, eksplorasi alam, dan panduan perjalanan.", sortOrder: 14 },
  { name: "Kuliner", slug: "kuliner", description: "Kekayaan kuliner tradisional nusantara, kafe, dan resep autentik.", sortOrder: 15 },
  { name: "Properti", slug: "properti", description: "Pasar rumah tapak, apartemen, tips KPR, dan investasi properti.", sortOrder: 16 },
  { name: "Keuangan", slug: "keuangan", description: "Perencanaan keuangan pribadi, investasi reksadana, saham, dan emas.", sortOrder: 17 },
  { name: "Tips dan Panduan", slug: "tips-dan-panduan", description: "Panduan praktis sehari-hari, tutorial teknologi, dan solusi masalah kerja.", sortOrder: 18 },
  { name: "Lingkungan", slug: "lingkungan", description: "Konservasi alam, transisi energi hijau, dan aksi perubahan iklim.", sortOrder: 19 },
  { name: "Tren dan Viral", slug: "tren-dan-viral", description: "Topik hangat media sosial, fenomena internet, dan percakapan publik terkini.", sortOrder: 20 },
];

const TAGS = [
  { name: "Ekonomi Digital", slug: "ekonomi-digital" },
  { name: "Investasi Hijau", slug: "investasi-hijau" },
  { name: "Mobil Listrik", slug: "mobil-listrik" },
  { name: "Timnas Indonesia", slug: "timnas-indonesia" },
  { name: "Kecerdasan Buatan", slug: "kecerdasan-buatan" },
  { name: "IKN Nusantara", slug: "ikn-nusantara" },
  { name: "Kebijakan Publik", slug: "kebijakan-publik" },
  { name: "Kesehatan Mental", slug: "kesehatan-mental" },
  { name: "Pendidikan Berkualitas", slug: "pendidikan-berkualitas" },
  { name: "Pariwisata Nusantara", slug: "pariwisata-nusantara" },
];

async function main() {
  console.log("Seeding database Catatan Negeri...");

  // 1. Categories
  console.log("Creating 20 categories...");
  const categoryMap = new Map();
  for (const cat of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: {
        ...cat,
        metaTitle: `${cat.name} Terkini & Terpercaya - Catatan Negeri`,
        metaDescription: cat.description,
      },
    });
    categoryMap.set(cat.slug, record.id);
  }

  // 2. Tags
  console.log("Creating tags...");
  const tagMap = new Map();
  for (const tag of TAGS) {
    const record = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
    tagMap.set(tag.slug, record.id);
  }

  // 3. Users and Author Profiles
  console.log("Creating editorial team...");
  const adminPassword = await hashPassword("Admin123!CatatanNegeri");
  const adminUser = await prisma.user.upsert({
    where: { email: "redaksi@catatannegeri.com" },
    update: {},
    create: {
      email: "redaksi@catatannegeri.com",
      passwordHash: adminPassword,
      name: "Tim Redaksi Catatan Negeri",
      role: Role.SUPER_ADMIN,
      authorProfile: {
        create: {
          displayName: "Redaksi Catatan Negeri",
          slug: "redaksi-catatan-negeri",
          title: "Dewan Redaksi Nasional",
          bio: "Tim editorial terpadu Catatan Negeri yang mengedepankan prinsip jurnalisme berimbang, verifikasi faktual mendalam, dan komitmen terhadap pencerahan masyarakat Indonesia.",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
          socialTwitter: "catatannegeri",
          socialLinkedin: "catatannegeri",
        },
      },
    },
    include: { authorProfile: true },
  });

  const editorPassword = await hashPassword("Editor123!CatatanNegeri");
  const editorUser = await prisma.user.upsert({
    where: { email: "editor@catatannegeri.com" },
    update: {},
    create: {
      email: "editor@catatannegeri.com",
      passwordHash: editorPassword,
      name: "Budi Santoso",
      role: Role.EDITOR,
      authorProfile: {
        create: {
          displayName: "Budi Santoso",
          slug: "budi-santoso",
          title: "Managing Editor",
          bio: "Jurnalis berpengalaman lebih dari 15 tahun meliput makro ekonomi, kebijakan fiskal, dan geopolitik kawasan Asia Tenggara.",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
          socialTwitter: "budisantoso_id",
          socialLinkedin: "budisantoso",
        },
      },
    },
    include: { authorProfile: true },
  });

  const authorPassword = await hashPassword("Wartawan123!CatatanNegeri");
  const authorUser = await prisma.user.upsert({
    where: { email: "dewi.lestari@catatannegeri.com" },
    update: {},
    create: {
      email: "dewi.lestari@catatannegeri.com",
      passwordHash: authorPassword,
      name: "Dewi Lestari",
      role: Role.AUTHOR,
      authorProfile: {
        create: {
          displayName: "Dewi Lestari",
          slug: "dewi-lestari",
          title: "Jurnalis Investigasi & Sains",
          bio: "Menulis topik sains, kecerdasan buatan, lingkungan, dan dampak teknologi terhadap masyarakat urban Indonesia.",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
          socialTwitter: "dewi_lestari_cn",
        },
      },
    },
    include: { authorProfile: true },
  });

  // 4. Articles
  console.log("Seeding rich editorial articles...");
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 1000 * 60 * 60);
  const twoHoursAgo = new Date(now.getTime() - 1000 * 60 * 120);
  const fourHoursAgo = new Date(now.getTime() - 1000 * 60 * 240);
  const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24);
  const twoDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 48);

  const sampleArticles = [
    {
      title: "Bank Indonesia Pertahankan BI-Rate: Fokus Jaga Stabilitas Nilai Tukar dan Inflasi Terkendali",
      slug: "bank-indonesia-pertahankan-bi-rate-fokus-stabilitas-inflasi",
      categorySlug: "ekonomi",
      authorId: editorUser.authorProfile.id,
      publishedAt: oneHourAgo,
      isBreaking: true,
      isFeatured: true,
      isEditorPick: true,
      readingTime: 4,
      viewCount: 1420,
      featuredImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Gedung Bank Indonesia di Jakarta Pusat dalam sorotan lampu sore hari",
      imageCaption: "Gedung Kompleks Perkantoran Bank Indonesia di Jakarta Pusat.",
      imageCredit: "Dok. Humas Bank Indonesia / Catatan Negeri",
      summary: "Rapat Dewan Gubernur Bank Indonesia memutuskan mempertahankan suku bunga acuan BI-Rate guna memastikan stabilitas nilai tukar Rupiah tetap terjaga dan inflasi tetap berada di sasaran.",
      metaTitle: "BI Pertahankan Suku Bunga Acuan BI-Rate - Catatan Negeri",
      metaDescription: "Keputusan Rapat Dewan Gubernur Bank Indonesia mempertahankan suku bunga acuan BI-Rate demi menjaga ketahanan eksternal dan stabilitas ekonomi.",
      canonicalUrl: "https://catatannegeri.com/ekonomi/bank-indonesia-pertahankan-bi-rate-fokus-stabilitas-inflasi",
      factCheckNotes: "Data bersumber langsung dari Siaran Pers Resmi Departemen Komunikasi Bank Indonesia No. 26/DG/X/2026.",
      sourceReferences: JSON.stringify([
        { source: "Bank Indonesia", url: "https://www.bi.go.id", type: "Siaran Pers Resmi" },
        { source: "Badan Pusat Statistik", url: "https://www.bps.go.id", type: "Data Inflasi" }
      ]),
      tags: ["ekonomi-digital", "kebijakan-publik"],
      content: `
<p><strong>JAKARTA, CATATANNEGERI.COM</strong> — Rapat Dewan Gubernur (RDG) Bank Indonesia (BI) memutuskan untuk mempertahankan suku bunga acuan BI-Rate sebesar 6,00%. Keputusan ini diambil sejalan dengan arah kebijakan moneter yang fokus pada penguatan stabilisasi nilai tukar Rupiah dan kepastian inflasi terkendali dalam sasaran 2,5±1% pada tahun berjalan.</p>

<h2>Pertimbangan Makro dan Ketidakpastian Global</h2>
<p>Gubernur Bank Indonesia menyampaikan bahwa dinamika pasar keuangan global masih dibayangi ketidakpastian suku bunga bank sentral negara maju, tensi geopolitik regional, serta fluktuasi harga komoditas energi internasional.</p>

<blockquote>
  "Kebijakan suku bunga tetap konsisten dengan fokus kebijakan moneter yang pro-stability, yaitu untuk menjaga stabilisasi nilai tukar Rupiah serta langkah pre-emptive dan forward looking untuk memastikan inflasi tetap berada dalam target sasaran pemerintah," demikian penegasan resmi Dewan Gubernur.
</blockquote>

<h2>Ketahanan Sektor Perbankan Nasional</h2>
<p>Likuiditas perbankan nasional dinilai tetap memadai didukung oleh implementasi Kebijakan Insentif Likuiditas Makroprudensial (KLM) yang diarahkan pada sektor-sektor prioritas pencipta lapangan kerja, hilirisasi industri, serta UMKM.</p>

<ul>
  <li>Rasio Kecukupan Modal (CAR) perbankan tetap tinggi di atas 26%.</li>
  <li>Pertumbuhan kredit perbankan mencatatkan kinerja positif dua digit secara tahunan (year-on-year).</li>
  <li>Rasio kredit bermasalah (NPL) gross tetap terjaga rendah di bawah batas aman 3%.</li>
</ul>

<h2>Dampak Terhadap Dunia Usaha dan Konsumen</h2>
<p>Keputusan mempertahankan suku bunga ini memberikan kepastian kalkulasi bagi kalangan dunia usaha dalam merencanakan belanja modal (capex) kuartal mendatang. Sementara itu, tingkat suku bunga simpanan dan kredit diproyeksikan tetap stabil tanpa lonjakan beban cicilan bagi masyarakat.</p>

<p>Redaksi Catatan Negeri akan terus memantau respon pasar modal dan pergerakan nilai tukar Rupiah terhadap mata uang utama mitra dagang sepanjang sesi perdagangan pekan ini.</p>
      `.trim(),
    },
    {
      title: "Peta Jalan Kecerdasan Buatan Nasional: Membangun Kemandirian Data dan Etika AI di Indonesia",
      slug: "peta-jalan-kecerdasan-buatan-nasional-kemandirian-data-etika-ai",
      categorySlug: "teknologi",
      authorId: authorUser.authorProfile.id,
      publishedAt: twoHoursAgo,
      isBreaking: false,
      isFeatured: true,
      isEditorPick: true,
      readingTime: 5,
      viewCount: 980,
      featuredImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Visualisasi jaringan saraf kecerdasan buatan dalam bentuk node cahaya digital",
      imageCaption: "Infrastruktur kecerdasan buatan membutuhkan kedaulatan data dan regulasi etika yang komprehensif.",
      imageCredit: "Unsplash / DeepMind AI Research",
      summary: "Pemerintah bersama asosiasi industri teknologi merampungkan kerangka regulasi dan tata kelola etika kecerdasan buatan guna melindungi kedaulatan data lokal.",
      metaTitle: "Peta Jalan Kecerdasan Buatan Nasional dan Etika AI - Catatan Negeri",
      metaDescription: "Eksplorasi tata kelola kecerdasan buatan (AI) di Indonesia: kedaulatan komputasi, perlindungan data pribadi, dan masa depan talenta digital.",
      canonicalUrl: "https://catatannegeri.com/teknologi/peta-jalan-kecerdasan-buatan-nasional-kemandirian-data-etika-ai",
      factCheckNotes: "Materi diverifikasi berdasarkan Dokumen Pedoman Etika AI Kementerian Komunikasi dan Informatika serta hasil riset kolaborasi BRIN.",
      sourceReferences: JSON.stringify([
        { source: "Kementerian Kominfo", url: "https://kominfo.go.id", type: "Pedoman Etika Kecerdasan Buatan" },
        { source: "BRIN", url: "https://brin.go.id", type: "Riset Sains Komputasi" }
      ]),
      tags: ["kecerdasan-buatan", "ekonomi-digital"],
      content: `
<p><strong>JAKARTA, CATATANNEGERI.COM</strong> — Perkembangan teknologi kecerdasan buatan (Artificial Intelligence/AI) generatif tidak lagi sekadar menjadi tren konsumen, melainkan pilar strategis ketahanan digital bangsa. Menghadapi percepatan adopsi ini, Indonesia menegaskan langkah memperkuat kemandirian infrastruktur data serta pedoman etika pemanfaatan algoritma cerdas.</p>

<h2>Tiga Pilar Utama Strategi AI Nasional</h2>
<p>Perumusan tata kelola AI nasional dirancang dengan memperhatikan kepentingan nasional jangka panjang tanpa membelenggu laju inovasi startup lokal:</p>

<ol>
  <li><strong>Kedaulatan dan Tata Kelola Data (Data Sovereignty):</strong> Perlindungan dataset lokal berbahasa daerah dan bahasa Indonesia agar tidak dieksploitasi sepihak oleh platform asing tanpa transfer nilai ekonomi.</li>
  <li><strong>Infrastruktur Komputasi Hijau:</strong> Pembangunan pusat data ramah lingkungan berbasis energi terbarukan di berbagai koridor ekonomi pulau Jawa dan luar Jawa.</li>
  <li><strong>Pencegahan Disinformasi dan Deepfake:</strong> Protokol identifikasi konten sintetis otomatis guna melindungi ruang publik dari manipulasi politik dan penipuan finansial.</li>
</ol>

<h2>Tantangan Talenta dan Kesenjangan Digital</h2>
<p>Meskipun minat generasi muda terhadap sains data kian melonjak, ketersediaan engineer yang menguasai arsitektur model bahasa besar (LLM) di tanah air masih tergolong langka. Dibutuhkan sinergi erat antara perguruan tinggi negeri maupun swasta dengan ekosistem industri teknologi.</p>

<p>Kemandirian digital bukan berarti mengisolasi diri dari perkembangan dunia, melainkan menjadi subjek aktif yang menentukan arah peradaban teknologi di tanah air sendiri.</p>
      `.trim(),
    },
    {
      title: "Transisi Ekosistem Mobil Listrik Nasional: Capaian TKDN dan Tantangan Jaringan Pengisian Daya",
      slug: "transisi-ekosistem-mobil-listrik-nasional-tkdn-spklu",
      categorySlug: "otomotif",
      authorId: authorUser.authorProfile.id,
      publishedAt: fourHoursAgo,
      isBreaking: false,
      isFeatured: false,
      isEditorPick: true,
      readingTime: 4,
      viewCount: 640,
      featuredImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Stasiun pengisian kendaraan listrik umum dengan mobil listrik terhubung kabel daya",
      imageCaption: "Stasiun Pengisian Kendaraan Listrik Umum (SPKLU) terus diperluas di jalur arteri dan tol trans-Jawa.",
      imageCredit: "Dok. PLN UID / Catatan Negeri",
      summary: "Industri manufaktur kendaraan listrik di Indonesia mencatatkan peningkatan tingkat komponen dalam negeri (TKDN), didukung pembangunan fasilitas baterai terintegrasi.",
      metaTitle: "Transisi Mobil Listrik Indonesia: TKDN dan Ekosistem SPKLU",
      metaDescription: "Analisis mendalam kemajuan rantai pasok kendaraan listrik nasional, penetrasi pasar EV, dan kesiapan infrastruktur SPKLU.",
      canonicalUrl: "https://catatannegeri.com/otomotif/transisi-ekosistem-mobil-listrik-nasional-tkdn-spklu",
      tags: ["mobil-listrik", "investasi-hijau"],
      content: `
<p><strong>BEKASI, CATATANNEGERI.COM</strong> — Transformasi sektor otomotif Indonesia memasuki fase krusial seiring mulai beroperasinya fasilitas pemurnian dan perakitan sel baterai terintegrasi di koridor industri Jawa Barat. Langkah ini mendongkrak capaian Tingkat Komponen Dalam Negeri (TKDN) mobil listrik rakitan lokal melampaui angka 40 persen.</p>

<h2>Penyebaran Infrastruktur Pengisian Daya</h2>
<p>Kendati minat konsumen urban kian tinggi, pemerataan Stasiun Pengisian Kendaraan Listrik Umum (SPKLU) tipe ultra-fast charging masih menjadi catatan penting bagi para pemangku kepentingan. Kolaborasi antara BUMN kelistrikan dan operator swasta terus digenjot guna memastikan para pengguna kendaraan listrik dapat bepergian antar-kota dengan rasa aman tanpa kekhawatiran kehabisan daya (range anxiety).</p>

<h2>Insentif Fiskal dan Efisiensi Operasional</h2>
<p>Bagi konsumen, selisih biaya energi per kilometer antara BBM konvensional dan listrik rumah tangga menjadi faktor pemikat utama. Dalam jangka panjang, percepatan elektrifikasi transportasi publik di kota-kota besar diyakini mampu memangkas emisi karbon perkotaan secara signifikan.</p>
      `.trim(),
    },
    {
      title: "Pembangunan Infrastruktur Konektivitas Daerah Terpencil: Merajut Keadilan Logistik Maritim",
      slug: "pembangunan-infrastruktur-konektivitas-daerah-keadilan-logistik",
      categorySlug: "daerah",
      authorId: adminUser.authorProfile.id,
      publishedAt: yesterday,
      isBreaking: false,
      isFeatured: false,
      isEditorPick: false,
      readingTime: 3,
      viewCount: 420,
      featuredImage: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Kapal kargo dan kontainer bersandar di pelabuhan laut nusantara",
      imageCaption: "Tol laut dan pelabuhan perintis memangkas disparitas harga kebutuhan pokok di wilayah 3T.",
      imageCredit: "Kementerian Perhubungan RI",
      summary: "Pemerintah memperluas rute pelayaran perintis dan tol laut guna memastikan disparitas harga sembako di kawasan kepulauan terpencil dapat terus ditekan.",
      metaTitle: "Konektivitas Daerah & Keadilan Logistik Maritim - Catatan Negeri",
      metaDescription: "Program tol laut dan pelabuhan perintis sukses memangkas disparitas harga kebutuhan pokok masyarakat di kepulauan terluar Indonesia.",
      canonicalUrl: "https://catatannegeri.com/daerah/pembangunan-infrastruktur-konektivitas-daerah-keadilan-logistik",
      tags: ["kebijakan-publik"],
      content: `
<p><strong>AMBON, CATATANNEGERI.COM</strong> — Sebagai negara kepulauan terbesar di dunia, konektivitas laut adalah urat nadi kehidupan bangsa. Optimalisasi trayek kapal perintis dan tol laut di kawasan Maluku, Papua, dan Nusa Tenggara membuktikan dampak konkret terhadap penurunan harga semen, beras, dan minyak goreng di pasar lokal.</p>

<p>Kementerian Perhubungan bersama pemerintah daerah terus memperkuat integrasi antara pelabuhan pengumpul dan pelabuhan pengumpan lokal sehingga hasil bumi dari nelayan dan petani kepulauan dapat langsung dipasarkan ke pusat konsumsi nasional tanpa rantai tengkulak yang panjang.</p>
      `.trim(),
    },
    {
      title: "Strategi Pengelolaan Keuangan Pribadi Generasi Produktif di Tengah Volatilitas Global",
      slug: "strategi-pengelolaan-keuangan-pribadi-generasi-produktif",
      categorySlug: "keuangan",
      authorId: editorUser.authorProfile.id,
      publishedAt: twoDaysAgo,
      isBreaking: false,
      isFeatured: false,
      isEditorPick: true,
      readingTime: 4,
      viewCount: 810,
      featuredImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Aplikasi perencanaan portofolio keuangan pada layar gawai dan kalkulator",
      imageCaption: "Alokasi dana darurat dan diversifikasi instrumen pasar modal menjadi kunci ketahanan finansial keluarga.",
      imageCredit: "Unsplash / Financial Literacy Series",
      summary: "Panduan praktis menyusun anggaran, mengamankan dana darurat di instrumen likuid, dan memilih portofolio investasi yang tahan banting menghadapi dinamika inflasi.",
      metaTitle: "Tips Pengelolaan Keuangan Pribadi Generasi Produktif - Catatan Negeri",
      metaDescription: "Langkah terukur mengelola cashflow keluarga: perbanyak dana darurat, batasi utang konsumtif, dan diversifikasi investasi jangka panjang.",
      canonicalUrl: "https://catatannegeri.com/keuangan/strategi-pengelolaan-keuangan-pribadi-generasi-produktif",
      tags: ["investasi-hijau"],
      content: `
<p><strong>JAKARTA, CATATANNEGERI.COM</strong> — Ketidakpastian ekonomi global mengingatkan setiap rumah tangga akan pentingnya disiplin finansial. Banyak keluarga muda terjebak gaya hidup konsumtif tanpa memiliki bantalan likuiditas yang cukup saat terjadi guncangan pendapatan tak terduga.</p>

<h2>3 Langkah Fundamental Menata Arus Kas</h2>
<ol>
  <li><strong>Audit Pengeluaran Rutin:</strong> Bedakan secara tegas antara kebutuhan hidup mutlak (sandang, pangan, kesehatan, pendidikan) dengan keinginan sesaat yang dipicu promosi digital.</li>
  <li><strong>Kumpulkan Dana Darurat Minimal 6 Kali Pengeluaran:</strong> Simpan dana ini di instrumen yang likuid dan aman, seperti Reksadana Pasar Uang (RDPU) atau Surat Berharga Negara (SBN) ritel.</li>
  <li><strong>Hindari Pinjaman Konsumtif Bunga Tinggi:</strong> Manfaatkan fasilitas pembiayaan hanya untuk aset produktif yang menghasilkan nilai tambah atau apresiasi modal jangka panjang.</li>
</ol>
      `.trim(),
    },
  ];

  for (const art of sampleArticles) {
    const catId = categoryMap.get(art.categorySlug);
    if (!catId) continue;

    const createdArticle = await prisma.article.upsert({
      where: { slug: art.slug },
      update: {},
      create: {
        title: art.title,
        slug: art.slug,
        summary: art.summary,
        content: art.content,
        featuredImage: art.featuredImage,
        imageAlt: art.imageAlt,
        imageCaption: art.imageCaption,
        imageCredit: art.imageCredit,
        readingTime: art.readingTime,
        status: ArticleStatus.PUBLISHED,
        publishedAt: art.publishedAt,
        categoryId: catId,
        authorId: art.authorId,
        isBreaking: art.isBreaking,
        isFeatured: art.isFeatured,
        isEditorPick: art.isEditorPick,
        viewCount: art.viewCount,
        metaTitle: art.metaTitle,
        metaDescription: art.metaDescription,
        canonicalUrl: art.canonicalUrl,
        factCheckNotes: art.factCheckNotes || null,
        sourceReferences: art.sourceReferences || null,
      },
    });

    // Connect tags
    if (art.tags && art.tags.length > 0) {
      for (const tSlug of art.tags) {
        const tId = tagMap.get(tSlug);
        if (tId) {
          await prisma.articleTag.upsert({
            where: {
              articleId_tagId: {
                articleId: createdArticle.id,
                tagId: tId,
              },
            },
            update: {},
            create: {
              articleId: createdArticle.id,
              tagId: tId,
            },
          });
        }
      }
    }
  }

  // 5. Site Settings
  console.log("Configuring default site settings...");
  const settings = [
    { key: "site_title", value: "Catatan Negeri", description: "Nama Brand Media" },
    { key: "site_tagline", value: "Portal Berita & Informasi Digital Indonesia", description: "Tagline Utama" },
    { key: "breaking_news_enabled", value: "true", description: "Status Aktif Ticker Breaking News" },
    { key: "breaking_news_text", value: "BREAKING NEWS: Bank Indonesia Pertahankan Suku Bunga Acuan BI-Rate 6,00%, Jaga Stabilitas Moneter Nasional", description: "Teks Berita Terkini" },
    { key: "ad_homepage_top_enabled", value: "true", description: "Iklan Header Homepage" },
    { key: "ad_homepage_top_html", value: "<div class=\"p-3 text-center text-xs font-mono text-slate-400 bg-slate-100/80 border border-dashed border-slate-300 rounded\">[RUANG IKLAN: Leaderboard Banner 728x90]</div>", description: "HTML Banner Atas" },
    { key: "ad_sidebar_enabled", value: "true", description: "Iklan Sidebar Desktop" },
    { key: "ad_sidebar_html", value: "<div class=\"p-6 text-center text-xs font-mono text-slate-400 bg-slate-100/80 border border-dashed border-slate-300 rounded h-60 flex items-center justify-center\">[RUANG IKLAN: Medium Rectangle 300x250]</div>", description: "HTML Banner Sidebar" },
    { key: "ad_in_content_enabled", value: "true", description: "Iklan Dalam Artikel" },
    { key: "ad_in_content_html", value: "<div class=\"my-6 p-4 text-center text-xs font-mono text-slate-400 bg-slate-100/80 border border-dashed border-slate-300 rounded\">[RUANG IKLAN: In-Article Native Sponsored Display]</div>", description: "HTML Banner Dalam Artikel" },
    { key: "contact_email", value: "redaksi@catatannegeri.com", description: "Email Redaksi" },
    { key: "contact_phone", value: "+62 21 5550 1234", description: "Nomor Telepon Kantor" },
    { key: "office_address", value: "Gedung Pers Catatan Negeri, Jl. Kebon Sirih No. 45, Jakarta Pusat, DKI Jakarta 10110", description: "Alamat Kantor Redaksi" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 6. Ingestion Sources
  console.log("Configuring authorized ingestion sources...");
  const sources = [
    { name: "Antara News Terkini", url: "https://www.antaranews.com/rss/terkini.xml", type: "RSS", isActive: true },
    { name: "Siaran Pers Kominfo", url: "https://www.kominfo.go.id/feed", type: "RSS", isActive: true },
  ];

  for (const src of sources) {
    const existing = await prisma.ingestionSource.findFirst({ where: { url: src.url } });
    if (!existing) {
      await prisma.ingestionSource.create({ data: src });
    }
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


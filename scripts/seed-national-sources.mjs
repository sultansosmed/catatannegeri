import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NATIONAL_SOURCES = [
  {
    name: "Antara News - Terkini",
    websiteUrl: "https://www.antaranews.com",
    type: "RSS",
    url: "https://www.antaranews.com/rss/terkini.xml",
    allowedCategories: "Nasional",
    pollingInterval: 15,
    licenseNotes: "Lembaga Kantor Berita Nasional (LKBN) Antara - Sumber Berita Resmi Nasional",
    isActive: true,
  },
  {
    name: "Antara News - Ekonomi & Bisnis",
    websiteUrl: "https://www.antaranews.com/ekonomi",
    type: "RSS",
    url: "https://www.antaranews.com/rss/ekonomi.xml",
    allowedCategories: "Ekonomi,Bisnis,Keuangan",
    pollingInterval: 30,
    licenseNotes: "LKBN Antara Desk Ekonomi & Keuangan",
    isActive: true,
  },
  {
    name: "Antara News - Otomotif",
    websiteUrl: "https://www.antaranews.com/otomotif",
    type: "RSS",
    url: "https://www.antaranews.com/rss/otomotif.xml",
    allowedCategories: "Otomotif",
    pollingInterval: 60,
    licenseNotes: "LKBN Antara Desk Otomotif & Industri",
    isActive: true,
  },
  {
    name: "Antara News - Olahraga",
    websiteUrl: "https://www.antaranews.com/olahraga",
    type: "RSS",
    url: "https://www.antaranews.com/rss/olahraga.xml",
    allowedCategories: "Olahraga",
    pollingInterval: 30,
    licenseNotes: "LKBN Antara Desk Olahraga Nasional & Internasional",
    isActive: true,
  },
  {
    name: "CNN Indonesia - Nasional",
    websiteUrl: "https://www.cnnindonesia.com/nasional",
    type: "RSS",
    url: "https://www.cnnindonesia.com/nasional/rss",
    allowedCategories: "Nasional,Politik",
    pollingInterval: 15,
    licenseNotes: "CNN Indonesia - Liputan Nasional & Pemerintahan",
    isActive: true,
  },
  {
    name: "CNN Indonesia - Ekonomi",
    websiteUrl: "https://www.cnnindonesia.com/ekonomi",
    type: "RSS",
    url: "https://www.cnnindonesia.com/ekonomi/rss",
    allowedCategories: "Ekonomi,Bisnis",
    pollingInterval: 30,
    licenseNotes: "CNN Indonesia - Analisis Pasar & Kebijakan Fiskal",
    isActive: true,
  },
  {
    name: "CNN Indonesia - Teknologi",
    websiteUrl: "https://www.cnnindonesia.com/teknologi",
    type: "RSS",
    url: "https://www.cnnindonesia.com/teknologi/rss",
    allowedCategories: "Teknologi,Gadget",
    pollingInterval: 30,
    licenseNotes: "CNN Indonesia - Transformasi Digital & Inovasi",
    isActive: true,
  },
  {
    name: "CNN Indonesia - Olahraga",
    websiteUrl: "https://www.cnnindonesia.com/olahraga",
    type: "RSS",
    url: "https://www.cnnindonesia.com/olahraga/rss",
    allowedCategories: "Olahraga",
    pollingInterval: 30,
    licenseNotes: "CNN Indonesia - Kompetisi & Prestasi Atlet",
    isActive: true,
  },
  {
    name: "CNN Indonesia - Hiburan & Gaya Hidup",
    websiteUrl: "https://www.cnnindonesia.com/hiburan",
    type: "RSS",
    url: "https://www.cnnindonesia.com/hiburan/rss",
    allowedCategories: "Hiburan,Gaya Hidup,Tren dan Viral",
    pollingInterval: 45,
    licenseNotes: "CNN Indonesia - Budaya Populer & Seni",
    isActive: true,
  },
  {
    name: "CNBC Indonesia - News",
    websiteUrl: "https://www.cnbcindonesia.com/news",
    type: "RSS",
    url: "https://www.cnbcindonesia.com/news/rss",
    allowedCategories: "Nasional,Ekonomi",
    pollingInterval: 15,
    licenseNotes: "CNBC Indonesia - Kebijakan Makroekonomi & Regulasi",
    isActive: true,
  },
  {
    name: "CNBC Indonesia - Market & Bisnis",
    websiteUrl: "https://www.cnbcindonesia.com/market",
    type: "RSS",
    url: "https://www.cnbcindonesia.com/market/rss",
    allowedCategories: "Bisnis,Keuangan,Ekonomi",
    pollingInterval: 30,
    licenseNotes: "CNBC Indonesia - Pasar Modal, Komoditas & Perbankan",
    isActive: true,
  },
  {
    name: "CNBC Indonesia - Tech",
    websiteUrl: "https://www.cnbcindonesia.com/tech",
    type: "RSS",
    url: "https://www.cnbcindonesia.com/tech/rss",
    allowedCategories: "Teknologi,Gadget",
    pollingInterval: 30,
    licenseNotes: "CNBC Indonesia - Startup, Fintech & Kecerdasan Buatan",
    isActive: true,
  },
  {
    name: "Republika - Terkini",
    websiteUrl: "https://www.republika.co.id",
    type: "RSS",
    url: "https://www.republika.co.id/rss",
    allowedCategories: "Nasional,Pendidikan,Daerah",
    pollingInterval: 30,
    licenseNotes: "Republika Online - Berita Nasional & Sosial Kemasyarakatan",
    isActive: true,
  },
  {
    name: "Tempo - Nasional",
    websiteUrl: "https://nasional.tempo.co",
    type: "RSS",
    url: "https://rss.tempo.co/nasional",
    allowedCategories: "Nasional,Politik",
    pollingInterval: 30,
    licenseNotes: "Tempo.co - Investigasi & Kebijakan Publik",
    isActive: true,
  },
  {
    name: "Tempo - Bisnis",
    websiteUrl: "https://bisnis.tempo.co",
    type: "RSS",
    url: "https://rss.tempo.co/bisnis",
    allowedCategories: "Bisnis,Ekonomi",
    pollingInterval: 30,
    licenseNotes: "Tempo.co - Analisis Bisnis & Industri",
    isActive: true,
  },
];

async function seedNationalSources() {
  console.log("🌱 Menyiapkan sumber berita media nasional terverifikasi...");

  // Nonaktifkan sumber lama yang tidak aktif (misal Kominfo DNS error)
  await prisma.ingestionSource.updateMany({
    where: { url: { contains: "kominfo.go.id" } },
    data: { isActive: false, lastError: "Domain DNS tidak aktif" },
  });

  let addedCount = 0;
  let updatedCount = 0;

  for (const src of NATIONAL_SOURCES) {
    const existing = await prisma.ingestionSource.findFirst({
      where: {
        OR: [
          { url: src.url },
          { name: src.name },
        ],
      },
    });

    if (existing) {
      await prisma.ingestionSource.update({
        where: { id: existing.id },
        data: {
          name: src.name,
          websiteUrl: src.websiteUrl,
          url: src.url,
          allowedCategories: src.allowedCategories,
          pollingInterval: src.pollingInterval,
          licenseNotes: src.licenseNotes,
          isActive: true,
        },
      });
      updatedCount++;
      console.log(`  ✓ Diperbarui: ${src.name}`);
    } else {
      await prisma.ingestionSource.create({
        data: {
          name: src.name,
          websiteUrl: src.websiteUrl,
          type: src.type,
          url: src.url,
          allowedCategories: src.allowedCategories,
          pollingInterval: src.pollingInterval,
          licenseNotes: src.licenseNotes,
          isActive: true,
        },
      });
      addedCount++;
      console.log(`  + Ditambahkan: ${src.name}`);
    }
  }

  const totalActive = await prisma.ingestionSource.count({ where: { isActive: true } });
  console.log(`\n🎉 Selesai! Ditambahkan: ${addedCount}, Diperbarui: ${updatedCount}, Total Aktif: ${totalActive} Sumber Media Nasional.`);
}

seedNationalSources()
  .catch((e) => {
    console.error("Gagal menyemai sumber berita nasional:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


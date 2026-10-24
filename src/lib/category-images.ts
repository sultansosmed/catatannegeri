/**
 * Mapping gambar editorial tematik berkualitas tinggi untuk setiap kategori berita Catatan Negeri.
 * Menghindari gambar placeholder generik dan memastikan kesesuaian visual dengan topik berita.
 */

export interface CategoryVisual {
  image: string;
  alt: string;
  caption: string;
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  nasional: {
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
    alt: "Pusat komputasi dan tata kelola kebijakan publik nasional",
    caption: "Integrasi data dan transformasi pelayanan publik nasional — Catatan Negeri",
  },
  daerah: {
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
    alt: "Konektivitas jalan daerah dan infrastruktur logistik antarkabupaten",
    caption: "Pembangunan infrastruktur konektivitas kawasan daerah nusantara.",
  },
  politik: {
    image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    alt: "Gedung institusi demokrasi dan tata kelola kebijakan negara",
    caption: "Dinamika demokrasi dan transparansi tata kelola pemerintahan publik.",
  },
  ekonomi: {
    image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80",
    alt: "Ketahanan pangan dan rantai pasok ekonomi nasional",
    caption: "Penguatan ketahanan komoditas dan stabilitas ekonomi makro nasional.",
  },
  bisnis: {
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    alt: "Perdagangan internasional dan rantai pasok ekspor usaha bisnis",
    caption: "Pemberdayaan sektor bisnis, industri ekspor, dan kemitraan strategis.",
  },
  teknologi: {
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    alt: "Infrastruktur server komputasi awan dan keamanan siber",
    caption: "Perlindungan data dan akselerasi teknologi kecerdasan digital masa depan.",
  },
  gadget: {
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    alt: "Gawai modern smartphone dan laptop penunjang produktivitas",
    caption: "Inovasi gawai pintar berkinerja tinggi untuk mendukung gaya hidup produktif.",
  },
  otomotif: {
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    alt: "Stasiun pengisian kendaraan listrik umum dan mobilitas modern",
    caption: "Akselerasi ekosistem kendaraan listrik dan teknologi transportasi ramah lingkungan.",
  },
  pendidikan: {
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    alt: "Suasana ruang kelas dan interaksi guru bersama para siswa",
    caption: "Peningkatan kualitas pembelajaran dan pemerataan fasilitas pendidikan generasi bangsa.",
  },
  kesehatan: {
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    alt: "Pemeriksaan medis dan fasilitas layanan kesehatan primer Puskesmas",
    caption: "Revitalisasi layanan kesehatan masyarakat dan promosi nutrisi gizi keluarga.",
  },
  "gaya-hidup": {
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80",
    alt: "Gaya hidup sehat bugar dengan olahraga rutin dan nutrisi alami",
    caption: "Inspirasi rutinitas kebugaran dan pola hidup seimbang di era modern.",
  },
  hiburan: {
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    alt: "Auditorium bioskop dan panggung sinema seni pertunjukan",
    caption: "Kiprah industri kreatif perfilman dan hiburan anak bangsa di kancah nasional.",
  },
  olahraga: {
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    alt: "Lintasan lari stadion atletik sarana latihan prestasi olahraga",
    caption: "Pembinaan atlet muda dan fasilitas olahraga berstandar kompetisi internasional.",
  },
  travel: {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    alt: "Pesona destinasi bahari tropis dan pesisir alam nusantara",
    caption: "Eksplorasi keindahan alam desa wisata dan perjalanan ramah lingkungan.",
  },
  kuliner: {
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    alt: "Ragam hidangan kuliner tradisional kaya rempah Nusantara",
    caption: "Warisan gastronomi otentik dan inovasi industri kuliner halal nusantara.",
  },
  properti: {
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    alt: "Kawasan hunian modern terpadu berbasis transportasi publik TOD",
    caption: "Aksesibilitas hunian perkotaan terjangkau dengan konsep transit-oriented development.",
  },
  keuangan: {
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    alt: "Pencatatan kalkulasi perencanaan keuangan dan investasi aman",
    caption: "Literasi pengelolaan kas keluarga, dana darurat, dan investasi berizin resmi.",
  },
  "tips-dan-panduan": {
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
    alt: "Pencatatan belanja kebutuhan hemat dan manajemen rumah tangga cerdas",
    caption: "Panduan praktis dan solusi efisien untuk kebutuhan sehari-hari keluarga.",
  },
  lingkungan: {
    image: "https://images.unsplash.com/photo-1544979590-37e9b47eb705?auto=format&fit=crop&w=1200&q=80",
    alt: "Hutan mangrove pesisir benteng alami pelindung ekosistem laut",
    caption: "Konservasi alam, restorasi keanekaragaman hayati, dan mitigasi iklim.",
  },
  "tren-dan-viral": {
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    alt: "Visualisasi digital aliran informasi dan perbincangan warganet",
    caption: "Literasi digital dalam menyikapi dinamika topik perbincangan viral di media sosial.",
  },
};

const DEFAULT_PORTAL_VISUAL: CategoryVisual = {
  image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  alt: "Portal Berita Catatan Negeri",
  caption: "Dokumentasi Redaksi Catatan Negeri",
};

export function getCategoryVisual(categorySlug?: string | null): CategoryVisual {
  if (!categorySlug) return DEFAULT_PORTAL_VISUAL;
  const normalized = categorySlug.toLowerCase().trim();
  return CATEGORY_VISUALS[normalized] || DEFAULT_PORTAL_VISUAL;
}


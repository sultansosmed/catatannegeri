import React from "react";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pedoman Pemberitaan Media Siber — Catatan Negeri",
  description: "Pedoman Pemberitaan Media Siber Catatan Negeri mengacu pada Keputusan Dewan Pers No. 1/Peraturan-DP/III/2012.",
  alternates: {
    canonical: `${SITE_URL}/pedoman-media-siber`,
  },
};

export default function PedomanMediaSiberPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ name: "Pedoman Media Siber", url: "/pedoman-media-siber" }]} />

      <article className="prose prose-slate max-w-none">
        <header className="border-b-2 border-brand-navy pb-4 mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
            Standar Kepatuhan Pers Nasional
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-navy mt-1 mb-2">
            Pedoman Pemberitaan Media Siber
          </h1>
          <p className="text-xs text-slate-500">
            Ditetapkan berdasarkan Peraturan Dewan Pers Nomor: 1/Peraturan-DP/III/2012
          </p>
        </header>

        <p>
          Kemerdekaan berpendapat, kemerdekaan berekspresi, dan kemerdekaan pers adalah hak asasi manusia yang dilindungi Pancasila, Undang-Undang Dasar 1945, dan Deklarasi Universal Hak Asasi Manusia PBB. Media siber <strong>Catatan Negeri (catatannegeri.com)</strong> dalam menjalankan tugas jurnalistik berpegang teguh pada prinsip-prinsip profesionalisme, kebenaran, dan kepentingan publik melalui pedoman berikut:
        </p>

        <h2>1. Ruang Lingkup</h2>
        <p>
          Media Siber adalah segala bentuk media yang menggunakan wahana internet dan melaksanakan kegiatan jurnalistik, serta memenuhi persyaratan Undang-Undang Pers dan Standar Perusahaan Pers yang ditetapkan Dewan Pers.
        </p>

        <h2>2. Verifikasi dan Keberimbangan Berita</h2>
        <ul>
          <li>Pada prinsipnya setiap berita harus melalui proses verifikasi fakta dan konfirmasi dari pihak yang berwenang atau pihak terkait.</li>
          <li>Berita yang dapat merugikan pihak lain memerlukan verifikasi pada berita yang sama untuk memenuhi prinsip akurasi dan keberimbangan (cover both sides).</li>
          <li>Dalam keadaan darurat atau berita kilat (breaking news), berita dapat dimuat dengan syarat mencantumkan keterangan bahwa verifikasi lanjutan masih terus diupayakan.</li>
        </ul>

        <h2>3. Isi Buatan Pengguna (User Generated Content)</h2>
        <p>
          Catatan Negeri mewajibkan setiap pengguna untuk mendaftar dan mematuhi etika ruang publik. Catatan Negeri berhak menyunting atau menghapus komentar, opini, atau materi pengguna yang mengandung unsur SARA, ujaran kebencian, fitnah, pornografi, atau hasutan kekerasan.
        </p>

        <h2>4. Ralat, Koreksi, dan Hak Jawab</h2>
        <p>
          Ralat, koreksi, dan hak jawab mengacu pada Undang-Undang Pers, Kode Etik Jurnalistik, dan Pedoman Hak Jawab yang ditetapkan Dewan Pers. Ralat dan hak jawab harus ditautkan pada berita yang bersangkutan secara transparan.
        </p>

        <h2>5. Pencabutan Berita</h2>
        <p>
          Berita yang sudah dipublikasikan tidak dapat dicabut karena alasan penyensoran dari pihak luar, kecuali terkait masalah SARA, kesusilaan, masa depan anak, pertimbangan keselamatan korban tertentu, atau atas dasar rekomendasi putusan Dewan Pers.
        </p>

        <h2>6. Hak Cipta dan Praktik Agregasi</h2>
        <p>
          Catatan Negeri menghormati hak cipta intelektual. Setiap pengutipan karya jurnalistik media lain wajib menyebutkan sumber secara jelas dan menyertakan tautan aktif (hyperlink) menuju berita asal.
        </p>
      </article>
    </main>
  );
}


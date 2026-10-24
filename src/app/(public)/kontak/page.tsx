import React from "react";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ContactForm } from "@/components/public/ContactForm";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Kontak Redaksi & Manajemen — Catatan Negeri",
  description: "Alamat kantor redaksi, surel siaran pers, nomor kontak layanan pengiklan, dan formulir pengaduan pembaca Catatan Negeri.",
  alternates: {
    canonical: `${SITE_URL}/kontak`,
  },
};

export default async function KontakPage() {
  const emailSetting = await db.siteSetting.findUnique({ where: { key: "contact_email" } });
  const phoneSetting = await db.siteSetting.findUnique({ where: { key: "contact_phone" } });
  const addressSetting = await db.siteSetting.findUnique({ where: { key: "office_address" } });

  const contactEmail = emailSetting?.value || "redaksi@catatannegeri.com";
  const contactPhone = phoneSetting?.value || "+62 21 5550 1234";
  const officeAddress = addressSetting?.value || "Gedung Pers, Jl. Kebon Sirih No. 45, Jakarta Pusat, DKI Jakarta 10110";

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ name: "Kontak", url: "/kontak" }]} />

      <header className="border-b-2 border-brand-navy pb-4 mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
          Hubungi Kami
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-navy mt-1 mb-2">
          Kontak Redaksi & Layanan Pembaca
        </h1>
        <p className="text-sm text-slate-600">
          Kami siap menerima masukan, siaran pers resmi, hak jawab, dan kerja sama kemitraan.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Info Cards (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-brand-navy border-b border-slate-200 pb-2">
              Kantor Pusat
            </h3>

            <div className="flex items-start gap-3 text-xs text-slate-700">
              <MapPin className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 mb-0.5">Alamat Redaksi:</p>
                <p className="leading-relaxed">{officeAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-700">
              <Phone className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 mb-0.5">Telepon Redaksi:</p>
                <p>{contactPhone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-700">
              <Mail className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 mb-0.5">Surat Elektronik (Surel):</p>
                <p>Redaksi / Siaran Pers: <a href={`mailto:${contactEmail}`} className="text-brand-red hover:underline">{contactEmail}</a></p>
                <p>Iklan & Kerja Sama: <a href="mailto:iklan@catatannegeri.com" className="text-brand-red hover:underline">iklan@catatannegeri.com</a></p>
              </div>
            </div>
          </div>

          <div className="bg-brand-navy text-white rounded-xl p-6 text-xs space-y-2">
            <h4 className="font-serif font-bold text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-red-light" />
              Kirim Siaran Pers Resmi
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Kementerian, lembaga negara, pemerintah daerah, BUMN, dan korporasi swasta dapat mengirimkan rilis resmi ke <strong className="text-white">redaksi@catatannegeri.com</strong> untuk diverifikasi oleh tim desk terkait.
            </p>
          </div>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <h3 className="font-serif font-bold text-xl text-brand-navy mb-4">
            Formulir Pesan Redaksi
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Silakan kirimkan kritik, saran, pengaduan pemberitaan, atau penawaran kerja sama melalui formulir di bawah ini.
          </p>

          <ContactForm />
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://catatannegeri.com"),
  title: {
    default: "Catatan Negeri — Portal Berita & Informasi Digital Indonesia",
    template: "%s — Catatan Negeri",
  },
  description: "Portal berita dan informasi digital Indonesia terpercaya. Menyajikan jurnalisme berkualitas, investigasi, analisis ekonomi, politik, sains, teknologi, dan panduan publik teruji.",
  keywords: [
    "Catatan Negeri",
    "berita indonesia",
    "berita terkini",
    "kebijakan publik",
    "ekonomi indonesia",
    "jurnalisme independen",
    "portal berita nasional",
  ],
  authors: [{ name: "Redaksi Catatan Negeri", url: "https://catatannegeri.com" }],
  creator: "Catatan Negeri",
  publisher: "Catatan Negeri",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://catatannegeri.com",
    siteName: "Catatan Negeri",
    title: "Catatan Negeri — Portal Berita & Informasi Digital Indonesia",
    description: "Portal berita dan informasi digital Indonesia. Jernih, terpercaya, dan mencerdaskan bangsa.",
    images: [
      {
        url: "/brand/og-default.png",
        width: 1200,
        height: 630,
        alt: "Catatan Negeri Media Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@catatannegeri",
    creator: "@catatannegeri",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/brand/logo.png",
    shortcut: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = generateOrganizationSchema();
  const webSiteSchema = generateWebSiteSchema();

  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="font-sans antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}


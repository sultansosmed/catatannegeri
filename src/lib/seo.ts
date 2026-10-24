export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://catatannegeri.com";
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Catatan Negeri";
export const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE || "Portal Berita & Informasi Digital Indonesia";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/og-default.png`;
export const SITE_LOGO_URL = `${SITE_URL}/brand/logo.png`;

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  // Strip HTML tags for word count
  const cleanText = text.replace(/<[^>]*>/g, " ");
  const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes);
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: SITE_LOGO_URL,
      width: 600,
      height: 60,
    },
    publishingPrinciples: `${SITE_URL}/pedoman-media-siber`,
    correctionsPolicy: `${SITE_URL}/kebijakan-koreksi`,
    sameAs: [
      "https://twitter.com/catatannegeri",
      "https://facebook.com/catatannegeri",
      "https://instagram.com/catatannegeri",
      "https://youtube.com/@catatannegeri",
    ],
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export interface NewsArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrl?: string;
  categoryName: string;
}

export function generateNewsArticleSchema(article: NewsArticleSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url,
    },
    headline: article.title,
    description: article.description,
    image: article.imageUrl ? [article.imageUrl] : [DEFAULT_OG_IMAGE],
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    articleSection: article.categoryName,
    inLanguage: "id-ID",
    author: {
      "@type": "Person",
      name: article.authorName,
      url: article.authorUrl ? (article.authorUrl.startsWith("http") ? article.authorUrl : `${SITE_URL}${article.authorUrl}`) : SITE_URL,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO_URL,
      },
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".article-lead", "article p:first-of-type"],
    },
  };
}

export function generateFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generatePersonSchema(author: {
  name: string;
  slug: string;
  bio?: string | null;
  avatar?: string | null;
  title?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `${SITE_URL}/penulis/${author.slug}`,
    image: author.avatar || DEFAULT_OG_IMAGE,
    jobTitle: author.title || "Penulis Catatan Negeri",
    description: author.bio || undefined,
    worksFor: {
      "@type": "NewsMediaOrganization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

